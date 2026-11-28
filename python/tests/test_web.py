"""Ponto de entrada por texto (usado pelo app no navegador)."""

import json
from pathlib import Path

import numpy as np
import pytest

from fvdam.malha import ler
from fvdam.nucleo import homogeneizar
from fvdam.web import homogeneizar_texto

REG = Path(__file__).resolve().parents[1] / "casos" / "regressao"


@pytest.mark.parametrize("nome", ["alvenaria_1.json", "nfrcm2019b_quadrado.json"])
def test_texto_json_igual_ao_arquivo(nome):
    caminho = REG / "malhas_json" / nome
    out = homogeneizar_texto(caminho.read_text(encoding="utf-8"), formato="json")
    ref = homogeneizar(ler(caminho))
    np.testing.assert_array_equal(np.array(out["C"]), ref.C)
    assert out["n_subvolumes"] == ref.n_subvolumes


def test_texto_fvt_e_serializavel():
    caminho = REG / "malhas_fvt" / "matriz_fibra_orig.fvt"
    out = homogeneizar_texto(caminho.read_text(encoding="utf-8"), formato="fvt")
    json.dumps(out)  # só tipos simples
    assert set(out["propriedades"]) == {"E11", "E22", "E33", "v12", "v13", "v23", "G12", "G13", "G23"}
    np.testing.assert_array_equal(np.array(out["C"]), homogeneizar(ler(caminho)).C)


def test_formato_invalido():
    with pytest.raises(ValueError):
        homogeneizar_texto("", formato="xml")
