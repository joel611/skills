import type { Register } from 'claude-code'

const ENV_FILE = /^\.env(\..+)?$/
const EXAMPLE_FILE = /\.(example|sample|template)$/
const SECRET_KEY = /(SECRET|TOKEN|PASSWORD|PASSWD|PASS|PRIVATE|CREDENTIAL|API_?KEY|AUTH|_KEY$|^KEY$|DSN|DATABASE_URL)/i
const LINE = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/
const MIN_SECRET_LENGTH = 6

const unquote = (raw: string): string => {
  const v = raw.trim()
  const quoted = v.length >= 2 && (v[0] === '"' || v[0] === "'") && v.endsWith(v[0])
  return quoted ? v.slice(1, -1) : v.replace(/\s+#.*$/, '')
}

const parseSecrets = (text: string, into: Map<string, string>): void => {
  for (const line of text.split('\n')) {
    const m = LINE.exec(line)
    if (!m || line.trimStart().startsWith('#')) continue
    const [, key, raw] = m
    const value = unquote(raw)
    if (SECRET_KEY.test(key) && value.length >= MIN_SECRET_LENGTH) into.set(value, key)
  }
}

const redactString = (s: string, secrets: Map<string, string>): string => {
  let out = s
  for (const [value, key] of secrets) out = out.split(value).join(`[REDACTED:${key}]`)
  return out
}

const redactDeep = (v: unknown, secrets: Map<string, string>): unknown => {
  if (typeof v === 'string') return redactString(v, secrets)
  if (Array.isArray(v)) return v.map(x => redactDeep(x, secrets))
  if (v && typeof v === 'object')
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, redactDeep(x, secrets)]))
  return v
}

export const register: Register = on => {
  on('tool.call', async ($, e, next) => {
    const secrets = new Map<string, string>()
    const paths = new Set<string>()
    try {
      for (const f of await $.fs.list()) {
        if (f.kind === 'file' && ENV_FILE.test(f.name) && !EXAMPLE_FILE.test(f.name)) paths.add(f.name)
      }
    } catch {}
    const touched = (e as { file_path?: unknown }).file_path
    if (typeof touched === 'string' && /(^|\/)\.env(\.[^/]+)?$/.test(touched) && !EXAMPLE_FILE.test(touched))
      paths.add(touched)
    for (const p of paths) {
      try {
        const text = await $.fs.read(p)
        if (typeof text === 'string') parseSecrets(text, secrets)
      } catch {}
    }

    const ran = await next(e)
    if (secrets.size === 0 || ran.deny !== undefined) return ran
    const sorted = new Map([...secrets].sort((a, b) => b[0].length - a[0].length))
    return {
      ...ran,
      result: redactDeep(ran.result, sorted),
      ...(ran.text === undefined ? {} : { text: redactString(ran.text, sorted) }),
    } as typeof ran
  })
}
