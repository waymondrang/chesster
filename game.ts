import { ChessterBoard } from "./board";
import { ChessterMove } from "./move";
import { ChessterPlayer } from "./player";
import {
  BLACK,
  WHITE,
  history,
  moveTypes,
  piece,
  pieceBoard,
  team,
} from "./types";

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
    this.turn = WHITE;
    this.history = [];
    this.board.init(board);
  }

  move(move: ChessterMove) {
    if (move.piece.getTeam() !== this.turn) {
      throw new Error("Wrong team");
    }

    if (move.type === moveTypes.CASTLE) {
      if (!move.castle) throw new Error("Castle move has no castle property");
      move.castle.to.setPiece(move.castle.piece);
      move.castle.from.setPiece(undefined);
    } else if (move.type === moveTypes.CAPTURE) {
      if (!move.take) throw new Error("Capture move has no take property");
      move.take.taken = true;
      move.take.location.setPiece(undefined);
      // TODO: capture logic
    }

    move.to.setPiece(move.piece);
    move.from.setPiece(undefined);

    this.history.push(move);

    this.turn = this.turn === WHITE ? BLACK : WHITE;
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

  /**
   * Checks if the enemy team is checked
   * @param team The team to check
   * @returns Whether the enemy team is checked
   */
  checkCheckedEnemy(team: team): boolean {
    for (let piece of this.board.getTeamPieces(team)) {
      let moves = piece.getAvailableMoves();
      for (let move of moves) {
        let take = move.take;
        if (take && (take.piece === "♚" || take.piece === "♔")) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Checks if the enemy team is checkmated
   * @param team The team to check
   * @returns Whether the enemy team is checkmated
   * @todo Implement this
   */
  checkCheckmatedEnemy(team: team): boolean {
    return false;
  }
}
