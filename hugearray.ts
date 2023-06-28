import { getWhiteKingMoves } from "./database";
import { boardSize } from "./types";
import { generateRandomInteger } from "./util";

function pregenerateMoveTest() {
  // database for a specific piece, where each element is directional move that should be iterated until an invalid move is found
  const moveDatabase: Array<Array<number>> = new Array(64);

  // fill with random numbers
  for (let i = 0; i < moveDatabase.length; i++) {
    moveDatabase[i] = getWhiteKingMoves(i);
  }

  const N = 1000000;

  const startTime = performance.now();

  for (let n = 0; n < N; n++) {
    for (let i = 0; i < 64; i++) {
      let moves = moveDatabase[i];

      var ml = moves.length;
      while (ml--) moves[i] = -moves[i];
    }
  }

  const endTime = performance.now();

  console.log(
    `pregenerateMoveTest: ${N} iterations took ${endTime - startTime}ms`
  );

  return endTime - startTime;
}

function liveGenerateMoveTest() {
  const N = 1000000;

  const startTime = performance.now();

  for (let n = 0; n < N; n++) {
    for (let i = 0; i < boardSize; i++) {
      let moves = getWhiteKingMoves(0, i);

      var ml = moves.length;
      while (ml--) moves[i] = -moves[i];
    }
  }

  const endTime = performance.now();

  console.log(
    `liveGenerateMoveTest: ${N} iterations took ${endTime - startTime}ms`
  );

  return endTime - startTime;
}

var times = {
  preGenerate: 0,
  liveGenerate: 0,
};

var N = 10;

var n = N;

while (n--) {
  //   times.preGenerate += pregenerateMoveTest();
  times.liveGenerate += liveGenerateMoveTest();
}

for (let key in times) {
  times[key] /= N;
}

for (let key in times) {
  console.log(`${key}: ${times[key]}ms`);
}
