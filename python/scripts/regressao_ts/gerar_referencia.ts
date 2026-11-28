/**
 * Gera a referência de regressão rodando o núcleo FVDAM TypeScript original
 * (src/app/Home) sobre malhas (.json do gerador ou .fvt), sem a interface React.
 *
 * Reproduz o fluxo do app (Home.controller.tsx, ver nucleo_ts.ts):
 *   parseFile -> calcConsts -> calcDof -> calcStiffness -> calcConc -> homogenize
 * e as propriedades efetivas de handleEffectiveStiffness.
 *
 * Uso (na raiz do repositório, depois de `npm ci`):
 *   npx --yes tsx@4 python/scripts/regressao_ts/gerar_referencia.ts <saida_dir> <malha.json|malha.fvt> [...]
 *
 * Um .json (projeto do gerador de malhas) é convertido em .fvt por gerarFvt
 * (json_para_fvt.ts), como o app faz ao gerar o .fvt; um .fvt é lido direto.
 *
 * Para cada malha grava <saida_dir>/<nome>.json com C* (6x6), propriedades
 * efetivas, tamanho da malha e tempos (ms). O tempo de `tempo_fvdam_ms` mede o
 * mesmo trecho que o app mostra (fvdamAlg, sem a leitura do arquivo).
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { basename, resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import * as math from 'mathjs';

import { gerarFvt } from './json_para_fvt';
import { parseFile, fvdamAlg, effective, toArray } from './nucleo_ts';

function main() {
  const [outDir, ...files] = process.argv.slice(2);
  if (!outDir || files.length === 0) {
    console.error('uso: gerar_referencia.ts <saida_dir> <arquivo.fvt> [...]');
    process.exit(1);
  }
  mkdirSync(outDir, { recursive: true });

  for (const file of files) {
    const raw = readFileSync(file, 'utf8');
    const isJson = /\.json$/i.test(file);
    const text = isJson ? gerarFvt(JSON.parse(raw)) : raw;
    const t0 = performance.now();
    const { materials, elements, faces, nodes } = parseFile(text);
    const t1 = performance.now();
    const Ch = fvdamAlg(materials, elements, faces);
    const t2 = performance.now();

    const result = {
      arquivo: basename(file),
      fonte: isJson ? 'json (convertido por gerarFvt)' : 'fvt',
      sha256: createHash('sha256').update(raw).digest('hex'),
      gerado_por: 'nucleo TypeScript (src/app/Home) via gerar_referencia.ts',
      mathjs: math.version,
      node: process.version,
      n_nos: nodes.length,
      n_subvolumes: elements.length,
      n_faces: faces.length,
      materiais: materials.map((m: any) => ({
        id: m.id,
        label: m.label,
        E: m.young,
        nu: m.poisson,
        area: m.area
      })),
      tempo_leitura_ms: t1 - t0,
      tempo_fvdam_ms: t2 - t1,
      Ch: toArray(Ch),
      propriedades: effective(Ch)
    };
    const out = resolve(outDir, basename(file).replace(/\.(fvt|json)$/i, '') + '.json');
    writeFileSync(out, JSON.stringify(result, null, 2) + '\n');
    console.log(
      `${basename(file)}\t${elements.length} subvolumes\t${(t2 - t1).toFixed(0)} ms\t` +
        `E11=${result.propriedades.E11.toFixed(1)} E22=${result.propriedades.E22.toFixed(1)}`
    );
  }
}

main();
