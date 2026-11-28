/**
 * Converte um projeto do gerador de malhas (.json) no texto .fvt que o app
 * entrega ao núcleo FVDAM.
 *
 * No app, carregar um .json só copia os campos para o estado do gerador
 * (MeshGenerator.controller.tsx, useEffect sobre meshData), sem regerar a malha;
 * o botão de gerar o .fvt chama generateFvtFile, que lê esse estado. Por isso
 * a conversão é uma função pura do .json.
 *
 * gerarFvt é uma cópia literal de generateFvtFile (MeshGenerator.controller.tsx,
 * commit 43586bf), trocando as variáveis de estado React pelos campos do .json.
 * Qualquer mudança lá precisa ser repetida aqui.
 */

export interface MeshData {
  nodes: number[][];
  faces: number[][];
  elements: number[][];
  supportedFaces: number[];
  elementsFaces: number[][];
  correctedFacesIds: number[];
  regions: { id: string; label: string; materialId: string; width: number; height: number; x: number; y: number }[];
  materials: { id: string; label: string; poisson: number; young: number; color: string }[];
  unitCellWidth: number | null;
  unitCellHeight: number | null;
  divisionsByRegion: number;
  supportType: string;
  periodicity: { horizontal: boolean; vertical: boolean };
}

export function gerarFvt(data: MeshData): string {
  const { nodes, materials, elements, regions, faces, correctedFacesIds, supportedFaces } = data;
  const lines: string[] = [];

  // Write nodes
  lines.push('');
  lines.push('%NODE');
  lines.push(nodes.length.toString());
  lines.push('');
  lines.push('%NODE.COORD');
  lines.push(nodes.length.toString());
  for (let i = 1; i < nodes.length + 1; i++) {
    const node = nodes[i - 1];
    lines.push(i.toString() + '\t' + node[0].toString() + '\t' + node[1].toString() + '\t' + '0');
  }

  // Write materials
  lines.push('');
  lines.push('%MATERIAL');
  lines.push(materials.length.toString());
  lines.push('');
  lines.push('%MATERIAL.LABEL');
  lines.push(materials.length.toString());
  for (let i = 1; i < materials.length + 1; i++) {
    const material = materials[i - 1];
    lines.push(i.toString() + '\t' + "'" + material.label + "'");
  }
  lines.push('');
  lines.push('%MATERIAL.ISOTROPIC');
  lines.push(materials.length.toString());
  for (let i = 1; i < materials.length + 1; i++) {
    const material = materials[i - 1];
    lines.push(i.toString() + '\t' + material.young.toString() + '\t' + material.poisson.toString());
  }

  // Write elements
  lines.push('');
  lines.push('%ELEMENT');
  lines.push(elements.length.toString());
  lines.push('');
  lines.push('%ELEMENT.C4');
  lines.push(elements.length.toString());
  for (let i = 1; i < elements.length + 1; i++) {
    const element = elements[i - 1];
    const elementCenter = [
      (nodes[element[0]][0] + nodes[element[1]][0] + nodes[element[2]][0] + nodes[element[3]][0]) / 4,
      (nodes[element[0]][1] + nodes[element[1]][1] + nodes[element[2]][1] + nodes[element[3]][1]) / 4
    ];
    const region = regions.find(
      (region) =>
        elementCenter[0] >= region.x - 9 * Math.pow(10, -9) &&
        elementCenter[0] < region.x + region.width &&
        elementCenter[1] >= region.y - 9 * Math.pow(10, -9) &&
        elementCenter[1] < region.y + region.height
    );
    const materialNumber = materials.findIndex((material) => material.id === region?.materialId) + 1;
    lines.push(
      i.toString() + '\t' + materialNumber + '\t' + '0' + '\t' + '3' + '\t' +
        (element[0] + 1).toString() + '\t' + (element[1] + 1).toString() + '\t' +
        (element[2] + 1).toString() + '\t' + (element[3] + 1).toString()
    );
  }

  // Write faces
  lines.push('');
  lines.push('%ELEMENT.C4.FACES');
  lines.push(elements.length.toString());
  for (let i = 1; i < elements.length + 1; i++) {
    const element = elements[i - 1];
    const face1 = faces.findIndex(
      (face) => (face[0] === element[0] && face[1] === element[1]) || (face[0] === element[1] && face[1] === element[0])
    );
    const correctedFace1 = correctedFacesIds[face1] + 1;
    const face2 = faces.findIndex(
      (face) => (face[0] === element[1] && face[1] === element[2]) || (face[0] === element[2] && face[1] === element[1])
    );
    const correctedFace2 = correctedFacesIds[face2] + 1;
    const face3 = faces.findIndex(
      (face) => (face[0] === element[2] && face[1] === element[3]) || (face[0] === element[3] && face[1] === element[2])
    );
    const correctedFace3 = correctedFacesIds[face3] + 1;
    const face4 = faces.findIndex(
      (face) => (face[0] === element[3] && face[1] === element[0]) || (face[0] === element[0] && face[1] === element[3])
    );
    const correctedFace4 = correctedFacesIds[face4] + 1;
    lines.push(
      i.toString() + '\t' + correctedFace1.toString() + '\t' + correctedFace2.toString() + '\t' +
        correctedFace3.toString() + '\t' + correctedFace4.toString()
    );
  }

  // Write faces supports
  lines.push('');
  lines.push('%LOAD.CASE.PRESCRIBED.DISPLACEMENT');
  lines.push(([...new Set(supportedFaces.map((face) => correctedFacesIds[face]))].length * 2).toString());
  lines.push('');
  lines.push('%LOAD.CASE.FACE.PRESCRIBED.DISPLACEMENT');
  lines.push(([...new Set(supportedFaces.map((face) => correctedFacesIds[face]))].length * 2).toString());
  const faceSupports: number[] = [];
  for (let i = 1; i < supportedFaces.length + 1; i++) {
    const face = supportedFaces[i - 1];
    const correctedFace = correctedFacesIds[face] + 1;
    if (faceSupports.includes(correctedFace)) continue;
    faceSupports.push(correctedFace);
    lines.push((i * 2 - 1).toString() + '\t' + correctedFace.toString() + '\t' + '1' + '\t' + '0');
    lines.push((i * 2).toString() + '\t' + correctedFace.toString() + '\t' + '2' + '\t' + '0');
  }
  lines.push('');
  lines.push('%END');

  return lines.join('\n');
}
