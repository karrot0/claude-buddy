import { expect, mock, test } from 'claude-code/testing'

const BAND = {
  plugin: 'progress-buddy',
  component: 'AbovePrompt',
  props: { hasSurvey: false, isWorking: true, maxRows: 10, bodyColumns: 80, scroll: { offset: 0, bodyRows: 10 }, view: {} },
} as const

const IN = { in: 'band' } as const

const AGENT = { id: 'a1', description: 'find the login code', type: 'Explore', status: 'running' } as const

test('the plugin tool feeds the band where the session has no task tools', async ($, on) => {
  on('agent.list', () => ({ value: [] }))
  on('tool.call', { tool: 'Read' }, () => ({ result: {} as never }))

  const ran = await $.tool.call({
    tool: 'mcp__progress-buddy__set_tasks',
    title: 'Changing the animation',
    todos: [
      { content: 'Plan', status: 'completed' },
      { content: 'Build', activeForm: 'Building', status: 'in_progress' },
    ],
  })
  expect(ran.result).toBe('1/2 done')

  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  expect(await ui.find({ type: 'Text', text: '1/2 · 50%', ...IN })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: 'Changing the animation', ...IN })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: 'Building', ...IN })).toBeDefined()
  expect(await ui.find({ type: 'Svg' })).toBeDefined()
  await ui.unmount()

  await $.tool.call({ tool: 'Read', file_path: 'C:\\mods\\hooks\\register.tsx' })

  const during = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await during.find({ type: 'Text', text: 'Reading register.tsx', ...IN })).toBeDefined()
  expect(await during.find({ type: 'Text', text: '(◉_◉)' })).toBeDefined()

  await $.tool.call({ tool: 'Read', file_path: 'C:\\mods\\hooks\\band.tsx' })
  await during.advance(300)
  expect(await during.find({ type: 'Text', text: 'Reading band.tsx', ...IN })).toBeDefined()
  await during.unmount()

  const bad = await $.tool.call({ tool: 'mcp__progress-buddy__set_tasks', todos: [{ status: 'nope' }] })
  expect(bad.deny).toBeDefined()
})

test('the band is there before any prompt, and a finished turn leaves a full green bar', async ($, on) => {
  on('agent.list', () => ({ value: [] }))
  on('tool.call', { tool: 'Read' }, () => ({ result: {} as never }))
  on('tool.call', { tool: 'Edit' }, () => ({ result: {} as never }))
  on('prompt.submit', (_, e) => ({ text: e.text }) as never)
  on('turn.complete', () => ({ text: '' }) as never)

  const idle = await $.ui.mount({ ...BAND, surface: 'desktop' })
  expect(await idle.find({ type: 'Text', text: 'Ready', ...IN })).toBeDefined()
  expect(await idle.find({ type: 'Text', text: 'Ready when you are', ...IN })).toBeDefined()
  expect((await idle.findAll({ type: 'Text', text: '█', ...IN })).length).toBe(0)
  await idle.unmount()

  await $.prompt.submit({ text: 'change the animation\nplease' } as never)
  await $.tool.call({ tool: 'Read', file_path: 'hooks/register.tsx' })

  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  expect(await ui.find({ type: 'Text', text: 'change the animation', ...IN })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: 'Reading register.tsx', ...IN })).toBeDefined()
  const before = (await ui.findAll({ type: 'Text', text: '█', ...IN })).length
  await ui.advance(400)
  expect((await ui.findAll({ type: 'Text', text: '█', ...IN })).length).toBeGreaterThan(before)
  await ui.unmount()

  await $.tool.call({ tool: 'Edit', file_path: 'hooks/face.ts', old_string: 'a', new_string: 'b' })

  const coding = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await coding.find({ type: 'Text', text: '(•̀_•́)⌨' })).toBeDefined()
  expect(await coding.find({ type: 'Text', text: 'Editing face.ts', ...IN })).toBeDefined()
  await coding.unmount()

  await $.turn.complete({ answer: '' } as never)

  const done = await $.ui.mount({ ...BAND, surface: 'desktop' })
  expect(await done.find({ type: 'Text', text: 'change the animation', ...IN })).toBeDefined()
  expect(await done.find({ type: 'Text', text: '✓ Done', ...IN })).toBeDefined()
  expect((await done.findAll({ type: 'Text', text: '█', ...IN })).length).toBe(24)
  await done.unmount()

  const face = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await face.find({ type: 'Text', text: '(^‿^)' })).toBeDefined()
  await face.unmount()
})

test('the bar fills in proportion to the finished steps', async ($, on) => {
  on('agent.list', () => ({ value: [] }))
  on('tool.call', { tool: 'TodoWrite' }, (_, e) => ({
    result: { oldTodos: [], newTodos: e.todos },
  }))

  await $.tool.call({
    tool: 'TodoWrite',
    todos: [
      { content: 'Read code', activeForm: 'Reading code', status: 'completed' },
      { content: 'Write fix', activeForm: 'Writing fix', status: 'in_progress' },
      { content: 'Run tests', activeForm: 'Running tests', status: 'pending' },
      { content: 'Report', activeForm: 'Reporting', status: 'pending' },
    ],
  })

  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ ...BAND, surface })

    expect(await ui.find({ type: 'Text', text: '1/4 · 25%', ...IN })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: 'Writing fix', ...IN })).toBeDefined()
    expect((await ui.findAll({ type: 'Text', text: '█', ...IN })).length).toBe(6)
    await ui.unmount()
  }
})

test('running subagents are listed with what each is doing, and do not touch the main status', async ($, on) => {
  on('agent.list', () => ({ value: [AGENT] }))
  on('tool.call', { tool: 'Read' }, () => ({ result: {} as never }))
  on('turn.complete', () => ({ text: '' }) as never)

  await $.tool.call({ tool: 'Read', file_path: 'login.ts', agentId: 'a1' } as never)
  await $.turn.complete({ answer: 'found it', agentId: 'a1' } as never)

  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  expect(await ui.find({ type: 'Text', text: 'Ready', ...IN })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: '✓ Done', ...IN })).toBeUndefined()
  await ui.unmount()

  await $.tool.call({ tool: 'Read', file_path: 'auth.ts', agentId: 'a1' } as never)

  const busy = await $.ui.mount({ ...BAND, surface: 'desktop' })
  expect(await busy.find({ type: 'Text', text: 'find the login code · Reading auth.ts', ...IN })).toBeDefined()
  await busy.unmount()
})

test('once a turn is over the face keeps cycling through moods', async ($, on) => {
  const clock = mock.clock(on)
  on('agent.list', () => ({ value: [] }))
  on('tool.register', () => ({ value: { tool: 'mcp__progress-buddy__set_tasks' } }) as never)
  on('session.start', (_, e) => ({ cwd: e.cwd }) as never)
  on('turn.complete', () => ({ text: '' }) as never)

  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true } as never)
  await $.turn.complete({ answer: '' } as never)

  const seen: string[] = []

  for (let i = 0; i < 4; i++) {
    const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
    seen.push(...(await ui.findAll({ type: 'Text', text: /^\(/ })).map(t => t.text ?? ''))
    await ui.unmount()
    await clock.advance(4500)
  }

  expect(new Set(seen).size).toBeGreaterThan(2)
})

test('a band that never comes alive is replaced by a plain bar; a live one is left alone', async ($, on) => {
  const clock = mock.clock(on)
  on('agent.list', () => ({ value: [] }))
  on('tool.register', () => ({ value: { tool: 'mcp__progress-buddy__set_tasks' } }) as never)
  on('session.start', (_, e) => ({ cwd: e.cwd }) as never)

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true } as never)
  await $.tool.call({
    tool: 'mcp__progress-buddy__set_tasks',
    title: 'Changing the animation',
    todos: [
      { content: 'Plan', status: 'completed' },
      { content: 'Build', activeForm: 'Building', status: 'in_progress' },
    ],
  })

  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  expect(await ui.find({ type: 'Client' })).toBeDefined()

  await clock.advance(7000)
  expect(await ui.find({ type: 'Client' })).toBeUndefined()
  expect(await ui.find({ type: 'Text', text: '1/2 · 50%' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: 'Building' })).toBeDefined()
  expect(await ui.find({ type: 'Svg' })).toBeDefined()
  await ui.unmount()
})

test('a band that sends its heartbeat keeps the animated bar', async ($, on) => {
  const clock = mock.clock(on)
  on('agent.list', () => ({ value: [] }))
  on('tool.register', () => ({ value: { tool: 'mcp__progress-buddy__set_tasks' } }) as never)
  on('session.start', (_, e) => ({ cwd: e.cwd }) as never)

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true } as never)

  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  await ui.advance(300)
  await clock.advance(7000)
  expect(await ui.find({ type: 'Client' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: 'Ready', ...IN })).toBeDefined()
  await ui.unmount()
})

test('shell commands show the console face and other tools the tool face', async ($, on) => {
  on('agent.list', () => ({ value: [] }))
  on('tool.call', { tool: 'Bash' }, () => ({ result: {} as never }))
  on('tool.call', { tool: 'Skill' }, () => ({ result: {} as never }))

  await $.tool.call({ tool: 'Bash', command: 'npm test', description: 'Run the tests' } as never)

  const shell = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await shell.find({ type: 'Text', text: '(•_•)>_' })).toBeDefined()
  expect(await shell.find({ type: 'Text', text: 'Run the tests', ...IN })).toBeDefined()
  await shell.unmount()

  await $.tool.call({ tool: 'Skill', skill: 'pdf' } as never)

  const tool = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await tool.find({ type: 'Text', text: '(•̀ᴗ•́)و' })).toBeDefined()
  expect(await tool.find({ type: 'Text', text: 'Loading skill pdf', ...IN })).toBeDefined()
  await tool.unmount()

  const drawn = await $.ui.mount({ ...BAND, surface: 'desktop' })
  expect(await drawn.find({ type: 'Svg' })).toBeDefined()
  await drawn.unmount()
})
