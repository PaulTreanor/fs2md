#!/usr/bin/env node
import { readdirSync, statSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import meow from "meow";
import {minimatch} from "minimatch";

interface Options {
	output?: string;
	skipPatterns: string[];
	extSet?: Set<string>;
}

const cli = meow(
	`\nConvert every file under ROOT into one Markdown blob.\n\nUsage\n  $ fs2md <root> [options]\n\nOptions\n  -o, --output FILE        write Markdown here (default: stdout)\n  -x, --skip PATTERN       glob to ignore (repeatable)\n  -e, --ext EXT[,EXT…]     only these extensions\n    -h, --help               show this message\n`,
	{
		importMeta: import.meta,
		flags: {
			output: { type: "string", shortFlag: "o" },
			skip: { type: "string", shortFlag: "x", isMultiple: true },
			ext: { type: "string", shortFlag: "e" },
		},
	},
);

const root = cli.input[0] ?? ".";
const options: Options = {
	output: cli.flags.output,
	skipPatterns: (cli.flags.skip ?? []) as string[],
};

if (cli.flags.ext) {
	const exts = String(cli.flags.ext)
		.split(",")
		.map((s) => s.trim().toLowerCase())
		.filter(Boolean)
		.map((s) => (s.startsWith(".")) ? s : `.${s}`);
	options.extSet = new Set(exts);
}

main(root, options).catch((err) => {
	console.error("Error:", err);
	process.exit(1);
});

async function main(rootPath: string, opts: Options) {
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

function buildTree(
	dir: string,
	absRoot: string,
	opts: Options,
	prefix: string,
	lines: string[],
	rootLevel = false,
) {
	const entries = readdirSync(dir).filter((entry) => {
		const rel = path.relative(absRoot, path.join(dir, entry));
		if (shouldSkip(rel, path.join(dir, entry), opts)) return false;
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

function processDirectory(
	dir: string,
	absRoot: string,
	opts: Options,
	lines: string[],
) {
	for (const entry of readdirSync(dir)) {
		const absPath = path.join(dir, entry);
		const relPath = path.relative(absRoot, absPath);
		if (shouldSkip(relPath, absPath, opts)) continue;

		const stats = statSync(absPath);
		if (stats.isDirectory()) {
			processDirectory(absPath, absRoot, opts, lines);
		} else if (stats.isFile()) {
			appendFile(absPath, relPath, lines);
		}
	}
}

function shouldSkip(relPath: string, absPath: string, opts: Options): boolean {
	for (const pattern of opts.skipPatterns) {
		if (minimatch(relPath, pattern, { dot: true })) return true;
	}

	if (opts.extSet) {
		const ext = path.extname(relPath).toLowerCase();
		if (!opts.extSet.has(ext)) return true;
	}

	return false;
}

function appendFile(
	absPath: string,
	relPath: string,
	lines: string[],
) {
	const content = readFileSync(absPath, "utf8");

	const ext = path.extname(relPath).replace(/^\./, "");

	lines.push(`### ${relPath}`);
	lines.push("");
	lines.push("```" + ext);
	lines.push(content);
	lines.push("```");
	lines.push("");
}
