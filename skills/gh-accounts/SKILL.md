---
name: gh-accounts
description: Pick the right GitHub account before any `gh` command (or git push/pull over SSH) when one machine holds multiple GitHub accounts (personal + work). Read the repo's git remote URL, map its SSH host alias to a `gh` user, and run `gh auth switch --user <user>` first. Use this skill BEFORE every `gh pr`, `gh issue`, `gh repo`, `gh api`, `gh run`, `gh release` call, and whenever you see `Could not resolve to a Repository`, `HTTP 404` on a repo that exists, `Permission denied (publickey)`, `Resource not accessible`, or "wrong account" problems — even if the user never mentions accounts. Also use when cloning, adding a remote, or setting up a new repo's identity.
---

# gh-accounts

One machine, two GitHub identities. `gh` has one *active* account at a time, and private repos owned by the other account fail with misleading errors (`Could not resolve to a Repository with the name 'org/repo'`, 404) instead of "wrong account". Picking the account first avoids that whole failure class.

## Account map

| SSH host alias (in remote URL) | gh user | Use for |
|---|---|---|
| `github.com` (default) | `joel-hypthon` | Work (Hypthon). Orgs: `hypthon-dev` |
| `hypthon.github.com` | `joel-hypthon` | Work, explicit alias |
| `joel611.github.com` | `joel611` | Personal. Repos: `joel611/*`, `611bol/*`, `611-bread-of-life-christian-church/*` |

Each alias in `~/.ssh/config` points `HostName github.com` at a different `IdentityFile`, so the alias in the remote URL decides which SSH key (and therefore identity) git uses. Example remotes:

```
git@github.com:hypthon-dev/dev-hub.git          -> joel-hypthon
git@joel611.github.com:611bol/website-revamp.git -> joel611
```

If the map is out of date, check `gh auth status` for logged-in users and `~/.ssh/config` for `Host *github.com` entries, then update this table.

## Before any `gh` command

1. Read the remote: `git remote get-url origin` (use the repo's working directory; worktrees share the remote).
2. Extract the host from the SSH URL — the part between `@` and `:`.
3. Look it up in the table, then switch:
   ```bash
   gh auth switch --hostname github.com --user <user>
   ```
4. Run the real `gh` command. Skip step 3 only if `gh auth status` already shows that user as `Active account: true`.

One-liner for steps 1–3:

```bash
url=$(git remote get-url origin)
case "$url" in
  *@joel611.github.com[:/]*) u=joel611 ;;
  *@github.com[:/]*|*@hypthon.github.com[:/]*) u=joel-hypthon ;;
  *) echo "HTTPS/unknown remote $url — map by owner or ask user"; false ;;
esac && gh auth switch --hostname github.com --user "$u"
```

## Edge cases

- **HTTPS remote** (`https://github.com/org/repo.git`): no alias to read, so the host says nothing about identity. Map by owner instead (`hypthon-dev` → `joel-hypthon`; `joel611`, `611bol`, `611-bread-of-life-christian-church` → `joel611`). If the owner is unknown, ask the user rather than guess, and suggest moving the remote to an alias URL.
- **No remote / `gh` outside a repo / `-R owner/repo`**: map by owner as above.
- **Parallel sessions or worktrees**: `gh auth switch` changes global state shared by every terminal and agent. Another session may flip it mid-task. When running several `gh` calls or working alongside other sessions, scope the account to the single command instead:
  ```bash
  GH_TOKEN=$(gh auth token --user joel611) gh pr view 12
  ```
  `GH_TOKEN` overrides the active account for that process only and leaves global state alone.
- **After an error** (`Could not resolve to a Repository`, 404 on a repo that exists, `Resource not accessible`): don't retry blindly and don't conclude the repo is missing. Run `gh auth status`, compare the active user with the table, switch, retry once. Only then investigate repo name or token scopes.
- **`Permission denied (publickey)` on git push/pull**: the remote URL alias points to a key not registered on the intended account. Check the remote host alias is right, `ssh -T git@<alias>` should greet the expected user.

## New repos and clones

Put the account in the URL so identity travels with the repo:

```bash
git clone git@joel611.github.com:611bol/website-revamp.git   # personal
git clone git@github.com:hypthon-dev/dev-hub.git              # work
git remote set-url origin git@joel611.github.com:owner/repo.git   # fix existing
```

When `gh repo clone owner/repo` is used, it builds URLs with plain `github.com`; for personal repos rewrite the remote afterwards with `git remote set-url`.

Verify identity when unsure:

```bash
ssh -T git@joel611.github.com   # "Hi joel611!"
ssh -T git@github.com           # "Hi joel-hypthon!"
```

## Adding a new account

1. Generate a key, add it to the account's GitHub SSH keys.
2. Add a `Host <name>.github.com` block to `~/.ssh/config` (`HostName github.com`, `User git`, `IdentityFile <key>`).
3. `gh auth login` as that user.
4. Add a row to the account map above.
