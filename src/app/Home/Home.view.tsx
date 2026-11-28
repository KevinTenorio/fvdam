// No view fica o que é renderizado pelo componente
// Importa o styles (se tiver) e outros componentes filhos
// É exportado para o controller
import { useAppContext } from '../App.context';
import { AppContext } from '../App.model';
import { useState } from 'react';
import { UNIT_SYSTEMS } from '/src/commons/units';
import { IState } from '/src/index.model';
import {
  Node,
  NodesInfo,
  Material,
  IElement,
  Face,
  Results,
  FvdamCore,
  PythonRuntimeStatus
} from './Home.model';
import './Home.style.css';
import MeshGenerator from './MeshGenerator';
import FvdamContent from './Content';

interface HomeViewProps {
  handleFileRead: (file: any) => void;
  nodes: IState<Node[]>;
  materials: IState<Material[]>;
  nodesInfo: IState<NodesInfo>;
  elements: IState<IElement[]>;
  faces: IState<Face[]>;
  results: IState<Results | undefined>;
  handleExecuteFvdam: (core: FvdamCore) => void;
  page: IState<string>;
  parseFile: (fileStr: string) => void;
  elapsedTime: IState<number>;
  pythonStatus: PythonRuntimeStatus;
}
function HomeView({
  handleFileRead,
  nodes,
  materials,
  nodesInfo,
  elements,
  faces,
  results,
  handleExecuteFvdam,
  page,
  parseFile,
  elapsedTime,
  pythonStatus
}: HomeViewProps) {
  const { fvdamFile, setFvdamFile, units, setUnits, setError }: AppContext = useAppContext();
  const [dragging, setDragging] = useState(false);

  // escolher (ou soltar) um arquivo já abre o modelo; antes era escolher e depois clicar em Load
  function openFile(file: File | undefined) {
    if (!file) return;
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension !== 'json' && extension !== 'fvt') {
      setError(`"${file.name}" is not a .json model or a .fvt mesh.`);
      return;
    }
    setFvdamFile(file);
    handleFileRead(file);
  }

  return (
    <div
      className="home"
      onDragOver={(event) => {
        if (event.dataTransfer.types.includes('Files')) {
          event.preventDefault();
          setDragging(true);
        }
      }}
      onDragLeave={(event) => {
        if (event.currentTarget === event.target) setDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        openFile(event.dataTransfer.files?.[0]);
      }}
    >
      <header className="home-header">
        <div className="home-brand">
          <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
            <rect
              x="1"
              y="1"
              width="20"
              height="20"
              fill="none"
              stroke="#7fb2ff"
              strokeWidth="1.5"
            />
            <path d="M1 11H21M11 1V21M6 1V11M16 11V21" stroke="#7fb2ff" strokeWidth="1" />
          </svg>
          <span className="home-title">FVDAM</span>
          <span className="home-subtitle">Finite-volume homogenization</span>
        </div>
        <span className="home-sep" aria-hidden="true" />
        <label className="btn btn-dark home-open">
          <input
            type="file"
            accept=".json,.fvt"
            className="sr-only"
            onChange={(event) => {
              openFile(event.target.files?.[0]);
              event.target.value = '';
            }}
          />
          Open model…
        </label>
        {fvdamFile?.name && (
          <span className="home-file mono" title={fvdamFile.name}>
            {fvdamFile.name}
          </span>
        )}
        <span style={{ flex: 1 }} />
        <label className="home-units">
          <span>Units</span>
          <select
            value={units.id}
            onChange={(event) => {
              const system = UNIT_SYSTEMS.find((option) => option.id === event.target.value);
              if (system) setUnits(system);
            }}
            title="Labels only. FVDAM is unit-free: inputs just need to be consistent."
          >
            {UNIT_SYSTEMS.map((system) => (
              <option key={system.id} value={system.id}>
                {system.label}
              </option>
            ))}
          </select>
        </label>
      </header>
      {dragging && (
        <div className="home-drop" aria-hidden="true">
          Drop a .json model or .fvt mesh to open it
        </div>
      )}
      <MeshGenerator page={page} handleFileRead={handleFileRead} parseFile={parseFile} />
      {page.state === 'fvdam' && (
        <FvdamContent
          materials={materials}
          nodes={nodes}
          elements={elements}
          faces={faces}
          nodesInfo={nodesInfo}
          results={results}
          elapsedTime={elapsedTime}
          handleExecuteFvdam={handleExecuteFvdam}
          pythonStatus={pythonStatus}
        />
      )}
    </div>
  );
}

export default HomeView;
