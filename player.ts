import { ChessterGame } from "./game";
import { ChessterPiece } from "./piece";
import { team } from "./types";

export class ChessterPlayer {
  game: ChessterGame;
  taken: ChessterPiece[];
  pieces: ChessterPiece[];
  team: team;

  constructor(game: ChessterGame, team: team) {
    this.game = game;
    this.taken = [];
    this.team = team;
    this.pieces = [];
  }

  addPiece(piece: ChessterPiece) {
    this.pieces.push(piece);
  }

  removePiece(piece: ChessterPiece) {
    this.pieces = this.pieces.filter((p) => p !== piece);
  }
}
