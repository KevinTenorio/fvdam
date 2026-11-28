var h=`"""FVDAM 2D homogenization (Python port of the TypeScript core in ../src/app/Home)."""

__version__ = "0.1.0.dev0"
`,y=`"""Uso: python -m fvdam <malha.json|malha.fvt> [--saida resultado.json] [--faces-repetidas ts|somar]"""

import argparse
import json
from pathlib import Path

from .malha import ler
from .nucleo import homogeneizar


def main() -> None:
    ap = argparse.ArgumentParser(prog="fvdam", description="Homogeneização FVDAM 2D de uma célula unitária.")
    ap.add_argument("malha", type=Path, help="projeto do gerador (.json) ou arquivo .fvt")
    ap.add_argument("--saida", type=Path, help="grava C* e as propriedades em JSON")
    ap.add_argument("--faces-repetidas", choices=("ts", "somar"), default="ts")
    args = ap.parse_args()

    res = homogeneizar(ler(args.malha), faces_repetidas=args.faces_repetidas)
    print(f"{args.malha.name}: {res.n_subvolumes} subvolumes, {res.n_faces} faces, {res.tempo_s:.3f} s")
    for k, v in res.propriedades.items():
        print(f"  {k} = {v:.6g}")
    if args.saida:
        args.saida.write_text(
            json.dumps(
                {
                    "malha": str(args.malha),
                    "n_subvolumes": res.n_subvolumes,
                    "n_faces": res.n_faces,
                    "tempo_s": res.tempo_s,
                    "C": res.C.tolist(),
                    "propriedades": {k: float(v) for k, v in res.propriedades.items()},
                },
                indent=2,
            )
            + "\\n",
            encoding="utf-8",
        )


if __name__ == "__main__":
    main()
`,x=`"""Leitura de malhas FVDAM 2D: arquivos .fvt e projetos .json do gerador de malhas.

O leitor de .fvt reproduz o \`parseFile\` do app TypeScript (src/app/Home), inclusive
nos detalhes que afetam o resultado:

- a coordenada y é lida como está, e o sinal é trocado só na geometria (ver nucleo.py);
- o material do subvolume é procurado pelo id (cai no primeiro material se não achar),
  mas a área entra no material da posição \`id - 1\`;
- o número de faces é o maior id de face citado em %ELEMENT.C4.FACES;
- %LOAD.CASE.FACE.PRESCRIBED.DISPLACEMENT prende o grau de liberdade no plano indicado
  e também o grau antiplano da face; ...DISPLACEMENT.OUT prende só o grau indicado.

Um .json do gerador é convertido no texto .fvt por \`gerar_fvt\`, que é a tradução de
\`generateFvtFile\` (src/app/Home/MeshGenerator/MeshGenerator.controller.tsx).
"""

from __future__ import annotations

import json
import math
from dataclasses import dataclass, field
from pathlib import Path

import numpy as np


@dataclass
class Material:
    id: int
    E: float
    nu: float
    rotulo: str = ""
    area: float = 0.0


@dataclass
class Malha:
    """Malha lida, com índices base 0 nos arrays."""

    nos_id: np.ndarray  # (nn,) ids dos nós como no arquivo
    nos_xy: np.ndarray  # (nn, 2) coordenadas como no arquivo
    materiais: list[Material]
    elem_material: np.ndarray  # (ne,) índice em \`materiais\` usado no cálculo
    elem_nos: np.ndarray  # (ne, 4) índices em nos_xy
    elem_faces: np.ndarray  # (ne, 4) índices de face (base 0)
    n_faces: int
    restricoes: np.ndarray  # (n_faces, 3) 1 = preso: [u2, u3, u1 antiplano]
    origem: str = ""
    extras: dict = field(default_factory=dict)

    @property
    def n_subvolumes(self) -> int:
        return len(self.elem_nos)


# --------------------------------------------------------------------------- .fvt


def _num(s: str) -> float:
    """Como o Number() do JavaScript: texto vazio vira 0, texto inválido vira NaN."""
    s = s.strip()
    if s == "":
        return 0.0
    try:
        return float(s)
    except ValueError:
        return float("nan")


def _int(s: str) -> int:
    return int(_num(s))


def _campos(linha: str) -> list[str]:
    # Mesmo tratamento do app: tira espaços e separa por tabulação.
    return linha.replace(" ", "").split("\\t")


def ler_fvt_texto(texto: str, origem: str = "") -> Malha:
    linhas = texto.replace("\\r\\n", "\\n").replace("\\r", "\\n").split("\\n")
    nos_id: list[int] = []
    nos_xy: list[tuple[float, float]] = []
    materiais: list[Material] = []
    rotulos: list[str] = []
    elem_mat_id: list[int] = []
    elem_mat_pos: list[int] = []
    elem_nos_id: list[list[int]] = []
    faces_linhas: list[list[int]] = []
    desloc: list[tuple[int, int]] = []
    desloc_out: list[tuple[int, int]] = []

    for i, bruta in enumerate(linhas):
        linha = bruta.replace("\\r", "")
        if linha == "%NODE.COORD":
            n = int(linhas[i + 1])
            for j in range(n):
                c = _campos(linhas[i + 2 + j])
                nos_id.append(_int(c[0]))
                nos_xy.append((_num(c[1]), _num(c[2])))
        elif linha == "%MATERIAL.LABEL":
            n = int(linhas[i + 1])
            for j in range(n):
                l = linhas[i + 2 + j]
                # mesmo recorte do app: tira o primeiro e o último caractere depois do tab
                rotulos.append(l[l.index("\\t") + 2 : len(l) - 1] if "\\t" in l else "")
        elif linha == "%MATERIAL.ISOTROPIC":
            n = int(linhas[i + 1])
            for j in range(n):
                c = _campos(linhas[i + 2 + j])
                materiais.append(Material(id=_int(c[0]), E=_num(c[1]), nu=_num(c[2])))
        elif linha == "%ELEMENT.C4":
            n = int(linhas[i + 1])
            for j in range(n):
                c = _campos(linhas[i + 2 + j])
                elem_mat_id.append(_int(c[1]))
                elem_nos_id.append([_int(c[k]) for k in (4, 5, 6, 7)])
        elif linha == "%ELEMENT.C4.FACES":
            n = int(linhas[i + 1])
            for j in range(n):
                c = _campos(linhas[i + 2 + j])
                faces_linhas.append([_int(c[k]) for k in (1, 2, 3, 4)])
        elif linha == "%LOAD.CASE.FACE.PRESCRIBED.DISPLACEMENT":
            n = int(linhas[i + 1])
            for j in range(n):
                c = _campos(linhas[i + 2 + j])
                desloc.append((_int(c[1]), _int(c[2])))
        elif linha == "%LOAD.CASE.FACE.PRESCRIBED.DISPLACEMENT.OUT":
            n = int(linhas[i + 1])
            for j in range(n):
                c = _campos(linhas[i + 2 + j])
                desloc_out.append((_int(c[1]), _int(c[2])))

    if not materiais or not nos_id:
        raise ValueError("Formato de arquivo inválido: sem nós ou sem materiais.")
    for k, r in enumerate(rotulos[: len(materiais)]):
        materiais[k].rotulo = r

    # nós por id (o app usa o primeiro nó se o id não existir)
    pos_no = {}
    for k, nid in enumerate(nos_id):
        pos_no.setdefault(nid, k)
    elem_nos = np.array([[pos_no.get(nid, 0) for nid in ids] for ids in elem_nos_id], dtype=int)

    # material por id (cai no primeiro); área acumulada no material da posição id - 1
    pos_mat = {}
    for k, m in enumerate(materiais):
        pos_mat.setdefault(m.id, k)
    elem_material = np.array([pos_mat.get(mid, 0) for mid in elem_mat_id], dtype=int)
    for mid in elem_mat_id:
        elem_mat_pos.append(mid - 1)
        if not (0 <= mid - 1 < len(materiais)):
            raise ValueError(f"Subvolume com material {mid} inexistente (o app também falha).")

    n_faces = max(max(f) for f in faces_linhas)
    elem_faces = np.array(faces_linhas, dtype=int) - 1

    restricoes = np.zeros((n_faces, 3), dtype=int)
    # Um índice de grau de liberdade fora de 1..3 não prende nada no app (o JS grava numa
    # posição do array que ninguém lê). Acontece em matriz_fibra_orig.fvt: a linha
    # "1<tab>5<tab>1   0" vira "1<tab>5<tab>10" depois de tirar os espaços.
    ignorados = []
    for face, gl in desloc:
        if 1 <= gl <= 3:
            restricoes[face - 1, gl - 1] = 1
        else:
            ignorados.append((face, gl))
        restricoes[face - 1, 2] = 1
    for face, gl in desloc_out:
        if 1 <= gl <= 3:
            restricoes[face - 1, gl - 1] = 1
        else:
            ignorados.append((face, gl))

    malha = Malha(
        nos_id=np.array(nos_id, dtype=int),
        nos_xy=np.array(nos_xy, dtype=float),
        materiais=materiais,
        elem_material=elem_material,
        elem_nos=elem_nos,
        elem_faces=elem_faces,
        n_faces=n_faces,
        restricoes=restricoes,
        origem=origem,
    )
    malha.extras["elem_material_area"] = np.array(elem_mat_pos, dtype=int)
    if ignorados:
        malha.extras["restricoes_ignoradas"] = ignorados
    return malha


def ler_fvt(caminho: str | Path) -> Malha:
    p = Path(caminho)
    return ler_fvt_texto(p.read_text(encoding="utf-8"), origem=str(p))


# --------------------------------------------------------------------------- .json


def _js_num(x: float | int) -> str:
    """Formata um número como o \`toString()\` do JavaScript."""
    if isinstance(x, bool):
        raise TypeError("booleano inesperado")
    if isinstance(x, int):
        return str(x)
    if math.isnan(x):
        return "NaN"
    if math.isinf(x):
        return "Infinity" if x > 0 else "-Infinity"
    if x == int(x) and abs(x) < 1e21:
        return str(int(x))
    # Os dois usam a menor representação que volta ao mesmo double; muda só a notação.
    # O JS usa notação decimal para 1e-7 <= |x| < 1e21 e exponencial fora disso.
    if 1e-7 <= abs(x) < 1e21:
        return np.format_float_positional(x, unique=True, trim="-")
    mant, exp = repr(x).split("e")
    exp_i = int(exp)
    return f"{mant}e{'+' if exp_i > 0 else '-'}{abs(exp_i)}"


def gerar_fvt(dados: dict) -> str:
    """Tradução literal de generateFvtFile (MeshGenerator.controller.tsx)."""
    nodes = dados["nodes"]
    materials = dados["materials"]
    elements = dados["elements"]
    regions = dados["regions"]
    faces = dados["faces"]
    corrected = dados["correctedFacesIds"]
    supported = dados["supportedFaces"]

    lines: list[str] = []
    lines += ["", "%NODE", str(len(nodes)), "", "%NODE.COORD", str(len(nodes))]
    for i, node in enumerate(nodes, start=1):
        lines.append(f"{i}\\t{_js_num(node[0])}\\t{_js_num(node[1])}\\t0")

    lines += ["", "%MATERIAL", str(len(materials)), "", "%MATERIAL.LABEL", str(len(materials))]
    for i, m in enumerate(materials, start=1):
        lines.append(f"{i}\\t'{m['label']}'")
    lines += ["", "%MATERIAL.ISOTROPIC", str(len(materials))]
    for i, m in enumerate(materials, start=1):
        lines.append(f"{i}\\t{_js_num(m['young'])}\\t{_js_num(m['poisson'])}")

    lines += ["", "%ELEMENT", str(len(elements)), "", "%ELEMENT.C4", str(len(elements))]
    tol = 9 * 10.0 ** -9
    for i, el in enumerate(elements, start=1):
        cx = (nodes[el[0]][0] + nodes[el[1]][0] + nodes[el[2]][0] + nodes[el[3]][0]) / 4
        cy = (nodes[el[0]][1] + nodes[el[1]][1] + nodes[el[2]][1] + nodes[el[3]][1]) / 4
        region = next(
            (
                r
                for r in regions
                if cx >= r["x"] - tol
                and cx < r["x"] + r["width"]
                and cy >= r["y"] - tol
                and cy < r["y"] + r["height"]
            ),
            None,
        )
        mat_id = region["materialId"] if region is not None else None
        numero = next((k for k, m in enumerate(materials) if m["id"] == mat_id), -1) + 1
        lines.append(f"{i}\\t{numero}\\t0\\t3\\t{el[0] + 1}\\t{el[1] + 1}\\t{el[2] + 1}\\t{el[3] + 1}")

    def face_de(a: int, b: int) -> int:
        return next(
            (k for k, f in enumerate(faces) if (f[0] == a and f[1] == b) or (f[0] == b and f[1] == a)),
            -1,
        )

    lines += ["", "%ELEMENT.C4.FACES", str(len(elements))]
    for i, el in enumerate(elements, start=1):
        ids = []
        for a, b in ((el[0], el[1]), (el[1], el[2]), (el[2], el[3]), (el[3], el[0])):
            k = face_de(a, b)
            # correctedFacesIds[-1] é undefined no JS e vira NaN; não ocorre em malhas válidas
            ids.append(str(corrected[k] + 1) if k >= 0 else "NaN")
        lines.append(f"{i}\\t" + "\\t".join(ids))

    unicos = len({corrected[f] for f in supported})
    lines += ["", "%LOAD.CASE.PRESCRIBED.DISPLACEMENT", str(unicos * 2)]
    lines += ["", "%LOAD.CASE.FACE.PRESCRIBED.DISPLACEMENT", str(unicos * 2)]
    vistos: list[int] = []
    for i, face in enumerate(supported, start=1):
        cf = corrected[face] + 1
        if cf in vistos:
            continue
        vistos.append(cf)
        lines.append(f"{i * 2 - 1}\\t{cf}\\t1\\t0")
        lines.append(f"{i * 2}\\t{cf}\\t2\\t0")
    lines += ["", "%END"]
    return "\\n".join(lines)


def ler_json(caminho: str | Path) -> Malha:
    p = Path(caminho)
    dados = json.loads(p.read_text(encoding="utf-8"))
    malha = ler_fvt_texto(gerar_fvt(dados), origem=str(p))
    malha.extras["json"] = {k: dados.get(k) for k in ("unitCellWidth", "unitCellHeight", "supportType", "periodicity")}
    return malha


def ler(caminho: str | Path) -> Malha:
    """Lê .json (projeto do gerador) ou .fvt pela extensão."""
    p = Path(caminho)
    if p.suffix.lower() == ".json":
        return ler_json(p)
    if p.suffix.lower() == ".fvt":
        return ler_fvt(p)
    raise ValueError(f"Extensão não suportada: {p.suffix}")
`,g=`"""Núcleo FVDAM 2D (teoria de volumes finitos paramétrica, subvolumes quadrilaterais).

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
`,C=`"""Ponto de entrada para rodar o núcleo fora do disco (ex.: no navegador, via Pyodide).

Recebe a malha como texto e devolve só tipos simples (dict, list, float, int, str),
que atravessam a fronteira Python ↔ JavaScript sem conversão especial.
"""

from __future__ import annotations

import json
import platform
import sys

import numpy as np
import scipy

from . import __version__
from .malha import gerar_fvt, ler_fvt_texto
from .nucleo import homogeneizar


def homogeneizar_texto(texto: str, formato: str = "fvt", faces_repetidas: str = "ts") -> dict:
    """Homogeneíza uma célula dada como texto de \`.fvt\` ou de \`.json\` do gerador.

    Devolve um dict com C* (6×6, Voigt 11, 22, 33, 23, 13, 12), as constantes de
    engenharia, o tamanho da malha, o tempo do núcleo e as versões usadas.
    """
    if formato == "fvt":
        malha = ler_fvt_texto(texto)
    elif formato == "json":
        malha = ler_fvt_texto(gerar_fvt(json.loads(texto)))
    else:
        raise ValueError("formato deve ser 'fvt' ou 'json'")
    res = homogeneizar(malha, faces_repetidas=faces_repetidas)
    return {
        "C": res.C.tolist(),
        "propriedades": {k: float(v) for k, v in res.propriedades.items()},
        "n_subvolumes": int(res.n_subvolumes),
        "n_faces": int(res.n_faces),
        "tempo_s": float(res.tempo_s),
        "versoes": versoes(),
    }


def versoes() -> dict:
    return {
        "fvdam": __version__,
        "python": platform.python_version(),
        "numpy": np.__version__,
        "scipy": scipy.__version__,
        "plataforma": sys.platform,
    }
`;const m="314.0.8",i=`https://cdn.jsdelivr.net/pyodide/v${m}/full/`,r="/home/pyodide",I=Object.assign({"/python/src/fvdam/__init__.py":h,"/python/src/fvdam/__main__.py":y,"/python/src/fvdam/malha.py":x,"/python/src/fvdam/nucleo.py":g,"/python/src/fvdam/web.py":C}),o=self;let s=null,f=!1,l=0,d=!1;async function O(){const{loadPyodide:e}=await import(`${i}pyodide.mjs`),n=await e({indexURL:i});await n.loadPackage(["numpy","scipy"]),n.FS.mkdirTree(`${r}/fvdam`);for(const[a,t]of Object.entries(I))n.FS.writeFile(`${r}/fvdam/${a.split("/").pop()}`,t);return n.runPython(`import sys
if "${r}" not in sys.path: sys.path.insert(0, "${r}")`),{web:n.pyimport("fvdam.web")}}function c(){if(s===null){const e=performance.now();s=O().then(n=>(f=!0,l=performance.now()-e,n)).catch(n=>{throw s=null,new Error(`Could not load Python (Pyodide ${m}) from ${i}. Check the internet connection or use the TypeScript core. Details: ${n}`)})}return s}const u=e=>e instanceof Error?e.message:String(e);o.onmessage=async e=>{const n=e.data,{id:a}=n;if(n.tipo==="preparar"){try{await c(),o.postMessage({id:a,tipo:"pronto",tempo_carga_ms:l})}catch(t){o.postMessage({id:a,tipo:"erro",erro:u(t)})}return}try{f||o.postMessage({id:a,tipo:"etapa",etapa:"carregando"});const{web:t}=await c();o.postMessage({id:a,tipo:"etapa",etapa:"executando"});const _=performance.now(),p=t.homogeneizar_texto(n.texto,n.formato),v=p.toJs({dict_converter:Object.fromEntries});p.destroy(),o.postMessage({id:a,tipo:"resultado",resultado:{...v,tempo_total_ms:performance.now()-_,tempo_carga_ms:d?0:l,pyodide:m}}),d=!0}catch(t){o.postMessage({id:a,tipo:"erro",erro:u(t)})}};
