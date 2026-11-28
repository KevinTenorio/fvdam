"""Monta a tabela-resumo da referência de regressão gerada pelo núcleo TypeScript.

Uso:
    python python/scripts/regressao_ts/resumir.py python/casos/regressao/referencia_ts

Imprime uma tabela Markdown (malha, subvolumes, tempo, propriedades efetivas),
ordenada pelo número de subvolumes.
"""

import json
import sys
from pathlib import Path


def main(ref_dir: str) -> None:
    rows = []
    for path in sorted(Path(ref_dir).glob("*.json")):
        d = json.loads(path.read_text(encoding="utf-8"))
        p = d["propriedades"]
        rows.append((d["n_subvolumes"], d["arquivo"], d["tempo_fvdam_ms"], p))
    rows.sort(key=lambda r: (r[0], r[1]))

    print("| Malha | Subvolumes | Tempo FVDAM (s) | E11 | E22 | E33 | ν12 | ν13 | ν23 | G12 | G13 | G23 |")
    print("|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|")
    for n, name, ms, p in rows:
        print(
            f"| `{name}` | {n} | {ms / 1000:.2f} | {p['E11']:.2f} | {p['E22']:.2f} | {p['E33']:.2f} "
            f"| {p['v12']:.4f} | {p['v13']:.4f} | {p['v23']:.4f} "
            f"| {p['G12']:.2f} | {p['G13']:.2f} | {p['G23']:.2f} |"
        )


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "python/casos/regressao/referencia_ts")
