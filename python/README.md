# fvdam (Python)

Homogeneização FVDAM 2D (Finite-Volume Direct Averaging Micromechanics) de células unitárias com subvolumes quadrilaterais e número qualquer de fases, com álgebra esparsa (NumPy/SciPy).

É uma tradução do núcleo TypeScript da raiz do repositório (`src/app/Home`), com a mesma formulação. O app TypeScript continua sendo o gerador de malhas (`.json`/`.fvt`) e a referência de regressão.

## Uso

```bash
cd python
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -e ".[dev]"
pytest

python -m fvdam casos/regressao/malhas_json/nfrcm2019b_serrilhado.json
python -m fvdam minha_celula.fvt --saida resultado.json
```

Em Python:

```python
from fvdam.malha import ler
from fvdam.nucleo import homogeneizar

res = homogeneizar(ler("celula.json"))   # .json do gerador ou .fvt
res.C              # C* 6x6 (Voigt: 11, 22, 33, 23, 13, 12)
res.propriedades   # E11, E22, E33, v12, v13, v23, G12, G13, G23
```

**Eixos:** os mesmos do código antigo. A célula fica no plano x2–x3 e x1 é a direção contínua.

## Estrutura

| Caminho | Conteúdo |
|---|---|
| `src/fvdam/malha.py` | Leitura de `.fvt` (como o `parseFile` do app) e de `.json` do gerador (`gerar_fvt`, tradução de `generateFvtFile`) |
| `src/fvdam/nucleo.py` | Núcleo: geometria, matrizes locais, montagem esparsa, 6 casos de deformação, concentração, C* e constantes de engenharia |
| `tests/test_regressao.py` | C* e propriedades contra o núcleo TypeScript (38 malhas) e `.fvt` gerado byte a byte igual ao do gerador TS (35 `.json`) |
| `tests/test_nucleo.py` | Testes independentes do TS: material homogêneo, limites de Voigt e Reuss, constantes de material isotrópico |
| `casos/regressao/` | Malhas e referência do núcleo TS (ver o README dali) |
| `scripts/regressao_ts/` | Scripts que geram a referência com o núcleo TS |
| `scripts/benchmark.py` | Tempo Python × TypeScript; grava `resultados/benchmark.csv` |

## Regressão e tempo

Nas 38 malhas de regressão, a maior diferença relativa em C* contra o TypeScript é da ordem de 1e-13 (critério: 1e-6). Com 1600 subvolumes, o núcleo Python leva menos de 0,1 s, contra 12 a 33 min do TypeScript (aceleração de 10⁴ vezes). Tabela completa: `python scripts/benchmark.py`.

O tempo do Python inclui a geometria dos subvolumes; o do TypeScript não (lá ela é feita na leitura do arquivo). A comparação favorece o TypeScript.

## Licença

MIT — ver `../LICENSE`.
