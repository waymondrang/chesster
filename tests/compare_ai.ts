import { ChessterAI } from "../ai";
import { ChessterAI as OldChessterAI } from "../ai.old";
import { ChessterGame } from "../game";

const game = new ChessterGame();

const compareAI = new ChessterAI(game);
const baselineAI = new OldChessterAI(game);

const games = 1;

for (let i = 0; i < games; i++) {
  game.init();

  while (!game.bcm && !game.wcm && !game.sm) {
    console.log("moving compareAI (white)");
    compareAI.makeMove();
    console.log(game.ascii());
    if (game.bcm || game.wcm || game.sm) break;
    console.log("moving baselineAI (black)");
    baselineAI.makeMove();
    console.log(game.ascii());
  }

  console.log(
    `game ${i + 1}: ${game.wcm ? "white" : game.bcm ? "black" : "stalemate"}`
  );
  console.log(game.ascii());
}
