import { ChessterLocation } from "./location";
import { ChessterPiece } from "./piece";

export type piece = "king" | "queen" | "bishop" | "knight" | "rook" | "pawn";

export type piece_string =
  | "bk"
  | "bq"
  | "bb"
  | "bn"
  | "br"
  | "bp"
  | "wk"
  | "wq"
  | "wb"
  | "wn"
  | "wr"
  | "wp"
  | "  ";

export const WHITE = "white";
export const BLACK = "black";

export type team = typeof WHITE | typeof BLACK;

export type location = [number, number];

export type board = ChessterLocation[][];

export type board_string = piece_string[][];
