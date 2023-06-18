import { ChessterBoard } from "./board";
import { ChessterPiece } from "./piece";

export class ChessterLocation {
  x: number;
  y: number;
  empty: boolean;
  piece: ChessterPiece | undefined;
  board: ChessterBoard;

  constructor(
    board: ChessterBoard,
    x: number,
    y: number,
    piece?: ChessterPiece
  ) {
    this.board = board;
    this.x = x;
    this.y = y;
    this.empty = piece === undefined;
    this.piece = piece;
  }

  setPiece(piece: ChessterPiece | undefined) {
    if (piece) piece.location = this;
    this.piece = piece;
    this.empty = piece === undefined;
  }

  isEmpty(): boolean {
    return this.empty;
  }

  getX(): number {
    return this.x;
  }

  getY(): number {
    return this.y;
  }

  coordString(): string {
    return `[${this.x}, ${this.y}]`;
  }

  toString(): string {
    return (this.piece?.piece || "empty") + " @ " + this.coordString();
  }
}
