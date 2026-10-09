import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Hat, Jacket, Mood, Outfit, Run, Task } from '../types'

const BODY = '#D97757'
const SHADE = '#C4623F'
const INK = '#2B1B14'
const MARK = '#E9967A'

const KAOMOJI: Record<Mood, string> = {
  thinking: '(•_• )…',
  looking: '(◉_◉)',
  working: '(•̀_•́)',
  coding: '(•̀_•́)⌨',
  console: '(•_•)>_',
  tool: '(•̀ᴗ•́)و',
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

.m-console .e{transform:translate(0,2.2px) scale(1,.9)}
.m-console .eyes{animation:scan 2.6s ease-in-out infinite alternate}
.m-console .al{transform:translate(6px,11px) rotate(-12deg)}
.m-console .ar{transform:translate(-6px,11px) rotate(12deg)}
.cur{animation:cursor 1s steps(1,end) infinite}
.ln{transform-box:fill-box;transform-origin:0% 50%;animation:print 2.6s steps(6,end) infinite}
.ln2{animation-delay:.9s}
@keyframes scan{from{transform:translate(-1.8px,0)}to{transform:translate(1.8px,0)}}
@keyframes cursor{0%{opacity:1}50%{opacity:0}}
@keyframes print{0%{transform:scaleX(0)}55%,100%{transform:scaleX(1)}}

.m-tool .el{transform:translate(0,.6px) rotate(9deg) scale(1.3,.58)}
.m-tool .er{transform:translate(0,.6px) rotate(-9deg) scale(1.3,.58)}
.m-tool .bg{animation:type .5s ease-in-out infinite alternate}
.m-tool .ar{transform:rotate(-34deg)}
.gear{transform-box:fill-box;transform-origin:center;animation:spin 2.8s linear infinite}
.gear2{animation-duration:2s;animation-direction:reverse}
.wrench{transform-box:view-box;transform-origin:56px 30px;animation:tighten .5s ease-in-out infinite alternate}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes tighten{from{transform:rotate(-8deg)}to{transform:rotate(8deg)}}

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

// A terminal window facing us: a blinking prompt and two lines of output printing.
const TERMINAL =
  `<rect x="11" y="38.5" width="42" height="18.5" rx="3" fill="#0F1014" stroke="#3A3A44" stroke-width=".8"/>` +
  `<path d="M11 43.4V41.5a3 3 0 0 1 3-3h36a3 3 0 0 1 3 3v1.9z" fill="#2A2A31"/>` +
  `<circle cx="14.6" cy="41" r=".95" fill="#FF5F57"/><circle cx="17.6" cy="41" r=".95" fill="#FEBC2E"/><circle cx="20.6" cy="41" r=".95" fill="#28C840"/>` +
  `<path d="M14.6 46.2l2.4 1.9l-2.4 1.9" fill="none" stroke="${CODE}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>` +
  `<rect class="cur" x="18.8" y="49.2" width="3.2" height="1.2" fill="${CODE}"/>` +
  `<rect class="ln ln1" x="14.4" y="52" width="20" height="1.2" rx=".6" fill="#6B6B78"/>` +
  `<rect class="ln ln2" x="14.4" y="54.3" width="13" height="1.2" rx=".6" fill="#55555F"/>`

const STEEL = '#B9BEC9'

const gear = (cls: string, cx: number, cy: number, r: number) =>
  `<g class="gear ${cls}"><circle cx="${cx}" cy="${cy}" r="${r * 0.62}" fill="none" stroke="${STEEL}" stroke-width="${r * 0.5}"/>` +
  Array.from(
    { length: 8 },
    (_, k) =>
      `<rect x="${cx - r * 0.2}" y="${cy - r}" width="${r * 0.4}" height="${r * 0.42}" rx=".4" fill="${STEEL}" transform="rotate(${k * 45} ${cx} ${cy})"/>`,
  ).join('') +
  `</g>`

const WRENCH =
  `<g class="wrench" fill="none" stroke="${STEEL}" stroke-linecap="round"><path d="M58 27L57 14" stroke-width="2.6"/>` +
  `<path d="M54.3 12.6a3.2 3.2 0 1 1 5 .7" stroke-width="2.4"/></g>`

const NO_OUTFIT: Outfit = { hat: 'none', jacket: 'none' }

// Clothes are drawn inside the body group, so they ride every pose and animation without knowing about it.
const HATS: Record<Hat, string> = {
  none: '',
  cap:
    `<path d="M18.5 17Q32 -5 45.5 17Z" fill="#3B82F6"/><path d="M41 15.6Q51 13.8 55.4 18.2Q48 18.6 41.4 17.6Z" fill="#2563EB"/>` +
    `<circle cx="32" cy="6.6" r="1.3" fill="#2563EB"/>`,
  beanie:
    `<path d="M17.6 18Q32 -9 46.4 18Z" fill="#EF6F6C"/><path d="M16.8 15.2h30.4v3.6q-15.2 3-30.4 0z" fill="#D9534F"/>` +
    `<circle cx="32" cy="3.6" r="3" fill="#FCE9E8"/>`,
  party:
    `<path d="M24.5 16L32 -5L39.5 16Z" fill="#8B5CF6"/><path d="M27.3 8.2l7.9 3.2M25.6 13l10.4 2.6" stroke="#FDE047" stroke-width="1.5" stroke-linecap="round"/>` +
    `<circle cx="32" cy="-5.6" r="2.4" fill="#FDE047"/>`,
  hardhat:
    `<path d="M18 17Q32 -7 46 17Z" fill="#FACC15"/><rect x="14.5" y="15.4" width="35" height="3.4" rx="1.7" fill="#EAB308"/>` +
    `<path d="M32 6.4V15" stroke="#EAB308" stroke-width="2.4" stroke-linecap="round"/>`,
  nightcap:
    `<path d="M18.4 17.4Q27 -6 43 5Q51.6 10 53.4 20Q47 14.6 44.6 17Z" fill="#60A5FA"/><path d="M17.4 15.2h28.4v3.4q-14.2 2.6-28.4 0z" fill="#DBEAFE"/>` +
    `<circle cx="53.6" cy="21.4" r="2.7" fill="#F8FAFC"/>`,
}

const torso = (fill: string, details: string) =>
  `<g clip-path="url(#bd)"><path d="M8 42.5Q32 38.5 56 42.5V54H8Z" fill="${fill}"/>${details}</g>`

const JACKETS: Record<Jacket, { sleeve: string; front: string }> = {
  none: { sleeve: SHADE, front: '' },
  jacket: {
    sleeve: '#2F4A7A',
    front: torso(
      '#3B5B92',
      `<path d="M32 40.4V53" stroke="#22365C" stroke-width="1.2"/><path d="M32 40.4h-6.5l6.5 6.6zM32 40.4h6.5l-6.5 6.6z" fill="#587BB8"/>`,
    ),
  },
  hoodie: {
    sleeve: '#5B4BC4',
    front: torso(
      '#6D5BD0',
      `<path d="M29 40.6v6M35 40.6v6" stroke="#EDE9FE" stroke-width="1.1" stroke-linecap="round"/><path d="M24 47.6h16v3.2h-16z" fill="#5B4BC4"/>`,
    ),
  },
  vest: {
    sleeve: SHADE,
    front: torso(
      '#F59E0B',
      `<rect x="8" y="45" width="48" height="2.6" fill="#E5E7EB"/><path d="M32 40.4V53" stroke="#B45309" stroke-width="1.2"/>`,
    ),
  },
}

const EXTRAS: Record<Mood, string> = {
  thinking: '',
  looking: '',
  working: '',
  coding: LAPTOP + glyph('code1', 3, 22) + glyph('code2', 49, 20) + glyph('code3', 25, 12),
  console: TERMINAL,
  tool: gear('gear1', 9, 15, 6) + gear('gear2', 18.4, 5.4, 3.6),
  oops: `<path class="drop" d="M51 8Q47.8 12.6 51 14.8Q54.2 12.6 51 8Z" fill="#7CC4FF"/>`,
  happy: star('sp1', 53, 10, 4.6) + star('sp2', 10, 14, 3.2),
  sleepy: zed('z1', 45, 15, 4.4) + zed('z2', 45, 15, 4.4) + zed('z3', 45, 15, 4.4),
}

const BUDDY = 26
const HEADROOM = 16
const FACE_SCALE = 0.75
const FACE_HEIGHT = Math.round((64 + HEADROOM) * FACE_SCALE)
const BODY_PATH = 'M32 12C46.3 12 55 19.6 55 32C55 44.4 46.3 52 32 52C17.7 52 9 44.4 9 32C9 19.6 17.7 12 32 12Z'

function figure(mood: Mood, outfit: Outfit): string {
  const isHappy = mood === 'happy'
  const jacket = JACKETS[outfit.jacket]
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
    `<rect class="al" x="3.4" y="28" width="9" height="7.4" rx="3.7" fill="${jacket.sleeve}"/><rect class="ar" x="51.6" y="28" width="9" height="7.4" rx="3.7" fill="${jacket.sleeve}"/>` +
    `<path d="${BODY_PATH}" fill="${BODY}"/>` +
    `<ellipse cx="22.5" cy="19.6" rx="9" ry="3.6" transform="rotate(-18 22.5 19.6)" fill="#fff" opacity=".17"/>` +
    jacket.front +
    cheeks +
    `<g class="eyes">${eyes}</g>` +
    HATS[outfit.hat] +
    (mood === 'tool' ? WRENCH : '') +
    `</g></g>` +
    EXTRAS[mood] +
    `</g>`
  )
}

// One small working copy beside the main blob per running subagent. The box has headroom above for hats and the hop.
function face(mood: Mood, buddies = 0, outfit: Outfit = NO_OUTFIT): string {
  const n = Math.max(0, Math.min(3, buddies))
  const width = 64 + n * BUDDY
  const minis = Array.from(
    { length: n },
    (_, i) => `<g transform="translate(${66 + i * BUDDY} 35) scale(.42)">${figure('working', NO_OUTFIT)}</g>`,
  ).join('')

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 ${-HEADROOM} ${width} ${64 + HEADROOM}" width="${Math.round(width * FACE_SCALE)}" height="${FACE_HEIGHT}">` +
    `<style>${CSS}</style>` +
    `<defs><clipPath id="bd"><path d="${BODY_PATH}"/></clipPath></defs>` +
    figure(mood, outfit) +
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

// Party hat when done, nightcap when asleep, hard hat and hi-vis vest for tools; otherwise an everyday
// outfit that changes with each new task. The start point comes from the folder the session runs in.
const EVERYDAY_HATS: Hat[] = ['cap', 'beanie', 'none']
const EVERYDAY_JACKETS: Jacket[] = ['jacket', 'hoodie', 'none']
let wardrobe = 0

function outfitFor(feeling: Mood): Outfit {
  const everydayHat = EVERYDAY_HATS[wardrobe % EVERYDAY_HATS.length]!
  const everydayJacket = EVERYDAY_JACKETS[Math.floor(wardrobe / EVERYDAY_HATS.length) % EVERYDAY_JACKETS.length]!

  return {
    hat: feeling === 'happy' ? 'party' : feeling === 'sleepy' ? 'nightcap' : feeling === 'tool' ? 'hardhat' : everydayHat,
    jacket: feeling === 'tool' ? 'vest' : everydayJacket,
  }
}

const CYCLE: Mood[] = ['happy', 'looking', 'sleepy', 'thinking']
const CYCLE_MS = 4500

// The surface disposes the animated band when it faults (the desktop does so if a render goes unanswered
// for two seconds). ui.fault says so, and the hooks module then draws a plain bar itself. Each new prompt
// tries the animated band again, until it has faulted MAX_FAULTS times in the session.
const PLAIN_CELLS = 30
const MAX_FAULTS = 3
let faults = 0
let isPlain = false
// What the band was last handed. Redraws hand it the same value again, so a redraw alone never makes the
// surface render the band; fresh values reach it through its own heartbeat instead.
let lastSent: Awaited<ReturnType<typeof bandProps>> | undefined

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
    .map(a => ({ label: (a.description || a.type).slice(0, 60), activity: agentActivity[a.id] ?? 'Starting' }))
}

async function bandProps($: EngineInterface) {
  const list = await read($, tasks)
  const name = await read($, title)
  const state = await read($, run)
  const step = list.find(t => t.status === 'in_progress')?.active ?? 'Waiting for the next step'
  const done = list.filter(t => t.status === 'completed').length
  const complete = list.length > 0 ? done === list.length : state === 'done'

  return {
    task: list.length === 0 ? name || (state === 'running' ? 'Working' : 'Ready') : name || step,
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

// A turn can start from something the person did not type: a background task's notification, another
// session's message, an engine notice. Those keep the current task title instead of becoming it.
const NOT_A_REQUEST = [
  'task-notification',
  'peer',
  'peer-send-message',
  'projects-relay',
  'coordinator',
  'observer',
  'observer-activity',
  'unclassified',
  'plugin',
]

function requestTitle(text: string, origin: string | undefined): string | undefined {
  const firstLine =
    text
      .split('\n')
      .find(line => line.trim() !== '')
      ?.trim() ?? ''
  const isMarkup = /^<\/?[a-z][\w-]*[\s>]/i.test(firstLine)

  return firstLine === '' || isMarkup || NOT_A_REQUEST.includes(origin ?? '') ? undefined : firstLine.slice(0, 80)
}

const LOOKING = ['Read', 'Grep', 'Glob', 'WebFetch', 'WebSearch', 'ToolSearch']
const CODING = ['Edit', 'Write', 'NotebookEdit']
const SHELL = ['Bash', 'PowerShell']

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

    if (isPlain) {
      $.ui.invalidate('ui.render')
    }
    await setMood(
      $,
      CODING.includes(tool) ? 'coding' : SHELL.includes(tool) ? 'console' : LOOKING.includes(tool) ? 'looking' : 'tool',
    )

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
      await update($, title, () => newTitle.slice(0, 120))
    }

    return { result: `${todos.filter(t => t.status === 'completed').length}/${todos.length} done` }
  })

  on('session.start', async ($, e, next) => {
    $.clock.every(CYCLE_MS, () => void cycle($))
    wardrobe = Array.from(e.cwd).reduce((sum, ch) => (sum * 31 + ch.charCodeAt(0)) % 9973, 7)

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

    if (isPlain && faults < MAX_FAULTS) {
      isPlain = false
      $.ui.invalidate('ui.render')
    }

    await setMood($, 'thinking')
    await setRun($, 'running')

    if (list.every(t => t.status === 'completed')) {
      const asked = requestTitle(e.text, e.origin?.kind)
      await write($, () => [])

      if (asked !== undefined) {
        wardrobe += 4
        await update($, title, () => asked)
      }
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

  on('ui.message', async ($, e, next) => {
    if (e.element !== 'band') {
      return next(e)
    }

    lastSent = await bandProps($)

    return { props: lastSent }
  })

  on('ui.fault', ($, e, next) => {
    if (e.element === 'band') {
      faults += 1
      isPlain = true
      lastSent = undefined
    }

    return next(e)
  })

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
          source={face(feeling, buddies, outfitFor(feeling))}
          alt={`Claude is ${feeling}${buddies > 0 ? `, with ${buddies} helpers` : ''}`}
          width={Math.round((64 + buddies * BUDDY) * FACE_SCALE)}
          height={FACE_HEIGHT}
        />
      )
    }

    if (!isPlain && (e.surface === 'terminal' || e.surface === 'desktop')) {
      lastSent ??= props
      band = $.ui.resolve(e).Client({ key: 'band', module: './band.tsx', props: lastSent, flexGrow: 1 })
    } else {
      const share = props.complete ? 1 : props.total > 0 ? props.done / props.total : 0
      const filled = Math.round(share * PLAIN_CELLS)
      const accent = props.complete ? '#4ade80' : '#8b5cf6'
      const label = props.complete
        ? props.total > 0
          ? ` ✓ ${props.done}/${props.total} · 100%`
          : ' ✓ Done'
        : props.total > 0
          ? ` ${props.done}/${props.total} · ${Math.round(share * 100)}%`
          : ''

      band = (
        <Box flexDirection="column">
          <Text bold wrap="truncate-end">
            {props.task}
          </Text>
          <Box>
            <Text color={accent}>{'█'.repeat(filled)}</Text>
            <Text dimColor>{'░'.repeat(PLAIN_CELLS - filled)}</Text>
            <Text bold color={accent}>
              {label}
            </Text>
          </Box>
          <Text dimColor wrap="truncate-end">
            {props.complete ? '✓ Done' : props.subtask}
          </Text>
          {props.agents.slice(0, 3).map(a => (
            <Text dimColor wrap="truncate-end">
              {`↳ ${a.label} · ${a.activity}`}
            </Text>
          ))}
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
