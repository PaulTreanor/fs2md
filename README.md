# fs2md

A tiny CLI that walks a folder (recursively, by default) and dumps every accepted file into **one** Markdown document—perfect for pasting straight into an LLM.

---

## Install

```bash
# Using Bun (recommended)
bun add -g fs2md

# Or via npm / pnpm / yarn once published
npm install -g fs2md
```

If you prefer a zero‑dependency binary:

```bash
bun build fs2md.ts --compile --outfile fs2md
mv fs2md /usr/local/bin
```

---

## Usage

```bash
fs2md <root> [options]
```

| Option                 | Description                                          | Default |
| ---------------------- | ---------------------------------------------------- | ------- |
| `-o, --output FILE`    | Write the Markdown here instead of stdout            | —       |
| `-x, --skip PATTERN`   | Glob(s) to ignore (repeatable)                       | none    |
| `-e, --ext EXT[,EXT…]` | Onlyinclude these extensions                         | all     |
| `-b, --bytes SIZE`     | Skip files larger than SIZE (`k`, `M`, `G` accepted) | none    |
| `-t, --tokens N`       | Skip files whose estimated token count > N           | none    |

---

## Examples

### 1 · Dump current directory to stdout

```bash
fs2md .
```

### 2 · Produce a single `repo.md`,  skip `node_modules`, only `.ts` & `.md` files

```bash
fs2md . \
  -e .ts,.md \
  -x "*/node_modules/*" \
  -o repo.md
```

### 3 · Limit big binaries (> 4 MB) and noisy logs

```bash
fs2md /var/www -b 4M -x "*.log" > site_snapshot.md
```

### 4 · Tight token budget (for GPT‑4o)

```bash
fs2md ./docs -t 6000 | clipcopy
```

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
