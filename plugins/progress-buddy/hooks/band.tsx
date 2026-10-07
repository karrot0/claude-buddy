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
type State = { frame: number; shown: number; tone: number }

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
const FRAME_MS = 40
const HEARTBEAT_MS = 250
const SWEEP = 9
const MAX_AGENT_ROWS = 3

const started = new WeakSet<object>()
let latest: Props = { task: '', subtask: '', done: 0, total: 0, complete: false, state: 'idle', agents: [] }

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

export default function Band(p: Props, surface: ClientSurface<State>) {
  latest = p
  const { Box, Text } = surface.elements

  if (!started.has(surface)) {
    started.add(surface)
    surface.every(FRAME_MS, () => {
      const s = surface.state ?? { frame: 0, shown: fraction(latest), tone: latest.complete ? 1 : 0 }
      const gap = fraction(latest) - s.shown
      const toneGap = (latest.complete ? 1 : 0) - s.tone

      surface.setState({
        frame: s.frame + 1,
        shown: Math.abs(gap) < 0.002 ? fraction(latest) : s.shown + gap * 0.16,
        tone: Math.abs(toneGap) < 0.01 ? (latest.complete ? 1 : 0) : s.tone + toneGap * 0.1,
      })
    })
    surface.every(HEARTBEAT_MS, () => surface.post(1))
  }

  const { frame, shown, tone } = surface.state ?? { frame: 0, shown: fraction(p), tone: p.complete ? 1 : 0 }
  const cells = Math.max(10, Math.min(44, (surface.columns || 36) - 12))
  const flow = frame * 0.0105
  const glint = ((frame * (0.6 + 0.5 * tone)) % (cells + 20)) - 10
  const pulse = tone * (0.5 + 0.5 * Math.sin(frame * 0.12)) * 0.16
  const isSweep = p.state === 'running' && p.total === 0 && !p.complete
  const isEmpty = p.total === 0 && !p.complete && !isSweep
  const eighths = Math.round(shown * cells * 8)
  const full = Math.floor(eighths / 8)
  const rest = eighths % 8
  const head = (frame * 0.45) % (cells + SWEEP)

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
  const spinner = SPINNER[Math.floor(frame / 3) % SPINNER.length]
  const label = p.complete
    ? p.total > 0
      ? ` ✓ ${p.done}/${p.total} · 100%`
      : ' ✓ Done'
    : p.total > 0
      ? ` ${p.done}/${p.total} · ${Math.round(fraction(p) * 100)}%`
      : ''
  const rows = p.agents.slice(0, MAX_AGENT_ROWS)

  return (
    <Box flexDirection="column">
      <Text bold wrap="truncate-end">
        {p.task}
      </Text>
      <Box>
        {bar}
        {label === '' ? null : (
          <Text bold color={accent}>
            {label}
          </Text>
        )}
      </Box>
      {p.complete ? (
        <Text color={accent} wrap="truncate-end">
          ✓ Done
        </Text>
      ) : (
        <Text dimColor wrap="truncate-end">
          {p.state === 'running' ? `${spinner} ${p.subtask}` : p.subtask}
        </Text>
      )}
      {rows.map(a => (
        <Text dimColor wrap="truncate-end">
          {`↳ ${spinner} ${a.label} · ${a.activity}`}
        </Text>
      ))}
      {p.agents.length > MAX_AGENT_ROWS ? (
        <Text dimColor>{`↳ +${p.agents.length - MAX_AGENT_ROWS} more agents`}</Text>
      ) : null}
    </Box>
  )
}
