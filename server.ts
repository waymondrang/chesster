import express from "express";
import { ChessterGame } from "./game";
import {
  BLACK,
  ChessterBoardString,
  ChessterMove,
  WHITE,
  moveTypes,
} from "./types";
import { boardStringToBoard } from "./util";
import { ChessterAI } from "./ai";

const app = express();
const game = new ChessterGame();

// const newBoard: ChessterBoardString = [
//   ["♜", "♞", "♝", "♛", "♚", "♝", "", ""],
//   ["♟︎", "♟︎", "♟︎", "♟︎", "♟︎", "♟︎", "", "♙"],
//   new Array(8).fill(undefined),
//   new Array(8).fill(undefined),
//   new Array(8).fill(undefined),
//   new Array(8).fill(undefined),
//   ["♙", "♙", "♙", "♙", "♙", "♙", "♙", "♙"],
//   ["♖", "♘", "♗", "♕", "♔", "♗", "♘", "♖"],
// ];

// game.init({ board: boardStringToBoard(newBoard) });

app.use(express.static("public"));
app.use(express.json());

app.get("/chessboard", (request, response) => {
  response.send({ board: game.board, turn: game.turn });
});

app.get("/moveTypes", (request, response) => {
  response.send(moveTypes);
});

app.post("/getMoves", (request, response) => {
  let data = request.body;
  let piece = game.board[data.x][data.y];

  if (!piece) {
    response.send([]);
    return;
  }

  let moves = game.getAvailableMoves(piece);
  response.send(moves);
});

app.post("/move", (request, response) => {
  const data: ChessterMove = request.body;

  console.log("move: " + JSON.stringify(data));

  game.validateAndMove(data);

  console.log("turn: " + game.turn);
  console.log("white in check: " + game.white.checked);
  console.log("black in check: " + game.black.checked);
  console.log("white in checkmate: " + game.white.checkmated);
  console.log("black in checkmate: " + game.black.checkmated);

  if (
    (game.turn === WHITE && game.white.checkmated) ||
    (game.turn === BLACK && game.black.checkmated)
  ) {
    console.log("checkmate (game over)");
    response.send({ board: game.board, turn: game.turn, checkmate: true });
  } else {
    const ai = new ChessterAI(game);
    const aiMove = ai.getNextMove();

    if (aiMove) {
      game.validateAndMove(aiMove);
    } else {
      throw new Error("ai returned undefined move");
    }

    console.log("turn: " + game.turn);
    console.log("white in check: " + game.white.checked);
    console.log("black in check: " + game.black.checked);
    console.log("white in checkmate: " + game.white.checkmated);
    console.log("black in checkmate: " + game.black.checkmated);

    response.send({
      board: game.board,
      moved: game.history.at(-1),
      turn: game.turn,
    });
  }
});

app.post("/restart", (request, response) => {
  game.init();
  response.send({ board: game.board, turn: game.turn });
});

app.listen(3000, () => {
  console.log("chesster server listening at http://localhost:3000");
});
