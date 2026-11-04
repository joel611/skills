# visual-evidence

Capture screenshots or video of a user-visible change and share them as evidence on a PR, issue, bug report, or review.

## What it does

1. Finds how to run the app (repo README, `AGENTS.md`, dev scripts, existing e2e setup).
2. Seeds data that exercises the change.
3. Drives the UI with the repo's own browser tooling, else Playwright or `agent-browser`.
4. Saves captures to a temp folder, never into the repo.
5. Checks every file: reads each image, tiles sampled video frames into a contact sheet.
6. Shares to GitHub with `gh ... --attach`, then cleans up.

## When it triggers

A change affects user-visible behavior and needs proof a reader can see. Example prompts:

- "add screenshots to this PR"
- "record a demo of the new flow"
- "show the before/after for this bug"

## Key behaviors

- **Visible cursor in video.** Playwright video does not draw the pointer. The skill injects an overlay so interactions are provable. Starter script: [`references/cursor-video.py`](references/cursor-video.py).
- **Video is verified, not just non-empty.** Frames are sampled and read to confirm the cursor, key states, and no long dead stretch.
- **PR body limit.** At most 2 images/videos go in the PR body. More than 2 go in PR comments.
- **Temp output.** Uses `$CLAUDE_JOB_DIR/tmp` when set, else `mktemp -d`.

## Requirements

- Playwright (`npx playwright install chromium`) or the `agent-browser` skill, unless the repo has its own tooling.
- `ffmpeg` for frame sheets and `.webm` to `.mp4` conversion.
- `gh` CLI with push access, run from inside the repo, to post attachments.

## Files

- [`SKILL.md`](SKILL.md): the skill instructions.
- [`references/github-attach.md`](references/github-attach.md): `gh --attach` rules, size limits, body vs comment placement.
- [`references/cursor-video.py`](references/cursor-video.py): Playwright script with cursor overlay and click helper.
