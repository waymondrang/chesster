import express from "express";
import { ChessterGame } from "./game";
import {
  BLACK,
  ChessterBoardString,
  ChessterMove,
  WHITE,
  moveTypes,
} from "./types";
import { Server, Socket } from "socket.io";
import { createServer } from "http";
import { boardStringToArray } from "./util";

const app = express();
const server = createServer(app);
const io = new Server(server);

app.use(express.static("public"));
app.use(express.json());

const testBoard: ChessterBoardString = [
  ["♜", "♞", "♝", "♛", "♚", "♝", "♞", "♜"],
  ["♟︎", "♟︎", "♟︎", "♟︎", "♟︎", "♟︎", "♟︎", "♟︎"],
  new Array(8).fill(undefined),
  new Array(8).fill(undefined),
  [
    undefined,
    undefined,
    undefined,
    "♗",
    undefined,
    undefined,
    undefined,
    undefined,
  ],
  ["", "", "", "", "", "", "", ""],
  ["♙", "", "♙", "♙", "", "♙", "♙", "♙"],
  ["", "♘", "♗", "♕", "♔", "", "♘", "♖"],
];

io.on("connection", (socket: Socket) => {
  console.log("a user connected");
  const game = new ChessterGame({
    board: boardStringToArray(testBoard),
  });

  socket.emit("initState", game.getState());

  socket.on("move", (data: ChessterMove) => {
    console.log("move received");
    game.validateAndMove(data);

    // if (
    //   (game.turn === WHITE && game.wcm) ||
    //   (game.turn === BLACK && game.bcm)
    // ) {
    //   console.log("checkmate (game over)");
    //   socket.emit("gameOver");
    // } else {
    //   const ai = new ChessterAI(game); // maybe move this to the top?
    //   const aiMove = ai.getNextMove();

    //   if (aiMove) {
    //     game.validateAndMove(aiMove);
    //   } else {
    //     throw new Error("ai returned undefined move");
    //   }

    //   console.log("turn: " + game.turn);
    //   console.log("white in check: " + game.wc);
    //   console.log("black in check: " + game.bc);
    //   console.log("white in checkmate: " + game.wcm);
    //   console.log("black in checkmate: " + game.bcm);

    //   socket.emit("aiMove", aiMove);
    // }
  });

  // socket.on("getMoves", (data: { x: number; y: number }) => {
  //   let piece = game.board[data.x][data.y];

  //   if (!piece) {
  //     socket.emit("updateMoves", []);
  //     return;
  //   }

  //   socket.emit("updateMoves", game.getAvailableMoves(piece));
  // });

  socket.on("disconnect", () => {
    console.log("user disconnected");
    console.log("user disconnected");
  });
});

// app.post("/restart", (request, response) => {
//   game.init();
//   response.send({ board: game.board, turn: game.turn });
// });

server.listen(3000, () => {
  console.log("chesster server listening at http://localhost:3000");
});
