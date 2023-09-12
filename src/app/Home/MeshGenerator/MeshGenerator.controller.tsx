// No controller fica a lógica do componente
// Importa o view e o context (se precisar) e é exportado para o index

import MeshGeneratorView from './MeshGenerator.view';
import { IMeshGeneratorControllerProps } from './MeshGenerator.model';
import { useState } from 'react';

function MeshGeneratorController({ prop = 'MeshGenerator' }: IMeshGeneratorControllerProps) {
  const [example, setExample] = useState<string>('OIOIOI ' + prop);
  return <MeshGeneratorView example={{ state: example, set: setExample }} />;
}

export default MeshGeneratorController;
