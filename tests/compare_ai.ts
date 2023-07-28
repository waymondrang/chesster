import { ChessterAI } from "../ai";
import { OldChessterAI } from "../ai.old";
import { ChessterGame } from "../game";

const game = new ChessterGame();

const ai1 = new ChessterAI(game, {
  depth: 3,
  pseudoLegalEvaluation: false,
  searchAlgorithm: "negaScout",
});

const ai2 = new OldChessterAI(game, {
  depth: 3,
  pseudoLegalEvaluation: false,
  searchAlgorithm: "negaScout",
});

const games = 1;

////////////////////////
//     end config     //
////////////////////////

var data = {
  ai1: {
    averageMoveTime: 0,
    wins: 0,
  },
  ai2: {
    averageMoveTime: 0,
    wins: 0,
  },
};

for (let i = 0; i < games; i++) {
  game.init();

  let counter = 0;
  let ai1Time = 0;
  let ai2Time = 0;

  while (!game.isGameOver()) {
    console.log("move " + counter);

    const ai1StartTime = performance.now();

    ai1.makeMove(); // ai1 is white

    ai1Time += performance.now() - ai1StartTime;

    console.log(game.ascii());

    if (game.isGameOver()) break;

    const ai2StartTime = performance.now();

    ai2.makeMove(); // ai2 is black

    ai2Time += performance.now() - ai2StartTime;

    counter++;

    console.log(game.ascii());
  }

  console.log(
    `game ${i + 1}: ${
      game.wcm
        ? "black (ai2) won"
        : game.bcm
        ? "white (ai1) won"
        : game.stalemate
        ? "stalemate"
        : "draw"
    }`
  );

  if (game.wcm) data.ai2.wins++;
  else if (game.bcm) data.ai1.wins++;

  data.ai1.averageMoveTime += ai1Time / counter;
  data.ai2.averageMoveTime += ai2Time / counter;

  console.log(game.ascii());
}

data.ai1.averageMoveTime /= games;
data.ai2.averageMoveTime /= games;

console.log(data);
