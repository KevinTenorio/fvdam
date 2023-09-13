// No model ficam as definições de types e interfaces do componente
import { IState } from '/src/index.model';

export interface IMeshGeneratorViewProps {
  unitCellWidth: IState<number | null>;
  unitCellHeight: IState<number | null>;
  materials: IState<IMeshMaterial[]>;
  regions: IState<IMeshRegion[]>;
}

export interface IMeshMaterial {
  id: string;
  label: string;
  poisson: number;
  young: number;
  color: string;
  collapsed: boolean;
}

export interface IMeshRegion {
  id: string;
  label: string;
  materialId: string;
  width: number;
  height: number;
  x: number;
  y: number;
  collapsed: boolean;
}
