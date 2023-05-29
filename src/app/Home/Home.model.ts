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
  C: math.Matrix;
  CIn: math.Matrix | math.MathCollection;
  COut: math.Matrix | math.MathCollection;
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
  DIn: math.MathCollection;
  DOut: math.MathCollection;
  BIn: math.MathCollection;
  BOut: math.MathCollection;
  phiIn: math.Matrix;
  thetaIn: math.Matrix;
  phiOut: number;
  thetaOut: math.Matrix;
  t0In: math.Matrix;
  t0Out: math.Matrix;
}

export interface Face {
  id: number;
  nodes: Node[];
  constraints: number[];
  strain: number[];
  force: number[];
  dof: number[];
}
