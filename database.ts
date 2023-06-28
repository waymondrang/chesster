export const moveDatabase: Array<Array<number>> = new Array(
  0b100000000000000
).fill([]);

// maybe this isnt necessary
export function getWhiteKingMoves(
  piece: number,
  location: number
): Array<number> {
  let moves: number[] = [];

  //   const pm = [1, -1, 8, -8, 7, -7, 9, -9];

  //   for (let i = 0; i < pm.length; i++) {
  //     if (
  //       location + pm[i] >= 0 &&
  //       location + pm[i] < 64 &&
  //       ((location + pm[i]) & 0b111) !==
  //         ((((location & 0b111) - 1) >> 1) & 0b111) &&
  //       ((location + pm[i]) & 0b111) !== ((((location & 0b111) + 1) << 1) & 0b111)
  //     )
  //       moves.push(pm[i]);
  //   }

  //   console.log(location, moves);

  //   return moves;

  //   let br = (location & 0b111000) !== 0b111000;
  //   let tr = (location & 0b111000) !== 0;
  //   let lc = (location & 0b111) !== 0;
  //   let rc = (location & 0b111) !== 0b111;

  // white king

  // bottom row
  if ((location & 0b111000) !== 0b111000) moves.push(8);

  // top row
  if ((location & 0b111000) !== 0) moves.push(-8);

  // right-most column
  if ((location & 0b111) !== 0b111) {
    moves.push(1);

    // bottom row
    if ((location & 0b111000) !== 0b111000) moves.push(9);

    // top row
    if ((location & 0b111000) !== 0) moves.push(-7);
  }

  if ((location & 0b111) !== 0) {
    // left-most column
    moves.push(-1);

    // top row
    if ((location & 0b111000) !== 0) moves.push(-9);

    // bottom row
    if ((location & 0b111000) !== 0b111000) moves.push(7);
  }

  if ((piece & 0b1) === 1) {
    // black king, flip moves
    var i = moves.length;
    while (i--) moves[i] = -moves[i];
  }

  return moves;
}
