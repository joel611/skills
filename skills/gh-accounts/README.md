# gh-accounts

Personal + work GitHub accounts on one machine. `gh` has one active account, so agents hit this all the time:

```text
GraphQL: Could not resolve to a Repository with the name 'org/repo'. (repository)
```

It looks like "repo missing" or "no permission". The real cause is the wrong account being active. Then the agent burns extra steps:

1. Run `gh auth status` and guess which account owns the repo.
2. Run `gh auth switch`, or hand-build `GH_TOKEN=$(gh auth token --user X)`.
3. Retry. Another parallel agent flips the account back, and the error returns.

This skill removes those steps: read the repo's remote, pick the matching account, scope `gh` to its token on every call.

## What one failure costs

Measured from 25 real incidents in local Claude Code session logs: a `gh` command failed with an account error (`Could not resolve to a Repository`, `HTTP 404/403`, `Resource not accessible`, `publickey`), and the cost counted every turn until the next successful `gh` call.

| Per incident | Mean | Median | p90 |
|---|---|---|---|
| Extra assistant turns | 3 | 2 | 4 |
| Output tokens (diagnosing, retrying) | 837 | 366 | 1,586 |
| Tool-result tokens (`gh auth status` dumps etc.) | 384 | 145 | 389 |
| New context written to cache | 2,076 | 975 | 2,584 |
| Context re-read from cache | 219k | 105k | 372k |

Weighting output 5×, cache writes 2× and cache reads 0.1× of a normal input token (assumed ratios, adjust to your plan), one failure is about **14k (median) to 30k (mean) input-token-equivalents**. About 70% of that is re-reading the conversation on the extra turns, so a failure costs more the longer the session is.

Treat it as a lower bound:
- Sessions where the agent already used `GH_TOKEN=...` from habit show no error, so they are not counted.
- Thinking tokens and wall-clock time are not counted.
- The skill's own overhead is about 100 tokens per `gh` call plus about 600 tokens when loaded, far below one failure.

Beyond tokens, the failure is misleading: an agent can conclude the repo does not exist, or stop and ask you for access you already have.

See [SKILL.md](SKILL.md) for the steps and [references/ssh-setup.md](references/ssh-setup.md) for setting up multiple accounts.
