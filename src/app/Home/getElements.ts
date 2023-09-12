// @ts-nocheck
import { Node, Material, IElement, Face } from './Home.model';
import * as math from 'mathjs';

function calcDB(nodes: Node[]) {
  // Coords
  const x1 = nodes[0].x;
  const y1 = nodes[0].y;
  const x2 = nodes[1].x;
  const y2 = nodes[1].y;
  const x3 = nodes[2].x;
  const y3 = nodes[2].y;
  const x4 = nodes[3].x;
  const y4 = nodes[3].y;

  // Jacobian
  const a1 = (1 / 4) * (-x1 + x2 + x3 - x4);
  const a3 = (1 / 4) * (-x1 - x2 + x3 + x4);
  const a4 = (1 / 4) * (-y1 + y2 + y3 - y4);
  const a6 = (1 / 4) * (-y1 - y2 + y3 + y4);
  const a7 = a1 * a6 - a3 * a4;

  const JInv = math.matrix([
    [a6 / a7, -a4 / a7],
    [-a3 / a7, a1 / a7]
  ]);

  // Area
  const area =
    (x1 * y2 + x2 * y3 + x3 * y4 + x4 * y1 - (x1 * y4 + x4 * y3 + x3 * y2 + x2 * y1)) / 2;

  // Subvolume side lenghts
  const l1 = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  const l2 = Math.sqrt(Math.pow(x3 - x2, 2) + Math.pow(y3 - y2, 2));
  const l3 = Math.sqrt(Math.pow(x4 - x3, 2) + Math.pow(y4 - y3, 2));
  const l4 = Math.sqrt(Math.pow(x1 - x4, 2) + Math.pow(y1 - y4, 2));

  // Subvolume face normals
  const n1x = (y2 - y1) / l1;
  const n1y = -(x2 - x1) / l1;
  const n2x = (y3 - y2) / l2;
  const n2y = -(x3 - x2) / l2;
  const n3x = (y4 - y3) / l3;
  const n3y = -(x4 - x3) / l3;
  const n4x = (y1 - y4) / l4;
  const n4y = -(x1 - x4) / l4;

  // In-plane subvolume face normals in matrix form
  function inPlane() {
    const n1 = math.matrix([
      [n1x, 0, n1y],
      [0, n1y, n1x]
    ]);
    const n2 = math.matrix([
      [n2x, 0, n2y],
      [0, n2y, n2x]
    ]);
    const n3 = math.matrix([
      [n3x, 0, n3y],
      [0, n3y, n3x]
    ]);
    const n4 = math.matrix([
      [n4x, 0, n4y],
      [0, n4y, n4x]
    ]);

    const zeros2x3 = math.zeros(2, 3, 'sparse');
    const zeros2x2 = math.zeros(2, 2, 'sparse');

    const DIn = math.concat(
      math.concat(n1, zeros2x3, zeros2x3, zeros2x3, 1),
      math.concat(zeros2x3, n2, zeros2x3, zeros2x3, 1),
      math.concat(zeros2x3, zeros2x3, n3, zeros2x3, 1),
      math.concat(zeros2x3, zeros2x3, zeros2x3, n4, 1),
      0
    );

    const BIn = math.concat(
      math.concat(JInv, zeros2x2, zeros2x2, zeros2x2, zeros2x2, zeros2x2, zeros2x2, zeros2x2, 1),
      math.concat(zeros2x2, JInv, zeros2x2, zeros2x2, zeros2x2, zeros2x2, zeros2x2, zeros2x2, 1),
      math.concat(zeros2x2, zeros2x2, JInv, zeros2x2, zeros2x2, zeros2x2, zeros2x2, zeros2x2, 1),
      math.concat(zeros2x2, zeros2x2, zeros2x2, JInv, zeros2x2, zeros2x2, zeros2x2, zeros2x2, 1),
      math.concat(zeros2x2, zeros2x2, zeros2x2, zeros2x2, JInv, zeros2x2, zeros2x2, zeros2x2, 1),
      math.concat(zeros2x2, zeros2x2, zeros2x2, zeros2x2, zeros2x2, JInv, zeros2x2, zeros2x2, 1),
      math.concat(zeros2x2, zeros2x2, zeros2x2, zeros2x2, zeros2x2, zeros2x2, JInv, zeros2x2, 1),
      math.concat(zeros2x2, zeros2x2, zeros2x2, zeros2x2, zeros2x2, zeros2x2, zeros2x2, JInv, 1),
      0
    );

    const nIn = math.concat(n1, n2, n3, n4, 0);

    return { DIn, BIn, nIn };
  }
  const { DIn, BIn, nIn } = inPlane();

  // Out-of-plane subvolume face normals in matrix form
  function outOfPlane() {
    const n1 = math.matrix([[n1x, n1y]]);
    const n2 = math.matrix([[n2x, n2y]]);
    const n3 = math.matrix([[n3x, n3y]]);
    const n4 = math.matrix([[n4x, n4y]]);

    const zeros1x2 = math.zeros(1, 2, 'sparse');
    const zeros2x2 = math.zeros(2, 2, 'sparse');

    const DOut = math.concat(
      math.concat(n1, zeros1x2, zeros1x2, zeros1x2, 1),
      math.concat(zeros1x2, n2, zeros1x2, zeros1x2, 1),
      math.concat(zeros1x2, zeros1x2, n3, zeros1x2, 1),
      math.concat(zeros1x2, zeros1x2, zeros1x2, n4, 1),
      0
    );

    const BOut = math.concat(
      math.concat(JInv, zeros2x2, zeros2x2, zeros2x2, 1),
      math.concat(zeros2x2, JInv, zeros2x2, zeros2x2, 1),
      math.concat(zeros2x2, zeros2x2, JInv, zeros2x2, 1),
      math.concat(zeros2x2, zeros2x2, zeros2x2, JInv, 1),
      0
    );

    const nOut = math.concat(n1, n2, n3, n4, 0);

    return { DOut, BOut, nOut };
  }
  const { DOut, BOut, nOut } = outOfPlane();

  return { DIn, BIn, nIn, DOut, BOut, nOut, area, JInv };
}

function calcPhiTheta(element: IElement) {
  const C = element.material.C;
  const J = element.JInv;

  const J22 = J.get([0, 0]);
  const J23 = J.get([0, 1]);
  const J32 = J.get([1, 0]);
  const J33 = J.get([1, 1]);

  const phiIn = math.matrix([
    [
      C.get([1, 1]) * (J22 ** 2 + J23 ** 2) + C.get([4, 4]) * (J32 ** 2 + J33 ** 2),
      (C.get([1, 2]) + C.get([3, 3])) * (J22 * J32 + J23 * J33)
    ],
    [
      (C.get([1, 2]) + C.get([3, 3])) * (J22 * J32 + J23 * J33),
      C.get([2, 2]) * (J32 ** 2 + J33 ** 2) + C.get([3, 3]) * (J22 ** 2 + J23 ** 2)
    ]
  ]);

  const thetaIn = math.matrix([
    [
      (C.get([1, 1]) * J22 ** 2 + C.get([3, 3]) * J32 ** 2) / 2,
      (C.get([1, 1]) * J23 ** 2 + C.get([3, 3]) * J33 ** 2) / 2,
      (J22 * J32 * (C.get([1, 2]) + C.get([3, 3]))) / 2,
      (J23 * J33 * (C.get([1, 2]) + C.get([3, 3]))) / 2
    ],
    [
      (J22 * J32 * (C.get([2, 1]) + C.get([3, 3]))) / 2,
      (J23 * J33 * (C.get([2, 1]) + C.get([3, 3]))) / 2,
      (C.get([2, 2]) * J32 ** 2 + C.get([3, 3]) * J22 ** 2) / 2,
      (C.get([2, 2]) * J33 ** 2 + C.get([3, 3]) * J23 ** 2) / 2
    ]
  ]);

  const phiOut = C.get([5, 5]) * (J22 ** 2 + J23 ** 2) + C.get([4, 4]) * (J32 ** 2 + J33 ** 2);

  const thetaOut = math.matrix([
    [
      (C.get([5, 5]) * J22 ** 2 + C.get([4, 4]) * J32 ** 2) / 2,
      (C.get([5, 5]) * J23 ** 2 + C.get([4, 4]) * J33 ** 2) / 2
    ]
  ]);

  return { phiIn, thetaIn, phiOut, thetaOut };
}

function getElements(
  elements: IElement[],
  faces: Face[],
  nodes: Node[],
  materials: Material[],
  line: string,
  lines: string[],
  i: number
) {
  const formattedLine = line.replaceAll('\r', '');
  if (formattedLine === '%ELEMENT') {
    for (let j = 0; j < Number(lines[i + 1]); j++) {
      elements.push({
        id: 0,
        nodes: [],
        material: materials[0],
        area: 0,
        maxX: 0,
        minX: 0,
        maxY: 0,
        minY: 0,
        width: 0,
        height: 0,
        JInv: math.matrix([
          [0, 0],
          [0, 0]
        ]),
        faces: [],
        DIn: math.matrix([]),
        DOut: math.matrix([]),
        BIn: math.matrix([]),
        BOut: math.matrix([]),
        phiIn: math.matrix([]),
        thetaIn: math.matrix([]),
        phiOut: 0,
        thetaOut: math.matrix([]),
        t0In: math.matrix([]),
        t0Out: math.matrix([])
      });
    }
  } else if (formattedLine === '%ELEMENT.C4') {
    for (let j = 0; j < elements.length; j++) {
      const info = lines[i + j + 2].replaceAll(' ', '').split('\t');
      elements[j].id = Number(info[0]);
      elements[j].material =
        materials.find((material) => material.id === Number(info[1])) ?? materials[0];
      elements[j].nodes = [
        nodes.find((node) => node.id === Number(info[4])) ?? nodes[0],
        nodes.find((node) => node.id === Number(info[5])) ?? nodes[0],
        nodes.find((node) => node.id === Number(info[6])) ?? nodes[0],
        nodes.find((node) => node.id === Number(info[7])) ?? nodes[0]
      ];
      elements[j].maxX = Math.max(
        elements[j].nodes[0].x,
        elements[j].nodes[1].x,
        elements[j].nodes[2].x,
        elements[j].nodes[3].x
      );
      elements[j].minX = Math.min(
        elements[j].nodes[0].x,
        elements[j].nodes[1].x,
        elements[j].nodes[2].x,
        elements[j].nodes[3].x
      );
      elements[j].maxY = Math.max(
        elements[j].nodes[0].y,
        elements[j].nodes[1].y,
        elements[j].nodes[2].y,
        elements[j].nodes[3].y
      );
      elements[j].minY = Math.min(
        elements[j].nodes[0].y,
        elements[j].nodes[1].y,
        elements[j].nodes[2].y,
        elements[j].nodes[3].y
      );

      elements[j].width = elements[j].maxX - elements[j].minX;
      elements[j].height = elements[j].maxY - elements[j].minY;

      const { DIn, BIn, nIn, DOut, BOut, nOut, area, JInv } = calcDB(elements[j].nodes);
      elements[j].area = area;
      elements[j].JInv = JInv;
      elements[j].DIn = DIn;
      elements[j].BIn = BIn;
      elements[j].DOut = DOut;
      elements[j].BOut = BOut;
      elements[j].nIn = nIn;
      elements[j].nOut = nOut;

      const { phiIn, thetaIn, phiOut, thetaOut } = calcPhiTheta(elements[j]);
      elements[j].phiIn = phiIn;
      elements[j].thetaIn = thetaIn;
      elements[j].phiOut = phiOut;
      elements[j].thetaOut = thetaOut;

      elements[j].Conc = math.zeros(6, 6, 'sparse');

      materials[Number(info[1]) - 1].area += elements[j].area;
    }
  } else if (formattedLine === '%ELEMENT.C4.FACES') {
    let facesNumber = 0;
    for (let j = 0; j < elements.length; j++) {
      const info = lines[i + j + 2].replaceAll(' ', '').split('\t');
      const faceIds = [Number(info[1]), Number(info[2]), Number(info[3]), Number(info[4])];
      if (facesNumber < Math.max(...faceIds)) {
        facesNumber = Math.max(...faceIds);
      }
    }
    for (let j = 0; j < facesNumber; j++) {
      faces.push({
        id: j + 1,
        nodes: [
          nodes.find((node) => node.id === 2 * j + 1) ?? nodes[0],
          nodes.find((node) => node.id === 2 * j + 2) ?? nodes[0]
        ],
        dof: [2 * j + 1, 2 * j + 2],
        constraints: [0, 0, 0],
        strain: [0, 0, 0],
        force: [0, 0, 0]
      });
    }
    for (let j = 0; j < elements.length; j++) {
      const info = lines[i + j + 2].replaceAll(' ', '').split('\t');
      const faceIds = [Number(info[1]), Number(info[2]), Number(info[3]), Number(info[4])];
      elements[j].faces = [
        faces[faceIds[0] - 1],
        faces[faceIds[1] - 1],
        faces[faceIds[2] - 1],
        faces[faceIds[3] - 1]
      ];
    }
  }
}

export default getElements;
