import { Component, ErrorInfo, ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary capturó un error:', error, errorInfo)
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: undefined })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="error-boundary">
          <div className="error-boundary__contenido">
            <h2>?? Error al cargar el módulo</h2>
            <p>Ha ocurrido un error inesperado.</p>
            {this.state.error && (
              <pre className="error-boundary__detalle">
                {this.state.error.message}
              </pre>
            )}
            <div className="error-boundary__acciones">
              <button onClick={this.handleRetry} className="error-boundary__boton">
                Reintentar
              </button>
              <button 
                onClick={() => window.location.reload()} 
                className="error-boundary__boton"
              >
                Recargar página
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
