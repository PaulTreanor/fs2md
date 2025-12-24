#!/usr/bin/env bun
import { test, expect, describe } from "bun:test";
import { execSync } from "child_process";
import { readFileSync, unlinkSync } from "fs";
import path from "path";
import { tmpdir } from "os";

const CLI_PATH = path.resolve("fs2md.ts");
const FIXTURES_PATH = path.resolve("test/fixtures/sample-project");

describe("fs2md CLI", () => {
	describe("Output:", () => {
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
				} catch { }
			}
		});
	});

	describe("Exclude:", () => {
		test("exclude invidiual files", () => {
			const resultExcludeSpecficFile = execSync(`bun ${CLI_PATH} ${FIXTURES_PATH} -x "docs/README.md"`, {
				encoding: "utf8"
			});
			expect(resultExcludeSpecficFile).toContain("### src/index.ts");
			expect(resultExcludeSpecficFile).toContain("### src/utils.js");
			expect(resultExcludeSpecficFile).not.toContain("### docs/README.md");
		});

		test("exclude file extension", () => {
			const resultExcludeAllMdFiles = execSync(`bun ${CLI_PATH} ${FIXTURES_PATH} -x "**/**.md"`, {
				encoding: "utf8"
			});

			expect(resultExcludeAllMdFiles).toContain("### src/index.ts");
			expect(resultExcludeAllMdFiles).toContain("### src/utils.js");
			expect(resultExcludeAllMdFiles).not.toContain("### docs/README.md");
		});
		
		test("exclude directory", () => {
			const resultExcludeDocsDirectory = execSync(`bun ${CLI_PATH} ${FIXTURES_PATH} -x "docs/**"`, {
				encoding: "utf8"
			});

			expect(resultExcludeDocsDirectory).toContain("### src/index.ts");
			expect(resultExcludeDocsDirectory).toContain("### src/utils.js");
			expect(resultExcludeDocsDirectory).not.toContain("### docs/README.md");
		});

		test("exclude directory with /** pattern excludes contents but shows directory in tree", () => {
			const result = execSync(`bun ${CLI_PATH} ${FIXTURES_PATH} -x ".next/**"`, {
				encoding: "utf8"
			});

			// Contents should be excluded
			expect(result).not.toContain("### .next/config.json");
			expect(result).not.toContain("### .next/cache/build.json");
			expect(result).not.toContain("cached data");
			expect(result).not.toContain("nextjs config");

			// But directory itself appears in the tree (current behavior - may be considered a bug)
			// The pattern .next/** only matches paths INSIDE .next/, not the directory itself
			expect(result).toContain(".next");
		});

		test("multiple exclude rules", () => {
			const result = execSync(`bun ${CLI_PATH} ${FIXTURES_PATH} -x "docs/**" -x "**/*.js"`, {
				encoding: "utf8"
			});

			expect(result).toContain("### src/index.ts");
			expect(result).not.toContain("### src/utils.js");
			expect(result).not.toContain("### docs/README.md");
		});

		test("comma-separated exclude patterns", () => {
			const result = execSync(`bun ${CLI_PATH} ${FIXTURES_PATH} -x "docs/**, **/*.js"`, {
				encoding: "utf8"
			});

			expect(result).toContain("### src/index.ts");
			expect(result).not.toContain("### src/utils.js");
			expect(result).not.toContain("### docs/README.md");
		});
	});

	describe("Include:", () => {
		test("include only TypeScript files", () => {
			const result = execSync(`bun ${CLI_PATH} ${FIXTURES_PATH} -i "**/*.ts"`, {
				encoding: "utf8"
			});

			expect(result).toContain("### src/index.ts");
			expect(result).not.toContain("### src/utils.js");
			expect(result).not.toContain("### docs/README.md");
		});

		test("include only files in specific directory", () => {
			const result = execSync(`bun ${CLI_PATH} ${FIXTURES_PATH} -i "src/**"`, {
				encoding: "utf8"
			});

			expect(result).toContain("### src/index.ts");
			expect(result).toContain("### src/utils.js");
			expect(result).not.toContain("### docs/README.md");
		});

		test("multiple include patterns", () => {
			const result = execSync(`bun ${CLI_PATH} ${FIXTURES_PATH} -i "**/*.ts" -i "**/*.md"`, {
				encoding: "utf8"
			});

			expect(result).toContain("### src/index.ts");
			expect(result).toContain("### docs/README.md");
			expect(result).not.toContain("### src/utils.js");
		});

		test("comma-separated include patterns", () => {
			const result = execSync(`bun ${CLI_PATH} ${FIXTURES_PATH} -i "**/*.ts, **/*.md"`, {
				encoding: "utf8"
			});

			expect(result).toContain("### src/index.ts");
			expect(result).toContain("### docs/README.md");
			expect(result).not.toContain("### src/utils.js");
		});

		test("include with exclude - exclude wins", () => {
			const result = execSync(`bun ${CLI_PATH} ${FIXTURES_PATH} -i "src/**" -x "**/*.js"`, {
				encoding: "utf8"
			});

			expect(result).toContain("### src/index.ts");
			expect(result).not.toContain("### src/utils.js");
			expect(result).not.toContain("### docs/README.md");
		});

		test("include specific file types, exclude test files", () => {
			const result = execSync(`bun ${CLI_PATH} ${FIXTURES_PATH} -i "**/*.ts" -x "**/*.test.ts"`, {
				encoding: "utf8"
			});

			expect(result).toContain("### src/index.ts");
			expect(result).not.toContain("### src/utils.js");
			expect(result).not.toContain("### docs/README.md");
		});
	});

	describe("Default excludes:", () => {
		test("excludes node_modules contents by default", () => {
			const result = execSync(`bun ${CLI_PATH} ${FIXTURES_PATH}`, {
				encoding: "utf8"
			});

			expect(result).toContain("### src/index.ts");
			expect(result).not.toContain("### node_modules/fake.js");
			expect(result).not.toContain("// fake module");
		});

		test("excludes .git contents by default", () => {
			const result = execSync(`bun ${CLI_PATH} ${FIXTURES_PATH}`, {
				encoding: "utf8"
			});

			expect(result).toContain("### src/index.ts");
			expect(result).not.toContain("### .git/config");
			expect(result).not.toContain("fake git data");
		});

		test("--no-default-excludes includes node_modules and .git contents", () => {
			const result = execSync(`bun ${CLI_PATH} ${FIXTURES_PATH} --no-default-excludes`, {
				encoding: "utf8"
			});

			expect(result).toContain("### src/index.ts");
			expect(result).toContain("### node_modules/fake.js");
			expect(result).toContain("### .git/config");
		});

		test("user excludes are added to default excludes", () => {
			const result = execSync(`bun ${CLI_PATH} ${FIXTURES_PATH} -x "**/*.js"`, {
				encoding: "utf8"
			});

			expect(result).toContain("### src/index.ts");
			expect(result).not.toContain("### src/utils.js");
			expect(result).not.toContain("### node_modules/fake.js");
			expect(result).not.toContain("### .git/config");
		});
	});
});