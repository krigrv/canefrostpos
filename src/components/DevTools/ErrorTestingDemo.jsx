import React, { useState } from 'react';
import { useErrorReporting } from '../ErrorBoundary';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Bug, 
  AlertTriangle, 
  Network, 
  Code, 
  Zap,
  RefreshCw
} from 'lucide-react';

/**
 * Error Testing Demo Component
 * Intentionally triggers different types of errors to test the log analyzer
 * Only available in development mode
 */
const ErrorTestingDemo = () => {
  const [testResults, setTestResults] = useState([]);
  const { reportError } = useErrorReporting();

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const addTestResult = (test, success, message) => {
    const result = {
      id: Date.now(),
      test,
      success,
      message,
      timestamp: new Date().toLocaleTimeString()
    };
    setTestResults(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 results
  };

  // Test 1: Console Error
  const testConsoleError = () => {
    try {
      console.error('🧪 Test Console Error: This is a simulated error for testing');
      addTestResult('Console Error', true, 'Error logged to console');
    } catch (error) {
      addTestResult('Console Error', false, error.message);
    }
  };

  // Test 2: Console Warning
  const testConsoleWarning = () => {
    try {
      console.warn('🧪 Test Console Warning: This is a simulated warning for testing');
      addTestResult('Console Warning', true, 'Warning logged to console');
    } catch (error) {
      addTestResult('Console Warning', false, error.message);
    }
  };

  // Test 3: Network Error
  const testNetworkError = async () => {
    try {
      await fetch('https://nonexistent-api-endpoint-for-testing.invalid/data');
      addTestResult('Network Error', false, 'Expected network error did not occur');
    } catch (error) {
      addTestResult('Network Error', true, 'Network error captured: ' + error.message);
    }
  };

  // Test 4: Undefined Property Access
  const testUndefinedAccess = () => {
    try {
      const obj = undefined;
      const value = obj.someProperty; // This will throw an error
      addTestResult('Undefined Access', false, 'Expected error did not occur');
    } catch (error) {
      console.error('🧪 Test Undefined Access Error:', error);
      addTestResult('Undefined Access', true, 'Undefined access error captured');
    }
  };

  // Test 5: Manual Error Report
  const testManualErrorReport = () => {
    try {
      const simulatedError = new Error('🧪 Test Manual Error Report: Simulated business logic error');
      reportError(simulatedError, { 
        context: 'ErrorTestingDemo',
        testType: 'manual-report',
        additionalData: { userId: 'test-user', action: 'test-action' }
      });
      addTestResult('Manual Report', true, 'Manual error report sent');
    } catch (error) {
      addTestResult('Manual Report', false, error.message);
    }
  };

  // Test 6: Promise Rejection
  const testPromiseRejection = () => {
    try {
      // Create an unhandled promise rejection
      Promise.reject(new Error('🧪 Test Promise Rejection: Simulated async error'));
      addTestResult('Promise Rejection', true, 'Unhandled promise rejection created');
    } catch (error) {
      addTestResult('Promise Rejection', false, error.message);
    }
  };

  // Test 7: Performance Warning
  const testPerformanceIssue = () => {
    try {
      console.warn('🧪 Test Performance Warning: Slow operation detected (simulated)');
      console.log('🧪 Performance test: Operation took 5000ms (simulated)');
      addTestResult('Performance Issue', true, 'Performance warning logged');
    } catch (error) {
      addTestResult('Performance Issue', false, error.message);
    }
  };

  // Test 8: Multiple Rapid Errors
  const testRapidErrors = () => {
    try {
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          console.error(`🧪 Rapid Error Test ${i + 1}: Simulated rapid error sequence`);
        }, i * 100);
      }
      addTestResult('Rapid Errors', true, '5 rapid errors scheduled');
    } catch (error) {
      addTestResult('Rapid Errors', false, error.message);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const runAllTests = async () => {
    const tests = [
      testConsoleError,
      testConsoleWarning,
      testUndefinedAccess,
      testManualErrorReport,
      testPromiseRejection,
      testPerformanceIssue
    ];

    for (let i = 0; i < tests.length; i++) {
      setTimeout(() => {
        tests[i]();
      }, i * 500); // Stagger tests by 500ms
    }

    // Network test last (it's async)
    setTimeout(() => {
      testNetworkError();
    }, tests.length * 500);

    addTestResult('All Tests', true, `Running ${tests.length + 1} tests...`);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5" />
          Log Analyzer Testing Demo
        </CardTitle>
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This component intentionally triggers errors to test the log analyzer system.
            Only available in development mode.
          </AlertDescription>
        </Alert>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <Button
            onClick={testConsoleError}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <AlertTriangle className="h-4 w-4" />
            Console Error
          </Button>
          
          <Button
            onClick={testConsoleWarning}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <AlertTriangle className="h-4 w-4" />
            Console Warning
          </Button>
          
          <Button
            onClick={testNetworkError}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Network className="h-4 w-4" />
            Network Error
          </Button>
          
          <Button
            onClick={testUndefinedAccess}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Code className="h-4 w-4" />
            Undefined Access
          </Button>
          
          <Button
            onClick={testManualErrorReport}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Bug className="h-4 w-4" />
            Manual Report
          </Button>
          
          <Button
            onClick={testPromiseRejection}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Zap className="h-4 w-4" />
            Promise Reject
          </Button>
          
          <Button
            onClick={testPerformanceIssue}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Zap className="h-4 w-4" />
            Performance
          </Button>
          
          <Button
            onClick={testRapidErrors}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Rapid Errors
          </Button>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={runAllTests}
            className="flex-1"
          >
            Run All Tests
          </Button>
          
          <Button
            onClick={clearResults}
            variant="outline"
          >
            Clear Results
          </Button>
        </div>
        
        {testResults.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold">Test Results:</h3>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {testResults.map((result) => (
                <div
                  key={result.id}
                  className={`p-2 rounded text-sm border ${
                    result.success 
                      ? 'bg-green-50 border-green-200 text-green-800'
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{result.test}</span>
                    <span className="text-xs">{result.timestamp}</span>
                  </div>
                  <div className="text-xs mt-1">{result.message}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>How to test:</strong>
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>Open the Log Analyzer panel (Dev Tools button)</li>
              <li>Click any test button above</li>
              <li>Check the Logs tab to see captured errors</li>
              <li>Use the Analysis tab to see patterns</li>
              <li>Try console commands like <code>window.analyzeErrors()</code></li>
            </ol>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default ErrorTestingDemo;