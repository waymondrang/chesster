import { ChessterGame } from "./game";
import { ChessterBoard, ChessterLocation, pieces } from "./types";

const supportedPawnBonus = 15;
const phalanxPawnBonus = 10;

const backwardPawnPenalty = -4;
const doubledPawnPenalty = -6;
const weakUnopposedPawnPenalty = -8;
const isolatedPawnPenalty = -6;
const opposedPawnPenalty = -4;

/**
 * Calculates if there is a friendly pawn on an adjacent file and same rank
 * @param location
 * @returns
 */
function phalanxPawnB(board, location: number): number {
  if ((location & 0b111) > 0 && board[location - 1] === pieces.BLACK_PAWN)
    return 1;

  if ((location & 0b111) < 7 && board[location + 1] === pieces.BLACK_PAWN)
    return 1;

  return 0;
}

/**
 * Counts the number of pawns supporting a pawn at a given location
 * @param location
 * @returns
 */
function supportedPawnB(board, location: number): number {
  return (
    ((location & 0b111) > 0 && board[location - 9] === pieces.BLACK_PAWN
      ? 1
      : 0) +
    ((location & 0b111) < 7 && board[location - 7] === pieces.BLACK_PAWN
      ? 1
      : 0)
  );
}

/**
 * Calculates the connected pawn bonus of a pawn at a given location
 * @param location
 * @returns
 */
function connectedPawnB(board, location: number): number {
  if (supportedPawnB(board, location) || phalanxPawnB(board, location))
    return 1;
  return 0;
}

/**
 * Calculates the doubled pawn penalty of a pawn at a given location from the
 * perspective of white
 * @param location
 * @returns
 */
function doubledPawnB(board, location: number): number {
  if (board[location + 8] !== pieces.BLACK_PAWN) return 0;

  if ((location & 0b111) > 0 && board[location - 9] === pieces.BLACK_PAWN)
    return 0;
  if ((location & 0b111) < 7 && board[location - 7] === pieces.BLACK_PAWN)
    return 0;

  return 1;
}

function opposedPawnB(board, location: number): number {
  for (let i = ((location >>> 3) & 0b111) + 1; i < 8; i++) {
    if (board[(i << 3) | (location & 0b000111)] === pieces.WHITE_PAWN) return 1; // enemy pawn
  }

  return 0;
}

function isolatedPawnB(board, location: number): number {
  for (let i = 0; i < 8; i++) {
    if (
      (location & 0b111) < 7 &&
      board[((i << 3) | (location & 0b000111)) + 1] === pieces.BLACK_PAWN
    )
      return 0; // friendly pawn
    if (
      (location & 0b111) > 0 &&
      board[((i << 3) | (location & 0b000111)) - 1] === pieces.BLACK_PAWN
    )
      return 0; // friendly pawn
  }

  return 1;
}

function backwardPawnB(board, location: number): number {
  for (var i = ((location >>> 3) & 0b111) - 1; i >= 0; i--) {
    if (
      (board[location] & 0b111) > 0 &&
      board[((i << 3) | (location & 0b000111)) - 1] === pieces.BLACK_PAWN
    )
      return 0;
    if (
      (board[location] & 0b111) < 7 &&
      board[((i << 3) | (location & 0b000111)) + 1] === pieces.BLACK_PAWN
    )
      return 0;
  }

  if (
    ((board[location] & 0b111) < 7 &&
      ((board[location] >>> 3) & 0b111) < 5 &&
      board[((i << 3) | (location & 0b000111)) + 17] === pieces.WHITE_PAWN) ||
    ((board[location] & 0b111) > 0 &&
      ((board[location] >>> 3) & 0b111) < 5 &&
      board[((i << 3) | (location & 0b000111)) + 15] === pieces.WHITE_PAWN) ||
    (((board[location] >>> 3) & 0b111) < 6 &&
      board[((i << 3) | (location & 0b000111)) + 8] === pieces.WHITE_PAWN)
  )
    return 1;

  return 0;
}

function connectedPawnBonusB(board, location: number): number {
  if (!connectedPawnB(board, location)) {
    // console.log("not connected pawn");
    return 0;
  }

  const opposed = opposedPawnB(board, location);

  // console.log("opposed", opposed);

  const phalanx = phalanxPawnB(board, location);

  // console.log("pawnPhalanx", phalanx);

  const supported = supportedPawnB(board, location);

  // console.log("supported", supported);

  // if ((location & 0b111) === 0 || (location & 0b111) === 7) return 0;
  return (
    phalanx * phalanxPawnBonus +
    opposed * opposedPawnPenalty +
    supported * supportedPawnBonus
  ); // arbitrary?
}

function weakUnopposedPawnB(board, location: number): number {
  if (opposedPawnB(board, location)) return 0;

  if (isolatedPawnW(board, location)) return 1;
  else if (backwardPawnW(board, location)) return 1;

  return 0;
}

//////////////////////////////////
//     white pawn structure     //
//////////////////////////////////

/**
 * Calculates if there is a friendly pawn on an adjacent file and same rank
 * @param location
 * @returns
 */
function phalanxPawnW(board, location: number): number {
  // console.log("calculating phalanx pawn");
  if ((location & 0b111) > 0 && board[location - 1] === pieces.WHITE_PAWN)
    return 1;

  if ((location & 0b111) < 7 && board[location + 1] === pieces.WHITE_PAWN)
    return 1;

  return 0;
}

/**
 * Counts the number of pawns supporting a pawn at a given location
 * @param location
 * @returns
 */
function supportedPawnW(board, location: number): number {
  return (
    ((location & 0b111) > 0 && board[location + 7] === pieces.WHITE_PAWN
      ? 1
      : 0) +
    ((location & 0b111) < 7 && board[location + 9] === pieces.WHITE_PAWN
      ? 1
      : 0)
  );
}

/**
 * Calculates the connected pawn bonus of a pawn at a given location
 * @param location
 * @returns
 */
function connectedPawnW(board, location: number): number {
  // console.log("calculating connected pawn");
  if (supportedPawnW(board, location) || phalanxPawnW(board, location))
    return 1;
  return 0;
}

/**
 * Calculates the doubled pawn penalty of a pawn at a given location from the
 * perspective of white
 * @param location
 * @returns
 */
function doubledPawnW(board, location: number): number {
  if (board[location + 8] !== pieces.WHITE_PAWN) return 0;

  if ((location & 0b111) > 0 && board[location + 7] === pieces.WHITE_PAWN)
    return 0;
  if ((location & 0b111) < 7 && board[location + 9] === pieces.WHITE_PAWN)
    return 0;
  return 1;
}

function opposedPawnW(board, location: number): number {
  for (let i = 0; i < ((location >>> 3) & 0b111); i++) {
    if (board[(i << 3) | (location & 0b000111)] === 0b0011) return 1; // enemy pawn
  }

  return 0;
}

function isolatedPawnW(board, location: number): number {
  for (let i = 0; i < 8; i++) {
    if (
      (location & 0b111) < 7 &&
      board[((i << 3) | (location & 0b000111)) + 1] === pieces.WHITE_PAWN
    )
      return 0; // friendly pawn
    if (
      (location & 0b111) > 0 &&
      board[((i << 3) | (location & 0b000111)) - 1] === pieces.WHITE_PAWN
    )
      return 0; // friendly pawn
  }

  return 1;
}

function backwardPawnW(board, location: number): number {
  for (var i = ((location >>> 3) & 0b111) + 1; i < 8; i++) {
    if (
      (board[location] & 0b111) > 0 &&
      board[((i << 3) | (location & 0b000111)) - 1] === pieces.WHITE_PAWN
    )
      return 0;
    if (
      (board[location] & 0b111) < 7 &&
      board[((i << 3) | (location & 0b000111)) + 1] === pieces.WHITE_PAWN
    )
      return 0;
  }

  if (
    ((board[location] & 0b111) < 7 &&
      ((board[location] >>> 3) & 0b111) > 2 &&
      board[((i << 3) | (location & 0b000111)) - 15] === pieces.BLACK_PAWN) ||
    ((board[location] & 0b111) > 0 &&
      ((board[location] >>> 3) & 0b111) > 2 &&
      board[((i << 3) | (location & 0b000111)) - 15] === pieces.BLACK_PAWN) ||
    (((board[location] >>> 3) & 0b111) > 1 &&
      board[((i << 3) | (location & 0b000111)) - 8] === pieces.BLACK_PAWN)
  )
    return 1;

  return 0;
}

function connectedPawnBonusW(board, location: number): number {
  if (!connectedPawnW(board, location)) {
    // console.log("not connected pawn");
    return 0;
  }

  const opposed = opposedPawnW(board, location);

  // console.log("opposed", opposed);

  const phalanx = phalanxPawnW(board, location);

  // console.log("pawnPhalanx", phalanx);

  const supported = supportedPawnW(board, location);

  // console.log("supported", supported);

  // if ((location & 0b111) === 0 || (location & 0b111) === 7) return 0;
  return (
    phalanx * phalanxPawnBonus +
    opposed * opposedPawnPenalty +
    supported * supportedPawnBonus
  ); // arbitrary?
}

function weakUnopposedPawnW(board, location: number): number {
  if (opposedPawnW(board, location)) return 0;

  if (isolatedPawnW(board, location)) return 1;
  else if (backwardPawnW(board, location)) return 1;

  return 0;
}

export function getPawnStructureMG(
  game: ChessterGame,
  location: number
): number {
  if (game.board[location] >>> 1 !== pieces.PAWN) return 0;
  // console.log("getting pawn structure for location", location);
  if (game.board[location] & 0b1) {
    let score = 0;

    if (isolatedPawnB(game.board, location)) score += isolatedPawnPenalty;
    else if (backwardPawnB(game.board, location)) score += backwardPawnPenalty;

    // console.log("score after isolated/backward pawn penalty", score);

    score += doubledPawnB(game.board, location) * doubledPawnPenalty;

    // console.log("score after doubled pawn penalty", score);

    score += connectedPawnBonusB(game.board, location);

    // console.log("score after connected pawn bonus", score);

    score +=
      weakUnopposedPawnB(game.board, location) * weakUnopposedPawnPenalty;

    // console.log("score after weak unopposed pawn penalty", score);

    // console.log("###score", score);

    if (Number.isNaN(score)) throw new Error("score is NaN");

    return score;
  } else {
    let score = 0;

    if (isolatedPawnW(game.board, location)) score += isolatedPawnPenalty;
    else if (backwardPawnW(game.board, location)) score += backwardPawnPenalty;

    // console.log("score after isolated/backward pawn penalty", score);

    score += doubledPawnW(game.board, location) * doubledPawnPenalty;

    // console.log("score after doubled pawn penalty", score);

    score += connectedPawnBonusW(game.board, location);

    // console.log("score after connected pawn bonus", score);

    score +=
      weakUnopposedPawnW(game.board, location) * weakUnopposedPawnPenalty;

    // console.log("score after weak unopposed pawn penalty", score);

    // console.log("###score", score);

    if (Number.isNaN(score)) throw new Error("score is NaN");

    return score;
  }
}
