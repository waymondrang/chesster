import { ChessterGame } from "./game";
import { piece, pieceBoard } from "./types";

const game = new ChessterGame();

const piecesList: piece[] = [
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

function createRandomBoard(): pieceBoard {
  var pieces = piecesList;
  var board: pieceBoard = new Array(8)
    .fill("")
    .map(() => new Array(8).fill(""));

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
          let piece = game.board.board[j][k].piece;

          if (!piece) continue;

          let moves = piece.getAvailableMoves();
        }
      }

      let endTime = performance.now();

      averageTime =
        averageTime * (x / (x + 1)) + (endTime - startTime) / (x + 1);
    }

    console.log(`Average time for ${tests[x]} #${perTest}:`, averageTime);
  }
}
