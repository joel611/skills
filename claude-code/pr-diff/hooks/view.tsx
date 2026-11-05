import type { ClientModule } from 'claude-code'

import type { PrData } from '../types'

type S = { cur: number; top: number; scroll: number; path: string; count: string; g: boolean }
const INIT: S = { cur: 0, top: 0, scroll: 0, path: '', count: '', g: false }

const cut = (s: string, n: number) => (s.length > n ? s.slice(0, Math.max(0, n - 1)) + '…' : s)

const View: ClientModule<PrData, S> = (d, surface) => {
  const { Box, Text } = surface.elements
  const st = surface.state ?? INIT
  const cols = surface.columns || 60
  const rows = surface.rows || 24
  const body = Math.max(1, rows - 4)
  const inDiff = !!d.open
  const lines = d.open ? d.open.patch.split('\n') : []
  const hunks = lines.flatMap((l, i) => (l.startsWith('@@') ? [i] : []))
  // A different file opened: start at the top.
  const scroll = d.open && st.path === d.open.path ? st.scroll : 0
  const maxScroll = Math.max(0, lines.length - body)
  const set = (p: Partial<S>) =>
    surface.setState({ ...st, scroll, path: d.open?.path ?? st.path, count: '', g: false, ...p })

  surface.onKey(({ key, ctrl }) => {
    const n = Number(st.count || 1)
    if (!ctrl && /^[0-9]$/.test(key) && (key !== '0' || st.count)) return set({ count: st.count + key })
    const half = Math.max(1, Math.floor(body / 2))
    const last = Math.max(0, d.files.length - 1)
    const files = d.files
    const idx = d.open ? files.findIndex(f => f.path === d.open!.path) : st.cur
    const move = (cur: number) => {
      const c = Math.min(last, Math.max(0, cur))
      set({ cur: c, top: c < st.top ? c : c >= st.top + body ? c - body + 1 : st.top })
    }
    const go = (y: number) => set({ scroll: Math.min(maxScroll, Math.max(0, y)) })
    const openAt = (i: number) => {
      const f = files[Math.min(last, Math.max(0, i))]
      if (f) {
        set({ cur: files.indexOf(f), scroll: 0, path: f.path })
        surface.post({ type: 'open', path: f.path })
      }
    }
    if (key === 'r') {
      surface.post({ type: 'refresh' })
      return set({})
    }
    if (st.g) {
      if (key === 'g') return inDiff ? go(0) : move(0)
      return set({})
    }
    if (key === 'g') return set({ g: true, count: st.count })
    if (inDiff) {
      if (key === 'j' || key === 'down' || (ctrl && key === 'e')) go(scroll + n)
      else if (key === 'k' || key === 'up' || (ctrl && key === 'y')) go(scroll - n)
      else if (ctrl && key === 'd') go(scroll + half)
      else if (ctrl && key === 'u') go(scroll - half)
      else if (ctrl && key === 'f') go(scroll + body)
      else if (ctrl && key === 'b') go(scroll - body)
      else if (key === 'pagedown') go(scroll + body)
      else if (key === 'pageup') go(scroll - body)
      else if (key === 'G') go(st.count ? n - 1 : maxScroll)
      else if (key === ']') go(hunks.find(i => i > scroll) ?? scroll)
      else if (key === '[') go([...hunks].reverse().find(i => i < scroll) ?? scroll)
      else if (key === '}') openAt(idx + n)
      else if (key === '{') openAt(idx - n)
      else if (key === 'q' || key === 'h' || key === 'backspace' || key === 'left') {
        surface.post({ type: 'close' })
        set({ scroll: 0 })
      } else set({})
      return
    }
    if (key === 'j' || key === 'down' || (ctrl && key === 'n')) move(st.cur + n)
    else if (key === 'k' || key === 'up' || (ctrl && key === 'p')) move(st.cur - n)
    else if (ctrl && key === 'd') move(st.cur + half)
    else if (ctrl && key === 'u') move(st.cur - half)
    else if (ctrl && key === 'f') move(st.cur + body)
    else if (ctrl && key === 'b') move(st.cur - body)
    else if (key === 'G') move(st.count ? n - 1 : last)
    else if (key === 'H') move(st.top)
    else if (key === 'M') move(st.top + Math.floor(body / 2))
    else if (key === 'L') move(st.top + body - 1)
    else if (key === 'return' || key === 'l' || key === 'right') openAt(st.cur)
    else set({})
  })

  // --- drawing ---
  const bar = (() => {
    if (d.status === 'idle') return ['PR diff', 'press r to load']
    if (d.status === 'loading' && !d.pr) return ['PR diff', 'loading…']
    if (d.status === 'none') return ['No PR for this branch', 'push + open a PR, then r']
    if (d.status === 'error') return ['gh failed', d.message ?? '']
    const p = d.pr!
    const flags = [
      p.state === 'OPEN' ? (p.isDraft ? 'DRAFT' : 'OPEN') : p.state,
      p.review && `review:${p.review.toLowerCase().replace('_', ' ')}`,
      p.mergeable === 'CONFLICTING' ? 'conflicts' : '',
    ].filter(Boolean)
    return [
      `#${p.number} ${p.title}`,
      `${flags.join(' · ')}  ✓${p.checks.pass} ✗${p.checks.fail} ●${p.checks.pending}  +${p.add} −${p.del}  ${p.head} → ${p.base}`,
    ]
  })()

  const color = (l: string) =>
    l.startsWith('+') ? 'green' : l.startsWith('-') ? 'red' : l.startsWith('@@') ? 'cyan' : undefined

  const shown = inDiff
    ? lines.slice(scroll, scroll + body)
    : d.files.slice(st.top, st.top + body)

  const foot = inDiff
    ? `${d.open!.path}  ${Math.min(lines.length, scroll + 1)}/${lines.length}${d.open!.isCut ? ' (cut)' : ''}  j/k ^d/^u gg/G [ ] hunk  { } file  q back`
    : `${d.files.length ? st.cur + 1 : 0}/${d.files.length} files  j/k gg/G ^d/^u H/M/L  ⏎/l open  r refresh${st.count ? '  ' + st.count : ''}`

  return (
    <Box flexDirection="column">
      <Text bold>{cut(bar[0], cols)}</Text>
      <Text dimColor>{cut(bar[1], cols)}</Text>
      <Text dimColor>{'─'.repeat(cols)}</Text>
      <Box flexDirection="column" height={body}>
        {inDiff
          ? (shown as string[]).map(l => <Text color={color(l)}>{cut(l || ' ', cols)}</Text>)
          : (shown as PrData['files']).map((f, i) => {
              const sel = st.top + i === st.cur
              return (
                <Text bold={sel}>
                  {cut(`${sel ? '>' : ' '} ${f.status} ${f.path}  +${f.add} −${f.del}`, cols)}
                </Text>
              )
            })}
      </Box>
      <Text dimColor>{cut(foot, cols)}</Text>
    </Box>
  )
}

export default View
