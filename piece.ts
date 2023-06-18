import { ChessterBoard } from "./board";
import { ChessterLocation } from "./location";
import { WHITE, location, piece, team } from "./types";

export class ChessterPiece {
  piece: piece;
  team: team;
  location: ChessterLocation;
  #board: ChessterBoard;

  constructor(location: ChessterLocation, piece: piece, team: team) {
    this.#board = location.getBoard();
    this.location = location;
    this.piece = piece;
    this.team = team;
  }

  getTeam() {
    return this.team;
  }

  move(location1: ChessterLocation, location2: ChessterLocation) {
    location1.setPiece(undefined);
    location2.setPiece(this);
    // this.location = location2; // this is handled by setPiece
  }

  isEnemy(piece: ChessterPiece): boolean {
    return this.team !== piece.team;
  }

  isAlly(piece: ChessterPiece): boolean {
    return this.team === piece.team;
  }

  toString(): string {
    return `${this.team} ${this.piece} at ${this.location.toString()}`;
  }

  getAvailableMoves(): location[] {
    switch (this.piece) {
      case "king":
        return this.getKingMoves();
      case "pawn":
        return this.getPawnMoves();
      case "rook":
        return this.getRookMoves();
      case "bishop":
        return this.getBishopMoves();
      case "knight":
        return this.getKnightMoves();
      case "queen":
        return this.getQueenMoves();
      default:
        return [];
    }
  }

  getAvailableMovesWithPerformance(): [location[], number] {
    const start = performance.now();
    const moves = this.getAvailableMoves();
    const end = performance.now();
    console.log(
      `getAvailableMoves() for ${this.toString()} took ${
        end - start
      } milliseconds.`
    );
    return [moves, end - start];
  }

  checkOutOfBounds(i: number, j: number): boolean {
    return i < 0 || i > 7 || j < 0 || j > 7;
  }

  getKingMoves(): location[] {
    const moves: location[] = [];
    for (let i = -1; i < 2; i++) {
      for (let j = -1; j < 2; j++) {
        if (i === 0 && j === 0) continue;
        const location = this.#board.get([
          this.location.x + i,
          this.location.y + j,
        ]);
        if (!location) continue;
        if (
          location.getPiece() === undefined ||
          this.isEnemy(location.getPiece()!)
        )
          moves.push([this.location.x + i, this.location.y + j]);
      }
    }
    return moves;
  }

  getPawnMoves(): location[] {
    const moves: location[] = [];
    const direction = this.team === WHITE ? 1 : -1;
    if (
      (this.location.y === 1 || this.location.y === 6) &&
      this.#board
        .get([this.location.x, this.location.y + direction * 2])
        ?.isEmpty()
    )
      moves.push([this.location.x, this.location.y + 2]);
    if (
      this.#board.get([this.location.x, this.location.y + direction])?.isEmpty()
    )
      moves.push([this.location.x, this.location.y + direction]);
    if (
      this.#board
        .get([this.location.x + 1, this.location.y + direction])
        ?.getPiece()
        ?.isEnemy(this)
    )
      moves.push([this.location.x + 1, this.location.y + 1]);
    if (
      this.#board
        .get([this.location.x - 1, this.location.y + direction])
        ?.getPiece()
        ?.isEnemy(this)
    )
      moves.push([this.location.x - 1, this.location.y + direction]);
    return moves;
  }

  getRookMoves(): location[] {
    const moves: location[] = [];
    console.log("Getting rook moves");
    for (let i = 1; i < 8; i++) {
      if (this.#board.get([this.location.x + i, this.location.y])?.isEmpty())
        moves.push([this.location.x + i, this.location.y]);
      else if (
        this.#board
          .get([this.location.x + i, this.location.y])
          ?.getPiece()
          ?.isEnemy(this)
      ) {
        moves.push([this.location.x + i, this.location.y]);
        break;
      } else break;
    }
    for (let i = -7; i < 0; i++) {
      if (
        this.#board.get([this.location.x + i, this.location.y])?.isEmpty() ||
        this.#board
          .get([this.location.x + i, this.location.y])
          ?.getPiece()
          ?.isEnemy(this)
      )
        moves.push([this.location.x + i, this.location.y]);
      else break;
    }
    for (let i = 1; i < 8; i++) {
      if (this.#board.get([this.location.x, this.location.y + i])?.isEmpty())
        moves.push([this.location.x, this.location.y + i]);
      else if (
        this.#board
          .get([this.location.x, this.location.y + i])
          ?.getPiece()
          ?.isEnemy(this)
      ) {
        moves.push([this.location.x, this.location.y + i]);
        break;
      } else break;
    }
    for (let i = -7; i < 0; i++) {
      if (this.#board.get([this.location.x, this.location.y + i])?.isEmpty())
        moves.push([this.location.x, this.location.y + i]);
      else if (
        this.#board
          .get([this.location.x, this.location.y + i])
          ?.getPiece()
          ?.isEnemy(this)
      ) {
        moves.push([this.location.x, this.location.y + i]);
        break;
      } else break;
    }
    return moves;
  }

  getKnightMoves(): location[] {
    const moves: location[] = [];
    for (let i = -2; i < 3; i++) {
      if (i === 0) continue;
      for (let j = -2; j < 3; j++) {
        if (j === 0 || Math.abs(i) === Math.abs(j)) continue;
        const location = this.#board.get([
          this.location.x + i,
          this.location.y + j,
        ]);
        if (!location) continue;
        if (
          location.getPiece() === undefined ||
          this.isEnemy(location.getPiece()!)
        )
          moves.push([this.location.x + i, this.location.y + j]);
      }
    }
    return moves;
  }

  getBishopMoves(): location[] {
    const moves: location[] = [];
    for (let i = 1; i < 8; i++) {
      if (
        this.#board.get([this.location.x + i, this.location.y + i])?.isEmpty()
      )
        moves.push([this.location.x + i, this.location.y + i]);
      else if (
        this.#board
          .get([this.location.x + i, this.location.y + i])
          ?.getPiece()
          ?.isEnemy(this)
      ) {
        moves.push([this.location.x + i, this.location.y + i]);
        break;
      } else break;
    }
    for (let i = -7; i < 0; i++) {
      if (
        this.#board.get([this.location.x + i, this.location.y + i])?.isEmpty()
      )
        moves.push([this.location.x + i, this.location.y + i]);
      else if (
        this.#board
          .get([this.location.x + i, this.location.y + i])
          ?.getPiece()
          ?.isEnemy(this)
      ) {
        moves.push([this.location.x + i, this.location.y + i]);
        break;
      } else break;
    }
    for (let i = 1; i < 8; i++) {
      if (
        this.#board.get([this.location.x - i, this.location.y + i])?.isEmpty()
      )
        moves.push([this.location.x - i, this.location.y + i]);
      else if (
        this.#board
          .get([this.location.x - i, this.location.y + i])
          ?.getPiece()
          ?.isEnemy(this)
      ) {
        moves.push([this.location.x - i, this.location.y + i]);
        break;
      } else break;
    }
    for (let i = -7; i < 0; i++) {
      if (
        this.#board.get([this.location.x - i, this.location.y + i])?.isEmpty()
      )
        moves.push([this.location.x - i, this.location.y + i]);
      else if (
        this.#board
          .get([this.location.x - i, this.location.y + i])
          ?.getPiece()
          ?.isEnemy(this)
      ) {
        moves.push([this.location.x - i, this.location.y + i]);
        break;
      } else break;
    }
    return moves;
  }

  getQueenMoves(): location[] {
    const moves: location[] = [];
    for (let i = 1; i < 8; i++) {
      if (this.#board.get([this.location.x + i, this.location.y])?.isEmpty())
        moves.push([this.location.x + i, this.location.y]);
      else if (
        this.#board
          .get([this.location.x + i, this.location.y])
          ?.getPiece()
          ?.isEnemy(this)
      ) {
        moves.push([this.location.x + i, this.location.y]);
        break;
      } else break;
    }
    for (let i = -7; i < 0; i++) {
      if (this.#board.get([this.location.x + i, this.location.y])?.isEmpty())
        moves.push([this.location.x + i, this.location.y]);
      else if (
        this.#board
          .get([this.location.x + i, this.location.y])
          ?.getPiece()
          ?.isEnemy(this)
      ) {
        moves.push([this.location.x + i, this.location.y]);
        break;
      } else break;
    }
    for (let i = 1; i < 8; i++) {
      if (this.#board.get([this.location.x, this.location.y + i])?.isEmpty())
        moves.push([this.location.x, this.location.y + i]);
      else if (
        this.#board
          .get([this.location.x, this.location.y + i])
          ?.getPiece()
          ?.isEnemy(this)
      ) {
        moves.push([this.location.x, this.location.y + i]);
        break;
      } else break;
    }
    for (let i = -7; i < 0; i++) {
      if (this.#board.get([this.location.x, this.location.y + i])?.isEmpty())
        moves.push([this.location.x, this.location.y + i]);
      else if (
        this.#board
          .get([this.location.x, this.location.y + i])
          ?.getPiece()
          ?.isEnemy(this)
      ) {
        moves.push([this.location.x, this.location.y + i]);
        break;
      } else break;
    }
    for (let i = 1; i < 8; i++) {
      if (
        this.#board.get([this.location.x + i, this.location.y + i])?.isEmpty()
      )
        moves.push([this.location.x + i, this.location.y + i]);
      else if (
        this.#board
          .get([this.location.x + i, this.location.y + i])
          ?.getPiece()
          ?.isEnemy(this)
      ) {
        moves.push([this.location.x + i, this.location.y + i]);
        break;
      } else break;
    }
    for (let i = -7; i < 0; i++) {
      if (
        this.#board.get([this.location.x + i, this.location.y + i])?.isEmpty()
      )
        moves.push([this.location.x + i, this.location.y + i]);
      else if (
        this.#board
          .get([this.location.x + i, this.location.y + i])
          ?.getPiece()
          ?.isEnemy(this)
      ) {
        moves.push([this.location.x + i, this.location.y + i]);
        break;
      } else break;
    }
    for (let i = 1; i < 8; i++) {
      if (
        this.#board.get([this.location.x - i, this.location.y + i])?.isEmpty()
      )
        moves.push([this.location.x - i, this.location.y + i]);
      else if (
        this.#board
          .get([this.location.x - i, this.location.y + i])
          ?.getPiece()
          ?.isEnemy(this)
      ) {
        moves.push([this.location.x - i, this.location.y + i]);
        break;
      } else break;
    }
    for (let i = -7; i < 0; i++) {
      if (
        this.#board.get([this.location.x - i, this.location.y + i])?.isEmpty()
      )
        moves.push([this.location.x - i, this.location.y + i]);
      else if (
        this.#board
          .get([this.location.x - i, this.location.y + i])
          ?.getPiece()
          ?.isEnemy(this)
      ) {
        moves.push([this.location.x - i, this.location.y + i]);
        break;
      } else break;
    }
    return moves;
  }
}
