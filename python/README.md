# fvdam (Python)

Python implementation of the 2D Finite-Volume Direct Averaging Micromechanics (FVDAM) homogenization, using sparse linear algebra (NumPy/SciPy).

The TypeScript app at the repository root remains the mesh generator (`.fvt`/`.json`) and serves as the regression reference for this code.

## Layout

| Folder | Content |
|---|---|
| `src/fvdam/` | 2D FVDAM core |
| `tests/` | Tests (`pytest`) |
| `casos/` | Inputs: meshes and case parameters |
| `casos/regressao/` | Dissertation meshes and TypeScript results used for regression |
| `scripts/` | Scripts that generate tables and figures |
| `resultados/` | Generated results |

## Setup

```bash
cd python
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -e ".[dev]"
pytest
```

## License

MIT — see `../LICENSE`.
