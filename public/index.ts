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
  ChessterHistory,
  ChessterMove,
  ChessterTeam,
  boardSize,
  moveTypes,
} from "../types";
import { binaryToString, getKeyByValue, numberToPieceString } from "../util";
import { messageTypes } from "./types";

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

const game = new ChessterGame();
const aiWorker = new Worker("worker.js");

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

  if (game.turn === BLACK) chessboard.classList.add("disabled");
  else chessboard.classList.remove("disabled");
}

function updateTurnIndicator(gameTurn: ChessterTeam) {
  turn_span.classList.remove("WHITE");
  turn_span.classList.remove("BLACK");
  turn_span.classList.add(gameTurn === 0 ? "WHITE" : "BLACK");
}

promotion_close.addEventListener("click", () => {
  promotion.classList.add("hidden");
  promotion_options.replaceChildren();
  chessboard.classList.remove("disabled");
});

function clientMove(move: ChessterMove) {
  console.log("sending and making move", binaryToString(move));
  makeMove(move);
  aiWorker.postMessage({ type: messageTypes.MOVE, state: game.getState() });
}

function makeMove(move: ChessterMove) {
  game.move(move);

  updateBoard(game.board);
  updateTurnIndicator(game.turn);
  updateLastMove(game.history);
  clearMoveHighlights();

  selectedPieceElement = null;
  selectedPieceMoves = [];
}

function clientUndo() {
  console.log("undoing");
  game.undo();

  updateBoard(game.board);
  updateTurnIndicator(game.turn);
  updateLastMove(game.history);
  clearMoveHighlights();

  selectedPieceElement = null;
  selectedPieceMoves = [];
}

undo.addEventListener("click", () => {
  clientUndo();
});

aiWorker.onmessage = function (event) {
  console.log("aiWorker.onmessage", event.data);
  switch (event.data.type) {
    case messageTypes.MOVE:
      makeMove(event.data.move);
      break;
  }
};

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

      console.log("selected piece: " + binaryToString(game.board[i]));

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
              "invalid multi-move type: " + binaryToString(selectedMoves[0])
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

updateBoard(game.board);
updateTurnIndicator(game.turn);
updateLastMove(game.history);

// set onclick event for new game button
restart.addEventListener("click", async () => {
  game.init();

  updateBoard(game.board);
  updateTurnIndicator(game.turn);
  updateLastMove(game.history);
  clearMoveHighlights();

  selectedPieceElement = null;
  selectedPieceMoves = [];
});

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
