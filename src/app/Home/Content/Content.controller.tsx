// No controller fica a lógica do componente
// Importa o view e o context (se precisar) e é exportado para o index

import ContentView from './Content.view';
import { IContentControllerProps } from './Content.model';
import { useAppContext } from '../../App.context';
import { AppContext } from '../../App.model';

function ContentController({
  materials,
  nodes,
  elements,
  faces,
  nodesInfo,
  results,
  handleExecuteFvdam,
  getPieChartColors,
  elapsedTime
}: IContentControllerProps) {
  const { meshData }: AppContext = useAppContext();
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
      elapsedTime={elapsedTime}
      meshData={meshData}
    />
  );
}

export default ContentController;
