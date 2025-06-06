import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { toast } from 'sonner';
import gstAuditService from '../services/gstAuditService';
import {
  Settings,
  Building2,
  FileText,
  Calculator,
  Plus,
  Edit,
  Trash2,
  Download,
  Upload,
  Search,
  CheckCircle,
  AlertTriangle,
  Save
} from 'lucide-react';

const GSTSettings = () => {
  const [activeTab, setActiveTab] = useState('business');
  const [loading, setLoading] = useState(false);
  const [businessConfig, setBusinessConfig] = useState({
    gstin: '',
    businessName: '',
    address: '',
    state: '',
    pincode: '',
    businessType: 'regular'
  });
  const [hsnCodes, setHsnCodes] = useState([]);
  const [taxRates, setTaxRates] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddHSN, setShowAddHSN] = useState(false);
  const [editingHSN, setEditingHSN] = useState(null);
  const [newHSN, setNewHSN] = useState({
    code: '',
    description: '',
    taxRate: '',
    type: 'HSN'
  });

  const states = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Puducherry'
  ];

  const businessTypes = [
    { value: 'regular', label: 'Regular Business' },
    { value: 'composition', label: 'Composition Scheme' },
    { value: 'casual', label: 'Casual Taxable Person' },
    { value: 'non_resident', label: 'Non-Resident Taxable Person' }
  ];

  useEffect(() => {
    loadGSTSettings();
  }, []);

  const loadGSTSettings = async () => {
    setLoading(true);
    try {
      const [business, hsn, rates] = await Promise.all([
        gstAuditService.getBusinessConfig(),
        gstAuditService.hsnSacService.getAllCodes(),
        gstAuditService.getTaxRates()
      ]);
      
      setBusinessConfig(business || {
        gstin: '',
        businessName: '',
        address: '',
        state: '',
        pincode: '',
        businessType: 'regular'
      });
      setHsnCodes(hsn || []);
      setTaxRates(rates || []);
    } catch (error) {
      toast.error('Failed to load GST settings');
      console.error('Error loading GST settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateGSTIN = (gstin) => {
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstinRegex.test(gstin);
  };

  const handleBusinessConfigSave = async () => {
    if (!validateGSTIN(businessConfig.gstin)) {
      toast.error('Please enter a valid GSTIN');
      return;
    }

    setLoading(true);
    try {
      await gstAuditService.updateBusinessConfig(businessConfig);
      toast.success('Business configuration saved successfully');
    } catch (error) {
      toast.error('Failed to save business configuration');
      console.error('Error saving business config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddHSN = async () => {
    if (!newHSN.code || !newHSN.description || !newHSN.taxRate) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      if (editingHSN) {
        await gstAuditService.updateHSNSACCode(editingHSN.id, newHSN);
        toast.success('HSN/SAC code updated successfully');
      } else {
        await gstAuditService.addHSNSACCode(newHSN);
        toast.success('HSN/SAC code added successfully');
      }
      
      setShowAddHSN(false);
      setEditingHSN(null);
      setNewHSN({ code: '', description: '', taxRate: '', type: 'HSN' });
      loadGSTSettings();
    } catch (error) {
      toast.error('Failed to save HSN/SAC code');
      console.error('Error saving HSN/SAC code:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHSN = async (id) => {
    if (!confirm('Are you sure you want to delete this HSN/SAC code?')) {
      return;
    }

    setLoading(true);
    try {
      await gstAuditService.deleteHSNSACCode(id);
      toast.success('HSN/SAC code deleted successfully');
      loadGSTSettings();
    } catch (error) {
      toast.error('Failed to delete HSN/SAC code');
      console.error('Error deleting HSN/SAC code:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditHSN = (hsn) => {
    setEditingHSN(hsn);
    setNewHSN({
      code: hsn.code,
      description: hsn.description,
      taxRate: hsn.taxRate.toString(),
      type: hsn.type
    });
    setShowAddHSN(true);
  };

  const handleExportHSN = async () => {
    try {
      const data = await gstAuditService.exportHSNSACCodes();
      const blob = new Blob([data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'hsn_sac_codes.csv';
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('HSN/SAC codes exported successfully');
    } catch (error) {
      toast.error('Failed to export HSN/SAC codes');
      console.error('Error exporting HSN/SAC codes:', error);
    }
  };

  const filteredHSNCodes = hsnCodes.filter(hsn =>
    hsn.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hsn.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">GST Settings</h1>
          <p className="text-muted-foreground">Configure your GST and tax settings</p>
        </div>
        <Settings className="h-8 w-8 text-muted-foreground" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="business" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Business Settings
          </TabsTrigger>
          <TabsTrigger value="hsn" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            HSN/SAC Codes
          </TabsTrigger>
          <TabsTrigger value="rates" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Tax Rates
          </TabsTrigger>
        </TabsList>

        {/* Business Settings Tab */}
        <TabsContent value="business" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gstin">GSTIN *</Label>
                  <Input
                    id="gstin"
                    value={businessConfig.gstin}
                    onChange={(e) => setBusinessConfig(prev => ({ ...prev, gstin: e.target.value.toUpperCase() }))}
                    placeholder="22AAAAA0000A1Z5"
                    maxLength={15}
                  />
                  {businessConfig.gstin && !validateGSTIN(businessConfig.gstin) && (
                    <p className="text-sm text-red-500">Invalid GSTIN format</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name *</Label>
                  <Input
                    id="businessName"
                    value={businessConfig.businessName}
                    onChange={(e) => setBusinessConfig(prev => ({ ...prev, businessName: e.target.value }))}
                    placeholder="Your Business Name"
                  />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Business Address *</Label>
                  <Input
                    id="address"
                    value={businessConfig.address}
                    onChange={(e) => setBusinessConfig(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Complete business address"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Select
                    value={businessConfig.state}
                    onValueChange={(value) => setBusinessConfig(prev => ({ ...prev, state: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {states.map(state => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode *</Label>
                  <Input
                    id="pincode"
                    value={businessConfig.pincode}
                    onChange={(e) => setBusinessConfig(prev => ({ ...prev, pincode: e.target.value }))}
                    placeholder="123456"
                    maxLength={6}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="businessType">Business Type *</Label>
                  <Select
                    value={businessConfig.businessType}
                    onValueChange={(value) => setBusinessConfig(prev => ({ ...prev, businessType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select business type" />
                    </SelectTrigger>
                    <SelectContent>
                      {businessTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={handleBusinessConfigSave} disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Configuration
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* HSN/SAC Codes Tab */}
        <TabsContent value="hsn" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                HSN/SAC Code Management
                <div className="flex gap-2">
                  <Button onClick={handleExportHSN} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Dialog open={showAddHSN} onOpenChange={setShowAddHSN}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add HSN/SAC
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {editingHSN ? 'Edit HSN/SAC Code' : 'Add New HSN/SAC Code'}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="code">Code *</Label>
                          <Input
                            id="code"
                            value={newHSN.code}
                            onChange={(e) => setNewHSN(prev => ({ ...prev, code: e.target.value }))}
                            placeholder="1234"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="description">Description *</Label>
                          <Input
                            id="description"
                            value={newHSN.description}
                            onChange={(e) => setNewHSN(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Product/Service description"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="taxRate">Tax Rate (%) *</Label>
                          <Input
                            id="taxRate"
                            type="number"
                            value={newHSN.taxRate}
                            onChange={(e) => setNewHSN(prev => ({ ...prev, taxRate: e.target.value }))}
                            placeholder="18"
                            min="0"
                            max="28"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="type">Type *</Label>
                          <Select
                            value={newHSN.type}
                            onValueChange={(value) => setNewHSN(prev => ({ ...prev, type: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="HSN">HSN (Goods)</SelectItem>
                              <SelectItem value="SAC">SAC (Services)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowAddHSN(false);
                              setEditingHSN(null);
                              setNewHSN({ code: '', description: '', taxRate: '', type: 'HSN' });
                            }}
                          >
                            Cancel
                          </Button>
                          <Button onClick={handleAddHSN} disabled={loading}>
                            {editingHSN ? 'Update' : 'Add'}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search HSN/SAC codes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Tax Rate</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredHSNCodes.map((hsn) => (
                        <TableRow key={hsn.id}>
                          <TableCell className="font-medium">{hsn.code}</TableCell>
                          <TableCell>
                            <Badge variant={hsn.type === 'HSN' ? 'default' : 'secondary'}>
                              {hsn.type}
                            </Badge>
                          </TableCell>
                          <TableCell>{hsn.description}</TableCell>
                          <TableCell>{hsn.taxRate}%</TableCell>
                          <TableCell>
                            <Badge variant={hsn.isActive ? 'default' : 'secondary'}>
                              {hsn.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditHSN(hsn)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteHSN(hsn.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                {filteredHSNCodes.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchTerm ? 'No HSN/SAC codes found matching your search.' : 'No HSN/SAC codes configured yet.'}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tax Rates Tab */}
        <TabsContent value="rates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Current Tax Rates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">0%</div>
                  <div className="text-sm text-muted-foreground">Exempt</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">5%</div>
                  <div className="text-sm text-muted-foreground">Essential Items</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">12%</div>
                  <div className="text-sm text-muted-foreground">Standard Rate</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">18%</div>
                  <div className="text-sm text-muted-foreground">Most Goods</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">28%</div>
                  <div className="text-sm text-muted-foreground">Luxury Items</div>
                </div>
              </div>
              
              <Alert className="mt-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Tax rates are automatically calculated based on HSN/SAC codes. 
                  CGST and SGST are each half of the total rate for intra-state transactions, 
                  while IGST equals the full rate for inter-state transactions.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GSTSettings;