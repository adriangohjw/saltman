#!/usr/bin/env bun

import { testExampleOutput } from "../src/test-examples";

/**
 * Script to test the example vulnerabilities output
 * Run with: bun run scripts/test-examples.ts
 */
const main = () => {
  const output = testExampleOutput("example-org", "example-repo", "abc123def456");
  console.log(output);
};

main();

