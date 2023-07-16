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
const castlingRightsWeight = 12; // tested, but still arbitrary
const checkmateWeight = 9999;
const targetedPiecesWeight = 5;

/////////////////////////////////
//     default ai settings     //
/////////////////////////////////

const defaultDepth = 4;
const defaultPseudoLegalEvaluation = false; // evaluate state using legal moves?
const defaultSearchAlgorithm = "negaScout";

const MVV_LVA: number[][] = [
  [0, 0, 0, 0, 0, 0, 0], // victim K, attacker K, Q, R, B, N, P, None
  [10, 11, 12, 13, 14, 15, 0], // victim P, attacker K, Q, R, B, N, P, None
  [20, 21, 22, 23, 24, 25, 0], // victim N, attacker K, Q, R, B, N, P, None
  [30, 31, 32, 33, 34, 35, 0], // victim B, attacker K, Q, R, B, N, P, None
  [40, 41, 42, 43, 44, 45, 0], // victim R, attacker K, Q, R, B, N, P, None
  [50, 51, 52, 53, 54, 55, 0], // victim Q, attacker K, Q, R, B, N, P, None
  [0, 0, 0, 0, 0, 0, 0], // victim None, attacker K, Q, R, B, N, P, None
];

const pieceValues: number[] = [0, 100, 310, 340, 550, 1000, 0, 0];

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

  //////////////////////
  //     settings     //
  //////////////////////
  depth: number;
  pseudoLegalEvaluation: boolean;
  searchAlgorithm: "negaScout" | "miniMax";

  constructor(game: ChessterGame) {
    this.game = game;
    this.team = BLACK; // default to black

    this.depth = defaultDepth;
    this.pseudoLegalEvaluation = defaultPseudoLegalEvaluation;
    this.searchAlgorithm = defaultSearchAlgorithm;
  }

  getMVV_LVA(move: number): number {
    let victim = 0;

    switch ((move >>> 4) & 0b1111) {
      case moveTypes.CAPTURE:
        victim = this.game.board[(move >>> 8) & 0b111111];
        break;
      case moveTypes.EN_PASSANT_WHITE:
        victim = this.game.board[((move >>> 8) & 0b111111) + 8];
        break;
      case moveTypes.EN_PASSANT_BLACK:
        victim = this.game.board[((move >>> 8) & 0b111111) - 8];
        break;
      case moveTypes.PROMOTION_QUEEN_CAPTURE:
      case moveTypes.PROMOTION_QUEEN:
        victim = this.game.board[(move >>> 8) & 0b111111];
        break;
      case moveTypes.PROMOTION_ROOK_CAPTURE:
      case moveTypes.PROMOTION_ROOK:
        victim = this.game.board[(move >>> 8) & 0b111111];
        break;
      case moveTypes.PROMOTION_BISHOP_CAPTURE:
      case moveTypes.PROMOTION_BISHOP:
        victim = this.game.board[(move >>> 8) & 0b111111];
        break;
      case moveTypes.PROMOTION_KNIGHT_CAPTURE:
      case moveTypes.PROMOTION_KNIGHT:
        victim = this.game.board[(move >>> 8) & 0b111111];
        break;
    }

    return MVV_LVA[(victim >>> 1) & 0b111][(move >>> 1) & 0b111];
  }

  compareMoves(move1: number, move2: number): number {
    return this.getMVV_LVA(move2) - this.getMVV_LVA(move1);
  }

  getMoves(): number[] {
    if (this.game.wcm || this.game.bcm || this.game.sm) return [];

    let moves = [];

    for (let i = 0; i < boardSize; i++) {
      if (this.game.board[i] && (this.game.board[i] & 0b1) === this.game.turn) {
        const pieceMoves = this.game.getAvailableMoves(i);
        for (let j = 0; j < pieceMoves.length; j++) {
          moves.push(pieceMoves[j]);
          let k = moves.length - 1;
          while (k > 0 && this.compareMoves(moves[k - 1], moves[k]) > 0) {
            [moves[k - 1], moves[k]] = [moves[k], moves[k - 1]]; // swap
            k--;
          }
        }
      }
    }

    // console.log(moves.map((move) => this.getMVV_LVA(move)));

    return moves;
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
        const moves = this.pseudoLegalEvaluation
          ? this.game.getAvailableMoves(i)
          : this.game.getAllMoves(i);
        score +=
          ((this.game.board[i] & 0b1) === this.game.turn ? 1 : -1) *
            pieceValues[(this.game.board[i] >>> 1) & 0b111] +
          mobilityWeight *
            ((this.game.board[i] & 0b1) === this.game.turn ? 1 : -1) *
            moves.length; // if white multiply by -1
      }
    }

    // attempt to add castling rights weight
    score +=
      castlingRightsWeight *
      (this.game.turn === WHITE
        ? (this.game.wckc ? 1 : 0) + (this.game.wcqc ? 1 : 0)
        : (this.game.bckc ? 1 : 0) + (this.game.bcqc ? 1 : 0));

    return score;
  }

  /**
   * currently is not behaving properly
   * @param alpha
   * @param beta
   * @returns
   */
  quiesce(alpha: number = -Infinity, beta: number = Infinity) {
    let standPat = this.calculateStateScore();

    if (standPat >= beta) return beta;
    if (alpha < standPat) alpha = standPat;

    const moves = this.getMoves();

    for (let i = 0; i < moves.length; i++) {
      if (((moves[i] >>> 4) & 0b1111) === moveTypes.CAPTURE) {
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
    depth: number = defaultDepth
  ): number {
    if (depth === 0 || this.game.wcm || this.game.bcm || this.game.sm)
      return this.calculateStateScore();
    // if (depth === 0) return this.quiesce(alpha, beta); // works better with depth 3 or less

    let b = beta;
    let bestScore = -Infinity;

    const moves = this.getMoves();

    for (let i = 0; i < moves.length; i++) {
      this.game.move(moves[i]);

      let score = -this.negaScout(-b, -alpha, depth - 1);

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

    const moves = this.getMoves();

    for (let i = 0; i < moves.length; i++) {
      this.game.move(moves[i]);

      let score = -this.negaScout(-beta, -alpha, this.depth - 1);

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
    depth: number = this.depth,
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

      const moves = this.getMoves();

      for (let j = 0; j < moves.length; j++) {
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

      const moves = this.getMoves();

      for (let j = 0; j < moves.length; j++) {
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
    }
  }

  getMove(): ChessterMove | undefined {
    const startTime = performance.now();

    this.team = this.game.turn;

    const [move, value] = (() => {
      switch (this.searchAlgorithm) {
        case "negaScout":
          return this.negaScoutSearch();
        case "miniMax":
          return this.miniMax();
      }
    })();

    console.log(
      "algorithm: " +
        this.searchAlgorithm +
        ". time taken: " +
        (performance.now() - startTime) +
        "ms. value: " +
        value
    );

    return move;
  }

  makeMove(): ChessterMove | undefined {
    const move = this.getMove();
    if (move !== undefined) this.game.move(move);
    return move;
  }
}
