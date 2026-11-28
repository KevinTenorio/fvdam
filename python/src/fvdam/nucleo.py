"""Núcleo FVDAM 2D (teoria de volumes finitos paramétrica, subvolumes quadrilaterais).

Tradução do núcleo TypeScript (src/app/Home: calcConsts, getElements/calcDB,
calcPhiTheta, calcStiffness, calcConc, homogenize), com a mesma formulação e a mesma
ordem de operações por subvolume. Muda a implementação:

- as contas por subvolume são vetorizadas (NumPy, um lote com todos os subvolumes);
- a rigidez global é montada esparsa (SciPy) e fatorada uma vez por problema
  (no plano e antiplano), servindo aos 4 + 2 casos de deformação média.

Convenção de eixos (a mesma do código antigo): a célula está no plano x2–x3 e x1 é a
direção contínua. Em notação de Voigt, a ordem é [11, 22, 33, 23, 13, 12].
"""

from __future__ import annotations

import time
from dataclasses import dataclass

import numpy as np
import scipy.sparse as sp
import scipy.sparse.linalg as spla

from .malha import Malha

# ------------------------------------------------------------------ constantes (calcConsts)


def _blocos(*linhas):
    return np.block([list(l) for l in linhas])


def _constantes():
    A1 = np.array([[1, 0, 3, 0], [0, 1, 0, 0]], float)
    A2 = np.array([[1, 0, -3, 0], [0, 1, 0, 0]], float)
    A3 = np.array([[1, 0, 0, 0], [0, 1, 0, 3]], float)
    A4 = np.array([[1, 0, 0, 0], [0, 1, 0, -3]], float)
    z24 = np.zeros((2, 4))
    AIn = _blocos(
        (A4, z24), (z24, A4), (A1, z24), (z24, A1), (A3, z24), (z24, A3), (A2, z24), (z24, A2)
    )  # 16 x 8

    e = np.array([[1, 0, 0, 0], [0, 0, 0, 1], [0, 1, 1, 0]], float)
    EIn = np.kron(np.eye(4), e)  # 12 x 16

    v1, v2, v3, v4 = (np.eye(4)[k : k + 1] for k in range(4))
    MIn = _blocos((v3, v3), (v1, v1), (v4, v4), (v2, v2))  # 4 x 8
    s = (v3 + v4).T
    z41 = np.zeros((4, 1))
    NIn = _blocos((s, z41), (z41, s))  # 8 x 2
    PIn = 0.5 * _blocos(
        (v3, -v3), (-v1, v1), (v3, v3), (v1, v1), (v4, -v4), (-v2, v2), (v4, v4), (v2, v2)
    )  # 8 x 8

    AOut = np.vstack([A4, A1, A3, A2])  # 8 x 4
    v1o, v2o = np.array([[1.0, 0.0]]), np.array([[0.0, 1.0]])
    MOut = _blocos((v2o, v2o), (v1o, v1o))  # 2 x 4
    NOut = np.array([[0.0], [0.0], [1.0], [1.0]])  # 4 x 1
    POut = 0.5 * _blocos((v2o, -v2o), (-v1o, v1o), (v2o, v2o), (v1o, v1o))  # 4 x 4
    return AIn, EIn, MIn, NIn, PIn, AOut, MOut, NOut, POut


_AIn, _EIn, _MIn, _NIn, _PIn, _AOut, _MOut, _NOut, _POut = _constantes()


# ------------------------------------------------------------------ material (getMaterials)


def rigidez_isotropica(E: float, nu: float) -> np.ndarray:
    """Matriz C 6x6 (Voigt, cisalhamento de engenharia), como buildMaterialMatrices."""
    C = np.array(
        [
            [1 - nu, nu, nu, 0, 0, 0],
            [nu, 1 - nu, nu, 0, 0, 0],
            [nu, nu, 1 - nu, 0, 0, 0],
            [0, 0, 0, (1 - 2 * nu) / 2, 0, 0],
            [0, 0, 0, 0, (1 - 2 * nu) / 2, 0],
            [0, 0, 0, 0, 0, (1 - 2 * nu) / 2],
        ],
        float,
    )
    return E / ((1 + nu) * (1 - 2 * nu)) * C


# ------------------------------------------------------------------ resultado


@dataclass
class Resultado:
    C: np.ndarray  # C* 6x6
    propriedades: dict
    n_subvolumes: int
    n_faces: int
    tempo_s: float
    concentracao: np.ndarray  # (ne, 6, 6) matrizes de concentração por subvolume


def constantes_engenharia(C: np.ndarray) -> dict:
    """Mesmas fórmulas de handleEffectiveStiffness (Home.controller.tsx)."""
    S = np.linalg.inv(C)
    E11, E22, E33 = 1 / S[0, 0], 1 / S[1, 1], 1 / S[2, 2]
    return {
        "E11": E11,
        "E22": E22,
        "E33": E33,
        "v23": -S[2, 1] * E22,
        "v13": -S[2, 0] * E11,
        "v12": -S[1, 0] * E11,
        "G23": 1 / S[3, 3],
        "G13": 1 / S[4, 4],
        "G12": 1 / S[5, 5],
    }


# ------------------------------------------------------------------ núcleo


def _ultima_ocorrencia(LM: np.ndarray) -> np.ndarray:
    """Máscara (ne, k): True na última posição de cada índice repetido dentro da linha."""
    ne, k = LM.shape
    manter = np.ones((ne, k), dtype=bool)
    for a in range(k):
        for b in range(a + 1, k):
            manter[:, a] &= LM[:, a] != LM[:, b]
    return manter


def _montar_matriz(LM, Ke, n, manter):
    ne, k = LM.shape
    linhas = np.broadcast_to(LM[:, :, None], (ne, k, k))
    colunas = np.broadcast_to(LM[:, None, :], (ne, k, k))
    m = manter[:, :, None] & manter[:, None, :]
    return sp.coo_matrix((Ke[m], (linhas[m], colunas[m])), shape=(n, n)).tocsc()


def _montar_vetor(LM, fe, n, manter):
    """fe: (ne, k, ncasos) -> (n, ncasos)."""
    out = np.zeros((n, fe.shape[2]))
    for c in range(fe.shape[2]):
        np.add.at(out[:, c], LM[manter], fe[:, :, c][manter])
    return out


def homogeneizar(malha: Malha, faces_repetidas: str = "ts") -> Resultado:
    """Calcula C* da célula unitária.

    faces_repetidas:
        "ts"    — reproduz o código TypeScript: se um subvolume cita a mesma face duas
                  vezes (célula com um subvolume de largura e periodicidade), só a
                  última contribuição dele àquela face entra na montagem (a atribuição
                  com índices repetidos do mathjs sobrescreve em vez de somar).
        "somar" — soma todas as contribuições (montagem usual de elementos).
    """
    if faces_repetidas not in ("ts", "somar"):
        raise ValueError("faces_repetidas deve ser 'ts' ou 'somar'")
    t0 = time.perf_counter()

    ne = malha.n_subvolumes
    nf = malha.n_faces

    # ---- materiais por subvolume
    Cmat = np.array([rigidez_isotropica(m.E, m.nu) for m in malha.materiais])
    C = Cmat[malha.elem_material]  # (ne, 6, 6)

    # ---- geometria (calcDB): y com sinal trocado
    xy = malha.nos_xy[malha.elem_nos]  # (ne, 4, 2)
    x = xy[:, :, 0]
    y = -xy[:, :, 1]
    x1, x2, x3, x4 = x.T
    y1, y2, y3, y4 = y.T
    a1 = 0.25 * (-x1 + x2 + x3 - x4)
    a3 = 0.25 * (-x1 - x2 + x3 + x4)
    a4 = 0.25 * (-y1 + y2 + y3 - y4)
    a6 = 0.25 * (-y1 - y2 + y3 + y4)
    a7 = a1 * a6 - a3 * a4
    JInv = np.empty((ne, 2, 2))
    JInv[:, 0, 0] = a6 / a7
    JInv[:, 0, 1] = -a4 / a7
    JInv[:, 1, 0] = -a3 / a7
    JInv[:, 1, 1] = a1 / a7
    area = (x1 * y2 + x2 * y3 + x3 * y4 + x4 * y1 - (x1 * y4 + x4 * y3 + x3 * y2 + x2 * y1)) / 2

    xn = np.roll(x, -1, axis=1)  # x_{k+1}
    yn = np.roll(y, -1, axis=1)
    L = np.sqrt((xn - x) ** 2 + (yn - y) ** 2)
    nx = (yn - y) / L  # (ne, 4)
    ny = -(xn - x) / L

    # DIn (8x12), BIn (16x16), nIn (8x3); DOut (4x8), BOut (8x8), nOut (4x2)
    nk = np.zeros((ne, 4, 2, 3))
    nk[:, :, 0, 0] = nx
    nk[:, :, 0, 2] = ny
    nk[:, :, 1, 1] = ny
    nk[:, :, 1, 2] = nx
    DIn = np.zeros((ne, 8, 12))
    for k in range(4):
        DIn[:, 2 * k : 2 * k + 2, 3 * k : 3 * k + 3] = nk[:, k]
    nIn = nk.reshape(ne, 8, 3)
    BIn = np.zeros((ne, 16, 16))
    for k in range(8):
        BIn[:, 2 * k : 2 * k + 2, 2 * k : 2 * k + 2] = JInv
    DOut = np.zeros((ne, 4, 8))
    for k in range(4):
        DOut[:, k, 2 * k] = nx[:, k]
        DOut[:, k, 2 * k + 1] = ny[:, k]
    nOut = np.stack([nx, ny], axis=2)  # (ne, 4, 2)
    BOut = np.zeros((ne, 8, 8))
    for k in range(4):
        BOut[:, 2 * k : 2 * k + 2, 2 * k : 2 * k + 2] = JInv

    # ---- calcPhiTheta
    J22, J23, J32, J33 = JInv[:, 0, 0], JInv[:, 0, 1], JInv[:, 1, 0], JInv[:, 1, 1]
    C11, C12, C21, C22 = C[:, 1, 1], C[:, 1, 2], C[:, 2, 1], C[:, 2, 2]
    C33, C44, C55 = C[:, 3, 3], C[:, 4, 4], C[:, 5, 5]
    phiIn = np.empty((ne, 2, 2))
    phiIn[:, 0, 0] = C11 * (J22**2 + J23**2) + C44 * (J32**2 + J33**2)
    phiIn[:, 0, 1] = (C12 + C33) * (J22 * J32 + J23 * J33)
    phiIn[:, 1, 0] = phiIn[:, 0, 1]
    phiIn[:, 1, 1] = C22 * (J32**2 + J33**2) + C33 * (J22**2 + J23**2)
    thetaIn = np.empty((ne, 2, 4))
    thetaIn[:, 0, 0] = (C11 * J22**2 + C33 * J32**2) / 2
    thetaIn[:, 0, 1] = (C11 * J23**2 + C33 * J33**2) / 2
    thetaIn[:, 0, 2] = J22 * J32 * (C12 + C33) / 2
    thetaIn[:, 0, 3] = J23 * J33 * (C12 + C33) / 2
    thetaIn[:, 1, 0] = J22 * J32 * (C21 + C33) / 2
    thetaIn[:, 1, 1] = J23 * J33 * (C21 + C33) / 2
    thetaIn[:, 1, 2] = (C22 * J32**2 + C33 * J22**2) / 2
    thetaIn[:, 1, 3] = (C22 * J33**2 + C33 * J23**2) / 2
    phiOut = C55 * (J22**2 + J23**2) + C44 * (J32**2 + J33**2)
    thetaOut = np.empty((ne, 1, 2))
    thetaOut[:, 0, 0] = (C55 * J22**2 + C44 * J32**2) / 2
    thetaOut[:, 0, 1] = (C55 * J23**2 + C44 * J33**2) / 2

    # ---- matrizes do material (CIn 12x12, COut 8x8)
    CInRed = np.zeros((ne, 3, 3))
    CInRed[:, 0, 0], CInRed[:, 0, 1] = C[:, 1, 1], C[:, 1, 2]
    CInRed[:, 1, 0], CInRed[:, 1, 1] = C[:, 2, 1], C[:, 2, 2]
    CInRed[:, 2, 2] = C[:, 3, 3]
    CIn = np.zeros((ne, 12, 12))
    for k in range(4):
        CIn[:, 3 * k : 3 * k + 3, 3 * k : 3 * k + 3] = CInRed
    COut = np.zeros((ne, 8, 8))
    for k in range(4):
        COut[:, 2 * k, 2 * k] = C55
        COut[:, 2 * k + 1, 2 * k + 1] = C44

    # ---- calcLocal
    AbIn = DIn @ CIn @ _EIn @ BIn @ _AIn  # (ne, 8, 8)
    BbIn = _PIn - _NIn @ np.linalg.inv(phiIn) @ thetaIn @ _MIn  # (ne, 8, 8)
    KeIn = AbIn @ BbIn
    AbOut = DOut @ COut @ BOut @ _AOut  # (ne, 4, 4)
    BbOut = _POut - (_NOut @ thetaOut @ _MOut) / phiOut[:, None, None]
    KeOut = AbOut @ BbOut

    # ---- calcForces
    CAuxIn = np.zeros((ne, 3, 4))
    CAuxIn[:, 0, 0], CAuxIn[:, 0, 1], CAuxIn[:, 0, 2] = C[:, 0, 1], C[:, 1, 1], C[:, 1, 2]
    CAuxIn[:, 1, 0], CAuxIn[:, 1, 1], CAuxIn[:, 1, 2] = C[:, 0, 2], C[:, 1, 2], C[:, 2, 2]
    CAuxIn[:, 2, 3] = C[:, 3, 3]
    t0In = -nIn @ CAuxIn  # (ne, 8, 4)
    CAuxOut = np.zeros((ne, 2, 2))
    CAuxOut[:, 0, 0], CAuxOut[:, 1, 1] = C55, C44
    t0Out = -nOut @ CAuxOut  # (ne, 4, 2)

    # ---- graus de liberdade (calcDof) e mapas de montagem
    F = malha.elem_faces  # (ne, 4), base 0
    LMIn = np.stack([2 * F[:, k] + d for k in range(4) for d in (0, 1)], axis=1)  # (ne, 8)
    LMOut = F
    if faces_repetidas == "ts":
        manterIn, manterOut = _ultima_ocorrencia(LMIn), _ultima_ocorrencia(LMOut)
    else:
        manterIn = np.ones(LMIn.shape, bool)
        manterOut = np.ones(LMOut.shape, bool)

    r = malha.restricoes
    livresIn = np.flatnonzero(np.stack([r[:, 0] == 0, r[:, 1] == 0], axis=1).reshape(-1))
    livresOut = np.flatnonzero(r[:, 2] == 0)

    KgIn = _montar_matriz(LMIn, KeIn, 2 * nf, manterIn)
    KgOut = _montar_matriz(LMOut, KeOut, nf, manterOut)

    # ---- casos de deformação média (calcConc)
    epIn = np.array([[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 2]], float).T  # (4, 4) colunas
    epOut = np.array([[2, 0], [0, 2]], float).T

    fIn = _montar_vetor(LMIn, t0In @ epIn, 2 * nf, manterIn)[livresIn]  # (nlivres, 4)
    fOut = _montar_vetor(LMOut, t0Out @ epOut, nf, manterOut)[livresOut]  # (nlivres, 2)

    UIn = np.zeros((2 * nf, 4))
    UOut = np.zeros((nf, 2))
    UIn[livresIn] = spla.splu(KgIn[livresIn][:, livresIn]).solve(fIn)
    UOut[livresOut] = spla.splu(KgOut[livresOut][:, livresOut]).solve(fOut)

    uIn = UIn[LMIn]  # (ne, 8, 4): deslocamentos das faces do subvolume (zero nos presos)
    uOut = UOut[LMOut]  # (ne, 4, 2)
    W = BbIn @ uIn  # (ne, 8, 4)
    W2, W3 = W[:, 0:4], W[:, 4:8]
    W1 = BbOut @ uOut  # (ne, 4, 2)

    J = JInv
    Conc = np.zeros((ne, 6, 6))
    for m in range(4):
        ep = epIn[:, m]
        media = np.stack(
            [
                np.full(ne, ep[0]),
                ep[1] + J[:, 0, 0] * W2[:, 0, m] + J[:, 0, 1] * W2[:, 1, m],
                ep[2] + J[:, 1, 0] * W3[:, 0, m] + J[:, 1, 1] * W3[:, 1, m],
                ep[3]
                + J[:, 1, 0] * W2[:, 0, m]
                + J[:, 1, 1] * W2[:, 1, m]
                + J[:, 0, 0] * W3[:, 0, m]
                + J[:, 0, 1] * W3[:, 1, m],
            ],
            axis=1,
        )
        Conc[:, 0:4, m] = media / ep[m]
    for m in range(2):
        ep = epOut[:, m]
        Conc[:, 4, 4 + m] = (ep[0] + J[:, 0, 0] * W1[:, 0, m] + J[:, 0, 1] * W1[:, 1, m]) / ep[m]
        Conc[:, 5, 4 + m] = (ep[1] + J[:, 1, 0] * W1[:, 0, m] + J[:, 1, 1] * W1[:, 1, m]) / ep[m]

    # ---- homogenize: média ponderada pela área
    area_total = area.sum()
    Cstar = np.einsum("e,eij,ejk->ik", area / area_total, C, Conc)

    tempo = time.perf_counter() - t0
    return Resultado(
        C=Cstar,
        propriedades=constantes_engenharia(Cstar),
        n_subvolumes=ne,
        n_faces=nf,
        tempo_s=tempo,
        concentracao=Conc,
    )
