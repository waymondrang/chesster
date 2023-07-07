/**
 * this file can create a random board
 * and test the speed of a function
 */
import { Chess } from "chess.js";

const chess = new Chess();

function countBulkPositions(depth: number): number {
  if (depth <= 0) return 1;

  let count = 0;

  const moves = chess.moves();

  for (let j = 0; j < moves.length; j++) {
    chess.move(moves[j]);
    count += countBulkPositions(depth - 1);
    chess.undo();
  }

  return count;
}

function measureCountBulkPositions(depth: number) {
  const startTime = performance.now();

  //   const fen = "bqnb1rkr/pp3ppp/3ppn2/2p5/5P2/P2P4/NPP1P1PP/BQ1BNRKR w - - 2 9";

  //   chess.load(fen);

  const count = countBulkPositions(depth);

  console.log(
    "Depth: " +
      depth +
      "\tNumber of positions: " +
      count +
      "\tTime: " +
      (performance.now() - startTime) +
      "ms"
  );
}

const n = 2;
const depth = 5;

console.log("CHESSTER BULK COUNTING EVALUATION");
console.log();
for (var i = 0; i < n; i++) {
  for (var d = 0; d < depth; d++) {
    measureCountBulkPositions(d + 1);
  }
  console.log();
}
