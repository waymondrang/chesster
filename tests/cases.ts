import {
  BLACK,
  ChessterGameState,
  ChessterMove,
  ChessterPiece,
  RecursivePartial,
  Test,
  WHITE,
  moveTypes,
} from "../types";
import { pieceArrayToBoard } from "../util";

// (black) ♜ ♞ ♝ ♛ ♚ ♟︎ (white) ♙ ♖ ♘ ♗ ♕ ♔

const twoRooks: ChessterPiece[] = [
  {
    string: "♖",
    team: WHITE,
    location: [6, 5],
    moved: true,
  },
  {
    string: "♖",
    team: WHITE,
    location: [7, 6],
    moved: true,
  },
  {
    string: "♚",
    team: BLACK,
    location: [2, 7],
    moved: true,
  },
  {
    string: "♔",
    team: WHITE,
    location: [1, 0],
    moved: true,
  },
];

const kingQueen: ChessterPiece[] = [
  {
    string: "♔",
    team: WHITE,
    location: [5, 1],
    moved: true,
  },
  {
    string: "♕",
    team: WHITE,
    location: [6, 4],
    moved: true,
  },
  {
    string: "♚",
    team: BLACK,
    location: [7, 0],
    moved: true,
  },
];

const kingRook: ChessterPiece[] = [
  {
    string: "♔",
    team: WHITE,
    location: [6, 5],
    moved: true,
  },
  {
    string: "♖",
    team: WHITE,
    location: [2, 7],
    moved: true,
  },
  {
    string: "♚",
    team: BLACK,
    location: [6, 7],
    moved: true,
  },
];

export const tests: Test[] = [
  {
    testCase: "lawnmover mate",
    initialState: {
      board: pieceArrayToBoard(twoRooks),
      turn: WHITE,
    },
    moves: [
      {
        piece: twoRooks[0],
        from: [6, 5],
        to: [6, 7],
        type: moveTypes.MOVE,
      },
    ],
    expectedState: {
      white: {
        checked: false,
        checkmated: false,
      },
      black: {
        checked: true,
        checkmated: true,
      },
    },
  },
  {
    testCase: "king queen mate",
    initialState: {
      board: pieceArrayToBoard(kingQueen),
      turn: BLACK,
    },
    moves: [
      {
        piece: kingQueen[2],
        from: [7, 0],
        to: [7, 1],
        type: moveTypes.MOVE,
      },
      {
        piece: kingQueen[1],
        from: [6, 4],
        to: [6, 1],
        type: moveTypes.MOVE,
      },
    ],
    expectedState: {
      black: {
        checked: true,
        checkmated: true,
      },
      white: {
        checked: false,
        checkmated: false,
      },
    },
  },
  {
    testCase: "king rook mate",
    initialState: {
      board: pieceArrayToBoard(kingRook),
    },
    expectedState: {
      black: {
        checked: true,
        checkmated: true,
      },
      white: {
        checked: false,
        checkmated: false,
      },
    },
  },
];
