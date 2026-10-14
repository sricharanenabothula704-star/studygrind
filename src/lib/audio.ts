import { useStore } from '../store'
import { ttsPcm } from './gemini'

const MAX_CACHE = 20
let ctx: AudioContext | null = null
let source: AudioBufferSourceNode | null = null
/** bumped on every speak()/stop so a slow, stale request can never start playing */
let generation = 0
const cache = new Map<string, string>()

export function stopSpeaking() {
  generation++
  try {
    source?.stop()
  } catch {
    /* already stopped */
  }
  source = null
  if ('speechSynthesis' in window) window.speechSynthesis.cancel()
}

function playPcm(b64: string, gen: number): Promise<void> {
  if (gen !== generation) return Promise.resolve()
  ctx ??= new AudioContext({ sampleRate: 24000 })
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  const pcm = new Int16Array(bytes.buffer, 0, Math.floor(bytes.length / 2))
  const buf = ctx.createBuffer(1, pcm.length, 24000)
  const ch = buf.getChannelData(0)
  for (let i = 0; i < pcm.length; i++) ch[i] = pcm[i] / 32768
  const node = ctx.createBufferSource()
  node.buffer = buf
  node.connect(ctx.destination)
  source = node
  return new Promise((resolve) => {
    node.onended = () => resolve()
    void ctx!.resume().then(() => {
      if (gen === generation) node.start()
      else resolve()
    })
  })
}

function browserSpeak(text: string, gen: number): Promise<void> {
  if (gen !== generation || !('speechSynthesis' in window)) return Promise.resolve()
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text)
    const voices = speechSynthesis.getVoices()
    u.voice =
      voices.find((v) => /en-(IN|GB|US)/.test(v.lang) && /natural|google|online/i.test(v.name)) ??
      voices.find((v) => v.lang.startsWith('en')) ??
      null
    u.rate = 0.95
    u.onend = () => resolve()
    u.onerror = () => resolve()
    speechSynthesis.speak(u)
  })
}

/** Speaks with Gemini TTS, falling back to the browser voice. Resolves when finished or stopped. */
export async function speak(text: string): Promise<{ usedFallback: boolean }> {
  stopSpeaking()
  const gen = generation
  const { geminiVoice, voice } = useStore.getState()
  if (geminiVoice) {
    try {
      const k = voice + '|' + text
      let b64 = cache.get(k)
      if (!b64) {
        b64 = await ttsPcm(text, voice)
        if (cache.size >= MAX_CACHE) cache.delete(cache.keys().next().value!)
        cache.set(k, b64)
      }
      await playPcm(b64, gen)
      return { usedFallback: false }
    } catch {
      /* fall through to browser voice */
    }
  }
  await browserSpeak(text, gen)
  return { usedFallback: true }
}
