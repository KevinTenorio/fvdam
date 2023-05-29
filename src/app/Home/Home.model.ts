// No model ficam as definições de types e interfaces do componente
import { State } from '/src/index.model';

export interface HomeProps {
  module: State<string>;
}

export interface Model {
  nodes: Node[];
  materials: Material[];
  nodesInfo: NodesInfo;
  elements: Element[];
}

export interface Material {
  id: number;
  label: string;
  poisson: number;
  young: number;
  constitutiveMatrix: math.Matrix;
  constitutiveMatrixIn: math.Matrix | math.MathCollection;
  constitutiveMatrixOut: math.Matrix | math.MathCollection;
  area: number;
  color: string;
}

export interface Node {
  id: number;
  x: number;
  y: number;
}

export interface NodesInfo {
  nodesX: number;
  nodesY: number;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface IElement {
  id: number;
  nodes: Node[];
  material: Material;
  area: number;
  maxX: number;
  minX: number;
  maxY: number;
  minY: number;
  width: number;
  height: number;
  JInv: math.Matrix;
  faces: Face[];
}

export interface Face {
  id: number;
  nodes: Node[];
  constraints: number[];
  strain: number[];
  force: number[];
}
