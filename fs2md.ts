#!/usr/bin/env node
import { readdirSync, statSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import meow from "meow";
import {minimatch} from "minimatch";

interface Options {
	output?: string;
	includePatterns: string[];
	excludePatterns: string[];
}

const helpMessageString = `
\nConvert every file under ROOT into one Markdown blob.

Usage:
	$ fs2md <root> [options]

Options:
	-o, --output FILE           write Markdown here (default: stdout)
	-i, --include PATTERN       glob to include (repeatable, comma-separated)
	-x, --exclude PATTERN       glob to exclude (repeatable, comma-separated)
	-h, --help                  show this message

Examples:
	$ fs2md . -x "node_modules/**, *.log"
	$ fs2md . -i "**/*.ts" -x "**/*.test.ts"
\n
`;

const cli = meow(
	helpMessageString,
	{
		importMeta: import.meta,
		flags: {
			output: { type: "string", shortFlag: "o" },
			include: { type: "string", shortFlag: "i", isMultiple: true },
			exclude: { type: "string", shortFlag: "x", isMultiple: true },
		},
	},
);

const root = cli.input[0] ?? ".";
const options: Options = {
	output: cli.flags.output,
	includePatterns: ((cli.flags.include ?? []) as string[])
		.flatMap(pattern => pattern.split(',').map(p => p.trim()))
		.filter(p => p.length > 0),
	excludePatterns: ((cli.flags.exclude ?? []) as string[])
		.flatMap(pattern => pattern.split(',').map(p => p.trim()))
		.filter(p => p.length > 0),
};

const shouldInclude = (relPath: string, opts: Options): boolean => {
	// If no include patterns specified, include everything
	if (opts.includePatterns.length === 0) return true;

	// If include patterns exist, file must match at least one
	for (const pattern of opts.includePatterns) {
		if (minimatch(relPath, pattern, { dot: true })) return true;
	}

	return false;
}

const shouldExclude = (relPath: string, opts: Options): boolean => {
	for (const pattern of opts.excludePatterns) {
		if (minimatch(relPath, pattern, { dot: true })) return true;
	}

	return false;
}

const shouldProcessPath = (relPath: string, absPath: string, opts: Options): boolean => {
	const stats = statSync(absPath);

	// Always exclude if pattern matches (works for both files and directories)
	if (shouldExclude(relPath, opts)) return false;

	// For directories, always process them (so we can traverse into them)
	if (stats.isDirectory()) return true;

	// For files, check include patterns
	if (!shouldInclude(relPath, opts)) return false;

	return true;
}

const buildTree = (
	dir: string,
	absRoot: string,
	opts: Options,
	prefix: string,
	lines: string[],
	rootLevel = false,
) => {
	const entries = readdirSync(dir).filter((entry) => {
		const rel = path.relative(absRoot, path.join(dir, entry));
		return shouldProcessPath(rel, path.join(dir, entry), opts);
	}).sort((a, b) => a.localeCompare(b));

	entries.forEach((entry, idx) => {
		const absPath = path.join(dir, entry);
		const stats = statSync(absPath);
		const isLast = idx === entries.length - 1;
		const connector = rootLevel ? "" : (isLast ? "└── " : "├── ");
		lines.push(prefix + connector + entry);

		if (stats.isDirectory()) {
			const nextPrefix = rootLevel
			? ""
			: prefix + (isLast ? "    " : "│   ");
			buildTree(absPath, absRoot, opts, nextPrefix, lines);
		}
	});
}

const processDirectory = (
	dir: string,
	absRoot: string,
	opts: Options,
	lines: string[],
) => {
	for (const entry of readdirSync(dir)) {
		const absPath = path.join(dir, entry);
		const relPath = path.relative(absRoot, absPath);
		if (!shouldProcessPath(relPath, absPath, opts)) continue;

		const stats = statSync(absPath);
		if (stats.isDirectory()) {
			processDirectory(absPath, absRoot, opts, lines);
		} else if (stats.isFile()) {
			appendFile(absPath, relPath, lines);
		}
	}
}

const appendFile = (
	absPath: string,
	relPath: string,
	lines: string[],
) => {
	const content = readFileSync(absPath, "utf8");

	const ext = path.extname(relPath).replace(/^\./, "");

	lines.push(`### ${relPath}`);
	lines.push("");
	lines.push("```" + ext);
	lines.push(content);
	lines.push("```");
	lines.push("");
}

const main = async (rootPath: string, opts: Options) => {
	const absRoot = path.resolve(rootPath);
	const markdown: string[] = [];

	const treeLines: string[] = [];
	buildTree(absRoot, absRoot, opts, "", treeLines, true);
	markdown.push("## File tree");
	markdown.push("");
	markdown.push("```text");
	markdown.push(...treeLines);
	markdown.push("```");
	markdown.push("");

	processDirectory(absRoot, absRoot, opts, markdown);

	const output = markdown.join("\n");
	if (opts.output) {
		writeFileSync(opts.output, output);
	} else {
		console.log(output);
	}
}

main(root, options).catch((err) => {
	console.error("Error:", err);
	process.exit(1);
});