import { ChessterGame } from "./game";
import {
  BLACK,
  ChessterGameState,
  ChessterLocation,
  ChessterMove,
  ChessterPiece,
  ChessterPlayer,
  ChessterTeam,
  MAX_PLAYER,
  MIN_PLAYER,
  WHITE,
} from "./types";
import { calculateTeam, dCopyState } from "./util";

class ChessterAINode {
  state: ChessterGameState;
  playerType: typeof MAX_PLAYER | typeof MIN_PLAYER;
  children: ChessterAINode[];
  score: number;

  constructor(
    state: ChessterGameState,
    playerType: typeof MAX_PLAYER | typeof MIN_PLAYER
  ) {
    this.state = state;
    this.score = this.calculateStateScore(state);
    this.playerType = playerType;
    this.children = [];
  }

  calculateStateScore(state: ChessterGameState): number {
    let score = 0;
    for (const row of state.board) {
      for (const piece of row) {
        if (piece) {
          score +=
            (calculateTeam(piece.string) === BLACK ? 1 : -1) *
            this.getPieceValue(piece);
        }
      }
    }
    let blackMobility = 0;
    let whiteMobility = 0;
    const simulation = new ChessterGame(dCopyState(state));
    for (const piece of state.black.pieces)
      blackMobility += simulation.getAvailableMoves(piece).length;

    for (const piece of state.white.pieces)
      whiteMobility += simulation.getAvailableMoves(piece).length;

    score += 0.1 * (blackMobility - whiteMobility);
    return score;
  }

  getPieceValue(piece: ChessterPiece): number {
    switch (piece.string) {
      case "♔":
      case "♚":
        return 200;
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

  isTerminal(): boolean {
    return this.children.length === 0;
  }
}

export class ChessterAI {
  game: ChessterGame;
  self: ChessterPlayer;
  root: ChessterAINode;
  simulator: ChessterGame;

  constructor(game: ChessterGame) {
    // game.turn will indicate the AI's team
    this.game = new ChessterGame(dCopyState(game.getState()));
    this.self = this.game.turn === WHITE ? this.game.white : this.game.black;
    this.root = new ChessterAINode(
      dCopyState(this.game.getState()),
      MAX_PLAYER
    );
    this.simulator = new ChessterGame();
  }

  buildMoveTree(node: ChessterAINode = this.root, depth: number = 0) {
    if (depth === 0) return;
    // console.log(
    //   "playing as " +
    //     (node.playerType === MAX_PLAYER ? "MAX_PLAYER" : "MIN_PLAYER") +
    //     " at depth " +
    //     depth +
    //     " on turn " +
    //     node.state.turn
    // );
    for (const piece of node.state.turn === WHITE
      ? node.state.white.pieces
      : node.state.black.pieces) {
      this.simulator.init(dCopyState(node.state)); // initialize game with current state
      const moves = this.simulator.getAvailableMoves(piece);
      for (const move of moves) {
        // console.log("simulating move: " + JSON.stringify(move));
        this.simulator.init(dCopyState(node.state)); // initialize game with current state
        // console.log(this.simulator.boardToString());
        this.simulator.move(move);
        // console.log(this.simulator.boardToString());
        const child = new ChessterAINode(
          dCopyState(this.simulator.getState()),
          node.playerType === MAX_PLAYER ? MIN_PLAYER : MAX_PLAYER
        );
        node.children.push(child);
        this.buildMoveTree(child, depth - 1);
      }
    }
  }

  miniMax(
    node: ChessterAINode = this.root
  ): [ChessterMove | undefined, number] {
    if (node.isTerminal()) {
      return [undefined, node.score];
    }
    if (node.playerType === MAX_PLAYER) {
      // maximizer
      let bestValue = -Infinity;
      let bestMove: ChessterMove | undefined;
      for (const child of node.children) {
        const [_, value] = this.miniMax(child);
        if (value > bestValue) {
          // can add randomness to make AI "easier"
          bestValue = value;
          bestMove = child.state.history[child.state.history.length - 1];
        }
      }
      return [bestMove, bestValue];
    } else if (node.playerType === MIN_PLAYER) {
      // minimizer
      let bestValue = Infinity;
      let bestMove: ChessterMove | undefined;
      for (const child of node.children) {
        const [_, value] = this.miniMax(child);
        if (value < bestValue) {
          // assume minimizer (opponent) plays optimally
          bestValue = value;
          bestMove = child.state.history[child.state.history.length - 1];
        }
      }
      return [bestMove, bestValue];
    } else {
      throw new Error("invalid player type");
    }
  }

  getNextMove(): ChessterMove | undefined {
    const startTime = performance.now();
    this.buildMoveTree(this.root, 2);
    const [bestMove, _] = this.miniMax();
    console.log("time taken: " + (performance.now() - startTime));
    // console.log(
    //   "best move: " + JSON.stringify(bestMove) + " with score: " + score
    // );
    return bestMove;
    // const startTime = performance.now();
    // const pieces = this.self.pieces;
    // let bestValue: number = -Infinity;
    // let bestMove: ChessterMove | undefined;

    // for (const piece of pieces) {
    //   const moves = this.game.getAvailableMoves(piece);
    //   for (const move of moves) {
    //     const simulator = new ChessterGame(dCopyState(this.game.getState()));
    //     simulator.move(move);
    //     let moveValue =
    //       this.getMoveValue(move) +
    //       simulator.countPiecesInBoundary([2, 2], [5, 5]) * 0.5;
    //     if (moveValue > bestValue) {
    //       bestValue = moveValue;
    //       bestMove = move;
    //     }
    //   }
    // }

    // const endTime = performance.now();
    // console.log(`AI took ${endTime - startTime}ms to make a move`);
    // return bestMove;
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

  calculateStateScore(state: ChessterGameState): number {
    let score = 0;
    for (const row of state.board) {
      for (const piece of row) {
        if (piece) {
          score +=
            (calculateTeam(piece.string) === BLACK ? 1 : -1) * // assuming white is maximizer
            this.getPieceValue(piece);
        }
      }
    }
    console.log("score: " + score);
    return score;
  }
}
