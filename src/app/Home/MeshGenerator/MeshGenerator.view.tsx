// No view fica o que é renderizado pelo componente
// Importa o styles (se tiver) e outros componentes filhos
// É exportado para o controller
import { IMeshGeneratorViewProps } from './MeshGenerator.model';
import './MeshGenerator.styles.css';
import Icon from '/src/components/atoms/Icon';
import generateUuid from '/src/commons/generateUuid';

function MeshGeneratorView({
  unitCellHeight,
  unitCellWidth,
  materials,
  regions
}: IMeshGeneratorViewProps) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        padding: '20px',
        display: 'flex'
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '200px',
          height: '100%',
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
          <input
            type="text"
            id="unitCellWidth"
            name="unitCellWidth"
            value={unitCellWidth.state || ''}
            onChange={(event) => {
              unitCellWidth.set(Number(event.target.value) || null);
            }}
          />
          <div style={{ height: '10px' }} />
          <label htmlFor="unitCellHeight">Height:</label>
          <input
            type="text"
            id="unitCellHeight"
            name="unitCellHeight"
            value={unitCellHeight.state || ''}
            onChange={(event) => {
              unitCellHeight.set(Number(event.target.value) || null);
            }}
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
                  {material.label}
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
                    <label htmlFor="materialLabel">Label:</label>
                    <input
                      type="text"
                      id="materialLabel"
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
                    <label htmlFor="materialYoung">Young:</label>
                    <input
                      type="text"
                      id="materialYoung"
                      name="materialYoung"
                      value={material.young}
                      size={5}
                      onChange={(event) => {
                        materials.set(
                          materials.state.map((mat) =>
                            mat.id === material.id
                              ? { ...mat, young: Number(event.target.value) }
                              : mat
                          )
                        );
                      }}
                    />
                    <div style={{ height: '5px' }} />
                    <label htmlFor="materialPoisson">Poisson:</label>
                    <input
                      type="text"
                      id="materialPoisson"
                      name="materialPoisson"
                      size={5}
                      value={material.poisson}
                      onChange={(event) => {
                        materials.set(
                          materials.state.map((mat) =>
                            mat.id === material.id
                              ? { ...mat, poisson: Number(event.target.value) }
                              : mat
                          )
                        );
                      }}
                    />
                    <div style={{ height: '5px' }} />
                    <div
                      style={{ cursor: 'pointer', position: 'absolute', top: '5px', right: '0px' }}
                      onClick={() => {
                        materials.set(materials.state.filter((mat) => mat.id !== material.id));
                      }}
                    >
                      <Icon icon="trash" color="white" size="14px" />
                    </div>
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
                color: '#000000',
                poisson: 0,
                young: 0,
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
          {regions.state.length > 0 &&
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
                    <label htmlFor="regionLabel">Label:</label>
                    <input
                      type="text"
                      id="regionLabel"
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
                    <label htmlFor="regionWidth">Width:</label>
                    <input
                      type="text"
                      id="regionWidth"
                      name="regionWidth"
                      value={region.width}
                      size={5}
                      onChange={(event) => {
                        let value = Number(event.target.value);
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
                    <div style={{ height: '5px' }} />
                    <label htmlFor="regionHeight">Height:</label>
                    <input
                      type="text"
                      id="regionHeight"
                      name="regionHeight"
                      value={region.height}
                      size={5}
                      onChange={(event) => {
                        regions.set(
                          regions.state.map((reg) =>
                            reg.id === region.id
                              ? { ...reg, height: Number(event.target.value) }
                              : reg
                          )
                        );
                      }}
                    />
                    <div style={{ height: '5px' }} />
                    <label htmlFor="regionX">X:</label>
                    <input
                      type="text"
                      id="regionX"
                      name="regionX"
                      value={region.x}
                      size={5}
                      onChange={(event) => {
                        regions.set(
                          regions.state.map((reg) =>
                            reg.id === region.id ? { ...reg, x: Number(event.target.value) } : reg
                          )
                        );
                      }}
                    />
                    <div style={{ height: '5px' }} />
                    <label htmlFor="regionY">Y:</label>
                    <input
                      type="text"
                      id="regionY"
                      name="regionY"
                      value={region.y}
                      size={5}
                      onChange={(event) => {
                        regions.set(
                          regions.state.map((reg) =>
                            reg.id === region.id ? { ...reg, y: Number(event.target.value) } : reg
                          )
                        );
                      }}
                    />
                    <div style={{ height: '5px' }} />
                    <div
                      style={{ cursor: 'pointer', position: 'absolute', top: '5px', right: '0px' }}
                      onClick={() => {
                        regions.set(regions.state.filter((reg) => reg.id !== region.id));
                      }}
                    >
                      <Icon icon="trash" color="white" size="14px" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          <button
            style={{ cursor: 'pointer' }}
            onClick={() => {
              if (!unitCellWidth.state || !unitCellHeight.state) return;
              const newRegions = [...regions.state];
              newRegions.push({
                id: generateUuid(),
                label: 'Region ' + (newRegions.length + 1),
                collapsed: false,
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
        </div>
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
            style={{
              height: '100%',
              width: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.08)',
              border: '1px solid var(--off-white)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {unitCellWidth.state || unitCellHeight.state ? (
              <div
                style={{
                  width: unitCellWidth.state || 0,
                  height: unitCellHeight.state || 0,
                  border: '1px solid white',
                  position: 'relative'
                }}
              >
                {regions.state.map((region) => (
                  <div
                    key={region.id}
                    style={{
                      position: 'absolute',
                      top: region.y,
                      left: region.x,
                      width: region.width,
                      height: region.height,
                      backgroundColor: 'rgba(0, 0, 0, 0.2)',
                      border: region.collapsed ? '1px solid var(--off-white)' : '1px dashed white',
                      boxSizing: 'border-box',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {region.label}
                  </div>
                ))}
              </div>
            ) : (
              <>No data.</>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MeshGeneratorView;
