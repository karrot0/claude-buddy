export type TaskStatus = 'pending' | 'in_progress' | 'completed'

export type Task = { id: string; label: string; active: string; status: TaskStatus }

export type Mood = 'thinking' | 'looking' | 'working' | 'coding' | 'console' | 'tool' | 'oops' | 'happy' | 'sleepy'

export type Run = 'idle' | 'running' | 'done'

export type Hat = 'none' | 'cap' | 'beanie' | 'party' | 'hardhat' | 'nightcap'

export type Jacket = 'none' | 'jacket' | 'hoodie' | 'vest'

export type Outfit = { hat: Hat; jacket: Jacket }

declare module 'claude-code' {
  interface PluginState {
    'progress-buddy': { tasks: Task[]; title: string; mood: Mood; run: Run }
  }
}
