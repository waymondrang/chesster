import { ChessterGame } from "./game";
import { tests as caseTests } from "./tests/cases";
import { tests as playTests } from "./tests/plays";
import { PGNTest } from "./types";
import { bCompareState, dCopy, rCompare, simulatePGNGame } from "./util";

// comparison function (rCompare recommended)
const compareFunction = rCompare;

console.log("testing using " + compareFunction.name);

export function test() {
  var totalTime = 0;
  var passedCount = 0;
  var totalCount = 0;

  for (const test of dCopy(caseTests)) {
    const startTime = performance.now();
    const game = new ChessterGame(test.initialState);

    if (test.moves) for (const move of test.moves) game.validateAndMove(move); // validate because why not! (alternatively use game.move)

    // compare board states
    const passed = compareFunction(test.expectedState, game.getState());

    const endTime = performance.now();
    if (passed) passedCount++;

    // print results
    console.log(
      (passed ? "PASSED" : "FAILED") +
        ' test case: "' +
        test.title +
        '" in ' +
        (endTime - startTime).toFixed(2) +
        "ms"
    );

    totalTime += endTime - startTime;
    totalCount++;
  }

  for (const test of dCopy(playTests) as PGNTest[]) {
    const startTime = performance.now();
    const game = simulatePGNGame(test.pgn);

    // compare board states
    const passed = compareFunction(test.expectedState, game.getState());

    const endTime = performance.now();
    if (passed) passedCount++;

    // print results
    console.log(
      (passed ? "PASSED" : "FAILED") +
        ' test play: "' +
        test.title +
        '" in ' +
        (endTime - startTime).toFixed(2) +
        "ms"
    );

    totalTime += endTime - startTime;
    totalCount++;
  }

  console.log(
    passedCount +
      "/" +
      totalCount +
      " case tests passed in " +
      totalTime.toFixed(2) + // time
      "ms"
  );

  return totalTime;
}

test();
