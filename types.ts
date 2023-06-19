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
  MOVE: "move",
  CAPTURE: "capture",
  CASTLE: "castle",
  EN_PASSANT_CAPTURE: "en_passant",
  PROMOTION: "promotion",
};

export const WHITE = "white";

export const BLACK = "black";

// rename?
export type ChessterBoard = (ChessterPiece | undefined)[][];
export type ChessterBoardString = (ChessterPieceString | undefined)[][];

export type ChessterTeam = typeof WHITE | typeof BLACK;

export type ChessterLocation = [number, number];

export type ChessterPlayer = {
  team: ChessterTeam;
  pieces: ChessterPiece[];
  taken: ChessterPiece[];
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

export type ChessterPiece = {
  string: ChessterPieceString;
  team: ChessterTeam;
  moved: boolean;
  location: ChessterLocation;
};

export type ChessterHistory = ChessterMove[];
