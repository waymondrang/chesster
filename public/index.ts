/**
 * Chesster web interface entry point
 */

/////////////////////
//     imports     //
/////////////////////

import { ChessterGame } from "../game";
import {
  BLACK,
  ChessterBoard,
  ChessterGameState,
  ChessterHistory,
  ChessterMove,
  ChessterPieceString,
  ChessterPlayer,
  ChessterTeam,
  WHITE,
  boardSize,
  moveTypes,
} from "../types";
import { io } from "socket.io-client";
import { getBinaryString, getKeyByValue, numberToPieceString } from "../util";

////////////////////////////////
//     constant variables     //
////////////////////////////////

const chessboard = document.querySelector("#chessboard")!;
const turn_span = document.querySelector("#turn")!;
const restart = document.querySelector("#restart")!;
const promotion_close = document.querySelector("#promotion-close")!;
const promotion = document.querySelector("#promotion")!;
const promotion_options = document.querySelector("#promotion-options")!;
const undo = document.querySelector("#undo")!;

const socket = io();
const game = new ChessterGame();

///////////////////
//     types     //
///////////////////

type ElementBoard = HTMLElement[];

////////////////////////////////
//     variable variables     //
////////////////////////////////

// contains the board's positions as elements
var elementBoard: ElementBoard = [];

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
  for (let i = 0; i < boardSize; i++) {
    for (let modifier of [...Object.keys(moveTypes), "selected"]) {
      elementBoard[i].classList.remove(modifier);
    }
  }
}

function updateLastMove(gameHistory: ChessterHistory) {
  for (let i = 0; i < boardSize; i++) {
    for (let modifier of ["moved_from", "moved_to"]) {
      elementBoard[i].classList.remove(modifier);
    }
  }

  if (gameHistory.length > 0) {
    let lastMove = gameHistory[gameHistory.length - 1];
    let from = (lastMove >>> 14) & 0b111111;
    let to = (lastMove >>> 8) & 0b111111;
    elementBoard[from].classList.add("moved_from");
    elementBoard[to].classList.add("moved_to");
  }
}

function updateBoard(gameBoard: ChessterBoard) {
  clearMoveHighlights();

  for (let i = 0; i < boardSize; i++) {
    elementBoard[i].innerHTML = "";
    if (gameBoard[i] !== 0)
      elementBoard[i].textContent = numberToPieceString(gameBoard[i]);
  }
}

function updateTurnIndicator(gameTurn: ChessterTeam) {
  turn_span.classList.remove(WHITE.toString());
  turn_span.classList.remove(BLACK.toString());
  turn_span.classList.add(gameTurn.toString());
}

promotion_close.addEventListener("click", () => {
  promotion.classList.add("hidden");
  promotion_options.replaceChildren();
  chessboard.classList.remove("disabled");
});

function clientMove(move: ChessterMove) {
  console.log("sending and making move", getBinaryString(move));
  aiMove(move);
  socket.emit("move", move);
}

function aiMove(move: ChessterMove) {
  game.move(move);

  updateBoard(game.board);
  updateTurnIndicator(game.turn as ChessterTeam);
  updateLastMove(game.history);
  clearMoveHighlights();

  selectedPieceElement = null;
  selectedPieceMoves = [];
}

function clientUndo() {
  console.log("undoing");
  game.undo();

  updateBoard(game.board);
  updateTurnIndicator(game.turn as ChessterTeam);
  updateLastMove(game.history);
  clearMoveHighlights();

  selectedPieceElement = null;
  selectedPieceMoves = [];
  socket.emit("undo");
}

undo.addEventListener("click", () => {
  clientUndo();
});

//////////////////////////////
//     initialize board     //
//////////////////////////////

let pattern = 1;

for (let i = 0; i < boardSize; i++) {
  const cell = document.createElement("div");

  cell.classList.add("cell");

  if (i % 8 == 0) pattern ^= 1;
  cell.classList.add(i % 2 === pattern ? "variant1" : "variant2");

  chessboard.appendChild(cell);

  elementBoard.push(cell);

  (() => {
    cell.addEventListener("click", (event) => {
      // toggle selected cell
      event.preventDefault();

      console.log("selected piece: " + getBinaryString(game.board[i]));

      if (selectedPieceElement === cell) {
        console.log("deselecting piece");
        clearMoveHighlights();
        selectedPieceElement = null;
        selectedPieceMoves = [];
        return;
      }

      let selectedMoves = selectedPieceMoves.filter(
        (move) => ((move >>> 8) & 0b111111) === i
      );

      if (selectedMoves.length > 0) {
        console.log("selectedMoves", selectedMoves);

        if (selectedMoves.length > 1) {
          if (((selectedMoves[0] >>> 7) & 0b1) !== 1)
            throw new Error(
              "invalid multi-move type: " + getBinaryString(selectedMoves[0])
            );

          // make promotion modal visible
          promotion.classList.remove("hidden");
          chessboard.classList.add("disabled");

          for (let move of selectedMoves) {
            let button = document.createElement("button");

            // button.textContent = move.promotion || "";

            switch ((move >>> 4) & 0b1111) {
              case moveTypes.PROMOTION_QUEEN_CAPTURE:
              case moveTypes.PROMOTION_QUEEN:
                button.textContent = move & 0b1 ? "♛" : "♕";
                break;
              case moveTypes.PROMOTION_ROOK_CAPTURE:
              case moveTypes.PROMOTION_ROOK:
                button.textContent = move & 0b1 ? "♜" : "♖";
                break;
              case moveTypes.PROMOTION_BISHOP_CAPTURE:
              case moveTypes.PROMOTION_BISHOP:
                button.textContent = move & 0b1 ? "♝" : "♗";
                break;
              case moveTypes.PROMOTION_KNIGHT_CAPTURE:
              case moveTypes.PROMOTION_KNIGHT:
                button.textContent = move & 0b1 ? "♞" : "♘";
                break;
            }

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

      if (game.board[i] === undefined || (game.board[i] & 0b1) !== game.turn)
        return;

      cell.classList.toggle("selected");

      const moves = game.getAvailableMoves(i);

      console.log("calculatd moves: ", moves);

      for (let move of moves) {
        elementBoard[(move >>> 8) & 0b111111].classList.add(
          getKeyByValue(moveTypes, (move >>> 4) & 0b1111) as string
        );
      }

      selectedPieceElement = cell;
      selectedPieceMoves = moves;
    });
  })();
}

socket.on("initState", (data: ChessterGameState) => {
  game.init(data);
  updateBoard(data.board);
  updateTurnIndicator(data.turn as ChessterTeam);
  updateLastMove(data.history);
});

socket.on("aiMove", (move: ChessterMove, location: number) => {
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
