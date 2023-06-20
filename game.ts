import {
  BLACK,
  ChessterBoard,
  ChessterBoardString,
  ChessterGameState,
  ChessterHistory,
  ChessterMove,
  ChessterPiece,
  ChessterPlayer,
  ChessterTeam,
  RecursivePartial,
  WHITE,
  moveTypes,
} from "./types";
import { calculateTeam, dCopy, defaultBoard } from "./util";

export class ChessterGame {
  board: ChessterBoard = [[], [], [], [], [], [], [], []];
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

  constructor(state?: RecursivePartial<ChessterGameState>) {
    this.init(state);
  }

  init(state?: RecursivePartial<ChessterGameState>) {
    this.board = <ChessterBoard>state?.board || [
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      [],
    ];
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
  }

  move(move: ChessterMove) {
    // check if move is piece's team turn
    let piece = this.board[move.from[0]][move.from[1]];

    // validate move
    if (!piece) throw new Error("No piece at from location");
    if (!this.simulation && piece.team !== this.turn)
      throw new Error("Wrong team");

    // handle special moves
    if (move.type === moveTypes.CASTLE) {
      if (!move.castle) throw new Error('Castle move has no "castle" property');
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
        throw new Error('Capture move has no "capture" property');
      this.board[move.capture.piece.location[0]][
        move.capture.piece.location[1]
      ] = undefined;
      if (move.capture.piece.team === WHITE) {
        this.black.taken.push(move.capture.piece);

        // remove capture piece using filter and location
        this.white.pieces = this.white.pieces.filter(
          (p) =>
            p.location[0] !== move.capture!.piece.location[0] ||
            p.location[1] !== move.capture!.piece.location[1]
        );
      } else {
        this.white.taken.push(move.capture.piece);

        this.black.pieces = this.black.pieces.filter(
          (p) =>
            p.location[0] !== move.capture!.piece.location[0] ||
            p.location[1] !== move.capture!.piece.location[1]
        );
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
  validateAndMove(moveData: ChessterMove): boolean {
    const { from, to, type } = moveData;
    const validatePiece = this.board[from[0]][from[1]];

    if (!validatePiece) return false; // no piece at from location

    const move = this.getAvailableMoves(validatePiece).find((move) => {
      return move.to[0] === to[0] && move.to[1] === to[1] && move.type === type;
    });

    if (!move) return false; // move not available

    this.move(move);
    return true;
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
      moveString += " piece: [" + move.capture?.piece.string + "]";
    } else if (move.type === moveTypes.EN_PASSANT) {
      moveString += "capture (en passant):";
      moveString += " piece: [" + move.capture?.piece.string + "]";
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
          (move.capture?.piece.string === "♚" ||
            move.capture?.piece.string === "♔")
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

  getState(): ChessterGameState {
    return {
      board: this.board,
      turn: this.turn,
      white: this.white,
      black: this.black,
      history: this.history,
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

    if (!this.simulation) {
      for (let move of moves) {
        simulator.init({
          ...dCopy(this.getState()),
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
            piece: piece,
            from: piece.location,
            to: [piece.location[0] + i, piece.location[1] + j],
            type: moveTypes.MOVE,
          });
        } else if (piece.team !== moveLocation.team) {
          moves.push({
            piece: piece,
            from: piece.location,
            to: [piece.location[0] + i, piece.location[1] + j],
            type: moveTypes.CAPTURE,
            capture: {
              piece: moveLocation,
            },
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
            piece: piece,
            from: piece.location,
            to: [2, 0],
            type: moveTypes.CASTLE,
            castle: {
              from: [0, 0],
              to: [3, 0],
              piece: dCopy(left),
            },
          });
        }
      }
      if (right?.string === "♖" && right.moved === false) {
        if (!this.board[5][0] && !this.board[6][0]) {
          moves.push({
            piece: piece,
            from: piece.location,
            to: [6, 0],
            type: moveTypes.CASTLE,
            castle: {
              from: [7, 0],
              to: [5, 0],
              piece: dCopy(right),
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
            piece: piece,
            from: piece.location,
            to: [2, 7],
            type: moveTypes.CASTLE,
            castle: {
              from: [0, 7],
              to: [3, 7],
              piece: dCopy(left),
            },
          });
        }
      }

      if (right?.string === "♜" && right.moved === false) {
        if (!this.board[5][7] && !this.board[6][7]) {
          moves.push({
            piece: piece,
            from: piece.location,
            to: [6, 7],
            type: moveTypes.CASTLE,
            castle: {
              from: [7, 7],
              to: [5, 7],
              piece: dCopy(right),
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
            piece: piece,
            from: piece.location,
            to: [piece.location[0] + i, piece.location[1] + j],
            type: moveTypes.MOVE,
          });
        else if (location.team !== piece.team)
          moves.push({
            piece: piece,
            from: piece.location,
            to: [piece.location[0] + i, piece.location[1] + j],
            type: moveTypes.CAPTURE,
            capture: {
              piece: location,
            },
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
          piece: piece,
          from: piece.location,
          to: [piece.location[0] + i, piece.location[1]],
          type: moveTypes.MOVE,
        });
      else if (location.team !== piece.team) {
        moves.push({
          piece: piece,
          from: piece.location,
          to: [piece.location[0] + i, piece.location[1]],
          type: moveTypes.CAPTURE,
          capture: {
            piece: location,
          },
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
          piece: piece,
          from: piece.location,
          to: [piece.location[0] - i, piece.location[1]],
          type: moveTypes.MOVE,
        });
      else if (location.team !== piece.team) {
        moves.push({
          piece: piece,
          from: piece.location,
          to: [piece.location[0] - i, piece.location[1]],
          type: moveTypes.CAPTURE,
          capture: {
            piece: location,
          },
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
          piece: piece,
          from: piece.location,
          to: [piece.location[0], piece.location[1] + i],
          type: moveTypes.MOVE,
        });
      else if (location.team !== piece.team) {
        moves.push({
          piece: piece,
          from: piece.location,
          to: [piece.location[0], piece.location[1] + i],
          type: moveTypes.CAPTURE,
          capture: {
            piece: location,
          },
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
          piece: piece,
          from: piece.location,
          to: [piece.location[0], piece.location[1] - i],
          type: moveTypes.MOVE,
        });
      else if (location.team !== piece.team) {
        moves.push({
          piece: piece,
          from: piece.location,
          to: [piece.location[0], piece.location[1] - i],
          type: moveTypes.CAPTURE,
          capture: {
            piece: location,
          },
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
          piece: piece,
          from: piece.location,
          to: [piece.location[0] + i, piece.location[1] + i],
          type: moveTypes.MOVE,
        });
      else if (location.team !== piece.team) {
        moves.push({
          piece: piece,
          from: piece.location,
          to: [piece.location[0] + i, piece.location[1] + i],
          type: moveTypes.CAPTURE,
          capture: {
            piece: location,
          },
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
          piece: piece,
          from: piece.location,
          to: [piece.location[0] + i, piece.location[1] - i],
          type: moveTypes.MOVE,
        });
      else if (location.team !== piece.team) {
        moves.push({
          piece: piece,
          from: piece.location,
          to: [piece.location[0] + i, piece.location[1] - i],
          type: moveTypes.CAPTURE,
          capture: {
            piece: location,
          },
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
          piece: piece,
          from: piece.location,
          to: [piece.location[0] - i, piece.location[1] + i],
          type: moveTypes.MOVE,
        });
      else if (location.team !== piece.team) {
        moves.push({
          piece: piece,
          from: piece.location,
          to: [piece.location[0] - i, piece.location[1] + i],
          type: moveTypes.CAPTURE,
          capture: {
            piece: location,
          },
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
          piece: piece,
          from: piece.location,
          to: [piece.location[0] - i, piece.location[1] - i],
          type: moveTypes.MOVE,
        });
      else if (location.team !== piece.team) {
        moves.push({
          piece: piece,
          from: piece.location,
          to: [piece.location[0] - i, piece.location[1] - i],
          type: moveTypes.CAPTURE,
          capture: {
            piece: location,
          },
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
          piece: piece,
          from: piece.location,
          to: [piece.location[0] + i, piece.location[1]],
          type: moveTypes.MOVE,
        });
      else if (location.team !== piece.team) {
        moves.push({
          piece: piece,
          from: piece.location,
          to: [piece.location[0] + i, piece.location[1]],
          type: moveTypes.CAPTURE,
          capture: {
            piece: location,
          },
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
          piece: piece,
          from: piece.location,
          to: [piece.location[0] - i, piece.location[1]],
          type: moveTypes.MOVE,
        });
      else if (location.team !== piece.team) {
        moves.push({
          piece: piece,
          from: piece.location,
          to: [piece.location[0] - i, piece.location[1]],
          type: moveTypes.CAPTURE,
          capture: {
            piece: location,
          },
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
          piece: piece,
          from: piece.location,
          to: [piece.location[0], piece.location[1] + i],
          type: moveTypes.MOVE,
        });
      else if (location.team !== piece.team) {
        moves.push({
          piece: piece,
          from: piece.location,
          to: [piece.location[0], piece.location[1] + i],
          type: moveTypes.CAPTURE,
          capture: {
            piece: location,
          },
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
          piece: piece,
          from: piece.location,
          to: [piece.location[0], piece.location[1] - i],
          type: moveTypes.MOVE,
        });
      else if (location.team !== piece.team) {
        moves.push({
          piece: piece,
          from: piece.location,
          to: [piece.location[0], piece.location[1] - i],
          type: moveTypes.CAPTURE,
          capture: {
            piece: location,
          },
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
          piece: piece,
          from: piece.location,
          to: [piece.location[0] + i, piece.location[1] + i],
          type: moveTypes.MOVE,
        });
      else if (location.team !== piece.team) {
        moves.push({
          piece: piece,
          from: piece.location,
          to: [piece.location[0] + i, piece.location[1] + i],
          type: moveTypes.CAPTURE,
          capture: {
            piece: location,
          },
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
          piece: piece,
          from: piece.location,
          to: [piece.location[0] - i, piece.location[1] - i],
          type: moveTypes.MOVE,
        });
      else if (location.team !== piece.team) {
        moves.push({
          piece: piece,
          from: piece.location,
          to: [piece.location[0] - i, piece.location[1] - i],
          type: moveTypes.CAPTURE,
          capture: {
            piece: location,
          },
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
          piece: piece,
          from: piece.location,
          to: [piece.location[0] - i, piece.location[1] + i],
          type: moveTypes.MOVE,
        });
      else if (location.team !== piece.team) {
        moves.push({
          piece: piece,
          from: piece.location,
          to: [piece.location[0] - i, piece.location[1] + i],
          type: moveTypes.CAPTURE,
          capture: {
            piece: location,
          },
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
          piece: piece,
          from: piece.location,
          to: [piece.location[0] + i, piece.location[1] - i],
          type: moveTypes.MOVE,
        });
      else if (location.team !== piece.team) {
        moves.push({
          piece: piece,
          from: piece.location,
          to: [piece.location[0] + i, piece.location[1] - i],
          type: moveTypes.CAPTURE,
          capture: {
            piece: location,
          },
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
      moves.push({
        piece: piece,
        from: piece.location,
        to: [piece.location[0], piece.location[1] + direction],
        type: moveTypes.MOVE,
      });

      // advancing two squares requires two vacant squares
      if (
        (piece.location[1] === 1 || piece.location[1] === 6) &&
        !this.board[piece.location[0]][piece.location[1] + direction * 2]
      ) {
        moves.push({
          piece: piece,
          from: piece.location,
          to: [piece.location[0], piece.location[1] + direction * 2],
          type: moveTypes.MOVE,
        });
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
          piece: piece,
          from: piece.location,
          to: [piece.location[0] + 1, piece.location[1] + direction],
          type: moveTypes.CAPTURE,
          capture: {
            piece: location,
          },
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
          piece: piece,
          from: piece.location,
          to: [piece.location[0] - 1, piece.location[1] + direction],
          type: moveTypes.CAPTURE,
          capture: {
            piece: location,
          },
        });
    }

    // en passant
    let lastMove = this.history.at(-1);

    if (
      lastMove &&
      piece.team == WHITE &&
      piece.location[1] === 4 &&
      lastMove.piece.string === "♟︎" &&
      lastMove.from[1] === 6 &&
      lastMove.to[1] === 4 &&
      (lastMove.to[0] === piece.location[0] + 1 ||
        lastMove.to[0] === piece.location[0] - 1)
    ) {
      moves.push({
        piece: piece,
        from: piece.location,
        to: [lastMove.to[0], lastMove.to[1] + 1],
        type: moveTypes.EN_PASSANT,
        capture: {
          piece: lastMove.piece,
        },
      });
    }

    if (
      lastMove &&
      piece.team == BLACK &&
      piece.location[1] === 3 &&
      lastMove.piece.string === "♙" &&
      lastMove.from[1] === 1 &&
      lastMove.to[1] === 3 &&
      (lastMove.to[0] === piece.location[0] + 1 ||
        lastMove.to[0] === piece.location[0] - 1)
    ) {
      moves.push({
        piece: piece,
        from: piece.location,
        to: [lastMove.to[0], lastMove.to[1] - 1],
        type: moveTypes.EN_PASSANT,
        capture: {
          piece: lastMove.piece,
        },
      });
    }

    return moves;
  }
}
