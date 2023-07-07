import { ChessterGame } from "../game";
import { boardSize } from "../types";
import { fenStringToGameState } from "../util";

const game = new ChessterGame();

const n = 2;
const depth = 5;
const fen = "";
const counter: number = 1;

// counter 1
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

        let positions = countBulkPositions(depth - 1);

        count += positions[0];
        captures += positions[1];
        checks += positions[2];
        checkmates += positions[3];

        game.undo();
      }
    }
  }

  return [count, captures, checks, checkmates];
}

// counter 0
function countBulkPositionsSimple(depth: number): number {
  if (depth <= 0) return 1;

  let count = 0;

  for (let i = 0; i < boardSize; i++) {
    if (game.board[i] !== 0 && (game.board[i] & 0b1) === game.turn) {
      const moves = game.getAvailableMoves(i);
      for (let j = 0; j < moves.length; j++) {
        game.move(moves[j]);
        count += countBulkPositionsSimple(depth - 1);
        game.undo();
      }
    }
  }

  return count;
}

function measureCountBulkPositions(depth: number) {
  const startTime = performance.now();

  if (fen !== "") game.init(fenStringToGameState(fen));

  switch (counter) {
    case 1: {
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
      break;
    }
    case 0: {
      const count = countBulkPositionsSimple(depth);
      console.log(
        "Depth: " +
          depth +
          "\tNumber of positions: " +
          count +
          "\tTime: " +
          (performance.now() - startTime) +
          "ms"
      );
      break;
    }
  }
}

console.log("CHESSTER BULK COUNTING EVALUATION");
console.log();
for (var i = 0; i < n; i++) {
  for (var d = 0; d < depth; d++) {
    measureCountBulkPositions(d + 1);
  }
  console.log();
}
