import { Face } from './Home.model';

function calcDof(faces: Face[]) {
  const dofAOut = [];
  const dofBOut = [];
  const dofAIn = [];
  const dofBIn = [];

  for (let i = 0; i < faces.length; i++) {
    if (faces[i].constraints[2] === 0) {
      dofAOut.push(i + 1);
    } else {
      dofBOut.push(i + 1);
    }
    for (let j = 1; j < 2; j++) {
      if (faces[i].constraints[0] === 0) {
        dofAIn.push(2 * i + j);
      } else {
        dofBIn.push(2 * i + j);
      }
    }
  }

  return {
    dofAOut,
    dofBOut,
    dofAIn,
    dofBIn
  };
}

export default calcDof;
