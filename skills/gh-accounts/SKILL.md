---
name: gh-accounts
description: Run `scripts/switch.sh` immediately before EVERY `gh` command or series of `gh` commands (in the same shell call) when one machine holds multiple GitHub accounts (personal + work). It reads the repo's git remote, maps the SSH host alias to a `gh` user, and runs `gh auth switch --user`. MUST use before any `gh pr`, `gh issue`, `gh repo`, `gh api`, `gh run`, `gh release`, `gh search` call, even if you switched earlier in the session, and whenever you see `Could not resolve to a Repository`, `HTTP 404` on a repo that exists, `Resource not accessible`, or "wrong account" problems. Also use when asked how to set up or add multiple GitHub accounts (see references/ssh-setup.md).
---

# gh-accounts

One machine, several GitHub identities. `gh` has one *active* account, stored globally, and private repos owned by another account fail with misleading errors (`Could not resolve to a Repository with the name 'org/repo'`, 404) instead of "wrong account".

## MUST: switch right before every `gh` call

Other agents and terminals share the same `gh` state and may switch it at any moment. A switch done at session start, or even a few commands ago, proves nothing now. So run the script **in the same shell command as the `gh` calls**, as the first step, every time:

```bash
<skill-dir>/scripts/switch.sh && gh pr view 12
```

For a series of `gh` calls, put them all in one command after a single switch, so nothing can interleave:

```bash
<skill-dir>/scripts/switch.sh && {
  gh pr view 12
  gh pr checks 12
  gh issue list
}
```

Don't split a series across separate tool calls with the switch only in the first; run the script again in each call. It is cheap: it skips the switch when the right account is already active, and caches the SSH lookup.

For a long series where a mid-run flip by another agent would hurt, scope the account to the process instead of global state. This cannot be interleaved by other sessions:

```bash
GH_TOKEN=$(gh auth token --user "$(<skill-dir>/scripts/switch.sh --print)") gh pr view 12
```

Run from inside the repo (the script reads its remote). For `gh -R owner/repo` outside a repo, use `switch.sh --user <gh-user>`.

## The script

`scripts/switch.sh` reads `origin`, resolves the SSH host alias to the GitHub user with `ssh -T git@<alias>` (the greeting names the key's owner; cached in `~/.cache/gh-accounts/`), checks that user is logged in, and switches only if needed.

```bash
switch.sh               # switch to the repo's account
switch.sh --print       # print the resolved gh user, no switch
switch.sh --user X      # skip detection
switch.sh --remote R    # read remote R instead of origin
```

Exit codes: 2 = cannot resolve (no remote, HTTPS remote with no owner entry, no SSH greeting); 3 = resolved user not logged in to `gh` (`gh auth login` needed). On a non-zero exit, don't run the `gh` command; tell the user.

HTTPS remotes carry no identity. Map by owner via `~/.config/gh-accounts/owners` (`owner=gh-user` per line), or suggest moving the remote to an alias URL. Don't guess.

## After an error

On `Could not resolve to a Repository`, 404 on a repo that exists, or `Resource not accessible`: don't conclude the repo is missing. Re-run `switch.sh` in the same command, retry once, and only then look at the repo name or token scopes. If it was another agent flipping the account, `gh auth status` will show it.

## Setup help

If the user asks how to set up multiple accounts, add one, fix `Permission denied (publickey)`, or clone with the right identity, read `references/ssh-setup.md`.
