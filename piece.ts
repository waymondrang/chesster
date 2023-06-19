import { ChessterBoard } from "./board";
import { ChessterLocation } from "./location";
import { ChessterMove } from "./move";
import { BLACK, WHITE, location, moveTypes, piece, team } from "./types";
import { calculateTeam } from "./util";

export class ChessterPiece {
  piece: piece;
  team: team;
  location: ChessterLocation;
  #board: ChessterBoard;
  moved: boolean;
  taken: boolean;

  constructor(location: ChessterLocation, piece: piece) {
    this.#board = location.board;
    this.location = location;
    this.piece = piece;
    this.team = calculateTeam(piece);
    this.moved = false;
    this.taken = false;
  }

  getTeam() {
    return this.team;
  }

  move(location1: ChessterLocation, location2: ChessterLocation) {
    location1.setPiece(undefined);
    location2.setPiece(this);
    this.moved = true;
    // this.location = location2; // this is handled by setPiece
  }

  isEnemy(piece: ChessterPiece): boolean {
    return this.team !== piece.team;
  }

  isAlly(piece: ChessterPiece): boolean {
    return this.team === piece.team;
  }

  /**
   * Returns all available moves for this piece
   * @returns
   */
  getAvailableMoves(): ChessterMove[] {
    let moves: ChessterMove[] = [];
    switch (this.piece) {
      case "♔":
      case "♚":
        moves = this.getKingMoves();
        break;
      case "♕":
      case "♛":
        moves = this.getQueenMoves();
        break;
      case "♗":
      case "♝":
        moves = this.getBishopMoves();
        break;
      case "♘":
      case "♞":
        moves = this.getKnightMoves();
        break;
      case "♖":
      case "♜":
        moves = this.getRookMoves();
        break;
      case "♙":
      case "♟︎":
        moves = this.getPawnMoves();
        break;
      default:
        throw new Error("Invalid piece: " + this.piece);
    }

    if (this.team === WHITE && this.#board.game.whiteChecked) {
      let blackMoves = this.#board.game.black.pieces.flatMap((piece) =>
        piece.getAvailableMoves()
      );
      moves = moves.filter((move) => !blackMoves.includes(move));
    } else if (this.team === BLACK && this.#board.game.blackChecked) {
      let whiteMoves = this.#board.game.white.pieces.flatMap((piece) =>
        piece.getAvailableMoves()
      );
      moves = moves.filter((move) => !whiteMoves.includes(move));
    }

    return moves;
  }

  getAvailableMovesWithPerformance(): [ChessterMove[], number] {
    const start = performance.now();
    const moves = this.getAvailableMoves();
    const end = performance.now();
    return [moves, end - start];
  }

  checkOutOfBounds(i: number, j: number): boolean {
    return i < 0 || i > 7 || j < 0 || j > 7;
  }

  getKingMoves(): ChessterMove[] {
    const moves: ChessterMove[] = [];

    for (let i = -1; i < 2; i++) {
      for (let j = -1; j < 2; j++) {
        if (i === 0 && j === 0) continue;
        let location = this.#board.get([
          this.location.x + i,
          this.location.y + j,
        ]);
        if (!location) continue;
        if (location.empty)
          // distinguish move and capture
          moves.push(
            new ChessterMove(this, this.location, location!, moveTypes.MOVE)
          );
        else if (this.isEnemy(location.piece!))
          moves.push(
            new ChessterMove(
              this,
              this.location,
              location!,
              moveTypes.CAPTURE,
              {
                take: location.piece!,
              }
            )
          );
      }
    }

    // castling
    if (
      this.team === WHITE &&
      this.location.y === 0 &&
      this.location.x === 4 &&
      this.moved === false
    ) {
      const left = this.#board.get([0, 0]);
      const right = this.#board.get([7, 0]);
      if (left?.piece?.piece === "♖" && left.piece.moved === false) {
        if (
          this.#board.get([1, 0])?.empty &&
          this.#board.get([2, 0])?.empty &&
          this.#board.get([3, 0])?.empty
        ) {
          moves.push(
            new ChessterMove(
              this,
              this.location,
              this.#board.get([2, 0])!,
              moveTypes.CASTLE,
              {
                castle: new ChessterMove(
                  left.piece,
                  left.piece.location,
                  this.#board.get([3, 0])!,
                  moveTypes.MOVE
                ),
              }
            )
          );
        }
      }
      if (right?.piece?.piece === "♖" && right.piece.moved === false) {
        if (this.#board.get([5, 0])?.empty && this.#board.get([6, 0])?.empty) {
          moves.push(
            new ChessterMove(
              this,
              this.location,
              this.#board.get([6, 0])!,
              moveTypes.CASTLE,
              {
                castle: new ChessterMove(
                  right.piece,
                  right.piece.location,
                  this.#board.get([5, 0])!,
                  moveTypes.MOVE
                ),
              }
            )
          );
        }
      }
    }

    if (
      this.team === BLACK &&
      this.location.y === 7 &&
      this.location.x === 4 &&
      this.moved === false
    ) {
      const left = this.#board.get([0, 7]);
      const right = this.#board.get([7, 7]);

      if (left?.piece?.piece === "♜" && left.piece.moved === false) {
        if (
          this.#board.get([1, 7])?.empty &&
          this.#board.get([2, 7])?.empty &&
          this.#board.get([3, 7])?.empty
        ) {
          moves.push(
            new ChessterMove(
              this,
              this.location,
              this.#board.get([2, 7])!,
              moveTypes.CASTLE,
              {
                castle: new ChessterMove(
                  left.piece,
                  left.piece.location,
                  this.#board.get([3, 7])!,
                  moveTypes.MOVE
                ),
              }
            )
          );
        }
      }

      if (right?.piece?.piece === "♜" && right.piece.moved === false) {
        if (this.#board.get([5, 7])?.empty && this.#board.get([6, 7])?.empty) {
          moves.push(
            new ChessterMove(
              this,
              this.location,
              this.#board.get([6, 7])!,
              moveTypes.CASTLE,
              {
                castle: new ChessterMove(
                  right.piece,
                  right.piece.location,
                  this.#board.get([5, 7])!,
                  moveTypes.MOVE
                ),
              }
            )
          );
        }
      }
    }
    return moves;
  }

  getPawnMoves(): ChessterMove[] {
    const moves: ChessterMove[] = [];
    const direction = this.team === WHITE ? 1 : -1;

    if (
      this.#board.get([this.location.x, this.location.y + direction])?.empty
    ) {
      //   moves.push([this.location.x, this.location.y + direction]);
      moves.push(
        new ChessterMove(
          this,
          this.location,
          this.#board.get([this.location.x, this.location.y + direction])!,
          moveTypes.MOVE
        )
      );

      // advancing two squares requires two vacant squares
      if (
        (this.location.y === 1 || this.location.y === 6) &&
        this.#board.get([this.location.x, this.location.y + direction * 2])
          ?.empty
      ) {
        //   moves.push([this.location.x, this.location.y + 2]);
        moves.push(
          new ChessterMove(
            this,
            this.location,
            this.#board.get([
              this.location.x,
              this.location.y + direction * 2,
            ])!,
            moveTypes.MOVE
          )
        );
      }
    }

    if (
      this.#board
        .get([this.location.x + 1, this.location.y + direction])
        ?.piece?.isEnemy(this)
    ) {
      //   moves.push([this.location.x + 1, this.location.y + 1]);
      moves.push(
        new ChessterMove(
          this,
          this.location,
          this.#board.get([this.location.x + 1, this.location.y + direction])!,
          moveTypes.CAPTURE,
          {
            take: this.#board.get([
              this.location.x + 1,
              this.location.y + direction,
            ])!.piece!,
          }
        )
      );
    }

    if (
      this.#board
        .get([this.location.x - 1, this.location.y + direction])
        ?.piece?.isEnemy(this)
    ) {
      //   moves.push([this.location.x - 1, this.location.y + direction]);
      moves.push(
        new ChessterMove(
          this,
          this.location,
          this.#board.get([this.location.x - 1, this.location.y + direction])!,
          moveTypes.CAPTURE,
          {
            take: this.#board.get([
              this.location.x - 1,
              this.location.y + direction,
            ])!.piece!,
          }
        )
      );
    }

    // en passant
    let lastMove = this.#board.game.history.at(-1);
    if (
      this.team === WHITE &&
      this.location.y === 4 &&
      lastMove?.piece.piece === "♟︎" &&
      lastMove?.from.y === 6 &&
      lastMove?.to.y === 4 &&
      (lastMove?.to.x === this.location.x + 1 ||
        lastMove?.to.x === this.location.x - 1)
    ) {
      moves.push(
        new ChessterMove(
          this,
          this.location,
          this.#board.get([lastMove!.to.x, lastMove!.to.y + 1])!,
          moveTypes.EN_PASSANT_CAPTURE,
          {
            take: lastMove!.piece,
          }
        )
      );
    }

    return moves;
  }

  getRookMoves(): ChessterMove[] {
    const moves: ChessterMove[] = [];

    for (let i = 1; i < 8; i++) {
      let location = this.#board.get([this.location.x + i, this.location.y]);
      if (location?.empty)
        // moves.push([this.location.x + i, this.location.y]);
        moves.push(
          new ChessterMove(this, this.location, location!, moveTypes.MOVE)
        );
      else if (location?.piece?.isEnemy(this)) {
        // moves.push([this.location.x + i, this.location.y]);
        moves.push(
          new ChessterMove(this, this.location, location!, moveTypes.CAPTURE, {
            take: location!.piece!,
          })
        );
        break;
      } else break;
    }

    for (let i = 1; i < 8; i++) {
      let location = this.#board.get([this.location.x - i, this.location.y]);
      if (location?.empty)
        // moves.push([this.location.x - i, this.location.y]);
        moves.push(
          new ChessterMove(this, this.location, location!, moveTypes.MOVE)
        );
      else if (location?.piece?.isEnemy(this)) {
        // moves.push([this.location.x - i, this.location.y]);
        moves.push(
          new ChessterMove(this, this.location, location!, moveTypes.CAPTURE, {
            take: location!.piece!,
          })
        );
        break;
      } else break;
    }

    for (let i = 1; i < 8; i++) {
      let location = this.#board.get([this.location.x, this.location.y + i]);
      if (location?.empty)
        // moves.push([this.location.x, this.location.y + i]);
        moves.push(
          new ChessterMove(this, this.location, location!, moveTypes.MOVE)
        );
      else if (location?.piece?.isEnemy(this)) {
        // moves.push([this.location.x, this.location.y + i]);
        moves.push(
          new ChessterMove(this, this.location, location!, moveTypes.CAPTURE, {
            take: location!.piece!,
          })
        );
        break;
      } else break;
    }

    for (let i = 1; i < 8; i++) {
      let location = this.#board.get([this.location.x, this.location.y - i]);
      if (location?.empty)
        // moves.push([this.location.x, this.location.y - i]);
        moves.push(
          new ChessterMove(this, this.location, location!, moveTypes.MOVE)
        );
      else if (location?.piece?.isEnemy(this)) {
        // moves.push([this.location.x, this.location.y - i]);
        moves.push(
          new ChessterMove(this, this.location, location!, moveTypes.CAPTURE, {
            take: location!.piece!,
          })
        );
        break;
      } else break;
    }

    // castling (should be initiated by the king)
    // let whiteKingPositionPiece = this.#board.get([4, 0])?.piece;
    // if (
    //   this.team === WHITE &&
    //   whiteKingPositionPiece?.piece === "♔" &&
    //   whiteKingPositionPiece?.moved === false &&
    //   this.moved === false
    // ) {
    //   if (
    //     this.location.y === 0 &&
    //     this.location.x === 0 &&
    //     this.#board.get([1, 0])?.empty &&
    //     this.#board.get([2, 0])?.empty &&
    //     this.#board.get([3, 0])?.empty
    //   ) {
    //     // moves.push([3, 0]);
    //     moves.push(
    //       new ChessterMove(
    //         this,
    //         this.location,
    //         this.#board.get([3, 0])!,
    //         moveTypes.CASTLE,
    //         {
    //           castle: new ChessterMove(
    //             whiteKingPositionPiece,
    //             whiteKingPositionPiece.location!,
    //             this.#board.get([2, 0])!,
    //             moveTypes.MOVE
    //           ),
    //         }
    //       )
    //     );
    //   }
    //   if (
    //     this.location.y === 0 &&
    //     this.location.x === 7 &&
    //     this.#board.get([5, 0])?.empty &&
    //     this.#board.get([6, 0])?.empty
    //   ) {
    //     // moves.push([5, 0]);
    //     moves.push(
    //       new ChessterMove(
    //         this,
    //         this.location,
    //         this.#board.get([5, 0])!,
    //         moveTypes.CASTLE,
    //         {
    //           castle: new ChessterMove(
    //             whiteKingPositionPiece,
    //             whiteKingPositionPiece.location!,
    //             this.#board.get([6, 0])!,
    //             moveTypes.MOVE
    //           ),
    //         }
    //       )
    //     );
    //   }
    // }

    // let blackKingPositionPiece = this.#board.get([7, 4])?.piece;
    // if (
    //   this.team === BLACK &&
    //   blackKingPositionPiece?.piece === "♚" &&
    //   blackKingPositionPiece?.moved === false &&
    //   this.moved === false
    // ) {
    //   if (
    //     this.location.y === 7 &&
    //     this.location.x === 0 &&
    //     this.#board.get([1, 7])?.empty &&
    //     this.#board.get([2, 7])?.empty &&
    //     this.#board.get([3, 7])?.empty
    //   ) {
    //     // moves.push([3, 7]);
    //     moves.push(
    //       new ChessterMove(
    //         this,
    //         this.location,
    //         this.#board.get([3, 7])!,
    //         moveTypes.CASTLE,
    //         {
    //           castle: new ChessterMove(
    //             blackKingPositionPiece,
    //             blackKingPositionPiece.location!,
    //             this.#board.get([2, 7])!,
    //             moveTypes.MOVE
    //           ),
    //         }
    //       )
    //     );
    //   }
    //   if (
    //     this.location.y === 7 &&
    //     this.location.x === 7 &&
    //     this.#board.get([5, 7])?.empty &&
    //     this.#board.get([6, 7])?.empty
    //   ) {
    //     // moves.push([5, 7]);
    //     moves.push(
    //       new ChessterMove(
    //         this,
    //         this.location,
    //         this.#board.get([5, 7])!,
    //         moveTypes.CASTLE,
    //         {
    //           castle: new ChessterMove(
    //             blackKingPositionPiece,
    //             blackKingPositionPiece.location!,
    //             this.#board.get([6, 7])!,
    //             moveTypes.MOVE
    //           ),
    //         }
    //       )
    //     );
    //   }
    // }

    return moves;
  }

  getKnightMoves(): ChessterMove[] {
    const moves: ChessterMove[] = [];

    for (let i = -2; i < 3; i++) {
      if (i === 0) continue;
      for (let j = -2; j < 3; j++) {
        if (j === 0 || Math.abs(i) === Math.abs(j)) continue;
        const location = this.#board.get([
          this.location.x + i,
          this.location.y + j,
        ]);
        if (!location) continue;
        if (location.empty)
          // moves.push([this.location.x + i, this.location.y + j]);
          moves.push(
            new ChessterMove(this, this.location, location, moveTypes.MOVE)
          );
        else if (location.piece?.isEnemy(this))
          // moves.push([this.location.x + i, this.location.y + j]);
          moves.push(
            new ChessterMove(this, this.location, location, moveTypes.CAPTURE, {
              take: location.piece!,
            })
          );
      }
    }

    return moves;
  }

  getBishopMoves(): ChessterMove[] {
    const moves: ChessterMove[] = [];

    for (let i = 1; i < 8; i++) {
      let location = this.#board.get([
        this.location.x + i,
        this.location.y + i,
      ]);
      if (location?.empty)
        // moves.push([this.location.x + i, this.location.y + i]);
        moves.push(
          new ChessterMove(this, this.location, location, moveTypes.MOVE)
        );
      else if (location?.piece?.isEnemy(this)) {
        // moves.push([this.location.x + i, this.location.y + i]);
        moves.push(
          new ChessterMove(this, this.location, location, moveTypes.CAPTURE, {
            take: location.piece!,
          })
        );
        break;
      } else break;
    }

    for (let i = 1; i < 8; i++) {
      let location = this.#board.get([
        this.location.x + i,
        this.location.y - i,
      ]);
      if (location?.empty)
        // moves.push([this.location.x - i, this.location.y - i]);
        moves.push(
          new ChessterMove(this, this.location, location, moveTypes.MOVE)
        );
      else if (location?.piece?.isEnemy(this)) {
        // moves.push([this.location.x - i, this.location.y - i]);
        moves.push(
          new ChessterMove(this, this.location, location, moveTypes.CAPTURE, {
            take: location.piece!,
          })
        );
        break;
      } else break;
    }

    for (let i = 1; i < 8; i++) {
      let location = this.#board.get([
        this.location.x - i,
        this.location.y + i,
      ]);
      if (location?.empty)
        // moves.push([this.location.x - i, this.location.y + i]);
        moves.push(
          new ChessterMove(this, this.location, location, moveTypes.MOVE)
        );
      else if (location?.piece?.isEnemy(this)) {
        // moves.push([this.location.x - i, this.location.y + i]);
        moves.push(
          new ChessterMove(this, this.location, location, moveTypes.CAPTURE, {
            take: location.piece!,
          })
        );
        break;
      } else break;
    }

    for (let i = 1; i < 8; i++) {
      let location = this.#board.get([
        this.location.x - i,
        this.location.y - i,
      ]);
      if (location?.empty)
        // moves.push([this.location.x + i, this.location.y - i]);
        moves.push(
          new ChessterMove(this, this.location, location, moveTypes.MOVE)
        );
      else if (location?.piece?.isEnemy(this)) {
        // moves.push([this.location.x + i, this.location.y - i]);
        moves.push(
          new ChessterMove(this, this.location, location, moveTypes.CAPTURE, {
            take: location.piece!,
          })
        );
        break;
      } else break;
    }

    return moves;
  }

  getQueenMoves(): ChessterMove[] {
    const moves: ChessterMove[] = [];

    for (let i = 1; i < 8; i++) {
      let location = this.#board.get([this.location.x + i, this.location.y]);
      if (location?.empty)
        // moves.push([this.location.x + i, this.location.y]);
        moves.push(
          new ChessterMove(this, this.location, location!, moveTypes.MOVE)
        );
      else if (location?.piece?.isEnemy(this)) {
        // moves.push([this.location.x + i, this.location.y]);
        moves.push(
          new ChessterMove(this, this.location, location!, moveTypes.CAPTURE, {
            take: location.piece,
          })
        );
        break;
      } else break;
    }

    for (let i = 1; i < 8; i++) {
      let location = this.#board.get([this.location.x - i, this.location.y]);
      if (location?.empty)
        // moves.push([this.location.x - i, this.location.y]);
        moves.push(
          new ChessterMove(this, this.location, location!, moveTypes.MOVE)
        );
      else if (location?.piece?.isEnemy(this)) {
        // moves.push([this.location.x - i, this.location.y]);
        moves.push(
          new ChessterMove(this, this.location, location!, moveTypes.CAPTURE, {
            take: location.piece,
          })
        );
        break;
      } else break;
    }

    for (let i = 1; i < 8; i++) {
      let location = this.#board.get([this.location.x, this.location.y + i]);
      if (location?.empty)
        // moves.push([this.location.x, this.location.y + i]);
        moves.push(
          new ChessterMove(this, this.location, location!, moveTypes.MOVE)
        );
      else if (location?.piece?.isEnemy(this)) {
        // moves.push([this.location.x, this.location.y + i]);
        moves.push(
          new ChessterMove(this, this.location, location!, moveTypes.CAPTURE, {
            take: location.piece,
          })
        );
        break;
      } else break;
    }

    for (let i = 1; i < 8; i++) {
      let location = this.#board.get([this.location.x, this.location.y - i]);
      if (location?.empty)
        // moves.push([this.location.x, this.location.y - i]);
        moves.push(
          new ChessterMove(this, this.location, location!, moveTypes.MOVE)
        );
      else if (location?.piece?.isEnemy(this)) {
        // moves.push([this.location.x, this.location.y - i]);
        moves.push(
          new ChessterMove(this, this.location, location!, moveTypes.CAPTURE, {
            take: location.piece,
          })
        );
        break;
      } else break;
    }

    for (let i = 1; i < 8; i++) {
      let location = this.#board.get([
        this.location.x + i,
        this.location.y + i,
      ]);
      if (location?.empty)
        // moves.push([this.location.x + i, this.location.y + i]);
        moves.push(
          new ChessterMove(this, this.location, location!, moveTypes.MOVE)
        );
      else if (location?.piece?.isEnemy(this)) {
        // moves.push([this.location.x + i, this.location.y + i]);
        moves.push(
          new ChessterMove(this, this.location, location!, moveTypes.CAPTURE, {
            take: location.piece,
          })
        );
        break;
      } else break;
    }

    for (let i = 1; i < 8; i++) {
      let location = this.#board.get([
        this.location.x - i,
        this.location.y - i,
      ]);
      if (location?.empty)
        // moves.push([this.location.x - i, this.location.y - i]);
        moves.push(
          new ChessterMove(this, this.location, location!, moveTypes.MOVE)
        );
      else if (location?.piece?.isEnemy(this)) {
        // moves.push([this.location.x - i, this.location.y - i]);
        moves.push(
          new ChessterMove(this, this.location, location!, moveTypes.CAPTURE, {
            take: location.piece,
          })
        );
        break;
      } else break;
    }

    for (let i = 1; i < 8; i++) {
      let location = this.#board.get([
        this.location.x - i,
        this.location.y + i,
      ]);
      if (location?.empty)
        // moves.push([this.location.x - i, this.location.y + i]);
        moves.push(
          new ChessterMove(this, this.location, location!, moveTypes.MOVE)
        );
      else if (location?.piece?.isEnemy(this)) {
        // moves.push([this.location.x - i, this.location.y + i]);
        moves.push(
          new ChessterMove(this, this.location, location!, moveTypes.CAPTURE, {
            take: location.piece,
          })
        );
        break;
      } else break;
    }

    for (let i = 1; i < 8; i++) {
      let location = this.#board.get([
        this.location.x + i,
        this.location.y - i,
      ]);
      if (location?.empty)
        // moves.push([this.location.x + i, this.location.y - i]);
        moves.push(
          new ChessterMove(this, this.location, location!, moveTypes.MOVE)
        );
      else if (location?.piece?.isEnemy(this)) {
        // moves.push([this.location.x + i, this.location.y - i]);
        moves.push(
          new ChessterMove(this, this.location, location!, moveTypes.CAPTURE, {
            take: location.piece,
          })
        );
        break;
      } else break;
    }

    return moves;
  }
}
