
---
name: pr-description
description: PR description template for this repo. Use whenever creating or editing a PR body (gh pr create, gh pr edit) so related GitHub issues auto-close on merge.
---

# PR description template

Every PR that resolves one or more issues must auto-close them on merge via GitHub's closing keywords.

## Rule

The **first line** of the PR body must be a closing statement, before `## Summary`:

```
Closes #<N>[, #<M>, ...]
```

- List every issue this PR fully resolves. Use `Closes` (not `Fixes`/`Resolves` — pick one verb, keep it consistent across the repo).
- Only list issues actually resolved by this PR's diff. An issue referenced but deliberately deferred (see any ADR marking it out of scope) is mentioned in prose, not in the closing line.
- No issues resolved (e.g. a docs-only or infra-only PR) → omit the line entirely, don't write `Closes` with nothing after it.

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
