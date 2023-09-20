// No model ficam as definições de types e interfaces do componente
import { IState } from '/src/index.model';

export interface IMeshGeneratorViewProps {
  unitCellWidth: IState<number | null>;
  unitCellHeight: IState<number | null>;
  materials: IState<IMeshMaterial[]>;
  regions: IState<IMeshRegion[]>;
  nodes: IState<number[][]>;
  faces: IState<number[][]>;
  elements: IState<number[][]>;
  generateMesh: () => void;
  stuffToShow: IState<IStuffToShow>;
  divisionsByRegion: IState<number>;
  generateFvtFile: () => void;
  supportType: IState<string>;
  elementsFaces: IState<number[][]>;
  supportedFaces: IState<number[]>;
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
  showMaterialsDropdown: boolean;
}

export interface IStuffToShow {
  elements: boolean;
  elementsIds: boolean;
  regionsLabels: boolean;
  nodesIds: boolean;
  facesIds: boolean;
  regionsMaterials: boolean;
  supports: boolean;
}
