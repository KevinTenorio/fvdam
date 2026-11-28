// No view fica o que é renderizado pelo componente
// Importa o styles (se tiver) e outros componentes filhos
// É exportado para o controller
import { IMeshGeneratorViewProps, IMeshRegion } from './MeshGenerator.model';
import './MeshGenerator.styles.css';
import Icon from '/src/components/atoms/Icon';
import generateUuid from '/src/commons/generateUuid';
import generateColor from '/src/commons/generateColor';
import NumberField from '/src/components/atoms/NumberField';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppContext } from '/src/app/App.context';
import { AppContext } from '/src/app/App.model';
import { unitSuffix } from '/src/commons/units';

// número curto para resumos (ex.: 4000, 0.15, 12.5)
function short(value: number | null | undefined, digits = 6) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return Number(value.toPrecision(digits)).toString();
}

// Camadas que o usuário liga e desliga no viewport (mesmos campos de stuffToShow)
const LAYERS: { key: string; label: string }[] = [
  { key: 'elements', label: 'Subvolumes' },
  { key: 'elementsIds', label: 'Subvolume IDs' },
  { key: 'regionsMaterials', label: 'Materials' },
  { key: 'regionsLabels', label: 'Regions' },
  { key: 'nodesIds', label: 'Nodes' },
  { key: 'facesIds', label: 'Faces' },
  { key: 'borderFacesIds', label: 'Border faces' },
  { key: 'supports', label: 'Supports' }
];

const SUPPORTS: { value: string; label: string; hint: string }[] = [
  { value: 'none', label: 'None', hint: 'No restrained face (FVDAM needs at least one)' },
  { value: 'central', label: 'Central', hint: 'Restrain a face near the center of the cell' },
  { value: 'border', label: 'Border', hint: 'Restrain faces on the cell border' },
  { value: 'edges', label: 'Edges', hint: 'Restrain faces at the cell edges' }
];

function Section({
  title,
  count,
  children,
  defaultOpen = true
}: {
  title: string;
  count?: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="mg-section">
      <button
        type="button"
        className="mg-section-head"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <span className="mg-chevron" data-open={open}>
          <Icon icon="chevron" color="currentColor" size="14px" />
        </span>
        <span className="eyebrow">{title}</span>
        {count !== undefined && <span className="mg-count mono">{count}</span>}
      </button>
      {open && <div className="mg-section-body">{children}</div>}
    </section>
  );
}

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
  const { units }: AppContext = useAppContext();
  const len = unitSuffix(units.length);
  const stress = unitSuffix(units.stress);

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

  // seleção só da interface: não altera o modelo salvo no .json
  const [openMaterialId, setOpenMaterialId] = useState<string | null>(null);
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [regionQuery, setRegionQuery] = useState('');
  const [regionMaterialFilter, setRegionMaterialFilter] = useState('');
  const faceSupportRef = useRef<HTMLInputElement>(null);

  const selectedRegion = regions.state.find((region) => region.id === selectedRegionId);
  const materialById = useMemo(() => {
    const map: Record<string, (typeof materials.state)[number]> = {};
    materials.state.forEach((material) => (map[material.id] = material));
    return map;
  }, [materials.state]);

  const filteredRegions = useMemo(() => {
    const query = regionQuery.trim().toLowerCase();
    return regions.state.filter(
      (region) =>
        (!query || region.label.toLowerCase().includes(query)) &&
        (!regionMaterialFilter || region.materialId === regionMaterialFilter)
    );
  }, [regions.state, regionQuery, regionMaterialFilter]);

  function updateRegion(id: string, changes: Partial<IMeshRegion>) {
    regions.set(regions.state.map((reg) => (reg.id === id ? { ...reg, ...changes } : reg)));
  }

  function addRegion() {
    if (!unitCellWidth.state || !unitCellHeight.state) return;
    const newRegions = [...regions.state];
    const id = generateUuid();
    newRegions.push({
      id,
      label: 'Region ' + (newRegions.length + 1),
      collapsed: false,
      showMaterialsDropdown: false,
      width: 0,
      height:
        (newRegions[newRegions.length - 1]?.x + newRegions[newRegions.length - 1]?.width >=
          unitCellWidth.state &&
        2 * newRegions[newRegions.length - 1]?.height + newRegions[newRegions.length - 1]?.y >=
          unitCellHeight.state
          ? unitCellHeight.state -
            newRegions[newRegions.length - 1]?.y -
            newRegions[newRegions.length - 1]?.height
          : newRegions[newRegions.length - 1]?.height) || 0,
      x:
        (newRegions[newRegions.length - 1]?.x + newRegions[newRegions.length - 1]?.width >=
        unitCellWidth.state
          ? 0
          : newRegions[newRegions.length - 1]?.x + newRegions[newRegions.length - 1]?.width) || 0,
      y:
        (newRegions[newRegions.length - 1]?.x + newRegions[newRegions.length - 1]?.width >=
        unitCellWidth.state
          ? newRegions[newRegions.length - 1]?.y + newRegions[newRegions.length - 1]?.height
          : newRegions[newRegions.length - 1]?.y) || 0,
      materialId: ''
    });
    regions.set(newRegions);
    setSelectedRegionId(id);
  }

  function duplicateRegion(region: IMeshRegion) {
    if (!unitCellWidth.state || !unitCellHeight.state) return;
    const newRegions = [...regions.state];
    const last = newRegions[newRegions.length - 1];
    const id = generateUuid();
    newRegions.push({
      id,
      label: 'Region ' + (newRegions.length + 1),
      collapsed: true,
      showMaterialsDropdown: false,
      width: region.width || 0,
      height: region.height || 0,
      x: (last?.x + last?.width >= unitCellWidth.state ? 0 : last?.x + last?.width) || 0,
      y: (last?.x + last?.width >= unitCellWidth.state ? last?.y + last?.height : last?.y) || 0,
      materialId: region.materialId || ''
    });
    regions.set(newRegions);
    setSelectedRegionId(id);
  }

  function addMaterial() {
    const newMaterials = [...materials.state];
    const id = generateUuid();
    newMaterials.push({
      id,
      label: 'Material ' + (newMaterials.length + 1),
      color: generateColor(),
      poisson: null,
      young: null,
      collapsed: false
    });
    materials.set(newMaterials);
    setOpenMaterialId(id);
  }

  function updateMaterial(id: string, changes: Partial<(typeof materials.state)[number]>) {
    materials.set(materials.state.map((mat) => (mat.id === id ? { ...mat, ...changes } : mat)));
  }

  const materialOptions = materials.state.map((material) => (
    <option key={material.id} value={material.id}>
      {material.label}
    </option>
  ));

  const meshStats = hasMesh
    ? `${elements.state.length} subvolumes · ${nodes.state.length} nodes · ${faces.state.length} faces · ${supportedFaces.state.length} restrained`
    : 'No mesh yet';

  return (
    <div className="mg">
      <aside className="mg-sidebar" aria-label="Model inputs">
        <Section title="Unit cell">
          <div className="field-row">
            <div className="field">
              <label htmlFor="unitCellWidth">Width{len}</label>
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
            </div>
            <div className="field">
              <label htmlFor="unitCellHeight">Height{len}</label>
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
          </div>
        </Section>

        <Section title="Materials" count={materials.state.length}>
          <div className="mg-list">
            {materials.state.map((material) => {
              const open = openMaterialId === material.id;
              const errors = validation.materialErrors[material.id];
              return (
                <div key={material.id} className="mg-item" data-open={open}>
                  <button
                    type="button"
                    className="mg-item-head"
                    aria-expanded={open}
                    onClick={() => setOpenMaterialId(open ? null : material.id)}
                  >
                    <span className="swatch" style={{ backgroundColor: material.color }} />
                    <span className="mg-item-label">{material.label}</span>
                    <span className="mg-item-meta mono">
                      {errors ? (
                        <span className="field-error">check values</span>
                      ) : (
                        <>
                          <span className="sym">E</span> {short(material.young)} ·{' '}
                          <span className="sym">ν</span> {short(material.poisson)}
                        </>
                      )}
                    </span>
                  </button>
                  {open && (
                    <div className="mg-item-body">
                      <div className="field">
                        <label htmlFor={`material-${material.id}-label`}>Name</label>
                        <input
                          type="text"
                          id={`material-${material.id}-label`}
                          value={material.label}
                          onChange={(event) =>
                            updateMaterial(material.id, { label: event.target.value })
                          }
                        />
                      </div>
                      <div className="field-row">
                        <div className="field">
                          <label htmlFor={`material-${material.id}-young`}>
                            Young <span className="sym">E</span>
                            {stress}
                          </label>
                          <NumberField
                            id={`material-${material.id}-young`}
                            value={material.young}
                            error={errors?.young}
                            onChange={(value) => updateMaterial(material.id, { young: value })}
                          />
                        </div>
                        <div className="field">
                          <label htmlFor={`material-${material.id}-poisson`}>
                            Poisson <span className="sym">ν</span>
                          </label>
                          <NumberField
                            id={`material-${material.id}-poisson`}
                            value={material.poisson}
                            error={errors?.poisson}
                            onChange={(value) => updateMaterial(material.id, { poisson: value })}
                          />
                        </div>
                      </div>
                      <div className="field">
                        <label htmlFor={`material-${material.id}-color`}>Color</label>
                        <div className="mg-inline">
                          <input
                            type="color"
                            id={`material-${material.id}-color`}
                            value={material.color}
                            onChange={(event) =>
                              updateMaterial(material.id, { color: event.target.value })
                            }
                          />
                          <button
                            type="button"
                            className="icon-btn"
                            aria-label="Random color"
                            title="Random color"
                            onClick={() => updateMaterial(material.id, { color: generateColor() })}
                          >
                            <Icon icon="refresh" color="currentColor" size="14px" />
                          </button>
                        </div>
                      </div>
                      <div className="mg-item-actions">
                        <button
                          type="button"
                          className="btn"
                          onClick={() => {
                            materials.set(materials.state.filter((mat) => mat.id !== material.id));
                            setOpenMaterialId(null);
                          }}
                        >
                          <Icon icon="trash" color="currentColor" size="14px" />
                          Delete material
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <button type="button" className="btn btn-block" onClick={addMaterial}>
            + Add material
          </button>
        </Section>

        <Section title="Regions" count={regions.state.length}>
          {regions.state.length > 6 && (
            <div className="field-row">
              <input
                type="text"
                aria-label="Filter regions by name"
                placeholder="Filter by name…"
                value={regionQuery}
                onChange={(event) => setRegionQuery(event.target.value)}
              />
              <select
                aria-label="Filter regions by material"
                value={regionMaterialFilter}
                onChange={(event) => setRegionMaterialFilter(event.target.value)}
              >
                <option value="">All materials</option>
                {materialOptions}
              </select>
            </div>
          )}
          {regions.state.length > 0 && (
            <ul className="mg-region-list" aria-label="Regions">
              {filteredRegions.map((region) => {
                const material = materialById[region.materialId];
                const selected = region.id === selectedRegionId;
                return (
                  <li key={region.id}>
                    <button
                      type="button"
                      className="mg-region-row"
                      aria-pressed={selected}
                      title={region.label}
                      onClick={() => setSelectedRegionId(selected ? null : region.id)}
                    >
                      <span
                        className="swatch"
                        style={{ backgroundColor: material?.color ?? 'transparent' }}
                      />
                      <span className="mg-item-label">{region.label}</span>
                      {validation.regionErrors[region.id] ? (
                        <span className="field-error">no material</span>
                      ) : (
                        <span className="mg-item-meta mono">
                          {short(region.width, 4)}×{short(region.height, 4)}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
              {filteredRegions.length === 0 && (
                <li className="muted" style={{ padding: '6px 8px' }}>
                  No region matches the filter.
                </li>
              )}
            </ul>
          )}

          {selectedRegion && !circle.state.showCircleInputs && (
            <div className="mg-editor" aria-label={`Edit ${selectedRegion.label}`}>
              <div className="mg-editor-head">
                <span className="eyebrow">Selected region</span>
                <div className="mg-inline">
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label={`Duplicate ${selectedRegion.label}`}
                    title="Duplicate region"
                    onClick={() => duplicateRegion(selectedRegion)}
                  >
                    <Icon icon="copy" color="currentColor" size="14px" />
                  </button>
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label={`Delete ${selectedRegion.label}`}
                    title="Delete region"
                    onClick={() => {
                      regions.set(regions.state.filter((reg) => reg.id !== selectedRegion.id));
                      setSelectedRegionId(null);
                    }}
                  >
                    <Icon icon="trash" color="currentColor" size="14px" />
                  </button>
                </div>
              </div>
              <div className="field">
                <label htmlFor={`region-${selectedRegion.id}-label`}>Name</label>
                <input
                  type="text"
                  id={`region-${selectedRegion.id}-label`}
                  value={selectedRegion.label}
                  onChange={(event) =>
                    updateRegion(selectedRegion.id, { label: event.target.value })
                  }
                />
              </div>
              <div className="field">
                <label htmlFor={`region-${selectedRegion.id}-material`}>Material</label>
                <select
                  id={`region-${selectedRegion.id}-material`}
                  value={selectedRegion.materialId}
                  aria-invalid={validation.regionErrors[selectedRegion.id] ? true : undefined}
                  onChange={(event) =>
                    updateRegion(selectedRegion.id, { materialId: event.target.value })
                  }
                >
                  <option value="">Choose…</option>
                  {materialOptions}
                </select>
                {validation.regionErrors[selectedRegion.id] && (
                  <div role="alert" className="field-error">
                    {validation.regionErrors[selectedRegion.id]}
                  </div>
                )}
              </div>
              <div className="field-row">
                <div className="field">
                  <label htmlFor={`region-${selectedRegion.id}-x`}>x₀{len}</label>
                  <NumberField
                    id={`region-${selectedRegion.id}-x`}
                    emptyValue={0}
                    value={selectedRegion.x}
                    onChange={(value) => updateRegion(selectedRegion.id, { x: value ?? 0 })}
                  />
                </div>
                <div className="field">
                  <label htmlFor={`region-${selectedRegion.id}-y`}>y₀{len}</label>
                  <NumberField
                    id={`region-${selectedRegion.id}-y`}
                    emptyValue={0}
                    value={selectedRegion.y}
                    onChange={(value) => updateRegion(selectedRegion.id, { y: value ?? 0 })}
                  />
                </div>
                <div className="field">
                  <label htmlFor={`region-${selectedRegion.id}-width`}>Width{len}</label>
                  <NumberField
                    id={`region-${selectedRegion.id}-width`}
                    emptyValue={0}
                    value={selectedRegion.width}
                    onChange={(newValue) => {
                      let value = newValue ?? 0;
                      if (unitCellWidth.state && selectedRegion.x + value > unitCellWidth.state) {
                        value = unitCellWidth.state - selectedRegion.x;
                      }
                      updateRegion(selectedRegion.id, { width: value });
                    }}
                  />
                </div>
                <div className="field">
                  <label htmlFor={`region-${selectedRegion.id}-height`}>Height{len}</label>
                  <NumberField
                    id={`region-${selectedRegion.id}-height`}
                    emptyValue={0}
                    value={selectedRegion.height}
                    onChange={(value) => updateRegion(selectedRegion.id, { height: value ?? 0 })}
                  />
                </div>
              </div>
            </div>
          )}

          {circle.state.showCircleInputs ? (
            <div className="mg-editor" aria-label="Circular inclusion">
              <div className="mg-editor-head">
                <span className="eyebrow">Circular inclusion</span>
              </div>
              <div className="notice notice-warn">Replaces all current regions.</div>
              <fieldset className="mg-fieldset">
                <legend className="field-label">Subdivision</legend>
                <label className="check">
                  <input
                    type="radio"
                    name="circleType"
                    checked={circle.state.type === 'grid'}
                    onChange={() => circle.set({ ...circle.state, type: 'grid' })}
                  />
                  Grid
                </label>
                <label className="check">
                  <input
                    type="radio"
                    name="circleType"
                    checked={circle.state.type === 'radial'}
                    onChange={() => circle.set({ ...circle.state, type: 'radial' })}
                  />
                  Radial
                </label>
              </fieldset>
              <div className="field-row">
                <div className="field">
                  <label htmlFor="radius">Volume fraction</label>
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
                </div>
                {circle.state.type === 'grid' ? (
                  <div className="field">
                    <label htmlFor="circleDivisions">Divisions</label>
                    <NumberField
                      id="circleDivisions"
                      emptyValue={0}
                      step="1"
                      value={circle.state.circleDivisions}
                      onChange={(value) =>
                        circle.set({ ...circle.state, circleDivisions: value ?? 0 })
                      }
                    />
                  </div>
                ) : (
                  <div className="field">
                    <label htmlFor="edges">Edges</label>
                    <NumberField
                      id="edges"
                      emptyValue={0}
                      step="1"
                      value={circle.state.edges}
                      onChange={(value) => circle.set({ ...circle.state, edges: value ?? 0 })}
                    />
                  </div>
                )}
              </div>
              <div className="field">
                <label htmlFor="circleMaterial">Inclusion material</label>
                <select
                  id="circleMaterial"
                  value={circle.state.circleMaterialId}
                  onChange={(event) =>
                    circle.set({ ...circle.state, circleMaterialId: event.target.value })
                  }
                >
                  <option value="">Choose…</option>
                  {materialOptions}
                </select>
              </div>
              <div className="field">
                <label htmlFor="rectangleMaterial">Matrix material</label>
                <select
                  id="rectangleMaterial"
                  value={circle.state.rectangleMaterialId}
                  onChange={(event) =>
                    circle.set({ ...circle.state, rectangleMaterialId: event.target.value })
                  }
                >
                  <option value="">Choose…</option>
                  {materialOptions}
                </select>
              </div>
              <div className="mg-item-actions">
                <button
                  type="button"
                  className="btn"
                  onClick={() => circle.set({ ...circle.state, showCircleInputs: false })}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
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
                    setSelectedRegionId(null);
                  }}
                >
                  Generate circle
                </button>
              </div>
            </div>
          ) : (
            <div className="field-row">
              <button
                type="button"
                className="btn"
                onClick={addRegion}
                disabled={!unitCellWidth.state || !unitCellHeight.state}
              >
                + Rectangle
              </button>
              <button
                type="button"
                className="btn"
                disabled={
                  !unitCellWidth.state || !unitCellHeight.state || materials.state.length === 0
                }
                onClick={() => circle.set({ ...circle.state, showCircleInputs: true })}
              >
                + Circle…
              </button>
            </div>
          )}
        </Section>

        <Section title="Boundary conditions">
          <fieldset className="mg-fieldset">
            <legend className="field-label">Support</legend>
            {SUPPORTS.map((support) => (
              <label key={support.value} className="check" title={support.hint}>
                <input
                  type="radio"
                  id={`${support.value}Support`}
                  name="support"
                  value={support.value}
                  checked={supportType.state === support.value}
                  onChange={() => {
                    supportType.set(support.value);
                    if (support.value !== 'none') {
                      stuffToShow.set({ ...stuffToShow.state, supports: true });
                    }
                  }}
                />
                {support.label}
              </label>
            ))}
          </fieldset>
          <fieldset className="mg-fieldset">
            <legend className="field-label">Periodicity</legend>
            <label className="check">
              <input
                type="checkbox"
                id="horizontal"
                checked={periodicity.state.horizontal}
                onChange={() =>
                  periodicity.set({
                    ...periodicity.state,
                    horizontal: !periodicity.state.horizontal
                  })
                }
              />
              Horizontal (x₁)
            </label>
            <label className="check">
              <input
                type="checkbox"
                id="vertical"
                checked={periodicity.state.vertical}
                onChange={() =>
                  periodicity.set({ ...periodicity.state, vertical: !periodicity.state.vertical })
                }
              />
              Vertical (x₂)
            </label>
          </fieldset>
        </Section>

        <Section title="Mesh">
          <div className="field-row">
            <div className="field">
              <label htmlFor="maxElemSize">Max size{len}</label>
              <NumberField
                id="maxElemSize"
                emptyValue={0}
                value={maxElemSize.state}
                onChange={(value) => maxElemSize.set(value ?? 0)}
              />
            </div>
            <div className="field">
              <label htmlFor="minElemSize">Min size{len}</label>
              <NumberField
                id="minElemSize"
                emptyValue={0}
                value={minElemSize.state}
                onChange={(value) => minElemSize.set(value ?? 0)}
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor="divisionsByRegion">Divisions per region</label>
            <NumberField
              id="divisionsByRegion"
              emptyValue={1}
              step="1"
              min={1}
              value={divisionsByRegion.state}
              onChange={(value) => divisionsByRegion.set(value || 1)}
            />
          </div>
          <button
            type="button"
            className={meshStale || !hasMesh ? 'btn btn-primary btn-block' : 'btn btn-block'}
            onClick={() => generateMesh()}
            disabled={!unitCellWidth.state || !unitCellHeight.state || regions.state.length === 0}
          >
            {hasMesh ? 'Regenerate mesh' : 'Generate mesh'}
          </button>
          <div className="muted mono" style={{ fontSize: 'var(--text-sm)' }}>
            {meshStale ? 'Out of date · ' : ''}
            {meshStats}
          </div>
        </Section>
      </aside>

      <section className="mg-view" aria-label="Unit cell view">
        <div className="mg-toolbar" role="toolbar" aria-label="View options">
          <span className="mg-toolbar-label">Show</span>
          {LAYERS.map((layer) => {
            const on = (stuffToShow.state as any)[layer.key];
            return (
              <button
                key={layer.key}
                type="button"
                className="mg-chip"
                aria-pressed={on}
                onClick={() => stuffToShow.set({ ...stuffToShow.state, [layer.key]: !on })}
              >
                {layer.label}
              </button>
            );
          })}
          <span style={{ flex: 1 }} />
          <button
            type="button"
            className="icon-btn icon-btn-dark"
            aria-label="Zoom out"
            title="Zoom out"
            onClick={() => extraZoom.set(extraZoom.state / 1.1)}
          >
            <Icon icon="zoom-out" size="16px" color="currentColor" />
          </button>
          <button
            type="button"
            className="icon-btn icon-btn-dark"
            aria-label="Zoom in"
            title="Zoom in"
            onClick={() => extraZoom.set(extraZoom.state * 1.1)}
          >
            <Icon icon="zoom-in" size="16px" color="currentColor" />
          </button>
          <button
            type="button"
            className="icon-btn icon-btn-dark"
            aria-label="Fit to view"
            title="Fit to view"
            onClick={() => extraZoom.set(1)}
          >
            <Icon icon="refresh" size="16px" color="currentColor" />
          </button>
        </div>

        <div ref={viewportRef} className="mg-canvas">
          {meshStale && (
            <div role="status" className="mg-stale">
              The inputs changed after the last mesh. The mesh is out of date.
              <button type="button" className="btn" onClick={() => generateMesh()}>
                Regenerate mesh
              </button>
            </div>
          )}
          {unitCellWidth.state || unitCellHeight.state ? (
            <div
              className="mg-cell"
              style={{
                width: (unitCellWidth.state || 0) * zoom,
                height: (unitCellHeight.state || 0) * zoom
              }}
            >
              {regions.state.map((region) => (
                <div
                  key={region.id}
                  className="mg-region"
                  data-selected={region.id === selectedRegionId}
                  style={{
                    top: region.y * zoom,
                    left: region.x * zoom,
                    width: region.width * zoom,
                    height: region.height * zoom,
                    backgroundColor: materialById[region.materialId]?.color || '#ffffff'
                  }}
                >
                  {(stuffToShow.state.regionsMaterials || stuffToShow.state.regionsLabels) && (
                    <span className="mg-tag">
                      {stuffToShow.state.regionsMaterials &&
                        `${materialById[region.materialId]?.label}`}
                      {stuffToShow.state.regionsMaterials && stuffToShow.state.regionsLabels
                        ? ' · '
                        : ''}
                      {stuffToShow.state.regionsLabels && `${region.label}`}
                    </span>
                  )}
                </div>
              ))}
              {stuffToShow.state.elements &&
                elements.state.length > 0 &&
                elements.state.map((element, index) => {
                  const w = (nodes.state[element[2]][0] - nodes.state[element[3]][0]) * zoom;
                  const h = (nodes.state[element[1]][1] - nodes.state[element[3]][1]) * zoom;
                  // só mostra o número quando cabe no subvolume (evita a mancha em malhas finas)
                  const fits = w >= String(index + 1).length * 6 + 4 && h >= 11;
                  return (
                    <div
                      key={index}
                      className="mg-subvolume"
                      style={{
                        left: nodes.state[element[3]][0] * zoom,
                        top: nodes.state[element[3]][1] * zoom,
                        width: w,
                        height: h
                      }}
                    >
                      {stuffToShow.state.elementsIds && fits && (
                        <span className="mg-id">{index + 1}</span>
                      )}
                    </div>
                  );
                })}
              {stuffToShow.state.nodesIds &&
                nodes.state.length > 0 &&
                nodes.state.map((node, index) => (
                  <div
                    key={index}
                    className="mg-node"
                    style={{ left: node[0] * zoom - 2, top: node[1] * zoom - 2 }}
                  >
                    <span className="mg-id mg-node-id">{index + 1}</span>
                  </div>
                ))}
              {stuffToShow.state.facesIds &&
                faces.state.length > 0 &&
                faces.state.map((face, index) => (
                  <div
                    key={index}
                    className="mg-marker"
                    style={{
                      left:
                        ((nodes.state[face[1]][0] + nodes.state[face[0]][0]) / 2) * zoom -
                        (nodes.state[face[1]][0] === nodes.state[face[0]][0] ? 10 : 0),
                      top:
                        ((nodes.state[face[1]][1] + nodes.state[face[0]][1]) / 2) * zoom -
                        (nodes.state[face[1]][1] === nodes.state[face[0]][1] ? 10 : 0)
                    }}
                  >
                    <span className="mg-id">{correctedFacesIds.state[index] + 1}</span>
                  </div>
                ))}
              {stuffToShow.state.borderFacesIds &&
                faces.state.length > 0 &&
                faces.state.map((face, index) => {
                  let numberOfAppearences = 0;
                  for (let i = 0; i < elementsFaces.state.length; i++) {
                    if (elementsFaces.state[i].includes(index)) numberOfAppearences++;
                  }
                  if (numberOfAppearences !== 1) return null;
                  return (
                    <div
                      key={index}
                      className="mg-marker"
                      style={{
                        left:
                          ((nodes.state[face[1]][0] + nodes.state[face[0]][0]) / 2) * zoom -
                          (nodes.state[face[1]][0] === nodes.state[face[0]][0] ? 10 : 0),
                        top:
                          ((nodes.state[face[1]][1] + nodes.state[face[0]][1]) / 2) * zoom -
                          (nodes.state[face[1]][1] === nodes.state[face[0]][1] ? 10 : 0)
                      }}
                    >
                      <span className="mg-id">{correctedFacesIds.state[index] + 1}</span>
                    </div>
                  );
                })}
              {stuffToShow.state.supports &&
                supportedFaces.state.map((faceIndex) => {
                  const a = nodes.state[faces.state[faceIndex]?.[0]];
                  const b = nodes.state[faces.state[faceIndex]?.[1]];
                  if (!a || !b) return null;
                  const vertical = a[0] === b[0];
                  const x0 = Math.min(a[0], b[0]) * zoom;
                  const y0 = Math.min(a[1], b[1]) * zoom;
                  const length = (vertical ? Math.abs(a[1] - b[1]) : Math.abs(a[0] - b[0])) * zoom;
                  const midX = ((a[0] + b[0]) / 2) * zoom;
                  const midY = ((a[1] + b[1]) / 2) * zoom;
                  // símbolo sempre para fora da célula: em cima, embaixo, à esquerda ou à direita
                  const tol = 1e-9 * Math.max(unitCellWidth.state || 1, unitCellHeight.state || 1);
                  const rotation = vertical
                    ? Math.abs(a[0]) <= tol
                      ? 90
                      : -90
                    : Math.abs(a[1]) <= tol
                    ? 180
                    : 0;
                  return (
                    <div key={faceIndex}>
                      {/* a face restringida, realçada em toda a extensão */}
                      <div
                        className="mg-support-face"
                        style={
                          vertical
                            ? { left: x0 - 2, top: y0, width: 4, height: length }
                            : { left: x0, top: y0 - 2, width: length, height: 4 }
                        }
                      />
                      {/* símbolo de apoio (triângulo com base hachurada), com a ponta no meio da face */}
                      <svg
                        className="mg-support-pin"
                        width="22"
                        height="22"
                        viewBox="0 0 22 22"
                        aria-hidden="true"
                        style={{
                          left: midX - 11,
                          top: midY,
                          transform: rotation ? `rotate(${rotation}deg)` : undefined,
                          transformOrigin: '11px 0px'
                        }}
                      >
                        <path
                          d="M11 1 L3 15 H19 Z"
                          fill="#f0b35a"
                          stroke="#14181f"
                          strokeWidth="1.5"
                        />
                        <path
                          d="M2 18 H20 M4 18 L2 21 M8 18 L6 21 M12 18 L10 21 M16 18 L14 21 M20 18 L18 21"
                          stroke="#f0b35a"
                          strokeWidth="1.5"
                          fill="none"
                        />
                      </svg>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="mg-empty">
              <strong>No unit cell yet</strong>
              <span>Open a .json model or .fvt mesh, or set the cell width and height.</span>
            </div>
          )}
          {(unitCellWidth.state || 0) > 0 && (unitCellHeight.state || 0) > 0 && (
            <div className="mg-dims mono" aria-hidden="true">
              {short(unitCellWidth.state)} × {short(unitCellHeight.state)}
              {units.length ? ` ${units.length}` : ''}
            </div>
          )}
        </div>

        <div className="mg-actionbar">
          <div className="mg-inline">
            <label htmlFor="faceSupport" className="mg-toolbar-label">
              Toggle support on face
            </label>
            <input
              ref={faceSupportRef}
              type="number"
              id="faceSupport"
              min={1}
              style={{ width: '80px' }}
              disabled={!hasMesh}
            />
            <button
              type="button"
              className="btn btn-dark"
              disabled={!hasMesh}
              title="Type a face id (turn on Faces to see them) to add or remove its support"
              onClick={() => {
                const faceIndex = Number(faceSupportRef.current?.value) - 1;
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
              Toggle
            </button>
          </div>
          <span style={{ flex: 1 }} />
          {validation.blockers.length > 0 && (unitCellWidth.state || hasMesh) && (
            <span role="status" className="mg-blocker">
              {validation.blockers[0]}
            </span>
          )}
          <button
            type="button"
            className="btn btn-dark"
            disabled={!unitCellWidth.state || !unitCellHeight.state}
            title="Save the whole model (.json) to open it again later"
            onClick={() => generateJsonFile()}
          >
            Save model (.json)
          </button>
          <button
            type="button"
            className="btn btn-dark"
            disabled={validation.blockers.length > 0}
            title={blockersText || 'Download the mesh as a .fvt file (FVDAM input)'}
            onClick={() => generateFvtFile()}
          >
            Export .fvt
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={validation.blockers.length > 0}
            title={blockersText || 'Send this mesh to the FVDAM solver'}
            onClick={() => sendToFvdam()}
          >
            Send to FVDAM ▸
          </button>
        </div>
      </section>
    </div>
  );
}

export default MeshGeneratorView;
