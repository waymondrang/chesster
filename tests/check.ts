import { ChessterGame } from "../game";
import {
  ChessterBoard,
  ChessterBoardString,
  ChessterPieceString,
} from "../types";
import { boardStringToBoard } from "../util";

// test parameters
const tests = [50000];

const perTest = 3;

const game = new ChessterGame();

const piecesList: ChessterPieceString[] = [
  "♔",
  "♕",
  "♗",
  "♘",
  "♖",
  "♙",
  "♙",
  "♙",
  "♙",
  "♙",
  "♚",
  "♛",
  "♝",
  "♞",
  "♜",
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

for (let x = 0; x < tests.length; x++) {
  for (let p = 0; p < perTest; p++) {
    var averageTime = 0; // do not change
    var gamesChecked = 0;
    var gamesCheckmated = 0;

    for (let i = 0; i < tests[x]; i++) {
      let board = createRandomBoard();
      game.init({ board: boardStringToBoard(board) });

      let startTime = performance.now();

      game.updateChecked();

      gamesChecked += game.white.checked || game.black.checked ? 1 : 0;
      gamesCheckmated += game.white.checkmated || game.black.checkmated ? 1 : 0;

      let endTime = performance.now();

      averageTime =
        averageTime * (x / (x + 1)) + (endTime - startTime) / (x + 1);
    }

    console.log(`Average time for ${tests[x]} #${perTest}:`, averageTime);
    console.log(
      `Games checked: ${gamesChecked} (${(
        (gamesChecked / tests[x]) *
        100
      ).toFixed(2)}%)`
    );
    console.log(
      `Games checkmated: ${gamesCheckmated} (${(
        (gamesCheckmated / tests[x]) *
        100
      ).toFixed(2)}%)`
    );
  }
}
