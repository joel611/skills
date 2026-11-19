## Joel Skills

Heavy inspire by [Matt Pocock skills](https://github.com/mattpocock/skills), fill gap for my preference.

## Install

### Skills

Via [skills.sh](https://skills.sh):

```bash
npx skills add joel611/skills

npx skills add https://github.com/joel611/skills
```

### Claude Code plugins

The [`claude-code/`](/claude-code) folder is a Claude Code plugin marketplace (`joel-plugins`). Only plugins in that folder are installed this way; skills still use skills.sh above.

```
/plugin marketplace add joel611/skills
/plugin install env-redact@joel-plugins
/plugin install pr-diff@joel-plugins
```

## Plugin list

- [env-redact](/claude-code/env-redact/README.md) - redact `.env` secret values from every tool result the model reads
- [pr-diff](/claude-code/pr-diff/README.md) - pane beside the chat with the branch PR status, changed files and diff, nvim keymap

## Skill list

- [gh-accounts](/skills/gh-accounts/SKILL.md) - pick the right GitHub account (personal vs work) from the repo's SSH remote alias before using `gh`
- [visual-evidence](/skills/visual-evidence/SKILL.md) - capture screenshots or video of UI changes and share as PR/issue evidence

## Deprecated skill list

Kept in [`skills/deprecated/`](/skills/deprecated), no longer maintained. [Matt Pocock skills](https://github.com/mattpocock/skills) have since covered these.

- [github-tickets](/skills/deprecated/github-tickets/SKILL.md) - supplement `to-tickets` skill, create breakdown issue under sub issue of spec, not only parent. Deprecated: `to-tickets` now supports sub issues.
- [pr-description](/skills/deprecated/pr-description/SKILL.md) - standardize pull request description. Deprecated: replaced by `pr` skill.
- [finish-spec](/skills/deprecated/finish-spec/SKILL.md) - verify spec tickets are complete and on-spec, then close spec issue. Deprecated: spec now auto closes, no longer needed.
