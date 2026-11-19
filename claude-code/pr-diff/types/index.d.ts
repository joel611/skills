export type PrFile = { path: string; status: 'A' | 'M' | 'D' | 'R'; add: number; del: number }

export type PrData = {
  status: 'idle' | 'loading' | 'ready' | 'none' | 'error'
  message?: string
  pr?: {
    number: number
    title: string
    state: string
    isDraft: boolean
    review: string
    mergeable: string
    head: string
    base: string
    add: number
    del: number
    checks: { pass: number; fail: number; pending: number }
  }
  files: PrFile[]
  open?: { path: string; patch: string; isCut: boolean }
}

declare module 'claude-code' {
  interface PluginState {
    'pr-diff': { data: Shaped<PrData> }
  }
}
