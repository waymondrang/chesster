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
import { partialPieceArrayToBoard, pieceArrayToBoard } from "../util";

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

const enPassantWhite: ChessterPiece[] = [
  {
    string: "♟︎",
    team: BLACK,
    location: [3, 6],
    moved: false,
  },
  {
    string: "♙",
    team: WHITE,
    location: [2, 4],
    moved: true,
  },
];

const enPassantBlack: ChessterPiece[] = [
  {
    string: "♟︎",
    team: BLACK,
    location: [4, 3],
    moved: true,
  },
  {
    string: "♙",
    team: WHITE,
    location: [3, 1],
    moved: false,
  },
];

export const tests: Test[] = [
  {
    title: "lawnmover mate",
    initialState: {
      board: pieceArrayToBoard(twoRooks),
      turn: WHITE,
    },
    moves: [
      {
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
    title: "king queen mate",
    initialState: {
      board: pieceArrayToBoard(kingQueen),
      turn: BLACK,
    },
    moves: [
      {
        from: [7, 0],
        to: [7, 1],
        type: moveTypes.MOVE,
      },
      {
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
    title: "king rook mate",
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
  {
    title: "en passant (white)",
    initialState: {
      board: pieceArrayToBoard(enPassantWhite),
      turn: BLACK,
    },
    moves: [
      {
        // black's move
        from: [3, 6],
        to: [3, 4],
        type: moveTypes.MOVE,
      },
      {
        // white's move
        from: [2, 4],
        to: [3, 5],
        type: moveTypes.EN_PASSANT,
        capture: [3, 4],
      },
    ],
    expectedState: {
      board: pieceArrayToBoard([
        {
          string: "♙",
          team: WHITE,
          location: [3, 5],
          moved: true,
        },
      ]),
      black: {
        pieces: [],
        taken: [],
      },
      white: {
        taken: [
          {
            string: "♟︎",
            team: BLACK,
            location: [3, 4],
            moved: true,
          },
        ],
        pieces: [
          {
            string: "♙",
            team: WHITE,
            location: [3, 5],
            moved: true,
          },
        ],
      },
    },
  },
  {
    title: "en passant (black)",
    initialState: {
      board: pieceArrayToBoard(enPassantBlack),
      turn: WHITE,
    },
    moves: [
      {
        from: [3, 1],
        to: [3, 3],
        type: moveTypes.MOVE,
      },
      {
        from: [4, 3],
        to: [3, 2],
        type: moveTypes.EN_PASSANT,
        capture: [3, 3],
      },
    ],
    expectedState: {
      board: pieceArrayToBoard([
        {
          string: "♟︎",
          team: BLACK,
          location: [3, 2],
          moved: true,
        },
      ]),
      black: {
        pieces: [
          {
            string: "♟︎",
            team: BLACK,
            location: [3, 2],
            moved: true,
          },
        ],
        taken: [
          {
            string: "♙",
            team: WHITE,
            location: [3, 3],
            moved: true,
          },
        ],
      },
      white: {
        taken: [],
        pieces: [],
      },
    },
  },
  {
    title: "promotion",
    initialState: {
      board: pieceArrayToBoard([
        {
          string: "♙",
          team: WHITE,
          location: [7, 6],
          moved: true,
        },
        {
          string: "♔",
          team: WHITE,
          location: [6, 3],
          moved: true,
        },
        {
          string: "♚",
          team: BLACK,
          location: [0, 0],
          moved: true,
        },
      ]),
    },
    moves: [
      {
        from: [7, 6],
        to: [7, 7],
        type: moveTypes.PROMOTION,
        promotion: "♕",
      },
      {
        from: [0, 0],
        to: [1, 0],
        type: moveTypes.MOVE,
      },
      {
        from: [7, 7],
        to: [1, 7],
        type: moveTypes.MOVE,
      },
    ],
    expectedState: {
      board: partialPieceArrayToBoard([
        {
          string: "♕",
          location: [1, 7],
          moved: true,
        },
        {
          string: "♚",
          location: [1, 0],
          moved: true,
        },
        {
          string: "♔",
          location: [6, 3],
          moved: true,
        },
      ]),
      black: {
        checked: true,
        checkmated: false,
        pieces: [
          {
            string: "♚",
            location: [1, 0],
            moved: true,
            team: BLACK,
          },
        ],
      },
      white: {
        checked: false,
        checkmated: false,
        pieces: [
          {
            string: "♔",
            team: WHITE,
            location: [6, 3],
            moved: true,
          },
          {
            string: "♕",
            location: [1, 7],
            moved: true,
            team: WHITE,
          },
        ],
      },
    },
  },
];
