---
name: setup-worktrunk
description: Set up Worktrunk (wt) in a repo so every worktree copies its env and gets its own ports, .env and docker containers, letting agents run the stack in parallel without touching each other. Use when asked to set up worktrunk, isolate ports per worktree, copy .env into worktrees, or fix port clashes between worktrees.
---

# Setup worktrunk

Read the `worktrunk` skill for hook syntax and approvals first. This skill is the recipe for env copy plus port isolation.

## 1. Inventory what binds a port

Search for ports, env files and compose files. Skip lockfiles and `node_modules`.

```
rg -n -i '(\bport\b|localhost:\d+|127\.0\.0\.1:\d+|:\d{4,5}\b)' -g '!node_modules' -g '!*.lock'
```

Make a table of every service, its default port, and where the port is read (env var, flag, compose). A service whose port is hardcoded in code needs an env var first. A compose host port becomes `${DB_PORT:-8080}:8080`, so the main worktree keeps its default.

## 2. Wire the env

- Copy `scripts/wt-env.sh` from this skill to `<repo>/.config/wt-env.sh` and keep it executable. It sets `KEY=VALUE` pairs in `.env`, creating the file from `.env.example` when missing, and leaves other keys alone.
- Add each new var (for example `DB_PORT`) to `.env.example` with the default.
- Every value derived from a port goes in the same call: URLs (`BETTER_AUTH_URL`, CORS origins, Studio origin, `DATABASE_URL`) and `COMPOSE_PROJECT_NAME`.

## 3. Write `.config/wt.toml`

```toml
# Pipeline: copy-ignored brings secrets from the primary worktree,
# then wt-env.sh overrides every port-bound key for this worktree.
[[pre-start]]
copy = "wt step copy-ignored"

[[pre-start]]
install = "bun install --frozen-lockfile"

[[pre-start]]
env = """
.config/wt-env.sh \\
  PORT={{ ('api-' ~ branch) | hash_port }} \\
  BETTER_AUTH_URL=http://localhost:{{ ('api-' ~ branch) | hash_port }} \\
  DB_PORT={{ ('db-' ~ branch) | hash_port }} \\
  DATABASE_URL=http://127.0.0.1:{{ ('db-' ~ branch) | hash_port }} \\
  COMPOSE_PROJECT_NAME={{ repo }}-{{ branch | sanitize }}
"""

[post-start]
db = "docker compose up -d db"

[pre-remove]
db-down = "docker compose down -v || true"

[list]
url = "http://localhost:{{ ('api-' ~ branch) | hash_port }}"
```

Rules that make it safe:

- `hash_port` gives a stable 10000-19999 port per string. Prefix the branch per service (`api-`, `studio-`, `db-`) so services in one worktree don't share a port. Use the same expression everywhere a service's port appears.
- `COMPOSE_PROJECT_NAME` isolates containers, networks and volumes. `down -v` is then scoped to this worktree. Never run it without that var set in `.env`.
- Hooks only run for new worktrees. The primary worktree keeps its own `.env` and the defaults.
- Adapt the dependency install line to the repo's package manager.

## 4. Fence the agents

Add a short section to `AGENTS.md`: never hardcode ports, read them from the worktree's `.env`, run services only from your own worktree, never stop or `down` another worktree's services, never kill processes by port you didn't start, never edit the primary `.env`.

## 5. Verify with two worktrees

Config you haven't committed is absent from a new worktree, so hooks can't be tested on it. Do one of:

- Commit the config, then `wt config approvals add` (the user must run it, agents can't), then `wt switch --create <a> --no-cd` for real.
- Or create with `wt switch --create <a> --no-cd --no-hooks`, copy the uncommitted config files in, and have each agent run the hook steps by hand. This does not test hook firing, `copy-ignored` or `pre-remove`. Say so in the report.

Then run two agents in parallel, one per worktree, each told to stay in its own worktree. Each one:

1. Copies `.env`, runs `wt-env.sh` with ports from `wt step eval "{{ ('api-' ~ branch) | hash_port }}"`.
2. Installs dependencies.
3. Runs `docker compose up -d db` and checks the DB port and project name with `docker compose ps`.
4. Starts each service and curls its port. Any HTTP response counts.
5. Confirms no port equals a default or the sibling's.
6. Kills only what it started and runs `docker compose down -v`.

Report the port table and which hooks were not exercised. Remove the test worktrees with `wt remove` when done.

## Example

The seen-ai repo is the reference: `.config/wt.toml`, `.config/wt-env.sh`, `docker-compose.yml` (`${DB_PORT:-8080}`) and the "Worktrees and ports" section of `AGENTS.md`. Its services are the API (`PORT`), Mastra Studio (`MASTRA_STUDIO_PORT`) and libSQL (`DB_PORT`). Parallel test result: two worktrees ran API, Studio and DB side by side on distinct hashed ports and cleaned up without leftovers.
