import {
  BLACK,
  ChessterBoard,
  ChessterGameState,
  ChessterHistory,
  ChessterMove,
  RecursivePartial,
  WHITE,
  boardSize,
  defaultBoard,
  moveTypes,
} from "./types";
import {
  binaryToString,
  linearCongruentialGenerator,
  numberToLetterString,
  numberToPieceString,
} from "./util";

export class ChessterGame {
  /** array representation of board */
  board: number[];
  /** white is in check */
  wc: boolean;
  /** black is in check */
  bc: boolean;
  /** white is in checkmate */
  wcm: boolean;
  /** black is in checkmate */
  bcm: boolean;
  /** white can castle kingside */
  wckc: boolean;
  /** black can castle kingside */
  bckc: boolean;
  /** white can castle queenside */
  wcqc: boolean;
  /** black can castle queenside */
  bcqc: boolean;
  /** game in stalemate */
  stalemate: boolean;
  /** game in draw */
  draw: boolean;
  /** 0 if white to move, 1 if black to move */
  turn: 0 | 1;
  /** move history */
  history: number[];
  /** zobrist hash for current state */
  zobrist: bigint;
  /** zobrist history */
  zistory: bigint[];
  /** zobrist keys */
  #zeys: bigint[];

  /**
   * Creates a new Chesster game instance
   */
  constructor(state?: RecursivePartial<ChessterGameState>) {
    this.init(state);
  }

  init(state?: RecursivePartial<ChessterGameState>) {
    this.board = state?.board ?? [...defaultBoard];
    this.turn = state?.turn ?? WHITE;
    this.history = state?.history ?? [];

    this.wc = state?.wc ?? false; // white check
    this.bc = state?.bc ?? false; // black check
    this.wcm = state?.wcm ?? false; // white checkmate
    this.bcm = state?.bcm ?? false; // black checkmate

    this.wckc = state?.wckc ?? true; // white can castle kingside
    this.wcqc = state?.wcqc ?? true; // white can castle queenside
    this.bckc = state?.bckc ?? true; // black can castle kingside
    this.bcqc = state?.bcqc ?? true; // black can castle queenside

    this.stalemate = state?.stalemate ?? false; // stalemate
    this.draw = state?.draw ?? false; // draw

    ///////////////////////////////////
    //     generate zobrist keys     //
    ///////////////////////////////////

    this.#zeys = [8746989176631517180n]; // initial zobrist key

    for (let i = 1; i < 781; i++)
      this.#zeys.push(linearCongruentialGenerator(this.#zeys[i - 1]));

    //////////////////////////////////////
    //     generate initial zobrist     //
    //////////////////////////////////////

    if (state?.zobrist) this.zobrist = state.zobrist;
    else {
      this.zobrist = 0n;

      for (let i = 0; i < boardSize; i++)
        if (this.board[i])
          this.zobrist ^= this.#zeys[i * 12 + (this.board[i] - 2)];

      if (this.turn === BLACK) this.zobrist ^= this.#zeys[768];

      if (this.wckc) this.zobrist ^= this.#zeys[769];
      if (this.wcqc) this.zobrist ^= this.#zeys[770];
      if (this.bckc) this.zobrist ^= this.#zeys[771];
      if (this.bcqc) this.zobrist ^= this.#zeys[772];
    }

    this.zistory = state?.zistory ?? [this.zobrist];

    ////////////////////////////
    //     update on init     //
    ////////////////////////////

    let sanityZobrist = this.zobrist;

    this.#update(); // if we properly validate this move, this should not be required

    if (this.zobrist !== sanityZobrist) {
      console.log("zobrist mismatch");
      console.log(this.zobrist);
      console.log(sanityZobrist);
      throw new Error("zobrist mismatch");
    }
  }

  /**
   * Takes back the last move
   */
  undo() {
    const move = this.history.pop();

    if (move) {
      ////////////////////////////
      //     update zobrist     //
      ////////////////////////////

      this.zistory.pop();
      this.zobrist = this.zistory[this.zistory.length - 1];

      this.turn ^= 1;
      this.stalemate = false; // update stalemate
      this.draw = false; // update draw
      this.bcm = false;
      this.wcm = false;

      this.bcqc = ((move >>> 31) & 0b1) === 1;
      this.wcqc = ((move >>> 30) & 0b1) === 1;
      this.bckc = ((move >>> 29) & 0b1) === 1;
      this.wckc = ((move >>> 28) & 0b1) === 1;
      // this.bcm = ((move >>> 27) & 0b1) === 1;
      // this.wcm = ((move >>> 26) & 0b1) === 1;
      this.bc = ((move >>> 25) & 0b1) === 1;
      this.wc = ((move >>> 24) & 0b1) === 1;

      switch ((move >>> 4) & 0b1111) {
        case moveTypes.PROMOTION_QUEEN_CAPTURE:
          this.board[(move >>> 8) & 0b111111] = (move >>> 20) & 0b1111;
          this.board[(move >>> 14) & 0b111111] = move & 0b1111;
          break;
        case moveTypes.PROMOTION_BISHOP_CAPTURE:
          this.board[(move >>> 8) & 0b111111] = (move >>> 20) & 0b1111;
          this.board[(move >>> 14) & 0b111111] = move & 0b1111;
          break;
        case moveTypes.PROMOTION_ROOK_CAPTURE:
          this.board[(move >>> 8) & 0b111111] = (move >>> 20) & 0b1111;
          this.board[(move >>> 14) & 0b111111] = move & 0b1111;
          break;
        case moveTypes.PROMOTION_KNIGHT_CAPTURE:
          this.board[(move >>> 8) & 0b111111] = (move >>> 20) & 0b1111;
          this.board[(move >>> 14) & 0b111111] = move & 0b1111;
          break;
        case moveTypes.CAPTURE:
          this.board[(move >>> 8) & 0b111111] = (move >>> 20) & 0b1111;
          this.board[(move >>> 14) & 0b111111] = move & 0b1111;
          break;
        case moveTypes.CASTLE_KINGSIDE:
          this.board[(move >>> 14) & 0b111111] = move & 0b1111;
          this.board[((move >>> 14) & 0b111111) + 2] = 0;
          this.board[((move >>> 14) & 0b111111) + 3] =
            this.board[((move >>> 14) & 0b111111) + 1];
          this.board[((move >>> 14) & 0b111111) + 1] = 0;
          break;
        case moveTypes.CASTLE_QUEENSIDE:
          this.board[(move >>> 14) & 0b111111] = move & 0b1111;
          this.board[((move >>> 14) & 0b111111) - 2] = 0;
          this.board[((move >>> 14) & 0b111111) - 4] =
            this.board[((move >>> 14) & 0b111111) - 1];
          this.board[((move >>> 14) & 0b111111) - 1] = 0;
          break;
        case moveTypes.EN_PASSANT_WHITE:
          this.board[(move >>> 14) & 0b111111] = move & 0b1111;
          this.board[((move >>> 8) & 0b111111) + 8] = (move >>> 20) & 0b1111;
          this.board[(move >>> 8) & 0b111111] = 0;
          break;
        case moveTypes.EN_PASSANT_BLACK:
          this.board[(move >>> 14) & 0b111111] = move & 0b1111;
          this.board[((move >>> 8) & 0b111111) - 8] = (move >>> 20) & 0b1111;
          this.board[(move >>> 8) & 0b111111] = 0;
          break;
        case moveTypes.PROMOTION_KNIGHT:
          this.board[(move >>> 14) & 0b111111] = move & 0b1111;
          this.board[(move >>> 8) & 0b111111] = 0;
          break;
        case moveTypes.PROMOTION_BISHOP:
          this.board[(move >>> 14) & 0b111111] = move & 0b1111;
          this.board[(move >>> 8) & 0b111111] = 0;
          break;
        case moveTypes.PROMOTION_ROOK:
          this.board[(move >>> 14) & 0b111111] = move & 0b1111;
          this.board[(move >>> 8) & 0b111111] = 0;
          break;
        case moveTypes.PROMOTION_QUEEN:
          this.board[(move >>> 14) & 0b111111] = move & 0b1111;
          this.board[(move >>> 8) & 0b111111] = 0;
          break;
        case moveTypes.DOUBLE_PAWN_PUSH:
        case moveTypes.MOVE:
          this.board[(move >>> 14) & 0b111111] = move & 0b1111;
          this.board[(move >>> 8) & 0b111111] = 0;
          break;
        default:
          throw new Error("invalid move type");
      }
    }
  }

  /**
   * Performs a move
   * @param move The move to perform
   */
  move(move: ChessterMove) {
    // 32 bit number
    let history =
      ((this.bcqc ? 1 : 0) << 31) |
      ((this.wcqc ? 1 : 0) << 30) |
      ((this.bckc ? 1 : 0) << 29) |
      ((this.wckc ? 1 : 0) << 28) |
      // ((this.bcm ? 1 : 0) << 27) |
      // ((this.wcm ? 1 : 0) << 26) |
      ((this.bc ? 1 : 0) << 25) |
      ((this.wc ? 1 : 0) << 24);

    switch ((move >>> 4) & 0b1111) {
      case moveTypes.CAPTURE:
        history |= this.board[(move >>> 8) & 0b111111] << 20;

        this.zobrist ^=
          this.#zeys[
            ((move >>> 8) & 0b111111) * 12 +
              (this.board[(move >>> 8) & 0b111111] - 2) // remove captured piece
          ] ^
          this.#zeys[
            ((move >>> 8) & 0b111111) * 12 + ((move & 0b1111) - 2) // add moved piece
          ] ^
          this.#zeys[
            ((move >>> 14) & 0b111111) * 12 + ((move & 0b1111) - 2) // remove moved piece
          ];

        this.board[(move >>> 14) & 0b111111] = 0;
        this.board[(move >>> 8) & 0b111111] = move & 0b1111;
        break;
      case moveTypes.CASTLE_KINGSIDE: // todo: add zobrist
        this.zobrist ^=
          this.#zeys[
            ((move >>> 14) & 0b111111) * 12 + ((move & 0b1111) - 2) // remove king
          ] ^
          this.#zeys[
            (((move >>> 14) & 0b111111) + 2) * 12 + ((move & 0b1111) - 2) // add king
          ] ^
          this.#zeys[
            (((move >>> 14) & 0b111111) + 3) * 12 +
              (this.board[((move >>> 14) & 0b111111) + 3] - 2) // remove rook
          ] ^
          this.#zeys[
            (((move >>> 14) & 0b111111) + 1) * 12 +
              (this.board[((move >>> 14) & 0b111111) + 3] - 2) // add rook
          ];

        this.board[(move >>> 14) & 0b111111] = 0;
        this.board[((move >>> 14) & 0b111111) + 2] = move & 0b1111;
        this.board[((move >>> 14) & 0b111111) + 1] =
          this.board[((move >>> 14) & 0b111111) + 3];
        this.board[((move >>> 14) & 0b111111) + 3] = 0;
        break;
      case moveTypes.CASTLE_QUEENSIDE:
        /**
         * these could be optimized, including the board[...] because the pieces are known
         */
        this.zobrist ^=
          this.#zeys[
            ((move >>> 14) & 0b111111) * 12 + ((move & 0b1111) - 2) // remove king
          ] ^
          this.#zeys[
            (((move >>> 14) & 0b111111) - 2) * 12 + ((move & 0b1111) - 2) // add king
          ] ^
          this.#zeys[
            (((move >>> 14) & 0b111111) - 4) * 12 +
              (this.board[((move >>> 14) & 0b111111) - 4] - 2) // remove rook
          ] ^
          this.#zeys[
            (((move >>> 14) & 0b111111) - 1) * 12 +
              (this.board[((move >>> 14) & 0b111111) - 4] - 2) // add rook
          ];

        this.board[(move >>> 14) & 0b111111] = 0;
        this.board[((move >>> 14) & 0b111111) - 2] = move & 0b1111;
        this.board[((move >>> 14) & 0b111111) - 1] =
          this.board[((move >>> 14) & 0b111111) - 4];
        this.board[((move >>> 14) & 0b111111) - 4] = 0;
        break;
      case moveTypes.EN_PASSANT_WHITE:
        history |= this.board[((move >>> 8) & 0b111111) + 8] << 20;

        this.zobrist ^=
          this.#zeys[
            (((move >>> 8) & 0b111111) + 8) * 12 +
              (this.board[((move >>> 8) & 0b111111) + 8] - 2) // remove captured piece
          ] ^
          this.#zeys[
            ((move >>> 8) & 0b111111) * 12 + ((move & 0b1111) - 2) // add moved piece (white pawn)
          ] ^
          this.#zeys[
            ((move >>> 14) & 0b111111) * 12 + ((move & 0b1111) - 2) // remove moved piece (white pawn)
          ];

        this.board[(move >>> 14) & 0b111111] = 0;
        this.board[(move >>> 8) & 0b111111] = move & 0b1111;
        this.board[((move >>> 8) & 0b111111) + 8] = 0;
        break;
      case moveTypes.EN_PASSANT_BLACK:
        history |= this.board[((move >>> 8) & 0b111111) - 8] << 20;

        this.zobrist ^=
          this.#zeys[
            (((move >>> 8) & 0b111111) - 8) * 12 +
              (this.board[((move >>> 8) & 0b111111) - 8] - 2) // remove captured piece
          ] ^
          this.#zeys[
            ((move >>> 8) & 0b111111) * 12 + ((move & 0b1111) - 2) // add moved piece (black pawn)
          ] ^
          this.#zeys[
            ((move >>> 14) & 0b111111) * 12 + ((move & 0b1111) - 2) // remove moved piece (black pawn)
          ];

        this.board[(move >>> 14) & 0b111111] = 0;
        this.board[(move >>> 8) & 0b111111] = move & 0b1111;
        this.board[((move >>> 8) & 0b111111) - 8] = 0; // captured space
        break;
      case moveTypes.PROMOTION_QUEEN_CAPTURE:
        history |= this.board[(move >>> 8) & 0b111111] << 20;

        this.zobrist ^=
          this.#zeys[
            ((move >>> 8) & 0b111111) * 12 +
              (this.board[(move >>> 8) & 0b111111] - 2) // remove captured piece
          ] ^
          this.#zeys[
            ((move >>> 8) & 0b111111) * 12 + (((move & 0b0001) | 0b1010) - 2) // add moved piece
          ] ^
          this.#zeys[
            ((move >>> 14) & 0b111111) * 12 + ((move & 0b1111) - 2) // remove moved piece
          ];

        this.board[(move >>> 14) & 0b111111] = 0;
        this.board[(move >>> 8) & 0b111111] = (move & 0b0001) | 0b1010;
        break;
      case moveTypes.PROMOTION_QUEEN:
        history |= this.board[(move >>> 8) & 0b111111] << 20;

        this.zobrist ^=
          this.#zeys[
            ((move >>> 8) & 0b111111) * 12 + (((move & 0b0001) | 0b1010) - 2) // add moved piece
          ] ^
          this.#zeys[
            ((move >>> 14) & 0b111111) * 12 + ((move & 0b1111) - 2) // remove moved piece
          ];

        this.board[(move >>> 14) & 0b111111] = 0;
        this.board[(move >>> 8) & 0b111111] = (move & 0b0001) | 0b1010;
        break;
      case moveTypes.PROMOTION_ROOK_CAPTURE:
        history |= this.board[(move >>> 8) & 0b111111] << 20;

        this.zobrist ^=
          this.#zeys[
            ((move >>> 8) & 0b111111) * 12 +
              (this.board[(move >>> 8) & 0b111111] - 2) // remove captured piece
          ] ^
          this.#zeys[
            ((move >>> 8) & 0b111111) * 12 + (((move & 0b0001) | 0b1000) - 2) // add moved piece (change)
          ] ^
          this.#zeys[
            ((move >>> 14) & 0b111111) * 12 + ((move & 0b1111) - 2) // remove moved piece
          ];

        this.board[(move >>> 14) & 0b111111] = 0;
        this.board[(move >>> 8) & 0b111111] = (move & 0b0001) | 0b1000;
        break;
      case moveTypes.PROMOTION_ROOK:
        history |= this.board[(move >>> 8) & 0b111111] << 20;

        this.zobrist ^=
          this.#zeys[
            ((move >>> 8) & 0b111111) * 12 + (((move & 0b0001) | 0b1000) - 2) // add moved piece (change)
          ] ^
          this.#zeys[
            ((move >>> 14) & 0b111111) * 12 + ((move & 0b1111) - 2) // remove moved piece
          ];

        this.board[(move >>> 14) & 0b111111] = 0;
        this.board[(move >>> 8) & 0b111111] = (move & 0b0001) | 0b1000;
        break;
      case moveTypes.PROMOTION_BISHOP_CAPTURE:
        history |= this.board[(move >>> 8) & 0b111111] << 20;

        this.zobrist ^=
          this.#zeys[
            ((move >>> 8) & 0b111111) * 12 +
              (this.board[(move >>> 8) & 0b111111] - 2) // remove captured piece
          ] ^
          this.#zeys[
            ((move >>> 8) & 0b111111) * 12 + (((move & 0b0001) | 0b0110) - 2) // add moved piece (change)
          ] ^
          this.#zeys[
            ((move >>> 14) & 0b111111) * 12 + ((move & 0b1111) - 2) // remove moved piece
          ];

        this.board[(move >>> 14) & 0b111111] = 0;
        this.board[(move >>> 8) & 0b111111] = (move & 0b0001) | 0b0110;
        break;
      case moveTypes.PROMOTION_BISHOP:
        history |= this.board[(move >>> 8) & 0b111111] << 20;

        this.zobrist ^=
          this.#zeys[
            ((move >>> 8) & 0b111111) * 12 + (((move & 0b0001) | 0b0110) - 2) // add moved piece (change)
          ] ^
          this.#zeys[
            ((move >>> 14) & 0b111111) * 12 + ((move & 0b1111) - 2) // remove moved piece
          ];

        this.board[(move >>> 14) & 0b111111] = 0;
        this.board[(move >>> 8) & 0b111111] = (move & 0b0001) | 0b0110;
        break;
      case moveTypes.PROMOTION_KNIGHT_CAPTURE:
        history |= this.board[(move >>> 8) & 0b111111] << 20;

        this.zobrist ^=
          this.#zeys[
            ((move >>> 8) & 0b111111) * 12 +
              (this.board[(move >>> 8) & 0b111111] - 2) // remove captured piece
          ] ^
          this.#zeys[
            ((move >>> 8) & 0b111111) * 12 + (((move & 0b0001) | 0b0100) - 2) // add moved piece (change)
          ] ^
          this.#zeys[
            ((move >>> 14) & 0b111111) * 12 + ((move & 0b1111) - 2) // remove moved piece
          ];

        this.board[(move >>> 14) & 0b111111] = 0;
        this.board[(move >>> 8) & 0b111111] = (move & 0b0001) | 0b0100;
        break;
      case moveTypes.PROMOTION_KNIGHT:
        history |= this.board[(move >>> 8) & 0b111111] << 20;

        this.zobrist ^=
          this.#zeys[
            ((move >>> 8) & 0b111111) * 12 + (((move & 0b0001) | 0b0100) - 2) // add moved piece (change)
          ] ^
          this.#zeys[
            ((move >>> 14) & 0b111111) * 12 + ((move & 0b1111) - 2) // remove moved piece
          ];

        this.board[(move >>> 14) & 0b111111] = 0;
        this.board[(move >>> 8) & 0b111111] = (move & 0b0001) | 0b0100;
        break;
      case moveTypes.DOUBLE_PAWN_PUSH:
        this.zobrist ^= this.#zeys[((move >>> 8) & 0b111) + 773];
      case moveTypes.MOVE:
        this.zobrist ^=
          this.#zeys[((move >>> 14) & 0b111111) * 12 + ((move & 0b1111) - 2)] ^
          this.#zeys[
            ((move >>> 8) & 0b111111) * 12 + ((move & 0b1111) - 2) // re-move
          ];

        this.board[(move >>> 14) & 0b111111] = 0;
        this.board[(move >>> 8) & 0b111111] = move & 0b1111;
        break;
      default:
        throw new Error("invalid move type: " + binaryToString(move));
    }

    // update zobrist hash if last move was double pawn push
    if (
      this.history[this.history.length - 1] &&
      ((this.history[this.history.length - 1] >>> 4) & 0b1111) ===
        moveTypes.DOUBLE_PAWN_PUSH
    )
      // return (this.history[this.history.length - 1] >>> 8) & 0b111;
      this.zobrist ^=
        this.#zeys[
          ((this.history[this.history.length - 1] >>> 8) & 0b111) + 773
        ];

    this.history.push(history | (move & 0b11111111111111111111)); // order independent
    this.turn ^= 1;
    this.#update(); // turn must be updated before calling update

    ////////////////////////////
    //     update zobrist     //
    ////////////////////////////

    this.zobrist ^= this.#zeys[768]; // flip turn

    let positionSeenCount = 1; // current position has, obviously, been seen once
    for (let i = this.zistory.length - 1; i >= 0; i--) {
      if (this.zistory[i] === this.zobrist) positionSeenCount++;

      if (positionSeenCount === 3) {
        this.draw = true;
        break;
      }
    }

    this.zistory.push(this.zobrist);
  }

  /**
   * Simulates a move without updating the board or member variables
   * @param move
   * @returns Whether the move is valid. A move is invalid when it will put the player in check.
   */
  simulateMove(move: number): boolean {
    // 32 bit number
    let board = [...this.board];

    switch ((move >>> 4) & 0b1111) {
      case moveTypes.CAPTURE:
        board[(move >>> 14) & 0b111111] = 0;
        board[(move >>> 8) & 0b111111] = move & 0b1111;
        break;
      case moveTypes.CASTLE_KINGSIDE: // todo: add zobrist
        board[(move >>> 14) & 0b111111] = 0;
        board[((move >>> 14) & 0b111111) + 2] = move & 0b1111;
        board[((move >>> 14) & 0b111111) + 1] =
          board[((move >>> 14) & 0b111111) + 3];
        board[((move >>> 14) & 0b111111) + 3] = 0;
        break;
      case moveTypes.CASTLE_QUEENSIDE: // todo: add zobrist
        board[(move >>> 14) & 0b111111] = 0;
        board[((move >>> 14) & 0b111111) - 2] = move & 0b1111;
        board[((move >>> 14) & 0b111111) - 1] =
          board[((move >>> 14) & 0b111111) - 4];
        board[((move >>> 14) & 0b111111) - 4] = 0;
        break;
      case moveTypes.EN_PASSANT_WHITE:
        board[(move >>> 14) & 0b111111] = 0;
        board[(move >>> 8) & 0b111111] = move & 0b1111;
        board[((move >>> 8) & 0b111111) + 8] = 0;
        break;
      case moveTypes.EN_PASSANT_BLACK:
        board[(move >>> 14) & 0b111111] = 0;
        board[(move >>> 8) & 0b111111] = move & 0b1111;
        board[((move >>> 8) & 0b111111) - 8] = 0; // captured space
        break;
      case moveTypes.PROMOTION_QUEEN_CAPTURE:
        board[(move >>> 14) & 0b111111] = 0;
        board[(move >>> 8) & 0b111111] = (move & 0b0001) | 0b1010;
        break;
      case moveTypes.PROMOTION_QUEEN:
        board[(move >>> 14) & 0b111111] = 0;
        board[(move >>> 8) & 0b111111] = (move & 0b0001) | 0b1010;
        break;
      case moveTypes.PROMOTION_ROOK_CAPTURE:
        board[(move >>> 14) & 0b111111] = 0;
        board[(move >>> 8) & 0b111111] = (move & 0b0001) | 0b1000;
        break;
      case moveTypes.PROMOTION_ROOK:
        board[(move >>> 14) & 0b111111] = 0;
        board[(move >>> 8) & 0b111111] = (move & 0b0001) | 0b1000;
        break;
      case moveTypes.PROMOTION_BISHOP_CAPTURE:
        board[(move >>> 14) & 0b111111] = 0;
        board[(move >>> 8) & 0b111111] = (move & 0b0001) | 0b0110;
        break;
      case moveTypes.PROMOTION_BISHOP:
        board[(move >>> 14) & 0b111111] = 0;
        board[(move >>> 8) & 0b111111] = (move & 0b0001) | 0b0110;
        break;
      case moveTypes.PROMOTION_KNIGHT_CAPTURE:
        board[(move >>> 14) & 0b111111] = 0;
        board[(move >>> 8) & 0b111111] = (move & 0b0001) | 0b0100;
        break;
      case moveTypes.PROMOTION_KNIGHT:
        board[(move >>> 14) & 0b111111] = 0;
        board[(move >>> 8) & 0b111111] = (move & 0b0001) | 0b0100;
        break;
      case moveTypes.DOUBLE_PAWN_PUSH:
      case moveTypes.MOVE:
        board[(move >>> 14) & 0b111111] = 0;
        board[(move >>> 8) & 0b111111] = move & 0b1111;
        break;
      default:
        throw new Error("invalid move type: " + binaryToString(move));
    }

    //////////////////////////
    //     update check     //
    //////////////////////////

    // check if past team is still in check
    for (let i = 0; i < boardSize; i++) {
      if (!board[i] || (board[i] & 0b1) === this.turn) continue; // saved ~170ms

      if (
        this.canCapturePiece(i, board, 0b1100 | this.turn) // enemy piece can capture turn's king
      )
        return false;
    }

    return true;
  }

  /**
   * Move validator used for debugging
   * @param moveToValidate The move to validate
   * @returns The associated move as a number
   */
  validateAndMoveObject(moveToValidate: {
    from: string;
    to: string;
    promotion?: string;
  }): number {
    let promotion: number;

    switch (moveToValidate.promotion) {
      case "q":
        promotion = 0b00;
        break;
      case "r":
        promotion = 0b11;
        break;
      case "b":
        promotion = 0b10;
        break;
      case "n":
        promotion = 0b01;
        break;
    }

    const move = this.getAvailableMoves(
      (8 - Number.parseInt(moveToValidate.from[1])) * 8 +
        (moveToValidate.from.charCodeAt(0) - 97)
    ).find(
      (m) =>
        ((m >>> 8) & 0b111111) ===
          (8 - Number.parseInt(moveToValidate.to[1])) * 8 +
            (moveToValidate.to.charCodeAt(0) - 97) &&
        (moveToValidate.promotion
          ? ((m >>> 6) & 0b11) === 0b10 || ((m >>> 6) & 0b11) === 0b11
            ? ((m >>> 4) & 0b11) === promotion
            : false
          : true)
    );

    if (!move)
      throw new Error("invalid move: " + JSON.stringify(moveToValidate));

    this.move(move);

    return move;
  }

  /**
   * Creates a printable string of the board
   * @returns The board as a string
   */
  ascii(): string {
    let s = "   ┏------------------------┓\n";
    for (let i = 0; i < boardSize; i++) {
      // display the rank
      if (!(i & 0b111)) {
        s += " " + "87654321"[(i >>> 3) & 0b111] + " |";
      }

      if (this.board[i]) {
        s += " " + numberToLetterString(this.board[i]) + " ";
      } else {
        s += " . ";
      }

      if ((i & 0b111) === 0b111) s += "|\n";
    }
    s += "   ┗------------------------┛\n";
    s += "     a  b  c  d  e  f  g  h";

    return s;
  }

  /**
   * Updates game state variables
   * @returns The game state
   */
  #update() {
    //////////////////////////
    //     update check     //
    //////////////////////////

    let checked = 0b00; // left bit is currentChecked, right bit is pastChecked

    // check if past team is still in check
    for (let i = 0; i < boardSize; i++) {
      if (!this.board[i]) continue; // saved ~170ms

      if (
        !(checked & 0b01) &&
        (this.board[i] & 0b1) === this.turn &&
        this.canCapturePiece(i, this.board, 0b1100 | (1 ^ this.turn))
      ) {
        // 0b110 is king value
        checked |= 0b01; // set pastChecked
      } else if (
        !(checked & 0b10) &&
        (this.board[i] & 0b1) !== this.turn &&
        this.canCapturePiece(i, this.board, 0b1100 | this.turn)
      ) {
        // check if current turn is in check
        // 0b110 is king value
        checked |= 0b10; // set currentChecked
      }

      if (checked === 0b11) break;
    }

    this.wc =
      (this.turn === WHITE ? (checked & 0b10) >>> 1 : checked & 0b01) === 1;
    this.bc =
      (this.turn === WHITE ? checked & 0b01 : (checked & 0b10) >>> 1) === 1;

    /////////////////////////////
    //     update castling     //
    /////////////////////////////

    if (this.wckc && (this.board[60] !== 0b1100 || this.board[63] !== 0b1000)) {
      this.wckc = false;
      this.zobrist ^= this.#zeys[769];
    }

    if (this.wcqc && (this.board[60] !== 0b1100 || this.board[56] !== 0b1000)) {
      this.wcqc = false;
      this.zobrist ^= this.#zeys[770];
    }

    if (this.bckc && (this.board[4] !== 0b1101 || this.board[7] !== 0b1001)) {
      this.bckc = false;
      this.zobrist ^= this.#zeys[771];
    }

    if (this.bcqc && (this.board[4] !== 0b1101 || this.board[0] !== 0b1001)) {
      this.bcqc = false;
      this.zobrist ^= this.#zeys[772];
    }

    /*
     * the below code relies on the fact that both teams cannot be checked at
     * the same time. additionally, we only need to check if the current team is
     * in checkmate. we do not need to check the previous team as they could not
     * make any moves that would result in check.
     */

    this.wcm = this.wc;
    this.bcm = this.bc;
    let sm = true;

    for (let i = 0; i < boardSize; i++) {
      if (!this.board[i] || (this.board[i] & 0b1) !== this.turn) continue;

      if (this.getAvailableMoves(i).length > 0) {
        if (this.turn === WHITE) this.wcm = false;
        if (this.turn === BLACK) this.bcm = false;
        sm = false;
        break;
      }
    }

    this.stalemate = !this.wcm && !this.bcm && sm;
  }

  /**
   * Checks if the game is over.
   * @returns Whether or not the game is over
   */
  isGameOver(): boolean {
    return this.wcm || this.bcm || this.stalemate || this.draw;
  }

  /**
   * Returns all available moves for the current turn
   * @returns An array of moves
   */
  moves(): number[] {
    if (this.isGameOver()) return [];

    let moves = [];

    for (let i = 0; i < boardSize; i++) {
      if (!this.board[i] || (this.board[i] & 0b1) !== this.turn) continue;

      moves.push(...this.getAvailableMoves(i));
    }

    return moves;
  }

  /**
   * Returns the current game state
   * @returns The game state
   */
  getState(): ChessterGameState {
    return {
      board: [...this.board],
      turn: this.turn,
      history: [...this.history],
      wc: this.wc,
      bc: this.bc,
      wcm: this.wcm,
      bcm: this.bcm,
      wckc: this.wckc,
      wcqc: this.wcqc,
      bckc: this.bckc,
      bcqc: this.bcqc,
      stalemate: this.stalemate,
      draw: this.draw,
      zistory: [...this.zistory],
      zobrist: this.zobrist,
    };
  }

  /**
   * Returns all potential moves for the location
   * @param location The location of the piece
   * @returns An array of moves
   */
  getAllMoves(location: number): number[] {
    switch ((this.board[location] >>> 1) & 0b111) {
      case 0b001:
        return this.getPawnMoves(location);
      case 0b010:
        return this.getKnightMoves(location);
      case 0b011:
        return this.getBishopMoves(location);
      case 0b100:
        return this.getRookMoves(location);
      case 0b101:
        return this.getQueenMoves(location);
      case 0b110:
        return this.getKingMoves(location);
      default:
        return [];
    }
  }

  /**
   * Returns whether location can capture specified piece
   * @param location The location of the piece
   * @param board The board to check
   * @param target The piece to capture (4 bit number)
   * @returns An array of captures
   */
  canCapturePiece(
    location: number,
    board: ChessterBoard,
    target: number
  ): boolean {
    switch ((board[location] >>> 1) & 0b111) {
      case 0b001:
        return this.canPawnCapture(location, board, target);
      case 0b010:
        return this.canKnightCapture(location, board, target);
      case 0b011:
        return this.canBishopCapture(location, board, target);
      case 0b100:
        return this.canRookCapture(location, board, target);
      case 0b101:
        return this.canQueenCapture(location, board, target);
      case 0b110:
        return this.canKingCapture(location, board, target);
      default:
        throw new Error(
          "invalid piece: " + numberToPieceString(board[location])
        );
    }
  }

  /**
   * Returns available moves for the given location
   * @returns An array of moves
   */
  getAvailableMoves(location: number): number[] {
    const moves = this.getAllMoves(location);

    const finalMoves = [];
    // const team = this.board[location] & 0b1;

    for (let i = 0; i < moves.length; i++) {
      if (
        !this.simulateMove(moves[i]) ||
        (((moves[i] >>> 4) & 0b1111) === moveTypes.CASTLE_KINGSIDE &&
          !this.simulateMove(
            (moves[i] & 0b11111100000000001111) |
              (((moves[i] >>> 14) + 1) << 8) |
              (moveTypes.MOVE << 4)
          )) ||
        (((moves[i] >>> 4) & 0b1111) === moveTypes.CASTLE_QUEENSIDE &&
          !this.simulateMove(
            (moves[i] & 0b11111100000000001111) |
              (((moves[i] >>> 14) - 1) << 8) |
              (moveTypes.MOVE << 4)
          ))
      )
        continue;

      finalMoves.push(moves[i]);
    }

    return finalMoves;
  }

  getKingMoves(location: number): number[] {
    const moves: number[] = [];

    // bottom row (if not bottom row)
    if ((location & 0b111000) !== 0b111000) {
      // if location contains enemy piece
      if (!this.board[location + 8]) {
        moves.push(
          (location << 14) |
            ((location + 8) << 8) |
            (moveTypes.MOVE << 4) |
            this.board[location]
        );
      } else if (
        (this.board[location + 8] & 0b1) !==
        (this.board[location] & 0b1)
      ) {
        moves.push(
          (location << 14) |
            ((location + 8) << 8) |
            (moveTypes.CAPTURE << 4) |
            this.board[location]
        );
      }
      // else location contains friendly piece, do not push any move
    }

    // top row
    if (location & 0b111000) {
      // if location contains enemy piece
      if (!this.board[location - 8]) {
        moves.push(
          (location << 14) |
            ((location - 8) << 8) |
            (moveTypes.MOVE << 4) |
            this.board[location]
        );
      } else if (
        (this.board[location - 8] & 0b1) !==
        (this.board[location] & 0b1)
      ) {
        moves.push(
          (location << 14) |
            ((location - 8) << 8) |
            (moveTypes.CAPTURE << 4) |
            this.board[location]
        );
      }
      // else location contains friendly piece, do not push any move
    }

    // right-most column
    if ((location & 0b111) !== 0b111) {
      if (!this.board[location + 1]) {
        moves.push(
          (location << 14) |
            ((location + 1) << 8) |
            (moveTypes.MOVE << 4) |
            this.board[location]
        );
      } else if (
        (this.board[location + 1] & 0b1) !==
        (this.board[location] & 0b1)
      ) {
        moves.push(
          (location << 14) |
            ((location + 1) << 8) |
            (moveTypes.CAPTURE << 4) |
            this.board[location]
        );
      }

      // bottom row
      if ((location & 0b111000) !== 0b111000) {
        // alternatively could do < 56
        if (!this.board[location + 9]) {
          moves.push(
            (location << 14) |
              ((location + 9) << 8) |
              (moveTypes.MOVE << 4) |
              this.board[location]
          );
        } else if (
          (this.board[location + 9] & 0b1) !==
          (this.board[location] & 0b1)
        ) {
          moves.push(
            (location << 14) |
              ((location + 9) << 8) |
              (moveTypes.CAPTURE << 4) |
              this.board[location]
          );
        }
      }

      // top row
      if (location & 0b111000) {
        // moves.push(-7);
        if (!this.board[location - 7]) {
          moves.push(
            (location << 14) |
              ((location - 7) << 8) |
              (moveTypes.MOVE << 4) |
              this.board[location]
          );
        } else if (
          (this.board[location - 7] & 0b1) !==
          (this.board[location] & 0b1)
        ) {
          moves.push(
            (location << 14) |
              ((location - 7) << 8) |
              (moveTypes.CAPTURE << 4) |
              this.board[location]
          );
        }
      }
    }

    if (location & 0b111) {
      // left-most column
      // moves.push(-1);
      if (!this.board[location - 1]) {
        moves.push(
          (location << 14) |
            ((location - 1) << 8) |
            (moveTypes.MOVE << 4) |
            this.board[location]
        );
      } else if (
        (this.board[location - 1] & 0b1) !==
        (this.board[location] & 0b1)
      ) {
        moves.push(
          (location << 14) |
            ((location - 1) << 8) |
            (moveTypes.CAPTURE << 4) |
            this.board[location]
        );
      }

      // top row
      if (location & 0b111000) {
        // moves.push(-9);
        if (!this.board[location - 9]) {
          moves.push(
            (location << 14) |
              ((location - 9) << 8) |
              (moveTypes.MOVE << 4) |
              this.board[location]
          );
        } else if (
          (this.board[location - 9] & 0b1) !==
          (this.board[location] & 0b1)
        ) {
          moves.push(
            (location << 14) |
              ((location - 9) << 8) |
              (moveTypes.CAPTURE << 4) |
              this.board[location]
          );
        }
      }

      // bottom row
      if ((location & 0b111000) !== 0b111000) {
        // moves.push(7);
        if (!this.board[location + 7]) {
          moves.push(
            (location << 14) |
              ((location + 7) << 8) |
              (moveTypes.MOVE << 4) |
              this.board[location]
          );
        } else if (
          (this.board[location + 7] & 0b1) !==
          (this.board[location] & 0b1)
        ) {
          moves.push(
            (location << 14) |
              ((location + 7) << 8) |
              (moveTypes.CAPTURE << 4) |
              this.board[location]
          );
        }
      }
    }

    // castling
    if (!(this.board[location] & 0b1) && !this.wc) {
      // white king-side
      if (this.wckc && !this.board[location + 1] && !this.board[location + 2])
        moves.push(
          (location << 14) |
            ((location + 2) << 8) |
            (moveTypes.CASTLE_KINGSIDE << 4) |
            this.board[location]
          // (location << 14) | (moveTypes.CASTLE_KINGSIDE << 4) | piece
        );

      // white queen-side
      if (
        this.wcqc &&
        !this.board[location - 1] &&
        !this.board[location - 2] &&
        !this.board[location - 3]
      )
        moves.push(
          (location << 14) |
            ((location - 2) << 8) |
            (moveTypes.CASTLE_QUEENSIDE << 4) |
            this.board[location]
          // (location << 14) | (moveTypes.CASTLE_QUEENSIDE << 4) | piece
        );
    }

    if ((this.board[location] & 0b1) === 1 && this.bc === false) {
      // black king-side
      if (this.bckc && !this.board[location + 1] && !this.board[location + 2])
        moves.push(
          (location << 14) |
            ((location + 2) << 8) |
            (moveTypes.CASTLE_KINGSIDE << 4) |
            this.board[location]
          // (location << 14) | (moveTypes.CASTLE_KINGSIDE << 4) | piece
        );

      // black queen-side
      if (
        this.bcqc &&
        !this.board[location - 1] &&
        !this.board[location - 2] &&
        !this.board[location - 3]
      )
        moves.push(
          (location << 14) |
            ((location - 2) << 8) |
            (moveTypes.CASTLE_QUEENSIDE << 4) |
            this.board[location]
          // (location << 14) | (moveTypes.CASTLE_QUEENSIDE << 4) | piece
        );
    }

    return moves;
  }

  canKingCapture(
    location: number,
    board: ChessterBoard,
    target: number
  ): boolean {
    // bottom row (if not bottom row)
    if ((location & 0b111000) !== 0b111000 && board[location + 8] === target) {
      return true;
    }

    // top row
    if (location & 0b111000 && board[location - 8] === target) {
      return true;
    }

    // right-most column
    if ((location & 0b111) !== 0b111) {
      if (board[location + 1] === target) {
        return true;
      }

      // bottom row
      if (
        (location & 0b111000) !== 0b111000 &&
        board[location + 9] === target
      ) {
        return true;
      }

      // top row
      if (location & 0b111000 && board[location - 7] === target) {
        return true;
      }
    }

    if (location & 0b111) {
      // left-most column
      if (board[location - 1] === target) {
        return true;
      }

      // top row
      if (location & 0b111000 && board[location - 9] === target) {
        return true;
      }

      // bottom row
      if (
        (location & 0b111000) !== 0b111000 &&
        board[location + 7] === target
      ) {
        return true;
      }
    }

    return false;
  }

  getKnightMoves(location: number): number[] {
    const moves: number[] = [];

    if (location < 48) {
      if ((location & 0b111) !== 0b111)
        if (!this.board[location + 17]) {
          // can do 2 down 1 right
          moves.push(
            (location << 14) |
              ((location + 17) << 8) |
              (moveTypes.MOVE << 4) |
              this.board[location]
          );
        } else if (
          (this.board[location + 17] & 0b1) !==
          (this.board[location] & 0b1)
        ) {
          moves.push(
            (location << 14) |
              ((location + 17) << 8) |
              (moveTypes.CAPTURE << 4) |
              this.board[location]
          );
        }

      if (location & 0b111)
        if (!this.board[location + 15]) {
          moves.push(
            (location << 14) |
              ((location + 15) << 8) |
              (moveTypes.MOVE << 4) |
              this.board[location]
          );
        } else if (
          (this.board[location + 15] & 0b1) !==
          (this.board[location] & 0b1)
        ) {
          moves.push(
            (location << 14) |
              ((location + 15) << 8) |
              (moveTypes.CAPTURE << 4) |
              this.board[location]
          );
        }
    }

    if (location > 15) {
      if ((location & 0b111) !== 0b111)
        if (!this.board[location - 15]) {
          moves.push(
            (location << 14) |
              ((location - 15) << 8) |
              (moveTypes.MOVE << 4) |
              this.board[location]
          );
        } else if (
          (this.board[location - 15] & 0b1) !==
          (this.board[location] & 0b1)
        ) {
          moves.push(
            (location << 14) |
              ((location - 15) << 8) |
              (moveTypes.CAPTURE << 4) |
              this.board[location]
          );
        }

      if (location & 0b111)
        if (!this.board[location - 17]) {
          moves.push(
            (location << 14) |
              ((location - 17) << 8) |
              (moveTypes.MOVE << 4) |
              this.board[location]
          );
        } else if (
          (this.board[location - 17] & 0b1) !==
          (this.board[location] & 0b1)
        ) {
          moves.push(
            (location << 14) |
              ((location - 17) << 8) |
              (moveTypes.CAPTURE << 4) |
              this.board[location]
          );
        }
    }

    if ((location & 0b111) > 1) {
      if (location < 56) {
        if (!this.board[location + 6]) {
          moves.push(
            (location << 14) |
              ((location + 6) << 8) |
              (moveTypes.MOVE << 4) |
              this.board[location]
          );
        } else if (
          (this.board[location + 6] & 0b1) !==
          (this.board[location] & 0b1)
        ) {
          moves.push(
            (location << 14) |
              ((location + 6) << 8) |
              (moveTypes.CAPTURE << 4) |
              this.board[location]
          );
        }
      }

      if (location > 7) {
        if (!this.board[location - 10]) {
          moves.push(
            (location << 14) |
              ((location - 10) << 8) |
              (moveTypes.MOVE << 4) |
              this.board[location]
          );
        } else if (
          (this.board[location - 10] & 0b1) !==
          (this.board[location] & 0b1)
        ) {
          moves.push(
            (location << 14) |
              ((location - 10) << 8) |
              (moveTypes.CAPTURE << 4) |
              this.board[location]
          );
        }
      }
    }

    if ((location & 0b111) < 6) {
      if (location < 56) {
        if (!this.board[location + 10]) {
          moves.push(
            (location << 14) |
              ((location + 10) << 8) |
              (moveTypes.MOVE << 4) |
              this.board[location]
          );
        } else if (
          (this.board[location + 10] & 0b1) !==
          (this.board[location] & 0b1)
        ) {
          moves.push(
            (location << 14) |
              ((location + 10) << 8) |
              (moveTypes.CAPTURE << 4) |
              this.board[location]
          );
        }
      }

      if (location > 7) {
        if (!this.board[location - 6]) {
          moves.push(
            (location << 14) |
              ((location - 6) << 8) |
              (moveTypes.MOVE << 4) |
              this.board[location]
          );
        } else if (
          (this.board[location - 6] & 0b1) !==
          (this.board[location] & 0b1)
        ) {
          moves.push(
            (location << 14) |
              ((location - 6) << 8) |
              (moveTypes.CAPTURE << 4) |
              this.board[location]
          );
        }
      }
    }

    return moves;
  }

  canKnightCapture(
    location: number,
    board: ChessterBoard,
    target: number
  ): boolean {
    if (location < 48) {
      if ((location & 0b111) !== 0b111 && board[location + 17] === target) {
        return true;
      }

      if (location & 0b111 && board[location + 15] === target) {
        return true;
      }
    }

    if (location > 15) {
      if ((location & 0b111) !== 0b111 && board[location - 15] === target) {
        return true;
      }

      if (location & 0b111 && board[location - 17] === target) {
        return true;
      }
    }

    if ((location & 0b111) > 1) {
      if (location < 56 && board[location + 6] === target) {
        return true;
      }

      if (location > 7 && board[location - 10] === target) {
        return true;
      }
    }

    if ((location & 0b111) < 6) {
      if (location < 56 && board[location + 10] === target) {
        return true;
      }

      if (location > 7 && board[location - 6] === target) {
        return true;
      }
    }

    return false;
  }

  getBishopMoves(location: number): number[] {
    const moves: number[] = [];

    // down right
    for (
      let i = 1;
      ((location + 9 * i) & 0b111) > 0 && location + 9 * i < 64;
      i++
    ) {
      if (!this.board[location + 9 * i]) {
        moves.push(
          (location << 14) |
            ((location + 9 * i) << 8) |
            (moveTypes.MOVE << 4) |
            this.board[location]
        );
      } else if (
        (this.board[location + 9 * i] & 0b1) !==
        (this.board[location] & 0b1)
      ) {
        moves.push(
          (location << 14) |
            ((location + 9 * i) << 8) |
            (moveTypes.CAPTURE << 4) |
            this.board[location]
        );
        break;
      } else {
        break;
      }
    }

    // up right
    for (let i = 1; (location - 7 * i) & 0b111 && location - 7 * i > 0; i++) {
      if (!this.board[location - 7 * i]) {
        moves.push(
          (location << 14) |
            ((location - 7 * i) << 8) |
            (moveTypes.MOVE << 4) |
            this.board[location]
        );
      } else if (
        (this.board[location - 7 * i] & 0b1) !==
        (this.board[location] & 0b1)
      ) {
        moves.push(
          (location << 14) |
            ((location - 7 * i) << 8) |
            (moveTypes.CAPTURE << 4) |
            this.board[location]
        );
        break;
      } else {
        break;
      }
    }

    // down left
    for (
      let i = 1;
      ((location + 7 * i) & 0b111) < 7 && location + 7 * i < 64;
      i++
    ) {
      if (!this.board[location + 7 * i]) {
        moves.push(
          (location << 14) |
            ((location + 7 * i) << 8) |
            (moveTypes.MOVE << 4) |
            this.board[location]
        );
      } else if (
        (this.board[location + 7 * i] & 0b1) !==
        (this.board[location] & 0b1)
      ) {
        moves.push(
          (location << 14) |
            ((location + 7 * i) << 8) |
            (moveTypes.CAPTURE << 4) |
            this.board[location]
        );
        break;
      } else {
        // friendly piece
        break;
      }
    }

    // up left
    for (
      let i = 1;
      ((location - 9 * i) & 0b111) < 7 && location - 9 * i >= 0;
      i++
    ) {
      if (!this.board[location - 9 * i]) {
        moves.push(
          (location << 14) |
            ((location - 9 * i) << 8) |
            (moveTypes.MOVE << 4) |
            this.board[location]
        );
      } else if (
        (this.board[location - 9 * i] & 0b1) !==
        (this.board[location] & 0b1)
      ) {
        moves.push(
          (location << 14) |
            ((location - 9 * i) << 8) |
            (moveTypes.CAPTURE << 4) |
            this.board[location]
        );
        break;
      } else {
        break;
      }
    }

    return moves;
  }

  canBishopCapture(
    location: number,
    board: ChessterBoard,
    target: number
  ): boolean {
    // down right
    for (
      let i = 1;
      ((location + 9 * i) & 0b111) > 0 && location + 9 * i < 64;
      i++
    ) {
      if (!board[location + 9 * i]) continue;

      if (board[location + 9 * i] === target) {
        return true;
      }

      break;
    }

    // up right
    for (let i = 1; (location - 7 * i) & 0b111 && location - 7 * i > 0; i++) {
      if (!board[location - 7 * i]) continue;

      if (board[location - 7 * i] === target) {
        return true;
      }

      break;
    }

    // down left
    for (
      let i = 1;
      ((location + 7 * i) & 0b111) < 7 && location + 7 * i < 64;
      i++
    ) {
      if (!board[location + 7 * i]) continue;

      if (board[location + 7 * i] === target) {
        return true;
      }

      break;
    }

    // up left
    for (
      let i = 1;
      ((location - 9 * i) & 0b111) < 7 && location - 9 * i >= 0;
      i++
    ) {
      if (!board[location - 9 * i]) continue;

      if (board[location - 9 * i] === target) {
        return true;
      }

      break;
    }

    return false;
  }

  getRookMoves(location: number): number[] {
    const moves: number[] = [];

    // right
    for (let i = 1; i < 8 - (location & 0b111); i++) {
      if (!this.board[location + i]) {
        moves.push(
          (location << 14) |
            ((location + i) << 8) |
            (moveTypes.MOVE << 4) |
            this.board[location]
        );
      } else if (
        (this.board[location + i] & 0b1) !==
        (this.board[location] & 0b1)
      ) {
        moves.push(
          (location << 14) |
            ((location + i) << 8) |
            (moveTypes.CAPTURE << 4) |
            this.board[location]
        );
        break;
      } else {
        break;
      }
    }

    // left
    for (let i = 1; i < (location & 0b111) + 1; i++) {
      if (!this.board[location - i]) {
        moves.push(
          (location << 14) |
            ((location - i) << 8) |
            (moveTypes.MOVE << 4) |
            this.board[location]
        );
      } else if (
        (this.board[location - i] & 0b1) !==
        (this.board[location] & 0b1)
      ) {
        moves.push(
          (location << 14) |
            ((location - i) << 8) |
            (moveTypes.CAPTURE << 4) |
            this.board[location]
        );
        break;
      } else {
        break;
      }
    }

    // down
    for (let i = 1; location + 8 * i < 64; i++) {
      if (!this.board[location + 8 * i]) {
        moves.push(
          (location << 14) |
            ((location + 8 * i) << 8) |
            (moveTypes.MOVE << 4) |
            this.board[location]
        );
      } else if (
        (this.board[location + 8 * i] & 0b1) !==
        (this.board[location] & 0b1)
      ) {
        moves.push(
          (location << 14) |
            ((location + 8 * i) << 8) |
            (moveTypes.CAPTURE << 4) |
            this.board[location]
        );
        break;
      } else {
        break;
      }
    }

    // up
    for (let i = 1; location - 8 * i >= 0; i++) {
      if (!this.board[location - 8 * i]) {
        moves.push(
          (location << 14) |
            ((location - 8 * i) << 8) |
            (moveTypes.MOVE << 4) |
            this.board[location]
        );
      } else if (
        (this.board[location - 8 * i] & 0b1) !==
        (this.board[location] & 0b1)
      ) {
        moves.push(
          (location << 14) |
            ((location - 8 * i) << 8) |
            (moveTypes.CAPTURE << 4) |
            this.board[location]
        );
        break;
      } else {
        break;
      }
    }

    return moves;
  }

  canRookCapture(
    location: number,
    board: ChessterBoard,
    target: number
  ): boolean {
    // right
    for (let i = 1; i < 8 - (location & 0b111); i++) {
      if (!board[location + i]) continue;

      if (board[location + i] === target) {
        return true;
      }

      break;
    }

    // left
    for (let i = 1; i < (location & 0b111) + 1; i++) {
      if (!board[location - i]) continue;

      if (board[location - i] === target) {
        return true;
      }

      break;
    }

    // down
    for (let i = 1; location + 8 * i < 64; i++) {
      if (!board[location + 8 * i]) continue;

      if (board[location + 8 * i] === target) {
        return true;
      }

      break;
    }

    // up
    for (let i = 1; location - 8 * i >= 0; i++) {
      if (!board[location - 8 * i]) continue;

      if (board[location - 8 * i] === target) {
        return true;
      }

      break;
    }

    return false;
  }

  getQueenMoves(location: number): number[] {
    return [...this.getBishopMoves(location), ...this.getRookMoves(location)];
  }

  canQueenCapture(
    location: number,
    board: ChessterBoard,
    target: number
  ): boolean {
    return (
      this.canBishopCapture(location, board, target) ||
      this.canRookCapture(location, board, target)
    );
  }

  getPawnMoves(location: number): number[] {
    const moves: number[] = [];

    // white piece
    if (this.board[location] & 0b1) {
      // black piece
      if (!this.board[location + 8]) {
        // promotion
        if (location >>> 3 === 6) {
          moves.push(
            (location << 14) |
              ((location + 8) << 8) |
              (moveTypes.PROMOTION_QUEEN << 4) |
              this.board[location],
            (location << 14) |
              ((location + 8) << 8) |
              (moveTypes.PROMOTION_ROOK << 4) |
              this.board[location],
            (location << 14) |
              ((location + 8) << 8) |
              (moveTypes.PROMOTION_BISHOP << 4) |
              this.board[location],
            (location << 14) |
              ((location + 8) << 8) |
              (moveTypes.PROMOTION_KNIGHT << 4) |
              this.board[location]
          );
        } else {
          moves.push(
            (location << 14) |
              ((location + 8) << 8) |
              (moveTypes.MOVE << 4) |
              this.board[location]
          );

          if (location >>> 3 === 1 && !this.board[location + 16]) {
            // double move
            moves.push(
              (location << 14) |
                ((location + 16) << 8) |
                (moveTypes.DOUBLE_PAWN_PUSH << 4) |
                this.board[location]
            );
          }
        }
      }

      // upper left capture
      if (
        (location & 0b111) !== 7 && // or < 7
        this.board[location + 9] &&
        !(this.board[location + 9] & 0b1)
      ) {
        if ((location + 9) >>> 3 === 7) {
          moves.push(
            (location << 14) |
              ((location + 9) << 8) |
              (moveTypes.PROMOTION_QUEEN_CAPTURE << 4) |
              this.board[location],
            (location << 14) |
              ((location + 9) << 8) |
              (moveTypes.PROMOTION_ROOK_CAPTURE << 4) |
              this.board[location],
            (location << 14) |
              ((location + 9) << 8) |
              (moveTypes.PROMOTION_BISHOP_CAPTURE << 4) |
              this.board[location],
            (location << 14) |
              ((location + 9) << 8) |
              (moveTypes.PROMOTION_KNIGHT_CAPTURE << 4) |
              this.board[location]
          );
        } else {
          moves.push(
            (location << 14) |
              ((location + 9) << 8) |
              (moveTypes.CAPTURE << 4) |
              this.board[location]
          );
        }
      }

      // upper right capture
      if (
        location & 0b111 &&
        this.board[location + 7] &&
        !(this.board[location + 7] & 0b1)
      )
        if ((location + 7) >>> 3 === 7) {
          moves.push(
            (location << 14) |
              ((location + 7) << 8) |
              (moveTypes.PROMOTION_QUEEN_CAPTURE << 4) |
              this.board[location],
            (location << 14) |
              ((location + 7) << 8) |
              (moveTypes.PROMOTION_ROOK_CAPTURE << 4) |
              this.board[location],
            (location << 14) |
              ((location + 7) << 8) |
              (moveTypes.PROMOTION_BISHOP_CAPTURE << 4) |
              this.board[location],
            (location << 14) |
              ((location + 7) << 8) |
              (moveTypes.PROMOTION_KNIGHT_CAPTURE << 4) |
              this.board[location]
          );
        } else {
          moves.push(
            (location << 14) |
              ((location + 7) << 8) |
              (moveTypes.CAPTURE << 4) |
              this.board[location]
          );
        }

      // en passant
      if (
        (((location >>> 3) & 0b111) === 0b100 &&
          this.history[this.history.length - 1] &&
          (this.history[this.history.length - 1] >>> 4) & 0b1111) ===
          moveTypes.DOUBLE_PAWN_PUSH &&
        (((this.history[this.history.length - 1] >>> 8) & 0b111111) -
          location ===
          1 ||
          ((this.history[this.history.length - 1] >>> 8) & 0b111111) -
            location ===
            -1)
      ) {
        moves.push(
          (location << 14) |
            ((((this.history[this.history.length - 1] >>> 8) & 0b111111) + 8) <<
              8) |
            (moveTypes.EN_PASSANT_BLACK << 4) |
            this.board[location]
        );
      }
    } else {
      // promotion

      // up
      if (!this.board[location - 8]) {
        if (!((location - 8) >>> 3)) {
          // this piece can only do promotion
          moves.push(
            (location << 14) |
              ((location - 8) << 8) |
              (moveTypes.PROMOTION_QUEEN << 4) |
              this.board[location],
            (location << 14) |
              ((location - 8) << 8) |
              (moveTypes.PROMOTION_ROOK << 4) |
              this.board[location],
            (location << 14) |
              ((location - 8) << 8) |
              (moveTypes.PROMOTION_BISHOP << 4) |
              this.board[location],
            (location << 14) |
              ((location - 8) << 8) |
              (moveTypes.PROMOTION_KNIGHT << 4) |
              this.board[location]
          );
        } else {
          moves.push(
            (location << 14) |
              ((location - 8) << 8) |
              (moveTypes.MOVE << 4) |
              this.board[location]
          );

          if (location >>> 3 === 6 && !this.board[location - 16]) {
            // double move
            moves.push(
              (location << 14) |
                ((location - 16) << 8) |
                (moveTypes.DOUBLE_PAWN_PUSH << 4) |
                this.board[location]
            );
          }
        }
      }

      // upper left capture
      if (location & 0b111 && (this.board[location - 9] & 0b1) === 1) {
        if (!((location - 9) >>> 3)) {
          moves.push(
            (location << 14) |
              ((location - 9) << 8) |
              (moveTypes.PROMOTION_QUEEN_CAPTURE << 4) |
              this.board[location],
            (location << 14) |
              ((location - 9) << 8) |
              (moveTypes.PROMOTION_ROOK_CAPTURE << 4) |
              this.board[location],
            (location << 14) |
              ((location - 9) << 8) |
              (moveTypes.PROMOTION_BISHOP_CAPTURE << 4) |
              this.board[location],
            (location << 14) |
              ((location - 9) << 8) |
              (moveTypes.PROMOTION_KNIGHT_CAPTURE << 4) |
              this.board[location]
          );
        } else {
          moves.push(
            (location << 14) |
              ((location - 9) << 8) |
              (moveTypes.CAPTURE << 4) |
              this.board[location]
          );
        }
      }

      // upper right capture
      if ((location & 0b111) !== 7 && (this.board[location - 7] & 0b1) === 1) {
        if (!((location - 7) >>> 3)) {
          moves.push(
            (location << 14) |
              ((location - 7) << 8) |
              (moveTypes.PROMOTION_QUEEN_CAPTURE << 4) |
              this.board[location],
            (location << 14) |
              ((location - 7) << 8) |
              (moveTypes.PROMOTION_ROOK_CAPTURE << 4) |
              this.board[location],
            (location << 14) |
              ((location - 7) << 8) |
              (moveTypes.PROMOTION_BISHOP_CAPTURE << 4) |
              this.board[location],
            (location << 14) |
              ((location - 7) << 8) |
              (moveTypes.PROMOTION_KNIGHT_CAPTURE << 4) |
              this.board[location]
          );
        } else {
          moves.push(
            (location << 14) |
              ((location - 7) << 8) |
              (moveTypes.CAPTURE << 4) |
              this.board[location]
          );
        }
      }

      // en passant
      if (
        ((location >>> 3) & 0b111) === 0b011 &&
        this.history[this.history.length - 1] &&
        ((this.history[this.history.length - 1] >>> 4) & 0b1111) ===
          moveTypes.DOUBLE_PAWN_PUSH &&
        (((this.history[this.history.length - 1] >>> 8) & 0b111111) -
          location ===
          1 ||
          ((this.history[this.history.length - 1] >>> 8) & 0b111111) -
            location ===
            -1)
      ) {
        moves.push(
          (location << 14) |
            ((((this.history[this.history.length - 1] >>> 8) & 0b111111) - 8) <<
              8) |
            (moveTypes.EN_PASSANT_WHITE << 4) |
            this.board[location]
        );
      }
    }

    return moves;
  }

  canPawnCapture(location: number, board: ChessterBoard, target): boolean {
    // white piece
    if (board[location] & 0b1) {
      // black piece

      // upper left capture
      if (
        (location & 0b111) !== 7 && // or < 7
        board[location + 9] === target
      ) {
        return true;
      }

      // upper right capture
      if (location & 0b111 && board[location + 7] === target) {
        return true;
      }
    } else {
      // promotion

      // upper left capture
      if (location & 0b111 && board[location - 9] === target) {
        return true;
      }

      // upper right capture
      if ((location & 0b111) !== 7 && board[location - 7] === target) {
        return true;
      }
    }

    return false;
  }
}
