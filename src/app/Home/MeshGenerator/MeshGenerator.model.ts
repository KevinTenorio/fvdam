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
  generateJsonFile: () => void;
  supportType: IState<string>;
  elementsFaces: IState<number[][]>;
  supportedFaces: IState<number[]>;
  periodicity: IState<{
    horizontal: boolean;
    vertical: boolean;
  }>;
  correctedFacesIds: IState<number[]>;
}

export interface IMeshGeneratorContext {
  unitCellWidth: number | null;
  unitCellHeight: number | null;
  materials: IMeshMaterial[];
  regions: IMeshRegion[];
  nodes: number[][];
  faces: number[][];
  elements: number[][];
  stuffToShow: IStuffToShow;
  divisionsByRegion: number;
  supportType: string;
  elementsFaces: number[][];
  supportedFaces: number[];
  periodicity: {
    horizontal: boolean;
    vertical: boolean;
  };
  correctedFacesIds: number[];
  setUnitCellWidth: (value: number | null) => void;
  setUnitCellHeight: (value: number | null) => void;
  setMaterials: (value: IMeshMaterial[]) => void;
  setRegions: (value: IMeshRegion[]) => void;
  setNodes: (value: number[][]) => void;
  setFaces: (value: number[][]) => void;
  setElements: (value: number[][]) => void;
  setStuffToShow: (value: IStuffToShow) => void;
  setDivisionsByRegion: (value: number) => void;
  setSupportType: (value: string) => void;
  setElementsFaces: (value: number[][]) => void;
  setSupportedFaces: (value: number[]) => void;
  setPeriodicity: (value: { horizontal: boolean; vertical: boolean }) => void;
  setCorrectedFacesIds: (value: number[]) => void;
}

export interface IMeshGeneratorControllerProps {
  page: IState<string>;
  handleFileRead: (file: any, textMode?: boolean) => void;
  parseFile: (fileStr: string) => void;
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
