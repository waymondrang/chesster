import { ChessterGame } from "./game";
import {
  BLACK,
  ChessterMove,
  MAX_PLAYER,
  MIN_PLAYER,
  WHITE,
  boardSize,
  messageTypes,
  moveTypes,
} from "./types";

const mobilityWeight = 2;
const pieceValueWeight = 20; // (was) used in calculateRelative
const teamPieceValueWeight = 20; // used in calculateAbsolute
const enemyPieceValueWeight = 20; // used in calculateAbsolute
const castlingRightsWeight = 12; // tested, but still arbitrary
const checkmateWeight = 9999;

/////////////////////////////////
//     default ai settings     //
/////////////////////////////////

const defaultDepth = 3;
const defaultPseudoLegalEvaluation = false;
const defaultSearchAlgorithm = "negaScout";
const defaultVisualizeSearch = true;

//////////////////////////////////
//     unsupported settings     //
//////////////////////////////////

const defaultQuiesceDepth = 4;
const defaultUseQuiesceSearch = false;
const defaultUseIterativeDeepening = false;
const defaultSearchTimeout = 3000;

//////////////////////////////////
//     move ordering tables     //
//////////////////////////////////

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

export class ChessterAI {
  game: ChessterGame;
  team: number;
  relativeTable: Map<bigint, number> = new Map();
  absoluteTable: Map<bigint, number> = new Map();

  //////////////////////
  //     settings     //
  //////////////////////

  depth: number;
  pseudoLegalEvaluation: boolean;
  searchAlgorithm: "negaScout" | "miniMax";
  visualizeSearch: boolean;

  constructor(
    game: ChessterGame,
    options?: {
      depth?: number;
      pseudoLegalEvaluation?: boolean;
      searchAlgorithm?: "negaScout" | "miniMax";
      visualizeSearch?: boolean;
    }
  ) {
    this.game = game;
    this.team = BLACK; // default to black

    ////////////////////////////////////
    //     initialize ai settings     //
    ////////////////////////////////////

    this.depth = options?.depth ?? defaultDepth;
    this.pseudoLegalEvaluation =
      options?.pseudoLegalEvaluation ?? defaultPseudoLegalEvaluation;
    this.searchAlgorithm = options?.searchAlgorithm ?? defaultSearchAlgorithm;
    this.visualizeSearch = options?.visualizeSearch ?? defaultVisualizeSearch;
  }

  /**
   * Returns the MVV_LVA value of a move
   * @param move
   * @returns MVV_LVA value
   */
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

  /**
   * Compares two moves using the MVV_LVA value
   * @param move1
   * @param move2
   * @returns
   */
  compareMoves(move1: number, move2: number): number {
    return this.getMVV_LVA(move2) - this.getMVV_LVA(move1);
  }

  /**
   * Returns a list of available moves sorted by MVV_LVA value
   * @returns moves
   */
  getMoves(): number[] {
    if (this.game.isGameOver()) return [];

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

    return moves;
  }

  /**
   * Calculates the score of the current state relative to the AI's team
   * @returns score
   */
  calculateAbsolute(): number {
    if (this.game.wcm)
      return this.game.turn === this.team ? -checkmateWeight : checkmateWeight;
    if (this.game.bcm)
      return this.game.turn === this.team ? -checkmateWeight : checkmateWeight;
    if (this.game.stalemate || this.game.draw) return 0;

    // check transposition table
    if (this.absoluteTable.has(this.game.zobrist))
      return this.absoluteTable.get(this.game.zobrist);

    let score = 0;

    for (let i = 0; i < boardSize; i++) {
      if (this.game.board[i]) {
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

    score +=
      castlingRightsWeight *
      (this.team === WHITE
        ? (this.game.wckc ? 1 : 0) + (this.game.wcqc ? 1 : 0)
        : (this.game.bckc ? 1 : 0) + (this.game.bcqc ? 1 : 0));

    this.absoluteTable.set(this.game.zobrist, score);

    return score;
  }

  /**
   * Calculates the score of the current state relative to the turn's team
   * @returns score
   */
  calculateRelative(): number {
    if (this.game.wcm)
      return this.game.turn === WHITE ? -checkmateWeight : checkmateWeight;
    if (this.game.bcm)
      return this.game.turn === BLACK ? -checkmateWeight : checkmateWeight;
    if (this.game.stalemate || this.game.draw) return 0;

    // check transposition table
    if (this.relativeTable.has(this.game.zobrist))
      return this.relativeTable.get(this.game.zobrist);

    let score = 0;

    for (let i = 0; i < boardSize; i++) {
      if (this.game.board[i]) {
        const moves = this.pseudoLegalEvaluation
          ? this.game.getAllMoves(i)
          : this.game.getAvailableMoves(i);
        score +=
          ((this.game.board[i] & 0b1) === this.game.turn ? 1 : -1) *
            pieceValues[(this.game.board[i] >>> 1) & 0b111] +
          mobilityWeight *
            ((this.game.board[i] & 0b1) === this.game.turn ? 1 : -1) *
            moves.length; // if white multiply by -1
      }
    }

    score +=
      castlingRightsWeight *
      (this.game.turn === WHITE
        ? (this.game.wckc ? 1 : 0) + (this.game.wcqc ? 1 : 0)
        : (this.game.bckc ? 1 : 0) + (this.game.bcqc ? 1 : 0));

    this.relativeTable.set(this.game.zobrist, score);

    return score;
  }

  /**
   * negaScout algorithm
   * @param alpha
   * @param beta
   * @param depth
   * @returns score
   */
  negaScout(alpha: number, beta: number, depth: number): number {
    if (depth === 0 || this.game.isGameOver()) return this.calculateRelative();

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

      if (alpha >= beta) {
        return alpha;
      }

      b = alpha + 1;
    }

    return bestScore;
  }

  /**
   * Top level negaScout search
   * @returns [bestMove, bestScore]
   */
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

        /**
         * NOTE: postMessage will only work in a web worker
         */

        if (this.visualizeSearch)
          postMessage({
            type: messageTypes.VISUALIZE_MOVE,
            move: bestMove,
          });
      }

      alpha = Math.max(alpha, score);

      this.game.undo();
    }

    return [bestMove, bestScore];
  }

  /**
   * minimax algorithm
   * @param depth
   * @param alpha
   * @param beta
   * @param playerType
   * @returns [bestMove, bestScore]
   */
  miniMax(
    depth: number = this.depth,
    alpha: number = -Infinity,
    beta: number = Infinity,
    playerType: number = MAX_PLAYER
  ): [ChessterMove | undefined, number] {
    if (depth === 0 || this.game.isGameOver())
      return [undefined, this.calculateAbsolute()];

    if (playerType === MAX_PLAYER) {
      let bestValue = -Infinity;
      let bestMove: ChessterMove | undefined;

      const moves = this.getMoves();

      for (let j = 0; j < moves.length; j++) {
        this.game.move(moves[j]);

        const [_, value] = this.miniMax(depth - 1, alpha, beta, 1 ^ playerType);

        this.game.undo();

        if (value > bestValue) {
          bestValue = value;
          bestMove = moves[j];
        }

        if (bestValue > alpha) alpha = bestValue;
        if (alpha >= beta) break;
      }

      return [bestMove, bestValue];
    } else if (playerType === MIN_PLAYER) {
      let bestValue = Infinity;
      let bestMove: ChessterMove | undefined;

      const moves = this.getMoves();

      for (let j = 0; j < moves.length; j++) {
        this.game.move(moves[j]);

        const [_, value] = this.miniMax(depth - 1, alpha, beta, 1 ^ playerType);

        this.game.undo();

        // assume minimizer (opponent) plays optimally
        if (value < bestValue) {
          bestValue = value;
          bestMove = moves[j];
        }

        if (bestValue < beta) beta = bestValue;
        if (alpha >= beta) break;
      }

      return [bestMove, bestValue];
    }
  }

  /**
   * Searches for the best move
   * @returns bestMove
   */
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

    /**
     * NOTE: console.log left intentionally
     */

    console.log(
      "algorithm: " +
        this.searchAlgorithm +
        ". depth: " +
        this.depth +
        ". time taken: " +
        (performance.now() - startTime) +
        "ms. value: " +
        value
    );

    return move;
  }

  /**
   * Searches and makes the best move
   * @returns move
   */
  makeMove(): ChessterMove | undefined {
    const move = this.getMove();
    if (move !== undefined) this.game.move(move);
    return move;
  }
}
