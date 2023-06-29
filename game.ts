import {
  BLACK,
  ChessterBoard,
  ChessterBoardString,
  ChessterGameState,
  ChessterHistory,
  ChessterLocation,
  ChessterMove,
  ChessterPiece,
  ChessterPieceString,
  ChessterPlayer,
  ChessterTeam,
  RecursivePartial,
  WHITE,
  boardSize,
  defaultBoard,
  moveTypes,
} from "./types";
import { getBinaryString, numberToPieceString } from "./util";

export class ChessterGame {
  board: number[]; // board is 64 bytes
  wc: boolean; // white check
  bc: boolean; // black check
  wcm: boolean; // white checkmate
  bcm: boolean; // black checkmate
  wcc: number; // white can castle
  bcc: number; // black can castle
  turn: number;
  history: ChessterHistory;
  simulation: boolean;

  /**
   * Creates a new ChessterGame instance. (including init())
   */
  constructor(state?: RecursivePartial<ChessterGameState>) {
    this.init(state);
  }

  init(state?: RecursivePartial<ChessterGameState>) {
    this.board = <ChessterBoard>state?.board || defaultBoard;
    this.turn = <ChessterTeam>state?.turn || WHITE;
    this.history = <ChessterHistory>state?.history || [];
    this.simulation = <boolean>state?.simulation || false;

    this.wc = false; // white check
    this.bc = false; // black check
    this.wcm = false; // white checkmate
    this.bcm = false; // black checkmate
    this.wcc = 0b00; // [king moved, rook moved]
    this.bcc = 0b00; // [king moved, rook moved]

    console.log(this.boardToString());

    this.updateChecked();
  }

  undo() {
    if (this.history.length > 0) {
      const move = this.history.pop();
      if (move) {
        this.bcc = (move >> 31) & 0b11;
        this.wcc = (move >> 29) & 0b11;
        this.bcm = ((move >> 28) & 0b1) === 1;
        this.wcm = ((move >> 27) & 0b1) === 1;
        this.bc = ((move >> 26) & 0b1) === 1;
        this.wc = ((move >> 25) & 0b1) === 1;
        this.turn = (move >> 24) & 0b1;

        switch ((move >> 4) & 0b1111) {
          case moveTypes.CAPTURE:
            this.board[(move >> 8) & 0b111111] = (move >> 20) & 0b1111;
            this.board[(move >> 14) & 0b111111] = move & 0b1111;
            break;
          case moveTypes.CASTLE_KINGSIDE:
            this.board[(move >> 14) & 0b111111] = move & 0b1111;
            this.board[((move >> 14) & 0b111111) + 2] = 0;
            this.board[((move >> 14) & 0b111111) + 3] =
              this.board[((move >> 14) & 0b111111) + 1];
            this.board[((move >> 14) & 0b111111) + 1] = 0;
            break;
          case moveTypes.CASTLE_QUEENSIDE:
            this.board[(move >> 14) & 0b111111] = move & 0b1111;
            this.board[((move >> 14) & 0b111111) - 2] = 0;
            this.board[((move >> 14) & 0b111111) - 4] =
              this.board[((move >> 14) & 0b111111) - 1];
            this.board[((move >> 14) & 0b111111) - 1] = 0;
            break;
          case moveTypes.EN_PASSANT_WHITE:
            this.board[(move >> 14) & 0b111111] = move & 0b1111;
            this.board[((move >> 8) & 0b111111) + 8] = (move >> 20) & 0b1111;
            this.board[(move >> 8) & 0b111111] = 0;
            break;
          case moveTypes.EN_PASSANT_BLACK:
            this.board[(move >> 14) & 0b111111] = move & 0b1111;
            this.board[((move >> 8) & 0b111111) - 8] = (move >> 20) & 0b1111;
            this.board[(move >> 8) & 0b111111] = 0;
            break;
          default:
            this.board[(move >> 14) & 0b111111] = move & 0b1111;
            this.board[(move >> 8) & 0b111111] = 0;
            break;
        }
      }
    }
  }

  move(move: ChessterMove) {
    let history =
      (this.bcc << 31) |
      (this.wcc << 29) |
      (this.bcm ? 1 << 28 : 0) |
      (this.wcm ? 1 << 27 : 0) |
      (this.bc ? 1 << 26 : 0) |
      (this.wc ? 1 << 25 : 0) |
      (this.turn << 24);

    switch ((move >> 4) & 0b1111) {
      case moveTypes.CAPTURE:
        history |= this.board[(move >> 8) & 0b111111] << 20;
        this.board[(move >> 14) & 0b111111] = 0;
        this.board[(move >> 8) & 0b111111] = move & 0b1111;
        break;
      case moveTypes.CASTLE_KINGSIDE:
        this.board[(move >> 14) & 0b111111] = 0;
        this.board[(move >> 14) & (0b111111 + 2)] = move & 0b1111;
        this.board[(move >> 14) & (0b111111 + 1)] =
          this.board[(move >> 14) & (0b111111 + 3)];
        this.board[(move >> 14) & (0b111111 + 3)] = 0;
        break;
      case moveTypes.CASTLE_QUEENSIDE:
        this.board[(move >> 14) & 0b111111] = 0;
        this.board[(move >> 14) & (0b111111 - 2)] = move & 0b1111;
        this.board[(move >> 14) & (0b111111 - 1)] =
          this.board[(move >> 14) & (0b111111 - 4)];
        this.board[(move >> 14) & (0b111111 - 4)] = 0;
        break;
      case moveTypes.EN_PASSANT_WHITE: // what exactly is this again
        history |= this.board[((move >> 8) & 0b111111) - 8] << 20;
        this.board[(move >> 14) & 0b111111] = 0;
        this.board[(move >> 8) & 0b111111] = move & 0b1111;
        this.board[((move >> 8) & 0b111111) - 8] = 0;
        break;
      case moveTypes.EN_PASSANT_BLACK:
        history |= this.board[((move >> 8) & 0b111111) + 8] << 20;
        this.board[(move >> 14) & 0b111111] = 0;
        this.board[(move >> 8) & 0b111111] = move & 0b1111;
        this.board[((move >> 8) & 0b111111) + 8] = 0;
        break;
      case moveTypes.PROMOTION_QUEEN:
        this.board[(move >> 14) & 0b111111] = 0;
        this.board[(move >> 8) & 0b111111] = (move & 0b0001) | 0b1010;
        break;
      case moveTypes.PROMOTION_ROOK:
        this.board[(move >> 14) & 0b111111] = 0;
        this.board[(move >> 8) & 0b111111] = (move & 0b0001) | 0b1000;
        break;
      case moveTypes.PROMOTION_BISHOP:
        this.board[(move >> 14) & 0b111111] = 0;
        this.board[(move >> 8) & 0b111111] = (move & 0b0001) | 0b0110;
        break;
      case moveTypes.PROMOTION_KNIGHT:
        this.board[(move >> 14) & 0b111111] = 0;
        this.board[(move >> 8) & 0b111111] = (move & 0b0001) | 0b0100;
        break;
      case moveTypes.MOVE:
        this.board[(move >> 14) & 0b111111] = 0;
        this.board[(move >> 8) & 0b111111] = move & 0b1111;
        break;
      default:
        throw new Error("invalid move type:" + getBinaryString(move));
    }

    history |= move; // move is 20 bits

    this.updateChecked();
    this.turn = this.turn ^ 1;
    this.history.push(history);
  }

  /**
   * Checks that the given move is valid and moves the piece if it is
   * @param vm The move data to validate and move
   * @returns Whether the move was valid and the piece was moved
   */
  validateAndMove(vm: ChessterMove): void {
    const vp = this.board[(vm >> 14) & 0b111111];

    if (!vp)
      throw new Error(
        "no piece at from location:" + getBinaryString((vm >> 14) & 0b111111)
      );

    const move = this.getAvailableMoves((vm >> 14) & 0b111111).find(
      (m) => m === vm
    );

    if (!move) throw new Error("invalid move: " + getBinaryString(vm));

    this.move(vm);
  }

  /**
   * Creates a printable string of the board
   * @returns The board as a string
   */
  boardToString(): string {
    let boardString = "";
    for (let i = 0; i < boardSize; i++) {
      boardString += (numberToPieceString(this.board[i]) || " ") + " ";
      if (i % 8 === 7) boardString += "\n";
    }
    return boardString;
  }

  moveToString(move: ChessterMove): string {
    return getBinaryString(move);
  }

  updateChecked() {
    console.log("[debug] updating checked", this.simulation);
    this.wc = this.isChecked(WHITE);
    this.bc = this.isChecked(BLACK);
    // updateChecked runs after turn is updated
    if (this.wc) this.wcm = this.isCheckmated(WHITE);
    if (this.bc) this.bcm = this.isCheckmated(BLACK);
  }

  /**
   * Is the king under attack?
   * @param team The team to check
   * @returns Whether the given team is checked
   */
  isChecked(team: ChessterTeam): boolean {
    // console.log("[debug] checking if team is checked (team: " + team + ")");
    for (let i = 0; i < boardSize; i++) {
      if (this.board[i] !== 0 && (this.board[i] & 0b1) !== team) {
        let moves = this.getAllMoves(i);
        // console.log(moves);
        for (let j = 0; j < moves.length; j++) {
          if (((moves[j] >> 4) & 0b1111) === moveTypes.CAPTURE) {
            console.log(
              "[debug] capture move found",
              getBinaryString(moves[j])
            );
            if (
              this.board[(moves[j] >> 8) & 0b111111] ===
              (0b1100 & (team ^ 1))
            ) {
              // 0b110 is king value
              console.log("[debug] king is checked");
              console.log(this.boardToString());
              return true;
            }
          }
        }
      }
    }
    return false;
  }

  /**
   * Are there any moves to get out of check?
   * @param team The team to check
   * @returns Whether the enemy team is checkmated
   * @todo Implement this
   */
  isCheckmated(team: ChessterTeam): boolean {
    // console.log("[debug] checking if team is checkmated (team: " + team + ")");
    for (let i = 0; i < boardSize; i++)
      if (this.board[i] !== 0 && (this.board[i] & 0b1) === team)
        if (this.getAvailableMoves(i).length > 0) return false;
    return true;
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
      wcc: this.wcc,
      bcc: this.bcc,
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
    let moves: number[] = [];
    switch ((this.board[location] >> 1) & 0b111) {
      // case 0b001:
      //   moves = this.getPawnMoves(this.board[location], location);
      //   break;
      // case 0b010:
      //   moves = this.getKnightMoves(this.board[location], location);
      //   break;
      case 0b011:
        moves = this.getBishopMoves(this.board[location], location);
        break;
      // case 0b100:
      //   moves = this.getRookMoves(this.board[location], location);
      //   break;
      case 0b101:
        moves = this.getQueenMoves(this.board[location], location);
        break;
      case 0b110:
        moves = this.getKingMoves(this.board[location], location);
        break;
      default:
        console.log("invalid piece: " + this.board[location] + " (decimal)");
        return [];
        throw new Error(
          "invalid piece while getting available moves: " +
            this.board[location] +
            " (decimal)"
        );
    }

    console.log(
      "[debug] available moves for " +
        getBinaryString(this.board[location]) +
        " at " +
        location +
        ":",
      moves.map(getBinaryString)
    );
    return moves;
  }

  /**
   * Returns available moves for the given location, accounting for check
   * @returns
   */
  getAvailableMoves(location: number): number[] {
    const moves = this.getAllMoves(location);

    const finalMoves = [...moves];

    if (!this.simulation) {
      for (let move of moves) {
        this.move(move);

        if (
          ((this.board[location] & 0b1) === WHITE && this.wc) ||
          ((this.board[location] & 0b1) === BLACK && this.bc)
        ) {
          // if white continues to be checked, remove move
          finalMoves.splice(finalMoves.indexOf(move), 1);
        }

        this.undo();
      }
    }

    return finalMoves;
  }

  checkOutOfBounds(i: number, j: number): boolean {
    return i < 0 || i > 7 || j < 0 || j > 7;
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
      // console.log("[debug] not bottom row");
      // if location contains enemy piece
      if (this.board[location + 8] === 0) {
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
    if ((location & 0b111000) !== 0) {
      // console.log("[debug] not top row");
      // if location contains enemy piece
      if (this.board[location - 8] === 0) {
        moves.push(
          (location << 14) |
            ((location - 8) << 8) |
            (moveTypes.MOVE << 4) |
            piece
        );
      } else if ((this.board[location - 8] & 0b1) !== (piece & 0b1)) {
        // console.log(
        //   "[debug] pushing capture move",
        //   ((location - 8) << 8) | (moveTypes.CAPTURE << 4) | piece,
        //   getBinaryString(
        //     ((location - 8) << 8) | (moveTypes.CAPTURE << 4) | piece
        //   )
        // );
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
      if (this.board[location + 1] === 0) {
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
        if (this.board[location + 9] === 0) {
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
      if ((location & 0b111000) !== 0) {
        // moves.push(-7);
        if (this.board[location - 7] === 0) {
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

    if ((location & 0b111) !== 0) {
      // left-most column
      // moves.push(-1);
      if (this.board[location - 1] === 0) {
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
      if ((location & 0b111000) !== 0) {
        // moves.push(-9);
        if (this.board[location - 9] === 0) {
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
        if (this.board[location + 7] === 0) {
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
    if ((piece & 0b1) === 0 && this.wc === false) {
      // white king-side
      if (
        this.wcc === 0 &&
        this.board[location + 1] === 0 &&
        this.board[location + 2] === 0
      )
        moves.push(
          // ((location + 2) << 8) | (moveTypes.CASTLE_KINGSIDE << 4) | piece
          (location << 14) | (moveTypes.CASTLE_KINGSIDE << 4) | piece
        );

      // white queen-side
      if (
        this.wcc === 0 &&
        this.board[location - 1] === 0 &&
        this.board[location - 2] === 0 &&
        this.board[location - 3] === 0
      )
        moves.push(
          // ((location - 2) << 8) | (moveTypes.CASTLE_QUEENSIDE << 4) | piece
          (location << 14) | (moveTypes.CASTLE_QUEENSIDE << 4) | piece
        );
    }

    if ((piece & 0b1) === 1 && this.bc === false) {
      // black king-side
      if (
        this.bcc === 0 &&
        this.board[location + 1] === 0 &&
        this.board[location + 2] === 0
      )
        moves.push(
          // ((location + 2) << 8) | (moveTypes.CASTLE_KINGSIDE << 4) | piece
          (location << 14) | (moveTypes.CASTLE_KINGSIDE << 4) | piece
        );

      // black queen-side
      if (
        this.bcc === 0 &&
        this.board[location - 1] === 0 &&
        this.board[location - 2] === 0 &&
        this.board[location - 3] === 0
      )
        moves.push(
          // ((location - 2) << 8) | (moveTypes.CASTLE_QUEENSIDE << 4) | piece
          (location << 14) | (moveTypes.CASTLE_QUEENSIDE << 4) | piece
        );
    }

    return moves;
  }

  getKnightMoves(piece: number, location: number): number[] {
    const moves: number[] = [];

    if (location < 48) {
      if ((location & 0b111) !== 0b111)
        if (this.board[location + 17] === 0) {
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

      if ((location & 0b111) !== 0)
        if (this.board[location + 15] === 0) {
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
        if (this.board[location - 15] === 0) {
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

      if ((location & 0b111) !== 0)
        if (this.board[location - 17] === 0) {
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
        if (this.board[location + 6] === 0) {
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
        if (this.board[location - 10] === 0) {
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
        if (this.board[location + 10] === 0) {
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
        if (this.board[location - 6] === 0) {
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
      i <=
      7 -
        ((location & 0b111) > ((location >> 3) & 0b111)
          ? location & 0b111
          : (location >> 3) & 0b111);
      i++
    ) {
      if (this.board[location + 9 * i] === 0) {
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
    for (
      let i = 1;
      i <=
      7 -
        ((location & 0b111) < ((location >> 3) & 0b111)
          ? location & 0b111
          : (location >> 3) & 0b111);
      i++
    ) {
      if (this.board[location - 7 * i] === 0) {
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
      i <=
      ((location & 0b111) < ((location >> 3) & 0b111)
        ? location & 0b111
        : (location >> 3) & 0b111);
      i++
    ) {
      if (this.board[location + 7 * i] === 0) {
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
        break;
      }
    }

    // up left
    for (
      let i = 1;
      i <=
      ((location & 0b111) < ((location >> 3) & 0b111)
        ? location & 0b111
        : (location >> 3) & 0b111);
      i++
    ) {
      if (this.board[location - 9 * i] === 0) {
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

    for (let i = 1; i < 8 - (location & 0b111); i++) {
      if (this.board[location + i] === 0) {
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

    for (let i = 1; i < (location & 0b111); i++) {
      if (this.board[location - i] === 0) {
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

    for (let i = 1; i < 8 - (location >> 3); i++) {
      if (this.board[location + 8 * i] === 0) {
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

    for (let i = 1; i < location >> 3; i++) {
      if (this.board[location - 8 * i] === 0) {
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

    // down right
    for (
      let i = 1;
      i <=
      7 -
        ((location & 0b111) > ((location >> 3) & 0b111)
          ? location & 0b111
          : (location >> 3) & 0b111);
      i++
    ) {
      if (this.board[location + 9 * i] === 0) {
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
    for (
      let i = 1;
      i <=
      7 -
        ((location & 0b111) < ((location >> 3) & 0b111)
          ? location & 0b111
          : (location >> 3) & 0b111);
      i++
    ) {
      if (this.board[location - 7 * i] === 0) {
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
      i <=
      ((location & 0b111) < ((location >> 3) & 0b111)
        ? location & 0b111
        : (location >> 3) & 0b111);
      i++
    ) {
      if (this.board[location + 7 * i] === 0) {
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
        break;
      }
    }

    // up left
    for (
      let i = 1;
      i <=
      ((location & 0b111) < ((location >> 3) & 0b111)
        ? location & 0b111
        : (location >> 3) & 0b111);
      i++
    ) {
      if (this.board[location - 9 * i] === 0) {
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

    // how performant is this?
    return [
      ...this.getBishopMoves(piece, location),
      ...this.getRookMoves(piece, location),
    ];
  }

  getPawnMoves(piece: number, location: number): number[] {
    const moves: number[] = [];

    console.log("[debug] getPawnMoves team: " + (piece & 0b1));

    // white piece
    if ((piece & 0b1) === 0) {
      if (this.board[location - 8] === 0) {
        moves.push(
          (location << 14) |
            ((location - 8) << 8) |
            (moveTypes.MOVE << 4) |
            piece
        );

        if (location >> 3 === 6 && this.board[location - 16] === 0) {
          // double move
          moves.push(
            (location << 14) |
              ((location - 16) << 8) |
              (moveTypes.DOUBLE_PAWN_PUSH << 4) |
              piece
          );
        }
      }

      // upper left capture
      if ((location & 0b111) !== 0 && (this.board[location - 9] & 0b1) === 1)
        moves.push(
          (location << 14) |
            ((location - 9) << 8) |
            (moveTypes.CAPTURE << 4) |
            piece
        );

      // upper right capture
      if ((location & 0b111) !== 7 && (this.board[location - 7] & 0b1) === 1)
        moves.push(
          (location << 14) |
            ((location - 7) << 8) |
            (moveTypes.CAPTURE << 4) |
            piece
        );

      // promotion
      // if (location >> 3 === 1) {
      //   moves.push(
      //     ...[
      //       (location << 14) |
      //         ((location - 8) << 8) |
      //         (moveTypes.PROMOTION_QUEEN << 4) |
      //         piece,
      //       (location << 14) |
      //         ((location - 8) << 8) |
      //         (moveTypes.PROMOTION_ROOK << 4) |
      //         piece,
      //       (location << 14) |
      //         ((location - 8) << 8) |
      //         (moveTypes.PROMOTION_BISHOP << 4) |
      //         piece,
      //       (location << 14) |
      //         ((location - 8) << 8) |
      //         (moveTypes.PROMOTION_KNIGHT << 4) |
      //         piece,
      //     ]
      //   );
      // }

      // en passant
      // if (this.history.at(-1) !== 0) {
      //   if (
      //     ((this.history[this.history.length - 1] >> 4) & 0b1111) ===
      //       moveTypes.DOUBLE_PAWN_PUSH &&
      //     this.history[this.history.length - 1] >> 12 === location >> 4 &&
      //     Math.abs(
      //       ((this.history[this.history.length - 1] >> 8) & 0b111111) - location
      //     ) === 1 // performant?
      //   ) {
      //     moves.push(
      //       (location << 14) |
      //         ((((this.history[this.history.length - 1] >> 8) & 0b111111) -
      //           8) <<
      //           8) |
      //         (moveTypes.EN_PASSANT_WHITE << 4) |
      //         piece
      //     );
      //   }
      // }
    } else {
      if (this.board[location + 8] === 0) {
        moves.push(
          (location << 14) |
            ((location + 8) << 8) |
            (moveTypes.MOVE << 4) |
            piece
        );

        if (location >> 3 === 6 && this.board[location + 16] === 0) {
          // double move
          moves.push(
            (location << 14) |
              ((location + 16) << 8) |
              (moveTypes.DOUBLE_PAWN_PUSH << 4) |
              piece
          );
        }
      }

      // upper left capture
      if ((location & 0b111) !== 7 && (this.board[location + 9] & 0b1) === 0)
        moves.push(
          (location << 14) |
            ((location + 9) << 8) |
            (moveTypes.CAPTURE << 4) |
            piece
        );

      // upper right capture
      if (location & 0b111 && (this.board[location + 7] & 0b1) === 0)
        moves.push(
          (location << 14) |
            ((location + 7) << 8) |
            (moveTypes.CAPTURE << 4) |
            piece
        );

      // promotion
      // if (location >> 3 === 6) {
      //   moves.push(
      //     ...[
      //       (location << 14) |
      //         ((location + 8) << 8) |
      //         (moveTypes.PROMOTION_QUEEN << 4) |
      //         piece,
      //       (location << 14) |
      //         ((location + 8) << 8) |
      //         (moveTypes.PROMOTION_ROOK << 4) |
      //         piece,
      //       (location << 14) |
      //         ((location + 8) << 8) |
      //         (moveTypes.PROMOTION_BISHOP << 4) |
      //         piece,
      //       (location << 14) |
      //         ((location + 8) << 8) |
      //         (moveTypes.PROMOTION_KNIGHT << 4) |
      //         piece,
      //     ]
      //   );
      // }

      // en passant
      // if (this.history.at(-1) !== 0) {
      //   if (
      //     ((this.history[this.history.length - 1] >> 4) & 0b1111) ===
      //       moveTypes.DOUBLE_PAWN_PUSH &&
      //     this.history[this.history.length - 1] >> 12 === location >> 4 &&
      //     Math.abs(
      //       ((this.history[this.history.length - 1] >> 8) & 0b111111) - location
      //     ) === 1 // performant?
      //   ) {
      //     moves.push(
      //       (location << 14) |
      //         ((((this.history[this.history.length - 1] >> 8) & 0b111111) +
      //           8) <<
      //           8) |
      //         (moveTypes.EN_PASSANT_BLACK << 4) |
      //         piece
      //     );
      //   }
      // }
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
