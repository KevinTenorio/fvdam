"""Leitura de malhas FVDAM 2D: arquivos .fvt e projetos .json do gerador de malhas.

O leitor de .fvt reproduz o `parseFile` do app TypeScript (src/app/Home), inclusive
nos detalhes que afetam o resultado:

- a coordenada y é lida como está, e o sinal é trocado só na geometria (ver nucleo.py);
- o material do subvolume é procurado pelo id (cai no primeiro material se não achar),
  mas a área entra no material da posição `id - 1`;
- o número de faces é o maior id de face citado em %ELEMENT.C4.FACES;
- %LOAD.CASE.FACE.PRESCRIBED.DISPLACEMENT prende o grau de liberdade no plano indicado
  e também o grau antiplano da face; ...DISPLACEMENT.OUT prende só o grau indicado.

Um .json do gerador é convertido no texto .fvt por `gerar_fvt`, que é a tradução de
`generateFvtFile` (src/app/Home/MeshGenerator/MeshGenerator.controller.tsx).
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
    elem_material: np.ndarray  # (ne,) índice em `materiais` usado no cálculo
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
    return linha.replace(" ", "").split("\t")


def ler_fvt_texto(texto: str, origem: str = "") -> Malha:
    linhas = texto.replace("\r\n", "\n").replace("\r", "\n").split("\n")
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
        linha = bruta.replace("\r", "")
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
                rotulos.append(l[l.index("\t") + 2 : len(l) - 1] if "\t" in l else "")
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
    """Formata um número como o `toString()` do JavaScript."""
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
        lines.append(f"{i}\t{_js_num(node[0])}\t{_js_num(node[1])}\t0")

    lines += ["", "%MATERIAL", str(len(materials)), "", "%MATERIAL.LABEL", str(len(materials))]
    for i, m in enumerate(materials, start=1):
        lines.append(f"{i}\t'{m['label']}'")
    lines += ["", "%MATERIAL.ISOTROPIC", str(len(materials))]
    for i, m in enumerate(materials, start=1):
        lines.append(f"{i}\t{_js_num(m['young'])}\t{_js_num(m['poisson'])}")

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
        lines.append(f"{i}\t{numero}\t0\t3\t{el[0] + 1}\t{el[1] + 1}\t{el[2] + 1}\t{el[3] + 1}")

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
        lines.append(f"{i}\t" + "\t".join(ids))

    unicos = len({corrected[f] for f in supported})
    lines += ["", "%LOAD.CASE.PRESCRIBED.DISPLACEMENT", str(unicos * 2)]
    lines += ["", "%LOAD.CASE.FACE.PRESCRIBED.DISPLACEMENT", str(unicos * 2)]
    vistos: list[int] = []
    for i, face in enumerate(supported, start=1):
        cf = corrected[face] + 1
        if cf in vistos:
            continue
        vistos.append(cf)
        lines.append(f"{i * 2 - 1}\t{cf}\t1\t0")
        lines.append(f"{i * 2}\t{cf}\t2\t0")
    lines += ["", "%END"]
    return "\n".join(lines)


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
