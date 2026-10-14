import { lazy, Suspense, useEffect } from 'react'
import { Link, NavLink, Route, Routes } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'
import { useStore } from './store'

const Learn = lazy(() => import('./pages/Learn'))
const Quiz = lazy(() => import('./pages/Quiz'))
const MindMap = lazy(() => import('./pages/MindMap'))
const Notes = lazy(() => import('./pages/Notes'))
const Todo = lazy(() => import('./pages/Todo'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Settings = lazy(() => import('./pages/Settings'))

const links = [
  ['/', 'Learn'],
  ['/quiz', 'Quiz'],
  ['/mindmap', 'Mind map'],
  ['/notes', 'Notes'],
  ['/todo', 'To-do'],
  ['/dashboard', 'Dashboard'],
  ['/settings', 'Settings'],
] as const

function NotFound() {
  return (
    <div className="card mx-auto max-w-md space-y-3 text-center">
      <h1 className="text-xl font-black">Page not found</h1>
      <Link to="/" className="btn btn-solid">Back to Learn</Link>
    </div>
  )
}

export default function App() {
  const theme = useStore((s) => s.theme)
  const set = useStore((s) => s.set)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.style.colorScheme = theme
  }, [theme])

  return (
    <div className="mx-auto min-h-screen max-w-5xl px-4 pb-16">
      <header className="flex flex-wrap items-center justify-between gap-3 py-5">
        <div className="text-xl font-black tracking-tight">
          Study<span className="opacity-50">Grind</span>
        </div>
        <button className="btn" onClick={() => set({ theme: theme === 'dark' ? 'light' : 'dark' })}>
          {theme === 'dark' ? '☀ Light' : '☾ Dark'}
        </button>
      </header>
      <nav aria-label="Main" className="mb-6 flex flex-wrap gap-1 border-b border-zinc-200 pb-3 dark:border-zinc-800">
        {links.map(([to, label]) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `rounded-full px-3 py-1.5 text-sm font-medium transition ${
                isActive
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
      <main>
        <ErrorBoundary>
          <Suspense fallback={<p className="animate-pulse text-sm text-zinc-500">Loading…</p>}>
            <Routes>
              <Route path="/" element={<Learn />} />
              <Route path="/quiz" element={<Quiz />} />
              <Route path="/mindmap" element={<MindMap />} />
              <Route path="/notes" element={<Notes />} />
              <Route path="/todo" element={<Todo />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>
    </div>
  )
}
