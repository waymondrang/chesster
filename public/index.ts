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
  messageTypes,
} from "../types";
import {
  binaryToString,
  fenStringToBoard,
  fenStringToGameState,
  getKeyByValue,
  numberToFileName,
} from "../util";

////////////////////////////////
//     constant variables     //
////////////////////////////////

const chessboard = document.querySelector("#chessboard") as HTMLDivElement;
const turn_span = document.querySelector("#turn") as HTMLSpanElement;
const end_span = document.querySelector("#end") as HTMLSpanElement;
const restart = document.querySelector("#restart") as HTMLButtonElement;
const promotion_close = document.querySelector(
  "#promotion-close"
) as HTMLButtonElement;
const promotion = document.querySelector("#promotion") as HTMLDivElement;
const promotion_options = document.querySelector(
  "#promotion-options"
) as HTMLDivElement;
const undo = document.querySelector("#undo") as HTMLButtonElement;
const settings = document.querySelector("#settings") as HTMLDivElement;
const settings_container = document.querySelector(
  "#settings_container"
) as HTMLDivElement;
const empty_settings = document.querySelectorAll(
  ".setting.empty"
) as NodeListOf<HTMLDivElement>;
const player_team = document.querySelector("#playerTeam") as HTMLSelectElement;

const game = new ChessterGame();
const aiWorker = new Worker("worker.js");
const enableAI = true;

const fen: string = "";

if (fen !== "") game.init(fenStringToGameState(fen));

///////////////////
//     types     //
///////////////////

type ElementBoard = HTMLElement[];

////////////////////////////////
//     variable variables     //
////////////////////////////////

var elementBoard: ElementBoard = []; // contains the board's positions as elements
var turnMoves: ChessterMove[] = [];
var selectedPieceElement: HTMLElement = null;
var selectedPieceMoves: ChessterMove[] = [];
var playerTeam: 0 | 1 = fen !== "" ? ((0b1 ^ game.turn) as 0 | 1) : 0; // default to white

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

function clearMove() {
  for (let i = 0; i < boardSize; i++) {
    for (let modifier of [...Object.keys(moveTypes), "selected"]) {
      elementBoard[i].classList.remove(modifier);
    }

    for (let j = 0; j < elementBoard[i].children.length; j++) {
      if (elementBoard[i].children[j].id === "xo") {
        elementBoard[i].children[j].remove();
        j--;
      }
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

function clearVisualizations() {
  for (let i = 0; i < boardSize; i++) {
    for (let modifier of ["visualize_from", "visualize_to"]) {
      elementBoard[i].classList.remove(modifier);
    }
  }
}

function visualizeMove(move: ChessterMove) {
  clearVisualizations();

  let from = (move >>> 14) & 0b111111;
  let to = (move >>> 8) & 0b111111;

  elementBoard[from].classList.add("visualize_from");
  elementBoard[to].classList.add("visualize_to");
}

function updateBoard(gameBoard: ChessterBoard, previousBoard?: ChessterBoard) {
  if (previousBoard === undefined) {
    for (let i = 0; i < boardSize; i++) {
      elementBoard[i].innerHTML = "";
      if (gameBoard[i] !== 0) {
        // elementBoard[i].textContent = numberToPieceString(gameBoard[i]);
        let img = document.createElement("img");
        img.setAttribute(
          "src",
          "pieces/" + numberToFileName(gameBoard[i]) + ".svg"
        );
        img.setAttribute("draggable", "false");

        elementBoard[i].appendChild(img);

        // is this needed? if the previous board is undefined, the game just started. perhaps we will spawn into a checked position, so i suppose this should be here.
        if (
          (game.wcm && gameBoard[i] === 0b1100) ||
          (game.bcm && gameBoard[i] === 0b1101)
        ) {
          let img = document.createElement("img");
          img.setAttribute("src", "pieces/double_circle.svg");
          img.setAttribute("draggable", "false");
          img.setAttribute("id", "checkmated");
          elementBoard[i].appendChild(img);
        } else if (
          (game.wc && gameBoard[i] === 0b1100) ||
          (game.bc && gameBoard[i] === 0b1101)
        ) {
          let img = document.createElement("img");
          img.setAttribute("src", "pieces/circle.svg");
          img.setAttribute("draggable", "false");
          img.setAttribute("id", "checked");
          elementBoard[i].appendChild(img);
        }
      }
    }
  } else {
    for (let i = 0; i < boardSize; i++) {
      if (gameBoard[i] !== previousBoard[i]) {
        elementBoard[i].innerHTML = "";
        if (gameBoard[i] !== 0) {
          // elementBoard[i].textContent = numberToPieceString(gameBoard[i]);
          let img = document.createElement("img");
          img.setAttribute(
            "src",
            "pieces/" + numberToFileName(gameBoard[i]) + ".svg"
          );
          img.setAttribute("draggable", "false");

          elementBoard[i].appendChild(img);
        }
      }

      if (elementBoard[i].children.length > 1)
        for (let j = 0; j < elementBoard[i].children.length; j++) {
          if (
            elementBoard[i].children[j].id === "checked" ||
            elementBoard[i].children[j].id === "checkmated"
          ) {
            elementBoard[i].children[j].remove();
            j--;
          }
        }

      if (
        (game.wcm && gameBoard[i] === 0b1100) ||
        (game.bcm && gameBoard[i] === 0b1101)
      ) {
        let img = document.createElement("img");
        img.setAttribute("src", "pieces/double_circle.svg");
        img.setAttribute("draggable", "false");
        img.setAttribute("id", "checkmated");
        elementBoard[i].appendChild(img);
      } else if (
        (game.wc && gameBoard[i] === 0b1100) ||
        (game.bc && gameBoard[i] === 0b1101)
      ) {
        let img = document.createElement("img");
        img.setAttribute("src", "pieces/circle.svg");
        img.setAttribute("draggable", "false");
        img.setAttribute("id", "checked");
        elementBoard[i].appendChild(img);
      }
    }
  }

  if ((enableAI && game.turn !== playerTeam) || game.isGameOver())
    chessboard.classList.add("disabled");
  else chessboard.classList.remove("disabled");

  undo.disabled =
    game.history.length === 0 ||
    (game.isGameOver() ? false : enableAI ? game.turn !== playerTeam : false);
}

function updateStatus(gameTurn: ChessterTeam) {
  turn_span.classList.remove("WHITE");
  turn_span.classList.remove("BLACK");
  turn_span.classList.add(gameTurn === 0 ? "WHITE" : "BLACK");

  if (game.isGameOver()) {
    end_span.classList.remove("hidden");
    turn_span.classList.add("game-over");
  } else {
    end_span.classList.add("hidden");
    turn_span.classList.remove("game-over");
  }
}

promotion_close.addEventListener("click", () => {
  promotion.classList.add("hidden");
  promotion_options.replaceChildren();
  chessboard.classList.remove("disabled");
});

function clientMove(move: ChessterMove) {
  makeMove(move);
  if (enableAI && !game.isGameOver())
    aiWorker.postMessage({ type: messageTypes.MOVE, state: game.getState() }); // disable to enable two player
}

function makeMove(move: ChessterMove) {
  let previousBoard = [...game.board];

  // console.log("before move zobrist", game.zobrist, game.zistory);

  game.move(move);

  // console.log("after move zobrist", game.zobrist, game.zistory);

  clearVisualizations();
  updateBoard(game.board, previousBoard);
  updateStatus(game.turn);
  updateLastMove(game.history);
  clearMove();

  selectedPieceElement = null;
  selectedPieceMoves = [];
  turnMoves = game.moves();
}

function clientUndo() {
  let previousBoard = [...game.board];

  game.undo();
  if (enableAI && game.turn !== playerTeam) game.undo();
  // console.log("after undo", game.zobrist);

  clearVisualizations();
  updateBoard(game.board, previousBoard);
  updateStatus(game.turn);
  updateLastMove(game.history);
  clearMove();

  selectedPieceElement = null;
  selectedPieceMoves = [];
  turnMoves = game.moves();

  if (enableAI && game.turn !== playerTeam && game.history.length === 0)
    aiWorker.postMessage({ type: messageTypes.MOVE, state: game.getState() });
}

undo.addEventListener("click", () => {
  clientUndo();
});

aiWorker.onmessage = function (event) {
  switch (event.data.type) {
    case messageTypes.MOVE:
      if (event.data.move === undefined) {
        console.error("ai returned undefined move, likely game is over");
        return;
      }
      makeMove(event.data.move);
      break;
    case messageTypes.SETTINGS:
      (document.querySelector("#depth") as HTMLInputElement).value =
        event.data.settings.depth.toString();
      (
        document.querySelector("#pseudoLegalEvaluation") as HTMLInputElement
      ).value = event.data.settings.pseudoLegalEvaluation.toString();
      (document.querySelector("#searchAlgorithm") as HTMLInputElement).value =
        event.data.settings.searchAlgorithm;
      (document.querySelector("#visualizeSearch") as HTMLInputElement).value =
        event.data.settings.visualizeSearch.toString();
      break;
    case messageTypes.VISUALIZE_MOVE:
      console.log("visualizing move", event.data.move);
      visualizeMove(event.data.move);
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

      if (selectedPieceElement === cell) {
        clearMove();
        selectedPieceElement = null;
        selectedPieceMoves = [];
        return;
      }

      let selectedMoves = selectedPieceMoves.filter(
        (move) => ((move >>> 8) & 0b111111) === i
      );

      if (selectedMoves.length > 0) {
        // if selected move is promotion
        if (selectedMoves.length > 1) {
          if (((selectedMoves[0] >>> 7) & 0b1) !== 1)
            throw new Error(
              "invalid multi-move type: " + binaryToString(selectedMoves[0])
            );

          // make promotion modal visible
          promotion.classList.remove("hidden");
          chessboard.classList.add("disabled");
          promotion_options.replaceChildren(); // clear buttons

          for (let move of selectedMoves) {
            let button = document.createElement("button");

            let img = document.createElement("img");
            img.setAttribute(
              "src",
              "pieces/" +
                numberToFileName(
                  ((((move >> 4) & 0b11) + 2) << 1) | (move & 0b1)
                ) +
                ".svg"
            );
            img.setAttribute("draggable", "false");

            button.appendChild(img);

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

      clearMove();
      selectedPieceElement = null;
      selectedPieceMoves = [];

      if (game.board[i] === undefined || (game.board[i] & 0b1) !== game.turn)
        return;

      cell.classList.toggle("selected");

      const moves = turnMoves.filter(
        (move) => ((move >>> 14) & 0b111111) === i
      );

      for (let move of moves) {
        let img = document.createElement("img");
        img.src = "pieces/xo.svg";
        img.id = "xo";
        img.setAttribute("draggable", "false");

        elementBoard[(move >>> 8) & 0b111111].classList.add(
          getKeyByValue(moveTypes, (move >>> 4) & 0b1111) as string
        );

        elementBoard[(move >>> 8) & 0b111111].appendChild(img);
      }

      selectedPieceElement = cell;
      selectedPieceMoves = moves;
    });
  })();
}

//////////////////////////////
//     initialize board     //
//////////////////////////////

updateBoard(game.board);
updateStatus(game.turn);
updateLastMove(game.history);

if (enableAI && fen !== "")
  // ai will make first move if player is black
  aiWorker.postMessage({ type: messageTypes.MOVE, state: game.getState() });
else turnMoves = game.moves();

function restartGame() {
  game.init();

  clearVisualizations();
  updateBoard(game.board);
  updateStatus(game.turn);
  updateLastMove(game.history);
  clearMove();

  if (enableAI && playerTeam === BLACK)
    // ai will make first move if player is black
    aiWorker.postMessage({ type: messageTypes.MOVE, state: game.getState() });

  selectedPieceElement = null;
  selectedPieceMoves = [];
  turnMoves = game.moves();
}

restart.addEventListener("click", restartGame);

function toggleSettings() {
  settings.classList.toggle("enabled");
  settings_container.classList.toggle("hidden");

  ///////////////////////////////////
  //     animate children here     //
  ///////////////////////////////////
}

settings.addEventListener("click", toggleSettings);
empty_settings.forEach((element) => {
  element.addEventListener("click", toggleSettings);
});

function saveSettings() {
  aiWorker.postMessage({
    type: messageTypes.SETTINGS,
    settings: {
      depth: parseInt(
        (document.querySelector("#depth") as HTMLInputElement).value
      ),
      pseudoLegalEvaluation:
        (document.querySelector("#pseudoLegalEvaluation") as HTMLInputElement)
          .value === "true",
      searchAlgorithm: (
        document.querySelector("#searchAlgorithm") as HTMLInputElement
      ).value,
      visualizeSearch:
        (document.querySelector("#visualizeSearch") as HTMLInputElement)
          .value === "true",
    },
  });
}

settings_container.querySelectorAll("select.autosave").forEach((element) => {
  element.addEventListener("change", saveSettings);
});

player_team.addEventListener("change", () => {
  playerTeam = player_team.value === "WHITE" ? 0 : 1;
  restartGame();
});

/////////////////////////
//     dynamic css     //
/////////////////////////

const borderMultiplier = 0.005;
const widthScalar = 0.93333333333;
const heightScalar = 0.7;

function getChessboardSize() {
  const heightMax = window.innerHeight * heightScalar;
  const widthMax = window.innerWidth * widthScalar;

  let size = heightMax > widthMax ? widthMax : heightMax;

  if (size > 860) size = 860;

  return size;
}

document.documentElement.style.setProperty(
  "--chessboard-size",
  getChessboardSize() + "px"
);

document.documentElement.style.setProperty(
  "--border-size",
  (window.innerHeight > window.innerWidth
    ? window.innerWidth
    : window.innerHeight) *
    borderMultiplier +
    "px"
);

window.addEventListener("resize", () => {
  document.documentElement.style.setProperty(
    "--chessboard-size",
    getChessboardSize() + "px"
  );
  document.documentElement.style.setProperty(
    "--border-size",
    (window.innerHeight > window.innerWidth
      ? window.innerWidth
      : window.innerHeight) *
      borderMultiplier +
      "px"
  );
});
