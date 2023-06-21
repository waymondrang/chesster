import { ChessterGame } from "./game";
import {
  BLACK,
  ChessterBoard,
  ChessterBoardString,
  ChessterGameState,
  ChessterLocation,
  ChessterMove,
  ChessterPiece,
  ChessterPieceString,
  ChessterPlayer,
  PartialChessterGameState,
  RecursivePartial,
  WHITE,
} from "./types";

export const defaultBoard: ChessterBoardString = [
  ["♜", "♞", "♝", "♛", "♚", "♝", "♞", "♜"],
  ["♟︎", "♟︎", "♟︎", "♟︎", "♟︎", "♟︎", "♟︎", "♟︎"],
  new Array(8).fill(undefined),
  new Array(8).fill(undefined),
  new Array(8).fill(undefined),
  new Array(8).fill(undefined),
  ["♙", "♙", "♙", "♙", "♙", "♙", "♙", "♙"],
  ["♖", "♘", "♗", "♕", "♔", "♗", "♘", "♖"],
];

export function calculateTeam(piece: ChessterPieceString) {
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

export function rotateRight(board: ChessterBoard): ChessterBoard {
  const newBoard: ChessterBoard = new Array(8)
    .fill(undefined)
    .map(() => new Array(8).fill(undefined));

  for (let i = 0; i < 8; i++) {
    for (let j = 7; j >= 0; j--) {
      newBoard[i][7 - j] = board[j][i];
    }
  }

  return newBoard;
}

export function pieceArrayToBoard(pieces: ChessterPiece[]): ChessterBoard {
  const board: ChessterBoard = new Array(8)
    .fill(undefined)
    .map(() => new Array(8).fill(undefined));

  for (let i = 0; i < pieces.length; i++) {
    const piece = pieces[i];
    board[piece.location[0]][piece.location[1]] = piece;
  }

  return board;
}

export function partialPieceArrayToBoard(
  pieces: Partial<ChessterPiece>[]
): (Partial<ChessterPiece> | undefined)[][] {
  const board: (Partial<ChessterPiece> | undefined)[][] = new Array(8)
    .fill(undefined)
    .map(() => new Array(8).fill(undefined));

  for (let i = 0; i < pieces.length; i++) {
    const piece = pieces[i];
    board[piece.location![0]]![piece.location![1]] = piece;
  }

  return board;
}

export function boardStringToBoard(
  boardString: ChessterBoardString
): ChessterBoard {
  const board: ChessterBoard = new Array(8)
    .fill(undefined)
    .map(() => new Array(8).fill(undefined));

  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = boardString[7 - j][i];
      if (piece)
        board[i][j] = {
          moved: false,
          string: piece,
          location: [i, j],
          team: calculateTeam(piece),
        };
    }
  }

  return board;
}

function typeOf(variable: any) {
  if (variable === void 0) return "undefined";
  if (variable === null) return "null";

  const type = typeof variable;
  const stype = Object.prototype.toString.call(variable);

  switch (type) {
    case "boolean":
    case "number":
    case "string":
    case "symbol":
    case "function":
      return type;
  }

  if (Array.isArray(variable)) return "array";
  if (variable instanceof Date) return "date";
  if (variable instanceof RegExp) return "regexp";

  switch (stype) {
    case "[object Object]":
      return "object";
  }
}

function sCopy(input: any) {
  switch (typeOf(input)) {
    case "array":
      return input.slice();
    case "object":
      return Object.assign({}, input);
    default:
      return input;
  }
}

/**
 * Recursively copy a value (inferior performance to dCopyState)
 * @param input
 * @param copy
 * @returns
 */
export function dCopy(input: any, copy?: any) {
  switch (typeOf(input)) {
    case "array":
      return dCopyArray(input, copy);
    case "object":
      return dCopyObject(input, copy);
    default:
      return sCopy(input);
  }
}

function dCopyObject(input: any, copy: any) {
  if (copy || input?.constructor === Object) {
    const nInput = new input.constructor();

    for (let key in input) {
      nInput[key] = dCopy(input[key], copy);
    }

    return nInput;
  }

  return input;
}

function dCopyArray(input: any, copy: any) {
  const nInput = new input.constructor(input.length);

  for (let i = 0; i < input.length; i++) {
    nInput[i] = dCopy(input[i], copy);
  }

  return nInput;
}

/**
 * Recursively compare two values (will print "stack trace" of differences)
 * @param a
 * @param b
 * @returns
 */
export function rCompare(a: any, b: any) {
  if (a === undefined) return true;

  if (typeOf(a) !== typeOf(b)) {
    console.log("typeOf(a) !== typeOf(b)", typeOf(a), typeOf(b));
    return false;
  }

  switch (typeOf(a)) {
    case "array":
      return rCompareArray(a, b);
    case "object":
      return rCompareObject(a, b);
    default:
      return a === b;
  }
}

function rCompareObject(a: any, b: any) {
  if (a.constructor !== b.constructor) {
    console.log(
      "a.constructor !== b.constructor",
      a.constructor,
      b.constructor
    );
    return false;
  }

  for (let key in a) {
    if (!rCompare(a[key], b[key])) {
      console.log("!rCompare(a[key], b[key])", a[key], b[key]);
      return false;
    }
  }

  return true;
}

function rCompareArray(a: any, b: any) {
  if (a.length !== b.length) {
    console.log("a.length !== b.length", a.length, b.length);
    return false;
  }

  for (let i = 0; i < a.length; i++) {
    if (!rCompare(a[i], b[i])) {
      console.log("!rCompare(a[i], b[i])", a[i], b[i]);
      return false;
    }
  }

  return true;
}

/**
 * Deep copy a ChessterGameState without recursion (best option for performance)
 * @param state
 * @returns
 */
export function dCopyState(state: ChessterGameState): ChessterGameState {
  let newBoard: ChessterPiece[][] = [[], [], [], [], [], [], [], []];
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      if (state.board[i][j])
        newBoard[i][j] = {
          location: [
            state.board[i][j]!.location[0],
            state.board[i][j]!.location[1],
          ],
          string: state.board[i][j]!.string,
          team: state.board[i][j]!.team,
          moved: state.board[i][j]!.moved,
        };
    }
  }
  let newWhite: ChessterPlayer = {
    pieces: [],
    taken: [],
    checked: state.white.checked,
    checkmated: state.white.checkmated,
    team: WHITE,
  };
  let newBlack: ChessterPlayer = {
    pieces: [],
    taken: [],
    checked: state.black.checked,
    checkmated: state.black.checkmated,
    team: BLACK,
  };

  for (let piece of state.white.pieces) {
    newWhite.pieces.push({
      location: [piece.location[0], piece.location[1]],
      string: piece.string,
      team: piece.team,
      moved: piece.moved,
    });
  }

  for (let piece of state.white.taken) {
    newWhite.taken.push({
      location: [piece.location[0], piece.location[1]],
      string: piece.string,
      team: piece.team,
      moved: piece.moved,
    });
  }

  for (let piece of state.black.pieces) {
    newBlack.pieces.push({
      location: [piece.location[0], piece.location[1]],
      string: piece.string,
      team: piece.team,
      moved: piece.moved,
    });
  }

  for (let piece of state.black.taken) {
    newBlack.taken.push({
      location: [piece.location[0], piece.location[1]],
      string: piece.string,
      team: piece.team,
      moved: piece.moved,
    });
  }

  let newHistory: ChessterMove[] = [];

  for (let move of state.history) {
    newHistory.push({
      from: [move.from[0], move.from[1]],
      to: [move.to[0], move.to[1]],
      type: move.type,
      capture: move.capture ? [move.capture[0], move.capture[1]] : undefined,
      castle: move.castle
        ? {
            from: [move.castle.from[0], move.castle.from[1]],
            to: [move.castle.to[0], move.castle.to[1]],
            piece: {
              location: [
                move.castle.piece.location[0],
                move.castle.piece.location[1],
              ],
              string: move.castle.piece.string,
              team: move.castle.piece.team,
              moved: move.castle.piece.moved,
            },
          }
        : undefined,
      promotion: move.promotion
        ? {
            location: [move.promotion.location[0], move.promotion.location[1]],
            string: move.promotion.string,
            team: move.promotion.team,
            moved: move.promotion.moved,
          }
        : undefined,
    });
  }

  return {
    board: newBoard,
    turn: state.turn,
    white: newWhite,
    black: newBlack,
    history: newHistory,
    simulation: state.simulation,
  };
}

/**
 * Compare two ChessterGameState objects (negligible performance compared to rCompare but is better for debugging)
 * @param a
 * @param b
 * @returns
 */
export function bCompareState(
  a: PartialChessterGameState,
  b: ChessterGameState
): boolean {
  // compare board
  if (a.turn !== undefined && a.turn !== b.turn) {
    console.log("turn mismatch (" + a.turn + " vs " + b.turn + ")");
    return false;
  }

  if (a.board !== undefined) {
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        // base cases
        if (a.board[i][j] === undefined && b.board[i][j] === undefined)
          continue;
        if (
          (a.board[i][j] === undefined && b.board[i][j] !== undefined) ||
          (a.board[i][j] !== undefined && b.board[i][j] === undefined)
        ) {
          console.log(
            "board mismatch at [" + i + ", " + j + "] (" + a.board[i][j] + ")"
          );
          return false;
        }

        if (
          a.board[i][j]!.location![0] !== b.board[i][j]!.location[0] ||
          a.board[i][j]!.location![1] !== b.board[i][j]!.location[1]
        ) {
          console.log(
            "board mismatch at [" +
              i +
              ", " +
              j +
              "] (location: " +
              a.board[i][j]!.location +
              " vs " +
              b.board[i][j]!.location +
              ")"
          );
          return false;
        }
        if (
          a.board[i][j]!.string !== undefined &&
          a.board[i][j]!.string !== b.board[i][j]!.string
        ) {
          console.log(
            "board mismatch at [" +
              i +
              ", " +
              j +
              "] (string: " +
              a.board[i][j]!.string +
              " vs " +
              b.board[i][j]!.string +
              ")"
          );
          return false;
        }
        if (
          a.board[i][j]!.team !== undefined &&
          a.board[i][j]!.team !== b.board[i][j]!.team
        ) {
          console.log(
            "board mismatch at [" +
              i +
              ", " +
              j +
              "] (team: " +
              a.board[i][j]!.team +
              " vs " +
              b.board[i][j]!.team +
              ")"
          );
          return false;
        }
        if (
          a.board[i][j]!.moved !== undefined &&
          a.board[i][j]!.moved !== b.board[i][j]!.moved
        ) {
          console.log(
            "board mismatch at [" +
              i +
              ", " +
              j +
              "] (moved: " +
              a.board[i][j]!.moved +
              " vs " +
              b.board[i][j]!.moved +
              ")"
          );
          return false;
        }
      }
    }
  }

  // compare white
  if (a.white !== undefined) {
    if (a.white.checked !== undefined && a.white.checked !== b.white.checked) {
      console.log(
        "white checked mismatch (" + a.white.checked + " vs " + b.white.checked
      );
      return false;
    }
    if (
      a.white.checkmated !== undefined &&
      a.white.checkmated !== b.white.checkmated
    ) {
      console.log(
        "white checkmated mismatch (" +
          a.white.checkmated +
          " vs " +
          b.white.checkmated
      );
      return false;
    }
    if (a.white.team !== undefined && a.white.team !== b.white.team) {
      console.log(
        "white team mismatch (" + a.white.team + " vs " + b.white.team
      );
      return false;
    }
    if (
      a.white.pieces !== undefined &&
      a.white.pieces.length !== b.white.pieces.length
    )
      for (let i = 0; i < a.white.pieces.length; i++) {
        if (
          a.white.pieces[i].location[0] !== b.white.pieces[i].location[0] ||
          a.white.pieces[i].location[1] !== b.white.pieces[i].location[1]
        ) {
          console.log(
            "white piece mismatch at [" +
              i +
              "] (location: " +
              a.white.pieces[i].location +
              " vs " +
              b.white.pieces[i].location +
              ")"
          );
          return false;
        }
        if (a.white.pieces[i].string !== b.white.pieces[i].string) {
          console.log(
            "white piece mismatch at [" +
              i +
              "] (string: " +
              a.white.pieces[i].string +
              " vs " +
              b.white.pieces[i].string +
              ")"
          );
          return false;
        }
        if (a.white.pieces[i].team !== b.white.pieces[i].team) {
          console.log(
            "white piece mismatch at [" +
              i +
              "] (team: " +
              a.white.pieces[i].team +
              " vs " +
              b.white.pieces[i].team +
              ")"
          );
          return false;
        }
        if (a.white.pieces[i].moved !== b.white.pieces[i].moved) {
          console.log(
            "white piece mismatch at [" +
              i +
              "] (moved: " +
              a.white.pieces[i].moved +
              " vs " +
              b.white.pieces[i].moved +
              ")"
          );
          return false;
        }
      }
    if (
      a.white.taken !== undefined &&
      a.white.taken.length !== b.white.taken.length
    )
      for (let i = 0; i < a.white.taken.length; i++) {
        if (
          a.white.taken[i].location[0] !== b.white.taken[i].location[0] ||
          a.white.taken[i].location[1] !== b.white.taken[i].location[1]
        ) {
          console.log(
            "white taken mismatch at [" +
              i +
              "] (location: " +
              a.white.taken[i].location +
              " vs " +
              b.white.taken[i].location +
              ")"
          );
          return false;
        }
        if (a.white.taken[i].string !== b.white.taken[i].string) {
          console.log(
            "white taken mismatch at [" +
              i +
              "] (string: " +
              a.white.taken[i].string +
              " vs " +
              b.white.taken[i].string +
              ")"
          );
          return false;
        }
        if (a.white.taken[i].team !== b.white.taken[i].team) {
          console.log(
            "white taken mismatch at [" +
              i +
              "] (team: " +
              a.white.taken[i].team +
              " vs " +
              b.white.taken[i].team +
              ")"
          );
          return false;
        }
        if (a.white.taken[i].moved !== b.white.taken[i].moved) {
          console.log(
            "white taken mismatch at [" +
              i +
              "] (moved: " +
              a.white.taken[i].moved +
              " vs " +
              b.white.taken[i].moved +
              ")"
          );
          return false;
        }
      }
  }

  // compare black
  if (a.black !== undefined) {
    if (a.black.checked !== undefined && a.black.checked !== b.black.checked)
      return false;
    if (
      a.black.checkmated !== undefined &&
      a.black.checkmated !== b.black.checkmated
    ) {
      console.log(
        "black checkmated mismatch (" +
          a.black.checkmated +
          " vs " +
          b.black.checkmated
      );
      return false;
    }
    if (a.black.team !== undefined && a.black.team !== b.black.team) {
      console.log(
        "black team mismatch (" + a.black.team + " vs " + b.black.team
      );
      return false;
    }
    if (
      a.black.pieces !== undefined &&
      a.black.pieces.length !== b.black.pieces.length
    )
      for (let i = 0; i < a.black.pieces.length; i++) {
        if (
          a.black.pieces[i].location[0] !== b.black.pieces[i].location[0] ||
          a.black.pieces[i].location[1] !== b.black.pieces[i].location[1]
        ) {
          console.log(
            "black piece mismatch at [" +
              i +
              "] (location: " +
              a.black.pieces[i].location +
              " vs " +
              b.black.pieces[i].location +
              ")"
          );
          return false;
        }
        if (a.black.pieces[i].string !== b.black.pieces[i].string) {
          console.log(
            "black piece mismatch at [" +
              i +
              "] (string: " +
              a.black.pieces[i].string +
              " vs " +
              b.black.pieces[i].string +
              ")"
          );
          return false;
        }
        if (a.black.pieces[i].team !== b.black.pieces[i].team) {
          console.log(
            "black piece mismatch at [" +
              i +
              "] (team: " +
              a.black.pieces[i].team +
              " vs " +
              b.black.pieces[i].team +
              ")"
          );
          return false;
        }
        if (a.black.pieces[i].moved !== b.black.pieces[i].moved) {
          console.log(
            "black piece mismatch at [" +
              i +
              "] (moved: " +
              a.black.pieces[i].moved +
              " vs " +
              b.black.pieces[i].moved +
              ")"
          );
          return false;
        }
      }
    if (
      a.black.taken !== undefined &&
      a.black.taken.length !== b.black.taken.length
    )
      for (let i = 0; i < a.black.taken.length; i++) {
        if (
          a.black.taken[i].location[0] !== b.black.taken[i].location[0] ||
          a.black.taken[i].location[1] !== b.black.taken[i].location[1]
        ) {
          console.log(
            "black taken mismatch at [" +
              i +
              "] (location: " +
              a.black.taken[i].location +
              " vs " +
              b.black.taken[i].location +
              ")"
          );
          return false;
        }
        if (a.black.taken[i].string !== b.black.taken[i].string) {
          console.log(
            "black taken mismatch at [" +
              i +
              "] (string: " +
              a.black.taken[i].string +
              " vs " +
              b.black.taken[i].string +
              ")"
          );
          return false;
        }
        if (a.black.taken[i].team !== b.black.taken[i].team) {
          console.log(
            "black taken mismatch at [" +
              i +
              "] (team: " +
              a.black.taken[i].team +
              " vs " +
              b.black.taken[i].team +
              ")"
          );
          return false;
        }
        if (a.black.taken[i].moved !== b.black.taken[i].moved) {
          console.log(
            "black taken mismatch at [" +
              i +
              "] (moved: " +
              a.black.taken[i].moved +
              " vs " +
              b.black.taken[i].moved +
              ")"
          );
          return false;
        }
      }
  }

  // TODO: compare history

  return true;
}

export function PGNSquareNameToChessterLocation(
  squareName: string
): ChessterLocation {
  return [squareName.charCodeAt(0) - 97, parseInt(squareName.charAt(1)) - 1];
}

export function cleanPGNString(PGN: string): string[][] {
  PGN = PGN.replace(/\s+/g, " ");

  let PGNMoves: string[][] = [];
  let counter = 0; // PGN starts at 1
  let bracketDepth = 0;

  for (let i = 0; i < PGN.length; i++) {
    if (PGN.charAt(i) === "[") bracketDepth++;
    if (PGN.charAt(i) === "]") bracketDepth--;
    if (bracketDepth === 0 && PGN.substring(i).startsWith(`${counter + 1}.`)) {
      PGNMoves.push([PGN.substring(0, i).trim()]);
      PGN = PGN.substring(i + `${counter + 1}.`.length);
      i = 0;
      counter++;
    }
  }

  PGN = PGN.trim();
  PGNMoves.push([PGN.split(" ").slice(0, -1).join(" ")]); // final move
  PGNMoves.push([PGN.split(" ").slice(-1)[0]]); // final score
  PGNMoves.shift(); // remove first empty move

  PGNMoves = PGNMoves.map((move: string[]) => move[0].split(" "));

  return PGNMoves;
}

export function simulatePGNGame(PGNString: string): ChessterGame {
  const moves = cleanPGNString(PGNString);
  const game = new ChessterGame();

  for (let i = 0; i < moves.length; i++) {
    for (let j = 0; j < moves[i].length; j++) {
      let move = moves[i][j];

      if (move === "1-0" || move === "0-1" || move === "1/2-1/2") {
        // game over
        return game;
      } else {
        let player = j === 0 ? game.white : game.black;
        let location: ChessterLocation;
        let piece: string;
        let file: number | undefined = undefined;
        let fileX: boolean | undefined = undefined;
        let captureMove = move.includes("x");
        let checkMove = move.includes("+");
        let checkmateMove = move.includes("#");

        move = move.replace(/[x+#]/g, "");

        if (move === "O-O") {
          // castle kingside
          location = j === 0 ? [6, 0] : [6, 7];
          piece = "K";
        } else if (move === "O-O-O") {
          // castle queenside
          location = j === 0 ? [2, 0] : [2, 7];
          piece = "K";
        } else {
          location = PGNSquareNameToChessterLocation(
            move.substring(move.length - 2)
          );

          piece = move.substring(0, move.length - 2);

          let mFile = piece.at(-1); // maybe file?

          piece = piece.charAt(0);

          // if between a and h, set file
          if (
            mFile &&
            mFile.charCodeAt(0) >= 97 &&
            mFile.charCodeAt(0) <= 104
          ) {
            file = mFile.charCodeAt(0) - 97;
            fileX = true;

            if (piece === mFile) piece = "";
          } else if (
            mFile &&
            mFile.charCodeAt(0) >= 49 &&
            mFile.charCodeAt(0) <= 56
          ) {
            // if between 1 and 8, set rank
            file = mFile.charCodeAt(0) - 49;
            fileX = false;

            if (piece === mFile) piece = "";
          }
        }

        let whitePiece: ChessterPieceString;
        let blackPiece: ChessterPieceString;

        // sanity check
        if (game.turn !== player.team)
          throw new Error(
            "turn mismatch: expected " + player.team + " but got " + game.turn
          );

        switch (piece.toLowerCase()) {
          case "k":
            whitePiece = "♔";
            blackPiece = "♚";
            break;
          case "q":
            whitePiece = "♕";
            blackPiece = "♛";
            break;
          case "r":
            whitePiece = "♖";
            blackPiece = "♜";
            break;
          case "b":
            whitePiece = "♗";
            blackPiece = "♝";
            break;
          case "n":
            whitePiece = "♘";
            blackPiece = "♞";
            break;
          default:
            whitePiece = "♙";
            blackPiece = "♟︎";
            break;
        }

        let flag = false;

        for (let p = 0; p < player.pieces.length; p++) {
          if (
            (player.team === WHITE && player.pieces[p].string === whitePiece) ||
            (player.team === BLACK && player.pieces[p].string === blackPiece)
          ) {
            if (
              file !== undefined &&
              ((fileX === true && player.pieces[p].location[0] !== file) ||
                (fileX === false && player.pieces[p].location[1] !== file))
            )
              continue;

            let moves = game.getAvailableMoves(player.pieces[p]);
            for (let move of moves) {
              if (move.to[0] === location[0] && move.to[1] === location[1]) {
                game.move(move);

                // sanity check for mismatched move types
                if (
                  (captureMove && !move.capture) ||
                  (!captureMove && move.capture)
                )
                  throw new Error("capture move mismatch");

                // sanity check p2
                if (
                  (checkMove &&
                    !(player.team === WHITE
                      ? game.black.checked
                      : game.white.checked)) ||
                  (!checkMove &&
                    (player.team === WHITE
                      ? game.black.checked
                      : game.white.checked))
                )
                  throw new Error("check move mismatch");

                flag = true;
              }
            }
          }
        }

        if (!flag) {
          throw new Error("could not find piece to move");
        }
      }
    }
  }

  return game; // should never get here
}
