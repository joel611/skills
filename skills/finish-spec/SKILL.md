---
name: finish-spec
description: Verify a spec's implementation tickets are complete, on-spec, and not overengineered, then close the spec issue if they pass.
disable-model-invocation: true
---

# Finish Spec

`to-spec` publishes a spec issue. `to-tickets` breaks it into sub-issue tickets and explicitly never closes the parent. This skill is that close, gated on verification — takes the spec issue number as its argument.

## Steps

1. **Fetch the spec.** `gh issue view <NUMBER> --comments` — read Problem Statement, User Stories, Implementation Decisions, and Out of Scope. These are the yardstick every ticket gets held to.
   Completion: you can restate what the spec asked for without re-opening the issue.

2. **Enumerate the tickets.** Get both links a ticket can carry (per `github-tickets`, they're independent — one doesn't imply the other):
   - Native sub-issues: `gh api repos/<owner>/<repo>/issues/<NUMBER>/sub_issues -q '.[].number'`
   - `## Parent` body reference: tickets whose body points at `<NUMBER>`.
   A ticket present in only one list is a linking gap — fix the link before verifying it, don't silently ignore either list.
   Completion: one merged ticket list, every entry linked both ways.

3. **Verify every ticket, three checks, in order:**
   - **Closed & shipped** — ticket state is closed, backed by a merged PR (`gh issue view <T> --json closedByPullRequestsReferences`). Open ticket fails here; skip the remaining checks for it.
   - **On spec** — `gh pr diff <PR>` satisfies every acceptance-criteria checkbox in the ticket body, and traces to a user story or implementation decision from step 1. Anything the diff does that the spec never asked for is a flag, not a pass.
   - **Not overengineered, fits the codebase** — read the diff through the `ponytail-review` lens, against this repo's `CONTEXT.md` and the relevant `docs/adr/` entries (per `domain-modeling`'s conventions), and against its lint/test suite. A speculative abstraction or an ADR contradiction fails this check.
   Record a verdict per ticket. Completion: every enumerated ticket has all three checks recorded — none skipped, none inferred from a sibling ticket.

4. **Report, then decide and act:**
   - Display the verdict table (below) to the user and ask them to confirm before closing the spec — even if every ticket passes.
   - Every ticket passes all three, and the user confirms → comment the verdict table on the spec issue, then `gh issue close <NUMBER> --comment "..."`.
   - Any ticket open, off-spec, or overengineered, or the user declines → do not close. Comment the per-ticket gaps on the spec issue instead. For each failing ticket, apply a label from this repo's triage vocabulary (`triage-labels.md`) — `needs-triage` if the failure needs a maintainer's call, otherwise leave `ready-for-agent` for a straight redo.

<verdict-template>

| Ticket | Closed & shipped | On spec | Not overengineered | Verdict |
| ------ | ----------------- | ------- | ------------------- | ------- |
| #123   | ✅                 | ✅       | ✅                   | PASS    |
| #124   | ✅                 | ❌ (adds a config flag the spec never asked for) | — | FAIL |

</verdict-template>
