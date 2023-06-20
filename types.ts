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

export const moveTypes = {
  MOVE: "MOVE",
  CAPTURE: "CAPTURE",
  CASTLE: "CASTLE",
  EN_PASSANT: "EN_PASSANT",
  PROMOTION: "PROMOTION",
};

export const WHITE = "WHITE";

export const BLACK = "BLACK";

export type ChessterBoard = (ChessterPiece | undefined)[][];
export type ChessterBoardString = (ChessterPieceString | undefined)[][];

export type ChessterTeam = typeof WHITE | typeof BLACK;

export type ChessterLocation = [number, number];

export type ChessterPlayer = {
  team: ChessterTeam;
  pieces: ChessterPiece[];
  taken: ChessterPiece[];
  checked: boolean;
  checkmated: boolean;
};

export type ChessterMove = {
  piece: ChessterPiece;
  from: ChessterLocation;
  to: ChessterLocation;
  type: (typeof moveTypes)[keyof typeof moveTypes];
  capture?: {
    piece: ChessterPiece;
  };
  castle?: {
    from: ChessterLocation;
    to: ChessterLocation;
    piece: ChessterPiece;
  };
  promotion?: ChessterPiece;
  // en passant is a type of capture
};

export type ChessterGameState = {
  board: ChessterBoard;
  white: ChessterPlayer;
  black: ChessterPlayer;
  history: ChessterHistory;
  turn: ChessterTeam;
  simulation: boolean;
};

export type ChessterPiece = {
  string: ChessterPieceString;
  team: ChessterTeam;
  moved: boolean;
  location: ChessterLocation;
};

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
  testCase: string;
  initialState: RecursivePartial<ChessterGameState>;
  expectedState: RecursivePartial<ChessterGameState>;
  moves?: ChessterMove[];
};
