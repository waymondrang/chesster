import { ChessterGame } from "./game";
import { ChessterLocation } from "./location";
import { ChessterPiece } from "./piece";
import { moveType, piece } from "./types";

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
   * TODO: omitted promotion and en passant
   * @returns
   */
  toJSON(): any {
    return {
      piece: this.piece.piece,
      from: {
        x: this.from.x,
        y: this.from.y,
      },
      to: {
        x: this.to.x,
        y: this.to.y,
      },
      type: this.type,
      take: this.take?.piece,
      castle: this.castle?.toJSON(),
    };
  }

  static fromJSON(game: ChessterGame, json: any): ChessterMove {
    return new ChessterMove(
      game.board.get([json.from.x, json.from.y])!.piece!,
      game.board.get([json.from.x, json.from.y])!,
      game.board.get([json.to.x, json.to.y])!,
      json.type,
      {
        take: game.board.get([json.to.x, json.to.y])!.piece,
        castle: json.castle
          ? ChessterMove.fromJSON(game, json.castle)
          : undefined,
      }
    );
  }
}
