import { Chess } from "chess.js";

const chess = new Chess();

const n = 2;
const depth = 5;
const fen = "";

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

  if (fen !== "") chess.load(fen);

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

console.log("CHESSTER BULK COUNTING EVALUATION");
console.log();
for (var i = 0; i < n; i++) {
  for (var d = 0; d < depth; d++) {
    measureCountBulkPositions(d + 1);
  }
  console.log();
}
