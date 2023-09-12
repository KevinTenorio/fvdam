// No model ficam as definições de types e interfaces do componente
import { IState } from '/src/index.model';

export interface IMeshGeneratorControllerProps {
  prop?: string;
}
export interface IMeshGeneratorViewProps {
  example: IState<string>;
}
