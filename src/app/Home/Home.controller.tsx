// No controller fica a lógica do componente
// Importa o view e o context (se precisar) e é exportado para o index
import { useAppContext } from '../App.context';
import { AppContext } from '../App.model';
import HomeView from './Home.view';
import { useState } from 'react';
import { NodesInfo, Node, Material, IElement } from './Home.model';
import getNodes from './getNodes';
import getMaterials from './getMaterials';
import getElements from './getElements';

function HomeController() {
  const { setError, setLoading }: AppContext = useAppContext();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [nodesInfo, setNodesInfo] = useState<NodesInfo>();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [elements, setElements] = useState<IElement[]>([]);

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