import {
  BLACK,
  ChessterBoard,
  ChessterBoardString,
  ChessterHistory,
  ChessterMove,
  ChessterPiece,
  ChessterPlayer,
  ChessterTeam,
  WHITE,
  moveTypes,
} from "./types";
import { calculateTeam, defaultBoard } from "./util";

export class ChessterGame {
  board: ChessterBoard;
  whitePlayer: ChessterPlayer;
  blackPlayer: ChessterPlayer;
  turn: ChessterTeam;
  history: ChessterHistory;
  whiteChecked: boolean; // whether white is in check
  blackChecked: boolean; // whether black is in check

  constructor() {
    this.board = [[], [], [], [], [], [], [], []];
    this.whitePlayer = {
      team: WHITE,
      pieces: [],
      taken: [],
    };
    this.blackPlayer = {
      team: BLACK,
      pieces: [],
      taken: [],
    };
    this.turn = WHITE;
    this.history = [];
    this.whiteChecked = false;
    this.blackChecked = false;
  }

  init(board: ChessterBoardString = defaultBoard) {
    this.turn = WHITE;
    this.history = [];
    this.whiteChecked = false;
    this.blackChecked = false;
    this.board = [[], [], [], [], [], [], [], []];

    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        let s = board[7 - i][j];

        if (s) {
          let piece: ChessterPiece = {
            string: s,
            moved: false,
            team: calculateTeam(s),
            location: [j, i],
          };

          this.board[j][i] = piece;

          (piece.team === WHITE
            ? this.whitePlayer.pieces
            : this.blackPlayer.pieces
          ).push(piece);
        }
      }
    }
  }

  move(move: ChessterMove) {
    // check if move is piece's team turn
    let piece = this.board[move.from[0]][move.from[1]];

    // validate move
    if (!piece) throw new Error("No piece at from location");
    if (piece.team !== this.turn) throw new Error("Wrong team");

    // handle special moves
    if (move.type === moveTypes.CASTLE) {
      if (!move.castle) throw new Error('Castle move has no "castle" property');
      // move logic for castle
      this.board[move.castle.piece.location[0]][move.castle.piece.location[1]] =
        undefined;
      move.castle.piece.moved = true;
      move.castle.piece.location = move.castle.to;
      this.board[move.castle.to[0]][move.castle.to[1]] = move.castle.piece;
    } else if (
      move.type === moveTypes.CAPTURE ||
      move.type === moveTypes.EN_PASSANT_CAPTURE
    ) {
      if (!move.capture)
        throw new Error('Capture move has no "capture" property');
      this.board[move.capture.piece.location[0]][
        move.capture.piece.location[1]
      ] = undefined;
      if (move.capture.piece.team === WHITE) {
        this.whitePlayer.pieces.splice(
          this.whitePlayer.pieces.indexOf(move.capture.piece),
          1
        );
        this.blackPlayer.taken.push(move.capture.piece);
      } else {
        this.blackPlayer.pieces.splice(
          this.blackPlayer.pieces.indexOf(move.capture.piece),
          1
        );
        this.whitePlayer.taken.push(move.capture.piece);
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
    this.whiteChecked = this.isChecked(WHITE);
    this.blackChecked = this.isChecked(BLACK);

    // update turn
    this.turn = this.turn === WHITE ? BLACK : WHITE;
  }

  /**
   * Checks that the given move is valid and moves the piece if it is
   * @param moveData The move data to validate and move
   * @returns Whether the move was valid and the piece was moved
   */
  validateAndMove(moveData: ChessterMove): boolean {
    const { piece, to, type } = moveData;
    const validatePiece = this.board[piece.location[0]][piece.location[1]];

    if (!validatePiece) return false; // no piece at from location

    // console.log(validatePiece);

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
  boardString(): string {
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

  /**
   * Checks if the given team is checked
   * @param team The team to check
   * @returns Whether the given team is checked
   */
  isChecked(team: ChessterTeam): boolean {
    for (let piece of (team === WHITE ? this.blackPlayer : this.whitePlayer)
      .pieces) {
      let moves = this.getAvailableMoves(piece);
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
   * Checks if the enemy team is checkmated
   * @param team The team to check
   * @returns Whether the enemy team is checkmated
   * @todo Implement this
   */
  checkCheckmatedEnemy(team: ChessterTeam): boolean {
    return false;
  }

  /**
   * Copies the game and creates a simulation instance
   */
  createSimulation() {
    return null;
  }

  /**
   * Returns all available moves for this piece
   * @returns
   */
  getAvailableMoves(piece: ChessterPiece): ChessterMove[] {
    // console.log("getting available moves for", piece.string);
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
                piece: left,
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
                piece: right,
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
                piece: left,
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
                piece: right,
              },
            });
          }
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
        type: moveTypes.EN_PASSANT_CAPTURE,
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
        type: moveTypes.EN_PASSANT_CAPTURE,
        capture: {
          piece: lastMove.piece,
        },
      });
    }

    return moves;
  }
}
