# fs2md

A CLI that walks a folder and adds the contents of every accepted file into a markdown document alongside a visual file tree. 

Perfect for pasting context into LLMs.

---

## Install

Install globally via npm:

```bash
npm install -g fs2md
```

Or use directly with npx (no installation needed):

```bash
npx fs2md <root> [options]
```

Or build it manually:

```bash
# Clone repo
npm install
npm run build
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

### 4 · Tight token budget (to not blow your context windows)

```bash
fs2md ./docs -t 6000 | pbcopy
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
