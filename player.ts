import { ChessterPiece } from "./piece";
import { team } from "./types";

export class ChessterPlayer {
  taken: ChessterPiece[];
  team: team;

  constructor(team: team) {
    this.taken = [];
    this.team = team;
  }
}
