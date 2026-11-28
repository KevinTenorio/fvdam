// Cliente do worker TypeScript. Um worker por execução em curso; cancelar = encerrar o worker.
export interface ResultadoTs {
  C: number[][];
  tempo_ms: number;
}

let worker: Worker | null = null;
let rejeitarAtual: ((e: Error) => void) | null = null;

export class ExecucaoCancelada extends Error {
  constructor() {
    super('Execution cancelled.');
  }
}

export function executarFvdamTs(texto: string): Promise<ResultadoTs> {
  cancelarFvdamTs();
  return new Promise((resolve, reject) => {
    const w = new Worker(new URL('./fvdamTs.worker.ts', import.meta.url), { type: 'module' });
    worker = w;
    rejeitarAtual = reject;
    const encerrar = () => {
      w.terminate();
      if (worker === w) {
        worker = null;
        rejeitarAtual = null;
      }
    };
    w.onmessage = (ev) => {
      encerrar();
      if (ev.data.tipo === 'resultado') resolve({ C: ev.data.C, tempo_ms: ev.data.tempo_ms });
      else reject(new Error(ev.data.erro));
    };
    w.onerror = (ev) => {
      encerrar();
      reject(new Error(`TypeScript worker failed: ${ev.message || 'unknown error'}`));
    };
    w.postMessage({ id: 1, texto });
  });
}

export function cancelarFvdamTs() {
  if (worker) {
    worker.terminate();
    worker = null;
    rejeitarAtual?.(new ExecucaoCancelada());
    rejeitarAtual = null;
  }
}
