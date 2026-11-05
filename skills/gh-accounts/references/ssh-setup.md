# Setting up multiple GitHub accounts

Read this only when the user asks how to set up, add, or fix multiple GitHub accounts on one machine. For day-to-day `gh` use, `SKILL.md` is enough.

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

## Adding a new account

1. Generate a key (`ssh-keygen -t ed25519 -f ~/.ssh/<key>`), add the public key to the account's GitHub SSH keys.
2. Add a `Host <name>.github.com` block to `~/.ssh/config` (`HostName github.com`, `User git`, `IdentityFile <key>`).
3. `gh auth login` as that user.
4. Verify: `ssh -T git@<name>.github.com` should greet `Hi <that-user>!`.

## New repos and clones

Put the account in the URL so identity travels with the repo:

```bash
git clone git@<alias>.github.com:<owner>/<repo>.git                  # non-default account
git remote set-url origin git@<alias>.github.com:<owner>/<repo>.git  # fix existing
```

`gh repo clone owner/repo` builds URLs with plain `github.com` (the default account's key). For other accounts, rewrite the remote afterwards with `git remote set-url`.

## Troubleshooting

- **`Permission denied (publickey)` on git push/pull**: the key behind the remote's alias isn't registered on the intended account. Check the alias is right; `ssh -T git@<alias>` should greet the expected user.
- **Stale script cache**: `switch.sh` caches alias → user in `~/.cache/gh-accounts/<alias>`. If a key moves to another account, delete that file.
- **HTTPS remotes** carry no identity. Either move the remote to an alias URL, or list `owner=gh-user` lines in `~/.config/gh-accounts/owners`.
