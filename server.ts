import express from "express";
import { ChessterGame } from "./game";
import { ChessterBoardString, ChessterMove, moveTypes } from "./types";

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

game.init(newBoard);

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
  const result = game.validateAndMove(data);

  if (!result) {
    throw new Error("Invalid move");
  }

  response.send({ board: game.board, turn: game.turn });
});

app.post("/restart", (request, response) => {
  game.init(newBoard);
  response.send({ board: game.board, turn: game.turn });
});

app.listen(3000, () => {
  console.log("chesster server listening at http://localhost:3000");
});
