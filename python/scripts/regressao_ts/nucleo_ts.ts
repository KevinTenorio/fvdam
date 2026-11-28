/**
 * Núcleo FVDAM TypeScript original (src/app/Home) sem a interface React:
 * cópias literais de parseFile e fvdamAlg (Home.controller.tsx) e as fórmulas
 * de handleEffectiveStiffness. Usado por gerar_referencia.ts e
 * comparar_json_fvt.ts.
 */
import * as math from 'mathjs';

import getNodes from '../../../src/app/Home/getNodes';
import getMaterials from '../../../src/app/Home/getMaterials';
import getElements from '../../../src/app/Home/getElements';
import getFaces from '../../../src/app/Home/getFaces';
import calcConsts from '../../../src/app/Home/calcConsts';
import calcDof from '../../../src/app/Home/calcDof';
import calcStiffness from '../../../src/app/Home/calcStiffness';
import calcConc from '../../../src/app/Home/calcConc';
import homogenize from '../../../src/app/Home/homogenize';

// Cópia literal de parseFile (Home.controller.tsx), sem o estado React.
export function parseFile(fileStr: string) {
  const lines = fileStr.replaceAll('\r\n', '\n').replaceAll('\r', '\n').split('\n');
  const nodes: any[] = [];
  const nodesInfo = { nodesX: 0, nodesY: 0, minX: 0, maxX: 0, minY: 0, maxY: 0 };
  const materials: any[] = [];
  const elements: any[] = [];
  const faces: any[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    getNodes(nodes, nodesInfo, line, lines, i);
    getMaterials(materials, line, lines, i);
    getElements(elements, faces, nodes, materials, line, lines, i);
    getFaces(faces, line, lines, i);
  }
  if (materials.length === 0 || nodes.length === 0) {
    throw new Error('Invalid file format.');
  }
  return { nodes, nodesInfo, materials, elements, faces };
}

// Cópia literal de fvdamAlg.
export function fvdamAlg(materials: any[], elements: any[], faces: any[]) {
  const { AIn, EIn, MIn, NIn, PIn, AOut, MOut, NOut, POut } = calcConsts();
  const { dofAOut, dofAIn } = calcDof(faces);
  const { KgIn, KgOut } = calcStiffness(
    faces, elements, AIn, EIn, MIn, NIn, PIn, AOut, MOut, NOut, POut
  );
  calcConc(faces, elements, dofAIn, dofAOut, KgIn, KgOut);
  return homogenize(elements, materials);
}

// Mesmas fórmulas de handleEffectiveStiffness.
export function effective(Ch: any) {
  const S: any = math.inv(Ch);
  const E11 = 1 / S.get([0, 0]);
  const E22 = 1 / S.get([1, 1]);
  const E33 = 1 / S.get([2, 2]);
  return {
    E11,
    E22,
    E33,
    v23: -1 * S.get([2, 1]) * E22,
    v13: -1 * S.get([2, 0]) * E11,
    v12: -1 * S.get([1, 0]) * E11,
    G23: 1 / S.get([3, 3]),
    G13: 1 / S.get([4, 4]),
    G12: 1 / S.get([5, 5])
  };
}

export function toArray(M: any): number[][] {
  const dense = math.matrix(M, 'dense') as math.Matrix;
  return dense.toArray() as number[][];
}
