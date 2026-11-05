# gh-accounts

## When it triggers

Automatically, before every `gh` comment/command (`gh pr`, `gh issue`, `gh repo`, `gh api`, `gh run`, ...). Also on account errors like `Could not resolve to a Repository` or a 404 on a repo that exists.

## Why

Personal + work GitHub accounts on one machine, but `gh` has only one active account. The agent hits the wrong one and gets:

```text
GraphQL: Could not resolve to a Repository with the name 'org/repo'. (repository)
```

It looks like "repo missing" or "no permission". The real cause is the wrong account. The agent then wastes turns running `gh auth status`, `gh auth switch`, retrying. A parallel agent flips the account back and the error returns.

**Cost** (measured from 25 real incidents in local session logs):

- Each error ≈ **200k tokens** (3 extra turns, mostly re-reading the whole conversation; p90 ≈ 375k).
- At Sonnet API list prices (assumed) that is ≈ **$0.10** per error.
- **~200 errors ≈ one $20 Pro subscription.**

Lower bound: thinking tokens and wall-clock time are not counted, and the cost grows with session length. The skill itself costs ~100 tokens per `gh` call.

## Solution

Read the repo's git remote, map the SSH host alias to a `gh` user, and scope that one call with the user's token:

```bash
t=$(<skill-dir>/scripts/switch.sh --token) && GH_TOKEN=$t gh pr view 12
```

- No global `gh auth switch`, so parallel agents can't flip it back.
- Fails loudly (non-zero exit) instead of running `gh` with the wrong or empty token.

See [SKILL.md](SKILL.md) for the steps and [references/ssh-setup.md](references/ssh-setup.md) for setting up multiple accounts.
