// No view fica o que é renderizado pelo componente
// Importa o styles (se tiver) e outros componentes filhos
// É exportado para o controller
import { IMeshGeneratorViewProps } from './MeshGenerator.model';
import './MeshGenerator.styles.css';
import Icon from '/src/components/atoms/Icon';
import generateUuid from '/src/commons/generateUuid';
import generateColor from '/src/commons/generateColor';
import NumberField from '/src/components/atoms/NumberField';
import { useEffect, useRef, useState } from 'react';

function MeshGeneratorView({
  unitCellHeight,
  unitCellWidth,
  materials,
  regions,
  nodes,
  faces,
  elementsFaces,
  elements,
  generateMesh,
  stuffToShow,
  divisionsByRegion,
  generateFvtFile,
  generateJsonFile,
  supportType,
  supportedFaces,
  periodicity,
  correctedFacesIds,
  maxElemSize,
  minElemSize,
  extraZoom,
  circle,
  generateCircle,
  meshStale,
  validation,
  sendToFvdam
}: IMeshGeneratorViewProps) {
  // zoom pelo tamanho real do viewport (antes usava a janela inteira)
  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewportSize, setViewportSize] = useState({ width: 600, height: 600 });
  useEffect(() => {
    const element = viewportRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      setViewportSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const zoom =
    0.8 *
    extraZoom.state *
    Math.min(
      viewportSize.width / (unitCellWidth.state || 1),
      viewportSize.height / (unitCellHeight.state || 1)
    );
  const hasMesh = elements.state.length > 0;
  const blockersText = validation.blockers.join('\n');
  return (
    <div
      style={{
        width: '100%',
        // altura mínima em vez de fixa: a coluna de entradas não transborda sobre a seção da FVDAM
        minHeight: 'calc(100vh - 110px)',
        padding: '20px',
        display: 'flex',
        flexShrink: 0
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '200px',
          flexShrink: 0,
          color: 'white'
        }}
      >
        <div // Unit Cell Inputs
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%'
          }}
        >
          <div style={{ fontWeight: 'bold', fontSize: '16px' }}>Define Unit Cell</div>
          <div style={{ height: '10px' }} />
          <label htmlFor="unitCellWidth">Width:</label>
          <NumberField
            id="unitCellWidth"
            min={0}
            value={unitCellWidth.state}
            onChange={(value) => unitCellWidth.set(value)}
            error={
              unitCellWidth.state !== null && unitCellWidth.state <= 0
                ? 'Must be greater than 0.'
                : undefined
            }
          />
          <div style={{ height: '10px' }} />
          <label htmlFor="unitCellHeight">Height:</label>
          <NumberField
            id="unitCellHeight"
            min={0}
            value={unitCellHeight.state}
            onChange={(value) => unitCellHeight.set(value)}
            error={
              unitCellHeight.state !== null && unitCellHeight.state <= 0
                ? 'Must be greater than 0.'
                : undefined
            }
          />
        </div>
        <div style={{ height: '20px' }} />
        <div // Materials
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%'
          }}
        >
          <div style={{ fontWeight: 'bold', fontSize: '16px' }}>Create Materials</div>
          <div style={{ height: '10px' }} />
          {materials.state.length > 0 &&
            materials.state.map((material) => (
              <div
                key={material.id}
                style={{
                  marginBottom: '5px',
                  border: material.collapsed ? 'none' : '1px solid var(--off-white)',
                  width: '100%',
                  padding: material.collapsed ? '0px' : '5px',
                  boxSizing: 'border-box'
                }}
              >
                <div
                  className="materialItem"
                  onClick={() =>
                    materials.set(
                      materials.state.map((mat) =>
                        mat.id === material.id ? { ...mat, collapsed: !mat.collapsed } : mat
                      )
                    )
                  }
                >
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    {material.label}
                    <div
                      style={{
                        width: '14px',
                        height: '14px',
                        backgroundColor: material.color,
                        marginLeft: '5px'
                      }}
                    />
                  </div>

                  <div
                    style={{
                      transform: material.collapsed ? 'rotate(0deg)' : 'rotate(90deg)',
                      width: '21px',
                      height: '21px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Icon icon="chevron" color="white" />
                  </div>
                </div>
                {!material.collapsed && (
                  <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
                    <div style={{ height: '5px' }} />
                    <label htmlFor={`material-${material.id}-label`}>Label:</label>
                    <input
                      type="text"
                      id={`material-${material.id}-label`}
                      name="materialLabel"
                      value={material.label}
                      size={5}
                      onChange={(event) => {
                        materials.set(
                          materials.state.map((mat) =>
                            mat.id === material.id ? { ...mat, label: event.target.value } : mat
                          )
                        );
                      }}
                    />
                    <div style={{ height: '5px' }} />
                    <label htmlFor={`material-${material.id}-young`}>Young:</label>
                    <NumberField
                      id={`material-${material.id}-young`}
                      value={material.young}
                      error={validation.materialErrors[material.id]?.young}
                      onChange={(value) => {
                        materials.set(
                          materials.state.map((mat) =>
                            mat.id === material.id ? { ...mat, young: value } : mat
                          )
                        );
                      }}
                    />
                    <div style={{ height: '5px' }} />
                    <label htmlFor={`material-${material.id}-poisson`}>Poisson:</label>
                    <NumberField
                      id={`material-${material.id}-poisson`}
                      value={material.poisson}
                      error={validation.materialErrors[material.id]?.poisson}
                      onChange={(value) => {
                        materials.set(
                          materials.state.map((mat) =>
                            mat.id === material.id ? { ...mat, poisson: value } : mat
                          )
                        );
                      }}
                    />
                    <div style={{ height: '5px' }} />
                    <label htmlFor={`material-${material.id}-color`}>Color:</label>
                    <input
                      type="color"
                      id={`material-${material.id}-color`}
                      name="materialColor"
                      value={material.color}
                      style={{ width: '100%', height: '28px', padding: 0, cursor: 'pointer' }}
                      onChange={(event) => {
                        materials.set(
                          materials.state.map((mat) =>
                            mat.id === material.id ? { ...mat, color: event.target.value } : mat
                          )
                        );
                      }}
                    />
                    <div style={{ height: '5px' }} />
                    <button
                      type="button"
                      aria-label={`Delete ${material.label}`}
                      title="Delete material"
                      className="zoom-btns icon-btn"
                      style={{ position: 'absolute', top: '5px', right: '0px' }}
                      onClick={() => {
                        materials.set(materials.state.filter((mat) => mat.id !== material.id));
                      }}
                    >
                      <Icon icon="trash" color="white" size="14px" />
                    </button>
                    <button
                      type="button"
                      aria-label="Random color"
                      title="Random color"
                      className="zoom-btns icon-btn"
                      style={{ position: 'absolute', bottom: '38px', left: '45px' }}
                      onClick={() => {
                        materials.set(
                          materials.state.map((mat) =>
                            mat.id === material.id ? { ...mat, color: generateColor() } : mat
                          )
                        );
                      }}
                    >
                      <Icon icon="refresh" color="white" size="14px" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          <button
            style={{ cursor: 'pointer' }}
            onClick={() => {
              const newMaterials = [...materials.state];
              newMaterials.push({
                id: generateUuid(),
                label: 'Material ' + (newMaterials.length + 1),
                color: generateColor(),
                poisson: null,
                young: null,
                collapsed: false
              });
              materials.set(newMaterials);
            }}
          >
            Add Material
          </button>
        </div>
        <div style={{ height: '20px' }} />
        <div // Regions
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%'
          }}
        >
          <div style={{ fontWeight: 'bold', fontSize: '16px' }}>Create Regions</div>
          <div style={{ height: '10px' }} />
          <div style={{ maxHeight: '20vh', overflowY: 'auto' }}>
            {regions.state.length > 0 &&
              !circle.state.showCircleInputs &&
              regions.state.map((region) => (
                <div
                  key={region.id}
                  style={{
                    marginBottom: '5px',
                    border: region.collapsed ? 'none' : '1px solid var(--off-white)',
                    width: '100%',
                    padding: region.collapsed ? '0px' : '5px',
                    boxSizing: 'border-box'
                  }}
                >
                  <div
                    className="materialItem"
                    onClick={() =>
                      regions.set(
                        regions.state.map((reg) =>
                          reg.id === region.id ? { ...reg, collapsed: !reg.collapsed } : reg
                        )
                      )
                    }
                  >
                    {region.label}
                    <div
                      style={{
                        transform: region.collapsed ? 'rotate(0deg)' : 'rotate(90deg)',
                        width: '21px',
                        height: '21px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Icon icon="chevron" color="white" />
                    </div>
                  </div>
                  {!region.collapsed && (
                    <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
                      <div style={{ height: '5px' }} />
                      <label htmlFor={`region-${region.id}-label`}>Label:</label>
                      <input
                        type="text"
                        id={`region-${region.id}-label`}
                        name="regionLabel"
                        value={region.label}
                        size={5}
                        onChange={(event) => {
                          regions.set(
                            regions.state.map((reg) =>
                              reg.id === region.id ? { ...reg, label: event.target.value } : reg
                            )
                          );
                        }}
                      />
                      <div style={{ height: '5px' }} />
                      <label htmlFor={`region-${region.id}-material`}>Material:</label>
                      <select
                        id={`region-${region.id}-material`}
                        value={region.materialId}
                        aria-invalid={validation.regionErrors[region.id] ? true : undefined}
                        onChange={(event) => {
                          regions.set(
                            regions.state.map((reg) =>
                              reg.id === region.id
                                ? { ...reg, materialId: event.target.value }
                                : reg
                            )
                          );
                        }}
                      >
                        <option value="">Choose…</option>
                        {materials.state.map((material) => (
                          <option key={material.id} value={material.id}>
                            {material.label}
                          </option>
                        ))}
                      </select>
                      {validation.regionErrors[region.id] && (
                        <div
                          role="alert"
                          style={{ color: '#ffe0e0', fontSize: '12px', marginTop: '2px' }}
                        >
                          {validation.regionErrors[region.id]}
                        </div>
                      )}
                      <div style={{ height: '5px' }} />
                      <div style={{ display: 'flex' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', width: '48%' }}>
                          <label htmlFor={`region-${region.id}-width`}>Width:</label>
                          <NumberField
                            id={`region-${region.id}-width`}
                            emptyValue={0}
                            value={region.width}
                            onChange={(newValue) => {
                              let value = newValue ?? 0;

                              if (unitCellWidth.state && region.x + value > unitCellWidth.state) {
                                value = unitCellWidth.state - region.x;
                              }
                              regions.set(
                                regions.state.map((reg) =>
                                  reg.id === region.id ? { ...reg, width: value } : reg
                                )
                              );
                            }}
                          />
                        </div>
                        <div style={{ width: '5px' }} />
                        <div style={{ display: 'flex', flexDirection: 'column', width: '48%' }}>
                          <label htmlFor={`region-${region.id}-height`}>Height:</label>
                          <NumberField
                            id={`region-${region.id}-height`}
                            emptyValue={0}
                            value={region.height}
                            onChange={(newValue) => {
                              const value = newValue ?? 0;
                              regions.set(
                                regions.state.map((reg) =>
                                  reg.id === region.id ? { ...reg, height: value } : reg
                                )
                              );
                            }}
                          />
                        </div>
                      </div>
                      <div style={{ height: '5px' }} />

                      <div style={{ display: 'flex' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', width: '48%' }}>
                          <label htmlFor={`region-${region.id}-x`}>X:</label>
                          <NumberField
                            id={`region-${region.id}-x`}
                            emptyValue={0}
                            value={region.x}
                            onChange={(value) => {
                              regions.set(
                                regions.state.map((reg) =>
                                  reg.id === region.id ? { ...reg, x: value ?? 0 } : reg
                                )
                              );
                            }}
                          />
                        </div>
                        <div style={{ width: '5px' }} />
                        <div style={{ display: 'flex', flexDirection: 'column', width: '50%' }}>
                          <label htmlFor={`region-${region.id}-y`}>Y:</label>
                          <NumberField
                            id={`region-${region.id}-y`}
                            emptyValue={0}
                            value={region.y}
                            onChange={(value) => {
                              regions.set(
                                regions.state.map((reg) =>
                                  reg.id === region.id ? { ...reg, y: value ?? 0 } : reg
                                )
                              );
                            }}
                          />
                        </div>
                      </div>

                      <div style={{ height: '5px' }} />
                      <button
                        type="button"
                        aria-label={`Delete ${region.label}`}
                        title="Delete region"
                        className="zoom-btns icon-btn"
                        style={{ position: 'absolute', top: '5px', right: '0px' }}
                        onClick={() => {
                          regions.set(regions.state.filter((reg) => reg.id !== region.id));
                        }}
                      >
                        <Icon icon="trash" color="white" size="14px" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Duplicate ${region.label}`}
                        title="Duplicate region"
                        className="zoom-btns icon-btn"
                        style={{ position: 'absolute', top: '5px', right: '20px' }}
                        onClick={() => {
                          if (
                            !unitCellWidth.state ||
                            !unitCellHeight.state ||
                            !regions.state.find((reg) => reg.id === region.id)
                          )
                            return;
                          const newRegions = [...regions.state];
                          newRegions.push({
                            id: generateUuid(),
                            label: 'Region ' + (newRegions.length + 1),
                            collapsed: true,
                            showMaterialsDropdown: false,
                            width: regions.state.find((reg) => reg.id === region.id)?.width || 0,
                            height: regions.state.find((reg) => reg.id === region.id)?.height || 0,
                            x:
                              (newRegions[newRegions.length - 1]?.x +
                                newRegions[newRegions.length - 1]?.width >=
                              unitCellWidth.state
                                ? 0
                                : newRegions[newRegions.length - 1]?.x +
                                  newRegions[newRegions.length - 1]?.width) || 0,
                            y:
                              (newRegions[newRegions.length - 1]?.x +
                                newRegions[newRegions.length - 1]?.width >=
                              unitCellWidth.state
                                ? newRegions[newRegions.length - 1]?.y +
                                  newRegions[newRegions.length - 1]?.height
                                : newRegions[newRegions.length - 1]?.y) || 0,
                            materialId:
                              regions.state.find((reg) => reg.id === region.id)?.materialId || ''
                          });
                          regions.set(newRegions);
                        }}
                      >
                        <Icon icon="copy" color="white" size="14px" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
          </div>
          <div style={{ height: '5px' }} />
          {!circle.state.showCircleInputs && (
            <button
              style={{ cursor: 'pointer' }}
              disabled={
                !unitCellWidth.state || !unitCellHeight.state || materials.state.length === 0
              }
              onClick={() => {
                circle.set({ ...circle.state, showCircleInputs: true });
              }}
            >
              Add Circle
            </button>
          )}

          {circle.state.showCircleInputs && (
            <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
              <div style={{ display: 'flex' }}>
                <div style={{ display: 'flex', flexDirection: 'row', width: '48%' }}>
                  <label htmlFor="gridRadio">Grid:</label>
                  <input
                    type="radio"
                    id="gridRadio"
                    name="circleType"
                    checked={circle.state.type === 'grid'}
                    onChange={() => {
                      circle.set({
                        ...circle.state,
                        type: circle.state.type === 'grid' ? 'radial' : 'grid'
                      });
                    }}
                  />
                </div>
                <div style={{ width: '5px' }} />
                <div style={{ display: 'flex', flexDirection: 'row', width: '50%' }}>
                  <label htmlFor="radialRadio">Radial:</label>
                  <input
                    type="radio"
                    id="radialRadio"
                    name="circleType"
                    checked={circle.state.type === 'radial'}
                    onChange={() => {
                      circle.set({
                        ...circle.state,
                        type: circle.state.type === 'radial' ? 'grid' : 'radial'
                      });
                    }}
                  />
                </div>
              </div>
              <div style={{ height: '5px' }} />
              <label htmlFor="radius">Fraction:</label>
              <NumberField
                id="radius"
                emptyValue={0}
                value={circle.state.fraction}
                onChange={(newValue) => {
                  const value = newValue ?? 0;
                  circle.set({
                    ...circle.state,
                    radius:
                      Math.sqrt(value / Math.PI) *
                      Math.min(unitCellHeight.state || 0, unitCellWidth.state || 0),
                    fraction: value
                  });
                }}
              />
              {circle.state.type === 'grid' ? (
                <>
                  <div style={{ height: '5px' }} />
                  <label htmlFor="circleDivisions">Division:</label>
                  <NumberField
                    id="circleDivisions"
                    emptyValue={0}
                    step="1"
                    value={circle.state.circleDivisions}
                    onChange={(value) => {
                      circle.set({ ...circle.state, circleDivisions: value ?? 0 });
                    }}
                  />
                </>
              ) : (
                <>
                  <div style={{ height: '5px' }} />
                  <label htmlFor="edges">Edges:</label>
                  <NumberField
                    id="edges"
                    emptyValue={0}
                    step="1"
                    value={circle.state.edges}
                    onChange={(value) => {
                      circle.set({ ...circle.state, edges: value ?? 0 });
                    }}
                  />
                </>
              )}

              <div style={{ height: '5px' }} />
              <label htmlFor="circleMaterial">Circle Material:</label>
              <select
                id="circleMaterial"
                value={circle.state.circleMaterialId}
                onChange={(event) => {
                  circle.set({ ...circle.state, circleMaterialId: event.target.value });
                }}
              >
                <option value="">Choose…</option>
                {materials.state.map((material) => (
                  <option key={material.id} value={material.id}>
                    {material.label}
                  </option>
                ))}
              </select>
              <div style={{ height: '5px' }} />
              <label htmlFor="rectangleMaterial">Rectangle Material:</label>
              <select
                id="rectangleMaterial"
                value={circle.state.rectangleMaterialId}
                onChange={(event) => {
                  circle.set({ ...circle.state, rectangleMaterialId: event.target.value });
                }}
              >
                <option value="">Choose…</option>
                {materials.state.map((material) => (
                  <option key={material.id} value={material.id}>
                    {material.label}
                  </option>
                ))}
              </select>
              <div style={{ height: '10px' }} />
              <button
                style={{ cursor: 'pointer' }}
                disabled={
                  !circle.state.circleMaterialId ||
                  !circle.state.rectangleMaterialId ||
                  !(circle.state.fraction > 0) ||
                  (circle.state.type === 'grid'
                    ? !(circle.state.circleDivisions > 0)
                    : !(circle.state.edges > 0))
                }
                title="Replaces all regions with a circle inclusion"
                onClick={() => {
                  generateCircle();
                }}
              >
                Generate Circle
              </button>
              <div style={{ height: '5px' }} />
              <button
                type="button"
                style={{ cursor: 'pointer' }}
                onClick={() => circle.set({ ...circle.state, showCircleInputs: false })}
              >
                Back to regions
              </button>
            </div>
          )}

          <div style={{ height: '5px' }} />
          {!circle.state.showCircleInputs && (
            <button
              style={{ cursor: 'pointer' }}
              onClick={() => {
                if (!unitCellWidth.state || !unitCellHeight.state) return;
                const newRegions = [...regions.state];
                newRegions.push({
                  id: generateUuid(),
                  label: 'Region ' + (newRegions.length + 1),
                  collapsed: false,
                  showMaterialsDropdown: false,
                  width: 0,
                  height:
                    (newRegions[newRegions.length - 1]?.x +
                      newRegions[newRegions.length - 1]?.width >=
                      unitCellWidth.state &&
                    2 * newRegions[newRegions.length - 1]?.height +
                      newRegions[newRegions.length - 1]?.y >=
                      unitCellHeight.state
                      ? unitCellHeight.state -
                        newRegions[newRegions.length - 1]?.y -
                        newRegions[newRegions.length - 1]?.height
                      : newRegions[newRegions.length - 1]?.height) || 0,
                  x:
                    (newRegions[newRegions.length - 1]?.x +
                      newRegions[newRegions.length - 1]?.width >=
                    unitCellWidth.state
                      ? 0
                      : newRegions[newRegions.length - 1]?.x +
                        newRegions[newRegions.length - 1]?.width) || 0,
                  y:
                    (newRegions[newRegions.length - 1]?.x +
                      newRegions[newRegions.length - 1]?.width >=
                    unitCellWidth.state
                      ? newRegions[newRegions.length - 1]?.y +
                        newRegions[newRegions.length - 1]?.height
                      : newRegions[newRegions.length - 1]?.y) || 0,
                  materialId: ''
                });
                regions.set(newRegions);
              }}
              disabled={!unitCellWidth.state || !unitCellHeight.state}
            >
              Add Region
            </button>
          )}
        </div>
        <div style={{ height: '20px' }} />
        <div // Supports
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%'
          }}
        >
          <div style={{ fontWeight: 'bold', fontSize: '16px' }}>Add Supports</div>
          <div style={{ height: '10px' }} />
          <div>
            <input
              type="radio"
              id="noSupport"
              name="support"
              value="none"
              style={{ cursor: 'pointer' }}
              checked={supportType.state === 'none'}
              onChange={() => supportType.set('none')}
            />
            <label htmlFor="noSupport">None</label>
          </div>
          <div>
            <input
              type="radio"
              id="centralSupport"
              name="support"
              value="central"
              style={{ cursor: 'pointer' }}
              checked={supportType.state === 'central'}
              onChange={() => {
                supportType.set('central');
                stuffToShow.set({ ...stuffToShow.state, supports: true });
              }}
            />
            <label htmlFor="centralSupport">Central</label>
          </div>
          <div>
            <input
              type="radio"
              id="borderSupport"
              name="support"
              value="border"
              style={{ cursor: 'pointer' }}
              checked={supportType.state === 'border'}
              onChange={() => {
                supportType.set('border');
                stuffToShow.set({ ...stuffToShow.state, supports: true });
              }}
            />
            <label htmlFor="borderSupport">Border</label>
          </div>
          <div>
            <input
              type="radio"
              id="edgesSupport"
              name="support"
              value="edges"
              style={{ cursor: 'pointer' }}
              checked={supportType.state === 'edges'}
              onChange={() => {
                supportType.set('edges');
                stuffToShow.set({ ...stuffToShow.state, supports: true });
              }}
            />
            <label htmlFor="edgesSupport">Edges</label>
          </div>
        </div>
        <div style={{ height: '20px' }} />
        <div // Periodicity
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%'
          }}
        >
          <div style={{ fontWeight: 'bold', fontSize: '16px' }}>Set Periodicity</div>
          <div style={{ height: '10px' }} />
          <div>
            <input
              type="checkbox"
              id="horizontal"
              name="periodicity"
              checked={periodicity.state.horizontal}
              onChange={() => {
                periodicity.set({
                  ...periodicity.state,
                  horizontal: !periodicity.state.horizontal
                });
              }}
            />
            <label htmlFor="horizontal">Horizontal</label>
          </div>
          <div>
            <input
              type="checkbox"
              id="vertical"
              name="periodicity"
              checked={periodicity.state.vertical}
              onChange={() => {
                periodicity.set({
                  ...periodicity.state,
                  vertical: !periodicity.state.vertical
                });
              }}
            />
            <label htmlFor="vertical">Vertical</label>
          </div>
        </div>
        <div style={{ flex: '1' }} />
        <div style={{ height: '20px' }} />
        <label htmlFor="maxElemSize">Max Subvolume Size:</label>
        <NumberField
          id="maxElemSize"
          emptyValue={0}
          value={maxElemSize.state}
          onChange={(value) => maxElemSize.set(value ?? 0)}
        />
        <div style={{ height: '5px' }} />
        <label htmlFor="minElemSize">Min Subvolume Size:</label>
        <NumberField
          id="minElemSize"
          emptyValue={0}
          value={minElemSize.state}
          onChange={(value) => minElemSize.set(value ?? 0)}
        />
        <div style={{ height: '5px' }} />
        <label htmlFor="divisionsByRegion">Divisions:</label>
        <NumberField
          id="divisionsByRegion"
          emptyValue={1}
          step="1"
          min={1}
          value={divisionsByRegion.state}
          onChange={(value) => divisionsByRegion.set(value || 1)}
        />
        <div style={{ height: '15px' }} />
        <button
          style={{ cursor: 'pointer' }}
          onClick={() => {
            generateMesh();
          }}
          disabled={!unitCellWidth.state || !unitCellHeight.state || regions.state.length === 0}
        >
          Generate Mesh
        </button>
      </div>
      <div style={{ width: '20px' }} />
      <div style={{ border: '1px solid var(--off-white)' }} />
      <div style={{ width: '20px' }} />
      <div // Mesh
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          color: 'white',
          alignItems: 'center'
        }}
      >
        <div style={{ fontWeight: 'bold', fontSize: '18px' }}>Mesh</div>
        <div
          style={{
            marginTop: '10px',
            padding: '15px',
            height: '100%',
            width: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.08)',
            border: '1px solid var(--off-white)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div
            ref={viewportRef}
            style={{
              height: '100%',
              width: '100%',
              minHeight: '420px',
              backgroundColor: 'rgba(0, 0, 0, 0.08)',
              border: '1px solid var(--off-white)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {meshStale && (
              <div
                role="status"
                style={{
                  position: 'absolute',
                  top: '10px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 2,
                  background: '#3a2f1c',
                  color: '#f6d9a8',
                  border: '1px solid #6b5426',
                  borderRadius: '4px',
                  padding: '6px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                The inputs changed after the last mesh. The mesh is out of date.
                <button type="button" style={{ cursor: 'pointer' }} onClick={() => generateMesh()}>
                  Regenerate mesh
                </button>
              </div>
            )}
            <div // Zoom Buttons
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
                  extraZoom.set(1);
                }}
              >
                <Icon icon="refresh" size="18px" color="white" />
              </div>
              <div
                className="icon"
                style={{ cursor: 'pointer', marginRight: '10px' }}
                onClick={() => {
                  extraZoom.set(extraZoom.state / 1.1);
                }}
              >
                <Icon icon="zoom-out" size="18px" color="white" />
              </div>
              <div
                className="icon"
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  extraZoom.set(extraZoom.state * 1.1);
                }}
              >
                <Icon icon="zoom-in" size="18px" color="white" />
              </div>
            </div>
            {unitCellWidth.state || unitCellHeight.state ? (
              <div
                style={{
                  width: (unitCellWidth.state || 0) * zoom,
                  height: (unitCellHeight.state || 0) * zoom,
                  border: '1px solid white',
                  boxSizing: 'content-box',
                  position: 'relative'
                }}
              >
                {regions.state.map((region) => (
                  <div
                    key={region.id}
                    style={{
                      position: 'absolute',
                      top: region.y * zoom,
                      left: region.x * zoom,
                      width: region.width * zoom,
                      height: region.height * zoom,
                      backgroundColor:
                        materials.state.find((mat) => mat.id === region.materialId)?.color ||
                        'white',
                      border: region.collapsed ? '1px solid var(--off-white)' : '1px dashed white',
                      boxSizing: 'border-box',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <div style={{ fontWeight: 'bold' }}>
                        {stuffToShow.state.regionsMaterials &&
                          `${materials.state.find((mat) => mat.id === region.materialId)?.label}`}
                        {stuffToShow.state.regionsLabels && `${region.label}`}
                      </div>
                    </div>
                  </div>
                ))}
                {stuffToShow.state.elements &&
                  elements.state.length > 0 &&
                  elements.state.map((element, index) => (
                    <div
                      key={index}
                      style={{
                        position: 'absolute',
                        boxSizing: 'border-box',
                        left: nodes.state[element[3]][0] * zoom,
                        top: nodes.state[element[3]][1] * zoom,
                        width: (nodes.state[element[2]][0] - nodes.state[element[3]][0]) * zoom,
                        height: (nodes.state[element[1]][1] - nodes.state[element[3]][1]) * zoom,
                        // right: nodes.state[element[2]][0],
                        // bottom: nodes.state[element[2]][1],
                        border: '1px solid white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <div style={{ fontSize: '8px' }}>
                          {stuffToShow.state.elementsIds && index + 1}
                        </div>
                      </div>
                    </div>
                  ))}
                {stuffToShow.state.nodesIds &&
                  nodes.state.length > 0 &&
                  nodes.state.map((node, index) => (
                    <div
                      key={index}
                      style={{
                        position: 'absolute',
                        boxSizing: 'border-box',
                        left: node[0] * zoom - 2,
                        top: node[1] * zoom - 2,
                        width: '4px',
                        height: '4px',
                        backgroundColor: 'white',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative',
                          top: '-10px',
                          left: '-10px'
                        }}
                      >
                        <div style={{ fontSize: '8px' }}>
                          {stuffToShow.state.nodesIds && index + 1}
                        </div>
                      </div>
                    </div>
                  ))}
                {stuffToShow.state.facesIds &&
                  faces.state.length > 0 &&
                  faces.state.map((face, index) => (
                    <div
                      key={index}
                      style={{
                        position: 'absolute',
                        boxSizing: 'border-box',
                        left:
                          ((nodes.state[face[1]][0] + nodes.state[face[0]][0]) / 2) * zoom -
                          (nodes.state[face[1]][0] === nodes.state[face[0]][0] ? 10 : 0),
                        top:
                          ((nodes.state[face[1]][1] + nodes.state[face[0]][1]) / 2) * zoom -
                          (nodes.state[face[1]][1] === nodes.state[face[0]][1] ? 10 : 0),
                        width: '4px',
                        height: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative'
                        }}
                      >
                        <div style={{ fontSize: '8px' }}>{correctedFacesIds.state[index] + 1}</div>
                      </div>
                    </div>
                  ))}
                {stuffToShow.state.borderFacesIds &&
                  faces.state.length > 0 &&
                  faces.state.map((face, index) => {
                    let numberOfAppearences = 0;
                    for (let i = 0; i < elementsFaces.state.length; i++) {
                      const elementFace = elementsFaces.state[i];
                      if (elementFace.includes(index)) {
                        numberOfAppearences++;
                      }
                    }
                    if (numberOfAppearences === 1) {
                      return (
                        <div
                          key={index}
                          style={{
                            position: 'absolute',
                            boxSizing: 'border-box',
                            left:
                              ((nodes.state[face[1]][0] + nodes.state[face[0]][0]) / 2) * zoom -
                              (nodes.state[face[1]][0] === nodes.state[face[0]][0] ? 10 : 0),
                            top:
                              ((nodes.state[face[1]][1] + nodes.state[face[0]][1]) / 2) * zoom -
                              (nodes.state[face[1]][1] === nodes.state[face[0]][1] ? 10 : 0),
                            width: '4px',
                            height: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              position: 'relative'
                            }}
                          >
                            <div style={{ fontSize: '8px' }}>
                              {correctedFacesIds.state[index] + 1}
                            </div>
                          </div>
                        </div>
                      );
                    } else {
                      return <></>;
                    }
                  })}
                {stuffToShow.state.supports &&
                  supportedFaces.state.map((faceIndex) => (
                    <div
                      key={faceIndex}
                      style={{
                        position: 'absolute',
                        boxSizing: 'border-box',
                        left:
                          ((nodes.state[faces.state[faceIndex][1]][0] +
                            nodes.state[faces.state[faceIndex][0]][0]) /
                            2) *
                            zoom -
                          (nodes.state[faces.state[faceIndex][1]][0] ===
                          nodes.state[faces.state[faceIndex][0]][0]
                            ? 2
                            : 0),
                        top:
                          ((nodes.state[faces.state[faceIndex][1]][1] +
                            nodes.state[faces.state[faceIndex][0]][1]) /
                            2) *
                            zoom -
                          (nodes.state[faces.state[faceIndex][1]][1] ===
                          nodes.state[faces.state[faceIndex][0]][1]
                            ? 2
                            : 0),
                        width: '4px',
                        transform: `rotate(${
                          nodes.state[faces.state[faceIndex][1]][0] ===
                          nodes.state[faces.state[faceIndex][0]][0]
                            ? 270
                            : 0
                        }deg)`,
                        height: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative'
                        }}
                      >
                        <Icon icon="support" color="white" />
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <>No data.</>
            )}
            <div style={{ position: 'absolute', top: '5px', left: '5px' }}>
              <div // Filter Visualization
                style={{ display: 'flex', justifyContent: 'start', alignItems: 'center' }}
              >
                <input
                  type="checkbox"
                  id="elements"
                  name="elements"
                  checked={stuffToShow.state.elements}
                  onChange={() => {
                    stuffToShow.set({
                      ...stuffToShow.state,
                      elements: !stuffToShow.state.elements
                    });
                  }}
                />
                <label htmlFor="elements">Subvolumes</label>
              </div>
              <div style={{ display: 'flex', justifyContent: 'start', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  id="elementsIds"
                  name="elementsIds"
                  checked={stuffToShow.state.elementsIds}
                  onChange={() => {
                    stuffToShow.set({
                      ...stuffToShow.state,
                      elementsIds: !stuffToShow.state.elementsIds
                    });
                  }}
                />
                <label htmlFor="elementsIds">Subvolume Ids</label>
              </div>
              <div style={{ display: 'flex', justifyContent: 'start', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  id="regionsMaterials"
                  name="regionsMaterials"
                  checked={stuffToShow.state.regionsMaterials}
                  onChange={() => {
                    stuffToShow.set({
                      ...stuffToShow.state,
                      regionsMaterials: !stuffToShow.state.regionsMaterials
                    });
                  }}
                />
                <label htmlFor="regionsMaterials">Materials</label>
              </div>
              <div style={{ display: 'flex', justifyContent: 'start', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  id="regionsLabels"
                  name="regionsLabels"
                  checked={stuffToShow.state.regionsLabels}
                  onChange={() => {
                    stuffToShow.set({
                      ...stuffToShow.state,
                      regionsLabels: !stuffToShow.state.regionsLabels
                    });
                  }}
                />
                <label htmlFor="regionsLabels">Regions</label>
              </div>
              <div style={{ display: 'flex', justifyContent: 'start', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  id="nodesIds"
                  name="nodesIds"
                  checked={stuffToShow.state.nodesIds}
                  onChange={() => {
                    stuffToShow.set({
                      ...stuffToShow.state,
                      nodesIds: !stuffToShow.state.nodesIds
                    });
                  }}
                />
                <label htmlFor="nodesIds">Nodes</label>
              </div>
              <div style={{ display: 'flex', justifyContent: 'start', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  id="facesIds"
                  name="facesIds"
                  checked={stuffToShow.state.facesIds}
                  onChange={() => {
                    stuffToShow.set({
                      ...stuffToShow.state,
                      facesIds: !stuffToShow.state.facesIds
                    });
                  }}
                />
                <label htmlFor="facesIds">Faces</label>
              </div>
              <div style={{ display: 'flex', justifyContent: 'start', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  id="borderFacesIds"
                  name="borderFacesIds"
                  checked={stuffToShow.state.borderFacesIds}
                  onChange={() => {
                    stuffToShow.set({
                      ...stuffToShow.state,
                      borderFacesIds: !stuffToShow.state.borderFacesIds
                    });
                  }}
                />
                <label htmlFor="borderFacesIds">Border Faces</label>
              </div>
              <div style={{ display: 'flex', justifyContent: 'start', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  id="supports"
                  name="supports"
                  checked={stuffToShow.state.supports}
                  onChange={() => {
                    stuffToShow.set({
                      ...stuffToShow.state,
                      supports: !stuffToShow.state.supports
                    });
                  }}
                />
                <label htmlFor="supports">Supports</label>
              </div>
            </div>
            <div
              style={{
                position: 'absolute',
                bottom: '5px',
                right: '5px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'end'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <label htmlFor="faceSupport">Edit Face Support:</label>
                <div style={{ width: '5px' }} />
                <input
                  type="number"
                  id="faceSupport"
                  name="faceSupport"
                  min={1}
                  style={{ width: '70px' }}
                />
                <div style={{ width: '5px' }} />
                <button
                  style={{ cursor: 'pointer' }}
                  disabled={!hasMesh}
                  title="Type a face id (turn on Faces to see them) to add or remove its support"
                  onClick={() => {
                    const faceIndex =
                      Number((document.getElementById('faceSupport') as HTMLInputElement).value) -
                      1;
                    if (faceIndex < 0 || faceIndex >= faces.state.length) return;
                    const newSupportedFaces = [...supportedFaces.state];
                    if (newSupportedFaces.includes(faceIndex)) {
                      newSupportedFaces.splice(newSupportedFaces.indexOf(faceIndex), 1);
                    } else {
                      newSupportedFaces.push(faceIndex);
                    }
                    supportedFaces.set(newSupportedFaces);
                  }}
                >
                  Change
                </button>
              </div>
              <div style={{ height: '10px' }} />
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <button
                  style={{ cursor: 'pointer' }}
                  disabled={validation.blockers.length > 0}
                  title={blockersText || 'Download the mesh as a .fvt file (FVDAM input)'}
                  onClick={() => {
                    generateFvtFile();
                  }}
                >
                  Export .fvt
                </button>
                <div style={{ width: '5px' }} />
                <button
                  style={{ cursor: 'pointer' }}
                  disabled={!unitCellWidth.state || !unitCellHeight.state}
                  title="Save the whole model (.json) to open it again later"
                  onClick={() => {
                    generateJsonFile();
                  }}
                >
                  Save model (.json)
                </button>
                <div style={{ width: '15px' }} />
                <button
                  style={{ cursor: 'pointer', fontWeight: 'bold' }}
                  disabled={validation.blockers.length > 0}
                  title={blockersText || 'Send this mesh to the FVDAM solver'}
                  onClick={() => {
                    sendToFvdam();
                  }}
                >
                  Send to FVDAM ▸
                </button>
              </div>
              {validation.blockers.length > 0 && (unitCellWidth.state || hasMesh) && (
                <div
                  role="status"
                  style={{
                    marginTop: '6px',
                    fontSize: '12px',
                    color: '#fff',
                    maxWidth: '420px',
                    textAlign: 'right'
                  }}
                >
                  {validation.blockers[0]}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MeshGeneratorView;
