/*
 * Main entry point for Canefrost POS application
 * Updated to include ErrorBoundary for debugging blank screen issues
 * Added comprehensive error handling and logging
 */
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles.css'
// Removed Material-UI theme provider - using Tailwind CSS instead
import { Toaster } from 'react-hot-toast'
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary.jsx'

// Theme configuration removed - using Tailwind CSS for styling

console.log('🚀 Main.jsx loading at:', new Date().toISOString())

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
    <Toaster position="top-right" />
  </ErrorBoundary>
)

console.log('✅ Main.jsx render complete at:', new Date().toISOString())