import { ChessterGame } from "./game";
import { ChessterBoardString } from "./types";
import { boardStringToArray, fenStringToBoard } from "./util";

const testBoard: ChessterBoardString = [
  ["♜", "♞", "♝", "♛", "♚", "♝", "♞", "♜"],
  ["♟︎", "♟︎", "♟︎", "♟︎", "♟︎", "", "♟︎", "♟︎"],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", "♕"],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["♙", "", "♙", "♙", "", "♙", "♙", "♙"],
  ["", "♘", "♗", "", "♔", "", "♘", "♖"],
];

const game = new ChessterGame({
  board: fenStringToBoard("rnbqkbnr/ppppp1pp/8/7Q/8/8/PPPPPPPP/RNB1KBNR"),
});

console.log(game.boardToString());

console.log(game.bc, game.bcc);
