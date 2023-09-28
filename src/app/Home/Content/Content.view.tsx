// No view fica o que é renderizado pelo componente
// Importa o styles (se tiver) e outros componentes filhos
// É exportado para o controller
import { IContentViewProps } from './Content.model';
import './Content.styles.css';
import { useAppContext } from '/src/app/App.context';
import { AppContext } from '/src/app/App.model';

function ContentView({
  materials,
  nodes,
  elements,
  faces,
  nodesInfo,
  results,
  handleExecuteFvdam,
  getPieChartColors,
  elapsedTime,
  meshData
}: IContentViewProps) {
  const { setLoading }: AppContext = useAppContext();
  return (
    <div
      style={{
        marginTop: '20px',
        marginBottom: '20px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div
        style={{
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
              padding: '10px',
              display: 'flex',
              flexDirection: 'row'
            }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Unit Cell</div>
            <div>
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
              >{`Faces: ${faces.state.length}`}</div>
            </div>
            <div>
              <div style={{ paddingLeft: '20px', marginBottom: '5px' }}>{`Constraints: ${
                faces.state.filter(
                  (face) => face.constraints.filter((constraint) => constraint === 1).length > 0
                ).length
              }`}</div>
              <div style={{ paddingLeft: '20px', marginBottom: '5px' }}>{`Area: ${
                (nodesInfo.state?.maxX - nodesInfo.state?.minX) *
                (nodesInfo.state?.maxY - nodesInfo.state?.minY)
              }`}</div>
              <div style={{ paddingLeft: '20px', marginBottom: '5px' }}>{`Width: ${
                nodesInfo.state?.maxX - nodesInfo.state?.minX
              }`}</div>
              <div style={{ paddingLeft: '20px', marginBottom: '5px' }}>{`Height: ${
                nodesInfo.state?.maxY - nodesInfo.state?.minY
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
            width: '100%',
            display: 'flex',
            flexDirection: 'row'
          }}
        >
          <div // MATERIALS
            style={{
              display: 'flex',
              flexDirection: 'column',
              padding: '15px',
              backgroundColor: 'rgba(0, 0, 0, 0.08)',
              border: '1px solid var(--off-white)',
              marginRight: '20px',
              width: '400px'
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

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {materials.state.map((material, materialIndex) => (
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
                  <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{material.label}</div>
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
                    elements.state.map((element) => element?.area || 0).reduce((a, b) => a + b, 0)
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
                        color: meshData.materials[materialIndex].color,
                        fontWeight: 'bold'
                      }}
                    >{`${meshData.materials[materialIndex].color}`}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {results.state ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                marginRight: '20px'
              }}
            >
              <div // RESULTS
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  width: '100%',
                  padding: '15px',
                  backgroundColor: 'rgba(0, 0, 0, 0.08)',
                  border: '1px solid var(--off-white)',
                  marginRight: '20px',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative'
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    bottom: '5px',
                    right: '5px',
                    color: 'white'
                  }}
                >{`Elapsed Time: ${elapsedTime.state.toFixed(0)} ms`}</div>
                <div
                  style={{
                    fontWeight: 'bold',
                    color: 'white',
                    width: '100%',
                    textAlign: 'center',
                    marginBottom: '10px'
                  }}
                >
                  Results
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    width: '100%'
                  }}
                >
                  <div
                    style={{
                      margin: '10px',
                      border: '1px solid var(--off-white)',
                      color: 'white',
                      backgroundColor: 'rgba(0, 0, 0, 0.08)',
                      padding: '10px',
                      flex: '1'
                    }}
                  >
                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                      Effective Stiffness Matrix
                    </div>
                    <div
                      style={{ paddingLeft: '20px', marginBottom: '5px' }}
                      // @ts-ignore
                    >{`C1111: ${results.state.Ch.get([0, 0]).toFixed(2)}`}</div>
                    <div
                      style={{ paddingLeft: '20px', marginBottom: '5px' }}
                      // @ts-ignore
                    >{`C2222: ${results.state.Ch.get([1, 1]).toFixed(2)}`}</div>
                    <div
                      style={{ paddingLeft: '20px', marginBottom: '5px' }}
                      // @ts-ignore
                    >{`C3333: ${results.state.Ch.get([2, 2]).toFixed(2)}`}</div>
                    <div
                      style={{ paddingLeft: '20px', marginBottom: '5px' }}
                      // @ts-ignore
                    >{`C2233: ${results.state.Ch.get([1, 2]).toFixed(2)}`}</div>
                    <div
                      style={{ paddingLeft: '20px', marginBottom: '5px' }}
                      // @ts-ignore
                    >{`C2323: ${results.state.Ch.get([3, 3]).toFixed(2)}`}</div>
                  </div>
                  <div
                    style={{
                      margin: '10px',
                      border: '1px solid var(--off-white)',
                      color: 'white',
                      backgroundColor: 'rgba(0, 0, 0, 0.08)',
                      padding: '20px',
                      flex: '1'
                    }}
                  >
                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                      Young&apos;s Modulus
                    </div>
                    <div
                      style={{ paddingLeft: '20px', marginBottom: '5px' }}
                    >{`E11: ${results.state.E11.toFixed(2)}`}</div>
                    <div
                      style={{ paddingLeft: '20px', marginBottom: '5px' }}
                    >{`E22: ${results.state.E22.toFixed(2)}`}</div>
                    <div
                      style={{ paddingLeft: '20px', marginBottom: '5px' }}
                    >{`E33: ${results.state.E33.toFixed(2)}`}</div>
                  </div>
                  <div
                    style={{
                      margin: '10px',
                      border: '1px solid var(--off-white)',
                      color: 'white',
                      backgroundColor: 'rgba(0, 0, 0, 0.08)',
                      padding: '20px',
                      flex: '1'
                    }}
                  >
                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                      Poisson&apos;s Ratio
                    </div>
                    <div
                      style={{ paddingLeft: '20px', marginBottom: '5px' }}
                    >{`v23: ${results.state.v23.toFixed(4)}`}</div>
                    <div
                      style={{ paddingLeft: '20px', marginBottom: '5px' }}
                    >{`v13: ${results.state.v13.toFixed(4)}`}</div>
                    <div
                      style={{ paddingLeft: '20px', marginBottom: '5px' }}
                    >{`v12: ${results.state.v12.toFixed(4)}`}</div>
                  </div>
                  <div
                    style={{
                      margin: '10px',
                      border: '1px solid var(--off-white)',
                      color: 'white',
                      backgroundColor: 'rgba(0, 0, 0, 0.08)',
                      padding: '20px',
                      flex: '1'
                    }}
                  >
                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Shear Modulus</div>
                    <div
                      style={{ paddingLeft: '20px', marginBottom: '5px' }}
                    >{`G23: ${results.state.G23.toFixed(2)}`}</div>
                    <div
                      style={{ paddingLeft: '20px', marginBottom: '5px' }}
                    >{`G13: ${results.state.G13.toFixed(2)}`}</div>
                    <div
                      style={{ paddingLeft: '20px', marginBottom: '5px' }}
                    >{`G12: ${results.state.G12.toFixed(2)}`}</div>
                  </div>
                </div>
              </div>
              <div // DOWNLOAD BTNS
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  flexDirection: 'row'
                }}
              >
                <button
                  className="button"
                  style={{
                    cursor: 'pointer',
                    backgroundColor: 'rgba(0, 0, 0, 0.08)',
                    border: '1px solid var(--off-white)',
                    color: 'white',
                    padding: '10px',
                    borderRadius: '5px',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    height: '50px',
                    width: '200px',
                    margin: '15px'
                  }}
                  onClick={() => {
                    const data = {
                      // @ts-ignore
                      results: { ...results.state, Ch: results.state.Ch }
                    };
                    const dataStr =
                      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data));
                    const downloadAnchorNode = document.createElement('a');
                    downloadAnchorNode.setAttribute('href', dataStr);
                    downloadAnchorNode.setAttribute('download', 'fvdam.json');
                    document.body.appendChild(downloadAnchorNode);
                    downloadAnchorNode.click();
                    downloadAnchorNode.remove();
                  }}
                >
                  Download Results
                </button>
              </div>
            </div>
          ) : (
            <>
              <div // EXECUTE FVDAM BTN
                style={{
                  width: '100%',
                  flex: '1',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  flexDirection: 'column'
                }}
              >
                <button
                  className="button"
                  style={{
                    cursor: 'pointer',
                    backgroundColor: 'rgba(0, 0, 0, 0.08)',
                    border: '1px solid var(--off-white)',
                    color: 'white',
                    padding: '10px',
                    borderRadius: '5px',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    height: '50px',
                    width: '200px',
                    margin: '15px'
                  }}
                  onClick={() => {
                    setLoading('Executing FVDAM algorithm. This may take a while...');
                    handleExecuteFvdam();
                  }}
                >
                  Execute FVDAM
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ContentView;
