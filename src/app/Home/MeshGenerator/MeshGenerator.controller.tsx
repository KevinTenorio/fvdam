// No controller fica a lógica do componente
// Importa o view e o context (se precisar) e é exportado para o index
import {
  IMeshGeneratorControllerProps,
  IMeshRegion,
  IStuffToShow,
  IMeshMaterial
} from './MeshGenerator.model';
import MeshGeneratorView from './MeshGenerator.view';
import { useAppContext } from '../../App.context';
import { useEffect, useState } from 'react';
import { AppContext } from '../../App.model';
import generateUuid from '/src/commons/generateUuid';

function MeshGeneratorController({ page, handleFileRead }: IMeshGeneratorControllerProps) {
  const [unitCellWidth, setUnitCellWidth] = useState<number | null>(null);
  const [unitCellHeight, setUnitCellHeight] = useState<number | null>(null);
  const [materials, setMaterials] = useState<IMeshMaterial[]>([]);
  const [regions, setRegions] = useState<IMeshRegion[]>([]);
  const [nodes, setNodes] = useState<number[][]>([]);
  const [elements, setElements] = useState<number[][]>([]);
  const [faces, setFaces] = useState<number[][]>([]);
  const [stuffToShow, setStuffToShow] = useState<IStuffToShow>({
    elements: true,
    elementsIds: false,
    regionsLabels: false,
    nodesIds: false,
    facesIds: false,
    borderFacesIds: false,
    regionsMaterials: false,
    supports: false
  });
  const [divisionsByRegion, setDivisionsByRegion] = useState<number>(2);
  const [supportType, setSupportType] = useState<string>('none');
  const [elementsFaces, setElementsFaces] = useState<number[][]>([]);
  const [supportedFaces, setSupportedFaces] = useState<number[]>([]);
  const [periodicity, setPeriodicity] = useState<{ horizontal: boolean; vertical: boolean }>({
    horizontal: true,
    vertical: true
  });
  const [correctedFacesIds, setCorrectedFacesIds] = useState<number[]>([]);
  const { meshData, setMeshData, setError }: AppContext = useAppContext();
  const [maxElemSize, setMaxElemSize] = useState<number>(1);
  const [minElemSize, setMinElemSize] = useState<number>(0);
  const [extraZoom, setExtraZoom] = useState<number>(1);
  const [circle, setCircle] = useState<{
    radius: number;
    edges: number;
    circleMaterialId: string;
    rectangleMaterialId: string;
    showCircleMaterials: boolean;
    showRectangleMaterials: boolean;
    showCircleInputs: boolean;
    fraction: number;
    type: 'grid' | 'radial';
    circleDivisions: number;
  }>({
    radius: 0,
    edges: 0,
    circleMaterialId: '',
    rectangleMaterialId: '',
    showCircleMaterials: false,
    showRectangleMaterials: false,
    showCircleInputs: false,
    fraction: 0,
    type: 'grid',
    circleDivisions: 0
  });

  useEffect(() => {
    if (meshData) {
      setNodes(meshData.nodes);
      setFaces(meshData.faces);
      setElements(meshData.elements);
      setSupportedFaces(meshData.supportedFaces);
      setElementsFaces(meshData.elementsFaces);
      setCorrectedFacesIds(meshData.correctedFacesIds);
      setRegions(meshData.regions);
      setMaterials(meshData.materials);
      setUnitCellWidth(meshData.unitCellWidth);
      setUnitCellHeight(meshData.unitCellHeight);
      setDivisionsByRegion(meshData.divisionsByRegion);
      setSupportType(meshData.supportType);
      setPeriodicity(meshData.periodicity);
    } else {
      setNodes([]);
      setFaces([]);
      setElements([]);
      setSupportedFaces([]);
      setElementsFaces([]);
      setCorrectedFacesIds([]);
      setRegions([]);
      setMaterials([]);
      setUnitCellWidth(null);
      setUnitCellHeight(null);
      setDivisionsByRegion(2);
      setSupportType('none');
      setPeriodicity({ horizontal: true, vertical: true });
      page.set('mesh');
    }
  }, [meshData]);

  useEffect(() => {
    if (unitCellWidth !== null && unitCellHeight !== null) {
      if (Math.max(unitCellWidth, unitCellHeight) / divisionsByRegion > maxElemSize) {
        setMaxElemSize(Math.max(unitCellWidth, unitCellHeight) / divisionsByRegion);
      }
    }
  }, [unitCellHeight, unitCellWidth]);

  function generateCircle() {
    if (unitCellWidth === null || unitCellHeight === null) return null;
    if (circle.type === 'radial') {
      const regionsList = [];
      const measuresList = [];
      let y = unitCellHeight / 2 - circle.radius;
      const angle = Math.PI / 2 / circle.edges;
      for (let i = 0; i <= 2 * circle.edges; i++) {
        const x = Math.sqrt(Math.pow(circle.radius, 2) - Math.pow(y - unitCellHeight / 2, 2)) || 0;
        measuresList.push({ x: x, y: unitCellHeight - y });
        y = unitCellHeight / 2 - circle.radius * Math.sin(Math.PI / 2 - angle * (i + 1));
      }
      measuresList.reverse();
      let area = 0;
      for (let i = 0; i < measuresList.length - 1; i++) {
        const measure = measuresList[i];
        const nextMeasure = measuresList[i + 1];
        area = area + (measure.x + nextMeasure.x) * (nextMeasure.y - measure.y);
      }
      if (
        Math.abs((area / (unitCellHeight * unitCellWidth) - circle.fraction) / circle.fraction) >
        0.05
      ) {
        setError(
          `The mesh to be generated has an area too different from the fraction provided (${Math.abs(
            (100 * (area / (unitCellHeight * unitCellWidth) - circle.fraction)) / circle.fraction
          ).toFixed(1)}% difference). Try increasing the number of edges in the circle.`
        );
      }
      const region0 = {
        id: generateUuid(),
        label: `Row 0 Rectangle 0`,
        materialId: circle.rectangleMaterialId,
        x: 0,
        y: 0,
        height: unitCellHeight / 2 - circle.radius,
        width: unitCellWidth,
        collapsed: true,
        showMaterialsDropdown: false
      };
      regionsList.push(region0);
      for (let i = 0; i < measuresList.length - 1; i++) {
        const measure = measuresList[i];
        const nextMeasure = measuresList[i + 1];
        const width = (nextMeasure.x + measure.x) / 2;
        const height = nextMeasure.y - measure.y;
        if (width < unitCellWidth / 2) {
          const region1 = {
            id: generateUuid(),
            label: `Row ${i + 1} Rectangle 1`,
            materialId: circle.rectangleMaterialId,
            x: 0,
            y: measure.y,
            height: height,
            width: 0.5 * unitCellWidth - width,
            collapsed: true,
            showMaterialsDropdown: false
          };
          regionsList.push(region1);
          const region4 = {
            id: generateUuid(),
            label: `Row ${i + 1} Rectangle 1`,
            materialId: circle.rectangleMaterialId,
            x: 0.5 * unitCellWidth + width,
            y: measure.y,
            height: height,
            width: 0.5 * unitCellWidth - width,
            collapsed: true,
            showMaterialsDropdown: false
          };
          regionsList.push(region4);
        }
        if (width > 0) {
          const region2 = {
            id: generateUuid(),
            label: `Row ${i + 1} Circle 1`,
            materialId: circle.circleMaterialId,
            x: 0.5 * unitCellWidth - width,
            y: measure.y,
            height: height,
            width: width,
            collapsed: true,
            showMaterialsDropdown: false
          };
          regionsList.push(region2);
          const region3 = {
            id: generateUuid(),
            label: `Row ${i + 1} Circle 2`,
            materialId: circle.circleMaterialId,
            x: 0.5 * unitCellWidth,
            y: measure.y,
            height: height,
            width: width,
            collapsed: true,
            showMaterialsDropdown: false
          };
          regionsList.push(region3);
        }
      }
      const regionN = {
        id: generateUuid(),
        label: `Row N Rectangle 0`,
        materialId: circle.rectangleMaterialId,
        x: 0,
        y: unitCellHeight / 2 + circle.radius,
        height: unitCellHeight / 2 - circle.radius,
        width: unitCellWidth,
        collapsed: true,
        showMaterialsDropdown: false
      };
      regionsList.push(regionN);
      setRegions(regionsList);
    } else if (circle.type === 'grid') {
      const regionsList = [];
      const regionWidth = unitCellWidth / circle.circleDivisions;
      const regionHeight = unitCellHeight / circle.circleDivisions;
      const numberOfRegions = Math.pow(circle.circleDivisions, 2);
      const circleCenter = [unitCellWidth / 2, unitCellHeight / 2];
      let circleArea = 0;
      for (let i = 0; i < numberOfRegions; i++) {
        const regionX = (i % circle.circleDivisions) * regionWidth;
        const regionY = Math.floor(i / circle.circleDivisions) * regionHeight;
        const regionCenter = [regionX + regionWidth / 2, regionY + regionHeight / 2];
        const distance = Math.sqrt(
          Math.pow(regionCenter[0] - circleCenter[0], 2) +
            Math.pow(regionCenter[1] - circleCenter[1], 2)
        );
        const region = {
          id: generateUuid(),
          label: `Region ${i}`,
          materialId:
            distance <= circle.radius ? circle.circleMaterialId : circle.rectangleMaterialId,
          x: regionX,
          y: regionY,
          height: regionHeight,
          width: regionWidth,
          collapsed: true,
          showMaterialsDropdown: false
        };
        regionsList.push(region);
        if (distance <= circle.radius) {
          circleArea = circleArea + regionHeight * regionWidth;
        }
      }
      if (
        Math.abs(
          (circleArea / (unitCellHeight * unitCellWidth) - circle.fraction) / circle.fraction
        ) > 0.05
      ) {
        setError(
          `The mesh to be generated has an area too different from the fraction provided (${Math.abs(
            (100 * (circleArea / (unitCellHeight * unitCellWidth) - circle.fraction)) /
              circle.fraction
          ).toFixed(1)}% difference). Try increasing the number of divisions.`
        );
      }
      setRegions(regionsList);
    }
  }

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

  function generateMesh() {
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

    setRegions(regionsAuxList);
    setNodes(nodesList);
    setFaces(facesList);
    setElements(elementsList);
    setSupportedFaces(supportedFacesList);
    setElementsFaces(elementsFacesList);
    setCorrectedFacesIds(correctedFacesIdsList);
    setStuffToShow({ ...stuffToShow, elements: true });
  }

  function generateFvtFile(isDownload = true) {
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
      const elementCenter = [
        (nodes[element[0]][0] +
          nodes[element[1]][0] +
          nodes[element[2]][0] +
          nodes[element[3]][0]) /
          4,
        (nodes[element[0]][1] +
          nodes[element[1]][1] +
          nodes[element[2]][1] +
          nodes[element[3]][1]) /
          4
      ];
      const region = regions.find(
        (region) =>
          elementCenter[0] >= region.x - 9 * Math.pow(10, -9) &&
          elementCenter[0] < region.x + region.width &&
          elementCenter[1] >= region.y - 9 * Math.pow(10, -9) &&
          elementCenter[1] < region.y + region.height
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
    lines.push(
      ([...new Set(supportedFaces.map((face) => correctedFacesIds[face]))].length * 2).toString()
    );
    lines.push('');
    lines.push('%LOAD.CASE.FACE.PRESCRIBED.DISPLACEMENT');
    lines.push(
      ([...new Set(supportedFaces.map((face) => correctedFacesIds[face]))].length * 2).toString()
    );
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
    lines.push('');
    lines.push('%END');

    const text = lines.join('\n');

    if (isDownload) {
      const blob = new Blob([text], { type: 'text/plain' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'model.fvt';
      a.click();
    } else {
      handleFileRead(text, true);
      page.set('fvdam');
    }
  }

  function generateJsonFile(isDownload = true) {
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
    setMeshData(data);

    if (isDownload) {
      const jsonData = JSON.stringify(data, null, 2);

      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = 'model.json';
      a.click();
    }
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
      maxElemSize={{
        state: maxElemSize,
        set: setMaxElemSize
      }}
      minElemSize={{
        state: minElemSize,
        set: setMinElemSize
      }}
      extraZoom={{
        state: extraZoom,
        set: setExtraZoom
      }}
      page={page}
      circle={{
        state: circle,
        set: setCircle
      }}
      generateCircle={generateCircle}
    />
  );
}

export default MeshGeneratorController;
