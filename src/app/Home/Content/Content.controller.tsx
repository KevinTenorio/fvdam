// No controller fica a lógica do componente
// Importa o view e o context (se precisar) e é exportado para o index

import ContentView from './Content.view';
import { IContentControllerProps } from './Content.model';

function ContentController({
  materials,
  nodes,
  elements,
  faces,
  nodesInfo,
  results,
  handleExecuteFvdam,
  getPieChartColors
}: IContentControllerProps) {
  return (
    <ContentView
      materials={materials}
      nodes={nodes}
      elements={elements}
      faces={faces}
      nodesInfo={nodesInfo}
      results={results}
      handleExecuteFvdam={handleExecuteFvdam}
      getPieChartColors={getPieChartColors}
    />
  );
}

export default ContentController;
