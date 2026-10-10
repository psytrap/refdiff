/**
 * tests/runner.js
 *
 * Master test runner for RefDiff.
 * Runs all modular test suites sequentially in a single process.
 */

const { setMasterRunner, getSummary } = require('./harness.js');

setMasterRunner(true);

const testFiles = [
  './test_anchor.js',
  './test_constants.js',
  './test_dom_helpers.js',
  './test_init.js',
  './test_memento.js',
  './test_mode_coordinator.js',
  './test_pairing.js',
  './test_parser.js',
  './test_pipeline.js',
  './test_renderer.js',
  './test_state.js',
  './test_utils.js',
  './test_benchmarks.js'
];

for (const file of testFiles) {
  require(file);
}

const { totalTests, passedTests, failures } = getSummary();

console.log(`\n==========================================`);
console.log(`Test Results: ${passedTests}/${totalTests} passed (${failures.length} failed)`);
console.log(`==========================================`);

if (failures.length > 0) {
  console.error(`\nFailed tests:`);
  for (const f of failures) {
    console.error(` - ${f.description}: ${f.error.message}`);
  }
  process.exit(1);
} else {
  console.log(`All test suites passed successfully!\n`);
  process.exit(0);
}
