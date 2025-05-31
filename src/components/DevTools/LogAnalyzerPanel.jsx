import React, { useState, useEffect } from 'react';
import logAnalyzer, { debugHelpers } from '../../utils/logAnalyzer';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
// ScrollArea component not available, using div with overflow styling
import { 
  Bug, 
  Download, 
  Trash2, 
  Search, 
  RefreshCw, 
  AlertTriangle, 
  Info,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

/**
 * Development Log Analyzer Panel
 * Provides a UI for monitoring and analyzing application logs
 * Only visible in development mode
 */
const LogAnalyzerPanel = () => {
  const [logs, setLogs] = useState([]);
  const [report, setReport] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  useEffect(() => {
    const updateLogs = () => {
      if (logAnalyzer && logAnalyzer.logs) {
        setLogs([...logAnalyzer.logs]);
      }
    };

    updateLogs();

    let interval;
    if (autoRefresh) {
      interval = setInterval(updateLogs, 2000); // Update every 2 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const generateReport = () => {
    if (logAnalyzer) {
      const newReport = logAnalyzer.generateReport();
      setReport(newReport);
    }
  };

  const clearLogs = () => {
    if (logAnalyzer) {
      logAnalyzer.clearLogs();
      setLogs([]);
      setReport(null);
    }
  };

  const exportLogs = () => {
    if (logAnalyzer) {
      logAnalyzer.exportLogs();
    }
  };

  const searchLogs = (query) => {
    if (logAnalyzer) {
      return logAnalyzer.searchLogs(query);
    }
    return [];
  };

  const getLogIcon = (type) => {
    switch (type) {
      case 'error':
      case 'react-error':
      case 'network-error':
      case 'global-error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warn':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const getLogBadgeColor = (type) => {
    if (type.includes('error')) return 'destructive';
    if (type === 'warn') return 'secondary';
    return 'default';
  };

  const filteredLogs = searchQuery 
    ? searchLogs(searchQuery)
    : logs.slice(-50); // Show last 50 logs

  const errorCount = logs.filter(log => log.type.includes('error')).length;
  const warningCount = logs.filter(log => log.type === 'warn').length;
  const recentErrors = logs.filter(log => 
    log.type.includes('error') && 
    new Date() - new Date(log.timestamp) < 300000 // Last 5 minutes
  ).length;

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsVisible(true)}
          variant="outline"
          size="sm"
          className="bg-white shadow-lg border-2 border-blue-200 hover:border-blue-400"
        >
          <Bug className="h-4 w-4 mr-2" />
          Dev Tools
          {errorCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {errorCount}
            </Badge>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-96">
      <Card className="shadow-xl border-2 border-blue-200">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center">
              <Bug className="h-4 w-4 mr-2" />
              Log Analyzer
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={recentErrors > 0 ? 'destructive' : 'secondary'}>
                {logs.length} logs
              </Badge>
              <Button
                onClick={() => setIsVisible(false)}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
              >
                ×
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1">
              <XCircle className="h-3 w-3 text-red-500" />
              <span>{errorCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-yellow-500" />
              <span>{warningCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-blue-500" />
              <span>{recentErrors} recent</span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-2">
          <Tabs defaultValue="logs" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-8">
              <TabsTrigger value="logs" className="text-xs">Logs</TabsTrigger>
              <TabsTrigger value="analysis" className="text-xs">Analysis</TabsTrigger>
              <TabsTrigger value="tools" className="text-xs">Tools</TabsTrigger>
            </TabsList>
            
            <TabsContent value="logs" className="mt-2">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="h-3 w-3 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search logs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-7 pr-2 py-1 text-xs border rounded"
                    />
                  </div>
                  <Button
                    onClick={() => setAutoRefresh(!autoRefresh)}
                    variant={autoRefresh ? "default" : "outline"}
                    size="sm"
                    className="h-6 px-2"
                  >
                    <RefreshCw className={`h-3 w-3 ${autoRefresh ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
                
                <div className="h-48 overflow-y-auto">
                  <div className="space-y-1">
                    {filteredLogs.length === 0 ? (
                      <div className="text-xs text-gray-500 text-center py-4">
                        No logs found
                      </div>
                    ) : (
                      filteredLogs.map((log, index) => (
                        <div key={index} className="p-2 border rounded text-xs">
                          <div className="flex items-center gap-2 mb-1">
                            {getLogIcon(log.type)}
                            <Badge variant={getLogBadgeColor(log.type)} className="text-xs">
                              {log.type}
                            </Badge>
                            <span className="text-gray-500 text-xs">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <div className="text-gray-700 break-words">
                            {log.message.length > 100 
                              ? `${log.message.substring(0, 100)}...` 
                              : log.message
                            }
                          </div>
                          {log.source && (
                            <div className="text-gray-400 text-xs mt-1">
                              Source: {log.source}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="analysis" className="mt-2">
              <div className="space-y-2">
                <Button
                  onClick={generateReport}
                  variant="outline"
                  size="sm"
                  className="w-full h-8 text-xs"
                >
                  Generate Analysis Report
                </Button>
                
                {report && (
                  <div className="h-48 overflow-y-auto">
                    <div className="space-y-2 text-xs">
                      <div className="p-2 bg-gray-50 rounded">
                        <div className="font-semibold mb-1">Summary</div>
                        <div>Total Logs: {report.totalLogs}</div>
                        <div>Errors: {report.errorCount}</div>
                        <div>Warnings: {report.warningCount}</div>
                      </div>
                      
                      {report.topErrors.length > 0 && (
                        <div className="p-2 bg-red-50 rounded">
                          <div className="font-semibold mb-1">Top Error Patterns</div>
                          {report.topErrors.map((error, index) => (
                            <div key={index} className="text-xs">
                              {index + 1}. {error.pattern} ({error.count}x)
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {report.insights.length > 0 && (
                        <div className="p-2 bg-blue-50 rounded">
                          <div className="font-semibold mb-1">Insights</div>
                          {report.insights.map((insight, index) => (
                            <div key={index} className="text-xs mb-1">
                              • {insight}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="tools" className="mt-2">
              <div className="space-y-2">
                <Button
                  onClick={() => debugHelpers.checkReactIssues()}
                  variant="outline"
                  size="sm"
                  className="w-full h-8 text-xs"
                >
                  Check React Issues
                </Button>
                
                <Button
                  onClick={() => debugHelpers.checkPerformance()}
                  variant="outline"
                  size="sm"
                  className="w-full h-8 text-xs"
                >
                  Check Performance
                </Button>
                
                <Button
                  onClick={() => debugHelpers.getSuggestions()}
                  variant="outline"
                  size="sm"
                  className="w-full h-8 text-xs"
                >
                  Get Suggestions
                </Button>
                
                <div className="flex gap-1">
                  <Button
                    onClick={exportLogs}
                    variant="outline"
                    size="sm"
                    className="flex-1 h-8 text-xs"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Export
                  </Button>
                  
                  <Button
                    onClick={clearLogs}
                    variant="outline"
                    size="sm"
                    className="flex-1 h-8 text-xs"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                </div>
                
                <div className="p-2 bg-gray-50 rounded text-xs">
                  <div className="font-semibold mb-1">Console Commands:</div>
                  <div>• window.analyzeErrors()</div>
                  <div>• window.searchLogs("query")</div>
                  <div>• window.exportLogs()</div>
                  <div>• window.clearLogs()</div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default LogAnalyzerPanel;