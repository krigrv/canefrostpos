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
  Truck,
  Plus,
  Eye,
  Edit,
  X,
  Download,
  Search,
  Calendar,
  MapPin,
  User,
  Package,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';

const EWayBillManager = () => {
  const [eWayBills, setEWayBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBill, setSelectedBill] = useState(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  
  const [newEWayBill, setNewEWayBill] = useState({
    invoiceNumber: '',
    invoiceDate: '',
    consignorGSTIN: '',
    consignorName: '',
    consignorAddress: '',
    consigneeGSTIN: '',
    consigneeName: '',
    consigneeAddress: '',
    transporterGSTIN: '',
    transporterName: '',
    vehicleNumber: '',
    transportMode: '1', // 1-Road, 2-Rail, 3-Air, 4-Ship
    distance: '',
    goodsValue: '',
    taxableValue: '',
    cgstAmount: '',
    sgstAmount: '',
    igstAmount: '',
    cessAmount: '',
    totalValue: '',
    hsnCode: '',
    goodsDescription: '',
    quantity: '',
    unit: 'NOS',
    reasonCode: '1', // 1-Supply, 2-Export, 3-Job Work, etc.
    remarks: ''
  });

  const transportModes = [
    { value: '1', label: 'Road' },
    { value: '2', label: 'Rail' },
    { value: '3', label: 'Air' },
    { value: '4', label: 'Ship' }
  ];

  const reasonCodes = [
    { value: '1', label: 'Supply' },
    { value: '2', label: 'Export' },
    { value: '3', label: 'Job Work' },
    { value: '4', label: 'SKD/CKD' },
    { value: '5', label: 'Line Sales' },
    { value: '6', label: 'Recipient Not Known' },
    { value: '7', label: 'Exhibition or Fairs' },
    { value: '8', label: 'Others' }
  ];

  const units = [
    'NOS', 'KGS', 'LTR', 'MTR', 'SQM', 'CUM', 'TON', 'BOX', 'PCS', 'SET'
  ];

  useEffect(() => {
    loadEWayBills();
  }, []);

  const loadEWayBills = async () => {
    setLoading(true);
    try {
      const bills = await gstAuditService.getEWayBills();
      setEWayBills(bills || []);
    } catch (error) {
      toast.error('Failed to load E-way bills');
      console.error('Error loading E-way bills:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEWayBill = async () => {
    // Validate required fields
    const requiredFields = [
      'invoiceNumber', 'invoiceDate', 'consignorGSTIN', 'consignorName',
      'consigneeGSTIN', 'consigneeName', 'goodsValue', 'hsnCode', 'goodsDescription'
    ];
    
    const missingFields = requiredFields.filter(field => !newEWayBill[field]);
    if (missingFields.length > 0) {
      toast.error(`Please fill required fields: ${missingFields.join(', ')}`);
      return;
    }

    setLoading(true);
    try {
      const result = await gstAuditService.generateEWayBill(newEWayBill);
      toast.success(`E-way bill generated successfully. EWB No: ${result.eWayBillNumber}`);
      setShowCreateDialog(false);
      resetForm();
      loadEWayBills();
    } catch (error) {
      toast.error('Failed to generate E-way bill');
      console.error('Error generating E-way bill:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEWayBill = async (eWayBillNumber, reason) => {
    if (!reason) {
      toast.error('Please provide cancellation reason');
      return;
    }

    setLoading(true);
    try {
      await gstAuditService.cancelEWayBill(eWayBillNumber, reason);
      toast.success('E-way bill cancelled successfully');
      loadEWayBills();
    } catch (error) {
      toast.error('Failed to cancel E-way bill');
      console.error('Error cancelling E-way bill:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNewEWayBill({
      invoiceNumber: '',
      invoiceDate: '',
      consignorGSTIN: '',
      consignorName: '',
      consignorAddress: '',
      consigneeGSTIN: '',
      consigneeName: '',
      consigneeAddress: '',
      transporterGSTIN: '',
      transporterName: '',
      vehicleNumber: '',
      transportMode: '1',
      distance: '',
      goodsValue: '',
      taxableValue: '',
      cgstAmount: '',
      sgstAmount: '',
      igstAmount: '',
      cessAmount: '',
      totalValue: '',
      hsnCode: '',
      goodsDescription: '',
      quantity: '',
      unit: 'NOS',
      reasonCode: '1',
      remarks: ''
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'ACTIVE': { variant: 'default', icon: CheckCircle, color: 'text-green-500' },
      'CANCELLED': { variant: 'destructive', icon: X, color: 'text-red-500' },
      'EXPIRED': { variant: 'secondary', icon: Clock, color: 'text-gray-500' }
    };
    
    const config = statusConfig[status] || statusConfig['ACTIVE'];
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const filteredEWayBills = eWayBills.filter(bill => {
    const matchesSearch = 
      bill.eWayBillNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.consigneeName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || bill.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Truck className="h-6 w-6" />
            E-way Bill Management
          </h2>
          <p className="text-muted-foreground">Generate and manage E-way bills for goods transportation</p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Generate E-way Bill
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Generate New E-way Bill</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Invoice Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Invoice Details</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="invoiceNumber">Invoice Number *</Label>
                    <Input
                      id="invoiceNumber"
                      value={newEWayBill.invoiceNumber}
                      onChange={(e) => setNewEWayBill(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                      placeholder="INV-001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invoiceDate">Invoice Date *</Label>
                    <Input
                      id="invoiceDate"
                      type="date"
                      value={newEWayBill.invoiceDate}
                      onChange={(e) => setNewEWayBill(prev => ({ ...prev, invoiceDate: e.target.value }))}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Consignor Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Consignor (Supplier) Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="consignorGSTIN">GSTIN *</Label>
                      <Input
                        id="consignorGSTIN"
                        value={newEWayBill.consignorGSTIN}
                        onChange={(e) => setNewEWayBill(prev => ({ ...prev, consignorGSTIN: e.target.value.toUpperCase() }))}
                        placeholder="22AAAAA0000A1Z5"
                        maxLength={15}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="consignorName">Name *</Label>
                      <Input
                        id="consignorName"
                        value={newEWayBill.consignorName}
                        onChange={(e) => setNewEWayBill(prev => ({ ...prev, consignorName: e.target.value }))}
                        placeholder="Supplier Name"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="consignorAddress">Address</Label>
                    <Textarea
                      id="consignorAddress"
                      value={newEWayBill.consignorAddress}
                      onChange={(e) => setNewEWayBill(prev => ({ ...prev, consignorAddress: e.target.value }))}
                      placeholder="Complete address"
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Consignee Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Consignee (Recipient) Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="consigneeGSTIN">GSTIN *</Label>
                      <Input
                        id="consigneeGSTIN"
                        value={newEWayBill.consigneeGSTIN}
                        onChange={(e) => setNewEWayBill(prev => ({ ...prev, consigneeGSTIN: e.target.value.toUpperCase() }))}
                        placeholder="22AAAAA0000A1Z5"
                        maxLength={15}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="consigneeName">Name *</Label>
                      <Input
                        id="consigneeName"
                        value={newEWayBill.consigneeName}
                        onChange={(e) => setNewEWayBill(prev => ({ ...prev, consigneeName: e.target.value }))}
                        placeholder="Recipient Name"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="consigneeAddress">Address</Label>
                    <Textarea
                      id="consigneeAddress"
                      value={newEWayBill.consigneeAddress}
                      onChange={(e) => setNewEWayBill(prev => ({ ...prev, consigneeAddress: e.target.value }))}
                      placeholder="Complete address"
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Goods Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Goods Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="hsnCode">HSN Code *</Label>
                      <Input
                        id="hsnCode"
                        value={newEWayBill.hsnCode}
                        onChange={(e) => setNewEWayBill(prev => ({ ...prev, hsnCode: e.target.value }))}
                        placeholder="1234"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input
                        id="quantity"
                        type="number"
                        value={newEWayBill.quantity}
                        onChange={(e) => setNewEWayBill(prev => ({ ...prev, quantity: e.target.value }))}
                        placeholder="1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="unit">Unit</Label>
                      <Select
                        value={newEWayBill.unit}
                        onValueChange={(value) => setNewEWayBill(prev => ({ ...prev, unit: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {units.map(unit => (
                            <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="goodsDescription">Description *</Label>
                    <Textarea
                      id="goodsDescription"
                      value={newEWayBill.goodsDescription}
                      onChange={(e) => setNewEWayBill(prev => ({ ...prev, goodsDescription: e.target.value }))}
                      placeholder="Detailed description of goods"
                      rows={2}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="goodsValue">Goods Value *</Label>
                      <Input
                        id="goodsValue"
                        type="number"
                        value={newEWayBill.goodsValue}
                        onChange={(e) => setNewEWayBill(prev => ({ ...prev, goodsValue: e.target.value }))}
                        placeholder="10000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reasonCode">Reason for Transportation</Label>
                      <Select
                        value={newEWayBill.reasonCode}
                        onValueChange={(value) => setNewEWayBill(prev => ({ ...prev, reasonCode: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {reasonCodes.map(reason => (
                            <SelectItem key={reason.value} value={reason.value}>
                              {reason.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Transport Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Transport Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="transportMode">Transport Mode</Label>
                      <Select
                        value={newEWayBill.transportMode}
                        onValueChange={(value) => setNewEWayBill(prev => ({ ...prev, transportMode: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {transportModes.map(mode => (
                            <SelectItem key={mode.value} value={mode.value}>
                              {mode.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="distance">Distance (KM)</Label>
                      <Input
                        id="distance"
                        type="number"
                        value={newEWayBill.distance}
                        onChange={(e) => setNewEWayBill(prev => ({ ...prev, distance: e.target.value }))}
                        placeholder="100"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="vehicleNumber">Vehicle Number</Label>
                      <Input
                        id="vehicleNumber"
                        value={newEWayBill.vehicleNumber}
                        onChange={(e) => setNewEWayBill(prev => ({ ...prev, vehicleNumber: e.target.value.toUpperCase() }))}
                        placeholder="MH12AB1234"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="transporterName">Transporter Name</Label>
                      <Input
                        id="transporterName"
                        value={newEWayBill.transporterName}
                        onChange={(e) => setNewEWayBill(prev => ({ ...prev, transporterName: e.target.value }))}
                        placeholder="Transport Company"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateDialog(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateEWayBill} disabled={loading}>
                  Generate E-way Bill
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by E-way bill number, invoice number, or consignee..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* E-way Bills Table */}
      <Card>
        <CardHeader>
          <CardTitle>E-way Bills ({filteredEWayBills.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>E-way Bill No.</TableHead>
                  <TableHead>Invoice No.</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Consignee</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Valid Until</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEWayBills.map((bill) => (
                  <TableRow key={bill.id}>
                    <TableCell className="font-medium">{bill.eWayBillNumber}</TableCell>
                    <TableCell>{bill.invoiceNumber}</TableCell>
                    <TableCell>{format(new Date(bill.invoiceDate), 'dd/MM/yyyy')}</TableCell>
                    <TableCell>{bill.consigneeName}</TableCell>
                    <TableCell>₹{parseFloat(bill.goodsValue || 0).toLocaleString()}</TableCell>
                    <TableCell>{getStatusBadge(bill.status)}</TableCell>
                    <TableCell>
                      {bill.validUntil ? format(new Date(bill.validUntil), 'dd/MM/yyyy') : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedBill(bill);
                            setShowDetailsDialog(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {bill.status === 'ACTIVE' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const reason = prompt('Enter cancellation reason:');
                              if (reason) {
                                handleCancelEWayBill(bill.eWayBillNumber, reason);
                              }
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredEWayBills.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || statusFilter !== 'all' 
                ? 'No E-way bills found matching your criteria.' 
                : 'No E-way bills generated yet.'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* E-way Bill Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>E-way Bill Details</DialogTitle>
          </DialogHeader>
          
          {selectedBill && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">E-way Bill Number</Label>
                  <p className="text-lg font-bold">{selectedBill.eWayBillNumber}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedBill.status)}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Invoice Number</Label>
                  <p>{selectedBill.invoiceNumber}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Invoice Date</Label>
                  <p>{format(new Date(selectedBill.invoiceDate), 'dd/MM/yyyy')}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Consignee</Label>
                <p>{selectedBill.consigneeName}</p>
                <p className="text-sm text-muted-foreground">{selectedBill.consigneeAddress}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Goods Description</Label>
                <p>{selectedBill.goodsDescription}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Goods Value</Label>
                  <p>₹{parseFloat(selectedBill.goodsValue || 0).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Vehicle Number</Label>
                  <p>{selectedBill.vehicleNumber || 'Not specified'}</p>
                </div>
              </div>
              
              {selectedBill.validUntil && (
                <div>
                  <Label className="text-sm font-medium">Valid Until</Label>
                  <p>{format(new Date(selectedBill.validUntil), 'dd/MM/yyyy HH:mm')}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EWayBillManager;