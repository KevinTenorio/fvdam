/**
 * Confere se um .fvt guardado é o mesmo que o app geraria a partir de um .json
 * do gerador de malhas.
 *
 * Para cada par (.fvt, .json) com o mesmo número de subvolumes:
 *   1. texto: gerarFvt(json) × .fvt, linha a linha (quebras de linha
 *      normalizadas). Também se compara uma versão "normalizada", que ignora
 *      as duas diferenças de formato conhecidas entre versões do gerador:
 *      rótulos de material com ou sem aspas e a linha final %END;
 *   2. estado: os dois textos passam por parseFile (o mesmo que o app usa ao
 *      importar) e o estado resultante é comparado campo a campo: nós,
 *      materiais (id, E, ν), subvolumes (nós, material, faces) e faces
 *      (nós, apoios, deformações). O rótulo do material fica de fora: ele não
 *      entra no cálculo e o parseFile corta o primeiro e o último caractere.
 *
 * Uso (na raiz do repositório):
 *   npx --yes tsx@4 python/scripts/regressao_ts/comparar_json_fvt.ts <saida.json> <arquivos .fvt e .json...>
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { basename } from 'node:path';

import { gerarFvt } from './json_para_fvt';
import { parseFile } from './nucleo_ts';

function estado(text: string) {
  const { nodes, materials, elements, faces } = parseFile(text);
  return {
    nodes: nodes.map((n: any) => [n.id, n.x, n.y]),
    materials: materials.map((m: any) => [m.id, m.young, m.poisson]),
    elements: elements.map((e: any) => [
      e.id,
      e.material.id,
      e.nodes.map((n: any) => n.id),
      e.faces.map((f: any) => f.id)
    ]),
    faces: faces.map((f: any) => [
      f.id,
      (f.nodes ?? []).map((n: any) => n.id),
      [...f.constraints],
      [...f.strain]
    ])
  };
}

// Primeira diferença entre dois estados, ou null se forem idênticos.
function primeiraDiferenca(a: any, b: any, caminho = ''): string | null {
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return `${caminho}: tamanho ${a.length} × ${b.length}`;
    for (let i = 0; i < a.length; i++) {
      const d = primeiraDiferenca(a[i], b[i], `${caminho}[${i}]`);
      if (d) return d;
    }
    return null;
  }
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
      const d = primeiraDiferenca(a[k], b[k], caminho ? `${caminho}.${k}` : k);
      if (d) return d;
    }
    return null;
  }
  return a === b ? null : `${caminho}: ${JSON.stringify(a)} × ${JSON.stringify(b)}`;
}

// Ignora só as diferenças de formato entre versões do gerador.
function normalizar(text: string): string[] {
  const lines = text.replaceAll('\r\n', '\n').replace(/\n+$/, '').split('\n');
  const i = lines.findIndex((l) => l.trim() === '%MATERIAL.LABEL');
  if (i >= 0) {
    const n = Number(lines[i + 1]);
    for (let k = i + 2; k < i + 2 + n; k++) lines[k] = lines[k].replace(/\t'(.*)'$/, '\t$1');
  }
  while (lines.length && (lines[lines.length - 1].trim() === '%END' || lines[lines.length - 1].trim() === '')) lines.pop();
  return lines;
}

function primeiraLinhaDiferente(a: string[], b: string[]): string | null {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i] !== b[i]) return `linha ${i + 1}: ${JSON.stringify(a[i])} × ${JSON.stringify(b[i])}`;
  }
  return null;
}

function nSubvolumes(text: string): number {
  const lines = text.replaceAll('\r\n', '\n').split('\n');
  const i = lines.findIndex((l) => l.trim() === '%ELEMENT');
  return i >= 0 ? Number(lines[i + 1]) : -1;
}

function main() {
  const [out, ...files] = process.argv.slice(2);
  const fvts = files.filter((f) => /\.fvt$/i.test(f)).map((f) => {
    const text = readFileSync(f, 'utf8').replaceAll('\r\n', '\n');
    return { f, text, n: nSubvolumes(text) };
  });
  const jsons = files.filter((f) => /\.json$/i.test(f)).flatMap((f) => {
    const data = JSON.parse(readFileSync(f, 'utf8'));
    if (!data.elements?.length) return [];
    const text = gerarFvt(data);
    return [{ f, text, n: data.elements.length }];
  });

  const resultados: any[] = [];
  for (const v of fvts) {
    const candidatos = jsons.filter((j) => j.n === v.n);
    const ev = estado(v.text);
    for (const j of candidatos) {
      const textoIgual = v.text.replace(/\n+$/, '') === j.text.replace(/\n+$/, '');
      const difTexto = primeiraLinhaDiferente(normalizar(v.text), normalizar(j.text));
      let difEstado: string | null;
      try {
        difEstado = primeiraDiferenca(ev, estado(j.text));
      } catch (e: any) {
        difEstado = `erro ao ler o .fvt gerado do .json: ${e.message}`;
      }
      resultados.push({
        fvt: v.f,
        json: j.f,
        subvolumes: v.n,
        texto_identico: textoIgual,
        texto_identico_normalizado: difTexto === null,
        primeira_diferenca_texto: difTexto,
        estado_identico: difEstado === null,
        primeira_diferenca_estado: difEstado
      });
      console.log(
        `${basename(v.f)}\t${basename(j.f)}\t${v.n}\ttexto=${textoIgual ? 'igual' : difTexto === null ? 'igual exceto formato' : 'diferente'}\t` +
          `estado=${difEstado === null ? 'igual' : 'diferente: ' + difEstado}`
      );
    }
    if (candidatos.length === 0) {
      resultados.push({ fvt: v.f, json: null, subvolumes: v.n });
      console.log(`${basename(v.f)}\t(nenhum .json com ${v.n} subvolumes)`);
    }
  }
  writeFileSync(out, JSON.stringify(resultados, null, 2) + '\n');
}

main();
