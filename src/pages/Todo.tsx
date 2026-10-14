import { useState } from 'react'
import { useStore } from '../store'

export default function Todo() {
  const { todos, addTodos, toggleTodo, removeTodo, lessons, currentKey } = useStore()
  const [text, setText] = useState('')
  const [subject, setSubject] = useState('')
  const lesson = currentKey ? lessons[currentKey] : null

  function add() {
    if (!text.trim()) return
    addTodos([text.trim()], subject.trim() || 'General')
    setText('')
  }

  const open = todos.filter((t) => !t.done)
  const done = todos.filter((t) => t.done)

  const row = (t: (typeof todos)[number]) => (
    <li key={t.id} className="flex items-center gap-3 rounded-xl border border-zinc-200 px-3 py-2 dark:border-zinc-800">
      <input type="checkbox" className="size-4 accent-zinc-900 dark:accent-zinc-100" checked={t.done} onChange={() => toggleTodo(t.id)} />
      <span className={`flex-1 text-sm ${t.done ? 'text-zinc-500 line-through' : ''}`}>{t.text}</span>
      <span className="rounded-full border border-zinc-300 px-2 text-xs text-zinc-500 dark:border-zinc-700">{t.subject}</span>
      <button aria-label="Delete" className="text-zinc-400 hover:text-red-500" onClick={() => removeTodo(t.id)}>✕</button>
    </li>
  )

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black tracking-tight">To-do</h1>
      <div className="card flex flex-wrap gap-2">
        <input className="input flex-1 basis-56" placeholder="Add a task…" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
        <input className="input basis-36 sm:w-40 sm:flex-none" placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
        <button className="btn btn-solid" onClick={add}>Add</button>
        {lesson && (
          <button className="btn" onClick={() => addTodos(lesson.steps.map((s) => `Revise: ${s.title}`), lesson.topic)}>
            + Steps from “{lesson.topic}”
          </button>
        )}
      </div>
      <ul className="space-y-2">{open.map(row)}</ul>
      {open.length === 0 && <p className="text-sm text-zinc-500">Nothing pending. Nice.</p>}
      {done.length > 0 && (
        <>
          <h2 className="label">Done ({done.length})</h2>
          <ul className="space-y-2">{done.map(row)}</ul>
        </>
      )}
    </div>
  )
}
