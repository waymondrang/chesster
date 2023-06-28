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
  wckc: number; // white can castle kingside
  wcqc: number; // white can castle queenside
  bckc: number; // black can castle kingside
  bcqc: number; // black can castle queenside
  turn: ChessterTeam = WHITE;
  history: ChessterHistory = [];
  simulation: boolean = false;
  zobristHash: number = 0;

  /**
   * Creates a new ChessterGame instance. (including init())
   */
  constructor(state?: RecursivePartial<ChessterGameState>) {
    this.init(state);
  }

  init(state?: RecursivePartial<ChessterGameState>) {
    this.board = <ChessterBoard>state?.board || defaultBoard;
    this.wc = false; // white check
    this.bc = false; // black check
    this.wcm = false; // white checkmate
    this.bcm = false; // black checkmate
    this.wckc = 0b0011; // [king moved, rook moved, bishop clear, knight clear]
    this.wcqc = 0b00111; // [king moved, rook moved, bishop clear, knight clear, queen clear]
    this.bckc = 0b0011; // [king moved, rook moved, bishop clear, knight clear]
    this.bcqc = 0b00111; // [king moved, rook moved, bishop clear, knight clear, queen clear]
    this.turn = <ChessterTeam>state?.turn || WHITE;
    this.history = <ChessterHistory>state?.history || [];
    this.simulation = <boolean>state?.simulation || false;

    this.updateChecked();

    // // todo: implement zobrist hashing
    // var zobrist = new Uint32Array(13 * 2 * 64 * 2);
    // for (let i = 0; i < zobrist.length; i++) {
    //   zobrist[i] = Math.floor(Math.random() * 1000000000);
    // }

    // var table = new Uint32Array(3 * tablesize);
  }

  updateZobristHash() {
    // todo: implement zobrist hashing
    return;
  }

  // move(move: ChessterMove) {
  //   // check if move is piece's team turn
  //   let piece = this.board[move.from[0]][move.from[1]];

  //   // validate move
  //   if (!piece) throw new Error("no piece at from location while moving");
  //   if (!this.simulation && piece.team !== this.turn)
  //     throw new Error("Wrong team");

  //   // handle special moves
  //   if (move.type === moveTypes.CASTLE) {
  //     if (!move.castle) throw new Error('castle move has no "castle" property');

  //     // move logic for castle
  //     this.board[move.castle.from[0]][move.castle.from[1]] = undefined;
  //     move.castle.piece.moved = true;
  //     move.castle.piece.location = move.castle.to;
  //     this.board[move.castle.to[0]][move.castle.to[1]] = move.castle.piece;

  //     // update player pieces
  //     if (move.castle.piece.team === WHITE) {
  //       this.white.pieces = this.white.pieces.filter(
  //         (p) =>
  //           p.location[0] !== move.castle!.from[0] ||
  //           p.location[1] !== move.castle!.from[1]
  //       );

  //       this.white.pieces.push(move.castle.piece);
  //     } else {
  //       this.black.pieces = this.black.pieces.filter(
  //         (p) =>
  //           p.location[0] !== move.castle!.from[0] ||
  //           p.location[1] !== move.castle!.from[1]
  //       );

  //       this.black.pieces.push(move.castle.piece);
  //     }
  //   } else if (
  //     move.type === moveTypes.CAPTURE ||
  //     move.type === moveTypes.EN_PASSANT
  //   ) {
  //     if (!move.capture)
  //       throw new Error('capture move has no "capture" property');

  //     let capturedPiece = this.board[move.capture[0]][move.capture[1]]!;

  //     this.board[move.capture[0]][move.capture[1]] = undefined;

  //     if (capturedPiece.team === WHITE) {
  //       this.black.taken.push(capturedPiece);

  //       // remove capture piece using filter and location
  //       this.white.pieces = this.white.pieces.filter(
  //         (p) =>
  //           p.location[0] !== move.capture![0] ||
  //           p.location[1] !== move.capture![1]
  //       );
  //     } else {
  //       this.white.taken.push(capturedPiece);

  //       this.black.pieces = this.black.pieces.filter(
  //         (p) =>
  //           p.location[0] !== move.capture![0] ||
  //           p.location[1] !== move.capture![1]
  //       );
  //     }
  //   } else if (move.type === moveTypes.PROMOTION) {
  //     if (!move.promotion)
  //       throw new Error('promotion move has no "promotion" property');
  //     piece.string = move.promotion;

  //     if (piece.team === WHITE) {
  //       this.white.pieces = this.white.pieces.filter(
  //         (p) =>
  //           p.location[0] !== move.from[0] || p.location[1] !== move.from[1]
  //       );

  //       this.white.pieces.push(piece);
  //     } else {
  //       this.black.pieces = this.black.pieces.filter(
  //         (p) =>
  //           p.location[0] !== move.from[0] || p.location[1] !== move.from[1]
  //       );

  //       this.black.pieces.push(piece);
  //     }
  //   }

  //   // set piece to move, set respective squares to undefined
  //   this.board[move.from[0]][move.from[1]] = undefined;
  //   piece.moved = true;
  //   piece.location = move.to;
  //   this.board[move.to[0]][move.to[1]] = piece;

  //   // add move to history
  //   this.history.push(move);

  //   // update checked
  //   this.updateChecked();

  //   // update turn
  //   this.turn = this.turn === WHITE ? BLACK : WHITE;
  // }

  /**
   * Checks that the given move is valid and moves the piece if it is
   * @param moveData The move data to validate and move
   * @returns Whether the move was valid and the piece was moved
   */
  // validateAndMove(moveData: ChessterMove): void {
  //   const { from, to, type } = moveData;
  //   const validatePiece = this.board[from[0]][from[1]];

  //   if (!validatePiece) throw new Error("No piece at from location");

  //   const move = this.getAvailableMoves(validatePiece).find((move) => {
  //     return (
  //       move.to[0] === to[0] &&
  //       move.to[1] === to[1] &&
  //       move.type === type &&
  //       move.promotion === moveData.promotion
  //     );
  //   });

  //   if (!move) throw new Error("Invalid move: " + JSON.stringify(moveData));

  //   this.move(move);
  // }

  /**
   * Creates a printable string of the board
   * @returns The board as a string
   */
  boardToString(): string {
    let boardString = "";
    for (let i = 0; i < boardSize; i++) {
      boardString += numberToPieceString(this.board[i]) || " ";
      if (i % 8 === 7) boardString += "\n";
    }
    return boardString;
  }

  moveToString(move: ChessterMove): string {
    return getBinaryString(move);
  }

  updateChecked() {
    this.wc = this.isChecked(WHITE);
    this.wc = this.isChecked(BLACK);
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
    for (let i = 0; i < boardSize; i++)
      if ((this.board[i] & 0b1) !== team) {
        let moves = this.getAvailableMoves(this.board[i], i);
        for (let j = 0; j < moves.length; j++)
          if ((moves[j] & 0b11110000) >> 4 === 0b1)
            if (this.board[(moves[j] & 0b11111100000000) >> 8] === 0b110)
              return true;
      }
    return true;
  }

  /**
   * Are there any moves to get out of check?
   * @param team The team to check
   * @returns Whether the enemy team is checkmated
   * @todo Implement this
   */
  isCheckmated(team: ChessterTeam): boolean {
    for (let i = 0; i < boardSize; i++)
      if ((this.board[i] & 0b1) === team)
        if (this.getAvailableMoves(this.board[i], i).length > 0) return false;
    return true;
  }

  /**
   * now incorporates dCopyState
   * @returns
   */
  // getState(): ChessterGameState {
  //   let newBoard: ChessterPiece[][] = [[], [], [], [], [], [], [], []];
  //   for (let i = 0; i < 8; i++) {
  //     for (let j = 0; j < 8; j++) {
  //       if (this.board[i][j])
  //         newBoard[i][j] = {
  //           location: [
  //             this.board[i][j]!.location[0],
  //             this.board[i][j]!.location[1],
  //           ],
  //           string: this.board[i][j]!.string,
  //           team: this.board[i][j]!.team,
  //           moved: this.board[i][j]!.moved,
  //         };
  //     }
  //   }
  //   let newWhite: ChessterPlayer = {
  //     pieces: [],
  //     taken: [],
  //     checked: this.white.checked,
  //     checkmated: this.white.checkmated,
  //     team: WHITE,
  //   };
  //   let newBlack: ChessterPlayer = {
  //     pieces: [],
  //     taken: [],
  //     checked: this.black.checked,
  //     checkmated: this.black.checkmated,
  //     team: BLACK,
  //   };

  //   for (let piece of this.white.pieces) {
  //     newWhite.pieces.push({
  //       location: [piece.location[0], piece.location[1]],
  //       string: piece.string,
  //       team: piece.team,
  //       moved: piece.moved,
  //     });
  //   }

  //   for (let piece of this.white.taken) {
  //     newWhite.taken.push({
  //       location: [piece.location[0], piece.location[1]],
  //       string: piece.string,
  //       team: piece.team,
  //       moved: piece.moved,
  //     });
  //   }

  //   for (let piece of this.black.pieces) {
  //     newBlack.pieces.push({
  //       location: [piece.location[0], piece.location[1]],
  //       string: piece.string,
  //       team: piece.team,
  //       moved: piece.moved,
  //     });
  //   }

  //   for (let piece of this.black.taken) {
  //     newBlack.taken.push({
  //       location: [piece.location[0], piece.location[1]],
  //       string: piece.string,
  //       team: piece.team,
  //       moved: piece.moved,
  //     });
  //   }

  //   let newHistory: ChessterMove[] = [];

  //   for (let move of this.history) {
  //     newHistory.push({
  //       from: [move.from[0], move.from[1]],
  //       to: [move.to[0], move.to[1]],
  //       type: move.type,
  //       capture: move.capture ? [move.capture[0], move.capture[1]] : undefined,
  //       castle: move.castle
  //         ? {
  //             from: [move.castle.from[0], move.castle.from[1]],
  //             to: [move.castle.to[0], move.castle.to[1]],
  //             piece: {
  //               location: [
  //                 move.castle.piece.location[0],
  //                 move.castle.piece.location[1],
  //               ],
  //               string: move.castle.piece.string,
  //               team: move.castle.piece.team,
  //               moved: move.castle.piece.moved,
  //             },
  //           }
  //         : undefined,
  //       promotion: move.promotion,
  //     });
  //   }

  //   return {
  //     board: newBoard,
  //     turn: this.turn,
  //     white: newWhite,
  //     black: newBlack,
  //     history: newHistory,
  //     simulation: this.simulation,
  //   };
  // }

  /**
   *
   * @param piece 4-bit integer representing the piece
   * @param location 6-bit integer representing the location of the piece
   * @returns
   */
  getAllMoves(piece: number, location: number): number[] {
    let moves: number[] = [];
    switch ((piece & 0b1110) >> 1) {
      // case 0b001:
      //   moves = this.getPawnMoves(piece, location);
      //   break;
      // case 0b010:
      //   moves = this.getKnightMoves(piece, location);
      //   break;
      // case 0b011:
      //   moves = this.getBishopMoves(piece, location);
      //   break;
      // case 0b100:
      //   moves = this.getRookMoves(piece, location);
      //   break;
      // case 0b101:
      //   moves = this.getQueenMoves(piece, location);
      //   break;
      case 0b110:
        moves = this.getKingMoves(piece, location);
        break;
      default:
        console.log("[debug] switch state incomplete in getAllMoves()");
      // throw new Error(
      //   "invalid piece while getting available moves: " + piece + " (decimal)"
      // );
    }
    return moves;
  }

  /**
   * Returns available moves for the given piece, accounting for check
   * @returns
   */
  getAvailableMoves(piece: number, location: number): number[] {
    const moves = this.getAllMoves(piece, location);

    // const simulator = new ChessterGame();
    const finalMoves = [...moves];

    // todo: implement this
    // if (!this.simulation) {
    //   for (let move of moves) {
    //     simulator.init({
    //       ...dCopyState(gameState),
    //       simulation: true,
    //     });

    //     simulator.move(move);

    //     if (
    //       (piece.team === WHITE && simulator.white.checked) ||
    //       (piece.team === BLACK && simulator.black.checked)
    //     ) {
    //       // if white continues to be checked, remove move
    //       finalMoves.splice(finalMoves.indexOf(move), 1);
    //     }
    //   }
    // }

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
      // if location contains enemy piece
      if (this.board[location + 8] === 0) {
        moves.push(((location + 8) << 8) & (moveTypes.MOVE << 4) & piece);
      } else if ((this.board[location + 8] & 0b1) !== (piece & 0b1)) {
        moves.push(((location + 8) << 8) & (moveTypes.CAPTURE << 4) & piece);
      }
      // else location contains friendly piece, do not push any move
    }

    // top row
    if ((location & 0b111000) !== 0) {
      // if location contains enemy piece
      if (this.board[location - 8] === 0) {
        moves.push(((location - 8) << 8) & (moveTypes.MOVE << 4) & piece);
      } else if ((this.board[location - 8] & 0b1) !== (piece & 0b1)) {
        moves.push(((location - 8) << 8) & (moveTypes.CAPTURE << 4) & piece);
      }
      // else location contains friendly piece, do not push any move
    }

    // right-most column
    if ((location & 0b111) !== 0b111) {
      if (this.board[location + 1] === 0) {
        moves.push(((location + 1) << 8) & (moveTypes.MOVE << 4) & piece);
      } else if ((this.board[location + 1] & 0b1) !== (piece & 0b1)) {
        moves.push(((location + 1) << 8) & (moveTypes.CAPTURE << 4) & piece);
      }

      // bottom row
      if ((location & 0b111000) !== 0b111000) {
        if (this.board[location + 9] === 0) {
          moves.push(((location + 9) << 8) & (moveTypes.MOVE << 4) & piece);
        } else if ((this.board[location + 9] & 0b1) !== (piece & 0b1)) {
          moves.push(((location + 9) << 8) & (moveTypes.CAPTURE << 4) & piece);
        }
      }

      // top row
      if ((location & 0b111000) !== 0) {
        // moves.push(-7);
        if (this.board[location - 7] === 0) {
          moves.push(((location - 7) << 8) & (moveTypes.MOVE << 4) & piece);
        } else if ((this.board[location - 7] & 0b1) !== (piece & 0b1)) {
          moves.push(((location - 7) << 8) & (moveTypes.CAPTURE << 4) & piece);
        }
      }
    }

    if ((location & 0b111) !== 0) {
      // left-most column
      // moves.push(-1);
      if (this.board[location - 1] === 0) {
        moves.push(((location - 1) << 8) & (moveTypes.MOVE << 4) & piece);
      } else if ((this.board[location - 1] & 0b1) !== (piece & 0b1)) {
        moves.push(((location - 1) << 8) & (moveTypes.CAPTURE << 4) & piece);
      }

      // top row
      if ((location & 0b111000) !== 0) {
        // moves.push(-9);
        if (this.board[location - 9] === 0) {
          moves.push(((location - 9) << 8) & (moveTypes.MOVE << 4) & piece);
        } else if ((this.board[location - 9] & 0b1) !== (piece & 0b1)) {
          moves.push(((location - 9) << 8) & (moveTypes.CAPTURE << 4) & piece);
        }
      }

      // bottom row
      if ((location & 0b111000) !== 0b111000) {
        // moves.push(7);
        if (this.board[location + 7] === 0) {
          moves.push(((location + 7) << 8) & (moveTypes.MOVE << 4) & piece);
        } else if ((this.board[location + 7] & 0b1) !== (piece & 0b1)) {
          moves.push(((location + 7) << 8) & (moveTypes.CAPTURE << 4) & piece);
        }
      }
    }

    // castling
    if ((piece & 0b1) === 0 && this.wc === false) {
      // white king-side
      if (this.wckc === 0)
        moves.push(
          ((location + 2) << 8) & (moveTypes.CASTLE_KINGSIDE << 4) & piece
        );

      // white queen-side
      if (this.wcqc === 0)
        moves.push(
          ((location - 2) << 8) & (moveTypes.CASTLE_QUEENSIDE << 4) & piece
        );
    }

    if ((piece & 0b1) === 1 && this.bc === false) {
      // black king-side
      if (this.bckc === 0)
        moves.push(
          ((location + 2) << 8) & (moveTypes.CASTLE_KINGSIDE << 4) & piece
        );

      // black queen-side
      if (this.bcqc === 0)
        moves.push(
          ((location - 2) << 8) & (moveTypes.CASTLE_QUEENSIDE << 4) & piece
        );
    }

    return moves;
  }

  // getKnightMoves(piece: ChessterPiece): ChessterMove[] {
  //   const moves: ChessterMove[] = [];

  //   for (let i = -2; i < 3; i++) {
  //     if (i === 0) continue;
  //     for (let j = -2; j < 3; j++) {
  //       if (
  //         j === 0 ||
  //         Math.abs(i) === Math.abs(j) ||
  //         this.checkOutOfBounds(piece.location[0] + i, piece.location[1] + j)
  //       )
  //         continue;
  //       const location =
  //         this.board[piece.location[0] + i][piece.location[1] + j];
  //       if (!location)
  //         moves.push({
  //           from: piece.location,
  //           to: [piece.location[0] + i, piece.location[1] + j],
  //           type: moveTypes.MOVE,
  //         });
  //       else if (location.team !== piece.team)
  //         moves.push({
  //           from: piece.location,
  //           to: [piece.location[0] + i, piece.location[1] + j],
  //           type: moveTypes.CAPTURE,
  //           capture: [piece.location[0] + i, piece.location[1] + j],
  //         });
  //     }
  //   }

  //   return moves;
  // }

  // getRookMoves(piece: ChessterPiece): ChessterMove[] {
  //   const moves: ChessterMove[] = [];

  //   for (let i = 1; i < 8; i++) {
  //     if (this.checkOutOfBounds(piece.location[0] + i, piece.location[1]))
  //       break;
  //     let location = this.board[piece.location[0] + i][piece.location[1]];
  //     if (!location)
  //       moves.push({
  //         from: piece.location,
  //         to: [piece.location[0] + i, piece.location[1]],
  //         type: moveTypes.MOVE,
  //       });
  //     else if (location.team !== piece.team) {
  //       moves.push({
  //         from: piece.location,
  //         to: [piece.location[0] + i, piece.location[1]],
  //         type: moveTypes.CAPTURE,
  //         capture: [piece.location[0] + i, piece.location[1]],
  //       });
  //       break;
  //     } else break;
  //   }

  //   for (let i = 1; i < 8; i++) {
  //     if (this.checkOutOfBounds(piece.location[0] - i, piece.location[1]))
  //       break;
  //     let location = this.board[piece.location[0] - i][piece.location[1]];
  //     if (!location)
  //       moves.push({
  //         from: piece.location,
  //         to: [piece.location[0] - i, piece.location[1]],
  //         type: moveTypes.MOVE,
  //       });
  //     else if (location.team !== piece.team) {
  //       moves.push({
  //         from: piece.location,
  //         to: [piece.location[0] - i, piece.location[1]],
  //         type: moveTypes.CAPTURE,
  //         capture: [piece.location[0] - i, piece.location[1]],
  //       });
  //       break;
  //     } else break;
  //   }

  //   for (let i = 1; i < 8; i++) {
  //     if (this.checkOutOfBounds(piece.location[0], piece.location[1] + i))
  //       break;
  //     let location = this.board[piece.location[0]][piece.location[1] + i];
  //     if (!location)
  //       moves.push({
  //         from: piece.location,
  //         to: [piece.location[0], piece.location[1] + i],
  //         type: moveTypes.MOVE,
  //       });
  //     else if (location.team !== piece.team) {
  //       moves.push({
  //         from: piece.location,
  //         to: [piece.location[0], piece.location[1] + i],
  //         type: moveTypes.CAPTURE,
  //         capture: [piece.location[0], piece.location[1] + i],
  //       });
  //       break;
  //     } else break;
  //   }

  //   for (let i = 1; i < 8; i++) {
  //     if (this.checkOutOfBounds(piece.location[0], piece.location[1] - i))
  //       break;
  //     let location = this.board[piece.location[0]][piece.location[1] - i];
  //     if (!location)
  //       moves.push({
  //         from: piece.location,
  //         to: [piece.location[0], piece.location[1] - i],
  //         type: moveTypes.MOVE,
  //       });
  //     else if (location.team !== piece.team) {
  //       moves.push({
  //         from: piece.location,
  //         to: [piece.location[0], piece.location[1] - i],
  //         type: moveTypes.CAPTURE,
  //         capture: [piece.location[0], piece.location[1] - i],
  //       });
  //       break;
  //     } else break;
  //   }

  //   return moves;
  // }

  // getBishopMoves(piece: ChessterPiece): ChessterMove[] {
  //   const moves: ChessterMove[] = [];

  //   for (let i = 1; i < 8; i++) {
  //     if (this.checkOutOfBounds(piece.location[0] + i, piece.location[1] + i))
  //       break;
  //     let location = this.board[piece.location[0] + i][piece.location[1] + i];
  //     if (!location)
  //       moves.push({
  //         from: piece.location,
  //         to: [piece.location[0] + i, piece.location[1] + i],
  //         type: moveTypes.MOVE,
  //       });
  //     else if (location.team !== piece.team) {
  //       moves.push({
  //         from: piece.location,
  //         to: [piece.location[0] + i, piece.location[1] + i],
  //         type: moveTypes.CAPTURE,
  //         capture: [piece.location[0] + i, piece.location[1] + i],
  //       });
  //       break;
  //     } else break;
  //   }

  //   for (let i = 1; i < 8; i++) {
  //     if (this.checkOutOfBounds(piece.location[0] + i, piece.location[1] - i))
  //       break;
  //     let location = this.board[piece.location[0] + i][piece.location[1] - i];
  //     if (!location)
  //       moves.push({
  //         from: piece.location,
  //         to: [piece.location[0] + i, piece.location[1] - i],
  //         type: moveTypes.MOVE,
  //       });
  //     else if (location.team !== piece.team) {
  //       moves.push({
  //         from: piece.location,
  //         to: [piece.location[0] + i, piece.location[1] - i],
  //         type: moveTypes.CAPTURE,
  //         capture: [piece.location[0] + i, piece.location[1] - i],
  //       });
  //       break;
  //     } else break;
  //   }

  //   for (let i = 1; i < 8; i++) {
  //     if (this.checkOutOfBounds(piece.location[0] - i, piece.location[1] + i))
  //       break;
  //     let location = this.board[piece.location[0] - i][piece.location[1] + i];

  //     if (!location)
  //       moves.push({
  //         from: piece.location,
  //         to: [piece.location[0] - i, piece.location[1] + i],
  //         type: moveTypes.MOVE,
  //       });
  //     else if (location.team !== piece.team) {
  //       moves.push({
  //         from: piece.location,
  //         to: [piece.location[0] - i, piece.location[1] + i],
  //         type: moveTypes.CAPTURE,
  //         capture: [piece.location[0] - i, piece.location[1] + i],
  //       });
  //       break;
  //     } else break;
  //   }

  //   for (let i = 1; i < 8; i++) {
  //     if (this.checkOutOfBounds(piece.location[0] - i, piece.location[1] - i))
  //       break;
  //     let location = this.board[piece.location[0] - i][piece.location[1] - i];
  //     if (!location)
  //       moves.push({
  //         from: piece.location,
  //         to: [piece.location[0] - i, piece.location[1] - i],
  //         type: moveTypes.MOVE,
  //       });
  //     else if (location.team !== piece.team) {
  //       moves.push({
  //         from: piece.location,
  //         to: [piece.location[0] - i, piece.location[1] - i],
  //         type: moveTypes.CAPTURE,
  //         capture: [piece.location[0] - i, piece.location[1] - i],
  //       });
  //       break;
  //     } else break;
  //   }

  //   return moves;
  // }

  // getQueenMoves(piece: ChessterPiece): ChessterMove[] {
  //   const moves: ChessterMove[] = [];

  //   for (let i = 1; i < 8; i++) {
  //     if (this.checkOutOfBounds(piece.location[0] + i, piece.location[1]))
  //       break;
  //     let location = this.board[piece.location[0] + i][piece.location[1]];
  //     if (!location)
  //       moves.push({
  //         from: piece.location,
  //         to: [piece.location[0] + i, piece.location[1]],
  //         type: moveTypes.MOVE,
  //       });
  //     else if (location.team !== piece.team) {
  //       moves.push({
  //         from: piece.location,
  //         to: [piece.location[0] + i, piece.location[1]],
  //         type: moveTypes.CAPTURE,
  //         capture: [piece.location[0] + i, piece.location[1]],
  //       });
  //       break;
  //     } else break;
  //   }

  //   for (let i = 1; i < 8; i++) {
  //     if (this.checkOutOfBounds(piece.location[0] - i, piece.location[1]))
  //       break;
  //     let location = this.board[piece.location[0] - i][piece.location[1]];
  //     if (!location)
  //       moves.push({
  //         from: piece.location,
  //         to: [piece.location[0] - i, piece.location[1]],
  //         type: moveTypes.MOVE,
  //       });
  //     else if (location.team !== piece.team) {
  //       moves.push({
  //         from: piece.location,
  //         to: [piece.location[0] - i, piece.location[1]],
  //         type: moveTypes.CAPTURE,
  //         capture: [piece.location[0] - i, piece.location[1]],
  //       });
  //       break;
  //     } else break;
  //   }

  //   for (let i = 1; i < 8; i++) {
  //     if (this.checkOutOfBounds(piece.location[0], piece.location[1] + i))
  //       break;
  //     let location = this.board[piece.location[0]][piece.location[1] + i];
  //     if (!location)
  //       moves.push({
  //         from: piece.location,
  //         to: [piece.location[0], piece.location[1] + i],
  //         type: moveTypes.MOVE,
  //       });
  //     else if (location.team !== piece.team) {
  //       moves.push({
  //         from: piece.location,
  //         to: [piece.location[0], piece.location[1] + i],
  //         type: moveTypes.CAPTURE,
  //         capture: [piece.location[0], piece.location[1] + i],
  //       });
  //       break;
  //     } else break;
  //   }

  //   for (let i = 1; i < 8; i++) {
  //     if (this.checkOutOfBounds(piece.location[0], piece.location[1] - i))
  //       break;
  //     let location = this.board[piece.location[0]][piece.location[1] - i];
  //     if (!location)
  //       moves.push({
  //         from: piece.location,
  //         to: [piece.location[0], piece.location[1] - i],
  //         type: moveTypes.MOVE,
  //       });
  //     else if (location.team !== piece.team) {
  //       moves.push({
  //         from: piece.location,
  //         to: [piece.location[0], piece.location[1] - i],
  //         type: moveTypes.CAPTURE,
  //         capture: [piece.location[0], piece.location[1] - i],
  //       });
  //       break;
  //     } else break;
  //   }

  //   for (let i = 1; i < 8; i++) {
  //     if (this.checkOutOfBounds(piece.location[0] + i, piece.location[1] + i))
  //       break;
  //     let location = this.board[piece.location[0] + i][piece.location[1] + i];
  //     if (!location)
  //       moves.push({
  //         from: piece.location,
  //         to: [piece.location[0] + i, piece.location[1] + i],
  //         type: moveTypes.MOVE,
  //       });
  //     else if (location.team !== piece.team) {
  //       moves.push({
  //         from: piece.location,
  //         to: [piece.location[0] + i, piece.location[1] + i],
  //         type: moveTypes.CAPTURE,
  //         capture: [piece.location[0] + i, piece.location[1] + i],
  //       });
  //       break;
  //     } else break;
  //   }

  //   for (let i = 1; i < 8; i++) {
  //     if (this.checkOutOfBounds(piece.location[0] - i, piece.location[1] - i))
  //       break;
  //     let location = this.board[piece.location[0] - i][piece.location[1] - i];
  //     if (!location)
  //       moves.push({
  //         from: piece.location,
  //         to: [piece.location[0] - i, piece.location[1] - i],
  //         type: moveTypes.MOVE,
  //       });
  //     else if (location.team !== piece.team) {
  //       moves.push({
  //         from: piece.location,
  //         to: [piece.location[0] - i, piece.location[1] - i],
  //         type: moveTypes.CAPTURE,
  //         capture: [piece.location[0] - i, piece.location[1] - i],
  //       });
  //       break;
  //     } else break;
  //   }

  //   for (let i = 1; i < 8; i++) {
  //     if (this.checkOutOfBounds(piece.location[0] - i, piece.location[1] + i))
  //       break;
  //     let location = this.board[piece.location[0] - i][piece.location[1] + i];

  //     if (!location)
  //       moves.push({
  //         from: piece.location,
  //         to: [piece.location[0] - i, piece.location[1] + i],
  //         type: moveTypes.MOVE,
  //       });
  //     else if (location.team !== piece.team) {
  //       moves.push({
  //         from: piece.location,
  //         to: [piece.location[0] - i, piece.location[1] + i],
  //         type: moveTypes.CAPTURE,
  //         capture: [piece.location[0] - i, piece.location[1] + i],
  //       });
  //       break;
  //     } else break;
  //   }

  //   for (let i = 1; i < 8; i++) {
  //     if (this.checkOutOfBounds(piece.location[0] + i, piece.location[1] - i))
  //       break;
  //     let location = this.board[piece.location[0] + i][piece.location[1] - i];
  //     if (!location)
  //       moves.push({
  //         from: piece.location,
  //         to: [piece.location[0] + i, piece.location[1] - i],
  //         type: moveTypes.MOVE,
  //       });
  //     else if (location.team !== piece.team) {
  //       moves.push({
  //         from: piece.location,
  //         to: [piece.location[0] + i, piece.location[1] - i],
  //         type: moveTypes.CAPTURE,
  //         capture: [piece.location[0] + i, piece.location[1] - i],
  //       });
  //       break;
  //     } else break;
  //   }

  //   return moves;
  // }

  // getPawnMoves(piece: ChessterPiece): ChessterMove[] {
  //   const moves: ChessterMove[] = [];
  //   const direction = piece.team === WHITE ? 1 : -1;

  //   if (
  //     !this.checkOutOfBounds(
  //       piece.location[0],
  //       piece.location[1] + direction
  //     ) &&
  //     !this.board[piece.location[0]][piece.location[1] + direction]
  //   ) {
  //     // check promotion here
  //     if (
  //       (piece.team === WHITE && piece.location[1] === 6) ||
  //       (piece.team === BLACK && piece.location[1] === 1)
  //     ) {
  //       moves.push(
  //         {
  //           from: piece.location,
  //           to: [piece.location[0], piece.location[1] + direction],
  //           type: moveTypes.PROMOTION,
  //           promotion: piece.team === WHITE ? "♕" : "♛",
  //         },
  //         {
  //           from: piece.location,
  //           to: [piece.location[0], piece.location[1] + direction],
  //           type: moveTypes.PROMOTION,
  //           promotion: piece.team === WHITE ? "♖" : "♜",
  //         },
  //         {
  //           from: piece.location,
  //           to: [piece.location[0], piece.location[1] + direction],
  //           type: moveTypes.PROMOTION,
  //           promotion: piece.team === WHITE ? "♗" : "♝",
  //         },
  //         {
  //           from: piece.location,
  //           to: [piece.location[0], piece.location[1] + direction],
  //           type: moveTypes.PROMOTION,
  //           promotion: piece.team === WHITE ? "♘" : "♞",
  //         }
  //       );
  //     } else {
  //       moves.push({
  //         from: piece.location,
  //         to: [piece.location[0], piece.location[1] + direction],
  //         type: moveTypes.MOVE,
  //       });

  //       // advancing two squares requires two vacant squares
  //       if (
  //         ((piece.team === WHITE && piece.location[1] === 1) ||
  //           (piece.team === BLACK && piece.location[1] === 6)) &&
  //         !this.board[piece.location[0]][piece.location[1] + direction * 2]
  //       ) {
  //         moves.push({
  //           from: piece.location,
  //           to: [piece.location[0], piece.location[1] + direction * 2],
  //           type: moveTypes.MOVE,
  //         });
  //       }
  //     }
  //   }

  //   if (
  //     !this.checkOutOfBounds(
  //       piece.location[0] + 1,
  //       piece.location[1] + direction
  //     )
  //   ) {
  //     let location =
  //       this.board[piece.location[0] + 1][piece.location[1] + direction];
  //     if (location && location.team !== piece.team)
  //       moves.push({
  //         from: piece.location,
  //         to: [piece.location[0] + 1, piece.location[1] + direction],
  //         type: moveTypes.CAPTURE,
  //         capture: [piece.location[0] + 1, piece.location[1] + direction],
  //       });
  //   }

  //   if (
  //     !this.checkOutOfBounds(
  //       piece.location[0] - 1,
  //       piece.location[1] + direction
  //     )
  //   ) {
  //     let location =
  //       this.board[piece.location[0] - 1][piece.location[1] + direction];
  //     if (location && location.team !== piece.team)
  //       moves.push({
  //         from: piece.location,
  //         to: [piece.location[0] - 1, piece.location[1] + direction],
  //         type: moveTypes.CAPTURE,
  //         capture: [piece.location[0] - 1, piece.location[1] + direction],
  //       });
  //   }

  //   // en passant
  //   let lastMove = this.history.at(-1);

  //   if (
  //     lastMove &&
  //     piece.team == WHITE &&
  //     piece.location[1] === 4 &&
  //     this.board[lastMove.to[0]][lastMove.to[1]]!.string === "♟︎" &&
  //     lastMove.from[1] === 6 &&
  //     lastMove.to[1] === 4 &&
  //     (lastMove.to[0] === piece.location[0] + 1 ||
  //       lastMove.to[0] === piece.location[0] - 1)
  //   ) {
  //     moves.push({
  //       from: piece.location,
  //       to: [lastMove.to[0], lastMove.to[1] + 1],
  //       type: moveTypes.EN_PASSANT,
  //       capture: [lastMove.to[0], lastMove.to[1]],
  //     });
  //   }

  //   if (
  //     lastMove &&
  //     piece.team == BLACK &&
  //     piece.location[1] === 3 &&
  //     this.board[lastMove.to[0]][lastMove.to[1]]!.string === "♙" &&
  //     lastMove.from[1] === 1 &&
  //     lastMove.to[1] === 3 &&
  //     (lastMove.to[0] === piece.location[0] + 1 ||
  //       lastMove.to[0] === piece.location[0] - 1)
  //   ) {
  //     moves.push({
  //       from: piece.location,
  //       to: [lastMove.to[0], lastMove.to[1] - 1],
  //       type: moveTypes.EN_PASSANT,
  //       capture: [lastMove.to[0], lastMove.to[1]],
  //     });
  //   }

  //   return moves;
  // }

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
