import { ChessterBoard } from "./board";
import { ChessterPlayer } from "./player";
import { BLACK, WHITE, piece_string, team } from "./types";

export class ChessterGame {
  board: ChessterBoard;
  white: ChessterPlayer;
  black: ChessterPlayer;
  turn: team;

  constructor() {
    this.board = new ChessterBoard();
    this.white = new ChessterPlayer(WHITE);
    this.black = new ChessterPlayer(BLACK);
    this.turn = WHITE;
  }

  init(board?: piece_string[][]) {
    this.board.init(board);
  }
}
