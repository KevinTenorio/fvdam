import * as math from 'mathjs';
import { Face, IElement } from './Home.model';

function calcLocal(
  element: IElement,
  AIn: math.MathCollection,
  EIn: math.MathCollection,
  MIn: math.MathCollection,
  NIn: math.MathCollection,
  PIn: math.MathType,
  AOut: math.MathCollection,
  MOut: math.MathCollection,
  NOut: math.MathCollection,
  POut: math.MathType
) {
  const AbIn = math.multiply(element.DIn, element.material.CIn, EIn, element.BIn, AIn);
  const BbIn = math.subtract(
    PIn,
    math.multiply(NIn, math.inv(element.phiIn), element.thetaIn, MIn)
  );
  const KeIn = math.multiply(AbIn, BbIn);

  const AbOut = math.multiply(
    element.DOut,
    element.material.COut,
    math.identity(8),
    element.BOut,
    AOut
  );
  const BbOut = math.subtract(
    POut,
    math.multiply(NOut, math.inv(element.phiOut), element.thetaOut, MOut)
  );
  const KeOut = math.multiply(AbOut, BbOut);

  return { KeIn, KeOut, BbIn, BbOut };
}

function calcForces(nIn: math.MathCollection, nOut: math.MathCollection, C: math.Matrix) {
  const CAuxIn = math.matrix([
    [C.get([0, 1]), C.get([1, 1]), C.get([1, 2]), 0],
    [C.get([0, 2]), C.get([1, 2]), C.get([2, 2]), 0],
    [0, 0, 0, C.get([3, 3])]
  ]);

  const t0In = math.multiply(-1, nIn, CAuxIn);

  const CAuxOut = math.matrix([
    [C.get([5, 5]), 0],
    [0, C.get([4, 4])]
  ]);
  const t0Out = math.multiply(-1, nOut, CAuxOut);

  return { t0In, t0Out };
}

function calcStiffness(
  faces: Face[],
  elements: IElement[],
  AIn: math.MathCollection,
  EIn: math.MathCollection,
  MIn: math.MathCollection,
  NIn: math.MathCollection,
  PIn: math.MathType,
  AOut: math.MathCollection,
  MOut: math.MathCollection,
  NOut: math.MathCollection,
  POut: math.MathType
) {
  const KgIn = math.zeros(faces.length * 2, faces.length * 2, 'sparse');
  const KgOut = math.zeros(faces.length, faces.length, 'sparse');

  for (let i = 0; i < elements.length; i++) {
    const { KeIn, KeOut, BbIn, BbOut } = calcLocal(
      elements[i],
      AIn,
      EIn,
      MIn,
      NIn,
      PIn,
      AOut,
      MOut,
      NOut,
      POut
    );
    elements[i].KeIn = KeIn;
    elements[i].KeOut = KeOut;
    elements[i].BbIn = BbIn;
    elements[i].BbOut = BbOut;

    const LMIn = math.subtract(
      math.concat(
        elements[i].faces[0].dof,
        elements[i].faces[1].dof,
        elements[i].faces[2].dof,
        elements[i].faces[3].dof,
        0
      ),
      1
    );
    const LMOut = [
      elements[i].faces[0].id - 1,
      elements[i].faces[1].id - 1,
      elements[i].faces[2].id - 1,
      elements[i].faces[3].id - 1
    ];

    const { t0In, t0Out } = calcForces(elements[i].nIn, elements[i].nOut, elements[i].material.C);
    elements[i].t0In = t0In;
    elements[i].t0Out = t0Out;

    KgIn.subset(math.index(LMIn, LMIn), math.add(KgIn.subset(math.index(LMIn, LMIn)), KeIn));
    KgOut.subset(math.index(LMOut, LMOut), math.add(KgOut.subset(math.index(LMOut, LMOut)), KeOut));
  }

  return { KgIn, KgOut };
}

export default calcStiffness;
