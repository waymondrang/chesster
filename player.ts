import { ChessterGame } from "./game";
import { ChessterPiece } from "./piece";
import { team } from "./types";

export class ChessterPlayer {
  game: ChessterGame;
  taken: ChessterPiece[];
  team: team;

  constructor(game: ChessterGame, team: team) {
    this.game = game;
    this.taken = [];
    this.team = team;
  }
}
