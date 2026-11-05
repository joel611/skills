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
```

## Plugin list

- [env-redact](/claude-code/env-redact/README.md) - redact `.env` secret values from every tool result the model reads

## Skill list

- [visual-evidence](/skills/visual-evidence/SKILL.md) - capture screenshots or video of UI changes and share as PR/issue evidence

## Deprecated skill list

Kept in [`skills/deprecated/`](/skills/deprecated), no longer maintained.

- [github-tickets](/skills/deprecated/github-tickets/SKILL.md) - supplement `to-tickets` skill, create breakdown issue under sub issue of spec, not only parent.
- [pr-description](/skills/deprecated/pr-description/SKILL.md) - standardize pull request description
- [finish-spec](/skills/deprecated/finish-spec/SKILL.md) - verify spec tickets are complete and on-spec, then close spec issue
