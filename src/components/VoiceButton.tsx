import { useEffect, useState } from 'react'
import { speak, stopSpeaking } from '../lib/audio'

export default function VoiceButton({ text, label = 'Listen' }: { text: string; label?: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'playing'>('idle')
  const [fallback, setFallback] = useState(false)

  // callers pass key={text}, so a new step remounts this and resets state; unmount stops playback
  useEffect(() => () => stopSpeaking(), [])

  async function toggle() {
    if (state !== 'idle') {
      stopSpeaking()
      setState('idle')
      return
    }
    setState('loading')
    const p = speak(text)
    // flip to "playing" once the request is in flight long enough to have audio
    const t = setTimeout(() => setState((s) => (s === 'loading' ? 'playing' : s)), 600)
    const r = await p
    clearTimeout(t)
    setFallback(r.usedFallback)
    setState('idle')
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button className="btn btn-solid" onClick={toggle}>
        {state === 'idle' ? `🔊 ${label}` : state === 'loading' ? '… Loading voice' : '⏹ Stop'}
      </button>
      {fallback && <span className="text-xs text-zinc-500">browser voice (Gemini voice unavailable)</span>}
    </span>
  )
}
