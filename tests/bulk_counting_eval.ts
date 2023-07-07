/**
 * this file can create a random board
 * and test the speed of a function
 */
import { Chess } from "chess.js";
import { ChessterGame } from "../game";
import {
  ChessterBoard,
  ChessterBoardString,
  ChessterGameState,
  ChessterMove,
  ChessterPieceString,
  WHITE,
  boardSize,
  moveTypes,
  BLACK,
} from "../types";
import {
  compareChessJSBoardWithChessterBoard,
  fenStringToBoard,
  fenStringToGameState,
  binaryToString,
  getKeyByValue,
  moveToMoveObject,
  numberToPieceString,
} from "../util";

const game = new ChessterGame();

function countBulkPositions(depth: number): number {
  if (depth <= 0) return 1;
  let count = 0;

  for (let i = 0; i < boardSize; i++) {
    if (game.board[i] !== 0 && (game.board[i] & 0b1) === game.turn) {
      const moves = game.getAvailableMoves(i);
      for (let j = 0; j < moves.length; j++) {
        game.move(moves[j]);

        count += countBulkPositions(depth - 1);

        game.undo();
      }
    }
  }

  return count;
}

function measureCountBulkPositions(depth: number) {
  const startTime = performance.now();

  const fen =
    "bqnb1rkr/pp3ppp/3ppn2/2p5/5P2/P2P4/NPP1P1PP/BQ1BNRKR w HFhf - 2 9";

  game.init(fenStringToGameState(fen));

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
const depth = 4;

console.log("CHESSTER BULK COUNTING EVALUATION");
console.log();
for (var i = 0; i < n; i++) {
  for (var d = 0; d < depth; d++) {
    measureCountBulkPositions(d + 1);
  }
  console.log();
}
