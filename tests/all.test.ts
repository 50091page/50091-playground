import { runNameDuplicateTests } from "./nameDuplicates.test.js";
import { runOverwatchMapTests } from "./overwatchMaps.test.js";
import { runReactionSessionTests } from "./reactionSession.test.js";
import { runShuffleSwapTests } from "./shuffleSwap.test.js";
import { runUseSwapToolHelperTests } from "./useSwapTool.helpers.test.js";

function runAllTests() {
  runShuffleSwapTests();
  runUseSwapToolHelperTests();
  runNameDuplicateTests();
  runOverwatchMapTests();
  runReactionSessionTests();
  console.log("all tests passed");
}

runAllTests();
