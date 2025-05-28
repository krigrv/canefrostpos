/*
 * ErrorBoundary Component
 * Created to catch and display React errors that prevent the app from loading
 * Added as part of debugging blank screen issue
 */
import React from 'react'
import { Box, Typography, Button } from '@mui/material'

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
        <Box 
          display="flex" 
          flexDirection="column" 
          alignItems="center" 
          justifyContent="center" 
          minHeight="100vh"
          p={3}
        >
          <Typography variant="h4" color="error" gutterBottom>
            Something went wrong
          </Typography>
          <Typography variant="body1" color="textSecondary" gutterBottom>
            {this.state.error && this.state.error.toString()}
          </Typography>
          <Box mt={2}>
            <Button 
              variant="contained" 
              onClick={() => window.location.reload()}
            >
              Reload Page
            </Button>
          </Box>
          {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
            <Box mt={3} maxWidth={800}>
              <Typography variant="h6" gutterBottom>
                Error Details:
              </Typography>
              <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                {this.state.errorInfo.componentStack}
              </pre>
            </Box>
          )}
        </Box>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary