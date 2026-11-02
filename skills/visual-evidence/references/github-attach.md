# Posting to GitHub with `--attach`

Source: [Attaching files with GitHub CLI](https://docs.github.com/en/enterprise-cloud@latest/github-cli/github-cli/attaching-files-with-github-cli) (Enterprise Cloud docs; they do not mention Enterprise Server).

## Rules

- Works on `gh pr create|edit|comment` and `gh issue create|edit|comment`. Needs push access. Only images and media (png, gif, jpg, svg, mp4, mov, webm).
- Repeat the flag for more files. The same file cannot be attached twice.
- Run `gh` from inside the repo. From elsewhere it resolves the wrong repository (`Could not resolve to a Repository`).
- Reference each file in the body with the same path you pass to `--attach`; `gh` rewrites it to the uploaded URL in place. Use absolute paths. Unreferenced attachments are appended at the end in flag order.
- Image alt text: write it in the Markdown `![alt](path)`, or after `#` in the flag (`--attach 'path.png#alt'`). Alt text is not supported on video.
- **Video** renders inline only when `![](path)` is alone in its paragraph. Inside a sentence it becomes a link.
- Size limits (GitHub upload limits, not stated separately for the CLI): images 10 MB; video 10 MB on free plans, 100 MB on paid. Trim or re-encode larger clips.
- Public repos serve uploads without authentication. Do not capture secrets, real user data, or tokens.

## Body vs comments

- 2 or fewer images/videos total: may go in the PR body.
- More than 2: do NOT put any in the PR body. Keep the body text-only and post the media as PR comments (`gh pr comment`) as supplements. Group related captures per comment; the body may mention that evidence is in the comments.

## Example

```bash
T=${CLAUDE_JOB_DIR:+$CLAUDE_JOB_DIR/tmp}; T=${T:-$(mktemp -d)}   # same folder you captured into
gh pr comment <pr> --body "**Editor**

![what it shows]($T/editor.png)

**Flow**

![]($T/flow.webm)" --attach $T/editor.png --attach $T/flow.webm
```

Swap `pr` for `issue` to comment on an issue.

## After posting

- Fix a posted comment with `--edit-last` and the same `--attach` flags.
- Verify: `gh pr view <pr> --json comments --jq '.comments[-1].body'` (or `gh issue view`). Every file must be a `github.com/user-attachments/assets/...` URL.
