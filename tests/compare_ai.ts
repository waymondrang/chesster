import { ChessterAI } from "../ai";
import { ChessterAI as OldChessterAI } from "../ai.old";
import { ChessterGame } from "../game";

const game = new ChessterGame();

const ai2 = new ChessterAI(game);
const ai1 = new OldChessterAI(game);

const games = 1;

var times = {
  ai1: 0,
  ai2: 0,
};

for (let i = 0; i < games; i++) {
  game.init();

  let counter = 0;

  while (!game.bcm && !game.wcm && !game.sm) {
    console.log("move " + counter);

    const ai1StartTime = performance.now();

    ai1.makeMove();

    times["ai1"] += performance.now() - ai1StartTime;

    if (game.bcm || game.wcm || game.sm) break;

    const ai2StartTime = performance.now();

    ai2.makeMove();

    times["ai2"] += performance.now() - ai2StartTime;

    counter++;
  }

  console.log(
    `game ${i + 1}: ${
      game.wcm
        ? "black (ai2) won by checkmate"
        : game.bcm
        ? "white (ai1) won by checkmate"
        : "stalemate"
    }`
  );

  console.log(
    "average think times: ai1: " +
      times["ai1"] / (counter + 1) +
      "ms, ai2: " +
      times["ai2"] / (counter + 1) +
      "ms"
  );
  console.log(game.ascii());
}
