// Worker do núcleo TypeScript (mathjs). Roda fora da thread da interface:
// a aba não trava em malhas grandes e a execução pode ser cancelada.
// Lê o mesmo texto .fvt que o núcleo Python, com as mesmas funções de antes.
import * as math from 'mathjs';
import getNodes from '../getNodes';
import getMaterials from '../getMaterials';
import getElements from '../getElements';
import getFaces from '../getFaces';
import calcConsts from '../calcConsts';
import calcDof from '../calcDof';
import calcStiffness from '../calcStiffness';
import calcConc from '../calcConc';
import homogenize from '../homogenize';
import { Node, NodesInfo, Material, IElement, Face } from '../Home.model';

function executar(texto: string) {
  const lines = texto.replaceAll('\r\n', '\n').replaceAll('\r', '\n').split('\n');
  const nodes: Node[] = [];
  const nodesInfo: NodesInfo = { nodesX: 0, nodesY: 0, minX: 0, maxX: 0, minY: 0, maxY: 0 };
  const materials: Material[] = [];
  const elements: IElement[] = [];
  const faces: Face[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    getNodes(nodes, nodesInfo, line, lines, i);
    getMaterials(materials, line, lines, i);
    getElements(elements, faces, nodes, materials, line, lines, i);
    getFaces(faces, line, lines, i);
  }
  if (materials.length === 0 || nodes.length === 0) throw new Error('Invalid file format.');

  const { AIn, EIn, MIn, NIn, PIn, AOut, MOut, NOut, POut } = calcConsts();
  const { dofAOut, dofAIn } = calcDof(faces);
  const { KgIn, KgOut } = calcStiffness(
    faces,
    elements,
    AIn,
    EIn,
    MIn,
    NIn,
    PIn,
    AOut,
    MOut,
    NOut,
    POut
  );
  calcConc(faces, elements, dofAIn, dofAOut, KgIn, KgOut);
  const Ch = homogenize(elements, materials);
  return (math.matrix(Ch as math.Matrix).toArray() as number[][]).map((row) => row.map(Number));
}

self.onmessage = (ev: MessageEvent) => {
  const { id, texto } = ev.data;
  const inicio = performance.now();
  try {
    const C = executar(texto);
    self.postMessage({ id, tipo: 'resultado', C, tempo_ms: performance.now() - inicio });
  } catch (erro) {
    self.postMessage({
      id,
      tipo: 'erro',
      erro: erro instanceof Error ? erro.message : String(erro)
    });
  }
};
