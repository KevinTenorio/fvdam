// Worker do gerador de malha: roda generateMeshData fora da thread da interface.
import { generateMeshData } from './meshAlgorithm';

self.onmessage = (ev: MessageEvent) => {
  const { id, input } = ev.data;
  const inicio = performance.now();
  try {
    const mesh = generateMeshData(input);
    self.postMessage({ id, tipo: 'resultado', mesh, tempo_ms: performance.now() - inicio });
  } catch (erro) {
    self.postMessage({
      id,
      tipo: 'erro',
      erro: erro instanceof Error ? erro.message : String(erro)
    });
  }
};
