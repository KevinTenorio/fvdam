// No controller fica a lógica do componente
// Importa o view e o context (se precisar) e é exportado para o index

import { IMeshMaterial, IMeshRegion, IStuffToShow } from './MeshGenerator.model';
import MeshGeneratorView from './MeshGenerator.view';
import { useState } from 'react';
import { findGcd } from '/src/commons/findLcm';
import { useAppContext } from '../../App.context';
import { AppContext } from '../../App.model';

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
    regionsMaterials: true
  });
  const [divisionsByRegion, setDivisionsByRegion] = useState<number>(2);
  const { setError }: AppContext = useAppContext();

  function getMaxWidth(regions: IMeshRegion[]) {
    if (unitCellWidth === null || unitCellHeight === null) return null;
    let maxWidth = unitCellWidth;
    for (let i = 0; i < regions.length; i++) {
      const region = regions[i];
      const decimals = region.width.toString().split('.')[1]?.length ?? 0;
      const widthGcd = (region.width * Math.pow(10, decimals)) / divisionsByRegion;
      const width = widthGcd / Math.pow(10, decimals);
      if (width < maxWidth) {
        maxWidth = width;
      }
    }
    return maxWidth;
  }

  function getMaxHeight(regions: IMeshRegion[]) {
    if (unitCellWidth === null || unitCellHeight === null) return null;
    let maxHeight = unitCellHeight;
    for (let i = 0; i < regions.length; i++) {
      const region = regions[i];
      const decimals = region.height.toString().split('.')[1]?.length ?? 0;
      const heightGcd = (region.height * Math.pow(10, decimals)) / divisionsByRegion;
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
      const width = getMaxWidth(verticalRegions) || 0;
      const height = getMaxHeight(horizontalRegions) || 0;
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
      const element = [i - 1, i, i + horizontalElements + 1, i + horizontalElements];
      elementsList.push(element);
    }
    for (let i = 0; i < (horizontalElements + 1) * (verticalElements + 1); i++) {
      // Horizontal faces
      if (i % (horizontalElements + 1) === 0) continue;
      const face = [i - 1, i];
      facesList.push(face);
    }
    for (let i = 0; i < nodesList.length - horizontalElements - 1; i++) {
      // Horizontal faces
      const face = [i, i + horizontalElements + 1];
      facesList.push(face);
    }
    setNodes(nodesList);
    setFaces(facesList);
    setElements(elementsList);
    setStuffToShow({ ...stuffToShow, elements: true });
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
    />
  );
}

export default MeshGeneratorController;
