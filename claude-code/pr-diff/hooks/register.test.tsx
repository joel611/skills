import { expect, test } from 'claude-code/testing'

const PANE = {
  plugin: 'pr-diff',
  component: 'Pane',
  requestId: 'pr-diff',
  surface: 'terminal',
  props: {
    title: 'PR diff',
    isFocused: true,
    bodyColumns: 80,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 12 },
    view: {},
  },
} as const

const DATA = {
  status: 'ready',
  pr: {
    number: 7, title: 'Add thing', state: 'OPEN', isDraft: false, review: 'APPROVED',
    mergeable: 'MERGEABLE', head: 'feat', base: 'main', add: 3, del: 1,
    checks: { pass: 2, fail: 1, pending: 0 },
  },
  files: [
    { path: 'a.ts', status: 'M', add: 2, del: 1 },
    { path: 'b.ts', status: 'A', add: 1, del: 0 },
  ],
}

test('status bar and file list show, j moves the cursor', async ($, on) => {
  on('state.get', () => ({ value: { value: { shape: 'data-1', value: DATA }, version: 1 } }))
  const ui = await $.ui.mount(PANE)

  expect(await ui.find({ type: 'Text', text: /#7 Add thing/, in: 'view' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /✗1/, in: 'view' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /> M a\.ts/, in: 'view' })).toBeDefined()
  await ui.key({ key: 'j', in: 'view' })
  expect(await ui.find({ type: 'Text', text: /> A b\.ts/, in: 'view' })).toBeDefined()
  await ui.unmount()
})

test('Enter asks for the file, diff view jumps hunks and goes back', async ($, on) => {
  const patch = '@@ -1,2 +1,2 @@\n-old\n+new\n x' + '\n y'.repeat(30) + '\n@@ -9,1 +9,1 @@\n-a\n+b'
  on('state.get', () => ({
    value: { value: { shape: 'data-1', value: { ...DATA, open: { path: 'a.ts', patch, isCut: false } } }, version: 1 },
  }))
  const ui = await $.ui.mount(PANE)

  expect(await ui.find({ type: 'Text', text: /\+new/, in: 'view' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /a\.ts  1\/37/, in: 'view' })).toBeDefined()
  await ui.key({ key: ']', in: 'view' })
  expect(await ui.find({ type: 'Text', text: /a\.ts  (?!1\/)\d+\/37/, in: 'view' })).toBeDefined()
  await ui.unmount()
})
