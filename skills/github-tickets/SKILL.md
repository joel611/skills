---
name: github-tickets
description: Establish GitHub's native sub-issue relationship between a parent and child issue via `gh`, alongside the human-readable Parent reference in the sub-issue's body. Use when creating a GitHub issue that should be a sub-issue of an existing one, when an existing issue should be linked as a sub-issue of a parent, or when to-tickets publishes tickets under a parent spec issue on GitHub.
---

# GitHub Tickets

GitHub tracks two independent things that both mean "this issue belongs to that one," and setting only one leaves the sub-issue half-linked:

- The **native sub-issue relationship** — a GraphQL-backed link that drives the parent's progress checklist in the GitHub UI and shows up in `gh api repos/<owner>/<repo>/issues/<PARENT>/sub_issues`. Nothing in the issue body encodes it; it's invisible to anyone reading raw markdown or a diff.
- The **Parent reference** — the `## Parent` section in the sub-issue's body (see to-tickets' `issue-template`), a plain link/number a human or agent finds by reading the issue, but one GitHub's sub-issue API and UI never look at.

Set both, every time. Neither substitutes for the other.

## Creating a new sub-issue

```
gh issue create --repo <owner>/<repo> --title "<title>" --body "<body-with-##-Parent-section>" --parent <PARENT-NUMBER-OR-URL>
```

`--parent` sets the native relationship at creation time. The `--body` must still carry its own `## Parent` section — `--parent` does not write one for you.

## Linking an existing issue as a sub-issue

```
gh issue edit <PARENT-NUMBER-OR-URL> --repo <owner>/<repo> --add-sub-issue <SUB-NUMBER-OR-URL>
```

One issue per call — loop for multiple sub-issues. If the sub-issue's body lacks a `## Parent` section, add it separately (`gh issue edit <SUB> --body "..."`).

A repeat call errors with `Issue may not contain duplicate sub-issues` — that means the link already exists, not that the call failed. Treat it as success and move on.

## Verify

```
gh api repos/<owner>/<repo>/issues/<PARENT>/sub_issues -q '.[].number'
```

The sub-issue's number must appear here. A `## Parent` section in the body is not enough to confirm the native link — check the API.
