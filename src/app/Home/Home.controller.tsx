// No controller fica a lógica do componente
// Importa o view e o context (se precisar) e é exportado para o index
import { useAppContext } from '../App.context';
import { AppContext } from '../App.model';
import HomeView from './Home.view';
import { useState } from 'react';
import { NodesInfo, Node, Material, IElement } from './Home.model';
import getNodes from './getNodes';
import getMaterials from './getMaterials';

function HomeController() {
  const { setError, setLoading }: AppContext = useAppContext();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [nodesInfo, setNodesInfo] = useState<NodesInfo>();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [elements, setElements] = useState<IElement[]>([]);

  function getElements(
    elements: IElement[],
    nodes: Node[],
    materials: Material[],
    line: string,
    lines: string[],
    i: number
  ) {
    if (line === '%ELEMENT') {
      for (let j = 0; j < Number(lines[i + 1]); j++) {
        elements.push({
          id: undefined,
          nodes: undefined,
          // @ts-ignore
          material: undefined
        });
      }
    } else if (line === '%ELEMENT.C4') {
      for (let j = 0; j < elements.length; j++) {
        const info = lines[i + j + 2].replaceAll(' ', '').split('\t');
        elements[j].id = Number(info[0]);
        elements[j].material = materials[Number(info[1]) - 1];
        elements[j].nodes = [
          nodes[Number(info[4]) - 1],
          nodes[Number(info[5]) - 1],
          nodes[Number(info[6]) - 1],
          nodes[Number(info[7]) - 1]
        ];
        elements[j].area =
          (Math.max(
            // @ts-ignore
            nodes[Number(info[4]) - 1].x,
            nodes[Number(info[5]) - 1].x,
            nodes[Number(info[6]) - 1].x,
            nodes[Number(info[7]) - 1].x
          ) -
            Math.min(
              // @ts-ignore
              nodes[Number(info[4]) - 1].x,
              nodes[Number(info[5]) - 1].x,
              nodes[Number(info[6]) - 1].x,
              nodes[Number(info[7]) - 1].x
            )) *
          (Math.max(
            // @ts-ignore
            nodes[Number(info[4]) - 1].y,
            nodes[Number(info[5]) - 1].y,
            nodes[Number(info[6]) - 1].y,
            nodes[Number(info[7]) - 1].y
          ) -
            Math.min(
              // @ts-ignore
              nodes[Number(info[4]) - 1].y,
              nodes[Number(info[5]) - 1].y,
              nodes[Number(info[6]) - 1].y,
              nodes[Number(info[7]) - 1].y
            ));
        materials[Number(info[1]) - 1].area += elements[j].area;
      }
    }
  }

  async function parseFile(fileStr: string) {
    const lines = fileStr.split('\n');
    const nodes: Node[] = [];
    const nodesInfo: NodesInfo = {
      nodesX: undefined,
      nodesY: undefined,
      minX: undefined,
      maxX: undefined,
      minY: undefined,
      maxY: undefined
    };
    const materials: Material[] = [];
    const elements: IElement[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      getNodes(nodes, nodesInfo, line, lines, i);
      getMaterials(materials, line, lines, i);
      getElements(elements, nodes, materials, line, lines, i);
    }
    if (materials.length === 0 || nodes.length === 0) {
      setError('Invalid file format.');
    }
    return { nodes, nodesInfo, materials, elements };
  }

  async function handleFileRead(file: any) {
    const fr = new FileReader();
    fr.onload = (e) => {
      const text = e.target?.result;
      if (typeof text !== 'string') {
        setError('Error reading file');
      } else {
        setLoading('Parsing file...');
        parseFile(text)
          .then((res) => {
            const { nodes, nodesInfo, materials, elements } = res;
            setNodes(nodes);
            setMaterials(materials);
            setNodesInfo(nodesInfo);
            setElements(elements);
          })
          .catch((error) => setError(error))
          .finally(() => {
            setLoading('Parsing file...', false);
          });
      }
    };
    fr.readAsText(file);
  }

  function getPieChartColors(materials: Material[]) {
    let totalArea = 0;
    const colors: string[] = [];
    const percentages: number[] = [0];
    materials.forEach((material) => {
      totalArea += material.area;
      colors.push(material.color);
    });
    let cumulativeArea = 0;
    materials.forEach((material) => {
      cumulativeArea += material.area;
      percentages.push((cumulativeArea / totalArea) * 100);
    });
    let string = '';
    for (let i = 0; i < colors.length; i++) {
      string += `${colors[i]} ${percentages[i]}% ${percentages[i + 1]}%`;
      if (i !== colors.length - 1) {
        string += ', ';
      }
    }
    return string;
  }

  return (
    <HomeView
      handleFileRead={handleFileRead}
      nodes={{ state: nodes, set: setNodes }}
      materials={{ state: materials, set: setMaterials }}
      nodesInfo={{ state: nodesInfo, set: setNodesInfo }}
      elements={{ state: elements, set: setElements }}
      getPieChartColors={getPieChartColors}
    />
  );
}

export default HomeController;
