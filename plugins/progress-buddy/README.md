# Claude Buddy

A progress band for [Claude Code](https://claude.com/claude-code) with a little coral friend. It sits above the prompt and shows what Claude is working on, how far along it is, and what it is doing right now.

![Claude Buddy: the band while thinking, coding, in the console, using tools, running subagents and finished, plus the moods and outfits](https://raw.githubusercontent.com/karrot0/claude-buddy/main/docs/demo.png)

*The faces are the plugin's own SVG. The bar is drawn as text cells, as it is in the app.*

## What you get

- **Task and subtask.** The bold line is the task ("Fix the login redirect"). The line under the bar is what Claude is doing at this moment ("Editing auth.ts").
- **A gradient progress bar** that fills as steps finish, eases toward its new value, and flows pink → violet → cyan. With no step list it shows a sweeping loader instead.
- **Done state.** When the work finishes the bar fills, turns green, pulses, and reads `✓ Done`. It stays until your next prompt.
- **Always there.** The band is visible from the start of a session. Idle, it says "Ready when you are".
- **A plain fallback.** If the surface reports that the animated band failed (the desktop app drops it when a redraw goes unanswered for two seconds), the plugin draws a plain, unanimated bar with the same information, and tries the animated one again on your next prompt.
- **A buddy with moods.** The face follows the work: thinking, looking (reading and searching), coding (edits and writes, at a laptop), console (shell commands, behind a little terminal), tool (everything else, with a wrench and spinning gears), oops (a tool failed), happy (done), sleepy. Between turns it cycles through faces.
- **Clothes.** Hats and a jacket that sit on the body, so they follow every face and animation. A party hat when the work is done, a nightcap when asleep, a hard hat and hi-vis vest for tools; otherwise an everyday cap or beanie and a jacket or hoodie that change with each new task.
- **Subagents.** Each running subagent gets its own line (`↳ Explore · find the login code · Reading auth.ts`) and a small working copy of the buddy beside the main one (up to three).

## Install

```sh
claude plugin marketplace add karrot0/claude-buddy
claude plugin install progress-buddy@progress-buddy
```

Start a new session and send a prompt.

**Requirements.** This plugin uses Claude Code's function-hook plugin API (a hooks module that draws UI), which is early access and still moving between releases. It was built and tested against the Claude desktop app's Code tab (engine 2.1.289). The terminal draws text faces such as `(•̀_•́)⌨` instead of the SVG. Older builds will ignore the plugin.

## How it works

- Hooks on `tool.call`, `turn.complete`, `prompt.submit` and `session.start` keep a few values in `$.state` (the step list, the title, the mood, the run state).
- The band is a `ui.render` hook on `AbovePrompt`. The face is an SVG; the title, bar and subtask are drawn by a surface module (`hooks/band.tsx`) that animates on its own frame clock and asks the plugin for fresh text four times a second. That keeps the face from being redrawn on every animation frame.
- Subagent events carry an `agentId`; they are tracked separately and never change the main status.
- Steps come from `TodoWrite` / `TaskCreate` / `TaskUpdate` when the session has them. Sessions that don't (the desktop Code tab) get a `set_tasks` tool (`mcp__progress-buddy__set_tasks`) that the model calls with a title and the full step list.

### Moods

| Mood | When |
| --- | --- |
| thinking | after you send a prompt, before any tool runs |
| looking | `Read`, `Grep`, `Glob`, web fetch and search |
| console | shell commands (`Bash`, `PowerShell`) |
| tool | every other tool: MCP tools, skills, agents |
| coding | `Edit`, `Write`, `NotebookEdit` |
| oops | a tool call returned an error |
| happy | the turn finished with every step done |
| sleepy | the turn finished with steps still open |

## What the plugin does with your session

Everything runs locally inside Claude Code. The plugin makes no network requests, spawns no processes, reads and writes no files, and does not depend on or call any other plugin. It uses only these calls on the hook object: `$.state.get`/`set` (its own few values), `$.clock.every` (one timer that cycles the face while idle), `$.tool.register` (adds one tool, below), `$.agent.list` (read-only list of running subagents), `$.ui.resolve` (to draw), and `$.ui.invalidate` (to redraw the band).

**It never submits a prompt of its own, runs a tool or command itself, changes a tool's input, or blocks another tool's call.** Every hook below passes the event on unchanged, except that its own tool refuses malformed input.

| Hook | What it does | Changes anything? |
| --- | --- | --- |
| `tool.call` (every tool) | Reads the tool name and a few input fields (file name, search pattern, description, URL, or the first words of a shell command, cut to 120 characters) to print a short "Editing auth.ts" line and pick a mood. Keeps it in memory only; it is shown in the band and never stored or sent. Calls from subagents are tracked separately. Marks the mood "oops" if the call returns an error. Calls `next(e)` and returns its result untouched. | No |
| `tool.call` for `TodoWrite`, `TaskCreate`, `TaskUpdate` | After the call succeeds, copies the step list into the band. Returns the real result untouched. | No |
| `tool.call` for `mcp__progress-buddy__set_tasks` | Answers the plugin's own tool (see below). This is the only place the plugin stands in for a tool. | Its own tool only |
| `prompt.submit` | Marks the turn as running. If the previous work is finished and the prompt is one you typed, uses its first line (80 characters) as the new task title. Prompts you did not type (a background task notification, another session, an engine notice, or anything starting with a markup tag) keep the current title. Returns the prompt unchanged. | No |
| `turn.complete` | Marks the run done or idle and picks the happy or sleepy face. | No |
| `session.start` | Registers `set_tasks` and starts the face-cycling timer. | Adds a tool |
| `ui.render` on `AbovePrompt` | Draws the band. | UI only |
| `ui.message` | Answers the band's own heartbeat (the number `1`, posted by the surface module `hooks/band.tsx` four times a second) with the text to display. Nothing else is sent anywhere. | No |
| `ui.fault` | Hears that the animated band failed on the surface and switches to the plain bar. Observes only. | No |

### The tool it adds

`mcp__progress-buddy__set_tasks` takes a `title` and a `todos` list (`content`, `status`, optional `activeForm`). The model calls it at the start of a multi-step task and again whenever a step starts or finishes. The plugin stores the list in session state and returns `n/m done`. It does nothing else, and it is only registered so sessions without `TodoWrite` still have a way to report steps.

### Tests

The test suite is not part of this plugin. It lives in the repository's `dev/tests/` folder, outside this folder, and runs against the test kit's mock engine, where it calls tools and `prompt.submit` to exercise the hooks. Nothing in this folder calls a tool, runs a command or submits a prompt.

## Layout

`hooks/register.tsx` (hooks, state and the SVG buddy), `hooks/band.tsx` (the animated bar and text), `types/index.d.ts` (state contract), `.claude-plugin/icon.png` (listing icon).

## License

[MIT](LICENSE). Claude Buddy is an unofficial community project and is not affiliated with or endorsed by Anthropic.
