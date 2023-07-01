import e from "express";
import { ChessterGame } from "./game";
import {
  BLACK,
  WHITE,
  boardSize,
  boardWidth,
  defaultBoardString,
} from "./types";
import {
  boardStringToArray,
  boardStringToArrayPush,
  boardStringToBuffer,
  boardStringToUint32Array,
  boardStringToUint8Array,
  createRandomArray,
  generateRandomInteger,
  generateRandomPieceString,
  binaryToString,
} from "./util";

const n = 1000000;

function uint8Test() {
  const uint = boardStringToUint8Array(defaultBoardString);

  const startTime = performance.now();

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < boardSize; j++) {
      let piece = uint[j] & 0b1110;
      let team = uint[j] & 0b0001;

      uint[j] = generateRandomInteger(0, 15);
    }
  }

  const endTime = performance.now();

  console.log(`uint8Test: ${n} iterations took ${endTime - startTime}ms`);

  return endTime - startTime;
}

function uint32Test() {
  const uint = boardStringToUint32Array(defaultBoardString);

  const startTime = performance.now();

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < boardSize; j++) {
      let piece = uint[j] & 0b1110;
      let team = uint[j] & 0b0001;

      uint[j] = generateRandomInteger(0, 15);
    }
  }

  const endTime = performance.now();

  console.log(`uint32Test: ${n} iterations took ${endTime - startTime}ms`);

  return endTime - startTime;
}

function bufferTest() {
  const buffer = boardStringToBuffer(defaultBoardString);

  const startTime = performance.now();

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < boardSize; j++) {
      let piece = buffer[j] & 0b1110;
      let team = buffer[j] & 0b0001;

      buffer[j] = generateRandomInteger(0, 15);
    }
  }

  const endTime = performance.now();

  console.log(`bufferTest: ${n} iterations took ${endTime - startTime}ms`);

  return endTime - startTime;
}

function arrayTestFor() {
  const uint = boardStringToArray(defaultBoardString);

  const startTime = performance.now();

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < boardSize; j++) {
      let piece = uint[j] & 0b1110;
      let team = uint[j] & 0b0001;

      uint[j] = generateRandomInteger(0, 15);
    }
  }

  const endTime = performance.now();

  console.log(`arrayTestFor: ${n} iterations took ${endTime - startTime}ms`);

  return endTime - startTime;
}

function arrayTestWhile() {
  const uint = boardStringToArray(defaultBoardString);

  const startTime = performance.now();

  var i = n;
  while (i--) {
    var j = boardSize;
    while (j--) {
      let piece = uint[j] & 0b1110;
      let team = uint[j] & 0b0001;

      uint[j] = generateRandomInteger(0, 15);
    }
  }

  const endTime = performance.now();

  console.log(`arrayTestWhile: ${n} iterations took ${endTime - startTime}ms`);

  return endTime - startTime;
}

function arrayPushTestWhile() {
  const uint = boardStringToArrayPush(defaultBoardString); // [] vs new Array()

  const startTime = performance.now();

  var i = n;
  while (i--) {
    var j = boardSize;
    while (j--) {
      let piece = uint[j] & 0b1110;
      let team = uint[j] & 0b0001;

      uint[j] = generateRandomInteger(0, 15);
    }
  }

  const endTime = performance.now();

  console.log(
    `arrayPushTestWhile: ${n} iterations took ${endTime - startTime}ms`
  );

  return endTime - startTime;
}

function nestedArrayTestWhile() {
  const array = createRandomArray(boardWidth, boardWidth, () =>
    generateRandomInteger(0, 15)
  );

  const startTime = performance.now();

  var i = n;
  while (i--) {
    var j = boardWidth;
    while (j--) {
      var k = boardWidth;
      while (k--) {
        let piece = array[j][k] & 0b1110;
        let team = array[j][k] & 0b0001;

        array[j][k] = generateRandomInteger(0, 15);
      }
    }
  }

  const endTime = performance.now();

  console.log(
    `nestedArrayTestWhile: ${n} iterations took ${endTime - startTime}ms`
  );

  return endTime - startTime;
}

const N = 10;

var averageTimes = {
  uint8: 0,
  uint32: 0,
  buffer: 0,
  arrayFor: 0,
  arrayWhile: 0,
  arrayPushWhile: 0,
  nestedArrayTestWhile: 0,
};

for (let i = 0; i < N; i++) {
  console.log(`iteration ${i + 1} of ${N}`);
  averageTimes.uint8 += uint8Test();
  averageTimes.uint32 += uint32Test();
  averageTimes.buffer += bufferTest();
  averageTimes.arrayFor += arrayTestFor();
  averageTimes.arrayWhile += arrayTestWhile();
  averageTimes.arrayPushWhile += arrayPushTestWhile();
  averageTimes.nestedArrayTestWhile += nestedArrayTestWhile();
  // averageTimes.chessterBoard += chessterBoardTest();
  console.log();
}

for (const key in averageTimes) {
  averageTimes[key] /= N;
}

for (const key in averageTimes) {
  console.log(`${key}: ${averageTimes[key]}ms`);
}
