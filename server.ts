import express from "express";
import { ChessterGame } from "./game";
import { ChessterBoardString, ChessterMove, moveTypes } from "./types";
import { boardStringToBoard } from "./util";

const app = express();
const game = new ChessterGame();

const newBoard: ChessterBoardString = [
  ["♜", "♞", "♝", "♛", "♚", "♝", "♞", "♜"],
  ["♟︎", "♟︎", "♟︎", "♟︎", "♟︎", "♟︎", "♟︎", "♟︎"],
  new Array(8).fill(undefined),
  new Array(8).fill(undefined),
  new Array(8).fill(undefined),
  new Array(8).fill(undefined),
  ["♙", "♙", "♙", "♙", "♙", "♙", "♙", "♙"],
  ["♖", "♘", "♗", "♕", "♔", "♗", "♘", "♖"],
];

game.init({ board: boardStringToBoard(newBoard) });

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

  game.validateAndMove(data);

  // console.log("White in check: " + game.white.checked);
  // console.log("Black in check: " + game.black.checked);
  // console.log("White in checkmate: " + game.white.checkmated);
  // console.log("Black in checkmate: " + game.black.checkmated);

  response.send({ board: game.board, turn: game.turn });
});

app.post("/restart", (request, response) => {
  game.init({ board: boardStringToBoard(newBoard) });
  response.send({ board: game.board, turn: game.turn });
});

app.listen(3000, () => {
  console.log("chesster server listening at http://localhost:3000");
});
