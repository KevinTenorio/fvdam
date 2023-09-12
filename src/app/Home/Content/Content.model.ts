// No model ficam as definições de types e interfaces do componente
import { IState } from '/src/index.model';
import { Material, NodesInfo, IElement, Face, Results, Node } from '/src/app/Home/Home.model';

export interface IContentControllerProps {
  nodes: IState<Node[]>;
  materials: IState<Material[]>;
  nodesInfo: IState<NodesInfo>;
  elements: IState<IElement[]>;
  faces: IState<Face[]>;
  getPieChartColors: (materials: Material[]) => string;
  results: IState<Results | undefined>;
  handleExecuteFvdam: () => void;
}
export interface IContentViewProps {
  nodes: IState<Node[]>;
  materials: IState<Material[]>;
  nodesInfo: IState<NodesInfo>;
  elements: IState<IElement[]>;
  faces: IState<Face[]>;
  getPieChartColors: (materials: Material[]) => string;
  results: IState<Results | undefined>;
  handleExecuteFvdam: () => void;
}
