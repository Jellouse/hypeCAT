import { Component, StrictMode, type ErrorInfo, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

type RootErrorBoundaryProps = {
  children: ReactNode
}

type RootErrorBoundaryState = {
  hasError: boolean
  message: string
}

class RootErrorBoundary extends Component<RootErrorBoundaryProps, RootErrorBoundaryState> {
  state: RootErrorBoundaryState = {
    hasError: false,
    message: '',
  }

  static getDerivedStateFromError(error: Error): RootErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || 'Unknown runtime error',
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Root render error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <main
          style={{
            minHeight: '100vh',
            display: 'grid',
            placeItems: 'center',
            padding: '1rem',
            background: '#f5f6f8',
            color: '#202631',
            fontFamily: 'monospace',
          }}
        >
          <section
            style={{
              width: 'min(760px, 100%)',
              border: '1px solid #d0d7df',
              background: '#fff',
              padding: '1rem',
            }}
          >
            <h1 style={{ margin: '0 0 0.5rem', fontSize: '1rem' }}>Runtime error</h1>
            <p style={{ margin: 0 }}>{this.state.message}</p>
          </section>
        </main>
      )
    }

    return this.props.children
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </StrictMode>,
)
