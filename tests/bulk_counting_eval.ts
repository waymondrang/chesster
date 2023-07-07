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
const chess = new Chess();

function countBulkPositions(depth: number): number {
  if (depth <= 0) return 1;
  let count = 0;

  for (let i = 0; i < boardSize; i++) {
    if (game.board[i] !== 0 && (game.board[i] & 0b1) === game.turn) {
      const moves = game.getAvailableMoves(i);
      for (let j = 0; j < moves.length; j++) {
        // console.log(
        //   "[test] simulating move: " +
        //     binaryToString(moves[j]) +
        //     " from: " +
        //     ((moves[j] >> 14) & 0b111111) +
        //     " to: " +
        //     ((moves[j] >> 8) & 0b111111) +
        //     " move type: " +
        //     getKeyByValue(moveTypes, (moves[j] >> 4) & 0b1111) +
        //     " original piece: " +
        //     numberToPieceString(moves[j] & 0b1111)
        // );
        // console.log("[chess js] fen string: " + chess.fen());
        // console.log(
        //   "[chesster] starting chesster board:\n" + game.boardToString()
        // );
        // console.log("[chess js] starting chessjs board:\n" + chess.ascii());

        game.move(moves[j]);

        try {
          chess.move(moveToMoveObject(moves[j]));
        } catch (e) {
          console.log(binaryToString(moves[j]));
          console.log(chess.fen());
          console.log(chess.ascii());
          console.log(game.boardToString());
          game.undo();
          console.log(game.boardToString());
          throw e;
        }

        if (!compareChessJSBoardWithChessterBoard(chess.board(), game.board)) {
          console.log(chess.ascii());
          console.log(game.boardToString());
          game.undo();
          console.log(game.boardToString());
          chess.undo();
          console.log(chess.ascii());
          console.log(chess.fen());
          throw new Error("boards are not equal");
        }

        count += countBulkPositions(depth - 1);

        game.undo();
        chess.undo();
      }
    }
  }

  return count;
}

function measureCountBulkPositions(depth: number) {
  const startTime = performance.now();

  // game.init(
  //   fenStringToGameState(
  //     "rnbqkbnr/pp1ppppp/8/2p5/2PP4/8/PP2PPPP/RNBQKBNR b KQkq - 0 2"
  //   )
  // );

  // chess.load("rnbqkbnr/pp1ppppp/8/2p5/2PP4/8/PP2PPPP/RNBQKBNR b KQkq - 0 2");

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
