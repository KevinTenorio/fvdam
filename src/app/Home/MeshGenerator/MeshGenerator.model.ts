// No model ficam as definições de types e interfaces do componente
import { IState } from '/src/index.model';

export interface IMeshGeneratorViewProps {
  unitCellWidth: IState<number | null>;
  unitCellHeight: IState<number | null>;
  materials: IState<IMeshMaterial[]>;
}

export interface IMeshMaterial {
  label: string;
  poisson: number;
  young: number;
  color: string;
}
