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

See [SKILL.md](SKILL.md) for the steps and [references/ssh-setup.md](references/ssh-setup.md) for setting up multiple accounts.
