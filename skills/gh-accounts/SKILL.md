---
name: gh-accounts
description: Run before every `gh` command when the machine has multiple GitHub accounts. Resolves the repo's account from its git remote and scopes `gh` to it via `GH_TOKEN`. Also use on `Could not resolve to a Repository`, 404 on an existing repo, or "wrong account" errors, and when asked to set up multiple GitHub accounts.
---

# gh-accounts

## Steps

Do this in **every** shell call that runs `gh`. Never reuse an earlier call's result.

1. `cd` into the repo.
2. Put the `gh` command(s) in the same shell call, after this line:
   ```bash
   t=$(<skill-dir>/scripts/switch.sh --token) && GH_TOKEN=$t gh pr view 12
   ```
   For several `gh` commands in one call:
   ```bash
   t=$(<skill-dir>/scripts/switch.sh --token) && export GH_TOKEN=$t || exit 1
   gh pr view 12
   gh pr checks 12
   ```
3. If the script exits non-zero, stop. Don't run `gh`. Tell the user:
   - exit 2: can't resolve the account (no remote, HTTPS remote, no SSH greeting)
   - exit 3: resolved user not logged in; needs `gh auth login`
4. Outside a repo or with `-R owner/repo`: add `--user <gh-user>` to the script.
5. Never echo or log the token.

Keep the `t=... &&` form. `GH_TOKEN=$(...) gh ...` runs `gh` with an empty token when the script fails.

## On errors

`Could not resolve to a Repository`, 404 on an existing repo, `Resource not accessible`: re-run step 2 once, then check repo name and token scopes.

## Script

`scripts/switch.sh`, run in the repo:

```bash
switch.sh --token       # print resolved account's token
switch.sh --print       # print resolved gh user
switch.sh               # fallback: global gh auth switch (other agents can flip it back)
switch.sh --user X      # skip detection
switch.sh --remote R    # read remote R instead of origin
```

HTTPS remote: list `owner=gh-user` lines in `~/.config/gh-accounts/owners`, or move the remote to an SSH alias URL. Don't guess.

## Setup help

User asks how to set up or add accounts, clone with the right identity, or fix `Permission denied (publickey)`: read `references/ssh-setup.md`.
