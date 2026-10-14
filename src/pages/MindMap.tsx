import { useMemo, useState } from 'react'
import ReactFlow, { Background, Controls } from 'reactflow'
import type { Edge, Node } from 'reactflow'
import 'reactflow/dist/style.css'
import NoLesson from '../components/NoLesson'
import { generateMindMap } from '../lib/gemini'
import type { MapNode } from '../lib/types'
import { useStore } from '../store'

function layout(root: MapNode): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = []
  const edges: Edge[] = []
  let leaf = 0
  let id = 0
  const style = {
    border: '1.5px solid currentColor',
    borderRadius: 999,
    background: 'transparent',
    color: 'inherit',
    padding: '6px 14px',
    fontSize: 13,
    width: 'auto',
  }
  function walk(n: MapNode, depth: number, parent?: string): number {
    const me = `n${id++}`
    const kids = n.children ?? []
    const ys = kids.map((c) => walk(c, depth + 1, me))
    const y = kids.length ? (ys[0] + ys[ys.length - 1]) / 2 : leaf++ * 60
    nodes.push({
      id: me,
      position: { x: depth * 260, y },
      data: { label: n.label },
      style: { ...style, fontWeight: depth === 0 ? 800 : 500 },
    })
    if (parent) edges.push({ id: `${parent}-${me}`, source: parent, target: me, style: { stroke: 'currentColor' } })
    return y
  }
  walk(root, 0)
  return { nodes, edges }
}

export default function MindMap() {
  const { lessons, currentKey, patchLesson } = useStore()
  const lesson = currentKey ? lessons[currentKey] : null
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const mindmap = lesson?.mindmap
  const graph = useMemo(() => (mindmap ? layout(mindmap) : null), [mindmap])

  if (!lesson) return <NoLesson />

  async function make() {
    if (!lesson) return
    setBusy(true)
    setError('')
    try {
      patchLesson(lesson.key, { mindmap: await generateMindMap(lesson) })
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-black tracking-tight">Mind map: {lesson.topic}</h1>
        <button className="btn btn-solid" disabled={busy} onClick={make}>
          {busy ? 'Drawing…' : graph ? 'Regenerate' : 'Generate mind map'}
        </button>
      </div>
      {error && <p className="rounded-xl border border-red-500 p-3 text-sm text-red-500">{error}</p>}
      {graph && (
        <div className="card h-[560px] overflow-hidden !p-0 text-zinc-900 dark:text-zinc-100">
          <ReactFlow nodes={graph.nodes} edges={graph.edges} fitView nodesConnectable={false}>
            <Background gap={14} size={1.4} color="currentColor" style={{ opacity: 0.25 }} />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>
      )}
    </div>
  )
}
