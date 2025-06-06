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
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { toast } from 'sonner';
import gstAuditService from '../services/gstAuditService';
import {
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  X,
  Eye,
  Download,
  Upload,
  Calendar,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  FileText,
  Search,
  Filter
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

const GSTReconciliation = () => {
  const [reconciliationData, setReconciliationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [discrepancies, setDiscrepancies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedDiscrepancy, setSelectedDiscrepancy] = useState(null);
  const [reconciliationProgress, setReconciliationProgress] = useState(0);
  const [isReconciling, setIsReconciling] = useState(false);

  const getMonthOptions = () => {
    const options = [];
    for (let i = 0; i < 12; i++) {
      const date = subMonths(new Date(), i);
      const value = format(date, 'yyyy-MM');
      const label = format(date, 'MMMM yyyy');
      options.push({ value, label });
    }
    return options;
  };

  const discrepancyTypes = [
    { value: 'all', label: 'All Discrepancies' },
    { value: 'missing_in_books', label: 'Missing in Books' },
    { value: 'missing_in_gstr2a', label: 'Missing in GSTR-2A' },
    { value: 'amount_mismatch', label: 'Amount Mismatch' },
    { value: 'tax_mismatch', label: 'Tax Mismatch' },
    { value: 'date_mismatch', label: 'Date Mismatch' }
  ];

  useEffect(() => {
    // Set default period to current month
    setSelectedPeriod(format(new Date(), 'yyyy-MM'));
  }, []);

  const performReconciliation = async (period) => {
    if (!period) {
      toast.error('Please select a period');
      return;
    }

    setIsReconciling(true);
    setReconciliationProgress(0);
    setLoading(true);

    try {
      setReconciliationProgress(20);
      toast.info('Starting reconciliation process...');
      
      // Fetch books data
      setReconciliationProgress(40);
      
      // Fetch GSTR-2A data
      setReconciliationProgress(60);
      
      // Perform reconciliation
      const result = await gstAuditService.performGSTReconciliation(period);
      setReconciliationProgress(80);
      
      setReconciliationData(result);
      setDiscrepancies(result.discrepancies || []);
      setReconciliationProgress(100);
      
      toast.success(`Reconciliation completed. Found ${result.discrepancies?.length || 0} discrepancies.`);
    } catch (error) {
      toast.error('Failed to perform reconciliation');
      console.error('Error performing reconciliation:', error);
    } finally {
      setLoading(false);
      setIsReconciling(false);
      setTimeout(() => setReconciliationProgress(0), 2000);
    }
  };

  const getDiscrepancyBadge = (type) => {
    const typeConfig = {
      'missing_in_books': { variant: 'destructive', color: 'text-red-500' },
      'missing_in_gstr2a': { variant: 'secondary', color: 'text-yellow-500' },
      'amount_mismatch': { variant: 'destructive', color: 'text-orange-500' },
      'tax_mismatch': { variant: 'destructive', color: 'text-purple-500' },
      'date_mismatch': { variant: 'secondary', color: 'text-blue-500' }
    };
    
    const config = typeConfig[type] || { variant: 'secondary', color: 'text-gray-500' };
    
    return (
      <Badge variant={config.variant}>
        {type.replace(/_/g, ' ').toUpperCase()}
      </Badge>
    );
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <AlertTriangle className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const filteredDiscrepancies = discrepancies.filter(discrepancy => {
    const matchesSearch = 
      discrepancy.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      discrepancy.supplierName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      discrepancy.gstin?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || discrepancy.type === filterType;
    
    return matchesSearch && matchesFilter;
  });

  const calculateImpact = () => {
    if (!reconciliationData) return { totalImpact: 0, taxImpact: 0, itcImpact: 0 };
    
    const totalImpact = discrepancies.reduce((sum, d) => sum + (d.amountDifference || 0), 0);
    const taxImpact = discrepancies.reduce((sum, d) => sum + (d.taxDifference || 0), 0);
    const itcImpact = discrepancies.reduce((sum, d) => sum + (d.itcImpact || 0), 0);
    
    return { totalImpact, taxImpact, itcImpact };
  };

  const impact = calculateImpact();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <RefreshCw className="h-6 w-6" />
            GST Reconciliation
          </h2>
          <p className="text-muted-foreground">Reconcile your books with GSTR-2A data</p>
        </div>
      </div>

      {/* Period Selection & Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Reconciliation Period
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="period">Tax Period</Label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  {getMonthOptions().map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => performReconciliation(selectedPeriod)}
              disabled={!selectedPeriod || isReconciling}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isReconciling ? 'animate-spin' : ''}`} />
              Start Reconciliation
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Progress Bar */}
      {isReconciling && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Reconciliation in progress...</span>
                <span>{reconciliationProgress}%</span>
              </div>
              <Progress value={reconciliationProgress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reconciliation Summary */}
      {reconciliationData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{reconciliationData.totalInvoicesInBooks || 0}</div>
                  <p className="text-xs text-muted-foreground">Invoices in Books</p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{reconciliationData.totalInvoicesInGSTR2A || 0}</div>
                  <p className="text-xs text-muted-foreground">Invoices in GSTR-2A</p>
                </div>
                <FileText className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{reconciliationData.matchedInvoices || 0}</div>
                  <p className="text-xs text-muted-foreground">Matched Invoices</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-red-500">{discrepancies.length}</div>
                  <p className="text-xs text-muted-foreground">Discrepancies</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Financial Impact */}
      {reconciliationData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Financial Impact Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-red-500">₹{Math.abs(impact.totalImpact).toLocaleString()}</div>
                <p className="text-sm text-muted-foreground">Total Amount Impact</p>
                <div className="flex items-center justify-center mt-2">
                  {impact.totalImpact > 0 ? (
                    <TrendingUp className="h-4 w-4 text-red-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-green-500" />
                  )}
                </div>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-orange-500">₹{Math.abs(impact.taxImpact).toLocaleString()}</div>
                <p className="text-sm text-muted-foreground">Tax Impact</p>
                <div className="flex items-center justify-center mt-2">
                  {impact.taxImpact > 0 ? (
                    <TrendingUp className="h-4 w-4 text-red-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-green-500" />
                  )}
                </div>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-blue-500">₹{Math.abs(impact.itcImpact).toLocaleString()}</div>
                <p className="text-sm text-muted-foreground">ITC Impact</p>
                <div className="flex items-center justify-center mt-2">
                  {impact.itcImpact > 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Discrepancies */}
      {discrepancies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Discrepancies ({filteredDiscrepancies.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by invoice number, supplier, or GSTIN..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full md:w-64">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  {discrepancyTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Discrepancies Table */}
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Severity</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Invoice No.</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>GSTIN</TableHead>
                    <TableHead>Amount Diff</TableHead>
                    <TableHead>Tax Diff</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDiscrepancies.map((discrepancy, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getSeverityIcon(discrepancy.severity)}
                          <span className="capitalize">{discrepancy.severity}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getDiscrepancyBadge(discrepancy.type)}</TableCell>
                      <TableCell className="font-medium">{discrepancy.invoiceNumber}</TableCell>
                      <TableCell>{discrepancy.supplierName}</TableCell>
                      <TableCell>{discrepancy.gstin}</TableCell>
                      <TableCell>
                        <span className={discrepancy.amountDifference > 0 ? 'text-red-500' : 'text-green-500'}>
                          ₹{Math.abs(discrepancy.amountDifference || 0).toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={discrepancy.taxDifference > 0 ? 'text-red-500' : 'text-green-500'}>
                          ₹{Math.abs(discrepancy.taxDifference || 0).toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedDiscrepancy(discrepancy);
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
            
            {filteredDiscrepancies.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm || filterType !== 'all' 
                  ? 'No discrepancies found matching your criteria.' 
                  : 'No discrepancies found.'}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Discrepancy Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Discrepancy Details</DialogTitle>
          </DialogHeader>
          
          {selectedDiscrepancy && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Type</Label>
                  <div className="mt-1">{getDiscrepancyBadge(selectedDiscrepancy.type)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Severity</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {getSeverityIcon(selectedDiscrepancy.severity)}
                    <span className="capitalize">{selectedDiscrepancy.severity}</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Invoice Number</Label>
                  <p className="font-medium">{selectedDiscrepancy.invoiceNumber}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Invoice Date</Label>
                  <p>{selectedDiscrepancy.invoiceDate ? format(new Date(selectedDiscrepancy.invoiceDate), 'dd/MM/yyyy') : 'N/A'}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Supplier Details</Label>
                <p>{selectedDiscrepancy.supplierName}</p>
                <p className="text-sm text-muted-foreground">{selectedDiscrepancy.gstin}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">In Books</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Amount:</span>
                      <span>₹{selectedDiscrepancy.booksAmount?.toLocaleString() || '0'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Tax:</span>
                      <span>₹{selectedDiscrepancy.booksTax?.toLocaleString() || '0'}</span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">In GSTR-2A</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Amount:</span>
                      <span>₹{selectedDiscrepancy.gstr2aAmount?.toLocaleString() || '0'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Tax:</span>
                      <span>₹{selectedDiscrepancy.gstr2aTax?.toLocaleString() || '0'}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Amount Difference</Label>
                  <p className={`text-lg font-bold ${
                    selectedDiscrepancy.amountDifference > 0 ? 'text-red-500' : 'text-green-500'
                  }`}>
                    ₹{Math.abs(selectedDiscrepancy.amountDifference || 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Tax Difference</Label>
                  <p className={`text-lg font-bold ${
                    selectedDiscrepancy.taxDifference > 0 ? 'text-red-500' : 'text-green-500'
                  }`}>
                    ₹{Math.abs(selectedDiscrepancy.taxDifference || 0).toLocaleString()}
                  </p>
                </div>
              </div>
              
              {selectedDiscrepancy.description && (
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="text-sm text-muted-foreground">{selectedDiscrepancy.description}</p>
                </div>
              )}
              
              {selectedDiscrepancy.recommendations && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Recommendations:</strong> {selectedDiscrepancy.recommendations}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GSTReconciliation;