import express from "express";
import { ChessterGame } from "./game";
import { moveType, moveTypes, pieceBoard } from "./types";
import { ChessterMove } from "./move";

const app = express();
const game = new ChessterGame();

const board: pieceBoard = [
  ["♜", "♞", "♝", "♛", "♚", "♝", "♞", "♜"],
  ["♟︎", "♟︎", "♟︎", "♟︎", "♟︎", "♟︎", "♟︎", "♟︎"],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["♙", "♙", "♙", "♙", "♙", "♙", "♙", "♙"],
  ["♖", "♘", "♗", "♕", "♔", "♗", "♘", "♖"],
];

game.init(board);

app.use(express.static("public"));
app.use(express.json());

app.get("/chessboard", (request, response) => {
  response.send({ board: game.board.toPieceBoard(), turn: game.turn });
});

app.get("/moveTypes", (request, response) => {
  response.send(moveTypes);
});

app.post("/availableMoves", (request, response) => {
  //   console.log(request.body);

  let data = request.body;
  let calculated = game.board.get([data.x, data.y])?.piece?.getAvailableMoves();

  //   console.log(calculated);

  let moves: any = [];
  if (calculated) moves = calculated.map((move) => move.toJSON());

  response.send(moves);
});

app.post("/move", (request, response) => {
  let data = request.body;

  console.log(data);

  game.move(ChessterMove.fromJSON(game, data));

  response.send({ board: game.board.toPieceBoard(), turn: game.turn });
});

app.post("/restart", (request, response) => {
  game.init(board);
  console.log(game.board.get([0, 3])?.piece);
  response.send({ board: game.board.toPieceBoard(), turn: game.turn });
});

app.listen(3000, () => {
  console.log("chesster server listening at http://localhost:3000");
});
