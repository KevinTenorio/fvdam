// No controller fica a lógica do componente
// Importa o view e o context (se precisar) e é exportado para o index

import { IMeshMaterial } from './MeshGenerator.model';
import MeshGeneratorView from './MeshGenerator.view';
import { useState } from 'react';

function MeshGeneratorController() {
  const [unitCellWidth, setUnitCellWidth] = useState<number | null>(null);
  const [unitCellHeight, setUnitCellHeight] = useState<number | null>(null);
  const [materials, setMaterials] = useState<IMeshMaterial[]>([]);
  return (
    <MeshGeneratorView
      unitCellWidth={{
        state: unitCellWidth,
        set: setUnitCellWidth
      }}
      unitCellHeight={{
        state: unitCellHeight,
        set: setUnitCellHeight
      }}
      materials={{
        state: materials,
        set: setMaterials
      }}
    />
  );
}

export default MeshGeneratorController;
