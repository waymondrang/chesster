import { ChessterGame } from "./game";
import {
  BLACK,
  ChessterMove,
  MAX_PLAYER,
  MIN_PLAYER,
  WHITE,
  boardSize,
  moveTypes,
} from "./types";
import { moveToString } from "./util";

const mobilityWeight = 2;
const pieceValueWeight = 20;
const teamPieceValueWeight = 20;
const enemyPieceValueWeight = 20;
const checkWeight = 0;
const checkmateWeight = 9999;

const miniMaxDepth = 3;

const MVV_LVA: number[][] = [
  [0, 0, 0, 0, 0, 0, 0], // victim K, attacker K, Q, R, B, N, P, None
  [10, 11, 12, 13, 14, 15, 0], // victim P, attacker K, Q, R, B, N, P, None
  [20, 21, 22, 23, 24, 25, 0], // victim N, attacker K, Q, R, B, N, P, None
  [30, 31, 32, 33, 34, 35, 0], // victim B, attacker K, Q, R, B, N, P, None
  [40, 41, 42, 43, 44, 45, 0], // victim R, attacker K, Q, R, B, N, P, None
  [50, 51, 52, 53, 54, 55, 0], // victim Q, attacker K, Q, R, B, N, P, None
  [0, 0, 0, 0, 0, 0, 0], // victim None, attacker K, Q, R, B, N, P, None
];

const pieceValues: number[] = [0, 100, 320, 330, 550, 1000, 0, 0];

function sortMoves(moves: number[]): number[] {
  const sortedMoves: number[] = [];

  for (let i = 0; i < moves.length; i++) {
    try {
      const move = moves[i];

      let score = MVV_LVA[(moves[i] >>> 21) & 0b111][(moves[i] >>> 1) & 0b111];

      let j = 0;
      while (j < sortedMoves.length && score < sortedMoves[j]) j++;

      sortedMoves.splice(j, 0, move);
    } catch (e) {
      console.log(moveToString(moves[i]));
      throw e;
    }
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
    if (this.game.wcm)
      return this.game.turn === WHITE ? -checkmateWeight : checkmateWeight;
    if (this.game.bcm)
      return this.game.turn === BLACK ? -checkmateWeight : checkmateWeight;
    if (this.game.sm) return 0;

    let score = 0;

    for (let i = 0; i < boardSize; i++) {
      if (this.game.board[i]) {
        score +=
          ((this.game.board[i] & 0b1) === this.game.turn ? 1 : -1) *
            pieceValues[(this.game.board[i] >>> 1) & 0b111] +
          mobilityWeight *
            ((this.game.board[i] & 0b1) === this.game.turn ? 1 : -1) *
            this.game.getAvailableMoves(i).length; // if white multiply by -1
      }
    }

    return score;
  }

  quiesce(alpha: number = -Infinity, beta: number = Infinity) {
    let standPat = this.calculateStateScore();

    if (standPat >= beta) return beta;
    if (standPat > alpha) alpha = standPat;

    const moves = sortMoves(this.game.moves());

    for (let i = moves.length - 1; i >= 0; i--) {
      if (
        ((moves[i] >>> 4) & 0b1111) === moveTypes.CAPTURE ||
        ((moves[i] >>> 4) & 0b1111) === moveTypes.EN_PASSANT_BLACK ||
        ((moves[i] >>> 4) & 0b1111) === moveTypes.EN_PASSANT_WHITE ||
        ((moves[i] >>> 6) & 0b11) === 0b11 ||
        this.game.wc ||
        this.game.bc
      ) {
        this.game.move(moves[i]);

        const score = -this.quiesce(-beta, -alpha);

        this.game.undo();

        if (score >= beta) return beta;
        if (score > alpha) alpha = score;
      }
    }

    return alpha;
  }

  negaScout(
    alpha: number = -Infinity,
    beta: number = Infinity,
    depth: number = miniMaxDepth
  ): number {
    if (depth === 0 || this.game.wcm || this.game.bcm || this.game.sm)
      return this.calculateStateScore();
    // if (depth === 0) return this.quiesce(alpha, beta);

    let b = beta;
    let bestScore = -Infinity;

    const moves = sortMoves(this.game.moves());

    for (let i = moves.length - 1; i >= 0; i--) {
      this.game.move(moves[i]);

      let score = -this.negaScout(-b, -alpha, depth - 1);

      // if (score > bestScore)
      //   if (alpha < score && score < beta)
      //     bestScore = Math.max(score, bestScore);
      //   else bestScore = -this.negaScout(-beta, -score, depth - 1);

      if (score > alpha && score < beta && i > 1)
        score = -this.negaScout(-beta, -score, depth - 1);

      bestScore = Math.max(score, bestScore);
      alpha = Math.max(alpha, bestScore);

      this.game.undo();

      if (alpha >= beta) return alpha;

      b = alpha + 1;
    }

    return bestScore;
  }

  negaScoutSearch(): [ChessterMove | undefined, number] {
    let bestMove: ChessterMove | undefined;
    let bestScore = -Infinity;

    let alpha = -Infinity;
    let beta = Infinity;

    const moves = sortMoves(this.game.moves());

    for (let i = moves.length - 1; i >= 0; i--) {
      this.game.move(moves[i]);

      let score = -this.negaScout(-beta, -alpha, miniMaxDepth - 1);

      if (score > bestScore) {
        bestScore = score;
        bestMove = moves[i];
      }

      alpha = Math.max(alpha, score);

      this.game.undo();
    }

    return [bestMove, bestScore];
  }

  miniMax(
    depth: number = miniMaxDepth,
    alpha: number = -Infinity,
    beta: number = Infinity,
    playerType: number = MAX_PLAYER
  ): [ChessterMove | undefined, number] {
    if (depth === 0 || this.game.bcm || this.game.wcm || this.game.sm)
      return [undefined, this.calculateStateScore()];

    if (playerType === MAX_PLAYER) {
      // maximizer
      let bestValue = -Infinity;
      let bestMove: ChessterMove | undefined;

      const moves = sortMoves(this.game.moves());

      if (moves.length === 0) console.error("no moves", moves);

      for (let j = moves.length - 1; j >= 0; j--) {
        if (moves[j] === undefined) console.error("undefined move", moves[j]);

        this.game.move(moves[j]);

        const [_, value] = this.miniMax(depth - 1, alpha, beta, 1 ^ playerType);

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

      const moves = sortMoves(this.game.moves());

      if (moves.length === 0) console.error("no moves", moves);

      for (let j = moves.length - 1; j >= 0; j--) {
        if (moves[j] === undefined) console.error("undefined move", moves[j]);

        this.game.move(moves[j]);

        const [_, value] = this.miniMax(depth - 1, alpha, beta, 1 ^ playerType);

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
    const [move, value] = this.negaScoutSearch();
    console.log(
      "time taken: " + (performance.now() - startTime) + "ms. value: " + value
    );
    return move;
  }

  makeMove(): ChessterMove | undefined {
    const move = this.getMove();
    if (move !== undefined) this.game.move(move);
    return move;
  }
}
