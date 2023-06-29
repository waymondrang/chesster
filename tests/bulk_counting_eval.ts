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
  boardSize,
} from "../types";

const game = new ChessterGame();

function countBulkPositions(game: ChessterGame, depth: number): number {
  if (depth <= 0) return 1;

  const moves: ChessterMove[] = [];
  let count = 0;

  for (let i = 0; i < boardSize; i++) {
    if (game.board[i] !== 0 && (game.board[i] & 0b1) === game.turn) {
      const moves = game.getAvailableMoves(i);
      for (let j = 0; j < moves.length; j++) {
        game.move(moves[j], i);
        count += countBulkPositions(game, depth - 1);
      }
    }
  }

  return count;
}

function measureCountBulkPositions(depth: number) {
  const startTime = performance.now();

  game.init();

  const count = countBulkPositions(game, depth);
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
