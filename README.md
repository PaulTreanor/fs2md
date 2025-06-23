# fs2md

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run fs2md.ts
```

This project was created using `bun init` in bun v1.1.24. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.


## API
```bash
fs2md ROOT [options]

Options
    -o, --output FILE 
    -x, --skip PATTERN  # glob to ignore (repeatable) like *.log or */node_modules/*
    -e, --ext EXT[,EXT…] # only these extensions, e.g. ".py,.md"
    -b, --bytes SIZE    # skip files larger than SIZE (k, M, G accepted)
    -t, --tokens N 
    -h, --help # show this message
```