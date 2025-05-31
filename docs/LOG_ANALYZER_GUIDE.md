# Log Analyzer System - Developer Guide

## Overview

The Log Analyzer System is a comprehensive debugging and monitoring solution for the CaneFrost POS application. It automatically captures, analyzes, and provides insights about console logs, errors, and application behavior to help developers identify and fix issues quickly.

## Features

### 🔍 Automatic Log Capture
- **Browser Console Logs**: Captures all console.log, console.warn, console.error, etc.
- **Network Errors**: Monitors fetch requests and network failures
- **React Errors**: Integrates with Error Boundaries to catch React-specific issues
- **Global Errors**: Captures unhandled exceptions and promise rejections
- **Server Logs**: Monitors Node.js process errors (when applicable)

### 📊 Intelligent Analysis
- **Pattern Recognition**: Identifies recurring error patterns
- **Error Categorization**: Groups similar errors together
- **Performance Monitoring**: Tracks slow operations and timeouts
- **Real-time Insights**: Provides immediate feedback on critical errors

### 🛠️ Developer Tools
- **Visual Dashboard**: In-app panel for monitoring logs during development
- **Console Commands**: Quick access functions for debugging
- **Export Functionality**: Save logs for later analysis
- **Search & Filter**: Find specific logs quickly

## Quick Start

### 1. System is Auto-Enabled
The log analyzer is automatically initialized when you start the development server. No additional setup required!

### 2. Access the Dev Panel
In development mode, you'll see a "Dev Tools" button in the bottom-right corner of the screen. Click it to open the log analyzer panel.

### 3. Use Console Commands
Open your browser's developer console and use these commands:

```javascript
// Generate a comprehensive error analysis report
window.analyzeErrors()

// Search through all logged messages
window.searchLogs("JSX")

// Export all logs to a downloadable file
window.exportLogs()

// Clear all stored logs
window.clearLogs()

// Access the full analyzer instance
window.logAnalyzer
```

## Understanding the Dashboard

### Log Panel
- **Real-time Updates**: Shows the latest 50 logs with auto-refresh
- **Color Coding**: 
  - 🔴 Red: Errors and critical issues
  - 🟡 Yellow: Warnings
  - 🔵 Blue: Info messages
  - 🟢 Green: Success/normal logs
- **Search**: Filter logs by keywords
- **Source Tracking**: Shows where each log originated

### Analysis Panel
- **Summary Statistics**: Total logs, error count, warning count
- **Top Error Patterns**: Most frequent error types
- **Insights**: AI-generated suggestions for fixing issues
- **Recent Critical**: Latest critical errors that need attention

### Tools Panel
- **React Issues Check**: Scans for React-specific problems
- **Performance Check**: Identifies performance bottlenecks
- **Get Suggestions**: Provides debugging recommendations
- **Export/Clear**: Manage log data

## Common Error Patterns & Solutions

### JSX Structure Errors
**Pattern**: `Expected corresponding JSX closing tag`

**Common Causes**:
- Missing closing tags: `<div>` without `</div>`
- Mismatched tags: `<div>` closed with `</span>`
- Incorrect nesting: Tags not properly nested

**Solutions**:
```jsx
// ❌ Wrong
<div>
  <span>Content
</div>

// ✅ Correct
<div>
  <span>Content</span>
</div>
```

### Module Resolution Errors
**Pattern**: `Cannot resolve module` or `Module not found`

**Common Causes**:
- Incorrect import paths
- Missing file extensions
- Case sensitivity issues

**Solutions**:
```javascript
// ❌ Wrong
import Component from './component'  // missing .jsx
import Utils from '../Utils/utils'   // wrong case

// ✅ Correct
import Component from './Component.jsx'
import utils from '../utils/utils.js'
```

### Undefined Property Access
**Pattern**: `Cannot read property 'X' of undefined`

**Common Causes**:
- Accessing properties before data is loaded
- Missing null checks
- Incorrect state initialization

**Solutions**:
```javascript
// ❌ Wrong
const name = user.profile.name

// ✅ Correct
const name = user?.profile?.name ?? 'Unknown'
// or
const name = user && user.profile && user.profile.name
```

### React Hook Violations
**Pattern**: `Invalid hook call`

**Common Causes**:
- Calling hooks inside loops, conditions, or nested functions
- Calling hooks from regular JavaScript functions

**Solutions**:
```javascript
// ❌ Wrong
function MyComponent() {
  if (condition) {
    const [state, setState] = useState()
  }
}

// ✅ Correct
function MyComponent() {
  const [state, setState] = useState()
  
  if (condition) {
    // Use state here
  }
}
```

## Advanced Usage

### Custom Error Reporting
Use the `useErrorReporting` hook in functional components:

```javascript
import { useErrorReporting } from '../components/ErrorBoundary'

function MyComponent() {
  const { reportError } = useErrorReporting()
  
  const handleSomething = async () => {
    try {
      await riskyOperation()
    } catch (error) {
      reportError(error, { context: 'handleSomething', userId: user.id })
    }
  }
}
```

### Programmatic Log Analysis
```javascript
// Get errors by type
const errorsByType = window.logAnalyzer.getErrorsByType()
console.log('Network errors:', errorsByType.network)

// Get recent errors (last hour)
const recentErrors = window.logAnalyzer.getErrorsByTimeframe(60)

// Search for specific patterns
const jsxErrors = window.logAnalyzer.searchLogs('JSX')
```

### Export and Share Logs
```javascript
// Export logs for bug reports
const logData = window.logAnalyzer.exportLogs()

// The exported file contains:
// - All captured logs with timestamps
// - Error patterns and frequencies
// - Analysis insights
// - System information
```

## Best Practices

### 1. Monitor Regularly
- Check the dev panel periodically during development
- Pay attention to the error count badge
- Address warnings before they become errors

### 2. Use Pattern Analysis
- Look for recurring error patterns
- Fix the root cause, not just symptoms
- Use insights to prevent similar issues

### 3. Export Before Major Changes
- Save logs before refactoring
- Compare error patterns before/after changes
- Use exported data for debugging sessions

### 4. Leverage Console Commands
- Use `window.analyzeErrors()` for quick health checks
- Search logs with `window.searchLogs()` to find specific issues
- Clear logs with `window.clearLogs()` for fresh starts

## Troubleshooting

### Log Analyzer Not Working
1. Check if you're in development mode (`NODE_ENV=development`)
2. Verify the console shows "Log Analyzer initialized"
3. Check browser console for any initialization errors

### Dev Panel Not Appearing
1. Ensure you're in development mode
2. Check if the "Dev Tools" button is in the bottom-right corner
3. Try refreshing the page

### Missing Logs
1. Check if auto-refresh is enabled in the panel
2. Try manually refreshing with the refresh button
3. Verify the search filter isn't hiding logs

### Performance Issues
1. Clear logs if you have too many accumulated
2. Disable auto-refresh if not needed
3. The system automatically limits to 1000 logs to prevent memory issues

## Integration with CI/CD

For production monitoring, consider:

1. **Error Reporting Services**: Integrate with Sentry, Bugsnag, or similar
2. **Log Aggregation**: Send logs to ELK stack, Splunk, or CloudWatch
3. **Automated Testing**: Use log patterns to detect regressions

```javascript
// Example: Send critical errors to external service
if (process.env.NODE_ENV === 'production') {
  logAnalyzer.onCriticalError = (error) => {
    // Send to error reporting service
    errorReportingService.captureException(error)
  }
}
```

## Contributing

To extend the log analyzer:

1. **Add New Error Patterns**: Update `extractPatternKey()` in `logAnalyzer.js`
2. **Custom Insights**: Extend `generateInsights()` method
3. **New Log Sources**: Add capture methods in `initializeLogCapture()`
4. **UI Improvements**: Enhance `LogAnalyzerPanel.jsx`

## Support

If you encounter issues or have suggestions:

1. Check this guide first
2. Search existing logs for similar patterns
3. Export logs and share with the development team
4. Create detailed bug reports with log data

---

**Remember**: The log analyzer is your debugging companion. Use it actively during development to catch issues early and understand your application's behavior better!