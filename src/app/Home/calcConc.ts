import * as math from 'mathjs';
import { IElement, Face } from './Home.model';

function calcConc(
  faces: Face[],
  elements: IElement[],
  dofAIn: number[],
  dofAOut: number[],
  KgIn: math.MathCollection,
  KgOut: math.MathCollection
) {
  const epIn1 = math.matrix([[1], [0], [0], [0]]);
  const epIn2 = math.matrix([[0], [1], [0], [0]]);
  const epIn3 = math.matrix([[0], [0], [1], [0]]);
  const epIn4 = math.matrix([[0], [0], [0], [2]]);
  const epOut1 = math.matrix([[2], [0]]);
  const epOut2 = math.matrix([[0], [2]]);

  const KaaIn = math.subset(KgIn, math.index(math.subtract(dofAOut, 1), math.subtract(dofAOut, 1)));
  const KaaOut = math.subset(
    KgOut,
    math.index(math.subtract(dofAOut, 1), math.subtract(dofAOut, 1))
  );

  const fixedDofAOut = math.subtract(dofAOut, 1);
  const fixedDofAIn = math.subtract(dofAIn, 1);

  outOfPlane(faces, elements, epOut1, fixedDofAIn, fixedDofAOut, KaaOut, 0);
  inPlane(faces, elements, epIn1, fixedDofAIn, fixedDofAOut, KaaIn, 0);
  outOfPlane(faces, elements, epOut2, fixedDofAIn, fixedDofAOut, KaaOut, 1);
  inPlane(faces, elements, epIn2, fixedDofAIn, fixedDofAOut, KaaIn, 1);
  inPlane(faces, elements, epIn3, fixedDofAIn, fixedDofAOut, KaaIn, 2);
  inPlane(faces, elements, epIn4, fixedDofAIn, fixedDofAOut, KaaIn, 3);
}

function inPlane(
  faces: Face[],
  elements: IElement[],
  ep: math.Matrix,
  dofAIn: math.MathType,
  dofAOut: math.MathType,
  KaaIn: math.MathCollection,
  m: number
) {
  const f = calcFaceForces(faces, elements, 'in', ep, dofAIn, dofAOut);
  const UIn = math.lusolve(KaaIn, f);

  for (let i = 0; i < elements.length; i++) {
    const u = math.zeros(8, 1, 'sparse');
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
    const c1 = [];
    const c2 = [];
    for (let w = 0; w < 8; w++) {
      const a = dofAIn.indexOf(LMIn[w]);
      if (a > -1) {
        c1.push(a);
        c2.push(w);
      }
    }
    u.subset(math.index(c2, 0), math.subset(UIn, math.index(c1, 0)));

    const uAux = math.matrix([
      [u.get([2, 0]) + u.get([6, 0])],
      [u.get([0, 0]) + u.get([4, 0])],
      [u.get([3, 0]) + u.get([7, 0])],
      [u.get([1, 0]) + u.get([5, 0])]
    ]);

    const invPhiTheta = math.multiply(math.inv(elements[i].phiIn), elements[i].thetaIn);

    const W00 = math.multiply(invPhiTheta, uAux);
    const W = math.multiply(elements[i].BbIn, u);
    const W2 = math.subset(W, math.index([0, 1, 2, 3], 0));
    const W3 = math.subset(W, math.index([4, 5, 6, 7], 0));

    const avgStrain = [
      ep.get([0, 0]),
      ep.get([1, 0]) +
        elements[i].JInv.get([0, 0]) * W2.get([0, 0]) +
        elements[i].JInv.get([0, 1]) * W2.get([1, 0]),
      ep.get([2, 0]) +
        elements[i].JInv.get([1, 0]) * W3.get([0, 0]) +
        elements[i].JInv.get([1, 1]) * W3.get([1, 0]),
      ep.get([3, 0]) +
        elements[i].JInv.get([1, 0]) * W2.get([0, 0]) +
        elements[i].JInv.get([1, 1]) * W2.get([1, 0]) +
        elements[i].JInv.get([0, 0]) * W3.get([0, 0]) +
        elements[i].JInv.get([0, 1]) * W3.get([1, 0])
    ];

    elements[i].Conc.set([0, m], avgStrain[0] / ep.get([m, 0]));
    elements[i].Conc.set([1, m], avgStrain[1] / ep.get([m, 0]));
    elements[i].Conc.set([2, m], avgStrain[2] / ep.get([m, 0]));
    elements[i].Conc.set([3, m], avgStrain[3] / ep.get([m, 0]));
    elements[i].W = math.concat(W00, W, 0);
  }
}

function outOfPlane(
  faces: Face[],
  elements: IElement[],
  ep: math.Matrix,
  dofAIn: math.MathType,
  dofAOut: math.MathType,
  KaaOut: math.MathCollection,
  m: number
) {
  const f = calcFaceForces(faces, elements, 'out', ep, dofAIn, dofAOut);

  const UOut = math.lusolve(KaaOut, f);

  for (let i = 0; i < elements.length; i++) {
    const u = math.zeros(4, 1, 'sparse');
    const LMOut = [
      elements[i].faces[0].id - 1,
      elements[i].faces[1].id - 1,
      elements[i].faces[2].id - 1,
      elements[i].faces[3].id - 1
    ];
    const c1 = [];
    const c2 = [];
    for (let w = 0; w < 8; w++) {
      const a = dofAOut.indexOf(LMOut[w]);
      if (a > -1) {
        c1.push(a);
        c2.push(w);
      }
    }
    u.subset(math.index(c2, 0), math.subset(UOut, math.index(c1, 0)));

    const uAux = math.matrix([[u.get([1, 0]) + u.get([3, 0])], [u.get([0, 0]) + u.get([2, 0])]]);

    const invPhiTheta = math.multiply(math.inv(elements[i].phiOut), elements[i].thetaOut);

    const W = math.multiply(invPhiTheta, uAux);
    const W1 = math.multiply(elements[i].BbOut, u);

    const avgStrain = [
      ep.get([0, 0]) +
        elements[i].JInv.get([0, 0]) * W1.get([0, 0]) +
        elements[i].JInv.get([0, 1]) * W1.get([1, 0]),
      ep.get([1, 0]) +
        elements[i].JInv.get([1, 0]) * W1.get([0, 0]) +
        elements[i].JInv.get([1, 1]) * W1.get([1, 0])
    ];

    elements[i].Conc.set([4, 4 + m], avgStrain[0] / ep.get([m, 0]));
    elements[i].Conc.set([5, 4 + m], avgStrain[1] / ep.get([m, 0]));
    elements[i].W = math.concat(W, W1, 0);
  }
}

function calcFaceForces(
  faces: Face[],
  elements: IElement[],
  plane: string,
  ep: math.Matrix,
  dofAIn: math.MathType,
  dofAOut: math.MathType
) {
  if (plane === 'in') {
    const tIn = math.zeros(2 * faces.length, 1);
    for (let i = 0; i < elements.length; i++) {
      const { t0In } = elements[i];
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

      tIn.subset(
        math.index(LMIn, 0),
        math.add(math.subset(tIn, math.index(LMIn, 0)), math.multiply(t0In, ep))
      );
    }
    const f = math.subset(tIn, math.index(dofAIn, 0));
    return f;
  } else if (plane === 'out') {
    const tOut = math.zeros(2 * faces.length, 1);
    for (let i = 0; i < elements.length; i++) {
      const { t0Out } = elements[i];
      const LMOut = [
        elements[i].faces[0].id - 1,
        elements[i].faces[1].id - 1,
        elements[i].faces[2].id - 1,
        elements[i].faces[3].id - 1
      ];
      tOut.subset(
        math.index(LMOut, 0),
        math.add(math.subset(tOut, math.index(LMOut, 0)), math.multiply(t0Out, ep))
      );
    }
    const f = math.subset(tOut, math.index(dofAOut, 0));
    return f;
  }
}

export default calcConc;
