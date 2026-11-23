"""Compara o tempo do núcleo Python com o do núcleo TypeScript nas malhas de regressão.

Uso (de dentro de python/):
    python scripts/benchmark.py [--repeticoes 5]

Grava resultados/benchmark.csv e imprime uma tabela Markdown. O tempo do Python é o
menor de N repetições de `homogeneizar` (sem a leitura do arquivo); o do TypeScript é o
`tempo_fvdam_ms` registrado na referência (uma execução, Node 22).
"""

import argparse
import csv
import json
import platform
from pathlib import Path

import numpy as np
import scipy

from fvdam.malha import ler
from fvdam.nucleo import homogeneizar

RAIZ = Path(__file__).resolve().parents[1]
REG = RAIZ / "casos" / "regressao"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--repeticoes", type=int, default=5)
    args = ap.parse_args()

    linhas = []
    for ref in sorted((REG / "referencia_ts").glob("*.json")):
        d = json.loads(ref.read_text(encoding="utf-8"))
        entrada = REG / "malhas_json" / f"{ref.stem}.json"
        if not entrada.exists():
            entrada = REG / "malhas_fvt" / f"{ref.stem}.fvt"
        malha = ler(entrada)
        tempos = [homogeneizar(malha).tempo_s for _ in range(args.repeticoes)]
        t_py = min(tempos)
        t_ts = d["tempo_fvdam_ms"] / 1000
        linhas.append(
            {
                "malha": ref.stem,
                "subvolumes": d["n_subvolumes"],
                "faces": d["n_faces"],
                "tempo_ts_s": round(t_ts, 4),
                "tempo_py_s": round(t_py, 5),
                "aceleracao": round(t_ts / t_py, 1),
            }
        )
    linhas.sort(key=lambda r: (r["subvolumes"], r["malha"]))

    saida = RAIZ / "resultados" / "benchmark.csv"
    with saida.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(linhas[0]))
        w.writeheader()
        w.writerows(linhas)

    print(f"Python {platform.python_version()}, NumPy {np.__version__}, SciPy {scipy.__version__}, {platform.machine()}")
    print("| Malha | Subvolumes | TypeScript (s) | Python (s) | Aceleração |")
    print("|---|---:|---:|---:|---:|")
    for r in linhas:
        print(f"| `{r['malha']}` | {r['subvolumes']} | {r['tempo_ts_s']:.2f} | {r['tempo_py_s']:.4f} | {r['aceleracao']:.0f}× |")


if __name__ == "__main__":
    main()
