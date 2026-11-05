import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { PrData, PrFile } from '../types'

const PANE = 'pr-diff'
const MAX_FILES = 400
const MAX_PATCH = 40000

const data = atom({ plugin: 'pr-diff', key: 'data' } as const, { status: 'idle', files: [] } as PrData, {
  shape: 'data-1',
})

// Patches by path, rebuilt on every refresh; too big to ride in atom/props.
let patches = new Map<string, string>()

type Run = { exitCode: number; stdout: string; stderr: string }

const checkBucket = (c: { status?: string; conclusion?: string; state?: string }) => {
  const v = (c.conclusion || c.state || c.status || '').toUpperCase()
  if (['SUCCESS', 'NEUTRAL', 'SKIPPED'].includes(v)) return 'pass'
  if (['FAILURE', 'ERROR', 'TIMED_OUT', 'CANCELLED', 'ACTION_REQUIRED', 'STARTUP_FAILURE'].includes(v)) return 'fail'
  return 'pending'
}

function parseDiff(diff: string): { files: PrFile[]; patches: Map<string, string> } {
  const files: PrFile[] = []
  const out = new Map<string, string>()
  for (const chunk of diff.split(/^diff --git /m).slice(1)) {
    const lines = chunk.split('\n')
    const path = /^a\/.* b\/(.*)$/.exec(lines[0])?.[1] ?? lines[0]
    const at = lines.findIndex(l => l.startsWith('@@'))
    const head = at === -1 ? lines : lines.slice(0, at)
    const body = at === -1 ? [] : lines.slice(at)
    const status = head.some(l => l.startsWith('new file mode'))
      ? 'A'
      : head.some(l => l.startsWith('deleted file mode'))
        ? 'D'
        : head.some(l => l.startsWith('rename from'))
          ? 'R'
          : 'M'
    let add = 0
    let del = 0
    for (const l of body) {
      if (l.startsWith('+')) add++
      else if (l.startsWith('-')) del++
    }
    files.push({ path, status, add, del })
    out.set(path, body.join('\n') || head.filter(l => !l.startsWith('index ')).join('\n'))
  }
  return { files, patches: out }
}

// Scope gh to the repo's account when the gh-accounts skill is installed.
async function gh($: any, args: string[]): Promise<Run> {
  const env: Record<string, string> = {}
  try {
    const t = await $.process.run([
      'sh',
      '-c',
      '"$HOME/.claude/skills/gh-accounts/scripts/switch.sh" --token',
    ])
    if (t.exitCode === 0 && t.stdout.trim()) env.GH_TOKEN = t.stdout.trim()
  } catch {}
  return $.process.run(['gh', ...args], { env })
}

async function refresh($: any) {
  await update($, data, d => ({ ...d, status: 'loading' }))
  try {
    const view = await gh($, [
      'pr',
      'view',
      '--json',
      'number,title,state,isDraft,reviewDecision,mergeable,headRefName,baseRefName,additions,deletions,statusCheckRollup',
    ])
    if (view.exitCode !== 0) {
      const none = /no pull requests? found/i.test(view.stderr)
      patches = new Map()
      await update($, data, () => ({
        status: none ? 'none' : 'error',
        message: view.stderr.trim().split('\n')[0],
        files: [],
      }))
      return
    }
    const j = JSON.parse(view.stdout)
    const diff = await gh($, ['pr', 'diff'])
    const parsed = parseDiff(diff.stdout)
    patches = parsed.patches
    const checks = { pass: 0, fail: 0, pending: 0 }
    for (const c of j.statusCheckRollup ?? []) checks[checkBucket(c)]++
    await update($, data, d => {
      const keep = d.open && patches.has(d.open.path) ? d.open : undefined
      return {
        status: 'ready',
        pr: {
          number: j.number,
          title: j.title,
          state: j.state,
          isDraft: !!j.isDraft,
          review: j.reviewDecision || '',
          mergeable: j.mergeable || '',
          head: j.headRefName,
          base: j.baseRefName,
          add: j.additions,
          del: j.deletions,
          checks,
        },
        files: parsed.files.slice(0, MAX_FILES),
        open: keep,
      }
    })
  } catch (err) {
    await update($, data, () => ({ status: 'error', message: String(err), files: [] }))
  }
}


export const register: Register = on => {
  const show = () => ({ id: PANE, title: 'PR diff', focus: true as const, closeOnEscape: true as const })

  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'pr-diff', description: 'Show this branch’s PR status and diff in a pane' })
    return next(e)
  })

  on('command.run', { command: 'pr-diff' }, async $ => {
    await $.ui.open(show())
    void refresh($)
    // Ask the focus ring to start on the list view, so j/k work at once.
    await $.ui.focus({ requestId: PANE, key: 'view' }).catch(() => undefined)
    return { text: 'PR diff pane opened. Click it (or ctrl+x tab) to give it the keys.' }
  })

  on('ui.message', async ($, e, next) => {
    const m = e.data as { type?: string; path?: string } | null
    if (m?.type === 'refresh') void refresh($)
    else if (m?.type === 'quit') await $.ui.close({ id: PANE })
    else if (m?.type === 'web') void gh($, ['pr', 'view', '--web'])
    else if (m?.type === 'close') await update($, data, d => ({ ...d, open: undefined }))
    else if (m?.type === 'open' && m.path) {
      const full = patches.get(m.path) ?? ''
      const path = m.path
      await update($, data, d => ({
        ...d,
        open: { path, patch: full.slice(0, MAX_PATCH), isCut: full.length > MAX_PATCH },
      }))
    }
    return next(e)
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Button, Client } = $.ui.resolve(e)
    const d = await read($, data)
    const rows = e.props.scroll?.bodyRows ?? e.viewport?.rows ?? 24
    return (
      <Box flexDirection="column">
        <Box flexDirection="row" justifyContent="flex-end" gap={2}>
          <Button key="refresh" label="Refresh" hotkey="r" onPress={() => void refresh($)} />
          <Button key="open" label="Open" hotkey="o" onPress={() => void gh($, ['pr', 'view', '--web'])} />
          <Button key="close" label="Close" hotkey="c" onPress={() => void $.ui.close({ id: PANE })} />
        </Box>
        <Client key="view" module="./view.tsx" props={d} height={rows - 1} />
      </Box>
    )
  })
}
