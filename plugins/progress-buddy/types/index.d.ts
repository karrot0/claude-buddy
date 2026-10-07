export type TaskStatus = 'pending' | 'in_progress' | 'completed'

export type Task = { id: string; label: string; active: string; status: TaskStatus }

export type Mood = 'thinking' | 'looking' | 'working' | 'coding' | 'oops' | 'happy' | 'sleepy'

export type Run = 'idle' | 'running' | 'done'

declare module 'claude-code' {
  interface PluginState {
    'progress-buddy': { tasks: Task[]; title: string; mood: Mood; run: Run }
  }
}
