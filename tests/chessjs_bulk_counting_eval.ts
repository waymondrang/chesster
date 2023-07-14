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
  const time = performance.now() - startTime;

  console.log(
    "Depth: " +
      depth +
      "\tNumber of positions: " +
      count +
      "\tTime: " +
      time +
      "ms"
  );

  return time;
}

var depthTimeAverages = new Array(depth).fill(0);

console.log("CHESSTER BULK COUNTING EVALUATION");
console.log();
for (var i = 0; i < n; i++) {
  for (var d = 0; d < depth; d++) {
    const time = measureCountBulkPositions(d + 1);
    depthTimeAverages[d] += time;
  }
  console.log();
}

console.log("AVERAGE TIME PER DEPTH");
for (var d = 0; d < depth; d++) {
  console.log(
    "Depth: " + (d + 1) + "\tAverage time: " + depthTimeAverages[d] / n + "ms"
  );
}
