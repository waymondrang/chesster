import { Chess } from "chess.js";
import { ChessterGame } from "../game";
import { fenStringToGameState } from "../util";

const game = new ChessterGame();
const chess = new Chess();

const n = 2;
const depth = 4;
const fen = "";

function countBulkPositions(depth: number): number {
  if (depth <= 0) return 1;
  let count = 0;

  const moves = chess.moves({ verbose: true });

  for (let i = 0; i < moves.length; i++) {
    chess.move(moves[i]);
    game.validateAndMoveObject(moves[i]);

    count += countBulkPositions(depth - 1);

    game.undo();
    chess.undo();
  }

  return count;
}

function measureCountBulkPositions(depth: number) {
  const startTime = performance.now();

  if (fen !== "") {
    game.init(fenStringToGameState(fen));
    chess.load(fen);
  }

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
