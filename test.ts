import { ChessterGame } from "./game";
import { piece, pieceBoard } from "./types";

const game = new ChessterGame();

const board: pieceBoard = [
  ["♜", "♞", "♝", "♛", "♚", "♝", "♞", "♜"],
  ["♟︎", "♟︎", "♟︎", "♟︎", "♟︎", "♟︎", "♟︎", "♟︎"],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "♙", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["♙", "♙", "♙", "", "♙", "♙", "♙", "♙"],
  ["♖", "♘", "♗", "♕", "♔", "♗", "♘", "♖"],
];

game.init(board);

let startTime = performance.now();
let avgTime = 0;
const iterations = 5000;

for (let k = 0; k < iterations; k++) {
  let totalTime = 0;

  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      let result =
        game.board.board[i][j].piece?.getAvailableMovesWithPerformance();
      if (result) {
        totalTime += result[1];
      }
    }
  }

  avgTime += totalTime;
}

let endTime = performance.now();
console.log(`Total time: ${endTime - startTime}ms`);
console.log(`Average time: ${avgTime / iterations}ms`);

console.log(game.board.board[0][0].piece?.getAvailableMovesWithPerformance());

game.printBoard();
