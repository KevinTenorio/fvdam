"""Testes de propriedades básicas do núcleo (independentes do código TypeScript)."""

import json
from pathlib import Path

import numpy as np
import pytest

from fvdam.malha import ler, ler_fvt_texto
from fvdam.nucleo import constantes_engenharia, homogeneizar, rigidez_isotropica

REG = Path(__file__).resolve().parents[1] / "casos" / "regressao"


def _homogeneo(E, nu):
    """Mesma malha de alvenaria, com os dois materiais iguais."""
    texto = (REG / "malhas_json" / "alvenaria_4.json").read_text(encoding="utf-8")
    dados = json.loads(texto)
    for m in dados["materials"]:
        m["young"], m["poisson"] = E, nu
    from fvdam.malha import gerar_fvt

    return ler_fvt_texto(gerar_fvt(dados))


def test_material_homogeneo_devolve_o_proprio_material():
    E, nu = 2000.0, 0.25
    res = homogeneizar(_homogeneo(E, nu))
    np.testing.assert_allclose(res.C, rigidez_isotropica(E, nu), rtol=1e-10, atol=1e-8)
    p = res.propriedades
    for k in ("E11", "E22", "E33"):
        assert p[k] == pytest.approx(E, rel=1e-10)
    for k in ("v12", "v13", "v23"):
        assert p[k] == pytest.approx(nu, rel=1e-10)
    for k in ("G12", "G13", "G23"):
        assert p[k] == pytest.approx(E / (2 * (1 + nu)), rel=1e-10)


def test_constantes_de_engenharia_de_material_isotropico():
    E, nu = 1000.0, 0.3
    p = constantes_engenharia(rigidez_isotropica(E, nu))
    assert p["E11"] == pytest.approx(E)
    assert p["v23"] == pytest.approx(nu)
    assert p["G12"] == pytest.approx(E / (2 * (1 + nu)))


def test_E11_entre_os_limites_de_voigt_e_reuss():
    res = homogeneizar(ler(REG / "malhas_json" / "matriz_fibra_8.json"))
    # matriz 52, fibra 100, ν = 0; fração de fibra pela área dos subvolumes
    malha = ler(REG / "malhas_json" / "matriz_fibra_8.json")
    xy = malha.nos_xy[malha.elem_nos]
    x, y = xy[:, :, 0], xy[:, :, 1]
    area = 0.5 * np.abs(np.sum(x * np.roll(y, -1, 1) - np.roll(x, -1, 1) * y, axis=1))
    E = np.array([m.E for m in malha.materiais])[malha.elem_material]
    f = area / area.sum()
    voigt = np.sum(f * E)
    reuss = 1 / np.sum(f / E)
    for k in ("E11", "E22", "E33"):
        assert reuss - 1e-9 <= res.propriedades[k] <= voigt + 1e-9


def test_faces_repetidas_somar_muda_so_a_celula_de_uma_coluna():
    j = REG / "malhas_json" / "frcm_alvenaria_2mm.json"  # 1 subvolume de largura
    a = homogeneizar(ler(j), faces_repetidas="ts").C
    b = homogeneizar(ler(j), faces_repetidas="somar").C
    assert not np.allclose(a, b)
    k = REG / "malhas_json" / "alvenaria_4.json"
    np.testing.assert_array_equal(
        homogeneizar(ler(k), faces_repetidas="ts").C, homogeneizar(ler(k), faces_repetidas="somar").C
    )
