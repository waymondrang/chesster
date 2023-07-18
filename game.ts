import {
  BLACK,
  ChessterGameState,
  ChessterHistory,
  ChessterMove,
  ChessterTeam,
  RecursivePartial,
  WHITE,
  boardSize,
  defaultBoard,
  moveTypes,
} from "./types";
import {
  binaryToString,
  numberToLetterString,
  numberToPieceString,
} from "./util";

export class ChessterGame {
  board: number[]; // board is 64 bytes
  wc: boolean; // white check
  bc: boolean; // black check
  wcm: boolean; // white checkmate
  bcm: boolean; // black checkmate
  wckc: boolean; // white can castle kingside
  bckc: boolean; // black can castle kingside
  wcqc: boolean; // white can castle queenside
  bcqc: boolean; // black can castle queenside
  sm: boolean; // stalemate
  simulation: boolean;
  turn: 1 | 0; // false is white, true is black
  history: ChessterHistory;
  #zobristKeys: bigint[];
  zobrist: bigint;

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
    this.simulation = state?.simulation ?? false;

    this.wc = state?.wc ?? false; // white check
    this.bc = state?.bc ?? false; // black check
    this.wcm = state?.wcm ?? false; // white checkmate
    this.bcm = state?.bcm ?? false; // black checkmate

    this.wckc = state?.wckc ?? true; // white can castle kingside
    this.wcqc = state?.wcqc ?? true; // white can castle queenside
    this.bckc = state?.bckc ?? true; // black can castle kingside
    this.bcqc = state?.bcqc ?? true; // black can castle queenside

    this.sm = state?.sm ?? false; // stalemate

    ///////////////////////////////////
    //     generate zobrist keys     //
    ///////////////////////////////////

    this.#zobristKeys = [8746989176631517180n];

    for (let i = 1; i < 780; i++) {
      this.#zobristKeys.push(
        this.#LinearCongruentialGenerator(this.#zobristKeys[i - 1])
      );
    }

    //////////////////////////////////////
    //     generate initial zobrist     //
    //////////////////////////////////////

    this.zobrist = 0n;

    for (let i = 0; i < boardSize; i++)
      if (this.board[i])
        this.zobrist ^= this.#zobristKeys[i * 12 + (this.board[i] - 1)];

    if (this.turn === BLACK) this.zobrist ^= this.#zobristKeys[768];

    // if (this.wckc) this.zobrist ^= this.#zobristKeys[769];
    // if (this.wcqc) this.zobrist ^= this.#zobristKeys[770];
    // if (this.bckc) this.zobrist ^= this.#zobristKeys[771];
    // if (this.bcqc) this.zobrist ^= this.#zobristKeys[772];

    // todo: add en passant

    console.log(this.zobrist);

    ////////////////////////////
    //     update on init     //
    ////////////////////////////

    this.update();
  }

  /**
   * Generates a random 64-bit integer
   * @param seed The seed to use for the random number generator
   * @returns A random 64-bit integer
   */
  #LinearCongruentialGenerator(seed: bigint): bigint {
    return (2862933555777941757n * seed + 3037000493n) % 18446744073709551616n;
  }

  /**
   * Takes back the last move
   */
  undo() {
    if (this.history.length > 0) {
      const move = this.history.pop();
      if (move) {
        this.turn ^= 1;
        this.sm = false; // update stalemate
        this.bcqc = ((move >>> 31) & 0b1) === 1;
        this.wcqc = ((move >>> 30) & 0b1) === 1;
        this.bckc = ((move >>> 29) & 0b1) === 1;
        this.wckc = ((move >>> 28) & 0b1) === 1;
        this.bcm = ((move >>> 27) & 0b1) === 1;
        this.wcm = ((move >>> 26) & 0b1) === 1;
        this.bc = ((move >>> 25) & 0b1) === 1;
        this.wc = ((move >>> 24) & 0b1) === 1;

        switch ((move >>> 4) & 0b1111) {
          case moveTypes.PROMOTION_BISHOP_CAPTURE:
          case moveTypes.PROMOTION_ROOK_CAPTURE:
          case moveTypes.PROMOTION_KNIGHT_CAPTURE:
          case moveTypes.PROMOTION_QUEEN_CAPTURE:
          case moveTypes.CAPTURE:
            this.zobrist ^=
              this.#zobristKeys[
                ((move >>> 8) & 0b111111) * 12 +
                  ((((move >>> 20) & 0b1111) >>> 1) - 1) // add captured piece
              ] ^
              this.#zobristKeys[
                ((move >>> 8) & 0b111111) * 12 + (((move & 0b1111) >>> 1) - 1) // remove moved piece
              ] ^
              this.#zobristKeys[
                ((move >>> 14) & 0b111111) * 12 + (((move & 0b1111) >>> 1) - 1) // add moved piece
              ];

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
            this.zobrist ^=
              this.#zobristKeys[
                (((move >>> 8) & 0b111111) + 8) * 12 +
                  ((((move >>> 20) & 0b1111) >>> 1) - 1) // remove captured piece
              ] ^
              this.#zobristKeys[
                ((move >>> 8) & 0b111111) * 12 + (((move & 0b1111) >>> 1) - 1) // add moved piece
              ] ^
              this.#zobristKeys[
                ((move >>> 14) & 0b111111) * 12 + (((move & 0b1111) >>> 1) - 1) // remove moved piece
              ];

            this.board[(move >>> 14) & 0b111111] = move & 0b1111;
            this.board[((move >>> 8) & 0b111111) + 8] = (move >>> 20) & 0b1111;
            this.board[(move >>> 8) & 0b111111] = 0;

            break;
          case moveTypes.EN_PASSANT_BLACK:
            this.zobrist ^=
              this.#zobristKeys[
                (((move >>> 8) & 0b111111) - 8) * 12 +
                  (((move >>> 20) & 0b1111) - 1) // remove captured piece
              ] ^
              this.#zobristKeys[
                ((move >>> 8) & 0b111111) * 12 + (((move & 0b1111) >>> 1) - 1) // add moved piece
              ] ^
              this.#zobristKeys[
                ((move >>> 14) & 0b111111) * 12 + (((move & 0b1111) >>> 1) - 1) // remove moved piece
              ];

            this.board[(move >>> 14) & 0b111111] = move & 0b1111;
            this.board[((move >>> 8) & 0b111111) - 8] = (move >>> 20) & 0b1111;
            this.board[(move >>> 8) & 0b111111] = 0;

            break;
          default:
            this.zobrist ^=
              this.#zobristKeys[
                ((move >>> 14) & 0b111111) * 12 + (((move & 0b1111) >>> 1) - 1)
              ] ^
              this.#zobristKeys[
                ((move >>> 8) & 0b111111) * 12 + (((move & 0b1111) >>> 1) - 1) // re-move
              ];

            this.board[(move >>> 14) & 0b111111] = move & 0b1111;
            this.board[(move >>> 8) & 0b111111] = 0;

            break;
        }

        ////////////////////////////
        //     update zobrist     //
        ////////////////////////////

        this.zobrist ^= this.#zobristKeys[768]; // flip turn

        // if (this.wckc) this.zobrist ^= this.#zobristKeys[769];
        // if (this.wcqc) this.zobrist ^= this.#zobristKeys[770];
        // if (this.bckc) this.zobrist ^= this.#zobristKeys[771];
        // if (this.bcqc) this.zobrist ^= this.#zobristKeys[772];
      }
    }
  }

  move(move: ChessterMove) {
    // 32 bit number
    let history =
      ((this.bcqc ? 1 : 0) << 31) |
      ((this.wcqc ? 1 : 0) << 30) |
      ((this.bckc ? 1 : 0) << 29) |
      ((this.wckc ? 1 : 0) << 28) |
      ((this.bcm ? 1 : 0) << 27) |
      ((this.wcm ? 1 : 0) << 26) |
      ((this.bc ? 1 : 0) << 25) |
      ((this.wc ? 1 : 0) << 24);

    switch ((move >>> 4) & 0b1111) {
      case moveTypes.CAPTURE:
        history |= this.board[(move >>> 8) & 0b111111] << 20;

        this.zobrist ^=
          this.#zobristKeys[
            ((move >>> 8) & 0b111111) * 12 +
              ((this.board[(move >>> 8) & 0b111111] >>> 1) - 1) // remove captured piece
          ] ^
          this.#zobristKeys[
            ((move >>> 8) & 0b111111) * 12 + (((move & 0b1111) >>> 1) - 1) // add moved piece
          ] ^
          this.#zobristKeys[
            ((move >>> 14) & 0b111111) * 12 + (((move & 0b1111) >>> 1) - 1) // remove moved piece
          ];

        this.board[(move >>> 14) & 0b111111] = 0;
        this.board[(move >>> 8) & 0b111111] = move & 0b1111;
        break;
      case moveTypes.CASTLE_KINGSIDE: // todo: add zobrist
        this.board[(move >>> 14) & 0b111111] = 0;
        this.board[((move >>> 14) & 0b111111) + 2] = move & 0b1111;
        this.board[((move >>> 14) & 0b111111) + 1] =
          this.board[((move >>> 14) & 0b111111) + 3];
        this.board[((move >>> 14) & 0b111111) + 3] = 0;
        break;
      case moveTypes.CASTLE_QUEENSIDE: // todo: add zobrist
        this.board[(move >>> 14) & 0b111111] = 0;
        this.board[((move >>> 14) & 0b111111) - 2] = move & 0b1111;
        this.board[((move >>> 14) & 0b111111) - 1] =
          this.board[((move >>> 14) & 0b111111) - 4];
        this.board[((move >>> 14) & 0b111111) - 4] = 0;
        break;
      case moveTypes.EN_PASSANT_WHITE:
        history |= this.board[((move >>> 8) & 0b111111) + 8] << 20;

        this.zobrist ^=
          this.#zobristKeys[
            (((move >>> 8) & 0b111111) + 8) * 12 +
              ((this.board[((move >>> 8) & 0b111111) + 8] >>> 1) - 1) // remove captured piece
          ] ^
          this.#zobristKeys[
            ((move >>> 8) & 0b111111) * 12 + (((move & 0b1111) >>> 1) - 1) // add moved piece
          ] ^
          this.#zobristKeys[
            ((move >>> 14) & 0b111111) * 12 + (((move & 0b1111) >>> 1) - 1) // remove moved piece
          ];

        this.board[(move >>> 14) & 0b111111] = 0;
        this.board[(move >>> 8) & 0b111111] = move & 0b1111;
        this.board[((move >>> 8) & 0b111111) + 8] = 0;
        break;
      case moveTypes.EN_PASSANT_BLACK:
        history |= this.board[((move >>> 8) & 0b111111) - 8] << 20;

        this.zobrist ^=
          this.#zobristKeys[
            (((move >>> 8) & 0b111111) - 8) * 12 +
              ((this.board[((move >>> 8) & 0b111111) - 8] >>> 1) - 1) // remove captured piece
          ] ^
          this.#zobristKeys[
            ((move >>> 8) & 0b111111) * 12 + (((move & 0b1111) >>> 1) - 1) // add moved piece
          ] ^
          this.#zobristKeys[
            ((move >>> 14) & 0b111111) * 12 + (((move & 0b1111) >>> 1) - 1) // remove moved piece
          ];

        this.board[(move >>> 14) & 0b111111] = 0;
        this.board[(move >>> 8) & 0b111111] = move & 0b1111;
        this.board[((move >>> 8) & 0b111111) - 8] = 0; // captured space
        break;
      case moveTypes.PROMOTION_QUEEN_CAPTURE:
        history |= this.board[(move >>> 8) & 0b111111] << 20;

        // this.zobrist ^=
        //   this.#zobristKeys[
        //     ((move >>> 8) & 0b111111) * 12 +
        //       (this.board[(move >>> 8) & 0b111111] - 1) // remove captured piece
        //   ] ^
        //   this.#zobristKeys[
        //     ((move >>> 8) & 0b111111) * 12 + (((move & 0b0001) | 0b1010) - 1) // add moved piece
        //   ] ^
        //   this.#zobristKeys[
        //     ((move >>> 14) & 0b111111) * 12 + ((move & 0b1111) - 1) // remove moved piece
        //   ];

        this.board[(move >>> 14) & 0b111111] = 0;
        this.board[(move >>> 8) & 0b111111] = (move & 0b0001) | 0b1010;
        break;
      case moveTypes.PROMOTION_QUEEN:
        history |= this.board[(move >>> 8) & 0b111111] << 20;

        // this.zobrist ^=
        //   this.#zobristKeys[
        //     ((move >>> 8) & 0b111111) * 12 + (((move & 0b0001) | 0b1010) - 1) // add moved piece
        //   ] ^
        //   this.#zobristKeys[
        //     ((move >>> 14) & 0b111111) * 12 + ((move & 0b1111) - 1) // remove moved piece
        //   ];

        this.board[(move >>> 14) & 0b111111] = 0;
        this.board[(move >>> 8) & 0b111111] = (move & 0b0001) | 0b1010;
        break;
      case moveTypes.PROMOTION_ROOK_CAPTURE:
        history |= this.board[(move >>> 8) & 0b111111] << 20;

        // this.zobrist ^=
        //   this.#zobristKeys[
        //     ((move >>> 8) & 0b111111) * 12 +
        //       (this.board[(move >>> 8) & 0b111111] - 1) // remove captured piece
        //   ] ^
        //   this.#zobristKeys[
        //     ((move >>> 8) & 0b111111) * 12 + (((move & 0b0001) | 0b1000) - 1) // add moved piece
        //   ] ^
        //   this.#zobristKeys[
        //     ((move >>> 14) & 0b111111) * 12 + ((move & 0b1111) - 1) // remove moved piece
        //   ];

        this.board[(move >>> 14) & 0b111111] = 0;
        this.board[(move >>> 8) & 0b111111] = (move & 0b0001) | 0b1000;
        break;
      case moveTypes.PROMOTION_ROOK:
        history |= this.board[(move >>> 8) & 0b111111] << 20;

        // this.zobrist ^=
        //   this.#zobristKeys[
        //     ((move >>> 8) & 0b111111) * 12 + (((move & 0b0001) | 0b1000) - 1) // add moved piece
        //   ] ^
        //   this.#zobristKeys[
        //     ((move >>> 14) & 0b111111) * 12 + ((move & 0b1111) - 1) // remove moved piece
        //   ];

        this.board[(move >>> 14) & 0b111111] = 0;
        this.board[(move >>> 8) & 0b111111] = (move & 0b0001) | 0b1000;
        break;
      case moveTypes.PROMOTION_BISHOP_CAPTURE:
        history |= this.board[(move >>> 8) & 0b111111] << 20;

        // this.zobrist ^=
        //   this.#zobristKeys[
        //     ((move >>> 8) & 0b111111) * 12 +
        //       (this.board[(move >>> 8) & 0b111111] - 1) // remove captured piece
        //   ] ^
        //   this.#zobristKeys[
        //     ((move >>> 8) & 0b111111) * 12 + (((move & 0b0001) | 0b0110) - 1) // add moved piece
        //   ] ^
        //   this.#zobristKeys[
        //     ((move >>> 14) & 0b111111) * 12 + ((move & 0b1111) - 1) // remove moved piece
        //   ];

        this.board[(move >>> 14) & 0b111111] = 0;
        this.board[(move >>> 8) & 0b111111] = (move & 0b0001) | 0b0110;
        break;
      case moveTypes.PROMOTION_BISHOP:
        history |= this.board[(move >>> 8) & 0b111111] << 20;

        // this.zobrist ^=
        //   this.#zobristKeys[
        //     ((move >>> 8) & 0b111111) * 12 + (((move & 0b0001) | 0b0110) - 1) // add moved piece
        //   ] ^
        //   this.#zobristKeys[
        //     ((move >>> 14) & 0b111111) * 12 + ((move & 0b1111) - 1) // remove moved piece
        //   ];

        this.board[(move >>> 14) & 0b111111] = 0;
        this.board[(move >>> 8) & 0b111111] = (move & 0b0001) | 0b0110;
        break;
      case moveTypes.PROMOTION_KNIGHT_CAPTURE:
        history |= this.board[(move >>> 8) & 0b111111] << 20;

        // this.zobrist ^=
        //   this.#zobristKeys[
        //     ((move >>> 8) & 0b111111) * 12 +
        //       (this.board[(move >>> 8) & 0b111111] - 1) // remove captured piece
        //   ] ^
        //   this.#zobristKeys[
        //     ((move >>> 8) & 0b111111) * 12 + (((move & 0b0001) | 0b0100) - 1) // add moved piece
        //   ] ^
        //   this.#zobristKeys[
        //     ((move >>> 14) & 0b111111) * 12 + ((move & 0b1111) - 1) // remove moved piece
        //   ];

        this.board[(move >>> 14) & 0b111111] = 0;
        this.board[(move >>> 8) & 0b111111] = (move & 0b0001) | 0b0100;
        break;
      case moveTypes.PROMOTION_KNIGHT:
        history |= this.board[(move >>> 8) & 0b111111] << 20;

        // this.zobrist ^=
        //   this.#zobristKeys[
        //     ((move >>> 8) & 0b111111) * 12 + (((move & 0b0001) | 0b0100) - 1) // add moved piece
        //   ] ^
        //   this.#zobristKeys[
        //     ((move >>> 14) & 0b111111) * 12 + ((move & 0b1111) - 1) // remove moved piece
        //   ];

        this.board[(move >>> 14) & 0b111111] = 0;
        this.board[(move >>> 8) & 0b111111] = (move & 0b0001) | 0b0100;
        break;
      case moveTypes.DOUBLE_PAWN_PUSH:
      case moveTypes.MOVE:
        this.zobrist ^=
          this.#zobristKeys[
            ((move >>> 14) & 0b111111) * 12 + (((move & 0b1111) >>> 1) - 1)
          ] ^
          this.#zobristKeys[
            ((move >>> 8) & 0b111111) * 12 + (((move & 0b1111) >>> 1) - 1) // re-move
          ];

        this.board[(move >>> 14) & 0b111111] = 0;
        this.board[(move >>> 8) & 0b111111] = move & 0b1111;
        break;
      default:
        throw new Error("invalid move type: " + binaryToString(move));
    }

    this.history.push(history | (move & 0b11111111111111111111)); // order independent
    this.turn ^= 1;
    this.update();

    ////////////////////////////
    //     update zobrist     //
    ////////////////////////////

    this.zobrist ^= this.#zobristKeys[768]; // flip turn

    // if (this.wckc) this.zobrist ^= this.#zobristKeys[769];
    // if (this.wcqc) this.zobrist ^= this.#zobristKeys[770];
    // if (this.bckc) this.zobrist ^= this.#zobristKeys[771];
    // if (this.bcqc) this.zobrist ^= this.#zobristKeys[772];
  }

  /**
   * Checks that the given move is valid and moves the piece if it is
   * @param vm The move data to validate and move
   * @returns Whether the move was valid and the piece was moved
   */
  validateAndMove(vm: ChessterMove): void {
    const vp = this.board[(vm >>> 14) & 0b111111];

    // REMOVE (skipping validation)
    this.move(vm);
    return;

    if (!vp)
      throw new Error(
        "no piece at from location:" + binaryToString((vm >>> 14) & 0b111111)
      );

    const move = this.getAvailableMoves((vm >>> 14) & 0b111111).find(
      (m) => m === vm
    );

    if (!move) throw new Error("invalid move: " + binaryToString(vm));

    this.move(vm);
  }

  validateAndMoveObject(vm: {
    from: string;
    to: string;
    promotion?: string;
  }): number {
    const moves = this.getAvailableMoves(
      (8 - Number.parseInt(vm.from[1])) * 8 + (vm.from.charCodeAt(0) - 97)
    );

    let pd: number;

    switch (vm.promotion) {
      case "q":
        pd = 0b00;
        break;
      case "r":
        pd = 0b11;
        break;
      case "b":
        pd = 0b10;
        break;
      case "n":
        pd = 0b01;
        break;
    }

    const move = moves.find(
      (m) =>
        ((m >>> 8) & 0b111111) ===
          (8 - Number.parseInt(vm.to[1])) * 8 + (vm.to.charCodeAt(0) - 97) &&
        (vm.promotion
          ? ((m >>> 6) & 0b11) === 0b10 || ((m >>> 6) & 0b11) === 0b11
            ? ((m >>> 4) & 0b11) === pd
            : false
          : true)
    );

    if (!move) throw new Error("invalid move: " + JSON.stringify(vm));

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

  update() {
    let checked = 0b00; // left bit is currentChecked, right bit is pastChecked

    // check if past team is still in check
    for (let i = 0; i < boardSize; i++) {
      if (!this.board[i]) continue; // saved ~170ms

      if (!(checked & 0b01) && (this.board[i] & 0b1) === this.turn) {
        const moves = this.getAllMoves(i);

        for (let j = 0; j < moves.length; j++) {
          if (
            (((moves[j] >>> 4) & 0b1111) === moveTypes.CAPTURE ||
              ((moves[j] >>> 6) & 0b11) === 0b11) && // if any promotion capture moves
            this.board[(moves[j] >>> 8) & 0b111111] ===
              (0b1100 | (1 ^ this.turn))
          ) {
            // 0b110 is king value
            checked |= 0b01; // set pastChecked
            break;
          }
        }
      } else if (!(checked & 0b10) && (this.board[i] & 0b1) !== this.turn) {
        // check if current turn is in check
        const moves = this.getAllMoves(i);

        for (let j = 0; j < moves.length; j++) {
          if (
            (((moves[j] >>> 4) & 0b1111) === moveTypes.CAPTURE ||
              ((moves[j] >>> 6) & 0b11) === 0b11) && // if any promotion capture moves
            this.board[(moves[j] >>> 8) & 0b111111] === (0b1100 | this.turn)
          ) {
            // 0b110 is king value
            checked |= 0b10; // set currentChecked
            break;
          }
        }
      }

      if (checked === 0b11) break;
    }

    this.wc =
      (this.turn === WHITE ? (checked & 0b10) >>> 1 : checked & 0b01) === 1;
    this.bc =
      (this.turn === WHITE ? checked & 0b01 : (checked & 0b10) >>> 1) === 1;

    // modified from updateCastle()
    this.wckc = this.wckc
      ? this.board[60] === 0b1100 && this.board[63] === 0b1000
      : false;

    this.wcqc = this.wcqc
      ? this.board[60] === 0b1100 && this.board[56] === 0b1000
      : false;

    this.bckc = this.bckc
      ? this.board[4] === 0b1101 && this.board[7] === 0b1001
      : false;

    this.bcqc = this.bcqc
      ? this.board[4] === 0b1101 && this.board[0] === 0b1001
      : false;

    if (this.simulation) return;

    /*
     * the below code utilizes the fact that both teams cannot be checked at the same time. additionally,
     * we only need to check if the current team is in checkmate. we do not need to check the previous team
     * as they could not make any moves that would result in check.
     */

    // modified from isCheckmated()

    this.wcm = this.wc;
    this.bcm = this.bc;
    let sm = true;

    for (let i = 0; i < boardSize; i++) {
      if (
        this.board[i] &&
        (this.board[i] & 0b1) === this.turn &&
        this.getAvailableMoves(i).length > 0
      ) {
        if (this.turn === WHITE) this.wcm = false;
        if (this.turn === BLACK) this.bcm = false;
        sm = false;
        break;
      }
    }

    this.sm = !this.wcm && !this.bcm && sm;
  }

  moves() {
    if (this.wcm || this.bcm || this.sm) return [];

    let moves = [];

    for (let i = 0; i < boardSize; i++) {
      if (this.board[i] && (this.board[i] & 0b1) === this.turn) {
        moves.push(...this.getAvailableMoves(i));
      }
    }

    return moves;
  }

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
      sm: this.sm,
      simulation: this.simulation,
    };
  }

  /**
   *
   * @param piece 4-bit integer representing the piece
   * @param location 6-bit integer representing the location of the piece
   * @returns
   */
  getAllMoves(location: number): number[] {
    switch ((this.board[location] >>> 1) & 0b111) {
      case 0b001:
        return this.getPawnMoves(this.board[location], location);
      case 0b010:
        return this.getKnightMoves(this.board[location], location);
      case 0b011:
        return this.getBishopMoves(this.board[location], location);
      case 0b100:
        return this.getRookMoves(this.board[location], location);
      case 0b101:
        return this.getQueenMoves(this.board[location], location);
      case 0b110:
        return this.getKingMoves(this.board[location], location);
      default:
        return [];
        throw new Error(
          "invalid piece while getting available moves: " +
            this.board[location] +
            " (decimal)\n" +
            this.ascii()
        );
    }
  }

  /**
   * Returns available moves for the given location, accounting for check
   * @returns
   */
  getAvailableMoves(location: number): number[] {
    const moves = this.getAllMoves(location);

    if (this.simulation) return moves;

    const finalMoves = [];
    // const team = this.board[location] & 0b1;

    this.simulation = true;

    for (let i = 0; i < moves.length; i++) {
      this.move(moves[i]);

      if (
        !((this.turn === WHITE || this.wc) && (this.turn === BLACK || this.bc))
      ) {
        this.undo();

        if (((moves[i] >>> 4) & 0b1111) === moveTypes.CASTLE_KINGSIDE) {
          this.move(
            (moves[i] & 0b11111100000000001111) |
              (((moves[i] >>> 14) + 1) << 8) |
              (moveTypes.MOVE << 4)
          );

          if (
            !(
              (this.turn === WHITE || this.wc) &&
              (this.turn === BLACK || this.bc)
            )
          )
            finalMoves.push(moves[i]);

          this.undo();
        } else if (((moves[i] >>> 4) & 0b1111) === moveTypes.CASTLE_QUEENSIDE) {
          this.move(
            (moves[i] & 0b11111100000000001111) |
              (((moves[i] >>> 14) - 1) << 8) |
              (moveTypes.MOVE << 4)
          );

          if (
            !(
              (this.turn === WHITE || this.wc) &&
              (this.turn === BLACK || this.bc)
            )
          )
            finalMoves.push(moves[i]);

          this.undo();
        } else {
          finalMoves.push(moves[i]);
        }
      } else {
        this.undo();
      }
    }

    this.simulation = false;

    return finalMoves;
  }

  /**
   * as the king is a symmetric piece, the team is not used in the calculations
   * @param piece
   * @param location
   * @returns
   */
  getKingMoves(piece: number, location: number): number[] {
    const moves: number[] = [];

    // bottom row (if not bottom row)
    if ((location & 0b111000) !== 0b111000) {
      // if location contains enemy piece
      if (!this.board[location + 8]) {
        moves.push(
          (location << 14) |
            ((location + 8) << 8) |
            (moveTypes.MOVE << 4) |
            piece
        );
      } else if ((this.board[location + 8] & 0b1) !== (piece & 0b1)) {
        moves.push(
          (location << 14) |
            ((location + 8) << 8) |
            (moveTypes.CAPTURE << 4) |
            piece
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
            piece
        );
      } else if ((this.board[location - 8] & 0b1) !== (piece & 0b1)) {
        moves.push(
          (location << 14) |
            ((location - 8) << 8) |
            (moveTypes.CAPTURE << 4) |
            piece
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
            piece
        );
      } else if ((this.board[location + 1] & 0b1) !== (piece & 0b1)) {
        moves.push(
          (location << 14) |
            ((location + 1) << 8) |
            (moveTypes.CAPTURE << 4) |
            piece
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
              piece
          );
        } else if ((this.board[location + 9] & 0b1) !== (piece & 0b1)) {
          moves.push(
            (location << 14) |
              ((location + 9) << 8) |
              (moveTypes.CAPTURE << 4) |
              piece
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
              piece
          );
        } else if ((this.board[location - 7] & 0b1) !== (piece & 0b1)) {
          moves.push(
            (location << 14) |
              ((location - 7) << 8) |
              (moveTypes.CAPTURE << 4) |
              piece
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
            piece
        );
      } else if ((this.board[location - 1] & 0b1) !== (piece & 0b1)) {
        moves.push(
          (location << 14) |
            ((location - 1) << 8) |
            (moveTypes.CAPTURE << 4) |
            piece
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
              piece
          );
        } else if ((this.board[location - 9] & 0b1) !== (piece & 0b1)) {
          moves.push(
            (location << 14) |
              ((location - 9) << 8) |
              (moveTypes.CAPTURE << 4) |
              piece
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
              piece
          );
        } else if ((this.board[location + 7] & 0b1) !== (piece & 0b1)) {
          moves.push(
            (location << 14) |
              ((location + 7) << 8) |
              (moveTypes.CAPTURE << 4) |
              piece
          );
        }
      }
    }

    // castling
    if (!(piece & 0b1) && !this.wc) {
      // white king-side
      if (this.wckc && !this.board[location + 1] && !this.board[location + 2])
        moves.push(
          (location << 14) |
            ((location + 2) << 8) |
            (moveTypes.CASTLE_KINGSIDE << 4) |
            piece
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
            piece
          // (location << 14) | (moveTypes.CASTLE_QUEENSIDE << 4) | piece
        );
    }

    if ((piece & 0b1) === 1 && this.bc === false) {
      // black king-side
      if (this.bckc && !this.board[location + 1] && !this.board[location + 2])
        moves.push(
          (location << 14) |
            ((location + 2) << 8) |
            (moveTypes.CASTLE_KINGSIDE << 4) |
            piece
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
            piece
          // (location << 14) | (moveTypes.CASTLE_QUEENSIDE << 4) | piece
        );
    }

    return moves;
  }

  getKnightMoves(piece: number, location: number): number[] {
    const moves: number[] = [];

    if (location < 48) {
      if ((location & 0b111) !== 0b111)
        if (!this.board[location + 17]) {
          // can do 2 down 1 right
          moves.push(
            (location << 14) |
              ((location + 17) << 8) |
              (moveTypes.MOVE << 4) |
              piece
          );
        } else if ((this.board[location + 17] & 0b1) !== (piece & 0b1)) {
          moves.push(
            (location << 14) |
              ((location + 17) << 8) |
              (moveTypes.CAPTURE << 4) |
              piece
          );
        }

      if (location & 0b111)
        if (!this.board[location + 15]) {
          moves.push(
            (location << 14) |
              ((location + 15) << 8) |
              (moveTypes.MOVE << 4) |
              piece
          );
        } else if ((this.board[location + 15] & 0b1) !== (piece & 0b1)) {
          moves.push(
            (location << 14) |
              ((location + 15) << 8) |
              (moveTypes.CAPTURE << 4) |
              piece
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
              piece
          );
        } else if ((this.board[location - 15] & 0b1) !== (piece & 0b1)) {
          moves.push(
            (location << 14) |
              ((location - 15) << 8) |
              (moveTypes.CAPTURE << 4) |
              piece
          );
        }

      if (location & 0b111)
        if (!this.board[location - 17]) {
          moves.push(
            (location << 14) |
              ((location - 17) << 8) |
              (moveTypes.MOVE << 4) |
              piece
          );
        } else if ((this.board[location - 17] & 0b1) !== (piece & 0b1)) {
          moves.push(
            (location << 14) |
              ((location - 17) << 8) |
              (moveTypes.CAPTURE << 4) |
              piece
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
              piece
          );
        } else if ((this.board[location + 6] & 0b1) !== (piece & 0b1)) {
          moves.push(
            (location << 14) |
              ((location + 6) << 8) |
              (moveTypes.CAPTURE << 4) |
              piece
          );
        }
      }

      if (location > 7) {
        if (!this.board[location - 10]) {
          moves.push(
            (location << 14) |
              ((location - 10) << 8) |
              (moveTypes.MOVE << 4) |
              piece
          );
        } else if ((this.board[location - 10] & 0b1) !== (piece & 0b1)) {
          moves.push(
            (location << 14) |
              ((location - 10) << 8) |
              (moveTypes.CAPTURE << 4) |
              piece
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
              piece
          );
        } else if ((this.board[location + 10] & 0b1) !== (piece & 0b1)) {
          moves.push(
            (location << 14) |
              ((location + 10) << 8) |
              (moveTypes.CAPTURE << 4) |
              piece
          );
        }
      }

      if (location > 7) {
        if (!this.board[location - 6]) {
          moves.push(
            (location << 14) |
              ((location - 6) << 8) |
              (moveTypes.MOVE << 4) |
              piece
          );
        } else if ((this.board[location - 6] & 0b1) !== (piece & 0b1)) {
          moves.push(
            (location << 14) |
              ((location - 6) << 8) |
              (moveTypes.CAPTURE << 4) |
              piece
          );
        }
      }
    }

    return moves;
  }

  getBishopMoves(piece: number, location: number): number[] {
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
            piece
        );
      } else if ((this.board[location + 9 * i] & 0b1) !== (piece & 0b1)) {
        moves.push(
          (location << 14) |
            ((location + 9 * i) << 8) |
            (moveTypes.CAPTURE << 4) |
            piece
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
            piece
        );
      } else if ((this.board[location - 7 * i] & 0b1) !== (piece & 0b1)) {
        moves.push(
          (location << 14) |
            ((location - 7 * i) << 8) |
            (moveTypes.CAPTURE << 4) |
            piece
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
            piece
        );
      } else if ((this.board[location + 7 * i] & 0b1) !== (piece & 0b1)) {
        moves.push(
          (location << 14) |
            ((location + 7 * i) << 8) |
            (moveTypes.CAPTURE << 4) |
            piece
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
            piece
        );
      } else if ((this.board[location - 9 * i] & 0b1) !== (piece & 0b1)) {
        moves.push(
          (location << 14) |
            ((location - 9 * i) << 8) |
            (moveTypes.CAPTURE << 4) |
            piece
        );
        break;
      } else {
        break;
      }
    }

    return moves;
  }

  getRookMoves(piece: number, location: number): number[] {
    const moves: number[] = [];

    // right
    for (let i = 1; i < 8 - (location & 0b111); i++) {
      if (!this.board[location + i]) {
        moves.push(
          (location << 14) |
            ((location + i) << 8) |
            (moveTypes.MOVE << 4) |
            piece
        );
      } else if ((this.board[location + i] & 0b1) !== (piece & 0b1)) {
        moves.push(
          (location << 14) |
            ((location + i) << 8) |
            (moveTypes.CAPTURE << 4) |
            piece
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
            piece
        );
      } else if ((this.board[location - i] & 0b1) !== (piece & 0b1)) {
        moves.push(
          (location << 14) |
            ((location - i) << 8) |
            (moveTypes.CAPTURE << 4) |
            piece
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
            piece
        );
      } else if ((this.board[location + 8 * i] & 0b1) !== (piece & 0b1)) {
        moves.push(
          (location << 14) |
            ((location + 8 * i) << 8) |
            (moveTypes.CAPTURE << 4) |
            piece
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
            piece
        );
      } else if ((this.board[location - 8 * i] & 0b1) !== (piece & 0b1)) {
        moves.push(
          (location << 14) |
            ((location - 8 * i) << 8) |
            (moveTypes.CAPTURE << 4) |
            piece
        );
        break;
      } else {
        break;
      }
    }

    return moves;
  }

  getQueenMoves(piece: number, location: number): number[] {
    const moves: number[] = [];

    ////////////////////////////
    //     getBishopMoves     //
    ////////////////////////////

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
            piece
        );
      } else if ((this.board[location + 9 * i] & 0b1) !== (piece & 0b1)) {
        moves.push(
          (location << 14) |
            ((location + 9 * i) << 8) |
            (moveTypes.CAPTURE << 4) |
            piece
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
            piece
        );
      } else if ((this.board[location - 7 * i] & 0b1) !== (piece & 0b1)) {
        moves.push(
          (location << 14) |
            ((location - 7 * i) << 8) |
            (moveTypes.CAPTURE << 4) |
            piece
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
            piece
        );
      } else if ((this.board[location + 7 * i] & 0b1) !== (piece & 0b1)) {
        moves.push(
          (location << 14) |
            ((location + 7 * i) << 8) |
            (moveTypes.CAPTURE << 4) |
            piece
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
            piece
        );
      } else if ((this.board[location - 9 * i] & 0b1) !== (piece & 0b1)) {
        moves.push(
          (location << 14) |
            ((location - 9 * i) << 8) |
            (moveTypes.CAPTURE << 4) |
            piece
        );
        break;
      } else {
        break;
      }
    }

    //////////////////////////
    //     getRookMoves     //
    //////////////////////////

    // right
    for (let i = 1; i < 8 - (location & 0b111); i++) {
      if (!this.board[location + i]) {
        moves.push(
          (location << 14) |
            ((location + i) << 8) |
            (moveTypes.MOVE << 4) |
            piece
        );
      } else if ((this.board[location + i] & 0b1) !== (piece & 0b1)) {
        moves.push(
          (location << 14) |
            ((location + i) << 8) |
            (moveTypes.CAPTURE << 4) |
            piece
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
            piece
        );
      } else if ((this.board[location - i] & 0b1) !== (piece & 0b1)) {
        moves.push(
          (location << 14) |
            ((location - i) << 8) |
            (moveTypes.CAPTURE << 4) |
            piece
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
            piece
        );
      } else if ((this.board[location + 8 * i] & 0b1) !== (piece & 0b1)) {
        moves.push(
          (location << 14) |
            ((location + 8 * i) << 8) |
            (moveTypes.CAPTURE << 4) |
            piece
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
            piece
        );
      } else if ((this.board[location - 8 * i] & 0b1) !== (piece & 0b1)) {
        moves.push(
          (location << 14) |
            ((location - 8 * i) << 8) |
            (moveTypes.CAPTURE << 4) |
            piece
        );
        break;
      } else {
        break;
      }
    }

    return moves;
  }

  getPawnMoves(piece: number, location: number): number[] {
    const moves: number[] = [];

    // white piece
    if (!(piece & 0b1)) {
      // promotion

      // up
      if (!this.board[location - 8]) {
        if (!((location - 8) >>> 3)) {
          // this piece can only do promotion
          moves.push(
            (location << 14) |
              ((location - 8) << 8) |
              (moveTypes.PROMOTION_QUEEN << 4) |
              piece,
            (location << 14) |
              ((location - 8) << 8) |
              (moveTypes.PROMOTION_ROOK << 4) |
              piece,
            (location << 14) |
              ((location - 8) << 8) |
              (moveTypes.PROMOTION_BISHOP << 4) |
              piece,
            (location << 14) |
              ((location - 8) << 8) |
              (moveTypes.PROMOTION_KNIGHT << 4) |
              piece
          );
        } else {
          moves.push(
            (location << 14) |
              ((location - 8) << 8) |
              (moveTypes.MOVE << 4) |
              piece
          );

          if (location >>> 3 === 6 && !this.board[location - 16]) {
            // double move
            moves.push(
              (location << 14) |
                ((location - 16) << 8) |
                (moveTypes.DOUBLE_PAWN_PUSH << 4) |
                piece
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
              piece,
            (location << 14) |
              ((location - 9) << 8) |
              (moveTypes.PROMOTION_ROOK_CAPTURE << 4) |
              piece,
            (location << 14) |
              ((location - 9) << 8) |
              (moveTypes.PROMOTION_BISHOP_CAPTURE << 4) |
              piece,
            (location << 14) |
              ((location - 9) << 8) |
              (moveTypes.PROMOTION_KNIGHT_CAPTURE << 4) |
              piece
          );
        } else {
          moves.push(
            (location << 14) |
              ((location - 9) << 8) |
              (moveTypes.CAPTURE << 4) |
              piece
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
              piece,
            (location << 14) |
              ((location - 7) << 8) |
              (moveTypes.PROMOTION_ROOK_CAPTURE << 4) |
              piece,
            (location << 14) |
              ((location - 7) << 8) |
              (moveTypes.PROMOTION_BISHOP_CAPTURE << 4) |
              piece,
            (location << 14) |
              ((location - 7) << 8) |
              (moveTypes.PROMOTION_KNIGHT_CAPTURE << 4) |
              piece
          );
        } else {
          moves.push(
            (location << 14) |
              ((location - 7) << 8) |
              (moveTypes.CAPTURE << 4) |
              piece
          );
        }
      }

      // en passant
      if (this.history[this.history.length - 1]) {
        if (
          ((this.history[this.history.length - 1] >>> 4) & 0b1111) ===
            moveTypes.DOUBLE_PAWN_PUSH &&
          ((this.history[this.history.length - 1] >>> 11) & 0b111) === 0b011 &&
          ((location >>> 3) & 0b111) === 0b011 &&
          Math.abs(
            ((this.history[this.history.length - 1] >>> 8) & 0b111111) -
              location
          ) === 1 // performant?
        ) {
          moves.push(
            (location << 14) |
              ((((this.history[this.history.length - 1] >>> 8) & 0b111111) -
                8) <<
                8) |
              (moveTypes.EN_PASSANT_WHITE << 4) |
              piece
          );
        }
      }
    } else {
      // black piece
      if (!this.board[location + 8]) {
        // promotion
        if (location >>> 3 === 6) {
          moves.push(
            (location << 14) |
              ((location + 8) << 8) |
              (moveTypes.PROMOTION_QUEEN << 4) |
              piece,
            (location << 14) |
              ((location + 8) << 8) |
              (moveTypes.PROMOTION_ROOK << 4) |
              piece,
            (location << 14) |
              ((location + 8) << 8) |
              (moveTypes.PROMOTION_BISHOP << 4) |
              piece,
            (location << 14) |
              ((location + 8) << 8) |
              (moveTypes.PROMOTION_KNIGHT << 4) |
              piece
          );
        } else {
          moves.push(
            (location << 14) |
              ((location + 8) << 8) |
              (moveTypes.MOVE << 4) |
              piece
          );

          if (location >>> 3 === 1 && !this.board[location + 16]) {
            // double move
            moves.push(
              (location << 14) |
                ((location + 16) << 8) |
                (moveTypes.DOUBLE_PAWN_PUSH << 4) |
                piece
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
              piece,
            (location << 14) |
              ((location + 9) << 8) |
              (moveTypes.PROMOTION_ROOK_CAPTURE << 4) |
              piece,
            (location << 14) |
              ((location + 9) << 8) |
              (moveTypes.PROMOTION_BISHOP_CAPTURE << 4) |
              piece,
            (location << 14) |
              ((location + 9) << 8) |
              (moveTypes.PROMOTION_KNIGHT_CAPTURE << 4) |
              piece
          );
        } else {
          moves.push(
            (location << 14) |
              ((location + 9) << 8) |
              (moveTypes.CAPTURE << 4) |
              piece
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
              piece,
            (location << 14) |
              ((location + 7) << 8) |
              (moveTypes.PROMOTION_ROOK_CAPTURE << 4) |
              piece,
            (location << 14) |
              ((location + 7) << 8) |
              (moveTypes.PROMOTION_BISHOP_CAPTURE << 4) |
              piece,
            (location << 14) |
              ((location + 7) << 8) |
              (moveTypes.PROMOTION_KNIGHT_CAPTURE << 4) |
              piece
          );
        } else {
          moves.push(
            (location << 14) |
              ((location + 7) << 8) |
              (moveTypes.CAPTURE << 4) |
              piece
          );
        }

      // en passant
      if (this.history[this.history.length - 1]) {
        if (
          ((this.history[this.history.length - 1] >>> 4) & 0b1111) ===
            moveTypes.DOUBLE_PAWN_PUSH &&
          ((this.history[this.history.length - 1] >>> 11) & 0b111) === 0b100 &&
          ((location >>> 3) & 0b111) === 0b100 &&
          Math.abs(
            ((this.history[this.history.length - 1] >>> 8) & 0b111111) -
              location
          ) === 1 // performant?
        ) {
          moves.push(
            (location << 14) |
              ((((this.history[this.history.length - 1] >>> 8) & 0b111111) +
                8) <<
                8) |
              (moveTypes.EN_PASSANT_BLACK << 4) |
              piece
          );
        }
      }
    }

    return moves;
  }

  // countPiecesInBoundary(
  //   boundary1: ChessterLocation,
  //   boundary2: ChessterLocation,
  //   options?: { team?: ChessterTeam }
  // ) {
  //   let count = 0;
  //   for (let i = boundary1[0]; i <= boundary2[0]; i++) {
  //     for (let j = boundary1[1]; j <= boundary2[1]; j++) {
  //       if (
  //         this.board[i][j] &&
  //         (options === undefined || this.board[i][j]!.team === options.team)
  //       ) {
  //         count++;
  //       }
  //     }
  //   }
  //   return count;
  // }
}
