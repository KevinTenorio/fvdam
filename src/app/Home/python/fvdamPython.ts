// Cliente do worker Python: um único worker por aba, reaproveitado entre execuções.
// O app chama prepararFvdamPython() ao abrir, então o Pyodide, o NumPy e o SciPy
// já estão baixando (ou prontos) quando o usuário executa.

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
  tempo_carga_ms: number; // carga do Pyodide (só no primeiro resultado; 0 nos seguintes)
  pyodide: string;
  versoes: Record<string, string>;
}

export type EtapaPython = 'carregando' | 'executando';

interface Pendente {
  resolve: (r: any) => void;
  reject: (e: Error) => void;
  onEtapa?: (etapa: EtapaPython) => void;
}

let worker: Worker | null = null;
let proximoId = 0;
let preparo: Promise<void> | null = null;
let runtimePronto = false;
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
      if (tipo === 'resultado' || tipo === 'pronto') runtimePronto = true;
      if (tipo === 'resultado') p.resolve(ev.data.resultado);
      else if (tipo === 'pronto') p.resolve(undefined);
      else p.reject(new Error(ev.data.erro));
    }
  };
  worker.onerror = (ev) => {
    const erro = new Error(`Python worker failed: ${ev.message || 'unknown error'}`);
    pendentes.forEach((p) => p.reject(erro));
    pendentes.clear();
    worker?.terminate();
    worker = null;
    preparo = null;
    runtimePronto = false;
  };
  return worker;
}

export function executarFvdamPython(
  texto: string,
  formato: 'fvt' | 'json' = 'fvt',
  onEtapa?: (etapa: EtapaPython) => void
): Promise<ResultadoPython> {
  const id = ++proximoId;
  // o worker fica ocupado enquanto inicia o Pyodide e só lê este pedido depois;
  // por isso o aviso de "ainda baixando" sai daqui, na hora do clique
  if (!runtimePronto) onEtapa?.('carregando');
  return new Promise((resolve, reject) => {
    pendentes.set(id, { resolve, reject, onEtapa });
    obterWorker().postMessage({ id, tipo: 'executar', texto, formato });
  });
}

// Baixa e inicia o runtime Python em segundo plano. Idempotente: chamadas seguintes
// devolvem a mesma promessa. Se falhar (ex.: sem internet), a próxima chamada ou a
// próxima execução tenta de novo.
export function prepararFvdamPython(): Promise<void> {
  if (!preparo) {
    const id = ++proximoId;
    preparo = new Promise<void>((resolve, reject) => {
      pendentes.set(id, { resolve, reject });
      obterWorker().postMessage({ id, tipo: 'preparar' });
    }).catch((erro) => {
      preparo = null;
      throw erro;
    });
  }
  return preparo;
}
