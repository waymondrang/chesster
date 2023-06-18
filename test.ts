import { ChessterGame } from "./game";
import { piece_string } from "./types";

const game = new ChessterGame();

const board: piece_string[][] = [
  ["br", "bn", "bb", "bq", "bk", "bb", "bn", "br"],
  ["bp", "bp", "bp", "bp", "bp", "bp", "bp", "bp"],
  ["  ", "  ", "  ", "  ", "  ", "  ", "wn", "  "],
  ["  ", "  ", "  ", "  ", "  ", "  ", "  ", "  "],
  ["  ", "  ", "  ", "  ", "  ", "  ", "  ", "  "],
  ["  ", "  ", "  ", "  ", "  ", "  ", "  ", "  "],
  ["wp", "wp", "wp", "wp", "wp", "wp", "wp", "wp"],
  ["wr", "wn", "wb", "wq", "wk", "wb", "wn", "wr"],
];

game.init(board);

console.log(
  game.board.get([7, 6])!.getPiece()!.getAvailableMovesWithPerformance()
);
