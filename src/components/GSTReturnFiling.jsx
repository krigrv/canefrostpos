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
  FileText,
  Download,
  Upload,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Clock,
  Eye,
  Send,
  RefreshCw,
  Calculator,
  TrendingUp,
  BarChart3,
  PieChart
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

const GSTReturnFiling = () => {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [gstr1Data, setGstr1Data] = useState(null);
  const [gstr3bData, setGstr3bData] = useState(null);
  const [filingProgress, setFilingProgress] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  const returnTypes = [
    { value: 'GSTR1', label: 'GSTR-1 (Outward Supplies)', frequency: 'Monthly' },
    { value: 'GSTR3B', label: 'GSTR-3B (Summary Return)', frequency: 'Monthly' },
    { value: 'GSTR2A', label: 'GSTR-2A (Auto-populated)', frequency: 'Monthly' },
    { value: 'GSTR9', label: 'GSTR-9 (Annual Return)', frequency: 'Annual' }
  ];

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

  useEffect(() => {
    loadReturns();
    // Set default period to current month
    setSelectedPeriod(format(new Date(), 'yyyy-MM'));
  }, []);

  const loadReturns = async () => {
    setLoading(true);
    try {
      const data = await gstAuditService.getGSTRFilings();
      setReturns(data || []);
    } catch (error) {
      toast.error('Failed to load GST returns');
      console.error('Error loading returns:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateGSTR1 = async (period) => {
    setIsGenerating(true);
    setFilingProgress(0);
    
    try {
      setFilingProgress(25);
      const data = await gstAuditService.generateGSTR1(period);
      setFilingProgress(75);
      setGstr1Data(data);
      setFilingProgress(100);
      toast.success('GSTR-1 generated successfully');
      return data;
    } catch (error) {
      toast.error('Failed to generate GSTR-1');
      console.error('Error generating GSTR-1:', error);
      throw error;
    } finally {
      setIsGenerating(false);
      setTimeout(() => setFilingProgress(0), 2000);
    }
  };

  const generateGSTR3B = async (period) => {
    setIsGenerating(true);
    setFilingProgress(0);
    
    try {
      setFilingProgress(25);
      const data = await gstAuditService.generateGSTR3B(period);
      setFilingProgress(75);
      setGstr3bData(data);
      setFilingProgress(100);
      toast.success('GSTR-3B generated successfully');
      return data;
    } catch (error) {
      toast.error('Failed to generate GSTR-3B');
      console.error('Error generating GSTR-3B:', error);
      throw error;
    } finally {
      setIsGenerating(false);
      setTimeout(() => setFilingProgress(0), 2000);
    }
  };

  const fileReturn = async (returnType, period, data) => {
    setLoading(true);
    try {
      const result = await gstAuditService.fileGSTReturn(returnType, period, data);
      toast.success(`${returnType} filed successfully. ARN: ${result.arn}`);
      loadReturns();
    } catch (error) {
      toast.error(`Failed to file ${returnType}`);
      console.error('Error filing return:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'DRAFT': { variant: 'secondary', icon: Clock, color: 'text-yellow-500' },
      'FILED': { variant: 'default', icon: CheckCircle, color: 'text-green-500' },
      'PENDING': { variant: 'destructive', icon: AlertTriangle, color: 'text-red-500' },
      'LATE': { variant: 'destructive', icon: AlertTriangle, color: 'text-red-500' }
    };
    
    const config = statusConfig[status] || statusConfig['DRAFT'];
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const calculateTaxLiability = (data) => {
    if (!data) return { cgst: 0, sgst: 0, igst: 0, total: 0 };
    
    const cgst = data.cgstAmount || 0;
    const sgst = data.sgstAmount || 0;
    const igst = data.igstAmount || 0;
    const total = cgst + sgst + igst;
    
    return { cgst, sgst, igst, total };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            GST Return Filing
          </h2>
          <p className="text-muted-foreground">Generate and file GST returns (GSTR-1, GSTR-3B)</p>
        </div>
      </div>

      {/* Period Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Select Filing Period
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
          </div>
        </CardContent>
      </Card>

      {/* Progress Bar */}
      {isGenerating && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Generating return...</span>
                <span>{filingProgress}%</span>
              </div>
              <Progress value={filingProgress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Return Generation */}
      <Tabs defaultValue="gstr1" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="gstr1">GSTR-1</TabsTrigger>
          <TabsTrigger value="gstr3b">GSTR-3B</TabsTrigger>
        </TabsList>

        {/* GSTR-1 Tab */}
        <TabsContent value="gstr1" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                GSTR-1 - Outward Supplies
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Details of outward supplies of goods or services effected
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button
                  onClick={() => selectedPeriod && generateGSTR1(selectedPeriod)}
                  disabled={!selectedPeriod || isGenerating}
                  className="flex items-center gap-2"
                >
                  <Calculator className="h-4 w-4" />
                  Generate GSTR-1
                </Button>
                
                {gstr1Data && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedReturn({ type: 'GSTR1', data: gstr1Data, period: selectedPeriod });
                        setShowPreviewDialog(true);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                    <Button
                      onClick={() => fileReturn('GSTR1', selectedPeriod, gstr1Data)}
                      disabled={loading}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      File Return
                    </Button>
                  </>
                )}
              </div>
              
              {gstr1Data && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-2xl font-bold">₹{gstr1Data.totalTaxableValue?.toLocaleString() || '0'}</div>
                      <p className="text-xs text-muted-foreground">Total Taxable Value</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-2xl font-bold">₹{gstr1Data.totalTaxAmount?.toLocaleString() || '0'}</div>
                      <p className="text-xs text-muted-foreground">Total Tax Amount</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-2xl font-bold">{gstr1Data.totalInvoices || '0'}</div>
                      <p className="text-xs text-muted-foreground">Total Invoices</p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* GSTR-3B Tab */}
        <TabsContent value="gstr3b" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                GSTR-3B - Summary Return
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Monthly summary return of outward and inward supplies
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button
                  onClick={() => selectedPeriod && generateGSTR3B(selectedPeriod)}
                  disabled={!selectedPeriod || isGenerating}
                  className="flex items-center gap-2"
                >
                  <Calculator className="h-4 w-4" />
                  Generate GSTR-3B
                </Button>
                
                {gstr3bData && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedReturn({ type: 'GSTR3B', data: gstr3bData, period: selectedPeriod });
                        setShowPreviewDialog(true);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                    <Button
                      onClick={() => fileReturn('GSTR3B', selectedPeriod, gstr3bData)}
                      disabled={loading}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      File Return
                    </Button>
                  </>
                )}
              </div>
              
              {gstr3bData && (
                <div className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-2xl font-bold">₹{gstr3bData.outwardTaxableSupplies?.toLocaleString() || '0'}</div>
                        <p className="text-xs text-muted-foreground">Outward Taxable Supplies</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-2xl font-bold">₹{gstr3bData.inwardTaxableSupplies?.toLocaleString() || '0'}</div>
                        <p className="text-xs text-muted-foreground">Inward Taxable Supplies</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-2xl font-bold">₹{gstr3bData.itcAvailed?.toLocaleString() || '0'}</div>
                        <p className="text-xs text-muted-foreground">ITC Availed</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-2xl font-bold">₹{gstr3bData.netTaxLiability?.toLocaleString() || '0'}</div>
                        <p className="text-xs text-muted-foreground">Net Tax Liability</p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Tax Liability Breakdown */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Tax Liability Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-xl font-bold text-blue-600">₹{gstr3bData.cgstLiability?.toLocaleString() || '0'}</div>
                          <p className="text-sm text-muted-foreground">CGST</p>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-green-600">₹{gstr3bData.sgstLiability?.toLocaleString() || '0'}</div>
                          <p className="text-sm text-muted-foreground">SGST</p>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-purple-600">₹{gstr3bData.igstLiability?.toLocaleString() || '0'}</div>
                          <p className="text-sm text-muted-foreground">IGST</p>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-orange-600">₹{gstr3bData.cessLiability?.toLocaleString() || '0'}</div>
                          <p className="text-sm text-muted-foreground">CESS</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Filed Returns History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Filed Returns History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Return Type</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Filed Date</TableHead>
                  <TableHead>ARN</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tax Liability</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {returns.map((returnItem) => {
                  const taxLiability = calculateTaxLiability(returnItem);
                  return (
                    <TableRow key={returnItem.id}>
                      <TableCell className="font-medium">{returnItem.returnType}</TableCell>
                      <TableCell>{format(new Date(returnItem.period), 'MMM yyyy')}</TableCell>
                      <TableCell>
                        {returnItem.filedDate ? format(new Date(returnItem.filedDate), 'dd/MM/yyyy') : '-'}
                      </TableCell>
                      <TableCell>{returnItem.arn || '-'}</TableCell>
                      <TableCell>{getStatusBadge(returnItem.status)}</TableCell>
                      <TableCell>₹{taxLiability.total.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedReturn(returnItem);
                              setShowPreviewDialog(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          
          {returns.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No returns filed yet.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Return Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedReturn?.type} Preview - {selectedReturn?.period && format(new Date(selectedReturn.period), 'MMM yyyy')}
            </DialogTitle>
          </DialogHeader>
          
          {selectedReturn && (
            <div className="space-y-4">
              {selectedReturn.type === 'GSTR1' && (
                <div className="space-y-4">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      This is a preview of your GSTR-1 return. Please review all details before filing.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-xl font-bold">₹{selectedReturn.data?.totalTaxableValue?.toLocaleString() || '0'}</div>
                        <p className="text-sm text-muted-foreground">Total Taxable Value</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-xl font-bold">₹{selectedReturn.data?.totalTaxAmount?.toLocaleString() || '0'}</div>
                        <p className="text-sm text-muted-foreground">Total Tax Amount</p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {selectedReturn.data?.invoices && (
                    <div>
                      <h4 className="font-medium mb-2">Invoice Summary</h4>
                      <div className="border rounded-lg">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Invoice No.</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Customer</TableHead>
                              <TableHead>Taxable Value</TableHead>
                              <TableHead>Tax Amount</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedReturn.data.invoices.slice(0, 5).map((invoice, index) => (
                              <TableRow key={index}>
                                <TableCell>{invoice.invoiceNumber}</TableCell>
                                <TableCell>{format(new Date(invoice.date), 'dd/MM/yyyy')}</TableCell>
                                <TableCell>{invoice.customerName}</TableCell>
                                <TableCell>₹{invoice.taxableValue?.toLocaleString()}</TableCell>
                                <TableCell>₹{invoice.taxAmount?.toLocaleString()}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      {selectedReturn.data.invoices.length > 5 && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Showing 5 of {selectedReturn.data.invoices.length} invoices
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {selectedReturn.type === 'GSTR3B' && (
                <div className="space-y-4">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      This is a preview of your GSTR-3B return. Please review all details before filing.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-xl font-bold">₹{selectedReturn.data?.outwardTaxableSupplies?.toLocaleString() || '0'}</div>
                        <p className="text-sm text-muted-foreground">Outward Taxable Supplies</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-xl font-bold">₹{selectedReturn.data?.netTaxLiability?.toLocaleString() || '0'}</div>
                        <p className="text-sm text-muted-foreground">Net Tax Liability</p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Tax Liability Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>CGST:</span>
                          <span>₹{selectedReturn.data?.cgstLiability?.toLocaleString() || '0'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>SGST:</span>
                          <span>₹{selectedReturn.data?.sgstLiability?.toLocaleString() || '0'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>IGST:</span>
                          <span>₹{selectedReturn.data?.igstLiability?.toLocaleString() || '0'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>CESS:</span>
                          <span>₹{selectedReturn.data?.cessLiability?.toLocaleString() || '0'}</span>
                        </div>
                        <hr />
                        <div className="flex justify-between font-bold">
                          <span>Total:</span>
                          <span>₹{(
                            (selectedReturn.data?.cgstLiability || 0) +
                            (selectedReturn.data?.sgstLiability || 0) +
                            (selectedReturn.data?.igstLiability || 0) +
                            (selectedReturn.data?.cessLiability || 0)
                          ).toLocaleString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GSTReturnFiling;