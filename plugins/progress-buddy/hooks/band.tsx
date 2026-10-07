import type { ClientSurface } from 'claude-code'

type Agent = { label: string; activity: string }
type Props = {
  task: string
  subtask: string
  done: number
  total: number
  complete: boolean
  state: 'idle' | 'running' | 'done'
  agents: Agent[]
}
type State = { frame: number }

const PINK = [
  [255, 95, 162],
  [139, 92, 246],
  [34, 211, 238],
] as const
const GREEN = [
  [22, 163, 74],
  [74, 222, 128],
  [16, 185, 129],
] as const
const TRACK = [88, 88, 98] as const
const WHITE = [255, 255, 255] as const
const SPINNER = '⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'
const PARTIAL = '▏▎▍▌▋▊▉'
const FRAME_MS = 60
const HEARTBEAT_MS = 250
const SWEEP = 9
const MAX_AGENT_ROWS = 3

// The animation's own values live here, not in surface.state, so a tick never depends on what an old closure sees.
let latest: Props = { task: '', subtask: '', done: 0, total: 0, complete: false, state: 'idle', agents: [] }
let frame = 0
let shown = 0
let tone = 0
// ponytail: one live timer pair per module; a newer start retires the older one, so a start that
// repeats can never pile timers up. Two bands at once would share one clock; give each its own if that is ever needed.
let generation = 0

function fraction(p: Props): number {
  return p.complete ? 1 : p.total === 0 ? 0 : p.done / p.total
}

function mix(a: readonly number[], b: readonly number[], t: number): number[] {
  return a.map((v, i) => v + (b[i]! - v) * t)
}

function hex(c: readonly number[]): string {
  return '#' + c.map(v => Math.round(v).toString(16).padStart(2, '0')).join('')
}

function gradient(t: number, stops: readonly (readonly number[])[]): number[] {
  const x = (((t % 1) + 1) % 1) * stops.length
  const i = Math.floor(x) % stops.length

  return mix(stops[i]!, stops[(i + 1) % stops.length]!, x - Math.floor(x))
}

function start(surface: ClientSurface<State>) {
  generation += 1
  const mine = generation
  shown = fraction(latest)
  tone = latest.complete ? 1 : 0

  const stopFrames = surface.every(FRAME_MS, () => {
    if (mine !== generation) {
      stopFrames()

      return
    }

    const gap = fraction(latest) - shown
    const toneGap = (latest.complete ? 1 : 0) - tone
    frame += 1
    shown = Math.abs(gap) < 0.002 ? fraction(latest) : shown + gap * 0.22
    tone = Math.abs(toneGap) < 0.01 ? (latest.complete ? 1 : 0) : tone + toneGap * 0.14
    surface.setState({ frame })
  })
  const stopBeats = surface.every(HEARTBEAT_MS, () => {
    if (mine !== generation) {
      stopBeats()

      return
    }

    surface.post(1)
  })
}

export default function Band(p: Props, surface: ClientSurface<State>) {
  latest = p
  const { Box, Text } = surface.elements

  if (surface.state === undefined) {
    surface.setState({ frame })
    start(surface)
  }

  const agents = p.agents ?? []
  const cells = Math.max(10, Math.min(44, (surface.columns || 36) - 12))
  const flow = frame * 0.016
  const glint = ((frame * (0.9 + 0.75 * tone)) % (cells + 20)) - 10
  const pulse = tone * (0.5 + 0.5 * Math.sin(frame * 0.18)) * 0.16
  const isSweep = p.state === 'running' && p.total === 0 && !p.complete
  const isEmpty = p.total === 0 && !p.complete && !isSweep
  const eighths = Math.round(shown * cells * 8)
  const full = Math.floor(eighths / 8)
  const rest = eighths % 8
  const head = (frame * 0.68) % (cells + SWEEP)

  const colour = (i: number) =>
    mix(gradient((i / cells) * 0.9 - flow, PINK), gradient((i / cells) * 0.9 - flow, GREEN), tone)

  const bar = Array.from({ length: cells }, (_, i) => {
    const base = colour(i)

    if (isSweep) {
      const behind = head - i

      return behind >= 0 && behind < SWEEP ? (
        <Text color={hex(mix(TRACK, base, 1 - behind / SWEEP))}>█</Text>
      ) : (
        <Text color={hex(TRACK)}>░</Text>
      )
    }

    if (isEmpty) {
      return <Text color={hex(mix(TRACK, base, Math.max(0, 1 - Math.abs(i - glint) / 8) * 0.4))}>░</Text>
    }

    if (i > full || (i === full && rest === 0)) {
      return <Text color={hex(TRACK)}>░</Text>
    }

    const shine = Math.max(0, 1 - Math.abs(i - glint) / 6) * (0.5 + 0.25 * tone) + pulse
    const lit = mix(base, WHITE, Math.min(0.85, shine))

    return <Text color={hex(lit)}>{i === full ? PARTIAL[rest - 1] : '█'}</Text>
  })

  const accent = hex(colour(0))
  const spinner = SPINNER[Math.floor(frame / 2) % SPINNER.length]
  const label = p.complete
    ? p.total > 0
      ? ` ✓ ${p.done}/${p.total} · 100%`
      : ' ✓ Done'
    : p.total > 0
      ? ` ${p.done}/${p.total} · ${Math.round(fraction(p) * 100)}%`
      : ''

  if (label !== '') {
    bar.push(
      <Text bold color={accent}>
        {label}
      </Text>,
    )
  }

  const lines = [
    <Text bold wrap="truncate-end">
      {p.task}
    </Text>,
    <Box>{bar}</Box>,
    p.complete ? (
      <Text color={accent} wrap="truncate-end">
        ✓ Done
      </Text>
    ) : (
      <Text dimColor wrap="truncate-end">
        {p.state === 'running' ? `${spinner} ${p.subtask}` : p.subtask}
      </Text>
    ),
    ...agents.slice(0, MAX_AGENT_ROWS).map(a => (
      <Text dimColor wrap="truncate-end">
        {`↳ ${spinner} ${a.label} · ${a.activity}`}
      </Text>
    )),
  ]

  if (agents.length > MAX_AGENT_ROWS) {
    lines.push(<Text dimColor>{`↳ +${agents.length - MAX_AGENT_ROWS} more agents`}</Text>)
  }

  return <Box flexDirection="column">{lines}</Box>
}
