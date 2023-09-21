// No view fica o que é renderizado pelo componente
// Importa o styles (se tiver) e outros componentes filhos
// É exportado para o controller
import { IMeshGeneratorViewProps } from './MeshGenerator.model';
import './MeshGenerator.styles.css';
import Icon from '/src/components/atoms/Icon';
import generateUuid from '/src/commons/generateUuid';
import generateColor from '/src/commons/generateColor';

function MeshGeneratorView({
  unitCellHeight,
  unitCellWidth,
  materials,
  regions,
  nodes,
  faces,
  elements,
  generateMesh,
  stuffToShow,
  divisionsByRegion,
  generateFvtFile,
  supportType,
  supportedFaces,
  periodicity,
  correctedFacesIds
}: IMeshGeneratorViewProps) {
  const zoom =
    0.6 *
    Math.min(
      window.innerWidth / (unitCellWidth.state || 1),
      window.innerHeight / (unitCellHeight.state || 1)
    );
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
                    <label htmlFor="materialColor">Color:</label>
                    <input
                      type="text"
                      id="materialColor"
                      name="materialColor"
                      size={5}
                      value={material.color}
                      style={{ color: material.color }}
                      onChange={(event) => {
                        materials.set(
                          materials.state.map((mat) =>
                            mat.id === material.id ? { ...mat, color: event.target.value } : mat
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
                color: generateColor(),
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
                    <label htmlFor="regionMaterial">Material:</label>
                    <input
                      type="text"
                      id="regionMaterial"
                      name="regionMaterial"
                      value={materials.state.find((mat) => mat.id === region.materialId)?.label}
                      size={5}
                      onChange={(event) => {
                        regions.set(
                          regions.state.map((reg) =>
                            reg.id === region.id ? { ...reg, materialId: event.target.value } : reg
                          )
                        );
                      }}
                      onClick={() => {
                        regions.set(
                          regions.state.map((reg) =>
                            reg.id === region.id
                              ? { ...reg, showMaterialsDropdown: !region.showMaterialsDropdown }
                              : reg
                          )
                        );
                      }}
                    />

                    {region.showMaterialsDropdown && (
                      <div
                        style={{
                          border: '2px solid var(--off-white)',
                          position: 'absolute',
                          top: '90px',
                          backgroundColor: 'grey',
                          width: '100%'
                        }}
                      >
                        {materials.state.map((material) => (
                          <div
                            className="materialItem"
                            key={material.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}
                            onClick={() => {
                              regions.set(
                                regions.state.map((reg) =>
                                  reg.id === region.id
                                    ? {
                                        ...reg,
                                        materialId: material.id,
                                        showMaterialsDropdown: false
                                      }
                                    : reg
                                )
                              );
                            }}
                          >
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
                        ))}
                      </div>
                    )}

                    <div style={{ height: '5px' }} />
                    <label htmlFor="regionWidth">Width:</label>
                    <input
                      type="text"
                      id="regionWidth"
                      name="regionWidth"
                      value={region.width}
                      size={5}
                      onChange={(event) => {
                        let value: number;
                        if (event.target.value.includes('.')) {
                          value = Number(event.target.value + '0');
                        } else {
                          value = Number(event.target.value);
                        }

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
                        let value: number;
                        if (event.target.value.includes('.') && !event.target.value.split('.')[1]) {
                          value = Number(event.target.value + '5');
                        } else {
                          value = Number(event.target.value);
                        }
                        regions.set(
                          regions.state.map((reg) =>
                            reg.id === region.id ? { ...reg, height: value } : reg
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
                    <div
                      style={{ cursor: 'pointer', position: 'absolute', top: '5px', right: '20px' }}
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
                    </div>
                  </div>
                )}
              </div>
            ))}
          <div style={{ height: '5px' }} />
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
              id="centralSupport"
              name="support"
              value="central"
              style={{ cursor: 'pointer' }}
              checked={supportType.state === 'central'}
              onClick={() => {
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
              onClick={() => {
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
              onClick={() => {
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
        <label htmlFor="regionX">Divisions:</label>
        <input
          type="text"
          id="regionX"
          name="regionX"
          value={divisionsByRegion.state}
          size={5}
          onChange={(event) => {
            divisionsByRegion.set(Number(event.target.value) || 1);
          }}
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
            style={{
              height: '100%',
              width: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.08)',
              border: '1px solid var(--off-white)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}
          >
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
                        <div style={{ fontSize: '8px' }}>
                          {/* {periodicity.state.vertical &&
                          nodes.state[face[1]][1] === nodes.state[face[0]][1] &&
                          nodes.state[face[1]][1] === unitCellHeight.state
                            ? (faces.state.findIndex(
                                (fce) =>
                                  nodes.state[fce[0]][0] === nodes.state[face[0]][0] &&
                                  nodes.state[fce[0]][1] === 0
                              ) ?? index) + 1
                            : periodicity.state.horizontal &&
                              nodes.state[face[1]][0] === nodes.state[face[0]][0] &&
                              nodes.state[face[1]][0] === unitCellWidth.state
                            ? (faces.state.findIndex(
                                (fce) =>
                                  nodes.state[fce[0]][1] === nodes.state[face[0]][1] &&
                                  nodes.state[fce[0]][0] === 0
                              ) ?? index) + 1
                            : index + 1} */}
                          {correctedFacesIds.state[index] + 1}
                        </div>
                      </div>
                    </div>
                  ))}
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
            <div style={{ position: 'absolute', top: '5px', right: '5px' }}>
              <div // Filter Visualization
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
                <label htmlFor="elements">Elements</label>
              </div>
              <div>
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
                <label htmlFor="elementsIds">Elements Ids</label>
              </div>
              <div>
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
              <div>
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
              <div>
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
              <div>
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
              <div>
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
            <div style={{ position: 'absolute', bottom: '5px', right: '5px' }}>
              <button
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  generateFvtFile();
                }}
              >
                Generate FVT File
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MeshGeneratorView;
