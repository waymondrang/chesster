import { ChessterAI } from "../ai";
import { ChessterGame } from "../game";
import { BLACK, WHITE } from "../types";
import { messageTypes } from "./types";

const game = new ChessterGame();
const ai = new ChessterAI(game, BLACK);

onmessage = function (event: MessageEvent) {
  switch (event.data.type) {
    case messageTypes.MOVE:
      game.init(event.data.state);
      const move = ai.makeMove();
      postMessage({ type: messageTypes.MOVE, move });
      break;
  }
};
