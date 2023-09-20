// No controller fica a lógica do componente
// Importa o view e o context (se precisar) e é exportado para o index

import { IMeshMaterial, IMeshRegion, IStuffToShow } from './MeshGenerator.model';
import MeshGeneratorView from './MeshGenerator.view';
import { useState } from 'react';

function MeshGeneratorController() {
  const [unitCellWidth, setUnitCellWidth] = useState<number | null>(null);
  const [unitCellHeight, setUnitCellHeight] = useState<number | null>(null);
  const [materials, setMaterials] = useState<IMeshMaterial[]>([]);
  const [regions, setRegions] = useState<IMeshRegion[]>([]);
  const [nodes, setNodes] = useState<number[][]>([]);
  const [elements, setElements] = useState<number[][]>([]);
  const [faces, setFaces] = useState<number[][]>([]);
  const [stuffToShow, setStuffToShow] = useState<IStuffToShow>({
    elements: false,
    elementsIds: false,
    regionsLabels: false,
    nodesIds: false,
    facesIds: false,
    regionsMaterials: true,
    supports: false
  });
  const [divisionsByRegion, setDivisionsByRegion] = useState<number>(2);
  const [supportType, setSupportType] = useState<string>('none');
  const [elementsFaces, setElementsFaces] = useState<number[][]>([]);
  const [supportedFaces, setSupportedFaces] = useState<number[]>([]);

  function getMaxWidth(regions: IMeshRegion[], x: number, y: number) {
    if (unitCellWidth === null || unitCellHeight === null) return null;
    let maxWidth = unitCellWidth;
    const nodeRegion = regions.find(
      (region) =>
        region.x <= x &&
        x < region.x + region.width &&
        region.y <= y &&
        y < region.y + region.height
    );
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
    return maxWidth;
  }

  function getMaxHeight(regions: IMeshRegion[], x: number, y: number) {
    if (unitCellWidth === null || unitCellHeight === null) return null;
    let maxHeight = unitCellHeight;
    const nodeRegion = regions.find(
      (region) =>
        region.x <= x &&
        x < region.x + region.width &&
        region.y <= y &&
        y < region.y + region.height
    );
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
    return maxHeight;
  }

  function generateMesh() {
    if (unitCellWidth === null || unitCellHeight === null) return null;
    const nodesList = [];
    const facesList = [];
    const elementsList = [];
    const elementsFacesList: number[][] = [];
    const supportedFacesList: number[] = [];
    // let maxWidth = unitCellWidth;
    // let maxHeight = unitCellHeight;
    // for (let i = 0; i < regions.length; i++) {
    //   const region = regions[i];
    //   const widthGcd = findGcd(region.width / divisionsByRegion, unitCellWidth);
    //   const heightGcd = findGcd(region.height / divisionsByRegion, unitCellHeight);
    //   if (widthGcd < maxWidth) {
    //     maxWidth = widthGcd;
    //   }
    //   if (heightGcd < maxHeight) {
    //     maxHeight = heightGcd;
    //   }
    // }
    // const horizontalElements = Math.ceil(unitCellWidth / maxWidth);
    // const verticalElements = Math.ceil(unitCellHeight / maxHeight);
    // const numElements = horizontalElements * verticalElements;
    // if (numElements > 1000000) {
    //   setError(
    //     `The number of elements is too high (${numElements}). For this minimum number of divisions by region (${divisionsByRegion}), the maximum element size must be ${maxHeight} by ${maxWidth}. Please, reduce the number of divisions.`
    //   );
    //   return null;
    // }
    let x = 0;
    let y = 0;
    let running = true;
    let horizontalNodes = 1;
    let verticalNodes = 1;
    while (running) {
      const horizontalRegions = regions.filter(
        (region) => region.y <= y && y < region.y + region.height
      );
      const verticalRegions = regions.filter(
        (region) => region.x <= x && x < region.x + region.width
      );
      const width = getMaxWidth(verticalRegions, x, y) || 0;
      const height = getMaxHeight(horizontalRegions, x, y) || 0;
      nodesList.push([x, y]);
      if (x + width <= unitCellWidth) {
        // if (x + width <= unitCellWidth + 0.1 ** 13) {
        x = x + width;
        // x = Math.round((x + width) * 10 ** 13) / 10 ** 13;
      } else {
        x = 0;
        if (y + height <= unitCellHeight) {
          // if (y + height <= unitCellHeight + 0.1 ** 13) {
          y = y + height;
          // y = Math.round((y + height) * 10 ** 13) / 10 ** 13;
          verticalNodes++;
        } else {
          horizontalNodes = nodesList.length / verticalNodes;
          running = false;
        }
      }
    }
    // for (let j = 0; j <= unitCellHeight; j = j + maxHeight) {
    //   for (let i = 0; i <= unitCellWidth; i = i + maxWidth) {
    //     nodesList.push([i, j]);
    //   }
    // }
    const horizontalElements = horizontalNodes - 1;
    const verticalElements = verticalNodes - 1;
    const numElements = horizontalElements * verticalElements;
    for (let i = 0; i < numElements + verticalElements; i++) {
      if (i % (horizontalElements + 1) === 0) continue;
      // const element = [i - 1, i, i + horizontalElements + 1, i + horizontalElements];
      const element = [i + horizontalElements, i + horizontalElements + 1, i, i - 1];
      elementsList.push(element);
    }
    for (let i = 0; i < (horizontalElements + 1) * (verticalElements + 1); i++) {
      // Horizontal faces
      if (i % (horizontalElements + 1) === 0) continue;
      // const face = [i - 1, i];
      const face = [i, i - 1];
      facesList.push(face);
    }
    for (let i = 0; i < nodesList.length - horizontalElements - 1; i++) {
      // Horizontal faces
      const face = [i, i + horizontalElements + 1];
      facesList.push(face);
    }
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      const face1 = faces.findIndex(
        (face) =>
          (face[0] === element[0] && face[1] === element[1]) ||
          (face[0] === element[1] && face[1] === element[0])
      );
      const face2 = faces.findIndex(
        (face) =>
          (face[0] === element[1] && face[1] === element[2]) ||
          (face[0] === element[2] && face[1] === element[1])
      );
      const face3 = faces.findIndex(
        (face) =>
          (face[0] === element[2] && face[1] === element[3]) ||
          (face[0] === element[3] && face[1] === element[2])
      );
      const face4 = faces.findIndex(
        (face) =>
          (face[0] === element[3] && face[1] === element[0]) ||
          (face[0] === element[0] && face[1] === element[3])
      );
      elementsFacesList.push([face1, face2, face3, face4]);
    }

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

    setNodes(nodesList);
    setFaces(facesList);
    setElements(elementsList);
    setSupportedFaces(supportedFacesList);
    setElementsFaces(elementsFacesList);
    setStuffToShow({ ...stuffToShow, elements: true });
  }

  function generateFvtFile() {
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
      lines.push(i.toString() + '\t' + material.label);
    }
    lines.push('');
    lines.push('%MATERIAL.ISOTROPIC');
    lines.push(materials.length.toString());
    for (let i = 1; i < materials.length + 1; i++) {
      const material = materials[i - 1];
      lines.push(
        i.toString() + '\t' + material.young.toString() + '\t' + material.poisson.toString()
      );
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
      const region = regions.find(
        (region) =>
          nodes[element[3]][0] >= region.x &&
          nodes[element[3]][0] < region.x + region.width &&
          nodes[element[3]][1] >= region.y &&
          nodes[element[3]][1] < region.y + region.height
      );
      const materialNumber =
        materials.findIndex((material) => material.id === region?.materialId) + 1;
      lines.push(
        i.toString() +
          '\t' +
          materialNumber +
          '\t' +
          '0' +
          '\t' +
          '3' +
          '\t' +
          (element[0] + 1).toString() +
          '\t' +
          (element[1] + 1).toString() +
          '\t' +
          (element[2] + 1).toString() +
          '\t' +
          (element[3] + 1).toString()
      );
    }

    // Write faces
    lines.push('');
    lines.push('%ELEMENT.C4.FACES');
    lines.push(elements.length.toString());
    for (let i = 1; i < elements.length + 1; i++) {
      const element = elements[i - 1];
      const face1 =
        faces.findIndex(
          (face) =>
            (face[0] === element[0] && face[1] === element[1]) ||
            (face[0] === element[1] && face[1] === element[0])
        ) + 1;
      const face2 =
        faces.findIndex(
          (face) =>
            (face[0] === element[1] && face[1] === element[2]) ||
            (face[0] === element[2] && face[1] === element[1])
        ) + 1;
      const face3 =
        faces.findIndex(
          (face) =>
            (face[0] === element[2] && face[1] === element[3]) ||
            (face[0] === element[3] && face[1] === element[2])
        ) + 1;
      const face4 =
        faces.findIndex(
          (face) =>
            (face[0] === element[3] && face[1] === element[0]) ||
            (face[0] === element[0] && face[1] === element[3])
        ) + 1;
      lines.push(
        i.toString() +
          '\t' +
          face1.toString() +
          '\t' +
          face2.toString() +
          '\t' +
          face3.toString() +
          '\t' +
          face4.toString()
      );
    }

    // Write faces supports
    lines.push('');
    lines.push('%LOAD.CASE.PRESCRIBED.DISPLACEMENT');
    lines.push((supportedFaces.length * 2).toString());
    lines.push('');
    lines.push('%LOAD.CASE.FACE.PRESCRIBED.DISPLACEMENT');
    lines.push((supportedFaces.length * 2).toString());
    for (let i = 1; i < supportedFaces.length + 1; i++) {
      const face = supportedFaces[i - 1];
      lines.push((i * 2 - 1).toString() + '\t' + (face + 1).toString() + '\t' + '1' + '\t' + '0');
      lines.push((i * 2).toString() + '\t' + (face + 1).toString() + '\t' + '2' + '\t' + '0');
    }

    const text = lines.join('\n');

    const blob = new Blob([text], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'model.fvt';
    a.click();
  }

  return (
    <MeshGeneratorView
      unitCellWidth={{
        state: unitCellWidth,
        set: setUnitCellWidth
      }}
      unitCellHeight={{
        state: unitCellHeight,
        set: setUnitCellHeight
      }}
      materials={{
        state: materials,
        set: setMaterials
      }}
      regions={{
        state: regions,
        set: setRegions
      }}
      nodes={{
        state: nodes,
        set: setNodes
      }}
      elements={{
        state: elements,
        set: setElements
      }}
      faces={{
        state: faces,
        set: setFaces
      }}
      generateMesh={generateMesh}
      stuffToShow={{
        state: stuffToShow,
        set: setStuffToShow
      }}
      divisionsByRegion={{
        state: divisionsByRegion,
        set: setDivisionsByRegion
      }}
      generateFvtFile={generateFvtFile}
      supportType={{
        state: supportType,
        set: setSupportType
      }}
      elementsFaces={{
        state: elementsFaces,
        set: setElementsFaces
      }}
      supportedFaces={{
        state: supportedFaces,
        set: setSupportedFaces
      }}
    />
  );
}

export default MeshGeneratorController;
