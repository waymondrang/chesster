import { ChessterGame } from "./game";
import {
  ChessterBoard,
  ChessterBoardString,
  ChessterPieceString,
} from "./types";

const game = new ChessterGame();

const piecesList: ChessterPieceString[] = [
  "♔",
  "♕",
  "♗",
  "♗",
  "♘",
  "♘",
  "♖",
  "♖",
  "♙",
  "♙",
  "♙",
  "♙",
  "♙",
  "♙",
  "♙",
  "♙",
  "♚",
  "♛",
  "♝",
  "♝",
  "♞",
  "♞",
  "♜",
  "♜",
  "♟︎",
  "♟︎",
  "♟︎",
  "♟︎",
  "♟︎",
  "♟︎",
  "♟︎",
  "♟︎",
];

function createRandomBoard(): ChessterBoardString {
  var pieces = piecesList;
  var board: ChessterBoardString = new Array(8)
    .fill(undefined)
    .map(() => new Array(8).fill(undefined));

  for (let i = 0; i < pieces.length; i++) {
    const piece = pieces[i];

    let x = Math.floor(Math.random() * 8);
    let y = Math.floor(Math.random() * 8);

    while (board[x][y]) {
      x = Math.floor(Math.random() * 8);
      y = Math.floor(Math.random() * 8);
    }

    board[x][y] = piece;
  }

  return board;
}

const tests = [1, 10, 100, 1000, 10000, 100000];

const perTest = 3;

for (let x = 0; x < tests.length; x++) {
  for (let p = 0; p < perTest; p++) {
    var averageTime = 0; // do not change

    for (let i = 0; i < tests[x]; i++) {
      let board = createRandomBoard();
      game.init(board);

      let startTime = performance.now();

      for (let j = 0; j < 8; j++) {
        for (let k = 0; k < 8; k++) {
          let piece = game.board[j][k];

          if (!piece) continue;

          let moves = game.getAvailableMoves(piece);
        }
      }

      let endTime = performance.now();

      averageTime =
        averageTime * (x / (x + 1)) + (endTime - startTime) / (x + 1);
    }

    console.log(`Average time for ${tests[x]} #${perTest}:`, averageTime);
  }
}
