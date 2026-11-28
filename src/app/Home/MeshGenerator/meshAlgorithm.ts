// Algoritmo do gerador de malha, extraído sem mudanças de MeshGenerator.controller.tsx
// para rodar num Web Worker (a geração não trava mais a interface).
// O texto das funções é o mesmo de antes; só os valores que vinham do estado do React
// (unitCellWidth, divisionsByRegion, ...) agora chegam como parâmetros.
// Regressão: os 35 .json de python/casos/regressao geram .fvt idênticos byte a byte.
import generateUuid from '/src/commons/generateUuid';
import { IMeshRegion } from './MeshGenerator.model';

export interface MeshInput {
  unitCellWidth: number | null;
  unitCellHeight: number | null;
  regions: IMeshRegion[];
  divisionsByRegion: number;
  maxElemSize: number;
  minElemSize: number;
  supportType: string;
  periodicity: { horizontal: boolean; vertical: boolean };
}

export interface MeshOutput {
  regions: IMeshRegion[];
  nodes: number[][];
  faces: number[][];
  elements: number[][];
  supportedFaces: number[];
  elementsFaces: number[][];
  correctedFacesIds: number[];
}

export function generateMeshData(input: MeshInput): MeshOutput | null {
  const {
    unitCellWidth,
    unitCellHeight,
    regions,
    divisionsByRegion,
    maxElemSize,
    minElemSize,
    supportType,
    periodicity
  } = input;

  function getMaxWidth(regions: IMeshRegion[], x: number, y: number) {
    if (unitCellWidth === null || unitCellHeight === null) return null;
    let maxWidth = unitCellWidth;
    const nodeRegion = regions.find((region) => {
      const decimals = 4;
      let xEnd = region.x + region.width - 9 * Math.pow(10, -decimals - 4);
      if (region.x + region.width === unitCellWidth) {
        xEnd = unitCellWidth + 9 * Math.pow(10, -decimals - 4);
      }
      let yEnd = region.y + region.height - 9 * Math.pow(10, -decimals - 4);
      if (region.y + region.height === unitCellHeight) {
        yEnd = unitCellHeight + 9 * Math.pow(10, -decimals - 4);
      }
      return (
        region.x - 9 * Math.pow(10, -decimals - 4) <= x &&
        x < xEnd &&
        region.y - 9 * Math.pow(10, -decimals - 4) <= y &&
        y < yEnd
      );
    });
    for (let i = 0; i < regions.length; i++) {
      const region = regions[i];
      let regionWidth = region.width;
      if (nodeRegion && nodeRegion.id !== region.id && nodeRegion.x > region.x) {
        regionWidth = regionWidth - (nodeRegion.x - region.x);
      }
      const decimals = regionWidth.toString().split('.')[1]?.length ?? 0;
      const widthGcd = (regionWidth * Math.pow(10, decimals)) / divisionsByRegion;
      const width = widthGcd / Math.pow(10, decimals);
      if (width < maxWidth) {
        maxWidth = width;
      }
    }
    if (maxWidth < minElemSize && nodeRegion && minElemSize < nodeRegion?.width) {
      maxWidth = minElemSize;
    }
    if (maxWidth > maxElemSize && nodeRegion) {
      let divisor = 1;
      while (nodeRegion?.width / divisor > maxElemSize) {
        divisor++;
      }
      if (nodeRegion?.width / divisor >= minElemSize) {
        maxWidth = nodeRegion?.width / divisor ?? maxWidth;
      }
    }
    return maxWidth;
  }

  function getMaxHeight(regions: IMeshRegion[], x: number, y: number) {
    if (unitCellWidth === null || unitCellHeight === null) return null;
    let maxHeight = unitCellHeight;
    const nodeRegion = regions.find((region) => {
      const decimals = 4;
      let xEnd = region.x + region.width - 9 * Math.pow(10, -decimals - 4);
      if (region.x + region.width === unitCellWidth) {
        xEnd = unitCellWidth + 9 * Math.pow(10, -decimals - 4);
      }
      let yEnd = region.y + region.height - 9 * Math.pow(10, -decimals - 4);
      if (region.y + region.height === unitCellHeight) {
        yEnd = unitCellHeight + 9 * Math.pow(10, -decimals - 4);
      }
      return (
        region.x - 9 * Math.pow(10, -decimals - 4) <= x &&
        x < xEnd &&
        region.y - 9 * Math.pow(10, -decimals - 4) <= y &&
        y < yEnd
      );
    });
    for (let i = 0; i < regions.length; i++) {
      const region = regions[i];
      let regionHeight = region.height;
      if (nodeRegion && nodeRegion.id !== region.id && nodeRegion.y > region.y) {
        regionHeight = regionHeight - (nodeRegion.y - region.y);
      }
      const decimals = regionHeight.toString().split('.')[1]?.length ?? 0;
      const heightGcd = (regionHeight * Math.pow(10, decimals)) / divisionsByRegion;
      const height = heightGcd / Math.pow(10, decimals);

      if (height < maxHeight) {
        maxHeight = height;
      }
    }
    if (maxHeight < minElemSize && nodeRegion && minElemSize < nodeRegion?.height) {
      maxHeight = minElemSize;
    }
    if (maxHeight > maxElemSize && nodeRegion) {
      let divisor = 1;
      while (nodeRegion?.height / divisor > maxElemSize) {
        divisor++;
      }
      if (nodeRegion?.height / divisor >= minElemSize) {
        maxHeight = nodeRegion?.height / divisor ?? maxHeight;
      }
    }

    return maxHeight;
  }

  if (unitCellWidth === null || unitCellHeight === null) return null;
  const decimals = Math.max(
    unitCellWidth.toString().split('.')[1]?.length ?? 0,
    unitCellHeight.toString().split('.')[1]?.length ?? 0
  );
  const nodesList = [];
  const facesList = [];
  const elementsList = [];
  const elementsFacesList: number[][] = [];
  const supportedFacesList: number[] = [];
  const periodicFacesList: number[][] = [];
  let x = 0;
  let y = 0;
  let running = true;
  let horizontalNodes = 1;
  let verticalNodes = 1;
  let trueWidth = unitCellWidth;
  let trueHeight = unitCellHeight;
  const regionsAuxList = regions;

  while (running) {
    for (let i = 0; i < regions.length; i++) {
      const verticalLine = regions[i].x + regions[i].width;
      const horizontalLine = regions[i].y + regions[i].height;
      for (let j = 0; j < regionsAuxList.length; j++) {
        const region = regionsAuxList[j];
        if (
          verticalLine > region.x &&
          verticalLine < region.x + region.width &&
          region.x + region.width - verticalLine > 9 * Math.pow(10, -decimals - 4) &&
          verticalLine - region.x > 9 * Math.pow(10, -decimals - 4)
        ) {
          const region1 = {
            id: generateUuid(),
            label: region.label + '.1',
            materialId: region.materialId,
            x: verticalLine,
            y: region.y,
            height: region.height,
            width: region.x + region.width - verticalLine,
            collapsed: true,
            showMaterialsDropdown: false
          };
          const region2 = {
            id: generateUuid(),
            label: region.label + '.2',
            materialId: region.materialId,
            x: region.x,
            y: region.y,
            height: region.height,
            width: verticalLine - region.x,
            collapsed: true,
            showMaterialsDropdown: false
          };
          regionsAuxList.splice(j, 1, region1, region2);
        }
        if (
          horizontalLine > region.y &&
          horizontalLine < region.y + region.height &&
          region.y + region.height - horizontalLine > 9 * Math.pow(10, -decimals - 4) &&
          horizontalLine - region.y > 9 * Math.pow(10, -decimals - 4)
        ) {
          const region1 = {
            id: generateUuid(),
            label: region.label + '.1',
            materialId: region.materialId,
            x: region.x,
            y: horizontalLine,
            height: region.y + region.height - horizontalLine,
            width: region.width,
            collapsed: true,
            showMaterialsDropdown: false
          };
          const region2 = {
            id: generateUuid(),
            label: region.label + '.2',
            materialId: region.materialId,
            x: region.x,
            y: region.y,
            height: horizontalLine - region.y,
            width: region.width,
            collapsed: true,
            showMaterialsDropdown: false
          };
          regionsAuxList.splice(j, 1, region1, region2);
        }
      }
    }
    const presentRegion = regionsAuxList.find((region) => {
      const decimals = 4;
      let yEnd = region.y + region.height - 9 * Math.pow(10, -decimals - 4);
      if (region.y + region.height >= unitCellHeight - 9 * Math.pow(10, -decimals - 4)) {
        yEnd = unitCellHeight + 9 * Math.pow(10, -decimals - 4);
      }
      let xEnd = region.x + region.width - 9 * Math.pow(10, -decimals - 4);
      if (region.x + region.width >= unitCellWidth - 9 * Math.pow(10, -decimals - 4)) {
        xEnd = unitCellWidth + 9 * Math.pow(10, -decimals - 4);
      }
      return (
        region.y - 9 * Math.pow(10, -decimals - 4) <= y &&
        y < yEnd &&
        region.x - 9 * Math.pow(10, -decimals - 4) <= x &&
        x < xEnd
      );
    });
    let width: number;
    let height: number;
    if (!presentRegion) {
      width = 0;
      height = 0;
    } else {
      width = getMaxWidth([presentRegion], x, y) || 0;
      height = getMaxHeight([presentRegion], x, y) || 0;
    }

    nodesList.push([x, y]);
    if (Number((x + width).toPrecision(15)) <= unitCellWidth + 9 * Math.pow(10, -decimals - 4)) {
      x = Number((x + width).toPrecision(15));
    } else {
      if (
        Number((y + height).toPrecision(15)) <=
        unitCellHeight + 9 * Math.pow(10, -decimals - 4)
      ) {
        y = Number((y + height).toPrecision(15));
        verticalNodes++;
      } else {
        horizontalNodes = nodesList.length / verticalNodes;
        trueWidth = x;
        trueHeight = y;
        running = false;
      }
      x = 0;
    }
  }
  const horizontalElements = horizontalNodes - 1;
  const verticalElements = verticalNodes - 1;
  const numElements = horizontalElements * verticalElements;
  for (let i = 0; i < numElements + verticalElements; i++) {
    if (i % (horizontalElements + 1) === 0) continue;
    const element = [i + horizontalElements, i + horizontalElements + 1, i, i - 1];
    elementsList.push(element);
  }
  for (let i = 0; i < (horizontalElements + 1) * (verticalElements + 1); i++) {
    // Horizontal faces
    if (i % (horizontalElements + 1) === 0) {
      continue;
    }
    const face = [i, i - 1];
    facesList.push(face);
  }
  for (let i = 0; i < nodesList.length - horizontalElements - 1; i++) {
    // Vertical faces
    const face = [i, i + horizontalElements + 1];
    facesList.push(face);
  }
  for (let i = 0; i < elementsList.length; i++) {
    const element = elementsList[i];
    const face1 = facesList.findIndex(
      (face) =>
        (face[0] === element[0] && face[1] === element[1]) ||
        (face[0] === element[1] && face[1] === element[0])
    );
    const face2 = facesList.findIndex(
      (face) =>
        (face[0] === element[1] && face[1] === element[2]) ||
        (face[0] === element[2] && face[1] === element[1])
    );
    const face3 = facesList.findIndex(
      (face) =>
        (face[0] === element[2] && face[1] === element[3]) ||
        (face[0] === element[3] && face[1] === element[2])
    );
    const face4 = facesList.findIndex(
      (face) =>
        (face[0] === element[3] && face[1] === element[0]) ||
        (face[0] === element[0] && face[1] === element[3])
    );
    elementsFacesList.push([face1, face2, face3, face4]);
  }

  if (supportType === 'border') {
    facesList.forEach((_, index) => {
      let numberOfAppearences = 0;
      for (let i = 0; i < elementsFacesList.length; i++) {
        const elementFace = elementsFacesList[i];
        if (elementFace.includes(index)) {
          numberOfAppearences++;
        }
      }
      if (numberOfAppearences === 1) {
        supportedFacesList.push(index);
      }
    });
  } else if (supportType === 'edges') {
    const edge1 = nodesList.findIndex((node) => node[0] === 0 && node[1] === 0);
    const edge2 = nodesList.findIndex((node) => node[0] === trueWidth && node[1] === 0);
    const edge3 = nodesList.findIndex((node) => node[0] === trueWidth && node[1] === trueHeight);
    const edge4 = nodesList.findIndex((node) => node[0] === 0 && node[1] === trueHeight);
    facesList.forEach((face, index) => {
      if (
        face.includes(edge1) ||
        face.includes(edge2) ||
        face.includes(edge3) ||
        face.includes(edge4)
      ) {
        supportedFacesList.push(index);
      }
    });
  } else if (supportType === 'central') {
    const centralCoordinateX = unitCellWidth / 2;

    for (let i = 0; i < facesList.length; i++) {
      const face = facesList[i];
      const node1 = nodesList[face[0]];
      const node2 = nodesList[face[1]];
      if (
        ((centralCoordinateX + 9 * Math.pow(10, -decimals - 4) >= node1[0] &&
          centralCoordinateX - 9 * Math.pow(10, -decimals - 4) <= node2[0]) ||
          (centralCoordinateX - 9 * Math.pow(10, -decimals - 4) <= node1[0] &&
            centralCoordinateX + 9 * Math.pow(10, -decimals - 4) >= node2[0])) &&
        (node1[1] === 0 ||
          (node1[1] >= unitCellHeight - 9 * Math.pow(10, -decimals - 4) &&
            node1[1] <= unitCellHeight + 9 * Math.pow(10, -decimals - 4))) &&
        node1[0] !== node2[0]
      ) {
        supportedFacesList.push(i);
      }
    }
  }
  for (let i = 0; i < facesList.length; i++) {
    const node1 = nodesList[facesList[i][0]];
    const node2 = nodesList[facesList[i][1]];
    if (
      periodicity.horizontal &&
      node1[0] === node2[0] &&
      node1[0] >= unitCellWidth - 9 * Math.pow(10, -decimals - 4) &&
      node1[0] <= unitCellWidth + 9 * Math.pow(10, -decimals - 4)
    ) {
      periodicFacesList.push([i, i - horizontalElements - periodicFacesList.length]);
    }
    if (
      periodicity.vertical &&
      node1[1] === node2[1] &&
      node1[1] >= unitCellHeight - 9 * Math.pow(10, -decimals - 4) &&
      node1[1] <= unitCellHeight + 9 * Math.pow(10, -decimals - 4)
    ) {
      periodicFacesList.push([i, i - horizontalElements * verticalElements]);
    }
  }
  const correctedFacesIdsList: number[] = [];
  let faceId = 0;
  for (let i = 0; i < facesList.length; i++) {
    if (periodicFacesList.map((face) => face[0]).includes(i)) {
      // @ts-ignore
      correctedFacesIdsList.push(periodicFacesList.find((face) => face[0] === i)[1]);
    } else {
      correctedFacesIdsList.push(faceId);
      faceId++;
    }
  }

  return {
    regions: regionsAuxList,
    nodes: nodesList,
    faces: facesList,
    elements: elementsList,
    supportedFaces: supportedFacesList,
    elementsFaces: elementsFacesList,
    correctedFacesIds: correctedFacesIdsList
  };
}
