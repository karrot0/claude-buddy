import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Mood, Run, Task } from '../types'

const BODY = '#D97757'
const SHADE = '#C4623F'
const INK = '#2B1B14'
const MARK = '#E9967A'

const KAOMOJI: Record<Mood, string> = {
  thinking: '(•_• )…',
  looking: '(◉_◉)',
  working: '(•̀_•́)',
  coding: '(•̀_•́)⌨',
  oops: '(°□°)',
  happy: '(^‿^)',
  sleepy: '(-_-) z',
}

const EYE_W = 6.2
const EYE_H = 12.6
const EYE_Y = 30
const LEFT_X = 23.5
const RIGHT_X = 40.5

// Every pose is plain transforms on the same two capsules, as blobatar does it: scale in the eye's own frame, tilt, then offset.
const CSS = `
svg{overflow:visible}
:root{color-scheme:light dark}
.sw,.bg{transform-box:view-box;transform-origin:32px 52px}
.bg{animation:breathe 3.2s ease-in-out infinite alternate}
.e,.al,.ar,.sh,.sp,.z,.drop{transform-box:fill-box;transform-origin:center}
.al{transform-origin:100% 50%}
.ar{transform-origin:0% 50%}
.b{transform-box:fill-box;transform-origin:center;animation:blink 4.6s infinite}
@keyframes breathe{to{transform:scale(1.025,.975)}}
@keyframes blink{0%,94%,100%{transform:scaleY(1)}96.5%{transform:scaleY(.12)}}

.m-thinking .el{transform:translate(0,2.7px) scale(1.18,.62);animation:seesawL .9s ease-in-out infinite alternate}
.m-thinking .er{transform:translate(0,-2.7px) scale(1.18,.62);animation:seesawR .9s ease-in-out infinite alternate}
.m-thinking .sw{animation:sway 2.6s ease-in-out infinite alternate}
@keyframes seesawL{to{transform:translate(0,-2.7px) scale(1.18,.62)}}
@keyframes seesawR{to{transform:translate(0,2.7px) scale(1.18,.62)}}
@keyframes sway{from{transform:rotate(-2.5deg)}to{transform:rotate(2.5deg)}}

.m-looking .e{transform:scale(1.05)}
.m-looking .eyes{animation:glance 3.4s linear infinite}
@keyframes glance{0%,14%{transform:translate(0,0)}17%,38%{transform:translate(-2.8px,-.5px)}41%,62%{transform:translate(2.8px,.3px)}65%,80%{transform:translate(1.2px,-1.6px)}83%,100%{transform:translate(0,0)}}

.m-working .el{transform:translate(0,.8px) rotate(14deg) scale(1.45,.46)}
.m-working .er{transform:translate(0,.8px) rotate(-14deg) scale(1.45,.46)}
.m-working .bg{animation:type .36s ease-in-out infinite alternate}
.m-working .al{animation:armL .36s ease-in-out infinite alternate}
.m-working .ar{animation:armR .36s ease-in-out infinite alternate-reverse}
@keyframes type{to{transform:translateY(-.9px)}}
@keyframes armL{from{transform:translateY(1px)}to{transform:translateY(-1.6px) rotate(8deg)}}
@keyframes armR{from{transform:translateY(1px)}to{transform:translateY(-1.6px) rotate(-8deg)}}

.m-coding .el{transform:translate(0,1px) rotate(12deg) scale(1.38,.5)}
.m-coding .er{transform:translate(0,1px) rotate(-12deg) scale(1.38,.5)}
.m-coding .eyes{animation:read 2s steps(1,end) infinite}
.m-coding .bg{animation:hunch .3s ease-in-out infinite alternate}
.m-coding .al{transform:translate(7px,12px) rotate(-14deg);animation:keysL .17s ease-in-out infinite alternate}
.m-coding .ar{transform:translate(-7px,12px) rotate(14deg);animation:keysR .17s ease-in-out infinite alternate-reverse}
.glow{animation:screenlight 1.3s ease-in-out infinite alternate}
.logo{animation:glow 1.3s ease-in-out infinite alternate;transform-box:fill-box;transform-origin:center}
.code{opacity:0;animation:rise 2.4s ease-out infinite}
.code2{animation-delay:.8s}
.code3{animation-delay:1.6s}
@keyframes read{0%{transform:translate(-1.5px,-.8px)}25%{transform:translate(1.5px,-.8px)}50%{transform:translate(-1.5px,.4px)}75%{transform:translate(1.5px,.4px)}}
@keyframes hunch{from{transform:translateY(.4px)}to{transform:translateY(1px)}}
@keyframes keysL{from{transform:translate(7px,12px) rotate(-14deg)}to{transform:translate(7px,10px) rotate(-14deg)}}
@keyframes keysR{from{transform:translate(-7px,12px) rotate(14deg)}to{transform:translate(-7px,10px) rotate(14deg)}}
@keyframes glow{from{opacity:.45}to{opacity:1}}
@keyframes screenlight{from{opacity:.06}to{opacity:.2}}
@keyframes rise{0%{opacity:0;transform:translateY(5px)}20%{opacity:1}100%{opacity:0;transform:translateY(-12px)}}

.m-oops .el{transform:translate(1px,-1.6px) rotate(-12deg) scale(.88,1)}
.m-oops .er{transform:translate(-1px,-1.6px) rotate(12deg) scale(.88,1)}
.m-oops .sw{animation:shake .12s linear infinite}
.m-oops .bg{animation:none}
.m-oops .al{transform:rotate(26deg)}
.m-oops .ar{transform:rotate(-26deg)}
.drop{animation:fall 1.1s ease-in infinite}
@keyframes shake{0%,100%{transform:translate(.7px,-.3px)}25%{transform:translate(-.8px,.2px)}50%{transform:translate(.4px,.6px)}75%{transform:translate(-.5px,-.6px)}}
@keyframes fall{0%{transform:translateY(-1px);opacity:0}15%{opacity:1}100%{transform:translateY(9px);opacity:0}}

.m-happy .sw{animation:bounce .66s ease-in-out infinite}
.m-happy .bg{animation:none}
.m-happy .sh{animation:land .66s ease-in-out infinite}
.m-happy .al{animation:waveL .33s ease-in-out infinite alternate}
.m-happy .ar{animation:waveR .33s ease-in-out infinite alternate}
.m-happy .b{animation:none}
.sp{animation:twinkle 1.1s ease-in-out infinite}
.sp2{animation-delay:.55s}
@keyframes bounce{0%,100%{transform:translateY(0) scale(1.05,.94)}45%{transform:translateY(-5.5px) scale(.97,1.04)}}
@keyframes land{0%,100%{transform:scale(1)}45%{transform:scale(.8)}}
@keyframes waveL{from{transform:rotate(40deg)}to{transform:rotate(14deg)}}
@keyframes waveR{from{transform:rotate(-40deg)}to{transform:rotate(-14deg)}}
@keyframes twinkle{0%,100%{opacity:0;transform:scale(.3) rotate(0deg)}50%{opacity:1;transform:scale(1) rotate(45deg)}}

.m-sleepy .el,.m-sleepy .er{transform:translate(0,3.4px) scale(1.15,.2)}
.m-sleepy .b{animation:none}
.m-sleepy .bg{transform:translateY(1.4px);animation:snooze 3.6s ease-in-out infinite alternate}
.m-sleepy .al{transform:rotate(-12deg)}
.m-sleepy .ar{transform:rotate(12deg)}
.z{opacity:0;animation:zz 3s ease-out infinite}
.z2{animation-delay:1s}
.z3{animation-delay:2s}
@keyframes snooze{from{transform:translateY(1.4px) scale(1.03,.96)}to{transform:translateY(1.4px) scale(1,1)}}
@keyframes zz{0%{opacity:0;transform:translate(0,4px)}25%{opacity:1}100%{opacity:0;transform:translate(5px,-9px)}}

@media (prefers-reduced-motion:reduce){*{animation:none!important}}
`.replace(/\n+/g, '\n')

const eye = (cls: string, cx: number) =>
  `<g class="e ${cls}"><rect class="b" x="${cx - EYE_W / 2}" y="${EYE_Y - EYE_H / 2}" width="${EYE_W}" height="${EYE_H}" rx="${EYE_W / 2}" fill="${INK}"/></g>`

const arc = (cx: number) =>
  `<path d="M${cx - 5.3} 33.6Q${cx} 25 ${cx + 5.3} 33.6" fill="none" stroke="${INK}" stroke-width="3.4" stroke-linecap="round"/>`

const star = (cls: string, x: number, y: number, r: number) =>
  `<path class="sp ${cls}" d="M${x} ${y - r}L${x + r * 0.28} ${y - r * 0.28}L${x + r} ${y}L${x + r * 0.28} ${y + r * 0.28}L${x} ${y + r}L${x - r * 0.28} ${y + r * 0.28}L${x - r} ${y}L${x - r * 0.28} ${y - r * 0.28}Z" fill="#FFD166"/>`

const zed = (cls: string, x: number, y: number, s: number) =>
  `<path class="z ${cls}" d="M${x} ${y}h${s}l${-s} ${s * 1.2}h${s}" fill="none" stroke="${MARK}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`

const CODE = '#7CE7B0'

const glyph = (cls: string, x: number, y: number) =>
  `<path class="code ${cls}" d="M${x + 3} ${y}l-3 2.6l3 2.6M${x + 5} ${y + 5.6}l2 -6.2M${x + 9} ${y}l3 2.6l-3 2.6" fill="none" stroke="${CODE}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>`

// Seen from behind, the lid hides the lower body and feet; the arms reach round to the keys.
const LAPTOP =
  `<rect x="12" y="52.6" width="40" height="3.8" rx="1.9" fill="#26262C"/>` +
  `<rect x="15" y="40" width="34" height="13.4" rx="3" fill="#34343C"/>` +
  `<rect x="15" y="40" width="34" height="2.2" rx="1.1" fill="#4A4A55"/>` +
  `<g class="logo" stroke="${BODY}" stroke-width="1.5" stroke-linecap="round"><path d="M32 43.8v5.8M29.1 45.4l5.8 2.6M34.9 45.4l-5.8 2.6"/></g>`

const EXTRAS: Record<Mood, string> = {
  thinking: '',
  looking: '',
  working: '',
  coding: LAPTOP + glyph('code1', 3, 22) + glyph('code2', 49, 20) + glyph('code3', 25, 12),
  oops: `<path class="drop" d="M51 8Q47.8 12.6 51 14.8Q54.2 12.6 51 8Z" fill="#7CC4FF"/>`,
  happy: star('sp1', 53, 10, 4.6) + star('sp2', 10, 14, 3.2),
  sleepy: zed('z1', 45, 15, 4.4) + zed('z2', 45, 15, 4.4) + zed('z3', 45, 15, 4.4),
}

const BUDDY = 26

function figure(mood: Mood): string {
  const isHappy = mood === 'happy'
  const eyes = isHappy
    ? arc(LEFT_X) + arc(RIGHT_X)
    : eye('el', LEFT_X) + eye('er', RIGHT_X)
  const cheeks = isHappy
    ? `<ellipse cx="14.6" cy="38.2" rx="4" ry="2.4" fill="#FF8FA3" opacity=".6"/><ellipse cx="49.4" cy="38.2" rx="4" ry="2.4" fill="#FF8FA3" opacity=".6"/>`
    : mood === 'coding'
      ? `<ellipse class="glow" cx="32" cy="37" rx="15" ry="6.5" fill="#7CE7FF" opacity=".2"/>`
      : ''

  return (
    `<g class="m-${mood}">` +
    `<ellipse class="sh" cx="32" cy="57.6" rx="15" ry="2.4" fill="#000" opacity=".28"/>` +
    `<g class="sw">` +
    `<rect x="19" y="47" width="9" height="9.6" rx="3.8" fill="${SHADE}"/><rect x="36" y="47" width="9" height="9.6" rx="3.8" fill="${SHADE}"/>` +
    `<g class="bg">` +
    `<rect class="al" x="3.4" y="28" width="9" height="7.4" rx="3.7" fill="${SHADE}"/><rect class="ar" x="51.6" y="28" width="9" height="7.4" rx="3.7" fill="${SHADE}"/>` +
    `<path d="M32 12C46.3 12 55 19.6 55 32C55 44.4 46.3 52 32 52C17.7 52 9 44.4 9 32C9 19.6 17.7 12 32 12Z" fill="${BODY}"/>` +
    `<ellipse cx="22.5" cy="19.6" rx="9" ry="3.6" transform="rotate(-18 22.5 19.6)" fill="#fff" opacity=".17"/>` +
    cheeks +
    `<g class="eyes">${eyes}</g>` +
    `</g></g>` +
    EXTRAS[mood] +
    `</g>`
  )
}

// One small working copy beside the main blob per running subagent.
function face(mood: Mood, buddies = 0): string {
  const n = Math.max(0, Math.min(3, buddies))
  const width = 64 + n * BUDDY
  const minis = Array.from(
    { length: n },
    (_, i) => `<g transform="translate(${66 + i * BUDDY} 35) scale(.42)">${figure('working')}</g>`,
  ).join('')

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} 64" width="${Math.round(width * 0.75)}" height="48">` +
    `<style>${CSS}</style>` +
    figure(mood) +
    minis +
    `</svg>`
  )
}

const tasks = atom({ plugin: 'progress-buddy', key: 'tasks' } as const, [])
const title = atom({ plugin: 'progress-buddy', key: 'title' } as const, '')
const mood = atom({ plugin: 'progress-buddy', key: 'mood' } as const, 'thinking')
const run = atom({ plugin: 'progress-buddy', key: 'run' } as const, 'idle')

// ponytail: kept out of $.state so a tool call never redraws the band; the Client pulls it on its heartbeat.
let activityNow = ''
const agentActivity: Record<string, string> = {}
let cycleAt = 0

const CYCLE: Mood[] = ['happy', 'looking', 'sleepy', 'thinking']
const CYCLE_MS = 4500

function write($: Parameters<typeof update>[0], fn: (list: Task[]) => Task[]) {
  return update($, tasks, list => fn(list ?? []))
}

async function setMood($: Parameters<typeof update>[0], next: Mood) {
  if ((await read($, mood)) !== next) {
    await update($, mood, () => next)
  }
}

async function setRun($: Parameters<typeof update>[0], next: Run) {
  if ((await read($, run)) !== next) {
    await update($, run, () => next)
  }
}

async function cycle($: Parameters<typeof update>[0]) {
  if ((await read($, run)) === 'running') {
    return
  }

  cycleAt += 1
  await setMood($, CYCLE[cycleAt % CYCLE.length]!)
}

async function runningAgents($: EngineInterface) {
  const all = await $.agent.list().catch(() => [])

  return all
    .filter(a => a.teammateId === undefined && a.status === 'running')
    .map(a => ({ label: a.description || a.type, activity: agentActivity[a.id] ?? 'Starting' }))
}

async function bandProps($: EngineInterface) {
  const list = await read($, tasks)
  const name = await read($, title)
  const state = await read($, run)
  const step = list.find(t => t.status === 'in_progress')?.active ?? 'Waiting for the next step'
  const done = list.filter(t => t.status === 'completed').length
  const complete = list.length > 0 ? done === list.length : state === 'done'

  return {
    task: list.length === 0 ? name || 'Ready' : name || step,
    subtask: activityNow || (list.length > 0 && name ? step : state === 'running' ? 'Thinking' : 'Ready when you are'),
    done,
    total: list.length,
    complete,
    state,
    agents: await runningAgents($),
  }
}

type Todo = { content: string; status: Task['status']; activeForm?: string }

const STATUSES = ['pending', 'in_progress', 'completed']

function isTodo(t: unknown): t is Todo {
  const todo = t as Todo | null

  return typeof todo?.content === 'string' && STATUSES.includes(todo.status)
}

function fromTodos(todos: readonly Todo[]): Task[] {
  return todos.map((t, i) => ({
    id: String(i),
    label: t.content,
    active: t.activeForm ?? t.content,
    status: t.status,
  }))
}

const OWN_TOOL = 'mcp__progress-buddy__set_tasks'
const VERBS: Record<string, string> = {
  Edit: 'Editing',
  Write: 'Writing',
  Read: 'Reading',
  NotebookEdit: 'Editing',
  Grep: 'Searching for',
  Glob: 'Finding',
  Agent: 'Delegating:',
  Skill: 'Loading skill',
  WebFetch: 'Fetching',
  WebSearch: 'Searching the web for',
}

// What the tool call is doing, in a few words: "Editing register.tsx".
export function describe(e: Record<string, unknown>): string {
  const tool = String(e.tool)
  const text = (key: string) => (typeof e[key] === 'string' ? (e[key] as string) : undefined)
  const path = text('file_path') ?? text('notebook_path')
  const subject =
    path?.split(/[\\/]/).pop() ??
    text('description') ??
    text('pattern') ??
    text('query') ??
    text('skill') ??
    text('url') ??
    text('command')

  if (subject === undefined) {
    return `Running ${tool.split('__').pop()}`
  }

  return VERBS[tool] === undefined ? subject : `${VERBS[tool]} ${subject}`
}

const LOOKING = ['Read', 'Grep', 'Glob', 'WebFetch', 'WebSearch', 'ToolSearch']
const CODING = ['Edit', 'Write', 'NotebookEdit']

export const register: Register = on => {
  on('tool.call', async ($, e, next) => {
    const tool = String(e.tool)

    if (e.agentId !== undefined) {
      agentActivity[e.agentId] = describe(e as Record<string, unknown>).slice(0, 80)

      return next(e)
    }

    if (tool === OWN_TOOL) {
      return next(e)
    }

    activityNow = describe(e as Record<string, unknown>).slice(0, 120)
    await setMood($, CODING.includes(tool) ? 'coding' : LOOKING.includes(tool) ? 'looking' : 'working')

    const ran = await next(e)

    if (ran.isError === true) {
      await setMood($, 'oops')
    }

    return ran
  })

  on('turn.complete', async ($, e, next) => {
    if (e.agentId !== undefined) {
      delete agentActivity[e.agentId]

      return next(e)
    }

    const list = await read($, tasks)
    const isFinished = list.every(t => t.status === 'completed')
    activityNow = ''
    cycleAt = 0
    await setRun($, isFinished ? 'done' : 'idle')
    await setMood($, isFinished ? 'happy' : 'sleepy')

    return next(e)
  })

  // ponytail: own tool because some sessions (desktop Code tab) ship no TodoWrite/TaskCreate.
  on('tool.call', { tool: OWN_TOOL }, async ($, e) => {
    const { todos, title: newTitle } = e as { todos?: unknown; title?: unknown }

    if (!Array.isArray(todos) || !todos.every(isTodo)) {
      return { deny: 'todos must be an array of { content, status, activeForm? }' }
    }

    await write($, () => fromTodos(todos))

    if (typeof newTitle === 'string') {
      await update($, title, () => newTitle)
    }

    return { result: `${todos.filter(t => t.status === 'completed').length}/${todos.length} done` }
  })

  on('session.start', async ($, e, next) => {
    $.clock.every(CYCLE_MS, () => void cycle($))

    await $.tool.register({
      name: 'set_tasks',
      description:
        'Show the progress of the current task to the user. Call it at the start of any task with more than one step, then again whenever a step starts or finishes. Send the title and the whole list every time. Keep exactly one step in_progress.',
      inputSchema: {
        type: 'object',
        required: ['title', 'todos'],
        properties: {
          title: {
            type: 'string',
            description: 'What the user asked for, present continuous: "Changing the animation"',
          },
          todos: {
            type: 'array',
            items: {
              type: 'object',
              required: ['content', 'status'],
              properties: {
                content: { type: 'string', description: 'The step, imperative: "Run tests"' },
                activeForm: { type: 'string', description: 'Shown while in progress: "Running tests"' },
                status: { type: 'string', enum: STATUSES },
              },
            },
          },
        },
      },
    })

    return next(e)
  })

  on('prompt.submit', async ($, e, next) => {
    const list = await read($, tasks)
    await setMood($, 'thinking')
    await setRun($, 'running')

    if (list.every(t => t.status === 'completed')) {
      const firstLine = e.text.trim().split('\n')[0] ?? ''
      await write($, () => [])
      await update($, title, () => firstLine.slice(0, 80))
    }

    return next(e)
  })

  on('tool.call', { tool: 'TodoWrite' }, async ($, e, next) => {
    const ran = await next(e)

    if (ran.deny === undefined && ran.isError !== true) {
      await write($, () => fromTodos(e.todos))
    }

    return ran
  })

  on('tool.call', { tool: 'TaskCreate' }, async ($, e, next) => {
    const ran = await next(e)

    if (ran.deny === undefined && ran.isError !== true) {
      const { id, subject } = ran.result.task
      await write($, list => [
        ...list.filter(t => t.id !== id),
        { id, label: subject, active: e.activeForm ?? subject, status: 'pending' },
      ])
    }

    return ran
  })

  on('tool.call', { tool: 'TaskUpdate' }, async ($, e, next) => {
    const ran = await next(e)

    if (ran.deny === undefined && ran.isError !== true && ran.result.success) {
      const { status } = e
      await write($, list =>
        status === 'deleted'
          ? list.filter(t => t.id !== e.taskId)
          : list.map(t =>
              t.id === e.taskId
                ? {
                    ...t,
                    label: e.subject ?? t.label,
                    active: e.activeForm ?? e.subject ?? t.active,
                    status: status ?? t.status,
                  }
                : t,
            ),
      )
    }

    return ran
  })

  on('ui.message', async ($, e, next) => (e.element === 'band' ? { props: await bandProps($) } : next(e)))

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const props = await bandProps($)

    if (e.props.hasSurvey) {
      return next(e)
    }

    const { Box, Text } = $.ui.resolve(e)
    const feeling: Mood = await read($, mood)
    let avatar
    let band

    if (e.surface === 'terminal') {
      avatar = <Text color="#D97757">{KAOMOJI[feeling]}</Text>
    } else {
      const { Svg } = $.ui.resolve(e)
      const buddies = Math.min(3, props.agents.length)
      avatar = (
        <Svg
          source={face(feeling, buddies)}
          alt={`Claude is ${feeling}${buddies > 0 ? `, with ${buddies} helpers` : ''}`}
          width={Math.round((64 + buddies * 26) * 0.75)}
          height={48}
        />
      )
    }

    if (e.surface === 'terminal' || e.surface === 'desktop') {
      band = $.ui.resolve(e).Client({ key: 'band', module: './band.tsx', props, flexGrow: 1 })
    } else {
      band = (
        <Box flexDirection="column">
          <Text bold wrap="truncate-end">
            {props.task}
          </Text>
          <Text dimColor wrap="truncate-end">
            {props.total > 0 ? `${props.done}/${props.total} · ${Math.round((props.done / props.total) * 100)}%` : props.complete ? '✓ Done' : '…'}
          </Text>
          <Text dimColor wrap="truncate-end">
            {props.subtask}
          </Text>
        </Box>
      )
    }

    return (
      <Box gap={1} alignItems="center">
        {avatar}
        {band}
      </Box>
    )
  })
}
