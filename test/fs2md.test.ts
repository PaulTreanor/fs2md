#!/usr/bin/env bun
import { test, expect, describe } from "bun:test";
import { execSync } from "child_process";
import { readFileSync, unlinkSync } from "fs";
import path from "path";
import { tmpdir } from "os";

const CLI_PATH = path.resolve("fs2md.ts");
const FIXTURES_PATH = path.resolve("test/fixtures/sample-project");

describe("fs2md CLI", () => {
  test("generates file tree and content", () => {
	const result = execSync(`bun ${CLI_PATH} ${FIXTURES_PATH}`, { 
	  encoding: "utf8" 
	});
	
	// Should contain file tree section
	expect(result).toContain("## File tree");
	expect(result).toContain("src/");
	expect(result).toContain("├── index.ts");
	expect(result).toContain("└── utils.js");
	expect(result).toContain("docs/");
	
	// Should contain file contents
	expect(result).toContain("### src/index.ts");
	expect(result).toContain("export function hello()");
	expect(result).toContain("### docs/README.md");
	expect(result).toContain("# Sample Project");
  });

  test("respects exclude patterns", () => {
	const result = execSync(`bun ${CLI_PATH} ${FIXTURES_PATH} -x "docs/README.md"`, { 
	  encoding: "utf8" 
	});
	
	expect(result).toContain("### src/index.ts");
	expect(result).toContain("### src/utils.js");
	expect(result).not.toContain("### docs/README.md");
  });

  test("writes to output file", () => {
	const outputPath = path.join(tmpdir(), `fs2md-test-${Date.now()}.md`);
	
	try {
	  execSync(`bun ${CLI_PATH} ${FIXTURES_PATH} -o ${outputPath}`);
	  const content = readFileSync(outputPath, "utf8");
	  
	  expect(content).toContain("## File tree");
	  expect(content).toContain("### src/index.ts");
	} finally {
	  try {
		unlinkSync(outputPath);
	  } catch {}
	}
  });
});