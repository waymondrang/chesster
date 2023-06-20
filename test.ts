import { ChessterGame } from "./game";
import { tests } from "./tests/cases";
import { rCompare } from "./util";

var passedCount = 0;

for (const test of tests) {
  let game = new ChessterGame(test.initialState);

  if (test.moves)
    for (let move of test.moves) {
      // game.move(move);
      game.validateAndMove(move); // validate because why not
    }

  // compare board states
  let gameState = game.getState();
  let expectedState = test.expectedState;

  let passed = rCompare(expectedState, gameState);

  console.log(
    (passed ? "passed" : "failed") + ' test case: "' + test.testCase + '"'
  );

  if (passed) passedCount++;
}

console.log(
  passedCount +
    "/" +
    tests.length +
    " tests passed (" +
    (passedCount / tests.length) * 100 +
    "%)"
);
