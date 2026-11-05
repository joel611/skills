---
name: visual-evidence
description: "Use this skill when a change (pull request, issue, bug report, review) affects user-visible behavior and needs screenshots or video as evidence: run the app, drive it with the repo's own browser tooling (else Playwright or agent-browser), save captures to a temp folder, and share them. For posting to GitHub with `gh ... --attach`, read references/github-attach.md."
---

# Visual Evidence

Capture the changed screens or flows as screenshots or video, then share them where the change is discussed. Works for any stack.

## Workflow

1. **Find how to run the app.** Read the README, `AGENTS.md`/`CLAUDE.md`, and the repo's skills and scripts. Use what the repo offers first (a dev or serve script, a seed or fixture command, an existing e2e or screenshot setup, a repo skill for the dev server). Run from the worktree and start servers in the background.
2. **Get data that exercises the change.** Seed through the repo's own seeders, fixtures, or console. Keep one-off seed scripts outside the repo (temp folder below). Prefer inline or `data:` assets over files the dev server may not serve. External resources (iframes, remote images) can fail headless, so say so when sharing rather than hide a blank area.
3. **Pick the capture tool.** Use the repo's browser tooling if it has one (an installed Playwright/Cypress/Puppeteer setup, a screenshot script). Otherwise suggest one of:
   - **Playwright**: scripted, repeatable, supports screenshots and video (`record_video_dir` / `recordVideo`).
   - **agent-browser**: CLI driven by the agent, good for exploratory flows (`agent-browser` skill; use its screenshot and recording commands).
4. **Capture.** Log in, navigate, wait for the UI to be ready (a selector, not a fixed sleep where possible), open collapsed UI before the shot. Take full-page screenshots for static states. Record video for interactions, transitions, or anything a still cannot prove. Keep clips short.
   For a bug fix or visual change, capture the same view on the base branch too (same viewport, data and steps) and share the two as a labeled before/after pair.
   For video of an interaction, show the cursor (see [Video with a visible cursor](#video-with-a-visible-cursor)). A clip where nothing visibly moves does not prove the flow.
5. **Check every file.** Read each image and confirm it shows the change. For video, a non-empty file is not enough: tile sampled frames into one image and read it (`ffmpeg -i clip.webm -vf "fps=1/2.5,scale=640:-1,tile=3x3" -frames:v 1 sheet.png`). Confirm the cursor shows, the key states appear, there is no long dead stretch, and the duration is plausible. Redo blank or wrong captures.
6. **Share.** On GitHub (PR or issue), follow [references/github-attach.md](references/github-attach.md). Elsewhere, use that destination's upload path. For a PR, put at most 2 images/videos in the body; with more than 2, keep them out of the body and post them as PR comments (see the reference).
7. **Clean up.** Stop servers you started and confirm `git status` is clean. Captures and seed scripts never go in the repo.

## Where files go

Save to a temp folder unless the user says where. Use `$CLAUDE_JOB_DIR/tmp` when set, otherwise `mktemp -d`. Never plain `/tmp` in a shared session (parallel jobs clobber each other). If the user names a folder, use it exactly.

## Video with a visible cursor

Playwright video does not draw the pointer, and `agent-browser record` (even with `--cursor`) can leave it static, run long with dead time, and fail on popovers that stay in the DOM. For a demo clip, script it in Playwright and draw the cursor yourself:

- Wait on UI state (`wait_for`), not fixed sleeps, and end on the result for a few seconds.
- Start from [references/cursor-video.py](references/cursor-video.py): the overlay, the `go()` click helper and the login-then-record setup, with placeholders for the flow. Copy it to the temp folder and fill it in.
- Run it with a Python/Node that has Playwright installed. The `playwright` CLI's shebang names that interpreter.

Video is written on `ctx.close()` as `.webm`. Convert with `ffmpeg -i in.webm -c:v libx264 -pix_fmt yuv420p out.mp4` if the destination will not play it (H.264 is the most compatible codec).
