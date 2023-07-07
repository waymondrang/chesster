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

function countBulkPositions(depth: number): [number, number, number, number] {
  if (depth <= 0)
    return [
      1,
      ((game.history[game.history.length - 1] >>> 20) & 0b1111) !== 0 ? 1 : 0,
      game.wc || game.bc ? 1 : 0,
      game.wcm || game.bcm ? 1 : 0,
    ];

  let count = 0;
  let captures = 0;
  let checks = 0;
  let checkmates = 0;

  for (let i = 0; i < boardSize; i++) {
    if (game.board[i] !== 0 && (game.board[i] & 0b1) === game.turn) {
      const moves = game.getAvailableMoves(i);
      for (let j = 0; j < moves.length; j++) {
        game.move(moves[j]);

        count += countBulkPositions(depth - 1)[0];
        captures += countBulkPositions(depth - 1)[1];
        checks += countBulkPositions(depth - 1)[2];
        checkmates += countBulkPositions(depth - 1)[3];

        game.undo();
      }
    }
  }

  return [count, captures, checks, checkmates];
}

function measureCountBulkPositions(depth: number) {
  const startTime = performance.now();

  const fen = "bqnb1rkr/pp3ppp/3ppn2/2p5/5P2/P2P4/NPP1P1PP/BQ1BNRKR w - - 2 9";

  // game.init(fenStringToGameState(fen));

  const count = countBulkPositions(depth);

  console.log(
    "Depth: " +
      depth +
      "\tNumber of positions: " +
      count[0] +
      "\tNumber of captures: " +
      count[1] +
      "\tNumber of checks: " +
      count[2] +
      "\tNumber of checkmates: " +
      count[3] +
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
