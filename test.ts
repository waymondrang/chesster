import { ChessterGame } from "./game";
import { tests as caseTests } from "./tests/cases";
import { tests as playTests } from "./tests/plays";
import { rCompare, simulatePGNGame } from "./util";

export function test() {
  var totalTime = 0;
  var passedCount = 0;

  for (const test of caseTests) {
    let startTime = performance.now();
    let game = new ChessterGame(test.initialState);

    if (test.moves) for (let move of test.moves) game.validateAndMove(move); // validate because why not! (alternatively use game.move)

    // compare board states
    let passed = rCompare(test.expectedState, game.getState());
    let endTime = performance.now();
    if (passed) passedCount++;

    console.log(
      (passed ? "passed" : "failed") +
        ' test case: "' +
        test.title +
        '" in ' +
        (endTime - startTime).toFixed(2) +
        "ms"
    );

    totalTime += endTime - startTime;
  }

  for (const test of playTests) {
    let startTime = performance.now();

    let game = simulatePGNGame(test.pgn);

    // compare board states
    let passed = rCompare(test.expectedState, game.getState());
    let endTime = performance.now();
    if (passed) passedCount++;

    console.log(
      (passed ? "passed" : "failed") +
        ' test play: "' +
        test.title +
        '" in ' +
        (endTime - startTime).toFixed(2) +
        "ms"
    );
  }

  console.log(
    passedCount +
      "/" +
      caseTests.length +
      " case tests passed (" +
      ((passedCount / (caseTests.length + playTests.length)) * 100).toFixed(2) +
      "%) in " +
      totalTime.toFixed(2) + // time
      "ms"
  );
}

test();
