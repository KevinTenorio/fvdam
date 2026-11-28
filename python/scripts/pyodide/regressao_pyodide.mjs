// Roda o núcleo Python dentro do Pyodide (Node) nas 38 malhas de regressão
// e compara C* com a referência do núcleo TypeScript.
// Uso (nesta pasta): npm install && node regressao_pyodide.mjs <pasta da distribuição do Pyodide>/ ../..
// A distribuição completa (com numpy e scipy) está nas releases do Pyodide no GitHub.
import { loadPyodide } from 'pyodide';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const [indexURL, raiz] = process.argv.slice(2);
const t0 = performance.now();
const py = await loadPyodide({ indexURL });
await py.loadPackage(['numpy', 'scipy']);
const tCarga = performance.now() - t0;

py.FS.mkdirTree('/home/pyodide/fvdam');
for (const f of readdirSync(join(raiz, 'src/fvdam'))) {
  if (f.endsWith('.py')) py.FS.writeFile(`/home/pyodide/fvdam/${f}`, readFileSync(join(raiz, 'src/fvdam', f), 'utf8'));
}
py.runPython('import sys; sys.path.insert(0, "/home/pyodide")');
const web = py.pyimport('fvdam.web');
console.log('versões', JSON.stringify(web.versoes().toJs({ dict_converter: Object.fromEntries })));
console.log(`carga do Pyodide + numpy + scipy: ${(tCarga / 1000).toFixed(1)} s`);

const reg = join(raiz, 'casos/regressao');
let pior = 0;
const linhas = [];
for (const ref of readdirSync(join(reg, 'referencia_ts')).sort()) {
  const nome = ref.replace(/\.json$/, '');
  const r = JSON.parse(readFileSync(join(reg, 'referencia_ts', ref), 'utf8'));
  const pj = join(reg, 'malhas_json', `${nome}.json`);
  const [texto, formato] = existsSync(pj)
    ? [readFileSync(pj, 'utf8'), 'json']
    : [readFileSync(join(reg, 'malhas_fvt', `${nome}.fvt`), 'utf8'), 'fvt'];
  const t = performance.now();
  const out = web.homogeneizar_texto(texto, formato).toJs({ dict_converter: Object.fromEntries });
  const tTotal = performance.now() - t;
  let num = 0, den = 0;
  for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) {
    num = Math.max(num, Math.abs(out.C[i][j] - r.Ch[i][j]));
    den = Math.max(den, Math.abs(r.Ch[i][j]));
  }
  const rel = num / den;
  pior = Math.max(pior, rel);
  linhas.push([nome, out.n_subvolumes, rel.toExponential(1), (out.tempo_s * 1000).toFixed(0), tTotal.toFixed(0), (r.tempo_fvdam_ms / 1000).toFixed(1)]);
}
console.log('malha\tsubvol\tdif_rel_C\tnucleo_ms\ttotal_ms\tts_s');
for (const l of linhas.sort((a, b) => a[1] - b[1])) console.log(l.join('\t'));
console.log(`\n${linhas.length} malhas; maior diferença relativa em C* = ${pior.toExponential(2)} (critério 1e-6): ${pior < 1e-6 ? 'OK' : 'FALHOU'}`);
process.exit(pior < 1e-6 ? 0 : 1);
