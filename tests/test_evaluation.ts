import { ChessterAI } from "../ai";
import { ChessterGame } from "../game";
import { getPawnStructureMG } from "../pawns";
import { WHITE, boardSize, pieces } from "../types";
import { fenStringToGameState } from "../util";

const game = new ChessterGame(
  fenStringToGameState(
    "rnbqkbnr/pp3ppp/2p1p3/3p4/PP2P2P/2PP1PP1/8/RNBQKBNR b KQkq - 0 3"
  )
);

// const game = new ChessterGame();

const ai = new ChessterAI(game);

var whitePawnTotal = 0,
  blackPawnTotal = 0;

for (let i = 0; i < boardSize; i++) {
  if ((game.board[i] & 0b1) === game.turn)
    whitePawnTotal += getPawnStructureMG(game, i);
  else blackPawnTotal += getPawnStructureMG(game, i);
}

console.log(whitePawnTotal, blackPawnTotal);
