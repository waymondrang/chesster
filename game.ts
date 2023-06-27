import {
  BLACK,
  ChessterBoard,
  ChessterGameState,
  ChessterHistory,
  ChessterLocation,
  ChessterMove,
  ChessterPiece,
  ChessterPlayer,
  ChessterTeam,
  RecursivePartial,
  WHITE,
  moveTypes,
} from "./types";
import { boardStringToBoard, dCopyState, defaultBoard } from "./util";

const boardSize = 64;

export class ChessterGame {
  r0: number; // row 0 (bottom)
  r1: number;
  r2: number;
  r3: number;
  r4: number;
  r5: number;
  r6: number;
  r7: number; // row 7 (top)
  board: Uint8Array;
  buffer: ArrayBuffer;
  white: ChessterPlayer = {
    team: WHITE,
    pieces: [],
    taken: [],
    checked: false,
    checkmated: false,
  };
  black: ChessterPlayer = {
    team: BLACK,
    pieces: [],
    taken: [],
    checked: false,
    checkmated: false,
  };
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
    this.r0 = 0b00000000000000000000000000000000;
    this.r1 = 0b00000000000000000000000000000000;
    this.r1 = 0b00000000000000000000000000000000;
    this.r1 = 0b00000000000000000000000000000000;
    this.r1 = 0b00000000000000000000000000000000;
    this.r1 = 0b00000000000000000000000000000000;
    this.r1 = 0b00000000000000000000000000000000;
    this.r1 = 0b00000000000000000000000000000000;
    this.buffer = new ArrayBuffer(boardSize);
    this.board = new Uint8Array(this.buffer);
    this.white = {
      team: WHITE,
      pieces: [],
      taken: <ChessterPiece[]>state?.white?.taken || [],
      checked: false,
      checkmated: false,
    };
    this.black = {
      team: BLACK,
      pieces: [],
      taken: <ChessterPiece[]>state?.black?.taken || [],
      checked: false,
      checkmated: false,
    };
    this.turn = <ChessterTeam>state?.turn || WHITE;
    this.history = <ChessterHistory>state?.history || [];
    this.simulation = <boolean>state?.simulation || false;

    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        let piece = this.board[i][j];

        if (piece)
          (piece.team === WHITE ? this.white.pieces : this.black.pieces).push(
            piece
          );
      }
    }

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

  isSpaceEmpty(value: number) {
    return (value & 0b1110) === 0;
  }

  move(move: ChessterMove) {
    // check if move is piece's team turn
    let piece = this.board[move.from[0]][move.from[1]];

    // validate move
    if (!piece) throw new Error("no piece at from location while moving");
    if (!this.simulation && piece.team !== this.turn)
      throw new Error("Wrong team");

    // handle special moves
    if (move.type === moveTypes.CASTLE) {
      if (!move.castle) throw new Error('castle move has no "castle" property');

      // move logic for castle
      this.board[move.castle.from[0]][move.castle.from[1]] = undefined;
      move.castle.piece.moved = true;
      move.castle.piece.location = move.castle.to;
      this.board[move.castle.to[0]][move.castle.to[1]] = move.castle.piece;

      // update player pieces
      if (move.castle.piece.team === WHITE) {
        this.white.pieces = this.white.pieces.filter(
          (p) =>
            p.location[0] !== move.castle!.from[0] ||
            p.location[1] !== move.castle!.from[1]
        );

        this.white.pieces.push(move.castle.piece);
      } else {
        this.black.pieces = this.black.pieces.filter(
          (p) =>
            p.location[0] !== move.castle!.from[0] ||
            p.location[1] !== move.castle!.from[1]
        );

        this.black.pieces.push(move.castle.piece);
      }
    } else if (
      move.type === moveTypes.CAPTURE ||
      move.type === moveTypes.EN_PASSANT
    ) {
      if (!move.capture)
        throw new Error('capture move has no "capture" property');

      let capturedPiece = this.board[move.capture[0]][move.capture[1]]!;

      this.board[move.capture[0]][move.capture[1]] = undefined;

      if (capturedPiece.team === WHITE) {
        this.black.taken.push(capturedPiece);

        // remove capture piece using filter and location
        this.white.pieces = this.white.pieces.filter(
          (p) =>
            p.location[0] !== move.capture![0] ||
            p.location[1] !== move.capture![1]
        );
      } else {
        this.white.taken.push(capturedPiece);

        this.black.pieces = this.black.pieces.filter(
          (p) =>
            p.location[0] !== move.capture![0] ||
            p.location[1] !== move.capture![1]
        );
      }
    } else if (move.type === moveTypes.PROMOTION) {
      if (!move.promotion)
        throw new Error('promotion move has no "promotion" property');
      piece.string = move.promotion;

      if (piece.team === WHITE) {
        this.white.pieces = this.white.pieces.filter(
          (p) =>
            p.location[0] !== move.from[0] || p.location[1] !== move.from[1]
        );

        this.white.pieces.push(piece);
      } else {
        this.black.pieces = this.black.pieces.filter(
          (p) =>
            p.location[0] !== move.from[0] || p.location[1] !== move.from[1]
        );

        this.black.pieces.push(piece);
      }
    }

    // set piece to move, set respective squares to undefined
    this.board[move.from[0]][move.from[1]] = undefined;
    piece.moved = true;
    piece.location = move.to;
    this.board[move.to[0]][move.to[1]] = piece;

    // add move to history
    this.history.push(move);

    // update checked
    this.updateChecked();

    // update turn
    this.turn = this.turn === WHITE ? BLACK : WHITE;
  }

  /**
   * Checks that the given move is valid and moves the piece if it is
   * @param moveData The move data to validate and move
   * @returns Whether the move was valid and the piece was moved
   */
  validateAndMove(moveData: ChessterMove): void {
    const { from, to, type } = moveData;
    const validatePiece = this.board[from[0]][from[1]];

    if (!validatePiece) throw new Error("No piece at from location");

    const move = this.getAvailableMoves(validatePiece).find((move) => {
      return (
        move.to[0] === to[0] &&
        move.to[1] === to[1] &&
        move.type === type &&
        move.promotion === moveData.promotion
      );
    });

    if (!move) throw new Error("Invalid move: " + JSON.stringify(moveData));

    this.move(move);
  }

  /**
   * Creates a printable string of the board
   * @returns The board as a string
   */
  boardToString(): string {
    let boardString = "";
    for (let i = this.board.length; i > 0; i--) {
      let row = "";
      for (let j = 0; j < this.board[i - 1].length; j++) {
        row += (this.board[j][i - 1]?.string || " ") + " ";
      }
      boardString += row + "\n";
    }
    return boardString;
  }

  moveToString(move: ChessterMove): string {
    let moveString = "";
    if (move.type === moveTypes.CASTLE) {
      moveString += "castle:";
      moveString += " piece: [" + move.castle?.piece.string + "]";
      moveString += " castle from: [" + move.castle?.from.join(",") + "]";
      moveString += " castle to: [" + move.castle?.to.join(",") + "]";
    } else if (move.type === moveTypes.CAPTURE) {
      moveString += "capture:";
      moveString +=
        " piece: [" + this.board[move.capture![0]][move.capture![1]] + "]";
    } else if (move.type === moveTypes.EN_PASSANT) {
      moveString += "capture (en passant):";
      moveString +=
        " piece: [" + this.board[move.capture![0]][move.capture![1]] + "]";
    } else {
      moveString += "move:";
    }
    moveString += " from: [" + move.from.join(",") + "]";
    moveString += " to: [" + move.to.join(",") + "]";
    return moveString;
  }

  updateChecked() {
    this.white.checked = this.isChecked(WHITE);
    this.black.checked = this.isChecked(BLACK);
    // updateChecked runs after turn is updated
    if (this.white.checked) this.white.checkmated = this.isCheckmated(WHITE);
    if (this.black.checked) this.black.checkmated = this.isCheckmated(BLACK);
  }

  /**
   * Is the king under attack?
   * @param team The team to check
   * @returns Whether the given team is checked
   */
  isChecked(team: ChessterTeam): boolean {
    // if any enemy move can capture the king, the team is checked
    for (let piece of (team === WHITE ? this.black : this.white).pieces) {
      let moves = this.getAllMoves(piece);
      for (let move of moves) {
        if (
          move.type === moveTypes.CAPTURE &&
          (this.board[move.capture![0]][move.capture![1]]?.string === "♚" || // TODO: this is sorta naive, maybe track location of king?
            this.board[move.capture![0]][move.capture![1]]?.string === "♔")
        ) {
          return true;
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
    for (let piece of (team === WHITE ? this.white : this.black).pieces) {
      if (this.getAvailableMoves(piece).length > 0) {
        return false;
      }
    }
    return true;
  }

  /**
   * now incorporates dCopyState
   * @returns
   */
  getState(): ChessterGameState {
    let newBoard: ChessterPiece[][] = [[], [], [], [], [], [], [], []];
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        if (this.board[i][j])
          newBoard[i][j] = {
            location: [
              this.board[i][j]!.location[0],
              this.board[i][j]!.location[1],
            ],
            string: this.board[i][j]!.string,
            team: this.board[i][j]!.team,
            moved: this.board[i][j]!.moved,
          };
      }
    }
    let newWhite: ChessterPlayer = {
      pieces: [],
      taken: [],
      checked: this.white.checked,
      checkmated: this.white.checkmated,
      team: WHITE,
    };
    let newBlack: ChessterPlayer = {
      pieces: [],
      taken: [],
      checked: this.black.checked,
      checkmated: this.black.checkmated,
      team: BLACK,
    };

    for (let piece of this.white.pieces) {
      newWhite.pieces.push({
        location: [piece.location[0], piece.location[1]],
        string: piece.string,
        team: piece.team,
        moved: piece.moved,
      });
    }

    for (let piece of this.white.taken) {
      newWhite.taken.push({
        location: [piece.location[0], piece.location[1]],
        string: piece.string,
        team: piece.team,
        moved: piece.moved,
      });
    }

    for (let piece of this.black.pieces) {
      newBlack.pieces.push({
        location: [piece.location[0], piece.location[1]],
        string: piece.string,
        team: piece.team,
        moved: piece.moved,
      });
    }

    for (let piece of this.black.taken) {
      newBlack.taken.push({
        location: [piece.location[0], piece.location[1]],
        string: piece.string,
        team: piece.team,
        moved: piece.moved,
      });
    }

    let newHistory: ChessterMove[] = [];

    for (let move of this.history) {
      newHistory.push({
        from: [move.from[0], move.from[1]],
        to: [move.to[0], move.to[1]],
        type: move.type,
        capture: move.capture ? [move.capture[0], move.capture[1]] : undefined,
        castle: move.castle
          ? {
              from: [move.castle.from[0], move.castle.from[1]],
              to: [move.castle.to[0], move.castle.to[1]],
              piece: {
                location: [
                  move.castle.piece.location[0],
                  move.castle.piece.location[1],
                ],
                string: move.castle.piece.string,
                team: move.castle.piece.team,
                moved: move.castle.piece.moved,
              },
            }
          : undefined,
        promotion: move.promotion,
      });
    }

    return {
      board: newBoard,
      turn: this.turn,
      white: newWhite,
      black: newBlack,
      history: newHistory,
      simulation: this.simulation,
    };
  }

  /**
   * Creates a simulation (copy) of the current game?
   */
  static createSimulation(game: ChessterGame): ChessterGame {
    let simulation = <ChessterGame>(
      Object.assign(Object.create(Object.getPrototypeOf(game)), game)
    );
    simulation.simulation = true;
    return simulation;
  }

  getAllMoves(piece: ChessterPiece): ChessterMove[] {
    let moves: ChessterMove[] = [];
    switch (piece.string) {
      case "♔":
      case "♚":
        moves = this.getKingMoves(piece);
        break;
      case "♕":
      case "♛":
        moves = this.getQueenMoves(piece);
        break;
      case "♗":
      case "♝":
        moves = this.getBishopMoves(piece);
        break;
      case "♘":
      case "♞":
        moves = this.getKnightMoves(piece);
        break;
      case "♖":
      case "♜":
        moves = this.getRookMoves(piece);
        break;
      case "♙":
      case "♟︎":
        moves = this.getPawnMoves(piece);
        break;
      default:
        throw new Error(
          "Invalid piece while getting available moves: " + piece.string
        );
    }
    return moves;
  }

  /**
   * Returns available moves for the given piece, accounting for check
   * @returns
   */
  getAvailableMoves(piece: ChessterPiece): ChessterMove[] {
    const moves = this.getAllMoves(piece);

    const simulator = new ChessterGame();
    const finalMoves = [...moves];
    const gameState = this.getState();

    if (!this.simulation) {
      for (let move of moves) {
        simulator.init({
          ...dCopyState(gameState),
          simulation: true,
        });

        simulator.move(move);

        if (
          (piece.team === WHITE && simulator.white.checked) ||
          (piece.team === BLACK && simulator.black.checked)
        ) {
          // if white continues to be checked, remove move
          finalMoves.splice(finalMoves.indexOf(move), 1);
        }
      }
    }

    return finalMoves;
  }

  checkOutOfBounds(i: number, j: number): boolean {
    return i < 0 || i > 7 || j < 0 || j > 7;
  }

  getKingMoves(piece: ChessterPiece): ChessterMove[] {
    const moves: ChessterMove[] = [];

    for (let i = -1; i < 2; i++) {
      for (let j = -1; j < 2; j++) {
        if (
          (i === 0 && j === 0) ||
          this.checkOutOfBounds(piece.location[0] + i, piece.location[1] + j)
        )
          continue;
        let moveLocation =
          this.board[piece.location[0] + i][piece.location[1] + j];
        if (!moveLocation) {
          // distinguish move and capture
          moves.push({
            from: piece.location,
            to: [piece.location[0] + i, piece.location[1] + j],
            type: moveTypes.MOVE,
          });
        } else if (piece.team !== moveLocation.team) {
          moves.push({
            from: piece.location,
            to: [piece.location[0] + i, piece.location[1] + j],
            type: moveTypes.CAPTURE,
            capture: [piece.location[0] + i, piece.location[1] + j],
          });
        }
      }
    }

    // castling
    if (
      piece.team === WHITE &&
      piece.location[1] === 0 &&
      piece.location[0] === 4 &&
      piece.moved === false
    ) {
      const left = this.board[0][0];
      const right = this.board[7][0];
      if (left?.string === "♖" && left.moved === false) {
        if (!this.board[1][0] && !this.board[2][0] && !this.board[3][0]) {
          moves.push({
            from: piece.location,
            to: [2, 0],
            type: moveTypes.CASTLE,
            castle: {
              from: [0, 0],
              to: [3, 0],
              // piece: dCopy(left),
              piece: {
                string: "♖",
                team: WHITE,
                location: [0, 0],
                moved: false,
              },
            },
          });
        }
      }
      if (right?.string === "♖" && right.moved === false) {
        if (!this.board[5][0] && !this.board[6][0]) {
          moves.push({
            from: piece.location,
            to: [6, 0],
            type: moveTypes.CASTLE,
            castle: {
              from: [7, 0],
              to: [5, 0],
              // piece: dCopy(right),
              piece: {
                string: "♖",
                team: WHITE,
                location: [7, 0],
                moved: false,
              },
            },
          });
        }
      }
    }

    if (
      piece.team === BLACK &&
      piece.location[1] === 7 &&
      piece.location[0] === 4 &&
      piece.moved === false
    ) {
      const left = this.board[0][7];
      const right = this.board[7][7];

      if (left?.string === "♜" && left.moved === false) {
        if (!this.board[1][7] && !this.board[2][7] && !this.board[3][7]) {
          moves.push({
            from: piece.location,
            to: [2, 7],
            type: moveTypes.CASTLE,
            castle: {
              from: [0, 7],
              to: [3, 7],
              // piece: dCopy(left),
              piece: {
                string: "♜",
                team: BLACK,
                location: [0, 7],
                moved: false,
              },
            },
          });
        }
      }

      if (right?.string === "♜" && right.moved === false) {
        if (!this.board[5][7] && !this.board[6][7]) {
          moves.push({
            from: piece.location,
            to: [6, 7],
            type: moveTypes.CASTLE,
            castle: {
              from: [7, 7],
              to: [5, 7],
              // piece: dCopy(right),
              piece: {
                string: "♜",
                team: BLACK,
                location: [7, 7],
                moved: false,
              },
            },
          });
        }
      }
    }

    return moves;
  }

  getKnightMoves(piece: ChessterPiece): ChessterMove[] {
    const moves: ChessterMove[] = [];

    for (let i = -2; i < 3; i++) {
      if (i === 0) continue;
      for (let j = -2; j < 3; j++) {
        if (
          j === 0 ||
          Math.abs(i) === Math.abs(j) ||
          this.checkOutOfBounds(piece.location[0] + i, piece.location[1] + j)
        )
          continue;
        const location =
          this.board[piece.location[0] + i][piece.location[1] + j];
        if (!location)
          moves.push({
            from: piece.location,
            to: [piece.location[0] + i, piece.location[1] + j],
            type: moveTypes.MOVE,
          });
        else if (location.team !== piece.team)
          moves.push({
            from: piece.location,
            to: [piece.location[0] + i, piece.location[1] + j],
            type: moveTypes.CAPTURE,
            capture: [piece.location[0] + i, piece.location[1] + j],
          });
      }
    }

    return moves;
  }

  getRookMoves(piece: ChessterPiece): ChessterMove[] {
    const moves: ChessterMove[] = [];

    for (let i = 1; i < 8; i++) {
      if (this.checkOutOfBounds(piece.location[0] + i, piece.location[1]))
        break;
      let location = this.board[piece.location[0] + i][piece.location[1]];
      if (!location)
        moves.push({
          from: piece.location,
          to: [piece.location[0] + i, piece.location[1]],
          type: moveTypes.MOVE,
        });
      else if (location.team !== piece.team) {
        moves.push({
          from: piece.location,
          to: [piece.location[0] + i, piece.location[1]],
          type: moveTypes.CAPTURE,
          capture: [piece.location[0] + i, piece.location[1]],
        });
        break;
      } else break;
    }

    for (let i = 1; i < 8; i++) {
      if (this.checkOutOfBounds(piece.location[0] - i, piece.location[1]))
        break;
      let location = this.board[piece.location[0] - i][piece.location[1]];
      if (!location)
        moves.push({
          from: piece.location,
          to: [piece.location[0] - i, piece.location[1]],
          type: moveTypes.MOVE,
        });
      else if (location.team !== piece.team) {
        moves.push({
          from: piece.location,
          to: [piece.location[0] - i, piece.location[1]],
          type: moveTypes.CAPTURE,
          capture: [piece.location[0] - i, piece.location[1]],
        });
        break;
      } else break;
    }

    for (let i = 1; i < 8; i++) {
      if (this.checkOutOfBounds(piece.location[0], piece.location[1] + i))
        break;
      let location = this.board[piece.location[0]][piece.location[1] + i];
      if (!location)
        moves.push({
          from: piece.location,
          to: [piece.location[0], piece.location[1] + i],
          type: moveTypes.MOVE,
        });
      else if (location.team !== piece.team) {
        moves.push({
          from: piece.location,
          to: [piece.location[0], piece.location[1] + i],
          type: moveTypes.CAPTURE,
          capture: [piece.location[0], piece.location[1] + i],
        });
        break;
      } else break;
    }

    for (let i = 1; i < 8; i++) {
      if (this.checkOutOfBounds(piece.location[0], piece.location[1] - i))
        break;
      let location = this.board[piece.location[0]][piece.location[1] - i];
      if (!location)
        moves.push({
          from: piece.location,
          to: [piece.location[0], piece.location[1] - i],
          type: moveTypes.MOVE,
        });
      else if (location.team !== piece.team) {
        moves.push({
          from: piece.location,
          to: [piece.location[0], piece.location[1] - i],
          type: moveTypes.CAPTURE,
          capture: [piece.location[0], piece.location[1] - i],
        });
        break;
      } else break;
    }

    return moves;
  }

  getBishopMoves(piece: ChessterPiece): ChessterMove[] {
    const moves: ChessterMove[] = [];

    for (let i = 1; i < 8; i++) {
      if (this.checkOutOfBounds(piece.location[0] + i, piece.location[1] + i))
        break;
      let location = this.board[piece.location[0] + i][piece.location[1] + i];
      if (!location)
        moves.push({
          from: piece.location,
          to: [piece.location[0] + i, piece.location[1] + i],
          type: moveTypes.MOVE,
        });
      else if (location.team !== piece.team) {
        moves.push({
          from: piece.location,
          to: [piece.location[0] + i, piece.location[1] + i],
          type: moveTypes.CAPTURE,
          capture: [piece.location[0] + i, piece.location[1] + i],
        });
        break;
      } else break;
    }

    for (let i = 1; i < 8; i++) {
      if (this.checkOutOfBounds(piece.location[0] + i, piece.location[1] - i))
        break;
      let location = this.board[piece.location[0] + i][piece.location[1] - i];
      if (!location)
        moves.push({
          from: piece.location,
          to: [piece.location[0] + i, piece.location[1] - i],
          type: moveTypes.MOVE,
        });
      else if (location.team !== piece.team) {
        moves.push({
          from: piece.location,
          to: [piece.location[0] + i, piece.location[1] - i],
          type: moveTypes.CAPTURE,
          capture: [piece.location[0] + i, piece.location[1] - i],
        });
        break;
      } else break;
    }

    for (let i = 1; i < 8; i++) {
      if (this.checkOutOfBounds(piece.location[0] - i, piece.location[1] + i))
        break;
      let location = this.board[piece.location[0] - i][piece.location[1] + i];

      if (!location)
        moves.push({
          from: piece.location,
          to: [piece.location[0] - i, piece.location[1] + i],
          type: moveTypes.MOVE,
        });
      else if (location.team !== piece.team) {
        moves.push({
          from: piece.location,
          to: [piece.location[0] - i, piece.location[1] + i],
          type: moveTypes.CAPTURE,
          capture: [piece.location[0] - i, piece.location[1] + i],
        });
        break;
      } else break;
    }

    for (let i = 1; i < 8; i++) {
      if (this.checkOutOfBounds(piece.location[0] - i, piece.location[1] - i))
        break;
      let location = this.board[piece.location[0] - i][piece.location[1] - i];
      if (!location)
        moves.push({
          from: piece.location,
          to: [piece.location[0] - i, piece.location[1] - i],
          type: moveTypes.MOVE,
        });
      else if (location.team !== piece.team) {
        moves.push({
          from: piece.location,
          to: [piece.location[0] - i, piece.location[1] - i],
          type: moveTypes.CAPTURE,
          capture: [piece.location[0] - i, piece.location[1] - i],
        });
        break;
      } else break;
    }

    return moves;
  }

  getQueenMoves(piece: ChessterPiece): ChessterMove[] {
    const moves: ChessterMove[] = [];

    for (let i = 1; i < 8; i++) {
      if (this.checkOutOfBounds(piece.location[0] + i, piece.location[1]))
        break;
      let location = this.board[piece.location[0] + i][piece.location[1]];
      if (!location)
        moves.push({
          from: piece.location,
          to: [piece.location[0] + i, piece.location[1]],
          type: moveTypes.MOVE,
        });
      else if (location.team !== piece.team) {
        moves.push({
          from: piece.location,
          to: [piece.location[0] + i, piece.location[1]],
          type: moveTypes.CAPTURE,
          capture: [piece.location[0] + i, piece.location[1]],
        });
        break;
      } else break;
    }

    for (let i = 1; i < 8; i++) {
      if (this.checkOutOfBounds(piece.location[0] - i, piece.location[1]))
        break;
      let location = this.board[piece.location[0] - i][piece.location[1]];
      if (!location)
        moves.push({
          from: piece.location,
          to: [piece.location[0] - i, piece.location[1]],
          type: moveTypes.MOVE,
        });
      else if (location.team !== piece.team) {
        moves.push({
          from: piece.location,
          to: [piece.location[0] - i, piece.location[1]],
          type: moveTypes.CAPTURE,
          capture: [piece.location[0] - i, piece.location[1]],
        });
        break;
      } else break;
    }

    for (let i = 1; i < 8; i++) {
      if (this.checkOutOfBounds(piece.location[0], piece.location[1] + i))
        break;
      let location = this.board[piece.location[0]][piece.location[1] + i];
      if (!location)
        moves.push({
          from: piece.location,
          to: [piece.location[0], piece.location[1] + i],
          type: moveTypes.MOVE,
        });
      else if (location.team !== piece.team) {
        moves.push({
          from: piece.location,
          to: [piece.location[0], piece.location[1] + i],
          type: moveTypes.CAPTURE,
          capture: [piece.location[0], piece.location[1] + i],
        });
        break;
      } else break;
    }

    for (let i = 1; i < 8; i++) {
      if (this.checkOutOfBounds(piece.location[0], piece.location[1] - i))
        break;
      let location = this.board[piece.location[0]][piece.location[1] - i];
      if (!location)
        moves.push({
          from: piece.location,
          to: [piece.location[0], piece.location[1] - i],
          type: moveTypes.MOVE,
        });
      else if (location.team !== piece.team) {
        moves.push({
          from: piece.location,
          to: [piece.location[0], piece.location[1] - i],
          type: moveTypes.CAPTURE,
          capture: [piece.location[0], piece.location[1] - i],
        });
        break;
      } else break;
    }

    for (let i = 1; i < 8; i++) {
      if (this.checkOutOfBounds(piece.location[0] + i, piece.location[1] + i))
        break;
      let location = this.board[piece.location[0] + i][piece.location[1] + i];
      if (!location)
        moves.push({
          from: piece.location,
          to: [piece.location[0] + i, piece.location[1] + i],
          type: moveTypes.MOVE,
        });
      else if (location.team !== piece.team) {
        moves.push({
          from: piece.location,
          to: [piece.location[0] + i, piece.location[1] + i],
          type: moveTypes.CAPTURE,
          capture: [piece.location[0] + i, piece.location[1] + i],
        });
        break;
      } else break;
    }

    for (let i = 1; i < 8; i++) {
      if (this.checkOutOfBounds(piece.location[0] - i, piece.location[1] - i))
        break;
      let location = this.board[piece.location[0] - i][piece.location[1] - i];
      if (!location)
        moves.push({
          from: piece.location,
          to: [piece.location[0] - i, piece.location[1] - i],
          type: moveTypes.MOVE,
        });
      else if (location.team !== piece.team) {
        moves.push({
          from: piece.location,
          to: [piece.location[0] - i, piece.location[1] - i],
          type: moveTypes.CAPTURE,
          capture: [piece.location[0] - i, piece.location[1] - i],
        });
        break;
      } else break;
    }

    for (let i = 1; i < 8; i++) {
      if (this.checkOutOfBounds(piece.location[0] - i, piece.location[1] + i))
        break;
      let location = this.board[piece.location[0] - i][piece.location[1] + i];

      if (!location)
        moves.push({
          from: piece.location,
          to: [piece.location[0] - i, piece.location[1] + i],
          type: moveTypes.MOVE,
        });
      else if (location.team !== piece.team) {
        moves.push({
          from: piece.location,
          to: [piece.location[0] - i, piece.location[1] + i],
          type: moveTypes.CAPTURE,
          capture: [piece.location[0] - i, piece.location[1] + i],
        });
        break;
      } else break;
    }

    for (let i = 1; i < 8; i++) {
      if (this.checkOutOfBounds(piece.location[0] + i, piece.location[1] - i))
        break;
      let location = this.board[piece.location[0] + i][piece.location[1] - i];
      if (!location)
        moves.push({
          from: piece.location,
          to: [piece.location[0] + i, piece.location[1] - i],
          type: moveTypes.MOVE,
        });
      else if (location.team !== piece.team) {
        moves.push({
          from: piece.location,
          to: [piece.location[0] + i, piece.location[1] - i],
          type: moveTypes.CAPTURE,
          capture: [piece.location[0] + i, piece.location[1] - i],
        });
        break;
      } else break;
    }

    return moves;
  }

  getPawnMoves(piece: ChessterPiece): ChessterMove[] {
    const moves: ChessterMove[] = [];
    const direction = piece.team === WHITE ? 1 : -1;

    if (
      !this.checkOutOfBounds(
        piece.location[0],
        piece.location[1] + direction
      ) &&
      !this.board[piece.location[0]][piece.location[1] + direction]
    ) {
      // check promotion here
      if (
        (piece.team === WHITE && piece.location[1] === 6) ||
        (piece.team === BLACK && piece.location[1] === 1)
      ) {
        moves.push(
          {
            from: piece.location,
            to: [piece.location[0], piece.location[1] + direction],
            type: moveTypes.PROMOTION,
            promotion: piece.team === WHITE ? "♕" : "♛",
          },
          {
            from: piece.location,
            to: [piece.location[0], piece.location[1] + direction],
            type: moveTypes.PROMOTION,
            promotion: piece.team === WHITE ? "♖" : "♜",
          },
          {
            from: piece.location,
            to: [piece.location[0], piece.location[1] + direction],
            type: moveTypes.PROMOTION,
            promotion: piece.team === WHITE ? "♗" : "♝",
          },
          {
            from: piece.location,
            to: [piece.location[0], piece.location[1] + direction],
            type: moveTypes.PROMOTION,
            promotion: piece.team === WHITE ? "♘" : "♞",
          }
        );
      } else {
        moves.push({
          from: piece.location,
          to: [piece.location[0], piece.location[1] + direction],
          type: moveTypes.MOVE,
        });

        // advancing two squares requires two vacant squares
        if (
          ((piece.team === WHITE && piece.location[1] === 1) ||
            (piece.team === BLACK && piece.location[1] === 6)) &&
          !this.board[piece.location[0]][piece.location[1] + direction * 2]
        ) {
          moves.push({
            from: piece.location,
            to: [piece.location[0], piece.location[1] + direction * 2],
            type: moveTypes.MOVE,
          });
        }
      }
    }

    if (
      !this.checkOutOfBounds(
        piece.location[0] + 1,
        piece.location[1] + direction
      )
    ) {
      let location =
        this.board[piece.location[0] + 1][piece.location[1] + direction];
      if (location && location.team !== piece.team)
        moves.push({
          from: piece.location,
          to: [piece.location[0] + 1, piece.location[1] + direction],
          type: moveTypes.CAPTURE,
          capture: [piece.location[0] + 1, piece.location[1] + direction],
        });
    }

    if (
      !this.checkOutOfBounds(
        piece.location[0] - 1,
        piece.location[1] + direction
      )
    ) {
      let location =
        this.board[piece.location[0] - 1][piece.location[1] + direction];
      if (location && location.team !== piece.team)
        moves.push({
          from: piece.location,
          to: [piece.location[0] - 1, piece.location[1] + direction],
          type: moveTypes.CAPTURE,
          capture: [piece.location[0] - 1, piece.location[1] + direction],
        });
    }

    // en passant
    let lastMove = this.history.at(-1);

    if (
      lastMove &&
      piece.team == WHITE &&
      piece.location[1] === 4 &&
      this.board[lastMove.to[0]][lastMove.to[1]]!.string === "♟︎" &&
      lastMove.from[1] === 6 &&
      lastMove.to[1] === 4 &&
      (lastMove.to[0] === piece.location[0] + 1 ||
        lastMove.to[0] === piece.location[0] - 1)
    ) {
      moves.push({
        from: piece.location,
        to: [lastMove.to[0], lastMove.to[1] + 1],
        type: moveTypes.EN_PASSANT,
        capture: [lastMove.to[0], lastMove.to[1]],
      });
    }

    if (
      lastMove &&
      piece.team == BLACK &&
      piece.location[1] === 3 &&
      this.board[lastMove.to[0]][lastMove.to[1]]!.string === "♙" &&
      lastMove.from[1] === 1 &&
      lastMove.to[1] === 3 &&
      (lastMove.to[0] === piece.location[0] + 1 ||
        lastMove.to[0] === piece.location[0] - 1)
    ) {
      moves.push({
        from: piece.location,
        to: [lastMove.to[0], lastMove.to[1] - 1],
        type: moveTypes.EN_PASSANT,
        capture: [lastMove.to[0], lastMove.to[1]],
      });
    }

    return moves;
  }

  countPiecesInBoundary(
    boundary1: ChessterLocation,
    boundary2: ChessterLocation,
    options?: { team?: ChessterTeam }
  ) {
    let count = 0;
    for (let i = boundary1[0]; i <= boundary2[0]; i++) {
      for (let j = boundary1[1]; j <= boundary2[1]; j++) {
        if (
          this.board[i][j] &&
          (options === undefined || this.board[i][j]!.team === options.team)
        ) {
          count++;
        }
      }
    }
    return count;
  }
}
