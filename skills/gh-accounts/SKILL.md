---
name: gh-accounts
description: Scope every `gh` command to the right GitHub account by running `scripts/switch.sh --token` in the same shell call, when one machine holds multiple GitHub accounts (personal + work). It reads the repo's git remote, maps the SSH host alias to a `gh` user, and returns that user's token for `GH_TOKEN`. MUST use before any `gh pr`, `gh issue`, `gh repo`, `gh api`, `gh run`, `gh release`, `gh search` call, even if you did it earlier in the session, and whenever you see `Could not resolve to a Repository`, `HTTP 404` on a repo that exists, `Resource not accessible`, or "wrong account" problems. Also use when asked how to set up or add multiple GitHub accounts (see references/ssh-setup.md).
---

# gh-accounts

One machine, several GitHub identities. `gh` has one *active* account, stored globally, and private repos owned by another account fail with misleading errors (`Could not resolve to a Repository with the name 'org/repo'`, 404) instead of "wrong account".

## MUST: scope the account on every `gh` call

Other agents and terminals share the stored `gh` state, and an account chosen earlier may have been flipped since. So don't rely on global state at all. `GH_TOKEN` in the environment overrides the stored account for that process only, and no other session can change it. Resolve it fresh in **every** shell call that runs `gh`:

```bash
t=$(<skill-dir>/scripts/switch.sh --token) && GH_TOKEN=$t gh pr view 12
```

For a series of `gh` calls, export once at the top of the same command:

```bash
t=$(<skill-dir>/scripts/switch.sh --token) && export GH_TOKEN=$t || exit 1
gh pr view 12
gh pr checks 12
gh issue list
```

Why the `t=... &&` shape: with `GH_TOKEN=$(failing-cmd) gh ...` a failed lookup yields an empty token, and `gh` silently falls back to whatever account is active, which is the exact bug this skill prevents. Assigning first lets a failure stop the command.

Env vars don't persist between separate Bash tool calls, so repeat this in each call; it is cheap (SSH lookup is cached).

Run from inside the repo (the script reads its remote). For `gh -R owner/repo` outside a repo, use `switch.sh --user <gh-user> --token`.

Note `GH_TOKEN` only affects `gh`. `git push/pull` over SSH picks its identity from the remote's host alias, which is already per-repo.

## Fallback: change the stored account

Only for an interactive terminal where setting an env var per command is awkward. This is global, so other agents can flip it back at any time:

```bash
<skill-dir>/scripts/switch.sh        # runs gh auth switch for the repo's account
```

While `GH_TOKEN` is set, `gh auth switch` refuses to run; the script clears `GH_TOKEN` for its own calls.

## The script

`scripts/switch.sh` reads `origin`, resolves the SSH host alias to the GitHub user with `ssh -T git@<alias>` (the greeting names the key's owner; cached in `~/.cache/gh-accounts/`), and checks that user is logged in.

```bash
switch.sh --token       # print the resolved account's token (default path)
switch.sh --print       # print the resolved gh user, nothing else
switch.sh               # fallback: gh auth switch to the resolved user
switch.sh --user X      # skip detection (combine with --token)
switch.sh --remote R    # read remote R instead of origin
```

Exit codes: 2 = cannot resolve (no remote, HTTPS remote with no owner entry, no SSH greeting); 3 = resolved user not logged in to `gh` (`gh auth login` needed). On a non-zero exit, don't run the `gh` command; tell the user.

HTTPS remotes carry no identity. Map by owner via `~/.config/gh-accounts/owners` (`owner=gh-user` per line), or suggest moving the remote to an alias URL. Don't guess.

Treat the token as a secret: never echo it, log it, or put it in a file, PR body, or command shown to the user.

## After an error

On `Could not resolve to a Repository`, 404 on a repo that exists, or `Resource not accessible`: don't conclude the repo is missing. Re-run with the scoped token above and retry once; check `GH_TOKEN` isn't already set to the wrong account in your shell. Only then look at the repo name or token scopes.

## Setup help

If the user asks how to set up multiple accounts, add one, fix `Permission denied (publickey)`, or clone with the right identity, read `references/ssh-setup.md`.
