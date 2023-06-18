import { ChessterLocation } from "./location";
import { ChessterPiece } from "./piece";

export type piece =
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

export type pieceBoard = (piece | "")[][];

export const WHITE = "white";
export const BLACK = "black";

export type team = typeof WHITE | typeof BLACK;

export type location = [number, number];

export type locationBoard = ChessterLocation[][];

export type move = { from: string; to: string; promotion?: piece };

export type history = move[];
