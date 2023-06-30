import { ChessterGame } from "./game";
import { WHITE } from "./types";
import { fenStringToBoard } from "./util";

const game = new ChessterGame({
  board: fenStringToBoard(
    "r3k2r/Pp1p1ppp/1b3nbN/nPp5/BBPPP3/q4N2/Pp4PP/R2Q1RK1"
  ),
  turn: WHITE,
});

console.log(game.boardToString());
console.log("- - - - - - - -");

game.move(0b1100101001001010010);

console.log(game.boardToString());
console.log("- - - - - - - -");

game.undo();

console.log(game.boardToString());
console.log("- - - - - - - -");
