/*
 * ErrorBoundary Component
 * Created to catch and display React errors that prevent the app from loading
 * Added as part of debugging blank screen issue
 */
import React from 'react'
import { Button } from '../ui/button'
import { AlertTriangle } from 'lucide-react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({
      error: error,
      errorInfo: errorInfo
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <h1 className="text-3xl font-bold text-red-600">
              Something went wrong
            </h1>
          </div>
          <p className="text-gray-600 mb-6 text-center max-w-md">
            {this.state.error && this.state.error.toString()}
          </p>
          <Button 
            onClick={() => window.location.reload()}
            className="mb-6"
          >
            Reload Page
          </Button>
          {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
            <div className="mt-6 max-w-4xl w-full">
              <h2 className="text-lg font-semibold mb-3">
                Error Details:
              </h2>
              <pre className="text-xs overflow-auto bg-gray-100 p-4 rounded border">
                {this.state.errorInfo.componentStack}
              </pre>
            </div>
          )}
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary