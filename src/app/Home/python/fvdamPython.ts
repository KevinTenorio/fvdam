// Cliente do worker Python: um único worker por aba, reaproveitado entre execuções
// (o Pyodide, o NumPy e o SciPy são carregados só na primeira vez).

export interface ResultadoPython {
  C: number[][];
  propriedades: Record<
    'E11' | 'E22' | 'E33' | 'v12' | 'v13' | 'v23' | 'G12' | 'G13' | 'G23',
    number
  >;
  n_subvolumes: number;
  n_faces: number;
  tempo_s: number; // só o núcleo (homogeneizar)
  tempo_total_ms: number; // leitura da malha + núcleo, dentro do worker
  tempo_carga_ms: number; // carga do Pyodide (0 depois da primeira execução)
  pyodide: string;
  versoes: Record<string, string>;
}

export type EtapaPython = 'carregando' | 'executando';

interface Pendente {
  resolve: (r: ResultadoPython) => void;
  reject: (e: Error) => void;
  onEtapa?: (etapa: EtapaPython) => void;
}

let worker: Worker | null = null;
let proximoId = 0;
const pendentes = new Map<number, Pendente>();

function obterWorker() {
  if (worker) return worker;
  worker = new Worker(new URL('./fvdamPython.worker.ts', import.meta.url), { type: 'module' });
  worker.onmessage = (ev) => {
    const { id, tipo } = ev.data;
    const p = pendentes.get(id);
    if (!p) return;
    if (tipo === 'etapa') {
      p.onEtapa?.(ev.data.etapa);
    } else {
      pendentes.delete(id);
      if (tipo === 'resultado') p.resolve(ev.data.resultado);
      else p.reject(new Error(ev.data.erro));
    }
  };
  worker.onerror = (ev) => {
    const erro = new Error(`Python worker failed: ${ev.message || 'unknown error'}`);
    pendentes.forEach((p) => p.reject(erro));
    pendentes.clear();
    worker?.terminate();
    worker = null;
  };
  return worker;
}

export function executarFvdamPython(
  texto: string,
  formato: 'fvt' | 'json' = 'fvt',
  onEtapa?: (etapa: EtapaPython) => void
): Promise<ResultadoPython> {
  const id = ++proximoId;
  return new Promise((resolve, reject) => {
    pendentes.set(id, { resolve, reject, onEtapa });
    obterWorker().postMessage({ id, texto, formato });
  });
}
