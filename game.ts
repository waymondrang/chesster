import { ChessterBoard } from "./board";
import { ChessterPlayer } from "./player";
import { BLACK, WHITE, history, move, piece, pieceBoard, team } from "./types";

export class ChessterGame {
  board: ChessterBoard;
  white: ChessterPlayer;
  black: ChessterPlayer;
  turn: team;
  history: history;

  constructor() {
    this.board = new ChessterBoard();
    this.white = new ChessterPlayer(this, WHITE);
    this.black = new ChessterPlayer(this, BLACK);
    this.turn = WHITE;
    this.history = [];
  }

  init(board?: pieceBoard) {
    this.board.init(board);
  }

  move(move: move) {
    this.history.push(move);
  }

  printBoard() {
    for (let i = this.board.board.length; i > 0; i--) {
      let row = "";
      for (let j = 0; j < this.board.board[i - 1].length; j++) {
        row += (this.board.board[j][i - 1].piece?.piece || " ") + " ";
      }
      console.log(row);
    }
  }
}
