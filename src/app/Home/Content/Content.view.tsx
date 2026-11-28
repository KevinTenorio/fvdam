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
import { unitSuffix } from '/src/commons/units';

const CORE_LABELS: Record<FvdamCore, string> = {
  python: 'Python (in browser)',
  typescript: 'TypeScript'
};

const PYTHON_STATUS_TEXT: Record<PythonRuntimeStatus, string> = {
  loading: 'Downloading the Python runtime in the background…',
  ready: 'Python runtime ready',
  error: 'Python runtime unavailable (will retry when you run)'
};

// Notação de Voigt usada pelo núcleo: 1=11, 2=22, 3=33, 4=23, 5=13, 6=12
const VOIGT = ['11', '22', '33', '23', '13', '12'];

// entradas e resumos: até 6 algarismos significativos
const fmtStiffness = new Intl.NumberFormat('en-US', { maximumSignificantDigits: 6 });
const fmtRatio = new Intl.NumberFormat('en-US', { maximumSignificantDigits: 4 });
// coeficientes de Poisson do resultado: sempre 4 casas
const fmtNu = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 4,
  maximumFractionDigits: 4
});

// Resultados com o mesmo número de casas em toda a tabela, escolhido pela ordem de grandeza
// do maior termo (6 algarismos nele). Funciona em MPa, GPa ou Pa sem perder precisão.
function fixedFormatter(maxAbs: number) {
  const magnitude = maxAbs > 0 ? Math.floor(Math.log10(maxAbs)) : 0;
  const decimals = Math.min(8, Math.max(0, 5 - magnitude));
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

function toMatrix(Ch: any): number[][] {
  const data = typeof Ch?.toArray === 'function' ? Ch.toArray() : Ch?.data ?? Ch;
  return (data as any[][]).map((row) => row.map(Number));
}

function copyText(text: string) {
  if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => undefined);
}

function RunControls({
  onExecute,
  pythonStatus,
  label
}: {
  onExecute: (core: FvdamCore) => void;
  pythonStatus: PythonRuntimeStatus;
  label: string;
}) {
  const { setLoading }: AppContext = useAppContext();
  const [core, setCore] = useState<FvdamCore>('python');
  return (
    <div className="fv-run">
      <div className="field">
        <span className="field-label" id="core-label">
          Solver core
        </span>
        <div className="segmented" role="group" aria-labelledby="core-label">
          {(Object.keys(CORE_LABELS) as FvdamCore[]).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={core === option}
              title={
                option === 'python'
                  ? 'NumPy/SciPy core running in the browser (Pyodide). The first run downloads the Python runtime.'
                  : 'Original TypeScript core (mathjs). Slow for large meshes.'
              }
              onClick={() => setCore(option)}
            >
              {CORE_LABELS[option]}
            </button>
          ))}
        </div>
        {core === 'python' && (
          <span className="fv-status" data-status={pythonStatus}>
            {PYTHON_STATUS_TEXT[pythonStatus]}
          </span>
        )}
        {core === 'typescript' && (
          <span className="fv-status">Runs in a background worker; you can cancel it.</span>
        )}
      </div>
      <button
        type="button"
        className="btn btn-primary btn-lg btn-block"
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
  elapsedTime,
  meshData,
  pythonStatus
}: IContentViewProps) {
  const { units }: AppContext = useAppContext();
  const len = unitSuffix(units.length);
  const stress = unitSuffix(units.stress);
  const area = units.length ? ` (${units.length}²)` : '';

  // a seção da FVDAM abre abaixo do editor de malha: leva o usuário até ela
  // ao enviar uma malha e de novo quando os resultados chegam
  const sectionRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  // rola só na vertical (scrollIntoView também deslocava a página para o lado)
  function scrollToTop(element: HTMLElement | null, onlyIfHidden = false) {
    if (!element) return;
    const rect = element.getBoundingClientRect();
    if (onlyIfHidden && rect.top >= 56 && rect.bottom <= window.innerHeight) return;
    window.scrollTo({ top: window.scrollY + rect.top - 66, behavior: 'smooth' });
  }
  useEffect(() => {
    scrollToTop(sectionRef.current);
  }, [elements.state]);
  useEffect(() => {
    if (results.state) scrollToTop(resultsRef.current, true);
  }, [results.state]);

  const [copied, setCopied] = useState<string | null>(null);
  function copy(what: string, text: string) {
    copyText(text);
    setCopied(what);
    window.setTimeout(() => setCopied(null), 1500);
  }

  const width = nodesInfo.state?.maxX - nodesInfo.state?.minX;
  const height = nodesInfo.state?.maxY - nodesInfo.state?.minY;
  const totalArea = materials.state.reduce((sum, material) => sum + Math.abs(material.area), 0);
  const restrained = faces.state.filter((face) =>
    face.constraints.some((constraint) => constraint === 1)
  ).length;

  const res = results.state;
  const C = res ? toMatrix(res.Ch) : null;
  const maxAbs = C ? Math.max(...C.flat().map(Math.abs)) : 0;
  const isZero = (value: number) => Math.abs(value) <= 1e-9 * maxAbs;
  const fmtC = fixedFormatter(maxAbs);

  const constants = res
    ? [
        {
          name: "Young's modulus",
          unit: stress,
          fmt: fmtC,
          items: [
            ['E₁', res.E11],
            ['E₂', res.E22],
            ['E₃', res.E33]
          ]
        },
        {
          name: 'Shear modulus',
          unit: stress,
          fmt: fmtC,
          items: [
            ['G₂₃', res.G23],
            ['G₁₃', res.G13],
            ['G₁₂', res.G12]
          ]
        },
        {
          name: "Poisson's ratio",
          unit: '',
          symbol: 'ν',
          fmt: fmtNu,
          items: [
            ['ν₂₃', res.v23],
            ['ν₁₃', res.v13],
            ['ν₁₂', res.v12]
          ]
        }
      ]
    : [];

  return (
    <div ref={sectionRef} className="fv" aria-label="FVDAM homogenization">
      <h2 className="fv-heading">Homogenization</h2>
      <div className="fv-grid">
        <section className="panel" aria-labelledby="fv-cell-title">
          <h3 className="panel-title" id="fv-cell-title">
            Unit cell
          </h3>
          <dl className="fv-kv">
            <dt>Size{len}</dt>
            <dd className="mono">
              {fmtStiffness.format(width)} × {fmtStiffness.format(height)}
            </dd>
            <dt>Area{area}</dt>
            <dd className="mono">{fmtStiffness.format(width * height)}</dd>
            <dt>Subvolumes</dt>
            <dd className="mono">{elements.state.length}</dd>
            <dt>Nodes</dt>
            <dd className="mono">{nodes.state.length}</dd>
            <dt>Faces</dt>
            <dd className="mono">{faces.state.length}</dd>
            <dt>Restrained faces</dt>
            <dd className="mono">{restrained}</dd>
          </dl>
        </section>

        <section className="panel fv-wide" aria-labelledby="fv-mat-title">
          <h3 className="panel-title" id="fv-mat-title">
            Phases
          </h3>
          <div
            className="fv-bar"
            role="img"
            aria-label={`Volume fractions: ${materials.state
              .map(
                (material) =>
                  `${material.label} ${((Math.abs(material.area) * 100) / totalArea).toFixed(1)}%`
              )
              .join(', ')}`}
          >
            {materials.state.map((material, index) => (
              <span
                key={material.label + index}
                style={{
                  width: `${(Math.abs(material.area) * 100) / totalArea}%`,
                  backgroundColor: materialColor(meshData, index)
                }}
              />
            ))}
          </div>
          <div className="fv-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Phase</th>
                  <th className="num">
                    <span className="sym">E</span>
                    {stress}
                  </th>
                  <th className="num">
                    <span className="sym">ν</span>
                  </th>
                  <th className="num">Area{area}</th>
                  <th className="num" title="Volume fraction">
                    <span className="sym">V</span>
                    <sub>f</sub>
                  </th>
                </tr>
              </thead>
              <tbody>
                {materials.state.map((material, index) => (
                  <tr key={material.label + index}>
                    <td>
                      <span className="fv-phase">
                        <span
                          className="swatch"
                          style={{ backgroundColor: materialColor(meshData, index) }}
                        />
                        {material.label}
                      </span>
                    </td>
                    <td className="num">{fmtStiffness.format(material.young)}</td>
                    <td className="num">{fmtRatio.format(material.poisson)}</td>
                    <td className="num">{fmtStiffness.format(Math.abs(material.area))}</td>
                    <td className="num">
                      {((Math.abs(material.area) * 100) / totalArea).toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel" aria-labelledby="fv-run-title">
          <h3 className="panel-title" id="fv-run-title">
            Solve
          </h3>
          <RunControls
            onExecute={handleExecuteFvdam}
            pythonStatus={pythonStatus}
            label={res ? 'Run again' : 'Run FVDAM'}
          />
        </section>
      </div>

      {res && C && (
        <div ref={resultsRef} className="fv-grid fv-results">
          <section className="panel fv-wide" aria-labelledby="fv-c-title">
            <h3 className="panel-title" id="fv-c-title">
              Effective stiffness C*
              <small>{units.stress ? `${units.stress}, ` : ''}Voigt notation</small>
              <span style={{ flex: 1 }} />
              <button
                type="button"
                className="btn"
                onClick={() => copy('C', C.map((row) => row.join('\t')).join('\n'))}
                title="Copy the 6×6 matrix (tab-separated, full precision)"
              >
                {copied === 'C' ? 'Copied' : 'Copy matrix'}
              </button>
            </h3>
            <div className="fv-table-wrap">
              <table className="fv-matrix mono">
                <thead>
                  <tr>
                    <th aria-label="Row" />
                    {VOIGT.map((index) => (
                      <th key={index} scope="col">
                        {index}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {C.map((row, i) => (
                    <tr key={i}>
                      <th scope="row">{VOIGT[i]}</th>
                      {row.map((value, j) => (
                        <td
                          key={j}
                          data-diag={i === j}
                          data-zero={isZero(value)}
                          title={`C*${VOIGT[i]}${VOIGT[j]} = ${value}`}
                        >
                          {isZero(value) ? '0' : fmtC.format(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="panel fv-wide" aria-labelledby="fv-eng-title">
            <h3 className="panel-title" id="fv-eng-title">
              Engineering constants
              <span style={{ flex: 1 }} />
              <button
                type="button"
                className="btn"
                title="Copy the constants (tab-separated, full precision)"
                onClick={() =>
                  copy(
                    'eng',
                    constants
                      .flatMap((group) =>
                        group.items.map(([symbol, value]) => `${symbol}\t${value}`)
                      )
                      .join('\n')
                  )
                }
              >
                {copied === 'eng' ? 'Copied' : 'Copy'}
              </button>
            </h3>
            <div className="fv-constants">
              {constants.map((group) => (
                <div key={group.name} className="fv-const-group">
                  <div className="field-label">
                    {group.name}
                    <span className="unit">{group.unit}</span>
                  </div>
                  <dl className="fv-kv">
                    {group.items.map(([symbol, value]) => (
                      <div key={symbol as string} style={{ display: 'contents' }}>
                        <dt>
                          <span className="sym">{(symbol as string).charAt(0)}</span>
                          <sub>{(symbol as string).slice(1)}</sub>
                        </dt>
                        <dd className="mono">{group.fmt.format(value as number)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          </section>

          <section className="panel" aria-labelledby="fv-runinfo-title">
            <h3 className="panel-title" id="fv-runinfo-title">
              Run
            </h3>
            <dl className="fv-kv">
              <dt>Core</dt>
              <dd>{CORE_LABELS[res.core ?? 'typescript']}</dd>
              {res.coreDetails && (
                <>
                  <dt>Details</dt>
                  <dd className="fv-details">{res.coreDetails}</dd>
                </>
              )}
              <dt>Solver time</dt>
              <dd className="mono">{elapsedTime.state.toFixed(0)} ms</dd>
            </dl>
            <button
              type="button"
              className="btn btn-block"
              style={{ marginTop: 'var(--space-3)' }}
              onClick={() => {
                const data = {
                  results: { ...res, Ch: res.Ch }
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
              Download results (.json)
            </button>
          </section>
        </div>
      )}
    </div>
  );
}

export default ContentView;
