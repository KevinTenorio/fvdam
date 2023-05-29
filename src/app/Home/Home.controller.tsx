// No controller fica a lógica do componente
// Importa o view e o context (se precisar) e é exportado para o index
import { useAppContext } from '../App.context';
import { AppContext } from '../App.model';
import HomeView from './Home.view';
import { useState } from 'react';
import { NodesInfo, Node, Material, IElement, Face } from './Home.model';
import getNodes from './getNodes';
import getMaterials from './getMaterials';
import getElements from './getElements';
import getFaces from './getFaces';
import calcConsts from './calcConsts';
import calcDof from './calcDof';

function HomeController() {
  const { setError, setLoading }: AppContext = useAppContext();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [nodesInfo, setNodesInfo] = useState<NodesInfo>({
    nodesX: 0,
    nodesY: 0,
    minX: 0,
    maxX: 0,
    minY: 0,
    maxY: 0
  });
  const [materials, setMaterials] = useState<Material[]>([]);
  const [elements, setElements] = useState<IElement[]>([]);
  const [faces, setFaces] = useState<Face[]>([]);

  async function parseFile(fileStr: string) {
    const lines = fileStr.split('\n');
    const nodes: Node[] = [];
    const nodesInfo: NodesInfo = {
      nodesX: 0,
      nodesY: 0,
      minX: 0,
      maxX: 0,
      minY: 0,
      maxY: 0
    };
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
    if (materials.length === 0 || nodes.length === 0) {
      setError('Invalid file format.');
    }
    return { nodes, nodesInfo, materials, elements, faces };
  }

  async function fvdamAlg(
    nodes: Node[],
    nodesInfo: NodesInfo,
    materials: Material[],
    elements: IElement[],
    faces: Face[]
  ) {
    const { AIn, EIn, MIn, NIn, PIn, AOut, EOut, MOut, NOut, POut } = calcConsts();
    const { dofAOut, dofBOut, dofAIn, dofBIn } = calcDof(faces);

    return 0;
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
            const { nodes, nodesInfo, materials, elements, faces } = res;
            setNodes(nodes);
            setMaterials(materials);
            setNodesInfo(nodesInfo);
            setElements(elements);
            setFaces(faces);
            setLoading('Executing FVDAM algorithm...');
            fvdamAlg(nodes, nodesInfo, materials, elements, faces)
              .then((res) => console.log(res))
              .catch((error) => setError(error))
              .finally(() => {
                setLoading('Executing FVDAM algorithm...', false);
              });
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
      faces={{ state: faces, set: setFaces }}
      getPieChartColors={getPieChartColors}
    />
  );
}

export default HomeController;
