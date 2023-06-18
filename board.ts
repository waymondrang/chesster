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
  whitePieces: ChessterPiece[];
  blackPieces: ChessterPiece[];

  constructor() {
    this.board = [];
    this.whitePieces = [];
    this.blackPieces = [];

    for (let i = 0; i < 8; i++) {
      this.board.push([]);
      for (let j = 0; j < 8; j++) {
        this.board[i].push(new ChessterLocation(this, i, j));
      }
    }
  }

  init(board: pieceBoard = defaultBoard) {
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        let location = this.board[j][i];
        if (board[7 - i][j] !== "") {
          let piece = new ChessterPiece(location, <piece>board[7 - i][j]);
          location.setPiece(piece);

          if (piece.getTeam() === WHITE) {
            this.whitePieces.push(piece);
          } else {
            this.blackPieces.push(piece);
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
    if (this.checkOutOfBounds(location)) return undefined;
    return this.board[location[0]][location[1]];
  }

  set(location: location, piece: ChessterPiece) {
    if (this.checkOutOfBounds(location)) throw new Error("Out of bounds");
    this.board[location[0]][location[1]].setPiece(piece);
  }
}
