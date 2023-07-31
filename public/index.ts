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
const settings_container = document.querySelector(
  "#settings_container"
) as HTMLDivElement;
const close_settings = document.querySelector(
  "#close_settings"
) as HTMLButtonElement;
const close_about = document.querySelector("#close_about") as HTMLButtonElement;
const game_selection = document.querySelector(
  "#gameSelection"
) as HTMLSelectElement;
const info_touch_area = document.querySelector(
  "#info_touch_area"
) as HTMLDivElement;
const toggle_fullscreen = document.querySelector(
  "#toggle_fullscreen"
) as HTMLButtonElement;
const toggle_about = document.querySelector(
  "#toggle_about"
) as HTMLButtonElement;
const toggle_settings = document.querySelector(
  "#toggle_settings"
) as HTMLButtonElement;

const game = new ChessterGame();
const aiWorker = new Worker("worker.js");

const fen: string = "";

if (fen !== "") game.init(fenStringToGameState(fen));

///////////////////
//     types     //
///////////////////

type ElementBoard = {
  touch: HTMLElement;
  cell: HTMLElement;
  piece: HTMLElement;
  move: HTMLElement;
}[];

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

var isFullscreen = false;
var piecesAreRotated = false;

///////////////////////////////
//     utility functions     //
///////////////////////////////

function clearMove() {
  for (let i = 0; i < boardSize; i++) {
    for (let modifier of [...Object.keys(moveTypes), "selected"]) {
      elementBoard[i].cell.classList.remove(modifier);
    }

    elementBoard[i].move.classList.remove("selected");
  }
}

function clearVisualizations() {
  for (let i = 0; i < boardSize; i++) {
    for (let modifier of ["visualize_from", "visualize_to"]) {
      elementBoard[i].cell.classList.remove(modifier);
    }
  }
}

function updateLastMove(gameHistory: ChessterHistory) {
  for (let i = 0; i < boardSize; i++) {
    for (let modifier of ["moved_from", "moved_to"]) {
      elementBoard[i].cell.classList.remove(modifier);
    }
  }

  if (gameHistory.length > 0) {
    let lastMove = gameHistory[gameHistory.length - 1];
    let from = (lastMove >>> 14) & 0b111111;
    let to = (lastMove >>> 8) & 0b111111;
    elementBoard[from].cell.classList.add("moved_from");
    elementBoard[to].cell.classList.add("moved_to");
  }
}

function updateVisualizeMove(move: ChessterMove) {
  clearVisualizations();

  let from = (move >>> 14) & 0b111111;
  let to = (move >>> 8) & 0b111111;

  elementBoard[from].cell.classList.add("visualize_from");
  elementBoard[to].cell.classList.add("visualize_to");
}

function updateStatus(gameTurn: ChessterTeam) {
  game_div.classList.remove("WHITE");
  game_div.classList.remove("BLACK");
  game_div.classList.add(gameTurn === 0 ? "WHITE" : "BLACK");

  if (enableAI && gameTurn !== playerTeam) turn_span.classList.add("thinking");
  else turn_span.classList.remove("thinking");

  if (game.isGameOver()) {
    end_span.classList.remove("hidden");
    turn_span.classList.add("game-over");
    document.body.classList.remove("zen");
  } else {
    end_span.classList.add("hidden");
    turn_span.classList.remove("game-over");
  }
}

function initBoard(gameBoard: ChessterBoard) {
  for (let i = 0; i < boardSize; i++) {
    if (gameBoard[i] === 0) continue;

    elementBoard[i].piece.classList.add(numberToFileName(gameBoard[i]));

    /**
     * note: it is possible to initialize the board in a checked or checkmated
     * position
     */

    if (
      (game.wcm && gameBoard[i] === pieces.WHITE_KING) ||
      (game.bcm && gameBoard[i] === pieces.BLACK_KING)
    ) {
      let img = document.createElement("img");
      img.setAttribute(
        "src",
        "data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMjAwIDEwMCINCiAgICB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPg0KICAgIDxwYXRoIGZpbGw9IiNmZjE1MDciIGQ9Ik0gMCw1MCBhIDUwLDUwIDAgMSwwIDEwMCwwIGEgNTAsNTAgMCAxLDAgLTEwMCwwIiAvPg0KICAgIDxwYXRoIGZpbGw9IiNmZjE1MDciIGQ9Ik0gMTAwLDUwIGEgNTAsNTAgMCAxLDAgMTAwLDAgYSA1MCw1MCAwIDEsMCAtMTAwLDAiIC8+DQo8L3N2Zz4="
      );
      img.setAttribute("draggable", "false");
      img.setAttribute("id", "checkmated");
      elementBoard[i].cell.appendChild(img);
    } else if (
      (game.wc && gameBoard[i] === pieces.WHITE_KING) ||
      (game.bc && gameBoard[i] === pieces.BLACK_KING)
    ) {
      let img = document.createElement("img");
      img.setAttribute(
        "src",
        "data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMTAwIDEwMCINCiAgICB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPg0KICAgIDxwYXRoIGZpbGw9IiNmZjE1MDciIGQ9Ik0gMCw1MCBhIDUwLDUwIDAgMSwwIDEwMCwwIGEgNTAsNTAgMCAxLDAgLTEwMCwwIiAvPg0KPC9zdmc+"
      );
      img.setAttribute("draggable", "false");
      img.setAttribute("id", "checked");
      elementBoard[i].cell.appendChild(img);
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
      if (previousBoard[i] !== 0)
        elementBoard[i].piece.classList.remove(
          numberToFileName(previousBoard[i])
        );

      if (gameBoard[i] !== 0)
        elementBoard[i].piece.classList.add(numberToFileName(gameBoard[i]));
    }

    if ((enableAI && game.turn !== playerTeam) || game.isGameOver())
      chessboard.classList.add("disabled");
    else chessboard.classList.remove("disabled");

    if (gameSelection === "pass") {
      if (game.turn === BLACK) chessboard.classList.add("rotated");
      else chessboard.classList.remove("rotated");
    }

    if (gameSelection === "tabletop" || gameSelection === "pass") {
      if (game.turn === BLACK) document.body.classList.add("rotated");
      else document.body.classList.remove("rotated");
      piecesAreRotated = game.turn === BLACK;
    }

    undo.disabled =
      game.history.length === 0 ||
      (game.isGameOver() ? false : enableAI ? game.turn !== playerTeam : false);
  }
}

function updateIndicators() {
  for (let i = 0; i < boardSize; i++) {
    /**
     * delete all check and checkmate indicators (note: the children of the cell
     * node can only be check or checkmate indicators)
     */
    elementBoard[i].cell.replaceChildren();

    if (
      (game.wcm && game.board[i] === pieces.WHITE_KING) ||
      (game.bcm && game.board[i] === pieces.BLACK_KING)
    ) {
      let img = document.createElement("img");
      img.setAttribute(
        "src",
        "data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMjAwIDEwMCINCiAgICB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPg0KICAgIDxwYXRoIGZpbGw9IiNmZjE1MDciIGQ9Ik0gMCw1MCBhIDUwLDUwIDAgMSwwIDEwMCwwIGEgNTAsNTAgMCAxLDAgLTEwMCwwIiAvPg0KICAgIDxwYXRoIGZpbGw9IiNmZjE1MDciIGQ9Ik0gMTAwLDUwIGEgNTAsNTAgMCAxLDAgMTAwLDAgYSA1MCw1MCAwIDEsMCAtMTAwLDAiIC8+DQo8L3N2Zz4="
      );
      img.setAttribute("draggable", "false");
      img.setAttribute("id", "checkmated");
      elementBoard[i].cell.appendChild(img);
    } else if (
      (game.wc && game.board[i] === pieces.WHITE_KING) ||
      (game.bc && game.board[i] === pieces.BLACK_KING)
    ) {
      let img = document.createElement("img");
      img.setAttribute(
        "src",
        "data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMTAwIDEwMCINCiAgICB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPg0KICAgIDxwYXRoIGZpbGw9IiNmZjE1MDciIGQ9Ik0gMCw1MCBhIDUwLDUwIDAgMSwwIDEwMCwwIGEgNTAsNTAgMCAxLDAgLTEwMCwwIiAvPg0KPC9zdmc+"
      );
      img.setAttribute("draggable", "false");
      img.setAttribute("id", "checked");
      elementBoard[i].cell.appendChild(img);
    }
  }
}

async function clientMove(move: ChessterMove) {
  await makeMove(move);
  if (enableAI && !game.isGameOver())
    aiWorker.postMessage({ type: messageTypes.MOVE, state: game.getState() }); // disable to enable two player
}

async function makeMove(move: ChessterMove) {
  let previousBoard = [...game.board];

  game.move(move);

  clearMove();
  clearVisualizations();

  updateLastMove(game.history);
  updateStatus(game.turn);
  updateIndicators();

  await (() => {
    return new Promise<void>((resolve) => {
      // animate chess piece from old position to new position
      let from = (move >>> 14) & 0b111111;
      let to = (move >>> 8) & 0b111111;

      elementBoard[from].piece.classList.add("moving");
      elementBoard[from].piece.style.transform = piecesAreRotated
        ? `translate(${
            elementBoard[to].cell.offsetLeft -
            elementBoard[from].cell.offsetLeft
          }px, ${
            elementBoard[to].cell.offsetTop - elementBoard[from].cell.offsetTop
          }px) rotate(180deg)`
        : `translate(${
            elementBoard[to].cell.offsetLeft -
            elementBoard[from].cell.offsetLeft
          }px, ${
            elementBoard[to].cell.offsetTop - elementBoard[from].cell.offsetTop
          }px)`;

      switch ((move >>> 4) & 0b1111) {
        case moveTypes.CASTLE_KINGSIDE:
          elementBoard[to + 1].piece.classList.add("moving");
          elementBoard[to + 1].piece.style.transform = piecesAreRotated
            ? `translate(${
                elementBoard[to - 1].cell.offsetLeft -
                elementBoard[to + 1].cell.offsetLeft
              }px, ${
                elementBoard[to - 1].cell.offsetTop -
                elementBoard[to + 1].cell.offsetTop
              }px) rotate(180deg)`
            : `translate(${
                elementBoard[to - 1].cell.offsetLeft -
                elementBoard[to + 1].cell.offsetLeft
              }px, ${
                elementBoard[to - 1].cell.offsetTop -
                elementBoard[to + 1].cell.offsetTop
              }px)`;

          setTimeout(() => {
            elementBoard[to + 1].piece.style.transform = "";
            elementBoard[to + 1].piece.classList.remove("moving");
          }, 250); // duration of css animation
          break;
        case moveTypes.CASTLE_QUEENSIDE:
          elementBoard[to - 2].piece.classList.add("moving");
          elementBoard[to - 2].piece.style.transform = piecesAreRotated
            ? `translate(${
                elementBoard[to + 1].cell.offsetLeft -
                elementBoard[to - 2].cell.offsetLeft
              }px, ${
                elementBoard[to + 1].cell.offsetTop -
                elementBoard[to - 2].cell.offsetTop
              }px) rotate(180deg)`
            : `translate(${
                elementBoard[to + 1].cell.offsetLeft -
                elementBoard[to - 2].cell.offsetLeft
              }px, ${
                elementBoard[to + 1].cell.offsetTop -
                elementBoard[to - 2].cell.offsetTop
              }px)`;

          setTimeout(() => {
            elementBoard[to - 2].piece.style.transform = "";
            elementBoard[to - 2].piece.classList.remove("moving");
          }, 250); // duration of css animation
          break;
      }

      setTimeout(() => {
        elementBoard[from].piece.style.transform = "";
        elementBoard[from].piece.classList.remove("moving");
        resolve();
      }, 250); // duration of css animation
    });
  })();

  updateBoard(game.board, previousBoard);

  selectedPieceElement = null;
  selectedPieceMoves = [];
  turnMoves = game.moves();
}

function makeUndo() {
  let previousBoard = [...game.board];

  game.undo();
  if (enableAI && game.turn !== playerTeam) game.undo();

  clearVisualizations();
  clearMove();

  updateBoard(game.board, previousBoard);
  updateStatus(game.turn);
  updateLastMove(game.history);
  updateIndicators();

  selectedPieceElement = null;
  selectedPieceMoves = [];
  turnMoves = game.moves();

  if (enableAI && game.turn !== playerTeam && game.history.length === 0)
    aiWorker.postMessage({ type: messageTypes.MOVE, state: game.getState() });
}

aiWorker.onmessage = async function (event) {
  switch (event.data.type) {
    case messageTypes.MOVE:
      if (event.data.move === undefined) {
        console.error("ai returned undefined move, likely game is over");
        return;
      }
      await makeMove(event.data.move);
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
      updateVisualizeMove(event.data.move);
      break;
  }
};

//////////////////////////////
//     initialize board     //
//////////////////////////////

let pattern = 1;

const touch_layer = document.createElement("div");
touch_layer.classList.add("touch_layer");
chessboard.appendChild(touch_layer);

const move_layer = document.createElement("div");
move_layer.classList.add("move_layer");
chessboard.appendChild(move_layer);

const piece_layer = document.createElement("div");
piece_layer.classList.add("piece_layer");
chessboard.appendChild(piece_layer);

const cell_layer = document.createElement("div");
cell_layer.classList.add("cell_layer");
chessboard.appendChild(cell_layer);

for (let i = 0; i < boardSize; i++) {
  const cell = document.createElement("div");
  const piece = document.createElement("div");
  const move = document.createElement("div");
  const touch = document.createElement("div");

  cell.classList.add("cell");
  piece.classList.add("piece");
  move.classList.add("move");
  touch.classList.add("touch");

  if (i % 8 == 0) pattern ^= 1;
  cell.classList.add(i % 2 === pattern ? "variant1" : "variant2");

  // cell.appendChild(piece);
  // cell.appendChild(move);

  // chessboard.appendChild(cell);

  cell_layer.appendChild(cell);
  piece_layer.appendChild(piece);
  move_layer.appendChild(move);
  touch_layer.appendChild(touch);

  elementBoard.push({
    touch: touch,
    cell: cell,
    piece: piece,
    move: move,
  });

  (() => {
    function touchHandler(event) {
      // toggle selected cell
      event.preventDefault();

      if (selectedPieceElement === piece) {
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

            button.classList.add("cell");

            let piece = document.createElement("div");
            piece.classList.add("piece");

            piece.classList.add(
              numberToFileName(((((move >> 4) & 0b11) + 2) << 1) | (move & 0b1))
            );

            button.appendChild(piece);

            function promotionHandler(event) {
              event.preventDefault();

              promotion.classList.add("hidden");
              promotion_options.replaceChildren(); // clear buttons
              chessboard.classList.remove("disabled");

              clientMove(move);
            }

            button.addEventListener("touchstart", promotionHandler);
            button.addEventListener("click", promotionHandler);

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
        elementBoard[(move >>> 8) & 0b111111].cell.classList.add(
          getKeyByValue(moveTypes, (move >>> 4) & 0b1111) as string
        );

        elementBoard[(move >>> 8) & 0b111111].move.classList.add("selected");
      }

      selectedPieceElement = piece;
      selectedPieceMoves = moves;
    }

    touch.addEventListener("touchstart", touchHandler);
    touch.addEventListener("click", touchHandler);
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
  clearMove();

  updateBoard(game.board, previousBoard);
  updateStatus(game.turn);
  updateLastMove(game.history);
  updateIndicators();

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
  document.body.classList.toggle("settings");
}

function settingsIconHandler(event: any) {
  event.preventDefault();
  postMessage({ type: messageTypes.REQUEST_SETTINGS });
  toggleSettings();
}

function closeSettingsHandler(event: any) {
  event.preventDefault();
  toggleSettings();
}

toggle_settings.addEventListener("touchstart", settingsIconHandler);
toggle_settings.addEventListener("click", settingsIconHandler);

close_settings.addEventListener("touchstart", closeSettingsHandler);
close_settings.addEventListener("click", closeSettingsHandler);

undo.addEventListener("touchstart", (event) => {
  event.preventDefault();
  makeUndo();
});

undo.addEventListener("click", (event) => {
  event.preventDefault();
  makeUndo();
});

function aboutHandler(event: any) {
  event.preventDefault();
  document.body.classList.toggle("about");
}

toggle_about.addEventListener("touchstart", aboutHandler);
toggle_about.addEventListener("click", aboutHandler);
close_about.addEventListener("touchstart", aboutHandler);
close_about.addEventListener("click", aboutHandler);

function closePromotion() {
  promotion.classList.add("hidden");
  promotion_options.replaceChildren();
  chessboard.classList.remove("disabled");
}

function promotionCloseHandler(event: any) {
  event.preventDefault();
  closePromotion();
}

promotion_close.addEventListener("touchstart", promotionCloseHandler);
promotion_close.addEventListener("click", promotionCloseHandler);

function toggleFullscreen() {
  if (isFullscreen) {
    const documentElement = document as Document & {
      mozCancelFullScreen(): Promise<void>;
      webkitExitFullscreen(): Promise<void>;
      msExitFullscreen(): Promise<void>;
    };

    if (documentElement.exitFullscreen) {
      documentElement.exitFullscreen();
      isFullscreen = false;
    } else if (documentElement.webkitExitFullscreen) {
      /* Safari */
      documentElement.webkitExitFullscreen();
      isFullscreen = false;
    } else if (documentElement.msExitFullscreen) {
      /* IE11 */
      documentElement.msExitFullscreen();
      isFullscreen = false;
    }
  } else {
    const documentElement = document.documentElement as HTMLElement & {
      mozRequestFullScreen(): Promise<void>;
      webkitRequestFullscreen(): Promise<void>;
      msRequestFullscreen(): Promise<void>;
    };

    if (documentElement.requestFullscreen) {
      documentElement.requestFullscreen();
      isFullscreen = true;
    } else if (documentElement.webkitRequestFullscreen) {
      /* Safari */
      documentElement.webkitRequestFullscreen();
      isFullscreen = true;
    } else if (documentElement.msRequestFullscreen) {
      /* IE11 */
      documentElement.msRequestFullscreen();
      isFullscreen = true;
    }
  }
}

function fullscreenHandler(event: any) {
  event.preventDefault();
  toggleFullscreen();
}

toggle_fullscreen.addEventListener("touchstart", fullscreenHandler);
toggle_fullscreen.addEventListener("click", fullscreenHandler);

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
  document.body.classList.toggle("zen");
}

info_touch_area.addEventListener("touchstart", infoTouchAreaHandler);

info_touch_area.addEventListener("click", infoTouchAreaHandler);

game_selection.addEventListener("change", () => {
  closePromotion();
  document.body.classList.remove("zen");
  document.body.classList.remove("rotated");
  chessboard.classList.remove("rotated");
  document.body.classList.remove("animate_rotate");

  document.querySelector("#depthSetting").classList.remove("disabled");
  document.querySelector("#depth").classList.remove("disabled");
  document
    .querySelector("#pseudoLegalEvaluationSetting")
    .classList.remove("disabled");
  document.querySelector("#pseudoLegalEvaluation").classList.remove("disabled");
  document
    .querySelector("#searchAlgorithmSetting")
    .classList.remove("disabled");
  document.querySelector("#searchAlgorithm").classList.remove("disabled");
  document
    .querySelector("#visualizeSearchSetting")
    .classList.remove("disabled");
  document.querySelector("#visualizeSearch").classList.remove("disabled");

  piecesAreRotated = false;

  switch (game_selection.value) {
    case "whiteAI":
      playerTeam = 0;
      enableAI = true;
      break;
    case "blackAI":
      playerTeam = 1;
      enableAI = true;
      piecesAreRotated = true;

      document.body.classList.add("rotated");
      chessboard.classList.add("rotated");
      break;
    case "tabletop":
      document.body.classList.toggle("zen");
      document.body.classList.add("animate_rotate");
    case "pass":
      playerTeam = 0;
      enableAI = false;

      document.querySelector("#depthSetting").classList.add("disabled");
      document.querySelector("#depth").classList.add("disabled");
      document
        .querySelector("#pseudoLegalEvaluationSetting")
        .classList.add("disabled");
      document
        .querySelector("#pseudoLegalEvaluation")
        .classList.add("disabled");
      document
        .querySelector("#searchAlgorithmSetting")
        .classList.add("disabled");
      document.querySelector("#searchAlgorithm").classList.add("disabled");
      document
        .querySelector("#visualizeSearchSetting")
        .classList.add("disabled");
      document.querySelector("#visualizeSearch").classList.add("disabled");
      break;
      break;
  }

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
const heightScalar = 0.72;
const maxChessboardSize = 980;

function getChessboardSize() {
  const heightMax = window.innerHeight * heightScalar;
  const widthMax = window.innerWidth * widthScalar;

  let size = heightMax > widthMax ? widthMax : heightMax;

  if (size > maxChessboardSize) size = maxChessboardSize;

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
