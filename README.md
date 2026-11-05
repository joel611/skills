## Joel Skills

Heavy inspire by [Matt Pocock skills](https://github.com/mattpocock/skills), fill gap for my preference.

## Why gh-accounts

Personal + work GitHub accounts on one machine. `gh` has one active account, so agents hit this all the time:

```text
GraphQL: Could not resolve to a Repository with the name 'org/repo'. (repository)
```

Looks like "repo missing" or "no permission". Real cause: wrong account active. Then the agent burns extra steps:

1. Run `gh auth status` and guess which account owns the repo.
2. Run `gh auth switch`, or hand-build `GH_TOKEN=$(gh auth token --user X)`.
3. Retry. Another parallel agent flips the account back, error returns.

[gh-accounts](/skills/gh-accounts/SKILL.md) removes these steps: read the repo's remote, pick the matching account, scope `gh` to its token on every call.

## Install

Via [skills.sh](https://skills.sh):

```bash
npx skills add joel611/skills

npx skills add https://github.com/joel611/skills
```

## Skill list

- [github-tickets](/skills/github-tickets/SKILL.md) - supplement `to-tickets` skill, create breakdown issue under sub issue of spec, not only parent.
- [pr-description](/skills/pr-description/SKILL.md) - standardize pull request description
- [finish-spec](/skills/finish-spec/SKILL.md) - verify spec tickets are complete and on-spec, then close spec issue
- [gh-accounts](/skills/gh-accounts/SKILL.md) - pick the right GitHub account (personal vs work) from the repo's SSH remote alias before using `gh`
- [visual-evidence](/skills/visual-evidence/SKILL.md) - capture screenshots or video of UI changes and share as PR/issue evidence
