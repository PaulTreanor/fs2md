#!/usr/bin/env node
import { readdirSync, statSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import meow from "meow";
import {minimatch} from "minimatch";

interface Options {
	output?: string;
	excludePatterns: string[];
}

const helpMessageString = `
\nConvert every file under ROOT into one Markdown blob.

Usage:
	$ fs2md <root> [options]

Options:
	-o, --output FILE        write Markdown here (default: stdout)
	-x, --exclude PATTERN       glob to ignore (repeatable)
	-h, --help               show this message
\n
`;

const cli = meow(
	helpMessageString,
	{
		importMeta: import.meta,
		flags: {
			output: { type: "string", shortFlag: "o" },
			exclude: { type: "string", shortFlag: "x", isMultiple: true },
		},
	},
);

const root = cli.input[0] ?? ".";
const options: Options = {
	output: cli.flags.output,
	excludePatterns: (cli.flags.exclude ?? []) as string[],
};

const shouldExclude = (relPath: string, absPath: string, opts: Options): boolean => {
	for (const pattern of opts.excludePatterns) {
		if (minimatch(relPath, pattern, { dot: true })) return true;
	}

	return false;
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
		if (shouldExclude(rel, path.join(dir, entry), opts)) return false;
		return true;
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
		if (shouldExclude(relPath, absPath, opts)) continue;

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