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
  pieces,
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

const game_div = document.querySelector("#game") as HTMLDivElement;
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
const chesster = document.querySelector("#chesster") as HTMLHeadingElement;
const about_container = document.querySelector(
  "#about_container"
) as HTMLDivElement;
const game_selection = document.querySelector(
  "#gameSelection"
) as HTMLSelectElement;
const info = document.querySelector("#info") as HTMLDivElement;
const info_touch_area = document.querySelector(
  "#info_touch_area"
) as HTMLDivElement;

const game = new ChessterGame();
const aiWorker = new Worker("worker.js");

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

var gameSelection: "whiteAI" | "blackAI" | "pass" | "tabletop" = "whiteAI";

var playerTeam: 0 | 1 = fen !== "" ? ((0b1 ^ game.turn) as 0 | 1) : 0; // default to white
var enableAI = true; // default to true

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

function initBoard(gameBoard: ChessterBoard) {
  for (let i = 0; i < boardSize; i++) {
    if (gameBoard[i] === 0) continue;

    elementBoard[i].innerHTML = ""; // clear html

    let img = document.createElement("img");
    img.setAttribute(
      "src",
      "pieces/" + numberToFileName(gameBoard[i]) + ".svg"
    );
    img.setAttribute("draggable", "false");

    elementBoard[i].appendChild(img);

    /**
     * note: it is possible to initialize the board in a checked or checkmated
     * position
     */

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

  if ((enableAI && game.turn !== playerTeam) || game.isGameOver())
    chessboard.classList.add("disabled");
  else chessboard.classList.remove("disabled");

  undo.disabled =
    game.history.length === 0 ||
    (game.isGameOver() ? false : enableAI ? game.turn !== playerTeam : false);
}

function updateBoard(gameBoard: ChessterBoard, previousBoard: ChessterBoard) {
  console.log("updating board", game.turn, gameSelection);
  for (let i = 0; i < boardSize; i++) {
    if (gameBoard[i] !== previousBoard[i]) {
      elementBoard[i].innerHTML = "";

      if (gameBoard[i] !== 0) {
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
      (game.wcm && gameBoard[i] === pieces.WHITE_KING) ||
      (game.bcm && gameBoard[i] === pieces.BLACK_KING)
    ) {
      let img = document.createElement("img");
      img.setAttribute("src", "pieces/double_circle.svg");
      img.setAttribute("draggable", "false");
      img.setAttribute("id", "checkmated");
      elementBoard[i].appendChild(img);
    } else if (
      (game.wc && gameBoard[i] === pieces.WHITE_KING) ||
      (game.bc && gameBoard[i] === pieces.BLACK_KING)
    ) {
      let img = document.createElement("img");
      img.setAttribute("src", "pieces/circle.svg");
      img.setAttribute("draggable", "false");
      img.setAttribute("id", "checked");
      elementBoard[i].appendChild(img);
    }
  }

  if ((enableAI && game.turn !== playerTeam) || game.isGameOver())
    chessboard.classList.add("disabled");
  else chessboard.classList.remove("disabled");

  if (gameSelection === "tabletop" && game.turn === BLACK) {
    game_div.classList.add("rotated");
  } else if (gameSelection === "tabletop") {
    game_div.classList.remove("rotated");
  }

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

function clientMove(move: ChessterMove) {
  makeMove(move);
  if (enableAI && !game.isGameOver())
    aiWorker.postMessage({ type: messageTypes.MOVE, state: game.getState() }); // disable to enable two player
}

function makeMove(move: ChessterMove) {
  let previousBoard = [...game.board];

  game.move(move);

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

      game_selection.value = gameSelection;
      break;
    case messageTypes.VISUALIZE_MOVE:
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
    function cellHandler(event) {
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

            button.addEventListener("touchstart", (event) => {
              event.preventDefault();

              promotion.classList.add("hidden");
              promotion_options.replaceChildren(); // clear buttons
              chessboard.classList.remove("disabled");

              clientMove(move);
            });

            button.addEventListener("click", (event) => {
              event.preventDefault();

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
    }

    cell.addEventListener("touchstart", cellHandler);
    cell.addEventListener("click", cellHandler);
  })();
}

//////////////////////////////
//     initialize board     //
//////////////////////////////

initBoard(game.board);
updateStatus(game.turn);
updateLastMove(game.history);

if (enableAI && fen !== "")
  // ai will make first move if player is black
  aiWorker.postMessage({ type: messageTypes.MOVE, state: game.getState() });
else turnMoves = game.moves();

function restartGame() {
  let previousBoard = [...game.board];

  game.init();

  clearVisualizations();
  updateBoard(game.board, previousBoard);
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

restart.addEventListener("touchstart", (event) => {
  event.preventDefault();
  restartGame();
});

restart.addEventListener("click", (event) => {
  event.preventDefault();
  restartGame();
});

function toggleSettings() {
  settings.classList.toggle("enabled");
  settings_container.classList.toggle("hidden");
}

settings.addEventListener("touchstart", (event) => {
  event.preventDefault();
  postMessage({ type: messageTypes.REQUEST_SETTINGS });
  toggleSettings();
});

settings.addEventListener("click", (event) => {
  event.preventDefault();
  postMessage({ type: messageTypes.REQUEST_SETTINGS });
  toggleSettings();
});

empty_settings.forEach((element) => {
  element.addEventListener("touchstart", (event) => {
    event.preventDefault();
    toggleSettings();
  });
});

empty_settings.forEach((element) => {
  element.addEventListener("click", (event) => {
    event.preventDefault();
    toggleSettings();
  });
});

undo.addEventListener("touchstart", (event) => {
  event.preventDefault();
  clientUndo();
});

undo.addEventListener("click", (event) => {
  event.preventDefault();
  clientUndo();
});

chesster.addEventListener("touchstart", (event) => {
  event.preventDefault();
  about_container.classList.toggle("hidden");
});

chesster.addEventListener("click", (event) => {
  event.preventDefault();
  about_container.classList.toggle("hidden");
});

about_container.addEventListener("touchstart", (event) => {
  event.preventDefault();
  about_container.classList.toggle("hidden");
});

about_container.addEventListener("touchstart", (event) => {
  event.preventDefault();
  about_container.classList.toggle("hidden");
});

promotion_close.addEventListener("touchstart", (event) => {
  event.preventDefault();
  promotion.classList.add("hidden");
  promotion_options.replaceChildren();
  chessboard.classList.remove("disabled");
});

promotion_close.addEventListener("click", (event) => {
  event.preventDefault();
  promotion.classList.add("hidden");
  promotion_options.replaceChildren();
  chessboard.classList.remove("disabled");
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

function infoTouchAreaHandler(event: any) {
  event.preventDefault();
  info.classList.toggle("collapsed");
}

info_touch_area.addEventListener("touchstart", infoTouchAreaHandler);

info_touch_area.addEventListener("click", infoTouchAreaHandler);

game_selection.addEventListener("change", () => {
  info.classList.remove("collapsed");

  switch (game_selection.value) {
    case "whiteAI":
      playerTeam = 0;
      enableAI = true;
      break;
    case "blackAI":
      playerTeam = 1;
      enableAI = true;
      break;
    case "pass":
      playerTeam = 0;
      enableAI = false;
      break;
    case "tabletop":
      playerTeam = 0;
      enableAI = false;
      info.classList.toggle("collapsed");
      break;
  }

  game_div.classList.remove("rotated");

  gameSelection = game_selection.value as
    | "whiteAI"
    | "blackAI"
    | "pass"
    | "tabletop";

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
