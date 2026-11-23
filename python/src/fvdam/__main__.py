"""Uso: python -m fvdam <malha.json|malha.fvt> [--saida resultado.json] [--faces-repetidas ts|somar]"""

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
            + "\n",
            encoding="utf-8",
        )


if __name__ == "__main__":
    main()
