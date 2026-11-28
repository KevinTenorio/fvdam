// Cliente do worker do gerador de malha. Um worker por geração; cancelar = encerrar o worker.
import { MeshInput, MeshOutput } from './meshAlgorithm';

let worker: Worker | null = null;
let rejeitarAtual: ((e: Error) => void) | null = null;

export class GeracaoCancelada extends Error {
  constructor() {
    super('Mesh generation cancelled.');
  }
}

export function gerarMalha(
  input: MeshInput
): Promise<{ mesh: MeshOutput | null; tempo_ms: number }> {
  cancelarGeracaoMalha();
  return new Promise((resolve, reject) => {
    const w = new Worker(new URL('./meshGenerator.worker.ts', import.meta.url), { type: 'module' });
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
      if (ev.data.tipo === 'resultado') resolve({ mesh: ev.data.mesh, tempo_ms: ev.data.tempo_ms });
      else reject(new Error(ev.data.erro));
    };
    w.onerror = (ev) => {
      encerrar();
      reject(new Error(`Mesh worker failed: ${ev.message || 'unknown error'}`));
    };
    // cópia profunda das regiões: o algoritmo divide o array no lugar
    w.postMessage({ id: 1, input: JSON.parse(JSON.stringify(input)) });
  });
}

export function cancelarGeracaoMalha() {
  if (worker) {
    worker.terminate();
    worker = null;
    rejeitarAtual?.(new GeracaoCancelada());
    rejeitarAtual = null;
  }
}
