import { ChessterGame } from "../game";
import {
  ChessterBoard,
  ChessterBoardString,
  ChessterPieceString,
} from "../types";
import { boardStringToBoard, dCopy, dCopyState, rCompare } from "../util";

// test parameters
const tests = [1, 10, 100, 1000, 10000];

const perTest = 3;

const game = new ChessterGame();

const piecesList: ChessterPieceString[] = [
  "♔",
  "♕",
  "♗",
  "♘",
  "♖",
  "♗",
  "♘",
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
  "♞",
  "♜",
  "♝",
  "♞",
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

let bestTime = Infinity;

for (let x = 0; x < tests.length; x++) {
  for (let p = 0; p < perTest; p++) {
    var averageTime = 0; // do not change

    for (let i = 0; i < tests[x]; i++) {
      let board = createRandomBoard();
      game.init({ board: boardStringToBoard(board) });

      let startTime = performance.now();

      ////////////////////////////
      //    function to test    //
      ////////////////////////////

      game.updateChecked();

      let endTime = performance.now();

      averageTime =
        averageTime * (x / (x + 1)) + (endTime - startTime) / (x + 1);
    }

    if (averageTime < bestTime) bestTime = averageTime;

    console.log("Completed test", p + 1, "of", perTest, "for", tests[x]);
  }

  console.log("Best time for", tests[x], ":", bestTime);
}
