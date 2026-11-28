// No controller fica a lógica do componente
// Importa o view e o context (se precisar) e é exportado para o index
import { useAppContext } from '../App.context';
import { AppContext } from '../App.model';
import HomeView from './Home.view';
import { useEffect, useState } from 'react';
import {
  NodesInfo,
  Node,
  Material,
  IElement,
  Face,
  Results,
  FvdamCore,
  PythonRuntimeStatus
} from './Home.model';
import getNodes from './getNodes';
import getMaterials from './getMaterials';
import getElements from './getElements';
import getFaces from './getFaces';
import * as math from 'mathjs';
import { executarFvdamPython, prepararFvdamPython } from './python/fvdamPython';
import materialColor from '/src/commons/materialColor';
import { executarFvdamTs, cancelarFvdamTs, ExecucaoCancelada } from './typescript/fvdamTs';

function HomeController() {
  const { setError, setLoading, setCancelLoading, fvdamFile, setMeshData, meshData }: AppContext =
    useAppContext();
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
  const [results, setResults] = useState<Results>();
  const [page, setPage] = useState<string>('mesh');
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  // texto .fvt da célula carregada (entrada do núcleo Python)
  const [inputText, setInputText] = useState<string>();
  const [pythonStatus, setPythonStatus] = useState<PythonRuntimeStatus>('loading');

  // baixa o runtime Python em segundo plano assim que o app abre
  useEffect(() => {
    prepararFvdamPython()
      .then(() => setPythonStatus('ready'))
      .catch(() => setPythonStatus('error'));
  }, []);

  useEffect(() => {
    // if (!fvdamFile || page === 'mesh') {
    if (!fvdamFile) {
      setNodes([]);
      setNodesInfo({
        nodesX: 0,
        nodesY: 0,
        minX: 0,
        maxX: 0,
        minY: 0,
        maxY: 0
      });
      setMaterials([]);
      setElements([]);
      setFaces([]);
      setResults(undefined);
      setInputText(undefined);
      setMeshData(undefined);
    }
  }, [fvdamFile]);

  async function parseFile(fileStr: string) {
    const lines = fileStr.replaceAll('\r\n', '\n').replaceAll('\r', '\n').split('\n');
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

  function handleEffectiveStiffness(Ch: math.MathCollection, core: FvdamCore = 'typescript') {
    const S = math.inv(Ch);
    // @ts-ignore
    const E11 = 1 / S.get([0, 0]);
    // @ts-ignore
    const E22 = 1 / S.get([1, 1]);
    // @ts-ignore
    const E33 = 1 / S.get([2, 2]);
    // @ts-ignore
    const v23 = -1 * S.get([2, 1]) * E22;
    // @ts-ignore
    const v13 = -1 * S.get([2, 0]) * E11;
    // @ts-ignore
    const v12 = -1 * S.get([1, 0]) * E11;
    // @ts-ignore
    const G23 = 1 / S.get([3, 3]);
    // @ts-ignore
    const G13 = 1 / S.get([4, 4]);
    // @ts-ignore
    const G12 = 1 / S.get([5, 5]);

    setResults({
      E11,
      E22,
      E33,
      v23,
      v13,
      v12,
      G23,
      G13,
      G12,
      Ch,
      core,
      coreDetails: 'mathjs (dense algebra)'
    });
  }

  const PYTHON_LOADING = 'Finishing the Python download (first time only)...';
  const EXECUTING = 'Executing FVDAM algorithm. This may take a while...';

  async function handleExecuteFvdamPython() {
    if (!inputText) {
      setError('No unit cell loaded.');
      setLoading(EXECUTING, false);
      return;
    }
    // a tela de carga mostra só a primeira mensagem da fila: enquanto o runtime
    // termina de baixar, troca "Executing..." pela mensagem de download
    let mostrandoDownload = false;
    try {
      const res = await executarFvdamPython(inputText, 'fvt', (etapa) => {
        if (etapa === 'carregando') {
          setPythonStatus('loading');
          if (!mostrandoDownload) {
            mostrandoDownload = true;
            setLoading(PYTHON_LOADING);
            setLoading(EXECUTING, false);
          }
        } else {
          setPythonStatus('ready');
          if (mostrandoDownload) {
            mostrandoDownload = false;
            setLoading(EXECUTING);
            setLoading(PYTHON_LOADING, false);
          }
        }
      });
      const v = res.versoes;
      setResults({
        ...res.propriedades,
        Ch: math.matrix(res.C),
        core: 'python',
        coreDetails:
          `fvdam ${v.fvdam} · Python ${v.python} · NumPy ${v.numpy} · SciPy ${v.scipy} · Pyodide ${res.pyodide}` +
          (res.tempo_carga_ms > 0
            ? ` · runtime loaded in ${(res.tempo_carga_ms / 1000).toFixed(1)} s`
            : '')
      });
      setElapsedTime(res.tempo_total_ms);
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
      if (String(error).includes('Could not load Python')) setPythonStatus('error');
    } finally {
      setLoading(mostrandoDownload ? PYTHON_LOADING : EXECUTING, false);
    }
  }

  async function handleExecuteFvdam(core: FvdamCore = 'typescript') {
    setResults(undefined);
    if (core === 'python') {
      handleExecuteFvdamPython();
      return;
    }
    if (!inputText) {
      setError('No unit cell loaded.');
      setLoading(EXECUTING, false);
      return;
    }
    // núcleo TypeScript num Web Worker: a interface continua respondendo e dá para cancelar
    setCancelLoading(() => () => cancelarFvdamTs());
    try {
      const res = await executarFvdamTs(inputText);
      handleEffectiveStiffness(math.matrix(res.C));
      setElapsedTime(res.tempo_ms);
    } catch (error) {
      if (!(error instanceof ExecucaoCancelada)) {
        setError(error instanceof Error ? error.message : String(error));
      }
    } finally {
      setCancelLoading(undefined);
      setLoading(EXECUTING, false);
    }
  }

  function readJsonFile(file: any) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      const data = JSON.parse(text as string);
      setMeshData(data);
    };
    reader.readAsText(file);
  }

  async function handleFileRead(file: any, textMode = false) {
    setLoading('Reading file...');
    if (!textMode) {
      if (file.name.split('.').pop() === 'fvt') {
        const fr = new FileReader();
        fr.onload = (e) => {
          const text = e.target?.result;
          if (typeof text !== 'string') {
            setError('Error reading file');
            setLoading('Reading file...', false);
          } else {
            parseFile(text)
              .then((res) => {
                const { nodes, nodesInfo, materials, elements, faces } = res;
                setNodes(nodes);
                setMaterials(materials);
                setNodesInfo(nodesInfo);
                setElements(elements);
                setFaces(faces);
                setResults(undefined);
                setInputText(text);
                // .fvt aberto direto: vai para a FVDAM (antes a seção nunca aparecia)
                if (materials.length > 0 && nodes.length > 0) setPage('fvdam');
              })
              .catch((error) => setError(error))
              .finally(() => {
                setLoading('Reading file...', false);
              });
          }
        };
        fr.readAsText(file);
      } else if (file.name.split('.').pop() === 'json') {
        readJsonFile(file);
        setLoading('Reading file...', false);
      }
    } else {
      parseFile(file)
        .then((res) => {
          const { nodes, nodesInfo, materials, elements, faces } = res;
          setNodes(nodes);
          setMaterials(materials);
          setNodesInfo(nodesInfo);
          setElements(elements);
          setFaces(faces);
          setResults(undefined);
          setInputText(file);
        })
        .catch((error) => setError(error))
        .finally(() => {
          setLoading('Reading file...', false);
        });
    }
  }

  function getPieChartColors(materials: Material[]) {
    let totalArea = 0;
    const colors: string[] = [];
    const percentages: number[] = [0];
    materials.forEach((material, materialIndex) => {
      totalArea += material.area;
      colors.push(materialColor(meshData, materialIndex));
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
      results={{ state: results, set: setResults }}
      handleExecuteFvdam={handleExecuteFvdam}
      page={{ state: page, set: setPage }}
      parseFile={parseFile}
      elapsedTime={{ state: elapsedTime, set: setElapsedTime }}
      pythonStatus={pythonStatus}
    />
  );
}

export default HomeController;
