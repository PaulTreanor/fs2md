# fs2md

A CLI that adds contents of files to markdown along with a visual file tree.

Perfect for pasting context into LLMs.


## Quick Start
```bash
# Include only TypeScript, exclude tests
npx fs2md . -i "**/*.ts" -x "**/*.test.ts" | pbcopy

# Or save to file
npx fs2md . -x "node_modules/**" -o codebase.md
```

## Install

Install globally via npm:

```bash
npm install -g fs2md
```

Or use directly with npx (no installation needed):

```bash
npx fs2md <root> [options]
```

---

## Usage

```bash
fs2md <root> [options]
```

| Option                  | Description                                          | Default |
| ----------------------  | ---------------------------------------------------- | ------- |
| `-o, --output FILE`     | Write the Markdown here instead of stdout            | —       |
| `-i, --include PATTERN` | Glob(s) to include (repeatable, comma-separated)     | all     |
| `-x, --exclude PATTERN` | Glob(s) to exclude (repeatable, comma-separated)     | none    |

---

## Examples

### 1 · Dump current directory to stdout

```bash
fs2md .
```


### 2 · Only include TypeScript files, exclude tests, then copy to clipboard

```bash
fs2md . -i "**/*.ts" -x "**/*.test.ts" | pbCopy
```

### 3 · Produce a single repo.md that excludes node_modules

```bash
fs2md . -x "node_modules/**" -o repo.md"
```

### 4 · Include only source files from specific directories

```bash
fs2md . -i "src/**, lib/**" -o codebase.md
```


## Example Input and output

Input:
```bash
fs2md ./test/fixtures/sample-project -x "**/*.js"
```

Output:
<pre>
## File tree

```text
├── .gitignore
├── docs
│   └── README.md
└── src
    └── index.ts
```

### .gitignore

```
node_modules/
*.log
```

### docs/README.md

```md
# Sample Project

This is a test fixture.
```

### src/index.ts

```ts
export function hello() {
  return "Hello World";
}
```
</pre>


---

## Exit codes

| Code | Meaning                                      |
| ---- | -------------------------------------------- |
| `0`  | Success                                      |
| `1`  | Usage error / invalid flag                   |
| `>1` | Unhandled exception (I/O, permissions, etc.) |

---

## License

MIT

## Build and run manually

```bash
# Clone repo
npm install
npm run build

# Run local build 
node dist/fs2md.js <root> [options]
```

