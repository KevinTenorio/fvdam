"""Ponto de entrada para rodar o núcleo fora do disco (ex.: no navegador, via Pyodide).

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
    """Homogeneíza uma célula dada como texto de `.fvt` ou de `.json` do gerador.

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
