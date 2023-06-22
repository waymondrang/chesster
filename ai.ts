import { ChessterGame } from "./game";
import {
  ChessterLocation,
  ChessterMove,
  ChessterPiece,
  ChessterPlayer,
  WHITE,
} from "./types";
import { dCopyState } from "./util";

export class ChessterAI {
  game: ChessterGame;
  self: ChessterPlayer;

  constructor(game: ChessterGame) {
    // game.turn will indicate the AI's team
    this.game = new ChessterGame(dCopyState(game.getState()));
    this.self = this.game.turn === WHITE ? this.game.white : this.game.black;
  }

  getNextMove(): ChessterMove | undefined {
    const startTime = performance.now();
    const pieces = this.self.pieces;
    let bestValue: number = -Infinity;
    let bestMove: ChessterMove | undefined;

    for (const piece of pieces) {
      const moves = this.game.getAvailableMoves(piece);
      for (const move of moves) {
        const simulator = new ChessterGame(dCopyState(this.game.getState()));
        simulator.move(move);
        let moveValue =
          this.getMoveValue(move) +
          simulator.countPiecesInBoundary([2, 2], [5, 5]) * 0.5;
        if (moveValue > bestValue) {
          bestValue = moveValue;
          bestMove = move;
        }
      }
    }

    const endTime = performance.now();
    console.log(`AI took ${endTime - startTime}ms to make a move`);
    return bestMove;
  }

  getMoveValue(move: ChessterMove): number {
    if (move.capture) {
      return this.getPieceValue(
        this.game.board[move.capture[0]][move.capture[1]]! // assert existence
      );
    } else {
      return 0;
    }
  }

  getPieceValue(piece: ChessterPiece): number {
    switch (piece.string) {
      case "♔":
      case "♚":
        return 1000;
      case "♕":
      case "♛":
        return 9;
      case "♗":
      case "♝":
        return 3;
      case "♘":
      case "♞":
        return 3;
      case "♖":
      case "♜":
        return 5;
      case "♙":
      case "♟︎":
        return 1;
      default:
        throw new Error("getting value of invalid piece");
    }
  }
}
