import { ChessterGame } from "./game";
import { ChessterLocation } from "./location";
import { ChessterPiece } from "./piece";
import { moveData, moveType, piece } from "./types";

export class ChessterMove {
  castle: ChessterMove | undefined;
  piece: ChessterPiece;
  from: ChessterLocation;
  to: ChessterLocation;
  type: moveType;
  take: ChessterPiece | undefined;
  promotion: piece | undefined;
  enPassant: ChessterLocation | undefined;

  constructor(
    piece: ChessterPiece,
    from: ChessterLocation,
    to: ChessterLocation,
    type: moveType,
    special?: {
      take?: ChessterPiece;
      promotion?: piece;
      castle?: ChessterMove;
      enPassant?: ChessterLocation;
    }
  ) {
    this.piece = piece;
    this.from = from;
    this.to = to;
    this.type = type;
    this.take = special?.take;
    this.promotion = special?.promotion;
    this.castle = special?.castle;
    this.enPassant = special?.enPassant;
  }

  toString(): string {
    return (
      this.type +
      " " +
      this.piece.piece +
      " from " +
      this.from.coordString() +
      " to " +
      this.to.coordString() +
      (this.promotion ? " promoting to " + this.promotion : "") +
      (this.take ? " taking " + this.take.location.toString() : "") +
      (this.enPassant ? " en passant" : "") +
      (this.castle ? " castling involving " + this.castle.toString() : "")
    );
  }

  /**
   * To send move options to client
   * @returns
   */
  toMoveData(): moveData {
    return {
      from: [this.from.x, this.from.y],
      to: [this.to.x, this.to.y],
      type: this.type,
    };
  }
}
