"""Regressão contra o núcleo TypeScript.

Para cada resultado em casos/regressao/referencia_ts/, roda o núcleo Python na mesma
malha (.json do gerador ou, se não houver, .fvt) e compara C*.
"""

import hashlib
import json
from pathlib import Path

import numpy as np
import pytest

from fvdam.malha import gerar_fvt, ler
from fvdam.nucleo import homogeneizar

REG = Path(__file__).resolve().parents[1] / "casos" / "regressao"
REFS = sorted((REG / "referencia_ts").glob("*.json"))
TOL = 1e-6  # diferença relativa máxima em C*


def _entrada(nome: str) -> Path:
    j = REG / "malhas_json" / f"{nome}.json"
    return j if j.exists() else REG / "malhas_fvt" / f"{nome}.fvt"


@pytest.mark.parametrize("ref", REFS, ids=[r.stem for r in REFS])
def test_C_igual_ao_typescript(ref):
    dados = json.loads(ref.read_text(encoding="utf-8"))
    C_ts = np.array(dados["Ch"])
    res = homogeneizar(ler(_entrada(ref.stem)))
    assert res.n_subvolumes == dados["n_subvolumes"]
    assert res.n_faces == dados["n_faces"]
    erro = np.abs(res.C - C_ts).max() / np.abs(C_ts).max()
    assert erro < TOL, f"{ref.stem}: diferença relativa {erro:.2e}"


@pytest.mark.parametrize("ref", REFS, ids=[r.stem for r in REFS])
def test_propriedades_iguais_ao_typescript(ref):
    dados = json.loads(ref.read_text(encoding="utf-8"))
    res = homogeneizar(ler(_entrada(ref.stem)))
    for k, v in dados["propriedades"].items():
        assert res.propriedades[k] == pytest.approx(v, rel=TOL, abs=1e-9), k


def _hashes_ts():
    linhas = (REG / "fvt_gerado_ts.sha256").read_text().splitlines()
    return dict(reversed(l.split("  ", 1)) for l in linhas if l.strip())


@pytest.mark.parametrize("nome,h", sorted(_hashes_ts().items()))
def test_gerar_fvt_igual_ao_gerador_typescript(nome, h):
    """O .fvt gerado do .json é byte a byte o que o gerador TS produz."""
    j = REG / "malhas_json" / nome.replace(".fvt", ".json")
    texto = gerar_fvt(json.loads(j.read_text(encoding="utf-8")))
    assert hashlib.sha256(texto.encode("utf-8")).hexdigest() == h


def test_json_e_fvt_dao_o_mesmo_resultado():
    """Um .json e o .fvt gerado dele precisam dar exatamente o mesmo C*."""
    j = REG / "malhas_json" / "matriz_fibra_7.json"
    from fvdam.malha import ler_fvt_texto

    texto = gerar_fvt(json.loads(j.read_text(encoding="utf-8")))
    a = homogeneizar(ler(j)).C
    b = homogeneizar(ler_fvt_texto(texto)).C
    assert np.array_equal(a, b)
