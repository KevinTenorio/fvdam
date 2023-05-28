// No view fica o que é renderizado pelo componente
// Importa o styles (se tiver) e outros componentes filhos
// É exportado para o controller
import { useAppContext } from '../App.context';
import { AppContext } from '../App.model';
import Upload from '/src/components/atoms/Upload';
import { State } from '/src/index.model';
import { Node, NodesInfo, Material, IElement } from './Home.model';
import './Home.style.css';

interface HomeViewProps {
  handleFileRead: (file: any) => void;
  nodes: State<Node[]>;
  materials: State<Material[]>;
  nodesInfo: State<NodesInfo>;
  elements: State<IElement[]>;
  getPieChartColors: (materials: Material[]) => string;
}
function HomeView({
  handleFileRead,
  nodes,
  materials,
  nodesInfo,
  elements,
  getPieChartColors
}: HomeViewProps) {
  const { setError, fvdamFile, setFvdamFile }: AppContext = useAppContext();

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
            {nodes.state.length > 0 && ( // CONTENT
              <div
                style={{
                  marginTop: '20px',
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'row'
                }}
              >
                <div // UNIT CELL
                  style={{
                    width: '400px',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '15px',
                    backgroundColor: 'rgba(0, 0, 0, 0.08)',
                    border: '1px solid var(--off-white)',
                    marginRight: '20px'
                  }}
                >
                  <div
                    style={{
                      margin: '10px',
                      border: '1px solid var(--off-white)',
                      color: 'white',
                      backgroundColor: 'rgba(0, 0, 0, 0.08)',
                      padding: '10px'
                    }}
                  >
                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Unit Cell</div>
                    <div
                      style={{ paddingLeft: '20px', marginBottom: '5px' }}
                    >{`Materials: ${materials.state.length}`}</div>
                    <div
                      style={{ paddingLeft: '20px', marginBottom: '5px' }}
                    >{`Nodes: ${nodes.state.length}`}</div>
                    <div
                      style={{ paddingLeft: '20px', marginBottom: '5px' }}
                    >{`Elements: ${elements.state.length}`}</div>
                    <div
                      style={{ paddingLeft: '20px', marginBottom: '5px' }}
                    >{`Area: ${elements.state
                      .map((element) => element?.area || 0)
                      .reduce((a, b) => a + b, 0)
                      .toFixed(2)}`}</div>
                    <div style={{ paddingLeft: '20px', marginBottom: '5px' }}>{`Width: ${
                      nodesInfo.state?.maxX - nodesInfo.state?.minX
                    }`}</div>
                    <div style={{ paddingLeft: '20px', marginBottom: '5px' }}>{`Height: ${
                      nodesInfo.state?.maxY - nodesInfo.state?.minY
                    }`}</div>
                  </div>
                  <div
                    style={{
                      margin: '10px',
                      border: '1px solid var(--off-white)',
                      color: 'white',
                      backgroundColor: 'rgba(0, 0, 0, 0.08)',
                      padding: '20px 20px 20px 20px',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}
                  >
                    <div
                      style={{
                        height: '300px',
                        width: '300px',
                        borderRadius: '50%',
                        background: `conic-gradient(${getPieChartColors(materials.state)})`,
                        boxShadow: '0px 0px 5px 0px rgba(0,0,0,0.75)'
                      }}
                    />
                  </div>
                </div>
                <div // MATERIALS
                  style={{
                    width: '300px',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '15px',
                    backgroundColor: 'rgba(0, 0, 0, 0.08)',
                    border: '1px solid var(--off-white)',
                    marginRight: '20px'
                  }}
                >
                  <div
                    style={{
                      fontWeight: 'bold',
                      color: 'white',
                      width: '100%',
                      textAlign: 'center',
                      marginBottom: '10px'
                    }}
                  >
                    Materials
                  </div>
                  {materials.state.map((material) => (
                    <div
                      style={{
                        margin: '10px',
                        border: '1px solid var(--off-white)',
                        color: 'white',
                        backgroundColor: 'rgba(0, 0, 0, 0.08)',
                        padding: '10px'
                      }}
                      key={material.label}
                    >
                      <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                        {material.label}
                      </div>
                      <div
                        style={{ paddingLeft: '20px', marginBottom: '5px' }}
                      >{`Poisson: ${material.poisson}`}</div>
                      <div
                        style={{ paddingLeft: '20px', marginBottom: '5px' }}
                      >{`Young: ${material.young}`}</div>
                      <div
                        style={{ paddingLeft: '20px', marginBottom: '5px' }}
                      >{`Area: ${material.area.toFixed(2)}`}</div>
                      <div style={{ paddingLeft: '20px', marginBottom: '5px' }}>{`Fraction: ${(
                        (material.area * 100) /
                        elements.state
                          .map((element) => element?.area || 0)
                          .reduce((a, b) => a + b, 0)
                      ).toFixed(2)} %`}</div>
                      <div
                        style={{
                          paddingLeft: '20px',
                          marginBottom: '5px',
                          display: 'flex',
                          flexDirection: 'row'
                        }}
                      >
                        {`Color: `}
                        <div
                          style={{
                            paddingLeft: '5px',
                            color: material.color,
                            fontWeight: 'bold'
                          }}
                        >{`${material.color}`}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div // MODEL RENDER
                  style={{
                    flex: '1',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '15px',
                    backgroundColor: 'rgba(0, 0, 0, 0.08)',
                    border: '1px solid var(--off-white)'
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      border: '1px solid var(--off-white)',
                      backgroundColor: 'rgba(0, 0, 0, 0.08)',
                      padding: '10px',
                      position: 'relative',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        transform: 'scale(3)',
                        width: `${nodesInfo.state.maxX - nodesInfo.state.minX}px`,
                        height: `${nodesInfo.state.maxY - nodesInfo.state.minY}px`,
                        boxShadow: '0px 0px 5px 0px rgba(0,0,0,0.75)'
                      }}
                    >
                      {elements.state.map((element) => (
                        <div
                          key={element.id}
                          style={{
                            position: 'absolute',
                            left: `${
                              element.minX + (nodesInfo.state.maxX - nodesInfo.state.minX) / 2
                            }px`,
                            right: `${
                              element.maxX + (nodesInfo.state.maxX - nodesInfo.state.minX) / 2
                            }px`,
                            top: `${
                              element.minY + (nodesInfo.state.maxY - nodesInfo.state.minY) / 2
                            }px`,
                            bottom: `${
                              element.maxY + (nodesInfo.state.maxY - nodesInfo.state.minY) / 2
                            }px`,
                            width: `${element.width}px`,
                            height: `${element.height}px`,
                            backgroundColor: `${element.material.color}`
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div style={{ width: '20px', flex: '1' }} />
          </div>
          <div // FOOTER
            style={{
              color: 'white',
              textAlign: 'center',
              padding: '5px',
              width: '100%',
              height: '30px',
              backgroundColor: 'rgba(0, 0, 0, 0.08)',
              borderTop: '1px solid var(--off-white)',
              marginTop: '20px'
            }}
          >
            App developed by Kevin de Souza
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
