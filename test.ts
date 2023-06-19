import { ChessterGame } from "./game";
import { ChessterBoardString, ChessterPieceString } from "./types";

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

const numberOfTests = 100;

var averageTime = 0; // do not change

for (let i = 0; i < numberOfTests; i++) {
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

  averageTime += endTime - startTime;
}

console.log("Average time:", averageTime / numberOfTests);
