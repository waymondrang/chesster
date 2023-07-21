import { ChessterAI } from "../ai";
import { ChessterGame } from "../game";
import { messageTypes } from "../types";

const game = new ChessterGame();
const ai = new ChessterAI(game);

postMessage({
  type: messageTypes.SETTINGS,
  settings: {
    depth: ai.depth,
    pseudoLegalEvaluation: ai.pseudoLegalEvaluation,
    searchAlgorithm: ai.searchAlgorithm,
    visualizeSearch: ai.visualizeSearch,
  },
});

onmessage = function (event: MessageEvent) {
  switch (event.data.type) {
    case messageTypes.MOVE:
      game.init(event.data.state);
      const move = ai.makeMove();
      postMessage({ type: messageTypes.MOVE, move });
      break;
    case messageTypes.SETTINGS:
      ai.depth = event.data.settings.depth;
      ai.pseudoLegalEvaluation = event.data.settings.pseudoLegalEvaluation;
      ai.searchAlgorithm = event.data.settings.searchAlgorithm;
      ai.visualizeSearch = event.data.settings.visualizeSearch;
      break;
  }
};
