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

// 'preparar': só carrega o runtime (o app manda ao abrir); 'executar': roda o núcleo
type Pedido =
  | { id: number; tipo: 'preparar' }
  | { id: number; tipo: 'executar'; texto: string; formato: 'fvt' | 'json' };

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
let carregado = false;
let tempoCargaMs = 0;
let cargaInformada = false; // o tempo de carga sai só no primeiro resultado

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

// Começa a carga uma única vez; pedidos que chegam durante a carga esperam a mesma promessa.
function iniciarCarga() {
  if (pronto === null) {
    const t0 = performance.now();
    pronto = carregar()
      .then((r) => {
        carregado = true;
        tempoCargaMs = performance.now() - t0;
        return r;
      })
      .catch((erro) => {
        pronto = null; // permite tentar de novo (ex.: sem internet ao abrir o app)
        throw new Error(
          `Could not load Python (Pyodide ${PYODIDE_VERSION}) from ${PYODIDE_URL}. ` +
            `Check the internet connection or use the TypeScript core. Details: ${erro}`
        );
      });
  }
  return pronto;
}

const mensagem = (erro: unknown) => (erro instanceof Error ? erro.message : String(erro));

ctx.onmessage = async (ev) => {
  const pedido = ev.data;
  const { id } = pedido;

  if (pedido.tipo === 'preparar') {
    try {
      await iniciarCarga();
      ctx.postMessage({ id, tipo: 'pronto', tempo_carga_ms: tempoCargaMs });
    } catch (erro) {
      ctx.postMessage({ id, tipo: 'erro', erro: mensagem(erro) });
    }
    return;
  }

  try {
    if (!carregado) ctx.postMessage({ id, tipo: 'etapa', etapa: 'carregando' });
    const { web } = await iniciarCarga();

    ctx.postMessage({ id, tipo: 'etapa', etapa: 'executando' });
    const t1 = performance.now();
    const proxy: PyProxy = web.homogeneizar_texto(pedido.texto, pedido.formato);
    const resultado = proxy.toJs({ dict_converter: Object.fromEntries });
    proxy.destroy();
    ctx.postMessage({
      id,
      tipo: 'resultado',
      resultado: {
        ...resultado,
        tempo_total_ms: performance.now() - t1,
        tempo_carga_ms: cargaInformada ? 0 : tempoCargaMs,
        pyodide: PYODIDE_VERSION
      }
    });
    cargaInformada = true;
  } catch (erro) {
    ctx.postMessage({ id, tipo: 'erro', erro: mensagem(erro) });
  }
};
