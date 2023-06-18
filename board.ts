import { ChessterLocation } from "./location";
import { ChessterPiece } from "./piece";
import {
  BLACK,
  WHITE,
  board,
  location,
  piece,
  piece_string,
  team,
} from "./types";

const defaultBoard: piece_string[][] = [
  ["br", "bn", "bb", "bq", "bk", "bb", "bn", "br"],
  ["bp", "bp", "bp", "bp", "bp", "bp", "bp", "bp"],
  ["  ", "  ", "  ", "  ", "  ", "  ", "  ", "  "],
  ["  ", "  ", "  ", "  ", "  ", "  ", "  ", "  "],
  ["  ", "  ", "  ", "  ", "  ", "  ", "  ", "  "],
  ["  ", "  ", "  ", "  ", "  ", "  ", "  ", "  "],
  ["wp", "wp", "wp", "wp", "wp", "wp", "wp", "wp"],
  ["wr", "wn", "wb", "wq", "wk", "wb", "wn", "wr"],
];

function rotateArrayRight<T>(arr: T[][]) {
  const new_arr: T[][] = [];
  for (let i = 0; i < arr.length; i++) {
    new_arr.push([]);
    for (let j = 0; j < arr[i].length; j++) {
      new_arr[i].push(arr[j][i]);
    }
  }
  return new_arr;
}

export class ChessterBoard {
  // 8 x 8 board
  board: board;
  whitePieces: ChessterPiece[];
  blackPieces: ChessterPiece[];

  constructor() {
    this.board = [];
    this.whitePieces = [];
    this.blackPieces = [];
  }

  init(board: piece_string[][] = defaultBoard) {
    board = rotateArrayRight<piece_string>(board.reverse());
    for (let i = 0; i < 8; i++) {
      this.board.push([]);
      for (let j = 0; j < 8; j++) {
        let location = new ChessterLocation(this, i, j);
        if (board[i][j].trim() !== "") {
          let team: team = board[i][j][0] === "b" ? BLACK : WHITE;
          let type: piece;
          switch (board[i][j][1]) {
            case "r":
              type = "rook";
              break;
            case "n":
              type = "knight";
              break;
            case "b":
              type = "bishop";
              break;
            case "q":
              type = "queen";
              break;
            case "k":
              type = "king";
              break;
            case "p":
              type = "pawn";
              break;
            default:
              throw new Error("Invalid piece");
          }
          let piece = new ChessterPiece(location, type, team);
          location.setPiece(piece);

          if (piece.getTeam() === WHITE) {
            this.whitePieces.push(piece);
          } else {
            this.blackPieces.push(piece);
          }
        }
        this.board[i].push(location); // push location, not piece
      }
    }
  }

  checkOutOfBounds(location: location): boolean {
    return (
      location[0] < 0 || location[0] > 7 || location[1] < 0 || location[1] > 7
    );
  }

  get(location: location): ChessterLocation | undefined {
    if (this.checkOutOfBounds(location)) return undefined;
    return this.board[location[0]][location[1]];
  }

  set(location: location, piece: ChessterPiece) {
    if (this.checkOutOfBounds(location)) throw new Error("Out of bounds");
    this.board[location[0]][location[1]].setPiece(piece);
  }
}
