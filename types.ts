export const boardSize = 64,
  boardLength = 8,
  boardWidth = 8,
  WHITE = 0,
  BLACK = 1,
  MAX_PLAYER = 0,
  MIN_PLAYER = 1,
  moveTypes = {
    MOVE: 0b0000,
    CASTLE_KINGSIDE: 0b0001,
    CASTLE_QUEENSIDE: 0b0010,
    DOUBLE_PAWN_PUSH: 0b0011,
    CAPTURE: 0b0100,
    EN_PASSANT_WHITE: 0b0101,
    EN_PASSANT_BLACK: 0b0110,
    PROMOTION_KNIGHT: 0b1000,
    PROMOTION_BISHOP: 0b1001,
    PROMOTION_ROOK: 0b1010,
    PROMOTION_QUEEN: 0b1011,
    PROMOTION_KNIGHT_CAPTURE: 0b1100,
    PROMOTION_BISHOP_CAPTURE: 0b1101,
    PROMOTION_ROOK_CAPTURE: 0b1110,
    PROMOTION_QUEEN_CAPTURE: 0b1111,
  },
  defaultBoardString: ChessterBoardString = [
    ["♜", "♞", "♝", "♛", "♚", "♝", "♞", "♜"],
    ["♟︎", "♟︎", "♟︎", "♟︎", "♟︎", "♟︎", "♟︎", "♟︎"],
    new Array(8).fill(undefined),
    new Array(8).fill(undefined),
    new Array(8).fill(undefined),
    new Array(8).fill(undefined),
    ["♙", "♙", "♙", "♙", "♙", "♙", "♙", "♙"],
    ["♖", "♘", "♗", "♕", "♔", "♗", "♘", "♖"],
  ],
  defaultBoard = [
    9, 5, 7, 11, 13, 7, 5, 9, 3, 3, 3, 3, 3, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2,
    2, 2, 2, 2, 2, 2, 8, 4, 6, 10, 12, 6, 4, 8,
  ],
  messageTypes = {
    MOVE: 0b00000001,
    SETTINGS: 0b00000010,
    VISUALIZE_MOVE: 0b00000011,
    REQUEST_SETTINGS: 0b00000100,
  },
  pieces = {
    EMPTY_CELL: 0b0000,
    PAWN: 0b001,
    WHITE_PAWN: 0b0010,
    BLACK_PAWN: 0b0011,
    KNIGHT: 0b010,
    WHITE_KNIGHT: 0b0100,
    BLACK_KNIGHT: 0b0101,
    BISHOP: 0b011,
    WHITE_BISHOP: 0b0110,
    BLACK_BISHOP: 0b0111,
    ROOK: 0b100,
    WHITE_ROOK: 0b1000,
    BLACK_ROOK: 0b1001,
    QUEEN: 0b101,
    WHITE_QUEEN: 0b1010,
    BLACK_QUEEN: 0b1011,
    KING: 0b110,
    WHITE_KING: 0b1100,
    BLACK_KING: 0b1101,
  };

export type ChessterPieceString =
  | "♔"
  | "♕"
  | "♗"
  | "♘"
  | "♖"
  | "♙"
  | "♚"
  | "♛"
  | "♝"
  | "♞"
  | "♜"
  | "♟︎"
  | "♞";

export type ChessterBoard = Array<number>;

export type ChessterBoardString = (ChessterPieceString | "")[][];

export type ChessterTeam = typeof WHITE | typeof BLACK;

export type ChessterLocation = [number, number];

export type ChessterPlayer = {
  pieces: ChessterPiece[];
  taken: ChessterPiece[];
  checked: boolean;
  checkmated: boolean;
};

export type ChessterMove = number;

export type ChessterGameState = {
  board: number[];
  wc: boolean; // white check
  bc: boolean; // black check
  wcm: boolean; // white checkmate
  bcm: boolean; // black checkmate
  wckc: boolean; // can white castle kingside
  wcqc: boolean; // can white castle queenside
  bckc: boolean; // can black castle kingside
  bcqc: boolean; // can black castle queenside
  stalemate: boolean; // stalemate
  draw: boolean; // draw
  turn: 0 | 1;
  history: ChessterHistory;
  zistory: bigint[]; // zobrist history
  zobrist: bigint; // zobrist hash
};

export type PartialChessterGameState = {
  board?: (Partial<ChessterPiece> | undefined)[][];
  white?: Partial<ChessterPlayer>;
  black?: Partial<ChessterPlayer>;
  history?: ChessterHistory;
  turn?: ChessterTeam;
};

export type ChessterPiece = number;
export type ChessterHistory = ChessterMove[];

// https://stackoverflow.com/a/51365037
export type RecursivePartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? RecursivePartial<U>[]
    : T[P] extends object | undefined
    ? RecursivePartial<T[P]>
    : T[P];
};

export type Test = {
  title: string;
  initialState: PartialChessterGameState;
  expectedState: PartialChessterGameState;
  moves?: ChessterMove[];
};

export type PGNTest = {
  title: string;
  pgn: string;
  expectedState: PartialChessterGameState;
};
