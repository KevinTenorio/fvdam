// No view fica o que é renderizado pelo componente
// Importa o styles (se tiver) e outros componentes filhos
// É exportado para o controller
import { useAppContext } from '../App.context';
import { AppContext } from '../App.model';
import Upload from '/src/components/atoms/Upload';
import { IState } from '/src/index.model';
import { Node, NodesInfo, Material, IElement, Face, Results } from './Home.model';
import './Home.style.css';
import Icon from '/src/components/atoms/Icon';
import MeshGenerator from './MeshGenerator';
import FvdamContent from './Content';

interface HomeViewProps {
  handleFileRead: (file: any) => void;
  nodes: IState<Node[]>;
  materials: IState<Material[]>;
  nodesInfo: IState<NodesInfo>;
  elements: IState<IElement[]>;
  faces: IState<Face[]>;
  getPieChartColors: (materials: Material[]) => string;
  results: IState<Results | undefined>;
  handleExecuteFvdam: () => void;
}
function HomeView({
  handleFileRead,
  nodes,
  materials,
  nodesInfo,
  elements,
  faces,
  getPieChartColors,
  results,
  handleExecuteFvdam
}: HomeViewProps) {
  const { setError, fvdamFile, setFvdamFile, setLoading }: AppContext = useAppContext();

  const Content = () => {
    try {
      return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              padding: '20px',
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              flexDirection: 'column'
            }}
          >
            <div // HEADER
              style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center'
              }}
            >
              <div
                style={{
                  marginRight: '20px',
                  marginLeft: '10px',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '22px'
                }}
              >
                FVDAM
              </div>
              <Upload file={{ state: fvdamFile, set: setFvdamFile }} width="200px" height="50px" />
              {fvdamFile && (
                <button
                  className="button"
                  style={{
                    marginLeft: '20px',
                    cursor: 'pointer',
                    backgroundColor: 'rgba(0, 0, 0, 0.08)',
                    border: '1px solid var(--off-white)',
                    color: 'white',
                    padding: '10px',
                    borderRadius: '5px',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    width: '80px'
                  }}
                  onClick={() => handleFileRead(fvdamFile)}
                >
                  Start
                </button>
              )}
            </div>
            <div
              style={{
                marginTop: '20px',
                width: '100%',
                border: '1px solid var(--off-white)'
              }}
            />
            {nodes.state.length > 0 ? ( // CONTENT
              <FvdamContent
                materials={materials}
                nodes={nodes}
                elements={elements}
                faces={faces}
                nodesInfo={nodesInfo}
                results={results}
                handleExecuteFvdam={handleExecuteFvdam}
                getPieChartColors={getPieChartColors}
              />
            ) : (
              <MeshGenerator />
            )}
            <div style={{ height: '20px', width: '100%', color: 'transparent' }}>{'.'}</div>
          </div>
        </div>
      );
    } catch (error) {
      setError(error);
      return <></>;
    }
  };

  return <Content />;
}

export default HomeView;
