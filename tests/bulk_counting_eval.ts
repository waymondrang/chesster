import { ChessterGame } from "../game";
import { Chess } from "chess.js";
import { boardSize } from "../types";
import {
  compareChessJSBoardWithChessterBoard,
  fenStringToGameState,
  moveToMoveObject,
  moveToString,
} from "../util";

const game = new ChessterGame();
const chess = new Chess();

const n = 1;
const depth = 5;
const fen: string = "";
const counter: number = 0; // default is 0

// counter 2
function countBulkPositionsCompare(depth: number): number {
  if (depth <= 0) return 1;

  let count = 0;

  for (let i = 0; i < boardSize; i++) {
    if (game.board[i] && (game.board[i] & 0b1) === game.turn) {
      const moves = game.getAvailableMoves(i);
      for (let j = 0; j < moves.length; j++) {
        game.move(moves[j]);

        try {
          chess.move(moveToMoveObject(moves[j]));
        } catch (e) {
          console.log(moveToString(moves[j]));
          console.log(chess.fen());
          console.log(chess.ascii());
          console.log(game.ascii());
          game.undo();
          console.log(game.ascii());
          throw e;
        }

        if (!compareChessJSBoardWithChessterBoard(chess.board(), game.board)) {
          console.log(chess.ascii());
          console.log(game.ascii());
          game.undo();
          console.log(game.ascii());
          chess.undo();
          console.log(chess.ascii());
          console.log(chess.fen());
          throw new Error("boards are not equal");
        }

        count += countBulkPositionsCompare(depth - 1);

        game.undo();
        chess.undo();
      }
    }
  }

  return count;
}

// counter 1
function countBulkPositions(
  depth: number
): [number, number, number, number, number] {
  if (depth <= 0)
    return [
      1,
      (game.history[game.history.length - 1] >>> 20) & 0b1111 ? 1 : 0,
      game.wc || game.bc ? 1 : 0,
      game.wcm || game.bcm ? 1 : 0,
      game.stalemate ? 1 : 0,
    ];

  let count = 0;
  let captures = 0;
  let checks = 0;
  let checkmates = 0;
  let stalemates = 0;

  for (let i = 0; i < boardSize; i++) {
    if (game.board[i] && (game.board[i] & 0b1) === game.turn) {
      const moves = game.getAvailableMoves(i);

      for (let j = 0; j < moves.length; j++) {
        game.move(moves[j]);

        let positions = countBulkPositions(depth - 1);

        count += positions[0];
        captures += positions[1];
        checks += positions[2];
        checkmates += positions[3];
        stalemates += positions[4];

        game.undo();
      }
    }
  }

  return [count, captures, checks, checkmates, stalemates];
}

// counter 0
function countBulkPositionsSimple(depth: number): number {
  if (depth <= 0) return 1;

  const moves = game.moves();

  let count = 0;

  for (let j = 0; j < moves.length; j++) {
    game.move(moves[j]);
    count += countBulkPositionsSimple(depth - 1);
    game.undo();
  }

  return count;
}

function measureCountBulkPositions(depth: number) {
  const startTime = performance.now();

  // console.log(game.getState());

  if (fen !== "") {
    game.init(fenStringToGameState(fen));
    chess.load(fen);
  }

  switch (counter) {
    case 2: {
      const count = countBulkPositionsCompare(depth);
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
    case 1: {
      const count = countBulkPositions(depth);
      const time = performance.now() - startTime;
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
          "\tNumber of stalemates: " +
          count[4] +
          "\tTime: " +
          time +
          "ms"
      );
      return time;
    }
    case 0: {
      const count = countBulkPositionsSimple(depth);
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
  }
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
