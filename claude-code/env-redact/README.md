# env-redact

A Claude Code mod that keeps `.env` secrets out of the model's context. Before each tool call it reads the `.env` and `.env.*` files in the working directory (skipping `*.example`, `*.sample`, `*.template`), then replaces every secret value in the tool's result with `[REDACTED:KEY_NAME]`. It works on any tool (Read, Bash `cat`, Grep, and so on) because it walks the result generically.

## What counts as a secret

Values whose key name matches `SECRET`, `TOKEN`, `PASSWORD`, `PASS`, `PRIVATE`, `CREDENTIAL`, `API_KEY`, `*_KEY`, `DSN` or `DATABASE_URL`, and which are at least 6 characters long.

## Limits

- Only `.env` files in the working directory, plus one a Read call points at, are scanned.
- Matching is exact: a secret that is re-encoded or split is not caught.
- It masks output; it does not block the model from reading the file.
- Files created by the same command that prints them are not covered, since the scan runs before the tool.

## Install

```
/plugin install env-redact@joel-plugins
```
