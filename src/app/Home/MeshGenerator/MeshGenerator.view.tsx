// No view fica o que é renderizado pelo componente
// Importa o styles (se tiver) e outros componentes filhos
// É exportado para o controller
import { IMeshGeneratorViewProps } from './MeshGenerator.model';
import './MeshGenerator.styles.css';

function MeshGeneratorView({ unitCellHeight, unitCellWidth, materials }: IMeshGeneratorViewProps) {
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
              <div key={material.label} style={{ marginBottom: '5px' }}>
                {material.label}
              </div>
            ))}
          <button
            style={{ cursor: 'pointer' }}
            onClick={() => {
              const newMaterials = [...materials.state];
              newMaterials.push({
                label: 'Material 1',
                color: '#000000',
                poisson: 0,
                young: 0
              });
              materials.set(newMaterials);
            }}
          >
            Add Material
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
                  border: '1px solid white'
                }}
              />
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
