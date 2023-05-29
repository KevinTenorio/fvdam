import * as math from 'mathjs';

function calcConsts() {
  const A1 = math.matrix([
    [1, 0, 3, 0],
    [0, 1, 0, 0]
  ]);

  const A2 = math.matrix([
    [1, 0, -3, 0],
    [0, 1, 0, 0]
  ]);

  const A3 = math.matrix([
    [1, 0, 0, 0],
    [0, 1, 0, 3]
  ]);

  const A4 = math.matrix([
    [1, 0, 0, 0],
    [0, 1, 0, -3]
  ]);

  const zeros2x4 = math.zeros(2, 4, 'sparse');

  const AIn = math.concat(
    math.concat(A4, zeros2x4, 1),
    math.concat(zeros2x4, A4, 1),
    math.concat(A1, zeros2x4, 1),
    math.concat(zeros2x4, A1, 1),
    math.concat(A3, zeros2x4, 1),
    math.concat(zeros2x4, A3, 1),
    math.concat(A2, zeros2x4, 1),
    math.concat(zeros2x4, A2, 1),
    0
  );

  const e = math.matrix([
    [1, 0, 0, 0],
    [0, 0, 0, 1],
    [0, 1, 1, 0]
  ]);

  const zeros3x4 = math.zeros(3, 4, 'sparse');

  const EIn = math.concat(
    math.concat(e, zeros3x4, zeros3x4, zeros3x4, 1),
    math.concat(zeros3x4, e, zeros3x4, zeros3x4, 1),
    math.concat(zeros3x4, zeros3x4, e, zeros3x4, 1),
    math.concat(zeros3x4, zeros3x4, zeros3x4, e, 1),
    0
  );

  const v1 = math.matrix([[1, 0, 0, 0]]);
  const v2 = math.matrix([[0, 1, 0, 0]]);
  const v3 = math.matrix([[0, 0, 1, 0]]);
  const v4 = math.matrix([[0, 0, 0, 1]]);

  const MIn = math.concat(
    math.concat(v3, v3, 1),
    math.concat(v1, v1, 1),
    math.concat(v4, v4, 1),
    math.concat(v2, v2, 1),
    0
  );

  const zeros4x1 = math.zeros(4, 1, 'sparse');

  const v3T = math.transpose(v3);
  const v4T = math.transpose(v4);

  const NIn = math.concat(
    math.concat(math.add(v3T, v4T), zeros4x1, 1),
    math.concat(zeros4x1, math.add(v3T, v4T), 1),
    0
  );

  const PIn = math.multiply(
    math.concat(
      math.concat(v3, math.multiply(v3, -1), 1),
      math.concat(math.multiply(v1, -1), v1, 1),
      math.concat(v3, v3, 1),
      math.concat(v1, v1, 1),
      math.concat(v4, math.multiply(v4, -1), 1),
      math.concat(math.multiply(v2, -1), v2, 1),
      math.concat(v4, v4, 1),
      math.concat(v2, v2, 1),
      0
    ),
    0.5
  );

  const AOut = math.concat(A4, A1, A3, A2, 0);

  const EOut = math.identity(8);

  const v1Out = math.matrix([[1, 0]]);
  const v2Out = math.matrix([[0, 1]]);

  const MOut = math.concat(math.concat(v2Out, v2Out, 1), math.concat(v1Out, v1Out, 1), 0);

  const NOut = math.matrix([[0], [0], [1], [1]]);

  const POut = math.multiply(
    math.concat(
      math.concat(v2Out, math.multiply(v2Out, -1), 1),
      math.concat(math.multiply(v1Out, -1), v1Out, 1),
      math.concat(v2Out, v2Out, 1),
      math.concat(v1Out, v1Out, 1),
      0
    ),
    0.5
  );

  return {
    AIn,
    EIn,
    MIn,
    NIn,
    PIn,
    AOut,
    EOut,
    MOut,
    NOut,
    POut
  };
}

export default calcConsts;
