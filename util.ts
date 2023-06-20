import {
  BLACK,
  ChessterBoard,
  ChessterBoardString,
  ChessterPiece,
  ChessterPieceString,
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

export function rCompare(a: any, b: any) {
  if (a === undefined) return true;

  if (typeOf(a) !== typeOf(b)) return false;

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
  if (a.constructor !== b.constructor) return false;

  for (let key in a) {
    if (!rCompare(a[key], b[key])) return false;
  }

  return true;
}

function rCompareArray(a: any, b: any) {
  if (a.length !== b.length) return false;

  for (let i = 0; i < a.length; i++) {
    if (!rCompare(a[i], b[i])) return false;
  }

  return true;
}
