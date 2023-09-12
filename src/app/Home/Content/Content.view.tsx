// No view fica o que é renderizado pelo componente
// Importa o styles (se tiver) e outros componentes filhos
// É exportado para o controller
import { IContentViewProps } from './Content.model';
import './Content.styles.css';
import Icon from '/src/components/atoms/Icon';
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
  getPieChartColors
}: IContentViewProps) {
  const { setLoading }: AppContext = useAppContext();
  return (
    <div
      style={{
        marginTop: '20px',
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
              <div style={{ paddingLeft: '20px', marginBottom: '5px' }}>{`Area: ${elements.state
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
              className="zoom-btns"
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                display: 'flex',
                flexDirection: 'row'
              }}
            >
              <div
                className="icon"
                style={{ cursor: 'pointer', marginRight: '10px' }}
                onClick={() => {
                  const modelDiv = document.getElementById('model-div');
                  if (modelDiv) {
                    modelDiv.style.transform = `scale(${Math.min(
                      (window.innerWidth - 600) / (nodesInfo.state.maxX - nodesInfo.state.minX),
                      300 / (nodesInfo.state.maxY - nodesInfo.state.minY)
                    )})`;
                  }
                }}
              >
                <Icon icon="refresh" size="18px" color="white" />
              </div>
              <div
                className="icon"
                style={{ cursor: 'pointer', marginRight: '10px' }}
                onClick={() => {
                  const modelDiv = document.getElementById('model-div');
                  if (modelDiv) {
                    const modelDivScale = parseFloat(
                      modelDiv?.style.transform.split('(')[1].split(')')[0]
                    );
                    modelDiv.style.transform = `scale(${modelDivScale / 1.1})`;
                  }
                }}
              >
                <Icon icon="zoom-out" size="18px" color="white" />
              </div>
              <div
                className="icon"
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  const modelDiv = document.getElementById('model-div');
                  if (modelDiv) {
                    const modelDivScale = parseFloat(
                      modelDiv?.style.transform.split('(')[1].split(')')[0]
                    );
                    modelDiv.style.transform = `scale(${modelDivScale * 1.1})`;
                  }
                }}
              >
                <Icon icon="zoom-in" size="18px" color="white" />
              </div>
            </div>
            <div
              id="model-div"
              style={{
                position: 'absolute',
                transform: `scale(${Math.min(
                  (window.innerWidth - 600) / (nodesInfo.state.maxX - nodesInfo.state.minX),
                  300 / (nodesInfo.state.maxY - nodesInfo.state.minY)
                )})`,
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
                    left: `${element.minX + (nodesInfo.state.maxX - nodesInfo.state.minX) / 2}px`,
                    right: `${element.maxX + (nodesInfo.state.maxX - nodesInfo.state.minX) / 2}px`,
                    top: `${element.minY + (nodesInfo.state.maxY - nodesInfo.state.minY) / 2}px`,
                    bottom: `${element.maxY + (nodesInfo.state.maxY - nodesInfo.state.minY) / 2}px`,
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
      <div
        style={{
          marginTop: '20px',
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

          <div style={{ display: 'flex', flexDirection: 'row' }}>
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
                    className="button"
                    style={{
                      paddingLeft: '5px',
                      color: material.color,
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      let color = '';
                      while (color.length < 6) {
                        color = `${Math.floor(Math.random() * 16777215).toString(16)}`;
                      }
                      color = `#${color}`;
                      const newMaterials = [...materials.state];
                      newMaterials[materialIndex] = { ...material, color: color };
                      const newElements = [...elements.state];
                      newElements.forEach((element) => {
                        if (element.material.label === material.label) {
                          element.material.color = color;
                        }
                      });
                      materials.set(newMaterials);
                      elements.set(newElements);
                    }}
                  >{`${material.color}`}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {results.state ? (
          <>
            <div // RESULTS
              style={{
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
                Results
              </div>

              <div style={{ display: 'flex', flexDirection: 'row' }}>
                <div
                  style={{
                    margin: '10px',
                    border: '1px solid var(--off-white)',
                    color: 'white',
                    backgroundColor: 'rgba(0, 0, 0, 0.08)',
                    padding: '10px'
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
                    padding: '20px'
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
                    padding: '20px'
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
                    padding: '20px'
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
                  height: '50px',
                  width: '200px',
                  margin: '15px'
                }}
                onClick={() => {
                  const data = {
                    materials: materials.state.map((material) => ({
                      id: material.id,
                      label: material.label,
                      poisson: material.poisson,
                      young: material.young
                    })),
                    nodes: nodes.state.map((node) => ({
                      id: node.x,
                      x: node.x,
                      y: node.x
                    })),
                    elements: elements.state.map((element) => ({
                      id: element.id,
                      nodes: element.nodes.map((node) => ({
                        id: node.x,
                        x: node.x,
                        y: node.x
                      })),
                      material: {
                        id: element.material.id,
                        label: element.material.label,
                        poisson: element.material.poisson,
                        young: element.material.young
                      }
                    })),
                    faces: faces.state.map((face) => ({
                      id: face.id,
                      constraints: face.constraints,
                      nodes: face.nodes.map((node) => ({
                        id: node.id,
                        x: node.x,
                        y: node.y
                      })),
                      strain: face.strain,
                      force: face.force,
                      dof: face.dof
                    }))
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
                Download Model
              </button>
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
                  height: '50px',
                  width: '200px',
                  margin: '15px'
                }}
                onClick={() => {
                  const data = {
                    materials: materials.state,
                    nodes: nodes.state,
                    elements: elements.state,
                    faces: faces.state,
                    results: results.state
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
                Download All
              </button>
            </div>
          </>
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
  );
}

export default ContentView;
