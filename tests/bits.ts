// first 3 bits represent piece, next bit represents team
// team: 0 represents white, 1 represents black

function dec2bin(dec: number) {
  return (dec >>> 0).toString(2);
}

const pieces = [
  0b0000, // king
  0b0001, // queen
  0b0010, // bishop
  0b0011, // knight
  0b0100, // rook
  0b0010, // bishop
  0b0011, // knight
  0b0100, // rook
  0b0101, // pawn
  0b0101, // pawn
  0b0101, // pawn
  0b0101, // pawn
  0b0101, // pawn
  0b0101, // pawn
  0b0101, // pawn
  0b0101, // pawn
  // enemy team
  0b1000, // king
  0b1001, // queen
  0b1010, // bishop
  0b1011, // knight
  0b1100, // rook
  0b1010, // bishop
  0b1011, // knight
  0b1100, // rook
  0b1101, // pawn
  0b1101, // pawn
  0b1101, // pawn
  0b1101, // pawn
  0b1101, // pawn
  0b1101, // pawn
  0b1101, // pawn
  0b1101, // pawn
];

const outer_count = 1000;
const inner_count = 1000;

var count = 0;
var time = 0;
var enemyCount = 0;
var pieceCount = 0; // number of pawn pieces

const outerStartTime = performance.now();

for (let j = 0; j < outer_count; j++) {
  const innerStartTime = performance.now();
  for (let i = 0; i < inner_count; i++) {
    for (const piece of pieces) {
      // calculate team
      let team: number = piece & 0b1000;
      // increment enemy count if enemy
      if (team === 0b1000) enemyCount++;
      // === binary number without shift seems to be more performant

      // calculate piece type
      let pieceType: number = piece & 0b0111;
      // increment piece count if pawn
      if (pieceType === 0b101) pieceCount++;
      // increment count
      count++;
    }
  }
  time += performance.now() - innerStartTime;
  console.log("finished iteration: " + (j + 1) + "/1000");
}

const outerEndTime = performance.now();

console.log("finished all iterations (bits, " + new Date().toString() + ")");
console.log("outer count: " + outer_count);
console.log("inner count: " + inner_count);
console.log("count: " + count);
console.log("piece count: " + pieceCount);
console.log("enemy count: " + enemyCount);
console.log("time elapsed (inner): " + time + "ms");
console.log("time elapsed (outer): " + (outerEndTime - outerStartTime) + "ms");
console.log(
  "average time elapsed (inner) per iteration: " + time / outer_count + "ms"
);
console.log(
  "average time elapsed (outer) per iteration: " +
    (outerEndTime - outerStartTime) / outer_count +
    "ms"
);
