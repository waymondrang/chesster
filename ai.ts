import { ChessterGame } from "./game";
import {
  BLACK,
  ChessterMove,
  MAX_PLAYER,
  MIN_PLAYER,
  boardSize,
} from "./types";

const mobilityWeight = 3;
const teamPieceValueWeight = 20;
const enemyPieceValueWeight = 23;
const checkWeight = 100;
const checkmateWeight = 10000;
const stalemateWeight = 0;

const miniMaxDepth = 6; // not necessary if not going off time
const miniMaxTimeLimit = 5000;

const MVV_LVA: number[][] = [
  [0, 0, 0, 0, 0, 0, 0], // victim K, attacker K, Q, R, B, N, P, None
  [10, 11, 12, 13, 14, 15, 0], // victim P, attacker K, Q, R, B, N, P, None
  [20, 21, 22, 23, 24, 25, 0], // victim N, attacker K, Q, R, B, N, P, None
  [30, 31, 32, 33, 34, 35, 0], // victim B, attacker K, Q, R, B, N, P, None
  [40, 41, 42, 43, 44, 45, 0], // victim R, attacker K, Q, R, B, N, P, None
  [50, 51, 52, 53, 54, 55, 0], // victim Q, attacker K, Q, R, B, N, P, None
  [0, 0, 0, 0, 0, 0, 0], // victim None, attacker K, Q, R, B, N, P, None
];

const pieceValues: number[] = [0, 100, 310, 320, 500, 900, 2000, 0];

function sortMoves(moves: number[]): number[] {
  const sortedMoves: number[] = [];

  for (let i = 0; i < moves.length; i++) {
    const move = moves[i];

    let score = MVV_LVA[(moves[i] >>> 21) & 0b111][(moves[i] >>> 1) & 0b111];

    let j = 0;
    while (j < sortedMoves.length && score < sortedMoves[j]) j++;

    sortedMoves.splice(j, 0, move);
  }

  return sortedMoves;
}

export class ChessterAI {
  game: ChessterGame;
  team: number;

  constructor(game: ChessterGame, team: number = BLACK) {
    // game.turn will indicate the ai's team
    this.game = game;
    this.team = team;
  }

  /**
   * calculates the team player's score
   * @returns
   */
  calculateStateScore(): number {
    let score = 0;

    for (let i = 0; i < boardSize; i++) {
      if (this.game.board[i] !== 0) {
        score +=
          ((this.game.board[i] & 0b1) === this.team
            ? teamPieceValueWeight
            : -enemyPieceValueWeight) *
            pieceValues[(this.game.board[i] >>> 1) & 0b111] +
          mobilityWeight *
            ((this.game.board[i] & 0b1) === this.team ? 1 : -1) *
            this.game.getAvailableMoves(i).length;
      }
    }

    // score +=
    //   this.game.history[this.game.history.length - 1] !== undefined
    //     ? ((this.game.history[this.game.history.length - 1] & 0b1) === this.team
    //         ? 1
    //         : -1) *
    //       pieceValues[
    //         (this.game.history[this.game.history.length - 1] >>> 21) & 0b111
    //       ] *
    //       captureWeight
    //     : 0;

    score +=
      (this.team === BLACK ? 1 : -1) *
      (checkWeight * this.game.wc +
        -checkWeight * this.game.bc +
        checkmateWeight * this.game.wcm +
        -checkmateWeight * this.game.bcm);

    return score;
  }

  miniMax(
    depth: number = miniMaxDepth,
    alpha: number = -Infinity,
    beta: number = Infinity,
    playerType: number = MAX_PLAYER,
    timeStart: number = performance.now()
  ): [ChessterMove | undefined, number] {
    if (
      depth === 0 ||
      this.game.bcm ||
      this.game.wcm ||
      this.game.sm ||
      performance.now() - timeStart > miniMaxTimeLimit
    )
      return [undefined, this.calculateStateScore()];

    if (playerType === MAX_PLAYER) {
      // maximizer
      let bestValue = -Infinity;
      let bestMove: ChessterMove | undefined;

      const moves = sortMoves(this.game.moves);

      for (let j = moves.length - 1; j >= 0; j--) {
        this.game.move(moves[j]);

        const [_, value] = this.miniMax(
          depth - 1,
          alpha,
          beta,
          1 ^ playerType,
          timeStart
        );

        this.game.undo();

        if (value > bestValue) {
          // can add randomness to make AI "easier"
          bestValue = value;
          bestMove = moves[j];
        }

        if (bestValue > alpha) alpha = bestValue;
        if (alpha >= beta) break;
      }

      return [bestMove, bestValue];
    } else if (playerType === MIN_PLAYER) {
      // minimizer
      let bestValue = Infinity;
      let bestMove: ChessterMove | undefined;

      const moves = sortMoves(this.game.moves);

      for (let j = moves.length - 1; j >= 0; j--) {
        this.game.move(moves[j]);

        const [_, value] = this.miniMax(
          depth - 1,
          alpha,
          beta,
          1 ^ playerType,
          timeStart
        );

        this.game.undo();

        if (value < bestValue) {
          // assume minimizer (opponent) plays optimally
          bestValue = value;
          bestMove = moves[j];
        }

        if (bestValue < beta) beta = bestValue;
        if (alpha >= beta) break;
      }

      return [bestMove, bestValue];
    } else {
      throw new Error("invalid player type");
    }
  }

  getMove(): ChessterMove | undefined {
    const startTime = performance.now();
    // this.root = new ChessterAINode(this.game.getState(), MAX_PLAYER, 0);
    // this.buildMoveTree(this.root, depth);
    this.team = this.game.turn;
    const [bestMove, value] = this.miniMax();
    console.log(
      "time taken: " + (performance.now() - startTime) + "ms, value: " + value
    );
    return bestMove;
  }

  makeMove(): ChessterMove | undefined {
    const move = this.getMove();
    if (move !== undefined) this.game.move(move);
    return move;
  }
}
