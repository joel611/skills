## Joel Skills

Heavy inspire by [Matt Pocock skills](https://github.com/mattpocock/skills), fill gap for my preference.

## Install

Via [skills.sh](https://skills.sh):

```bash
npx skills add joel611/skills -a claude-code

npx skills add https://github.com/joel611/skills
```

Installs to `.claude/skills/` (project scope). Pass `-g` for `~/.claude/skills/` (global).

Install single skill:

```bash
npx skills add joel611/skills --skill github-tickets -a claude-code
```

List without install: add `--list`. Remove: `npx skills remove <skill-name> -a claude-code`.

## Skill list

[github-tickets](/skills/github-tickets/SKILL.md) - supplement `to-tickets` skill, create breakdown issue under sub issue of spec, not only parent.
[pr-description](/skills/pr-description/SKILL.md) - standardlise pull request description