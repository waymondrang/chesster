// first 3 bits represent piece, next bit represents team
// team: 0 represents white, 1 represents black

import { BLACK, ChessterPieceString, ChessterTeam } from "../types";
import { calculateTeam } from "../util";

export {};

function dec2bin(dec: number) {
  return (dec >>> 0).toString(2);
}

const pieces: ChessterPieceString[] = [
  "♔",
  "♕",
  "♗",
  "♘",
  "♖",
  "♗",
  "♘",
  "♖",
  "♙",
  "♙",
  "♙",
  "♙",
  "♙",
  "♙",
  "♙",
  "♙",
  "♚",
  "♛",
  "♝",
  "♞",
  "♜",
  "♝",
  "♞",
  "♜",
  "♟︎",
  "♟︎",
  "♟︎",
  "♟︎",
  "♟︎",
  "♟︎",
  "♟︎",
  "♟︎",
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
      let team: ChessterTeam = calculateTeam(piece);
      // increment enemy count if enemy
      if (team === BLACK) enemyCount++;

      // calculate piece type
      let pieceType: ChessterPieceString = piece;
      // increment piece count if pawn
      if (pieceType === "♟︎" || pieceType === "♙") pieceCount++;
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
