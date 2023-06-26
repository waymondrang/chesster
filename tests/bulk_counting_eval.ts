/**
 * this file can create a random board
 * and test the speed of a function
 */
import { ChessterGame } from "../game";
import {
  ChessterBoard,
  ChessterBoardString,
  ChessterGameState,
  ChessterMove,
  ChessterPieceString,
  WHITE,
} from "../types";
import {
  bCompareState,
  boardStringToBoard,
  dCopyState,
  rotateRight,
} from "../util";

const game = new ChessterGame();

function countBulkPositions(
  gameState: ChessterGameState,
  depth: number
): number {
  if (depth <= 0) return 1;

  const pieces =
    gameState.turn === WHITE ? gameState.white.pieces : gameState.black.pieces;

  let moves: ChessterMove[] = [];
  let count = 0;

  for (let piece of pieces) {
    moves.push(...game.getAvailableMoves(piece));
  }

  for (let move of moves) {
    game.init(dCopyState(gameState));
    game.move(move);
    count += countBulkPositions(game.getState(), depth - 1);
  }

  return count;
}

function measureCountBulkPositions(depth: number) {
  const startTime = performance.now();

  game.init();

  const count = countBulkPositions(game.getState(), depth);
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
const depth = 4;

console.log("CHESSTER BULK COUNTING EVALUATION");
console.log();
for (var i = 0; i < n; i++) {
  for (var d = 0; d < depth; d++) {
    measureCountBulkPositions(d + 1);
  }
  console.log();
}
