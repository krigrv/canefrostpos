import React from 'react';
import logAnalyzer from '../utils/logAnalyzer';

/**
 * Error Boundary Component that integrates with Log Analyzer
 * Catches React errors and sends them to the log analyzer for analysis
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to our analyzer
    if (logAnalyzer) {
      logAnalyzer.logEntry({
        type: 'react-error',
        message: error.message,
        timestamp: new Date().toISOString(),
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        source: 'react-boundary',
        errorInfo: {
          componentStack: errorInfo.componentStack,
          errorBoundary: this.constructor.name,
          errorBoundaryStack: errorInfo.errorBoundaryStack
        }
      });
    }

    // Store error details in state for display
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Log to console for immediate debugging
    console.group('🚨 React Error Boundary Caught Error');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.groupEnd();
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReportError = () => {
    if (logAnalyzer) {
      const report = logAnalyzer.generateReport();
      console.log('📊 Generated error report:', report);
      
      // In a real app, you might send this to an error reporting service
      if (typeof window !== 'undefined') {
        const errorData = {
          error: this.state.error?.message,
          stack: this.state.error?.stack,
          componentStack: this.state.errorInfo?.componentStack,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
          report: report
        };
        
        console.log('📤 Error report data:', errorData);
        // Here you could send to your error reporting service
      }
    }
  };

  render() {
    if (this.state.hasError) {
      // Development error UI with detailed information
      if (process.env.NODE_ENV === 'development') {
        return (
          <div className="error-boundary-dev" style={{
            padding: '20px',
            margin: '20px',
            border: '2px solid #ff6b6b',
            borderRadius: '8px',
            backgroundColor: '#fff5f5',
            fontFamily: 'monospace'
          }}>
            <h2 style={{ color: '#c92a2a', marginBottom: '16px' }}>🚨 React Error Caught</h2>
            
            <div style={{ marginBottom: '16px' }}>
              <strong>Error Message:</strong>
              <pre style={{ 
                backgroundColor: '#ffe0e0', 
                padding: '8px', 
                borderRadius: '4px',
                overflow: 'auto',
                fontSize: '12px'
              }}>
                {this.state.error?.message}
              </pre>
            </div>

            {this.state.error?.stack && (
              <div style={{ marginBottom: '16px' }}>
                <strong>Stack Trace:</strong>
                <pre style={{ 
                  backgroundColor: '#ffe0e0', 
                  padding: '8px', 
                  borderRadius: '4px',
                  overflow: 'auto',
                  fontSize: '10px',
                  maxHeight: '200px'
                }}>
                  {this.state.error.stack}
                </pre>
              </div>
            )}

            {this.state.errorInfo?.componentStack && (
              <div style={{ marginBottom: '16px' }}>
                <strong>Component Stack:</strong>
                <pre style={{ 
                  backgroundColor: '#ffe0e0', 
                  padding: '8px', 
                  borderRadius: '4px',
                  overflow: 'auto',
                  fontSize: '10px',
                  maxHeight: '150px'
                }}>
                  {this.state.errorInfo.componentStack}
                </pre>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button 
                onClick={this.handleRetry}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#4dabf7',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                🔄 Retry
              </button>
              
              <button 
                onClick={this.handleReportError}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#51cf66',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                📊 Generate Report
              </button>
              
              <button 
                onClick={() => window.location.reload()}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#ff8787',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                🔄 Reload Page
              </button>
            </div>

            <div style={{ 
              marginTop: '16px', 
              padding: '12px', 
              backgroundColor: '#e3fafc', 
              borderRadius: '4px',
              fontSize: '12px'
            }}>
              <strong>💡 Debugging Tips:</strong>
              <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                <li>Check the component stack to identify the problematic component</li>
                <li>Look for missing props, undefined variables, or incorrect data types</li>
                <li>Verify that all required dependencies are properly imported</li>
                <li>Check the browser console for additional error details</li>
                <li>Use the log analyzer report to identify patterns</li>
              </ul>
            </div>
          </div>
        );
      }

      // Production error UI - simpler and user-friendly
      return (
        <div className="error-boundary-prod" style={{
          padding: '40px 20px',
          textAlign: 'center',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          margin: '20px'
        }}>
          <h2 style={{ color: '#495057', marginBottom: '16px' }}>😔 Something went wrong</h2>
          <p style={{ color: '#6c757d', marginBottom: '24px' }}>
            We're sorry, but something unexpected happened. Please try refreshing the page.
          </p>
          
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button 
              onClick={this.handleRetry}
              style={{
                padding: '12px 24px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Try Again
            </button>
            
            <button 
              onClick={() => window.location.reload()}
              style={{
                padding: '12px 24px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component to wrap components with error boundary
export const withErrorBoundary = (Component, errorBoundaryProps = {}) => {
  const WrappedComponent = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

// Hook for functional components to report errors manually
export const useErrorReporting = () => {
  const reportError = React.useCallback((error, errorInfo = {}) => {
    if (logAnalyzer) {
      logAnalyzer.logEntry({
        type: 'manual-error-report',
        message: error.message || String(error),
        timestamp: new Date().toISOString(),
        stack: error.stack,
        source: 'manual-report',
        errorInfo
      });
    }
    
    console.error('📝 Manual error report:', error, errorInfo);
  }, []);

  return { reportError };
};

export default ErrorBoundary;