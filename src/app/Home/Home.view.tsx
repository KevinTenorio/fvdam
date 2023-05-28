// No view fica o que é renderizado pelo componente
// Importa o styles (se tiver) e outros componentes filhos
// É exportado para o controller
import { useAppContext } from '../App.context';
import { AppContext } from '../App.model';
import Upload from '/src/components/atoms/Upload';
import { State } from '/src/index.model';
import { Node, NodesInfo, Material, IElement } from './Home.model';

interface HomeViewProps {
  handleFileRead: (file: any) => void;
  nodes: State<Node[]>;
  materials: State<Material[]>;
  nodesInfo: State<NodesInfo | undefined>;
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
            <Upload file={{ state: fvdamFile, set: setFvdamFile }} width="200px" height="50px" />
            {fvdamFile && (
              <button
                style={{ marginTop: '20px', cursor: 'pointer' }}
                onClick={() => handleFileRead(fvdamFile)}
              >
                Start
              </button>
            )}
            {nodes.state.length > 0 && (
              <div
                style={{
                  marginTop: '20px',
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'row'
                }}
              >
                <div
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
                <div
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
                      // @ts-ignore
                      nodesInfo.state?.maxX - nodesInfo.state?.minX
                    }`}</div>
                    <div style={{ paddingLeft: '20px', marginBottom: '5px' }}>{`Height: ${
                      // @ts-ignore
                      nodesInfo.state?.maxY - nodesInfo.state?.minY
                    }`}</div>
                  </div>
                  <div
                    style={{
                      margin: '10px',
                      border: '1px solid var(--off-white)',
                      color: 'white',
                      backgroundColor: 'rgba(0, 0, 0, 0.08)',
                      padding: '20px 20px 5px 0px',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ marginRight: '10px', marginBottom: '20px' }}>{`${
                      // @ts-ignore
                      nodesInfo.state?.maxY - nodesInfo.state?.minY
                    }`}</div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexDirection: 'column'
                      }}
                    >
                      <div
                        style={{
                          width: `${
                            // @ts-ignore
                            ((nodesInfo.state?.maxX - nodesInfo.state?.minX) * 100) /
                            // @ts-ignore
                            (nodesInfo.state?.maxY - nodesInfo.state?.minY)
                          }px`,
                          height: `${
                            // @ts-ignore
                            ((nodesInfo.state?.maxY - nodesInfo.state?.minY) * 100) /
                            // @ts-ignore
                            (nodesInfo.state?.maxY - nodesInfo.state?.minY)
                          }px`,
                          backgroundColor: 'rgb(233, 233, 233)',
                          border: '1px solid var(--off-white)',
                          boxShadow: '0px 0px 5px 0px rgba(0,0,0,0.75)'
                        }}
                      />
                      <div style={{ marginTop: '5px' }}>{`${
                        // @ts-ignore
                        nodesInfo.state?.maxX - nodesInfo.state?.minX
                      }`}</div>
                    </div>
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
                <div
                  style={{
                    flex: '1',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '15px',
                    backgroundColor: 'rgba(0, 0, 0, 0.08)',
                    border: '1px solid var(--off-white)'
                  }}
                ></div>
              </div>
            )}
            <div style={{ width: '20px', flex: '1' }}></div>
          </div>
          <div
            style={{
              color: 'white',
              textAlign: 'center',
              padding: '5px',
              width: '100%',
              height: '30px',
              backgroundColor: 'rgba(0, 0, 0, 0.08)',
              borderTop: '1px solid var(--off-white)'
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