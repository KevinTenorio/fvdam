import { Face } from './Home.model';

function getFaces(faces: Face[], line: string, lines: string[], i: number) {
  const formattedLine = line.replaceAll('\r', '');
  if (formattedLine === '%LOAD.CASE.FACE.PRESCRIBED.DISPLACEMENT') {
    const numConstraints = Number(lines[i + 1]);
    for (let j = 0; j < numConstraints; j++) {
      const info = lines[i + j + 2].replaceAll(' ', '').split('\t');
      const faceId = Number(info[1]);
      const degreeOfFreedom = Number(info[2]);
      faces[faceId - 1].constraints[degreeOfFreedom - 1] = 1;
      faces[faceId - 1].constraints[2] = 1;
    }
  } else if (formattedLine === '%LOAD.CASE.FACE.PRESCRIBED.DISPLACEMENT.OUT') {
    const numConstraints = Number(lines[i + 1]);
    for (let j = 0; j < numConstraints; j++) {
      const info = lines[i + j + 2].replaceAll(' ', '').split('\t');
      const faceId = Number(info[1]);
      const degreeOfFreedom = Number(info[2]);
      faces[faceId - 1].constraints[degreeOfFreedom - 1] = 1;
    }
  } else if (formattedLine === '%LOAD.CASE.FACE.PRESCRIBED.STRAIN') {
    const numStrains = Number(lines[i + 1]);
    for (let j = 0; j < numStrains; j++) {
      const info = lines[i + j + 2].replaceAll(' ', '').split('\t');
      const faceId = Number(info[1]);
      const degreeOfFreedom = Number(info[2]);
      const value = Number(info[3]);
      faces[faceId - 1].strain[degreeOfFreedom - 1] = value;
    }
  } else if (formattedLine === '%LOAD.CASE.FACE.PRESCRIBED.FORCES') {
    const numForces = Number(lines[i + 1]);
    for (let j = 0; j < numForces; j++) {
      const info = lines[i + j + 2].replaceAll(' ', '').split('\t');
      const faceId = Number(info[1]);
      const degreeOfFreedom = Number(info[2]);
      const value = Number(info[3]);
      faces[faceId - 1].force[degreeOfFreedom - 1] = value;
    }
  }
}

export default getFaces;
