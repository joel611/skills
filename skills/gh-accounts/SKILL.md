---
name: gh-accounts
description: Pick the right GitHub account before any `gh` command (or git push/pull over SSH) when one machine holds multiple GitHub accounts (personal + work). Read the repo's git remote URL, map its SSH host alias to a `gh` user, and run `gh auth switch --user <user>` first. Use this skill BEFORE every `gh pr`, `gh issue`, `gh repo`, `gh api`, `gh run`, `gh release` call, and whenever you see `Could not resolve to a Repository`, `HTTP 404` on a repo that exists, `Permission denied (publickey)`, `Resource not accessible`, or "wrong account" problems — even if the user never mentions accounts. Also use when cloning, adding a remote, or setting up a new repo's identity.
---

# gh-accounts

One machine, several GitHub identities. `gh` has one *active* account at a time, and private repos owned by another account fail with misleading errors (`Could not resolve to a Repository with the name 'org/repo'`, 404) instead of "wrong account". Picking the account first avoids that whole failure class.

## How identity is encoded

`~/.ssh/config` defines one `Host` alias per account. Each alias points `HostName github.com` at a different `IdentityFile`, so the alias used in a repo's remote URL decides which SSH key, and therefore which account, git uses:

```
Host github.com              # default account
  HostName github.com
  User git
  IdentityFile ~/.ssh/<default-key>

Host <alias>.github.com      # another account
  HostName github.com
  User git
  IdentityFile ~/.ssh/<other-key>
```

```
git@github.com:<owner>/<repo>.git         -> default account
git@<alias>.github.com:<owner>/<repo>.git -> account behind <alias>
```

## Resolve alias → `gh` user

Don't assume the mapping; derive it. For the alias in the remote, ask GitHub who the key belongs to:

```bash
ssh -T git@<alias>     # "Hi <gh-user>! You've successfully authenticated..."
gh auth status         # lists every logged-in gh user and which is active
```

The `<gh-user>` greeted by `ssh -T` is the user to pass to `gh auth switch`. If it isn't in `gh auth status`, that account needs `gh auth login` first.

Once resolved in a session, remember the mapping and skip the `ssh -T` call. If the user keeps a standing map (in memory or CLAUDE.md), prefer it.

## Fast path: the script

`scripts/switch.sh` (next to this file) does everything below in one call: reads the remote, resolves the alias with `ssh -T` (cached in `~/.cache/gh-accounts/`), checks the user is logged in, and switches only if needed. Run it from inside the repo before any `gh` command:

```bash
<skill-dir>/scripts/switch.sh            # switch to the repo's account
<skill-dir>/scripts/switch.sh --print    # just print the resolved gh user (use with GH_TOKEN=$(gh auth token --user "$(...)"))
<skill-dir>/scripts/switch.sh --user X   # skip detection
```

Exit 2 = cannot resolve (HTTPS remote with no owner entry, no remote, no SSH greeting); exit 3 = resolved user is not logged in to `gh`. For HTTPS remotes it reads an optional owner map, one `owner=gh-user` per line, in `~/.config/gh-accounts/owners`. If the cache goes stale (key moved to another account), delete the alias file in the cache dir.

## Before any `gh` command (manual steps)

1. Read the remote: `git remote get-url origin` (run in the repo's directory; worktrees share the remote).
2. Extract the host alias from the SSH URL — the part between `@` and `:`.
3. Resolve the alias to a `gh` user (above), then switch:
   ```bash
   gh auth switch --hostname github.com --user <gh-user>
   ```
4. Run the real `gh` command. Skip step 3 only if `gh auth status` already shows that user as `Active account: true`.

Extract the host from a remote URL:

```bash
git remote get-url origin | sed -E 's#^(git@|ssh://git@)([^:/]+)[:/].*#\2#'
```

HTTPS remotes don't match that pattern and carry no identity; see edge cases.

## Edge cases

- **HTTPS remote** (`https://github.com/<owner>/<repo>.git`): the host says nothing about identity. Map by owner using what you learned from earlier repos or the user's notes. If unsure, ask rather than guess, and suggest moving the remote to an alias URL.
- **No remote / `gh` outside a repo / `-R owner/repo`**: map by owner as above.
- **Parallel sessions or worktrees**: `gh auth switch` changes global state shared by every terminal and agent. Another session may flip it mid-task. When running several `gh` calls or working alongside other sessions, scope the account to the single command instead:
  ```bash
  GH_TOKEN=$(gh auth token --user <gh-user>) gh pr view 12
  ```
  `GH_TOKEN` overrides the active account for that process only and leaves global state alone.
- **After an error** (`Could not resolve to a Repository`, 404 on a repo that exists, `Resource not accessible`): don't retry blindly and don't conclude the repo is missing. Run `gh auth status`, compare the active user with the expected one, switch, retry once. Only then investigate repo name or token scopes.
- **`Permission denied (publickey)` on git push/pull**: the key behind the remote's alias isn't registered on the intended account. Check the alias is right; `ssh -T git@<alias>` should greet the expected user.

## New repos and clones

Put the account in the URL so identity travels with the repo:

```bash
git clone git@<alias>.github.com:<owner>/<repo>.git          # non-default account
git remote set-url origin git@<alias>.github.com:<owner>/<repo>.git   # fix existing
```

`gh repo clone owner/repo` builds URLs with plain `github.com` (the default account's key). For other accounts, rewrite the remote afterwards with `git remote set-url`.

## Adding a new account

1. Generate a key, add it to the account's GitHub SSH keys.
2. Add a `Host <name>.github.com` block to `~/.ssh/config` (`HostName github.com`, `User git`, `IdentityFile <key>`).
3. `gh auth login` as that user.
4. Verify with `ssh -T git@<name>.github.com`.
