// No view fica o que é renderizado pelo componente
// Importa o styles (se tiver) e outros componentes filhos
// É exportado para o controller
import { IContentViewProps } from './Content.model';
import './Content.styles.css';
import { useAppContext } from '/src/app/App.context';
import { AppContext } from '/src/app/App.model';
import { FvdamCore, PythonRuntimeStatus } from '/src/app/Home/Home.model';
import { useEffect, useRef, useState } from 'react';
import materialColor from '/src/commons/materialColor';

const CORE_LABELS: Record<FvdamCore, string> = {
  python: 'Python (in browser)',
  typescript: 'TypeScript'
};

const PYTHON_STATUS_TEXT: Record<PythonRuntimeStatus, string> = {
  loading: 'Python runtime: downloading in the background...',
  ready: 'Python runtime: ready',
  error: 'Python runtime: unavailable (will retry when you execute)'
};

const buttonStyle = {
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
};

function ExecuteControls({
  onExecute,
  pythonStatus,
  label = 'Execute FVDAM'
}: {
  onExecute: (core: FvdamCore) => void;
  pythonStatus: PythonRuntimeStatus;
  label?: string;
}) {
  const { setLoading }: AppContext = useAppContext();
  const [core, setCore] = useState<FvdamCore>('python');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', color: 'white' }}>
        <span style={{ marginRight: '10px', fontWeight: 'bold' }}>Core:</span>
        {(Object.keys(CORE_LABELS) as FvdamCore[]).map((option) => (
          <button
            key={option}
            className="button"
            title={
              option === 'python'
                ? 'NumPy/SciPy core running in the browser (Pyodide). The first run downloads the Python runtime.'
                : 'Original TypeScript core (mathjs). Slow for large meshes.'
            }
            style={{
              cursor: 'pointer',
              backgroundColor: core === option ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.08)',
              border: '1px solid var(--off-white)',
              color: 'white',
              padding: '6px 12px',
              fontWeight: core === option ? 'bold' : 'normal',
              borderRadius: '5px',
              marginRight: '6px'
            }}
            onClick={() => setCore(option)}
          >
            {CORE_LABELS[option]}
          </button>
        ))}
      </div>
      {core === 'python' && (
        <div
          style={{
            color: pythonStatus === 'error' ? '#ffd2d2' : 'white',
            fontSize: '12px',
            marginTop: '6px',
            opacity: pythonStatus === 'ready' ? 0.8 : 1
          }}
        >
          {PYTHON_STATUS_TEXT[pythonStatus]}
        </div>
      )}
      <button
        className="button"
        style={buttonStyle}
        onClick={() => {
          setLoading('Executing FVDAM algorithm. This may take a while...');
          onExecute(core);
        }}
      >
        {label}
      </button>
    </div>
  );
}

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
  meshData,
  pythonStatus
}: IContentViewProps) {
  // a seção da FVDAM abre abaixo do editor de malha: leva o usuário até ela
  // ao enviar uma malha e de novo quando os resultados chegam
  const sectionRef = useRef<HTMLDivElement>(null);
  // rola só na vertical (scrollIntoView também deslocava a página para o lado)
  function scrollToTop(element: HTMLElement | null, onlyIfHidden = false) {
    if (!element) return;
    const rect = element.getBoundingClientRect();
    if (onlyIfHidden && rect.top >= 0 && rect.bottom <= window.innerHeight) return;
    window.scrollTo({ top: window.scrollY + rect.top - 10, behavior: 'smooth' });
  }
  useEffect(() => {
    scrollToTop(sectionRef.current);
  }, [elements.state]);
  useEffect(() => {
    if (results.state) scrollToTop(sectionRef.current, true);
  }, [results.state]);
  return (
    <div
      ref={sectionRef}
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
              >{`Subvolumes: ${elements.state.length}`}</div>
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
                    <span
                      aria-hidden="true"
                      style={{
                        display: 'inline-block',
                        width: '14px',
                        height: '14px',
                        marginLeft: '6px',
                        backgroundColor: materialColor(meshData, materialIndex),
                        border: '1px solid rgba(255, 255, 255, 0.6)'
                      }}
                    />
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
                <div
                  style={{
                    alignSelf: 'flex-start',
                    color: 'white',
                    fontSize: '12px',
                    margin: '0 10px 18px 10px',
                    maxWidth: '75%'
                  }}
                >
                  <span style={{ fontWeight: 'bold' }}>{`Core: ${
                    CORE_LABELS[results.state.core ?? 'typescript']
                  }`}</span>
                  {results.state.coreDetails ? ` — ${results.state.coreDetails}` : ''}
                </div>
              </div>
              <div // DOWNLOAD BTNS
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'flex-end',
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
                <ExecuteControls
                  onExecute={handleExecuteFvdam}
                  pythonStatus={pythonStatus}
                  label="Execute again"
                />
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
                <ExecuteControls onExecute={handleExecuteFvdam} pythonStatus={pythonStatus} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ContentView;
