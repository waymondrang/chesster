import { ChessterGame } from "./game";
import { ChessterBoardString } from "./types";
import { boardStringToArray, fenStringToBoard } from "./util";

const testBoard: ChessterBoardString = [
  ["♜", "♞", "♝", "♛", "♚", "♝", "♞", "♜"],
  ["♟︎", "♟︎", "♟︎", "♟︎", "♟︎", "♟︎", "♟︎", "♟︎"],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["♙", "", "♙", "♙", "", "♙", "♙", "♙"],
  ["", "♘", "♗", "♕", "♔", "", "♘", "♖"],
];

const game = new ChessterGame({
  board: boardStringToArray(testBoard),
});

console.log(game.boardToString());

console.log(game.getAvailableMoves(59));
