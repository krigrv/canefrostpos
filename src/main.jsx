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
import ErrorBoundary from './components/ErrorBoundary.jsx'
import logAnalyzer from './utils/logAnalyzer.js'

// Theme configuration removed - using Tailwind CSS for styling

console.log('🚀 Main.jsx loading at:', new Date().toISOString())

// Initialize log analyzer
if (process.env.NODE_ENV === 'development') {
  // Global error handler for non-React errors
  window.addEventListener('error', function(event) {
    console.error('Global error caught:', event.error);
    if (logAnalyzer) {
      logAnalyzer.logEntry({
        type: 'global-js-error',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error ? {
          message: event.error.message,
          stack: event.error.stack
        } : null,
        timestamp: new Date().toISOString(),
        source: 'global-error-listener'
      });
    }
  });

  // Global handler for unhandled promise rejections
  window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection caught:', event.reason);
    if (logAnalyzer) {
      logAnalyzer.logEntry({
        type: 'unhandled-promise-rejection',
        message: event.reason instanceof Error ? event.reason.message : String(event.reason),
        reason: event.reason ? {
          message: event.reason.message,
          stack: event.reason.stack
        } : null,
        timestamp: new Date().toISOString(),
        source: 'global-unhandled-rejection-listener'
      });
    }
  });


  console.log('🔧 Global error listeners initialized for development mode');
  console.log('📊 Log Analyzer initialized for development mode');
  console.log('💡 Available commands:');
  console.log('  - window.analyzeErrors() - Generate error analysis report');
  console.log('  - window.clearLogs() - Clear all logged data');
  console.log('  - window.exportLogs() - Export logs to file');
  console.log('  - window.searchLogs("query") - Search through logs');
  console.log('  - window.logAnalyzer - Access full analyzer instance');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
    <Toaster position="top-right" />
  </ErrorBoundary>
)

console.log('✅ Main.jsx render complete at:', new Date().toISOString())