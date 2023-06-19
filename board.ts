import { ChessterGame } from "./game";
import { ChessterLocation } from "./location";
import { ChessterPiece } from "./piece";
import {
  BLACK,
  WHITE,
  location,
  locationBoard,
  piece,
  pieceBoard,
  team,
} from "./types";
import { defaultBoard } from "./util";

export class ChessterBoard {
  // 8 x 8 board
  board: locationBoard;
  game: ChessterGame;

  constructor(game: ChessterGame) {
    this.board = [];
    this.game = game;
  }

  init(board: pieceBoard = defaultBoard) {
    this.board = [];

    for (let i = 0; i < 8; i++) {
      this.board.push([]);
      for (let j = 0; j < 8; j++) {
        this.board[i].push(new ChessterLocation(this, i, j));
      }
    }

    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        let location = this.board[j][i];
        if (board[7 - i][j] !== "") {
          let piece = new ChessterPiece(location, <piece>board[7 - i][j]);
          location.setPiece(piece);

          if (piece.getTeam() === WHITE) {
            this.game.white.addPiece(piece);
          } else {
            this.game.black.addPiece(piece);
          }
        }
      }
    }
  }

  checkOutOfBounds(location: location): boolean {
    return (
      location[0] < 0 || location[0] > 7 || location[1] < 0 || location[1] > 7
    );
  }

  get(location: location): ChessterLocation | undefined {
    if (this.checkOutOfBounds(location)) return;
    return this.board[location[0]][location[1]];
  }

  toPieceBoard(): pieceBoard {
    let board: pieceBoard = [];
    for (let i = 0; i < 8; i++) {
      board.push([]);
      for (let j = 0; j < 8; j++) {
        let piece = this.board[j][i].piece;
        board[i].push(piece ? piece.piece : "");
      }
    }
    return board;
  }
}
