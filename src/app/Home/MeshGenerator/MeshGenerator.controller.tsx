// No controller fica a lógica do componente
// Importa o view e o context (se precisar) e é exportado para o index
import {
  IMeshGeneratorContext,
  IMeshGeneratorControllerProps,
  IMeshRegion
} from './MeshGenerator.model';
import MeshGeneratorView from './MeshGenerator.view';
import { useAppContext } from '../../App.context';

function MeshGeneratorController({ page, handleFileRead }: IMeshGeneratorControllerProps) {
  const {
    unitCellWidth,
    setUnitCellWidth,
    unitCellHeight,
    setUnitCellHeight,
    materials,
    setMaterials,
    regions,
    setRegions,
    nodes,
    setNodes,
    elements,
    setElements,
    faces,
    setFaces,
    stuffToShow,
    setStuffToShow,
    divisionsByRegion,
    setDivisionsByRegion,
    supportType,
    setSupportType,
    elementsFaces,
    setElementsFaces,
    supportedFaces,
    setSupportedFaces,
    periodicity,
    setPeriodicity,
    correctedFacesIds,
    setCorrectedFacesIds
  }: IMeshGeneratorContext = useAppContext();

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
    const periodicFacesList: number[][] = [];
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
        x = x + width;
      } else {
        x = 0;
        if (y + height <= unitCellHeight) {
          y = y + height;
          verticalNodes++;
        } else {
          horizontalNodes = nodesList.length / verticalNodes;
          running = false;
        }
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
      const edge2 = nodesList.findIndex((node) => node[0] === unitCellWidth && node[1] === 0);
      const edge3 = nodesList.findIndex(
        (node) => node[0] === unitCellWidth && node[1] === unitCellHeight
      );
      const edge4 = nodesList.findIndex((node) => node[0] === 0 && node[1] === unitCellHeight);
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
          ((centralCoordinateX >= node1[0] && centralCoordinateX <= node2[0]) ||
            (centralCoordinateX <= node1[0] && centralCoordinateX >= node2[0])) &&
          (node1[1] === 0 || node1[1] === unitCellHeight)
        ) {
          supportedFacesList.push(i);
        }
      }
    }
    for (let i = 0; i < facesList.length; i++) {
      const node1 = nodesList[facesList[i][0]];
      const node2 = nodesList[facesList[i][1]];
      if (periodicity.horizontal && node1[0] === node2[0] && node1[0] === unitCellWidth) {
        periodicFacesList.push([i, i - horizontalElements - periodicFacesList.length]);
      }
      if (periodicity.vertical && node1[1] === node2[1] && node1[1] === unitCellHeight) {
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

    setNodes(nodesList);
    setFaces(facesList);
    setElements(elementsList);
    setSupportedFaces(supportedFacesList);
    setElementsFaces(elementsFacesList);
    setCorrectedFacesIds(correctedFacesIdsList);
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
      const face1 = faces.findIndex(
        (face) =>
          (face[0] === element[0] && face[1] === element[1]) ||
          (face[0] === element[1] && face[1] === element[0])
      );
      const correctedFace1 = correctedFacesIds[face1] + 1;
      const face2 = faces.findIndex(
        (face) =>
          (face[0] === element[1] && face[1] === element[2]) ||
          (face[0] === element[2] && face[1] === element[1])
      );
      const correctedFace2 = correctedFacesIds[face2] + 1;
      const face3 = faces.findIndex(
        (face) =>
          (face[0] === element[2] && face[1] === element[3]) ||
          (face[0] === element[3] && face[1] === element[2])
      );
      const correctedFace3 = correctedFacesIds[face3] + 1;
      const face4 = faces.findIndex(
        (face) =>
          (face[0] === element[3] && face[1] === element[0]) ||
          (face[0] === element[0] && face[1] === element[3])
      );
      const correctedFace4 = correctedFacesIds[face4] + 1;
      lines.push(
        i.toString() +
          '\t' +
          correctedFace1.toString() +
          '\t' +
          correctedFace2.toString() +
          '\t' +
          correctedFace3.toString() +
          '\t' +
          correctedFace4.toString()
      );
    }

    // Write faces supports
    lines.push('');
    lines.push('%LOAD.CASE.PRESCRIBED.DISPLACEMENT');
    lines.push(supportedFaces.length.toString());
    lines.push('');
    lines.push('%LOAD.CASE.FACE.PRESCRIBED.DISPLACEMENT');
    lines.push(supportedFaces.length.toString());
    const faceSupports: number[] = [];
    for (let i = 1; i < supportedFaces.length + 1; i++) {
      const face = supportedFaces[i - 1];
      const correctedFace = correctedFacesIds[face] + 1;
      if (faceSupports.includes(correctedFace)) continue;
      faceSupports.push(correctedFace);
      lines.push(
        (i * 2 - 1).toString() + '\t' + correctedFace.toString() + '\t' + '1' + '\t' + '0'
      );
      lines.push((i * 2).toString() + '\t' + correctedFace.toString() + '\t' + '2' + '\t' + '0');
    }

    const text = lines.join('\n');

    const blob = new Blob([text], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'model.fvt';
    a.click();
    handleFileRead(text, true);
    page.set('fvdam');
  }

  function generateJsonFile() {
    const data = {
      nodes: nodes,
      faces: faces,
      elements: elements,
      supportedFaces: supportedFaces,
      elementsFaces: elementsFaces,
      correctedFacesIds: correctedFacesIds,
      regions: regions,
      materials: materials,
      unitCellWidth: unitCellWidth,
      unitCellHeight: unitCellHeight,
      divisionsByRegion: divisionsByRegion,
      supportType: supportType,
      periodicity: periodicity
    };

    const jsonData = JSON.stringify(data, null, 2);

    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'model.json';
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
      generateJsonFile={generateJsonFile}
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
      periodicity={{
        state: periodicity,
        set: setPeriodicity
      }}
      correctedFacesIds={{
        state: correctedFacesIds,
        set: setCorrectedFacesIds
      }}
    />
  );
}

export default MeshGeneratorController;
