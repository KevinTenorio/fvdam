// No view fica o que é renderizado pelo componente
// Importa o styles (se tiver) e outros componentes filhos
// É exportado para o controller
import { IMeshGeneratorViewProps } from './MeshGenerator.model';
import './MeshGenerator.styles.css';

function MeshGeneratorView({ example }: IMeshGeneratorViewProps) {
  return <div className="example">{example.state}</div>;
}

export default MeshGeneratorView;
