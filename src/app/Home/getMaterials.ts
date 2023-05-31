import * as math from 'mathjs';
import { Material } from './Home.model';

function buildMaterialMatrices({ E, v }: { E: number; v: number }) {
  let C = math.matrix([
    [1 - v, v, v, 0, 0, 0],
    [v, 1 - v, v, 0, 0, 0],
    [v, v, 1 - v, 0, 0, 0],
    [0, 0, 0, (1 - 2 * v) / 2, 0, 0],
    [0, 0, 0, 0, (1 - 2 * v) / 2, 0],
    [0, 0, 0, 0, 0, (1 - 2 * v) / 2]
  ]);
  C = math.multiply(E / ((1 + v) * (1 - 2 * v)), C); // check this

  const sparse3x3 = math.zeros(3, 3, 'sparse');

  const CInRed = math.matrix([
    [C.get([1, 1]), C.get([1, 2]), 0],
    [C.get([2, 1]), C.get([2, 2]), 0],
    [0, 0, C.get([3, 3])]
  ]);

  const CIn = math.concat(
    math.concat(CInRed, sparse3x3, sparse3x3, sparse3x3, 1),
    math.concat(sparse3x3, CInRed, sparse3x3, sparse3x3, 1),
    math.concat(sparse3x3, sparse3x3, CInRed, sparse3x3, 1),
    math.concat(sparse3x3, sparse3x3, sparse3x3, CInRed, 1),
    0
  );

  const sparse2x2 = math.zeros(2, 2, 'sparse');

  const COutRed = math.matrix([
    [C.get([5, 5]), 0],
    [0, C.get([4, 4])]
  ]);

  const COut = math.concat(
    math.concat(COutRed, sparse2x2, sparse2x2, sparse2x2, 1),
    math.concat(sparse2x2, COutRed, sparse2x2, sparse2x2, 1),
    math.concat(sparse2x2, sparse2x2, COutRed, sparse2x2, 1),
    math.concat(sparse2x2, sparse2x2, sparse2x2, COutRed, 1),
    0
  );

  return { C, CIn, COut };
}

function getMaterials(materials: Material[], line: string, lines: string[], i: number) {
  const formattedLine = line.replaceAll('\r', '');
  if (formattedLine === '%MATERIAL') {
    for (let j = 0; j < Number(lines[i + 1]); j++) {
      materials.push({
        label: '',
        poisson: 0,
        young: 0,
        color: '',
        C: math.matrix([]),
        area: 0,
        id: 0,
        CIn: math.matrix([]),
        COut: math.matrix([])
      });
    }
  } else if (formattedLine === '%MATERIAL.LABEL') {
    for (let j = 0; j < materials.length; j++) {
      materials[j].label = lines[i + j + 2].slice(
        lines[i + j + 2].indexOf('\t') + 2,
        lines[i + j + 2].length - 1
      );
    }
  } else if (formattedLine === '%MATERIAL.ISOTROPIC') {
    for (let j = 0; j < materials.length; j++) {
      const isotropicProps = lines[i + j + 2].replaceAll(' ', '').split('\t');
      materials[j].id = Number(isotropicProps[0]);
      materials[j].poisson = Number(isotropicProps[2]);
      materials[j].young = Number(isotropicProps[1]);
      const { C, CIn, COut } = buildMaterialMatrices({
        E: materials[j].young,
        v: materials[j].poisson
      });
      materials[j].C = C;
      materials[j].CIn = CIn;
      materials[j].COut = COut;
      let color = '';
      while (color.length < 6) {
        color = `${Math.floor(Math.random() * 16777215).toString(16)}`;
      }
      materials[j].color = `#${color}`;
    }
  }
}

export default getMaterials;
