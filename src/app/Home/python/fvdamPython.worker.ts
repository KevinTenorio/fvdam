// Web Worker que roda o núcleo FVDAM em Python no navegador, via Pyodide.
// O código Python vem do próprio repositório (python/src/fvdam), embutido no build,
// então o app e o pacote Python usam sempre a mesma versão do núcleo.

export const PYODIDE_VERSION = '314.0.8';
const PYODIDE_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;
const PASTA = '/home/pyodide';

const fontes = import.meta.glob('/python/src/fvdam/*.py', { as: 'raw', eager: true }) as Record<
  string,
  string
>;

interface Pedido {
  id: number;
  texto: string;
  formato: 'fvt' | 'json';
}

// tipos mínimos do Pyodide usados aqui
interface PyProxy {
  toJs: (opcoes: { dict_converter: (e: Iterable<[string, unknown]>) => unknown }) => any;
  destroy: () => void;
}
interface Pyodide {
  loadPackage: (nomes: string[]) => Promise<void>;
  runPython: (codigo: string) => unknown;
  pyimport: (nome: string) => any;
  FS: { mkdirTree: (p: string) => void; writeFile: (p: string, d: string) => void };
}

const ctx = self as unknown as {
  postMessage: (m: unknown) => void;
  onmessage: ((ev: MessageEvent<Pedido>) => void) | null;
};

let pronto: Promise<{ web: any }> | null = null;

async function carregar() {
  const { loadPyodide } = await import(/* @vite-ignore */ `${PYODIDE_URL}pyodide.mjs`);
  const py: Pyodide = await loadPyodide({ indexURL: PYODIDE_URL });
  await py.loadPackage(['numpy', 'scipy']);
  py.FS.mkdirTree(`${PASTA}/fvdam`);
  for (const [caminho, texto] of Object.entries(fontes)) {
    py.FS.writeFile(`${PASTA}/fvdam/${caminho.split('/').pop()}`, texto);
  }
  py.runPython(`import sys\nif "${PASTA}" not in sys.path: sys.path.insert(0, "${PASTA}")`);
  return { web: py.pyimport('fvdam.web') };
}

ctx.onmessage = async (ev) => {
  const { id, texto, formato } = ev.data;
  try {
    const primeira = pronto === null;
    const t0 = performance.now();
    if (pronto === null) {
      ctx.postMessage({ id, tipo: 'etapa', etapa: 'carregando' });
      pronto = carregar().catch((erro) => {
        pronto = null; // permite tentar de novo (ex.: sem internet na primeira vez)
        throw new Error(
          `Could not load Python (Pyodide ${PYODIDE_VERSION}) from ${PYODIDE_URL}. ` +
            `Check the internet connection or use the TypeScript core. Details: ${erro}`
        );
      });
    }
    const { web } = await pronto;
    const tempoCarga = primeira ? performance.now() - t0 : 0;

    ctx.postMessage({ id, tipo: 'etapa', etapa: 'executando' });
    const t1 = performance.now();
    const proxy: PyProxy = web.homogeneizar_texto(texto, formato);
    const resultado = proxy.toJs({ dict_converter: Object.fromEntries });
    proxy.destroy();
    ctx.postMessage({
      id,
      tipo: 'resultado',
      resultado: {
        ...resultado,
        tempo_total_ms: performance.now() - t1,
        tempo_carga_ms: tempoCarga,
        pyodide: PYODIDE_VERSION
      }
    });
  } catch (erro) {
    ctx.postMessage({ id, tipo: 'erro', erro: String(erro) });
  }
};
