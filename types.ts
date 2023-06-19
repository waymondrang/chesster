import { ChessterLocation } from "./location";
import { ChessterMove } from "./move";
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

export const moveTypes = {
  MOVE: "move",
  CAPTURE: "capture",
  CASTLE: "castle",
  EN_PASSANT_CAPTURE: "en_passant",
  PROMOTION: "promotion",
};

export const WHITE = "white";

export const BLACK = "black";

export type pieceBoard = (piece | "")[][];

export type team = typeof WHITE | typeof BLACK;

export type location = [number, number];

export type locationBoard = ChessterLocation[][];

export type history = ChessterMove[];

export type moveType = (typeof moveTypes)[keyof typeof moveTypes];

export type moveData = {
  from: location;
  to: location;
  type: moveType;
};
