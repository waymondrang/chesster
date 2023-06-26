/**
 * Chesster web interface entry point
 */

/////////////////////
//     imports     //
/////////////////////

import { ChessterGame } from "./game";
import { ChessterGameState, ChessterMove, ChessterPieceString } from "./types";
import { io } from "socket.io-client";

////////////////////////////////
//     constant variables     //
////////////////////////////////

const chessboard = document.querySelector("#chessboard")!;
const turn_span = document.querySelector("#turn")!;
const restart = document.querySelector("#restart")!;
const promotion_close = document.querySelector("#promotion-close")!;
const promotion = document.querySelector("#promotion")!;
const promotion_options = document.querySelector("#promotion-options")!;

const WHITE = "WHITE";
const BLACK = "BLACK";
const moveTypes: {
  [key: string]: string;
} = {
  MOVE: "MOVE",
  CAPTURE: "CAPTURE",
  CASTLE: "CASTLE",
  EN_PASSANT: "EN_PASSANT",
  PROMOTION: "PROMOTION",
};

const socket = io();
const game = new ChessterGame();

///////////////////
//     types     //
///////////////////

type ElementBoard = HTMLElement[][];
type GameState = Omit<ChessterGameState, "white" | "black">;

////////////////////////////////
//     variable variables     //
////////////////////////////////

// contains the board's positions as elements
var elementBoard: ElementBoard = [[], [], [], [], [], [], [], []];

// contains game data, mini version of game state
// var gameState: GameState;

var selectedPieceElement: HTMLElement = null;
var selectedPieceMoves: ChessterMove[] = [];

///////////////////////////////
//     utility functions     //
///////////////////////////////

function calculateTeam(piece: ChessterPieceString) {
  switch (piece) {
    case "♔":
    case "♕":
    case "♗":
    case "♘":
    case "♖":
    case "♙":
      return WHITE;
    case "♚":
    case "♛":
    case "♝":
    case "♞":
    case "♜":
    case "♟︎":
      return BLACK;
    default:
      throw new Error("Invalid piece: " + piece);
  }
}

function clearMoveHighlights() {
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      for (let modifier of [
        ...Object.keys(moveTypes).map((moveType) => moveTypes[moveType]),
        "selected",
      ]) {
        elementBoard[i][j].classList.remove(modifier);
      }
    }
  }
}

function updateLastMove(gameState: GameState) {
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      for (let modifier of ["moved_from", "moved_to"]) {
        elementBoard[i][j].classList.remove(modifier);
      }
    }
  }

  if (gameState.history.length > 0) {
    let lastMove = gameState.history[gameState.history.length - 1];
    let from = lastMove.from;
    let to = lastMove.to;
    elementBoard[7 - from[1]][from[0]].classList.add("moved_from");
    elementBoard[7 - to[1]][to[0]].classList.add("moved_to");
  }
}

function updateBoard(gameState: GameState) {
  clearMoveHighlights();

  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      let piece = gameState.board[j][i];
      elementBoard[7 - i][j].innerHTML = "";
      if (piece) elementBoard[7 - i][j].textContent = piece.string;
    }
  }
}

function updateTurnIndicator(gameState: GameState) {
  turn_span.classList.remove(WHITE);
  turn_span.classList.remove(BLACK);
  turn_span.classList.add(gameState.turn);
}

promotion_close.addEventListener("click", () => {
  promotion.classList.add("hidden");
  promotion_options.replaceChildren();
  chessboard.classList.remove("disabled");
});

async function showPromotionModal(moves: ChessterMove[]) {
  return new Promise((resolve, reject) => {
    promotion.classList.remove("hidden");
    chessboard.classList.add("disabled");
    for (let move of moves) {
      let button = document.createElement("button");
      button.textContent = move.promotion || "";

      button.addEventListener("click", async () => {
        console.log("clicked", move.promotion);

        promotion.classList.add("hidden");
        promotion_options.replaceChildren();
        chessboard.classList.remove("disabled");

        resolve(move);
      });
      promotion_options.appendChild(button);
    }
  });
}

function clientMove(move: ChessterMove) {
  aiMove(move);
  socket.emit("move", move);
}

function aiMove(move: ChessterMove) {
  game.move(move);

  const gameState = game.getState();

  updateBoard(gameState);
  updateTurnIndicator(gameState);
  updateLastMove(gameState);
  clearMoveHighlights();

  selectedPieceElement = null;
  selectedPieceMoves = [];
}

//////////////////////////////
//     initialize board     //
//////////////////////////////

for (let i = 0; i < 8; i++) {
  for (let j = 0; j < 8; j++) {
    const cell = document.createElement("div");

    cell.classList.add("cell");
    cell.classList.add((i + j) % 2 == 0 ? "variant1" : "variant2");

    chessboard.appendChild(cell);

    elementBoard[i].push(cell);

    (() => {
      cell.addEventListener("click", (event) => {
        // toggle selected cell
        event.preventDefault();

        if (selectedPieceElement === cell) {
          console.log("deselecting piece");
          clearMoveHighlights();
          selectedPieceElement = null;
          selectedPieceMoves = [];
          return;
        }

        let selectedMoves = selectedPieceMoves.filter(
          (move) => move.to[0] === j && move.to[1] === 7 - i
        );

        if (selectedMoves.length > 0) {
          console.log("selectedMoves", selectedMoves);

          if (selectedMoves.length > 1) {
            if (selectedMoves[0].type !== moveTypes.PROMOTION)
              throw new Error(
                "invalid multi-move type: " + selectedMoves[0].type
              );

            // make promotion modal visible
            promotion.classList.remove("hidden");
            chessboard.classList.add("disabled");

            for (let move of selectedMoves) {
              let button = document.createElement("button");

              button.textContent = move.promotion || "";

              button.addEventListener("click", async () => {
                promotion.classList.add("hidden");
                promotion_options.replaceChildren(); // clear buttons
                chessboard.classList.remove("disabled");

                clientMove(move);
              });

              promotion_options.appendChild(button);
            }
          } else {
            clientMove(selectedMoves[0]);
          }

          return;
        }

        clearMoveHighlights();
        selectedPieceElement = null;
        selectedPieceMoves = [];

        if (
          game.board[j][7 - i] === undefined ||
          game.board[j][7 - i].team !== game.turn
        )
          return;

        cell.classList.toggle("selected");

        const moves = game.getAvailableMoves(game.board[j][7 - i]);

        for (let move of moves) {
          elementBoard[7 - move.to[1]][move.to[0]].classList.add(move.type);
        }

        selectedPieceElement = cell;
        selectedPieceMoves = moves;
      });
    })();
  }
}

socket.on("initState", (data: GameState) => {
  game.init(data);
  updateBoard(data);
  updateTurnIndicator(data);
  updateLastMove(data);
});

socket.on("aiMove", (move: ChessterMove) => {
  console.log("aiMove", move);
  aiMove(move);
});

// (async () => {
//   // fetch initial state of game
//   const data = await fetch("/chessboard");
//   const json = await data.json();

//   gameState = json;

//   updateTurnIndicator(gameState);

//   // console.log(json);

//   // reloadBoard(boardData, elementBoard);

//   // for (let i = 0; i < 8; i++) {
//   //   for (let j = 0; j < 8; j++) {
//   //     // set onclick event
//   //     (() => {
//   //       const element = elementBoard[7 - j][i];
//   //       element.addEventListener("click", async () => {
//   //         console.log("clicked", i, j);

//   //         let foundMoves = selectedElementMoves.filter(
//   //           (move) =>
//   //             move.to[0] == i &&
//   //             move.to[1] == j &&
//   //             element.classList.contains(move.type)
//   //         );

//   //         let move = foundMoves[0];

//   //         if (foundMoves.length > 1) {
//   //           if (foundMoves[0].type !== moveTypes.PROMOTION)
//   //             throw new Error("invalid move type with multiple moves");

//   //           let selectedPromotion = await showPromotionModal(foundMoves);

//   //           if (!selectedPromotion) return;

//   //           console.log("selectedPromotion", selectedPromotion);

//   //           move = selectedPromotion;
//   //         }

//   //         if (move) {
//   //           console.log("move", move);

//   //           // change turn color instantly
//   //           turn_span.classList.remove(WHITE);
//   //           turn_span.classList.remove(BLACK);
//   //           turn_span.classList.add(turn == WHITE ? BLACK : WHITE);

//   //           // send move request
//   //           let data = await fetch("/move", {
//   //             method: "POST",
//   //             headers: {
//   //               "Content-Type": "application/json",
//   //             },
//   //             body: JSON.stringify(move),
//   //           });
//   //           let json = await data.json(); // returns new chessboard and turn color

//   //           board = json.board;
//   //           turn = json.turn;

//   //           turn_span.classList.remove(WHITE);
//   //           turn_span.classList.remove(BLACK);
//   //           turn_span.classList.add(turn);

//   //           selectedElement = null;
//   //           selectedElementMoves = [];
//   //           reloadBoard(board, elementBoard);
//   //           clearLastMove(elementBoard);

//   //           if (json.moved) {
//   //             // mark moved spots
//   //             elementBoard[7 - json.moved.from[1]][
//   //               json.moved.from[0]
//   //             ].classList.add("moved_from");
//   //             elementBoard[7 - json.moved.to[1]][
//   //               json.moved.to[0]
//   //             ].classList.add("moved_to");
//   //           }

//   //           return;
//   //         }

//   //         // clear all highlights
//   //         clearAllHighlights(elementBoard);

//   //         if (
//   //           selectedElement == element ||
//   //           !element.textContent ||
//   //           calculateTeam(element.textContent) != turn
//   //         ) {
//   //           selectedElement = null;
//   //           selectedElementMoves = [];
//   //           return;
//   //         }

//   //         element.classList.add("selected");

//   //         let data = await fetch("/getMoves", {
//   //           method: "POST",
//   //           headers: {
//   //             "Content-Type": "application/json",
//   //           },
//   //           body: JSON.stringify({
//   //             x: i,
//   //             y: j,
//   //           }),
//   //         });

//   //         let moves = await data.json();

//   //         console.log(moves);
//   //         for (let move of moves) {
//   //           elementBoard[7 - move.to[1]][move.to[0]].classList.add(move.type);
//   //         }

//   //         // set selected variables
//   //         selectedElementMoves = moves;
//   //         selectedElement = element;
//   //       });
//   //     })();
//   //   }
//   // }

//   // // set onclick event for new game button
//   // restart.addEventListener("click", async () => {
//   //   let data = await fetch("/restart", {
//   //     method: "POST",
//   //     headers: {
//   //       "Content-Type": "application/json",
//   //     },
//   //   });
//   //   let json = await data.json(); // returns new chessboard and turn color

//   //   board = json.board;
//   //   turn = json.turn;

//   //   turn_span.classList.remove(WHITE);
//   //   turn_span.classList.remove(BLACK);
//   //   turn_span.classList.add(turn);

//   //   selectedElement = null;
//   //   selectedElementMoves = [];
//   //   reloadBoard(board, elementBoard);
//   //   clearLastMove(elementBoard);
//   //   return;
//   // });
// })();

/////////////////////////
//     dynamic css     //
/////////////////////////

document.documentElement.style.setProperty(
  "--chessboard-size",
  (window.innerHeight > window.innerWidth
    ? window.innerWidth
    : window.innerHeight) *
    0.6 +
    "px"
);

document.documentElement.style.setProperty(
  "--border-size",
  (window.innerHeight > window.innerWidth
    ? window.innerWidth
    : window.innerHeight) *
    0.005 +
    "px"
);

window.addEventListener("resize", () => {
  document.documentElement.style.setProperty(
    "--chessboard-size",
    (window.innerHeight > window.innerWidth
      ? window.innerWidth
      : window.innerHeight) *
      0.6 +
      "px"
  );
  document.documentElement.style.setProperty(
    "--border-size",
    (window.innerHeight > window.innerWidth
      ? window.innerWidth
      : window.innerHeight) *
      0.005 +
      "px"
  );
});
