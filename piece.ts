import { ChessterBoard } from "./board";
import { ChessterLocation } from "./location";
import { BLACK, WHITE, location, piece, team } from "./types";

function calculateTeam(piece: piece) {
  switch (piece) {
    case "♔":
    case "♕":
    case "♗":
    case "♘":
    case "♖":
    case "♙":
      return WHITE;
    case "♚":
    case "♛":
    case "♝":
    case "♞":
    case "♜":
    case "♟︎":
      return BLACK;
    default:
      throw new Error("Invalid piece: " + piece);
  }
}

export class ChessterPiece {
  piece: piece;
  team: team;
  location: ChessterLocation;
  #board: ChessterBoard;

  constructor(location: ChessterLocation, piece: piece) {
    this.#board = location.board;
    this.location = location;
    this.piece = piece;
    this.team = calculateTeam(piece);
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

  getAvailableMoves(): location[] {
    switch (this.piece) {
      case "♔":
      case "♚":
        return this.getKingMoves();
      case "♕":
      case "♛":
        return this.getQueenMoves();
      case "♗":
      case "♝":
        return this.getBishopMoves();
      case "♘":
      case "♞":
        return this.getKnightMoves();
      case "♖":
      case "♜":
        return this.getRookMoves();
      case "♙":
      case "♟︎":
        return this.getPawnMoves();
      default:
        throw new Error("Invalid piece: " + this.piece);
    }
  }

  getAvailableMovesWithPerformance(): [location[], number] {
    const start = performance.now();
    const moves = this.getAvailableMoves();
    const end = performance.now();
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
        if (location.piece === undefined || this.isEnemy(location.piece!))
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
      this.#board.get([this.location.x, this.location.y + direction * 2])?.empty
    )
      moves.push([this.location.x, this.location.y + 2]);
    if (this.#board.get([this.location.x, this.location.y + direction])?.empty)
      moves.push([this.location.x, this.location.y + direction]);
    if (
      this.#board
        .get([this.location.x + 1, this.location.y + direction])
        ?.piece?.isEnemy(this)
    )
      moves.push([this.location.x + 1, this.location.y + 1]);
    if (
      this.#board
        .get([this.location.x - 1, this.location.y + direction])
        ?.piece?.isEnemy(this)
    )
      moves.push([this.location.x - 1, this.location.y + direction]);
    return moves;
  }

  getRookMoves(): location[] {
    const moves: location[] = [];
    for (let i = 1; i < 8; i++) {
      if (this.#board.get([this.location.x + i, this.location.y])?.empty)
        moves.push([this.location.x + i, this.location.y]);
      else if (
        this.#board
          .get([this.location.x + i, this.location.y])
          ?.piece?.isEnemy(this)
      ) {
        moves.push([this.location.x + i, this.location.y]);
        break;
      } else break;
    }
    for (let i = 1; i < 8; i++) {
      if (
        this.#board.get([this.location.x - i, this.location.y])?.empty ||
        this.#board
          .get([this.location.x - i, this.location.y])
          ?.piece?.isEnemy(this)
      )
        moves.push([this.location.x - i, this.location.y]);
      else break;
    }
    for (let i = 1; i < 8; i++) {
      if (this.#board.get([this.location.x, this.location.y + i])?.empty)
        moves.push([this.location.x, this.location.y + i]);
      else if (
        this.#board
          .get([this.location.x, this.location.y + i])
          ?.piece?.isEnemy(this)
      ) {
        moves.push([this.location.x, this.location.y + i]);
        break;
      } else break;
    }
    for (let i = 1; i < 8; i++) {
      if (this.#board.get([this.location.x, this.location.y - i])?.empty)
        moves.push([this.location.x, this.location.y - i]);
      else if (
        this.#board
          .get([this.location.x, this.location.y - i])
          ?.piece?.isEnemy(this)
      ) {
        moves.push([this.location.x, this.location.y - i]);
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
        if (location.piece === undefined || this.isEnemy(location.piece!))
          moves.push([this.location.x + i, this.location.y + j]);
      }
    }
    return moves;
  }

  getBishopMoves(): location[] {
    const moves: location[] = [];
    for (let i = 1; i < 8; i++) {
      if (this.#board.get([this.location.x + i, this.location.y + i])?.empty)
        moves.push([this.location.x + i, this.location.y + i]);
      else if (
        this.#board
          .get([this.location.x + i, this.location.y + i])
          ?.piece?.isEnemy(this)
      ) {
        moves.push([this.location.x + i, this.location.y + i]);
        break;
      } else break;
    }
    for (let i = 1; i < 8; i++) {
      if (this.#board.get([this.location.x - i, this.location.y - i])?.empty)
        moves.push([this.location.x - i, this.location.y - i]);
      else if (
        this.#board
          .get([this.location.x - i, this.location.y - i])
          ?.piece?.isEnemy(this)
      ) {
        moves.push([this.location.x - i, this.location.y - i]);
        break;
      } else break;
    }
    for (let i = 1; i < 8; i++) {
      if (this.#board.get([this.location.x - i, this.location.y + i])?.empty)
        moves.push([this.location.x - i, this.location.y + i]);
      else if (
        this.#board
          .get([this.location.x - i, this.location.y + i])
          ?.piece?.isEnemy(this)
      ) {
        moves.push([this.location.x - i, this.location.y + i]);
        break;
      } else break;
    }
    for (let i = 1; i < 8; i++) {
      if (this.#board.get([this.location.x + i, this.location.y - i])?.empty)
        moves.push([this.location.x + i, this.location.y - i]);
      else if (
        this.#board
          .get([this.location.x + i, this.location.y - i])
          ?.piece?.isEnemy(this)
      ) {
        moves.push([this.location.x + i, this.location.y - i]);
        break;
      } else break;
    }
    return moves;
  }

  getQueenMoves(): location[] {
    const moves: location[] = [];
    for (let i = 1; i < 8; i++) {
      if (this.#board.get([this.location.x + i, this.location.y])?.empty)
        moves.push([this.location.x + i, this.location.y]);
      else if (
        this.#board.board[this.location.x + i][this.location.y]?.piece?.isEnemy(
          this
        )
      ) {
        moves.push([this.location.x + i, this.location.y]);
        break;
      } else break;
    }
    for (let i = 1; i < 8; i++) {
      if (this.#board.get([this.location.x - i, this.location.y])?.empty)
        moves.push([this.location.x - i, this.location.y]);
      else if (
        this.#board
          .get([this.location.x - i, this.location.y])
          ?.piece?.isEnemy(this)
      ) {
        moves.push([this.location.x - i, this.location.y]);
        break;
      } else break;
    }
    for (let i = 1; i < 8; i++) {
      if (this.#board.get([this.location.x, this.location.y + i])?.empty)
        moves.push([this.location.x, this.location.y + i]);
      else if (
        this.#board
          .get([this.location.x, this.location.y + i])
          ?.piece?.isEnemy(this)
      ) {
        moves.push([this.location.x, this.location.y + i]);
        break;
      } else break;
    }
    for (let i = 1; i < 8; i++) {
      if (this.#board.get([this.location.x, this.location.y - i])?.empty)
        moves.push([this.location.x, this.location.y - i]);
      else if (
        this.#board.board[this.location.x][this.location.y - i]?.piece?.isEnemy(
          this
        )
      ) {
        moves.push([this.location.x, this.location.y - i]);
        break;
      } else break;
    }
    for (let i = 1; i < 8; i++) {
      if (this.#board.get([this.location.x + i, this.location.y + i])?.empty)
        moves.push([this.location.x + i, this.location.y + i]);
      else if (
        this.#board
          .get([this.location.x + i, this.location.y + i])
          ?.piece?.isEnemy(this)
      ) {
        moves.push([this.location.x + i, this.location.y + i]);
        break;
      } else break;
    }
    for (let i = 1; i < 8; i++) {
      if (this.#board.get([this.location.x - i, this.location.y - i])?.empty)
        moves.push([this.location.x - i, this.location.y - i]);
      else if (
        this.#board
          .get([this.location.x - i, this.location.y - i])
          ?.piece?.isEnemy(this)
      ) {
        moves.push([this.location.x - i, this.location.y - i]);
        break;
      } else break;
    }
    for (let i = 1; i < 8; i++) {
      if (this.#board.get([this.location.x - i, this.location.y + i])?.empty)
        moves.push([this.location.x - i, this.location.y + i]);
      else if (
        this.#board
          .get([this.location.x - i, this.location.y + i])
          ?.piece?.isEnemy(this)
      ) {
        moves.push([this.location.x - i, this.location.y + i]);
        break;
      } else break;
    }
    for (let i = 1; i < 8; i++) {
      if (this.#board.get([this.location.x + i, this.location.y - i])?.empty)
        moves.push([this.location.x + i, this.location.y - i]);
      else if (
        this.#board
          .get([this.location.x + i, this.location.y - i])
          ?.piece?.isEnemy(this)
      ) {
        moves.push([this.location.x + i, this.location.y - i]);
        break;
      } else break;
    }
    return moves;
  }
}
