# Referência de regressão (núcleo TypeScript)

Resultados do núcleo FVDAM TypeScript original (`src/app/Home`, mathjs 11.8.0) em 38 malhas de células unitárias. São a "resposta esperada" dos testes do núcleo Python e a base para medir o ganho de tempo.

**A fonte de verdade das malhas são os projetos `.json` do gerador**, não os `.fvt`. Um `.json` guarda o estado completo do gerador (nós, faces, subvolumes, regiões, materiais, apoios). Ao carregar um `.json`, o app só copia esse estado; o `.fvt` é gerado dele por `generateFvtFile`. A conversão aqui (`json_para_fvt.ts`) é uma cópia literal dessa função.

| Pasta / arquivo | Conteúdo |
|---|---|
| `malhas_json/` | Projetos `.json` do gerador |
| `malhas_fvt/` | Três malhas que só existem em `.fvt` |
| `referencia_ts/` | Um JSON por malha: C* (6×6), propriedades efetivas, tamanho da malha, tempo e SHA-256 da entrada |

## Como regenerar

Na raiz do repositório:

```bash
npm ci
npx --yes tsx@4 python/scripts/regressao_ts/gerar_referencia.ts python/casos/regressao/referencia_ts python/casos/regressao/malhas_json/*.json python/casos/regressao/malhas_fvt/*.fvt
npx --yes tsx@4 python/scripts/regressao_ts/comparar_json_fvt.ts saida.json <arquivos .fvt> <arquivos .json>
python python/scripts/regressao_ts/resumir.py python/casos/regressao/referencia_ts
```

| Script | O que faz |
|---|---|
| `nucleo_ts.ts` | `parseFile` e `fvdamAlg` (cópias literais de `Home.controller.tsx`) e as fórmulas de `handleEffectiveStiffness` |
| `json_para_fvt.ts` | `gerarFvt`: cópia literal de `generateFvtFile` (`MeshGenerator.controller.tsx`) |
| `gerar_referencia.ts` | Roda o núcleo em `.json` (via `gerarFvt`) ou `.fvt` e grava os resultados |
| `comparar_json_fvt.ts` | Compara `.fvt` guardados com o `.fvt` gerado de cada `.json` |
| `resumir.py` | Tabela-resumo em Markdown |

`tempo_fvdam_ms` mede o mesmo trecho que o app mostra (sem a leitura do arquivo). Os tempos foram medidos em Node 22, numa máquina Linux de 2 núcleos, às vezes com duas execuções em paralelo; servem só para ordem de grandeza.

## Observações sobre as malhas

- `nfrcm2019b_serrilhado_etapa2.json` é `nfrcm2019b_serrilhado.json` com só o módulo da matriz trocado para E = 12208,665 MPa (segunda etapa de homogeneização).
- `convergencia_quadrado10.json` e `convergencia_quadrado15.json` têm a mesma malha de `convergencia_quadrado.json` e dão o mesmo resultado; ficam só como registro.

## Resultados

| Malha | Subvolumes | Tempo FVDAM (s) | E11 | E22 | E33 | ν12 | ν13 | ν23 | G12 | G13 | G23 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `frcm_alvenaria_2mm.json` | 7 | 0.01 | 4124.35 | 4126.32 | 3735.30 | 0.1601 | 0.1532 | 0.1597 | 1616.19 | 1777.60 | 1612.36 |
| `matriz_fibra_1.json` | 9 | 0.09 | 66.39 | 62.26 | 62.26 | 0.0000 | 0.0000 | 0.0017 | 31.23 | 31.23 | 30.47 |
| `matriz_fibra_2.json` | 9 | 0.04 | 66.39 | 62.33 | 62.33 | 0.0000 | 0.0000 | 0.0007 | 31.23 | 31.23 | 30.55 |
| `matriz_fibra_3.json` | 9 | 0.03 | 66.39 | 62.33 | 62.33 | 0.0000 | 0.0000 | 0.0007 | 31.23 | 31.23 | 30.55 |
| `matriz_fibra_4.json` | 9 | 0.03 | 66.39 | 62.33 | 62.33 | 0.0000 | 0.0000 | 0.0007 | 31.23 | 31.23 | 30.55 |
| `matriz_fibra_5.json` | 9 | 0.02 | 66.39 | 62.33 | 62.33 | 0.0000 | 0.0000 | 0.0007 | 31.23 | 31.23 | 30.55 |
| `matriz_fibra_6.json` | 9 | 0.02 | 66.39 | 62.33 | 62.33 | 0.0000 | 0.0000 | 0.0007 | 31.23 | 31.23 | 30.55 |
| `matriz_fibra_orig.fvt` | 9 | 0.01 | 66.40 | 62.26 | 62.26 | 0.0000 | 0.0000 | 0.0017 | 31.23 | 31.23 | 30.47 |
| `convergencia_quadrado.json` | 16 | 0.02 | 25903.16 | 11885.58 | 11885.58 | 0.2713 | 0.2713 | 0.3244 | 4447.43 | 4465.18 | 3944.21 |
| `convergencia_quadrado10.json` | 16 | 0.02 | 25903.16 | 11885.58 | 11885.58 | 0.2713 | 0.2713 | 0.3244 | 4447.43 | 4465.18 | 3944.21 |
| `convergencia_quadrado15.json` | 16 | 0.02 | 25903.16 | 11885.58 | 11885.58 | 0.2713 | 0.2713 | 0.3244 | 4447.43 | 4465.18 | 3944.21 |
| `alvenaria_1.json` | 25 | 0.07 | 3639.79 | 3582.68 | 3518.91 | 0.1587 | 0.1610 | 0.1634 | 1506.20 | 1543.95 | 1491.76 |
| `alvenaria_2.json` | 25 | 0.04 | 3639.82 | 3590.04 | 3527.28 | 0.1587 | 0.1610 | 0.1618 | 1508.76 | 1545.82 | 1494.41 |
| `alvenaria_3.json` | 25 | 0.06 | 3639.79 | 3584.70 | 3521.11 | 0.1587 | 0.1610 | 0.1629 | 1506.23 | 1544.50 | 1493.62 |
| `alvenaria_modelo2.json` | 25 | 0.05 | 3639.78 | 3582.72 | 3518.90 | 0.1587 | 0.1610 | 0.1634 | 1506.20 | 1543.95 | 1491.69 |
| `matriz_fibra_7.json` | 36 | 0.13 | 66.39 | 62.51 | 62.51 | 0.0000 | 0.0000 | 0.0045 | 31.43 | 31.43 | 30.81 |
| `nfrcm2019b_quadrado.json` | 36 | 0.10 | 12467.83 | 11950.24 | 6870.96 | 0.2000 | 0.2000 | 0.1671 | 3535.49 | 5036.60 | 3423.90 |
| `cilamce_alvenaria_nfrcm.json` | 45 | 0.19 | 9737.60 | 9737.60 | 5688.97 | 0.2031 | 0.2034 | 0.2034 | 2973.68 | 4046.90 | 3179.33 |
| `frcm_bloco_argamassa.json` | 48 | 0.12 | 4551.37 | 4492.10 | 4132.15 | 0.1643 | 0.1555 | 0.1544 | 1792.99 | 1922.03 | 1758.71 |
| `frcm_alvenaria_esse.json` | 60 | 0.40 | 4295.16 | 4295.16 | 2096.32 | 0.1703 | 0.1639 | 0.1639 | 1255.49 | 1835.12 | 1382.37 |
| `alvenaria_4.json` | 100 | 0.72 | 3639.91 | 3591.46 | 3533.96 | 0.1587 | 0.1608 | 0.1615 | 1513.23 | 1547.44 | 1499.12 |
| `frcm_alvenaria_1mm.json` | 102 | 0.66 | 4197.39 | 4197.39 | 3770.73 | 0.1608 | 0.1528 | 0.1528 | 1632.84 | 1808.02 | 1636.84 |
| `frcm_alvenaria_model_2.json` | 112 | 1.94 | 3429.50 | 3429.50 | 2024.01 | 0.1518 | 0.1543 | 0.1543 | 995.92 | 1488.71 | 987.37 |
| `frcm_alvenaria_model_3.json` | 112 | 1.76 | 4124.22 | 4124.22 | 2507.39 | 0.1601 | 0.1528 | 0.1528 | 1347.12 | 1777.60 | 1429.80 |
| `frcm_alvenaria_model_4.json` | 112 | 2.06 | 4124.22 | 4124.22 | 2507.39 | 0.1601 | 0.1528 | 0.1528 | 1347.12 | 1777.60 | 1429.80 |
| `cilamce_nfrcm_serrilhado.json` | 144 | 2.65 | 14285.65 | 14184.10 | 13040.97 | 0.2000 | 0.2000 | 0.1937 | 5577.15 | 5923.75 | 5412.31 |
| `frcm_alvenaria_model_1.json` | 144 | 2.28 | 25904.87 | 12322.47 | 12322.47 | 0.2706 | 0.2706 | 0.3068 | 4538.72 | 4538.72 | 3892.06 |
| `matriz_fibra_8.json` | 144 | 2.15 | 66.39 | 62.63 | 62.63 | 0.0000 | 0.0000 | 0.0049 | 31.50 | 31.50 | 30.85 |
| `cilamce_alvenaria.json` | 176 | 2.68 | 9360.80 | 8661.77 | 6993.49 | 0.2039 | 0.2102 | 0.2055 | 2722.69 | 3588.34 | 2623.29 |
| `convergencia_serrilhado.json` | 256 | 7.83 | 25430.43 | 11828.67 | 11895.10 | 0.2719 | 0.2713 | 0.3210 | 4452.91 | 4412.08 | 3867.42 |
| `alvenaria_5.json` | 400 | 32.85 | 3639.95 | 3593.20 | 3536.81 | 0.1587 | 0.1607 | 0.1613 | 1514.74 | 1548.71 | 1501.42 |
| `frcm_alvenaria_model_5.json` | 448 | 53.22 | 4124.22 | 4124.22 | 1753.15 | 0.1601 | 0.1528 | 0.1528 | 1111.95 | 1777.60 | 1250.83 |
| `nfrcm2019b_serrilhado.json` | 576 | 118.49 | 12470.02 | 11947.31 | 6736.27 | 0.2000 | 0.2000 | 0.1662 | 3495.80 | 5057.36 | 3457.31 |
| `nfrcm2019b_serrilhado_etapa2.json` | 576 | 114.71 | 11721.24 | 11260.57 | 6329.65 | 0.2000 | 0.2000 | 0.1675 | 3287.33 | 4760.77 | 3264.65 |
| `convergencia_model_1.fvt` | 1024 | 440.97 | 25905.29 | 12448.46 | 12448.46 | 0.2705 | 0.2705 | 0.3015 | 4566.21 | 4567.21 | 3891.27 |
| `alvenaria_reforcada_orig.fvt` | 1444 | 245.84 | 6984.37 | 6679.54 | 3385.93 | 0.2879 | 0.1845 | 0.1758 | 1336.48 | 2602.95 | 1286.65 |
| `alvenaria_6.json` | 1600 | 737.87 | 3640.20 | 3598.21 | 3553.41 | 0.1586 | 0.1602 | 0.1606 | 1524.72 | 1551.82 | 1512.38 |
| `alvenaria_7.json` | 1600 | 1955.38 | 3639.87 | 3587.25 | 3531.07 | 0.1588 | 0.1608 | 0.1620 | 1510.09 | 1545.55 | 1492.24 |
