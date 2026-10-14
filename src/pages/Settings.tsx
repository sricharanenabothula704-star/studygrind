import { useState } from 'react'
import { testConnection, TEXT_MODELS, TTS_MODELS } from '../lib/gemini'
import { useStore } from '../store'

const VOICES = ['Kore', 'Puck', 'Charon', 'Aoede', 'Fenrir', 'Leda', 'Zephyr', 'Orus']

export default function Settings() {
  const s = useStore()
  const [show, setShow] = useState(false)
  const [msg, setMsg] = useState('')
  const [test, setTest] = useState<{ ok: boolean; text: string } | null>(null)
  const [testing, setTesting] = useState(false)

  async function check() {
    setTesting(true)
    setTest(null)
    try {
      const model = await testConnection()
      setTest({ ok: true, text: `Key works. Answered by ${model}.` })
    } catch (e) {
      setTest({ ok: false, text: e instanceof Error ? e.message : String(e) })
    } finally {
      setTesting(false)
    }
  }

  function exportData() {
    const { lessons, todos, activity, currentKey } = useStore.getState()
    const url = URL.createObjectURL(
      new Blob([JSON.stringify({ lessons, todos, activity, currentKey })], { type: 'application/json' }),
    )
    const a = document.createElement('a')
    a.href = url
    a.download = 'studygrind-backup.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function importData(file?: File) {
    if (!file) return
    if (file.size > 20 * 1024 * 1024) return setMsg('That file is too large to be a backup.')
    if (!confirm('Importing replaces your current lessons, to-dos and activity. Continue?')) return
    try {
      s.importData(await file.text())
      setMsg('Backup restored.')
    } catch {
      setMsg('That file is not a valid StudyGrind backup. Nothing was changed.')
    }
  }

  return (
    <div className="max-w-xl space-y-5">
      <h1 className="text-2xl font-black tracking-tight">Settings</h1>

      <div className="card space-y-2">
        <label className="label" htmlFor="apikey">Gemini API key</label>
        <div className="flex gap-2">
          <input
            id="apikey"
            className="input"
            type={show ? 'text' : 'password'}
            placeholder="AIza…"
            value={s.apiKey}
            onChange={(e) => s.set({ apiKey: e.target.value })}
            autoComplete="off"
            spellCheck={false}
          />
          <button className="btn" onClick={() => setShow(!show)}>{show ? 'Hide' : 'Show'}</button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button className="btn btn-solid" disabled={!s.apiKey.trim() || testing} onClick={check}>
            {testing ? 'Testing…' : 'Test connection'}
          </button>
          {test && (
            <span role="status" className={`text-sm ${test.ok ? '' : 'text-red-500'}`}>{test.ok ? '✓ ' : '✕ '}{test.text}</span>
          )}
        </div>
        <p className="text-xs text-zinc-500">
          Get a free key at aistudio.google.com/apikey. It is saved only in this browser and is sent only to Google's Gemini API.
          Use a key you don't mind rotating, and never use this app on a shared computer.
        </p>
      </div>

      <div className="card space-y-3">
        <div>
          <label className="label" htmlFor="level">Explanation level</label>
          <select id="level" className="input" value={s.level} onChange={(e) => s.set({ level: e.target.value as 'simple' | 'normal' | 'advanced' })}>
            <option value="simple">Simple: like I'm new to this</option>
            <option value="normal">Normal: Class 11</option>
            <option value="advanced">Advanced: detailed and rigorous</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="voice">Voice</label>
          <select id="voice" className="input" value={s.voice} onChange={(e) => s.set({ voice: e.target.value })}>
            {VOICES.map((v) => <option key={v}>{v}</option>)}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="size-4 accent-zinc-900 dark:accent-zinc-100" checked={s.geminiVoice} onChange={(e) => s.set({ geminiVoice: e.target.checked })} />
          Use Gemini voice (falls back to browser voice if the limit is hit)
        </label>
      </div>

      <div className="card space-y-3">
        <div className="label !mb-0">Models (advanced)</div>
        <div>
          <label className="label" htmlFor="textModel">Text model</label>
          <select id="textModel" className="input" value={s.textModel} onChange={(e) => s.set({ textModel: e.target.value })}>
            <option value="">Auto (tries {TEXT_MODELS.join(' → ')})</option>
            {TEXT_MODELS.map((m) => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="ttsModel">Voice model</label>
          <select id="ttsModel" className="input" value={s.ttsModel} onChange={(e) => s.set({ ttsModel: e.target.value })}>
            <option value="">Auto (tries {TTS_MODELS.join(' → ')})</option>
            {TTS_MODELS.map((m) => <option key={m}>{m}</option>)}
          </select>
        </div>
        <p className="text-xs text-zinc-500">Auto is best: if one model's free quota runs out or it is retired, the next one is used.</p>
      </div>

      <div className="card space-y-2">
        <div className="label !mb-0">Backup (browser data can be cleared)</div>
        <div className="flex flex-wrap items-center gap-2">
          <button className="btn" onClick={exportData}>Export JSON</button>
          <label className="btn">
            Import JSON
            <input type="file" accept="application/json" hidden onChange={(e) => { void importData(e.target.files?.[0]); e.target.value = '' }} />
          </label>
          {msg && <span role="status" className="text-xs text-zinc-500">{msg}</span>}
        </div>
      </div>
    </div>
  )
}
