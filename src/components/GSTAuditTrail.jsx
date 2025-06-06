import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import gstAuditService from '../services/gstAuditService';
import {
  Shield,
  Eye,
  Download,
  Search,
  Filter,
  Calendar,
  User,
  FileText,
  Edit,
  Trash2,
  Plus,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  Database,
  Settings
} from 'lucide-react';
import { format, startOfDay, endOfDay, subDays, subWeeks, subMonths } from 'date-fns';

const GSTAuditTrail = () => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [dateRange, setDateRange] = useState('7days');
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState('csv');
  const [exportDateRange, setExportDateRange] = useState({ from: '', to: '' });

  const actionTypes = [
    { value: 'all', label: 'All Actions' },
    { value: 'CREATE', label: 'Create' },
    { value: 'UPDATE', label: 'Update' },
    { value: 'DELETE', label: 'Delete' },
    { value: 'VIEW', label: 'View' },
    { value: 'EXPORT', label: 'Export' },
    { value: 'IMPORT', label: 'Import' },
    { value: 'GENERATE', label: 'Generate' },
    { value: 'FILE', label: 'File' },
    { value: 'RECONCILE', label: 'Reconcile' }
  ];

  const dateRanges = [
    { value: '1day', label: 'Last 24 Hours' },
    { value: '7days', label: 'Last 7 Days' },
    { value: '30days', label: 'Last 30 Days' },
    { value: '90days', label: 'Last 90 Days' },
    { value: 'custom', label: 'Custom Range' }
  ];

  const entityTypes = {
    'SALE': { icon: FileText, color: 'text-green-500' },
    'PURCHASE': { icon: FileText, color: 'text-blue-500' },
    'GSTR_FILING': { icon: FileText, color: 'text-purple-500' },
    'EWAY_BILL': { icon: FileText, color: 'text-orange-500' },
    'HSN_CODE': { icon: Database, color: 'text-cyan-500' },
    'TAX_RATE': { icon: Settings, color: 'text-gray-500' },
    'BUSINESS_CONFIG': { icon: Settings, color: 'text-indigo-500' },
    'USER': { icon: User, color: 'text-pink-500' }
  };

  useEffect(() => {
    loadAuditLogs();
  }, [dateRange, actionFilter, userFilter]);

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const filters = {
        dateRange: getDateRangeFilter(),
        action: actionFilter !== 'all' ? actionFilter : undefined,
        user: userFilter !== 'all' ? userFilter : undefined
      };
      
      const logs = await gstAuditService.getAuditTrail(filters);
      setAuditLogs(logs || []);
    } catch (error) {
      toast.error('Failed to load audit logs');
      console.error('Error loading audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDateRangeFilter = () => {
    const now = new Date();
    switch (dateRange) {
      case '1day':
        return { from: subDays(now, 1), to: now };
      case '7days':
        return { from: subDays(now, 7), to: now };
      case '30days':
        return { from: subDays(now, 30), to: now };
      case '90days':
        return { from: subDays(now, 90), to: now };
      default:
        return { from: subDays(now, 7), to: now };
    }
  };

  const getActionBadge = (action) => {
    const actionConfig = {
      'CREATE': { variant: 'default', color: 'text-green-500' },
      'UPDATE': { variant: 'secondary', color: 'text-blue-500' },
      'DELETE': { variant: 'destructive', color: 'text-red-500' },
      'VIEW': { variant: 'outline', color: 'text-gray-500' },
      'EXPORT': { variant: 'secondary', color: 'text-purple-500' },
      'IMPORT': { variant: 'secondary', color: 'text-orange-500' },
      'GENERATE': { variant: 'default', color: 'text-cyan-500' },
      'FILE': { variant: 'default', color: 'text-indigo-500' },
      'RECONCILE': { variant: 'secondary', color: 'text-pink-500' }
    };
    
    const config = actionConfig[action] || { variant: 'outline', color: 'text-gray-500' };
    
    return (
      <Badge variant={config.variant}>
        {action}
      </Badge>
    );
  };

  const getEntityIcon = (entityType) => {
    const config = entityTypes[entityType] || { icon: FileText, color: 'text-gray-500' };
    const Icon = config.icon;
    return <Icon className={`h-4 w-4 ${config.color}`} />;
  };

  const exportAuditLogs = async () => {
    if (!exportDateRange.from || !exportDateRange.to) {
      toast.error('Please select date range for export');
      return;
    }

    setLoading(true);
    try {
      const filters = {
        dateRange: {
          from: new Date(exportDateRange.from),
          to: new Date(exportDateRange.to)
        },
        action: actionFilter !== 'all' ? actionFilter : undefined,
        user: userFilter !== 'all' ? userFilter : undefined
      };
      
      const result = await gstAuditService.exportAuditTrail(filters, exportFormat);
      
      // Create download link
      const blob = new Blob([result.data], { type: result.mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Audit trail exported successfully');
      setShowExportDialog(false);
    } catch (error) {
      toast.error('Failed to export audit trail');
      console.error('Error exporting audit trail:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = 
      log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entityType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entityId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const getUniqueUsers = () => {
    const users = [...new Set(auditLogs.map(log => log.userName).filter(Boolean))];
    return users.map(user => ({ value: user, label: user }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            GST Audit Trail
          </h2>
          <p className="text-muted-foreground">Track all GST-related activities and changes</p>
        </div>
        
        <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Export Audit Trail</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fromDate">From Date</Label>
                  <Input
                    id="fromDate"
                    type="date"
                    value={exportDateRange.from}
                    onChange={(e) => setExportDateRange(prev => ({ ...prev, from: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="toDate">To Date</Label>
                  <Input
                    id="toDate"
                    type="date"
                    value={exportDateRange.to}
                    onChange={(e) => setExportDateRange(prev => ({ ...prev, to: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="format">Export Format</Label>
                <Select value={exportFormat} onValueChange={setExportFormat}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowExportDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={exportAuditLogs} disabled={loading}>
                  Export
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                {dateRanges.map(range => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                {actionTypes.map(action => (
                  <SelectItem key={action.value} value={action.value}>
                    {action.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by user" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {getUniqueUsers().map(user => (
                  <SelectItem key={user.value} value={user.value}>
                    {user.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button onClick={loadAuditLogs} disabled={loading}>
              <Filter className="h-4 w-4 mr-2" />
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{filteredLogs.length}</div>
                <p className="text-xs text-muted-foreground">Total Activities</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  {filteredLogs.filter(log => log.action === 'CREATE').length}
                </div>
                <p className="text-xs text-muted-foreground">Create Actions</p>
              </div>
              <Plus className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  {filteredLogs.filter(log => log.action === 'UPDATE').length}
                </div>
                <p className="text-xs text-muted-foreground">Update Actions</p>
              </div>
              <Edit className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  {filteredLogs.filter(log => log.action === 'DELETE').length}
                </div>
                <p className="text-xs text-muted-foreground">Delete Actions</p>
              </div>
              <Trash2 className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Logs ({filteredLogs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Entity ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {format(new Date(log.timestamp), 'dd/MM/yyyy')}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(log.timestamp), 'HH:mm:ss')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getActionBadge(log.action)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getEntityIcon(log.entityType)}
                        <span>{log.entityType}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{log.entityId}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{log.userName || 'System'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{log.description}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedLog(log);
                          setShowDetailsDialog(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredLogs.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || actionFilter !== 'all' || userFilter !== 'all'
                ? 'No audit logs found matching your criteria.'
                : 'No audit logs available for the selected period.'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
          </DialogHeader>
          
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Timestamp</Label>
                  <p>{format(new Date(selectedLog.timestamp), 'dd/MM/yyyy HH:mm:ss')}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Action</Label>
                  <div className="mt-1">{getActionBadge(selectedLog.action)}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Entity Type</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {getEntityIcon(selectedLog.entityType)}
                    <span>{selectedLog.entityType}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Entity ID</Label>
                  <p className="font-mono text-sm">{selectedLog.entityId}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">User</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedLog.userName || 'System'}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">IP Address</Label>
                  <p className="font-mono text-sm">{selectedLog.ipAddress || 'N/A'}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Description</Label>
                <p className="mt-1">{selectedLog.description}</p>
              </div>
              
              {selectedLog.oldValues && (
                <div>
                  <Label className="text-sm font-medium">Previous Values</Label>
                  <pre className="mt-1 p-3 bg-muted rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.oldValues, null, 2)}
                  </pre>
                </div>
              )}
              
              {selectedLog.newValues && (
                <div>
                  <Label className="text-sm font-medium">New Values</Label>
                  <pre className="mt-1 p-3 bg-muted rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.newValues, null, 2)}
                  </pre>
                </div>
              )}
              
              {selectedLog.metadata && (
                <div>
                  <Label className="text-sm font-medium">Additional Metadata</Label>
                  <pre className="mt-1 p-3 bg-muted rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GSTAuditTrail;