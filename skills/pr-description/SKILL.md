---
name: pr-description
description: PR description template for this repo. Use whenever creating or editing a PR body (gh pr create, gh pr edit) so related GitHub issues auto-close on merge.
---

# PR description template

PR resolve issue(s) must auto-close on merge via GitHub closing keywords.

## Rule

**First line** of PR body must be closing statement, before `## Summary`:

```
Closes #<N>[, #<M>, ...]
```

- List every issue this PR fully resolves. Use `Closes` (not `Fixes`/`Resolves` — pick one verb, keep consistent across repo).
- Only list issues actually resolved by this PR's diff. Issue referenced but deliberately deferred (see ADR marking out of scope) goes in prose, not closing line.
- No issues resolved (docs-only or infra-only PR) → omit line entirely, don't write `Closes` with nothing after it.

## Template

```md
Closes #<N>, #<M>

## Summary
- <what changed and why, 1-3 bullets>

## Test plan
- [ ] <how this was verified>

## QA Test Steps
1. <how qa test this>

🤖 Generated with [Claude Code](https://claude.com/claude-code)
https://claude.ai/code/session_017QWhHHbUxYJ3kusvFbqUDu
```

## Example

```md
Closes #9, #10, #15, #16

## Summary
- primaryColor/welcomeMessage/avatarUrl wired into rendering per ADR-0007
- destroy() added for SPA cleanup
- #17 intentionally left open — deferred per ADR-0008, not part of this PR

## Test plan
- [x] bun run typecheck passes
- [x] verified live in headless Chromium

🤖 Generated with [Claude Code](https://claude.com/claude-code)
https://claude.ai/code/session_017QWhHHbUxYJ3kusvFbqUDu
```