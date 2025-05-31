/**
 * Log Analysis Utility for CaneFrost POS
 * Monitors and analyzes console logs from server and browser
 * Helps identify patterns and prevent recurring issues
 */

class LogAnalyzer {
  constructor() {
    this.logs = [];
    this.errorPatterns = new Map();
    this.warningPatterns = new Map();
    this.performanceMetrics = [];
    this.isEnabled = process.env.NODE_ENV === 'development';
    
    if (this.isEnabled) {
      this.initializeLogCapture();
      this.setupPeriodicAnalysis();
    }
  }

  initializeLogCapture() {
    // Capture browser console logs
    if (typeof window !== 'undefined') {
      this.captureConsoleAPI();
      this.captureNetworkErrors();
      this.captureReactErrors();
    }
    
    // Capture server logs (for Node.js environment)
    if (typeof process !== 'undefined') {
      this.captureProcessErrors();
    }
  }

  captureConsoleAPI() {
    const originalConsole = { ...console };
    
    ['log', 'warn', 'error', 'info', 'debug'].forEach(method => {
      console[method] = (...args) => {
        this.logEntry({
          type: method,
          message: args.join(' '),
          timestamp: new Date().toISOString(),
          stack: method === 'error' ? new Error().stack : null,
          source: 'browser-console'
        });
        
        originalConsole[method](...args);
      };
    });
  }

  captureNetworkErrors() {
    if (typeof window !== 'undefined') {
      // Capture fetch errors
      const originalFetch = window.fetch;
      window.fetch = async (...args) => {
        try {
          const response = await originalFetch(...args);
          if (!response.ok) {
            this.logEntry({
              type: 'network-error',
              message: `HTTP ${response.status}: ${response.statusText}`,
              url: args[0],
              timestamp: new Date().toISOString(),
              source: 'network'
            });
          }
          return response;
        } catch (error) {
          this.logEntry({
            type: 'network-error',
            message: error.message,
            url: args[0],
            timestamp: new Date().toISOString(),
            stack: error.stack,
            source: 'network'
          });
          throw error;
        }
      };

      // Capture unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        this.logEntry({
          type: 'unhandled-promise',
          message: event.reason?.message || 'Unhandled Promise Rejection',
          timestamp: new Date().toISOString(),
          stack: event.reason?.stack,
          source: 'promise'
        });
      });

      // Capture global errors
      window.addEventListener('error', (event) => {
        this.logEntry({
          type: 'global-error',
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          timestamp: new Date().toISOString(),
          stack: event.error?.stack,
          source: 'global'
        });
      });
    }
  }

  captureReactErrors() {
    // This will be used with React Error Boundary
    window.logAnalyzer = this;
  }

  captureProcessErrors() {
    // Only capture process errors in Node.js environment
    if (typeof process !== 'undefined' && process.on && typeof process.on === 'function') {
      process.on('uncaughtException', (error) => {
        this.logEntry({
          type: 'uncaught-exception',
          message: error.message,
          timestamp: new Date().toISOString(),
          stack: error.stack,
          source: 'server'
        });
      });

      process.on('unhandledRejection', (reason, promise) => {
        this.logEntry({
          type: 'unhandled-rejection',
          message: reason?.message || 'Unhandled Rejection',
          timestamp: new Date().toISOString(),
          stack: reason?.stack,
          source: 'server'
        });
      });
    }
    // In browser environment, these are handled by window error handlers
  }

  logEntry(entry) {
    this.logs.push(entry);
    this.analyzePattern(entry);
    
    // Keep only last 1000 logs to prevent memory issues
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
    }

    // Auto-analyze critical errors immediately
    if (entry.type === 'error' || entry.type.includes('error')) {
      this.analyzeCriticalError(entry);
    }
  }

  analyzePattern(entry) {
    const key = this.extractPatternKey(entry);
    
    if (entry.type === 'error' || entry.type.includes('error')) {
      const count = this.errorPatterns.get(key) || 0;
      this.errorPatterns.set(key, count + 1);
    } else if (entry.type === 'warn') {
      const count = this.warningPatterns.get(key) || 0;
      this.warningPatterns.set(key, count + 1);
    }
  }

  extractPatternKey(entry) {
    // Extract meaningful pattern from error message
    let pattern = entry.message;
    
    // Common React error patterns
    pattern = pattern.replace(/line \d+/g, 'line X');
    pattern = pattern.replace(/column \d+/g, 'column X');
    pattern = pattern.replace(/\d+/g, 'N');
    pattern = pattern.replace(/"[^"]*"/g, '"STRING"');
    pattern = pattern.replace(/'[^']*'/g, "'STRING'");
    
    return pattern;
  }

  analyzeCriticalError(entry) {
    const insights = [];
    
    // JSX Structure errors
    if (entry.message.includes('Expected corresponding JSX closing tag')) {
      insights.push({
        type: 'jsx-structure',
        message: 'JSX structure error detected',
        suggestion: 'Check for missing closing tags or mismatched opening/closing tags',
        prevention: 'Use proper JSX formatting and consider using a linter'
      });
    }
    
    // Import/Export errors
    if (entry.message.includes('Cannot resolve module') || entry.message.includes('Module not found')) {
      insights.push({
        type: 'module-resolution',
        message: 'Module resolution error',
        suggestion: 'Check import paths and ensure files exist',
        prevention: 'Use absolute imports and verify file extensions'
      });
    }
    
    // State management errors
    if (entry.message.includes('Cannot read property') && entry.message.includes('undefined')) {
      insights.push({
        type: 'undefined-property',
        message: 'Accessing property of undefined object',
        suggestion: 'Add null checks or default values',
        prevention: 'Use optional chaining (?.) and nullish coalescing (???)'
      });
    }
    
    // Hook errors
    if (entry.message.includes('Invalid hook call')) {
      insights.push({
        type: 'hook-violation',
        message: 'React Hook rules violation',
        suggestion: 'Ensure hooks are called at the top level of components',
        prevention: 'Follow React Hook rules and use ESLint plugin for hooks'
      });
    }

    if (insights.length > 0) {
      console.group('🔍 Log Analyzer - Critical Error Detected');
      console.error('Original Error:', entry);
      insights.forEach(insight => {
        console.log(`\n📋 ${insight.type.toUpperCase()}:`);
        console.log(`💡 Suggestion: ${insight.suggestion}`);
        console.log(`🛡️ Prevention: ${insight.prevention}`);
      });
      console.groupEnd();
    }
  }

  setupPeriodicAnalysis() {
    // Run analysis every 30 seconds
    setInterval(() => {
      this.generateReport();
    }, 30000);
  }

  generateReport() {
    if (this.logs.length === 0) return;

    const report = {
      timestamp: new Date().toISOString(),
      totalLogs: this.logs.length,
      errorCount: this.logs.filter(log => log.type === 'error' || log.type.includes('error')).length,
      warningCount: this.logs.filter(log => log.type === 'warn').length,
      topErrors: this.getTopPatterns(this.errorPatterns, 5),
      topWarnings: this.getTopPatterns(this.warningPatterns, 5),
      recentCritical: this.logs
        .filter(log => log.type === 'error' || log.type.includes('error'))
        .slice(-3),
      insights: this.generateInsights()
    };

    // Only log if there are errors or warnings
    if (report.errorCount > 0 || report.warningCount > 0) {
      console.group('📊 Log Analysis Report');
      console.table({
        'Total Logs': report.totalLogs,
        'Errors': report.errorCount,
        'Warnings': report.warningCount
      });
      
      if (report.topErrors.length > 0) {
        console.log('\n🔴 Top Error Patterns:');
        report.topErrors.forEach((error, index) => {
          console.log(`${index + 1}. ${error.pattern} (${error.count} times)`);
        });
      }
      
      if (report.insights.length > 0) {
        console.log('\n💡 Insights & Recommendations:');
        report.insights.forEach(insight => {
          console.log(`• ${insight}`);
        });
      }
      
      console.groupEnd();
    }

    return report;
  }

  getTopPatterns(patternMap, limit = 5) {
    return Array.from(patternMap.entries())
      .map(([pattern, count]) => ({ pattern, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  generateInsights() {
    const insights = [];
    
    // Check for recurring patterns
    const topErrors = this.getTopPatterns(this.errorPatterns, 3);
    topErrors.forEach(error => {
      if (error.count > 3) {
        insights.push(`Recurring error pattern detected: "${error.pattern}" (${error.count} times)`);
      }
    });
    
    // Check error frequency
    const recentErrors = this.logs
      .filter(log => log.type === 'error' || log.type.includes('error'))
      .filter(log => new Date() - new Date(log.timestamp) < 60000); // Last minute
    
    if (recentErrors.length > 5) {
      insights.push('High error frequency detected in the last minute. Consider investigating.');
    }
    
    // Check for specific error types
    const jsxErrors = this.logs.filter(log => 
      log.message.includes('JSX') || log.message.includes('closing tag')
    );
    
    if (jsxErrors.length > 0) {
      insights.push('JSX structure issues detected. Review component structure and closing tags.');
    }
    
    return insights;
  }

  // Manual analysis methods
  getErrorsByType() {
    const errorTypes = {};
    this.logs
      .filter(log => log.type === 'error' || log.type.includes('error'))
      .forEach(log => {
        const type = log.source || 'unknown';
        errorTypes[type] = (errorTypes[type] || 0) + 1;
      });
    return errorTypes;
  }

  getErrorsByTimeframe(minutes = 60) {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    return this.logs.filter(log => 
      new Date(log.timestamp) > cutoff && 
      (log.type === 'error' || log.type.includes('error'))
    );
  }

  searchLogs(query) {
    return this.logs.filter(log => 
      log.message.toLowerCase().includes(query.toLowerCase())
    );
  }

  clearLogs() {
    this.logs = [];
    this.errorPatterns.clear();
    this.warningPatterns.clear();
    console.log('📝 Log analyzer cleared');
  }

  exportLogs() {
    const data = {
      logs: this.logs,
      errorPatterns: Object.fromEntries(this.errorPatterns),
      warningPatterns: Object.fromEntries(this.warningPatterns),
      exportedAt: new Date().toISOString()
    };
    
    if (typeof window !== 'undefined') {
      // Browser environment - download as file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `log-analysis-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // Node.js environment
      console.log('📄 Log data:', JSON.stringify(data, null, 2));
    }
    
    return data;
  }
}

// Create global instance
const logAnalyzer = new LogAnalyzer();

// Expose methods for manual use
if (typeof window !== 'undefined') {
  window.logAnalyzer = logAnalyzer;
  
  // Add helpful console commands
  window.analyzeErrors = () => logAnalyzer.generateReport();
  window.clearLogs = () => logAnalyzer.clearLogs();
  window.exportLogs = () => logAnalyzer.exportLogs();
  window.searchLogs = (query) => logAnalyzer.searchLogs(query);
}

export default logAnalyzer;

// Helper functions for common debugging scenarios
export const debugHelpers = {
  // Check for common React issues
  checkReactIssues: () => {
    const reactErrors = logAnalyzer.logs.filter(log => 
      log.message.includes('React') || 
      log.message.includes('Hook') ||
      log.message.includes('JSX')
    );
    
    console.group('⚛️ React Issues Analysis');
    if (reactErrors.length === 0) {
      console.log('✅ No React-specific issues found');
    } else {
      console.log(`Found ${reactErrors.length} React-related issues:`);
      reactErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.message}`);
      });
    }
    console.groupEnd();
    
    return reactErrors;
  },
  
  // Check for performance issues
  checkPerformance: () => {
    const slowOperations = logAnalyzer.logs.filter(log => 
      log.message.includes('slow') || 
      log.message.includes('timeout') ||
      log.message.includes('performance')
    );
    
    console.group('⚡ Performance Issues');
    if (slowOperations.length === 0) {
      console.log('✅ No performance issues detected');
    } else {
      console.log(`Found ${slowOperations.length} performance-related issues:`);
      slowOperations.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.message}`);
      });
    }
    console.groupEnd();
    
    return slowOperations;
  },
  
  // Get debugging suggestions
  getSuggestions: () => {
    const suggestions = [];
    const errorTypes = logAnalyzer.getErrorsByType();
    
    Object.entries(errorTypes).forEach(([type, count]) => {
      if (count > 3) {
        suggestions.push(`Consider investigating ${type} errors (${count} occurrences)`);
      }
    });
    
    if (suggestions.length === 0) {
      suggestions.push('No specific suggestions at this time. Keep monitoring!');
    }
    
    console.group('💡 Debugging Suggestions');
    suggestions.forEach((suggestion, index) => {
      console.log(`${index + 1}. ${suggestion}`);
    });
    console.groupEnd();
    
    return suggestions;
  }
};