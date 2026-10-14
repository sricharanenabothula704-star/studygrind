import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

export default class ErrorBoundary extends Component<Props, { error: Error | null }> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled UI error', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div role="alert" className="card mx-auto mt-10 max-w-md space-y-3 text-center">
        <h1 className="text-xl font-black">Something broke</h1>
        <p className="text-sm text-zinc-500">The page hit an unexpected error. Your saved data is untouched.</p>
        <div className="flex justify-center gap-2">
          <button className="btn btn-solid" onClick={() => this.setState({ error: null })}>Try again</button>
          <button className="btn" onClick={() => (window.location.href = import.meta.env.BASE_URL)}>Go home</button>
        </div>
        <details className="text-left text-xs text-zinc-500">
          <summary className="cursor-pointer">Details</summary>
          <pre className="mt-2 whitespace-pre-wrap">{this.state.error.message}</pre>
        </details>
      </div>
    )
  }
}
