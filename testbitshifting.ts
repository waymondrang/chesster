import { getBinaryString } from "./util";

export {};

var bcqc = true;
var wcqc = false;
var bckc = false;
var wckc = true;
var bcm = true;
var wcm = false;
var bc = true;
var wc = false;
var turn = 0b0;
var move = 0b11010010010000010010;

var newbcqc, newwcqc, newbckc, newwckc, newbcm, newwcm, newbc, newwc, newturn;

console.log(
  "bcqc: ",
  bcqc,
  "wcqc: ",
  wcqc,
  "bckc: ",
  bckc,
  "wckc: ",
  wckc,
  "bcm: ",
  bcm,
  "wcm: ",
  wcm,
  "bc: ",
  bc,
  "wc: ",
  wc,
  "turn: ",
  turn
);

let history = 0;
console.log(getBinaryString(history));

history |= bcqc ? 0b1 << 31 : 0;
console.log(getBinaryString(history));

history |= wcqc ? 0b1 << 30 : 0;
console.log(getBinaryString(history));

history |= bckc ? 0b1 << 29 : 0;
console.log(getBinaryString(history));

history |= wckc ? 0b1 << 28 : 0;
console.log(getBinaryString(history));

history |= bcm ? 0b1 << 27 : 0;
console.log(getBinaryString(history));

history |= wcm ? 0b1 << 26 : 0;
console.log(getBinaryString(history));

history |= bc ? 0b1 << 25 : 0;
console.log(getBinaryString(history));

history |= wc ? 0b1 << 24 : 0;
console.log(getBinaryString(history));

console.log("history initial assignment over");

console.log(getBinaryString(move & 0b11111111111111111111));

history |= move & 0b11111111111111111111;

console.log(getBinaryString(history));

newbcqc = ((history >>> 31) & 0b1) === 1;
newwcqc = ((history >>> 30) & 0b1) === 1;
newbckc = ((history >>> 29) & 0b1) === 1;
newwckc = ((history >>> 28) & 0b1) === 1;
newbcm = ((history >>> 27) & 0b1) === 1;
newwcm = ((history >>> 26) & 0b1) === 1;
newbc = ((history >>> 25) & 0b1) === 1;
newwc = ((history >>> 24) & 0b1) === 1;

console.log(
  "newbcqc: ",
  newbcqc,
  "newwcqc: ",
  newwcqc,
  "newbckc: ",
  newbckc,
  "newwckc: ",
  newwckc,
  "newbcm: ",
  newbcm,
  "newwcm: ",
  newwcm,
  "newbc: ",
  newbc,
  "newwc: ",
  newwc,
  "newturn: ",
  newturn,
  "\n"
);
