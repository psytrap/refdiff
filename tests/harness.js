/**
 * tests/harness.js
 *
 * Lightweight, zero-dependency test harness and mock sandbox.
 * Supports standalone test execution (node tests/test_parser.js)
 * and unified runner execution (node tests/runner.js).
 */

const assert = require('assert');

let totalTests = 0;
let passedTests = 0;
const failures = [];
let isMasterRunner = false;

function setMasterRunner(val) {
  isMasterRunner = val;
}

function suite(name, fn) {
  console.log(`\n=== ${name} ===`);
  if (typeof fn === 'function') fn();
}

function test(description, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✓ ${description}`);
  } catch (err) {
    failures.push({ description, error: err });
    console.error(`  ✗ ${description}`);
    console.error(`    ${err.message}`);
  }
}

/**
 * Executes a callback with safe, sandboxed global overrides.
 * Guarantees original state restoration even if assertions fail.
 * @param {Object} mocks Object of global properties to mock
 * @param {Function} fn Test callback
 */
function withMockEnvironment(mocks, fn) {
  const originals = {};
  for (const key of Object.keys(mocks)) {
    originals[key] = global[key];
    global[key] = mocks[key];
  }
  try {
    return fn();
  } finally {
    for (const key of Object.keys(mocks)) {
      if (originals[key] === undefined) {
        delete global[key];
      } else {
        global[key] = originals[key];
      }
    }
  }
}

/**
 * Helper to setup mock window and storage engines (localStorage / mw.storage).
 * @param {'localStorage'|'mw.storage'} storageEngine
 */
function setupMockStorage(storageEngine = 'localStorage') {
  const mockStore = {};
  let mockWindow = {};

  if (storageEngine === 'localStorage') {
    mockWindow = {
      location: { search: '' },
      localStorage: {
        getItem: (key) => mockStore[key] || null,
        setItem: (key, val) => { mockStore[key] = String(val); }
      }
    };
  } else if (storageEngine === 'mw.storage') {
    mockWindow = {
      location: { search: '' },
      mw: {
        storage: {
          get: (key) => mockStore[key] || null,
          set: (key, val) => { mockStore[key] = String(val); }
        }
      }
    };
  }
  return { mockStore, mockWindow };
}

/**
 * Concludes a test module when executed directly via CLI.
 */
function finishStandalone() {
  if (isMasterRunner) return;
  console.log(`\n==========================================`);
  console.log(`Test Results: ${passedTests}/${totalTests} passed (${failures.length} failed)`);
  console.log(`==========================================`);
  if (failures.length > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

function getSummary() {
  return { totalTests, passedTests, failures };
}

module.exports = {
  assert,
  suite,
  test,
  withMockEnvironment,
  setupMockStorage,
  finishStandalone,
  getSummary,
  setMasterRunner
};
