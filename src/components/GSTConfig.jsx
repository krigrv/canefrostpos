import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Trash2, Plus, Edit, Save, X, Search, Download, Upload } from 'lucide-react';
import gstAuditService from '../services/gstAuditService';

const GSTConfig = () => {
  const [hsnSacCodes, setHsnSacCodes] = useState([]);
  const [taxRates, setTaxRates] = useState([]);
  const [businessConfig, setBusinessConfig] = useState({
    gstin: '',
    businessName: '',
    address: '',
    stateCode: '',
    pincode: '',
    businessType: 'Regular'
  });
  const [editingCode, setEditingCode] = useState(null);
  const [newCode, setNewCode] = useState({
    code: '',
    description: '',
    taxRate: 0,
    type: 'HSN',
    category: '',
    unit: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadHsnSacCodes();
    loadTaxRates();
    loadBusinessConfig();
  }, []);

  const loadHsnSacCodes = async () => {
    try {
      const codes = await gstAuditService.hsnSacService.getAllCodes();
      setHsnSacCodes(codes);
    } catch (error) {
      console.error('Error loading HSN/SAC codes:', error);
    }
  };

  const loadTaxRates = async () => {
    try {
      const rates = await gstAuditService.getTaxRates();
      setTaxRates(rates);
    } catch (error) {
      console.error('Error loading tax rates:', error);
    }
  };

  const loadBusinessConfig = () => {
    const config = localStorage.getItem('gstBusinessConfig');
    if (config) {
      setBusinessConfig(JSON.parse(config));
    }
  };

  const saveBusinessConfig = async () => {
    try {
      setLoading(true);
      
      // Validate GSTIN
      const validation = await gstAuditService.validateGSTIN(businessConfig.gstin);
      if (!validation.isValid) {
        setErrors({ gstin: validation.error });
        return;
      }

      localStorage.setItem('gstBusinessConfig', JSON.stringify(businessConfig));
      setErrors({});
      alert('Business configuration saved successfully!');
    } catch (error) {
      console.error('Error saving business config:', error);
      setErrors({ general: 'Failed to save configuration' });
    } finally {
      setLoading(false);
    }
  };

  const addHsnSacCode = async () => {
    try {
      setLoading(true);
      const addedCode = await gstAuditService.addHsnSacCode(newCode);
      setHsnSacCodes([...hsnSacCodes, addedCode]);
      setNewCode({
        code: '',
        description: '',
        taxRate: 0,
        type: 'HSN',
        category: '',
        unit: ''
      });
    } catch (error) {
      console.error('Error adding HSN/SAC code:', error);
      alert('Failed to add HSN/SAC code');
    } finally {
      setLoading(false);
    }
  };

  const updateHsnSacCode = async (id, updatedCode) => {
    try {
      setLoading(true);
      await gstAuditService.updateHsnSacCode(id, updatedCode);
      setHsnSacCodes(hsnSacCodes.map(code => 
        code.id === id ? { ...code, ...updatedCode } : code
      ));
      setEditingCode(null);
    } catch (error) {
      console.error('Error updating HSN/SAC code:', error);
      alert('Failed to update HSN/SAC code');
    } finally {
      setLoading(false);
    }
  };

  const deleteHsnSacCode = async (id) => {
    if (!confirm('Are you sure you want to delete this HSN/SAC code?')) return;
    
    try {
      setLoading(true);
      await gstAuditService.deleteHsnSacCode(id);
      setHsnSacCodes(hsnSacCodes.filter(code => code.id !== id));
    } catch (error) {
      console.error('Error deleting HSN/SAC code:', error);
      alert('Failed to delete HSN/SAC code');
    } finally {
      setLoading(false);
    }
  };

  const exportHsnSacCodes = () => {
    const csvContent = [
      ['Code', 'Description', 'Tax Rate', 'Type', 'Category', 'Unit'],
      ...hsnSacCodes.map(code => [
        code.code,
        code.description,
        code.taxRate,
        code.type,
        code.category || '',
        code.unit || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hsn_sac_codes.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const importHsnSacCodes = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target.result;
        const lines = csv.split('\n');
        const headers = lines[0].split(',');
        
        const importedCodes = lines.slice(1)
          .filter(line => line.trim())
          .map(line => {
            const values = line.split(',');
            return {
              code: values[0]?.trim(),
              description: values[1]?.trim(),
              taxRate: parseFloat(values[2]) || 0,
              type: values[3]?.trim() || 'HSN',
              category: values[4]?.trim(),
              unit: values[5]?.trim()
            };
          });

        // Add imported codes
        importedCodes.forEach(code => {
          if (code.code && code.description) {
            gstAuditService.addHsnSacCode(code)
              .then(() => loadHsnSacCodes())
              .catch(console.error);
          }
        });

        alert(`Imported ${importedCodes.length} HSN/SAC codes`);
      } catch (error) {
        console.error('Error importing HSN/SAC codes:', error);
        alert('Failed to import HSN/SAC codes');
      }
    };
    reader.readAsText(file);
  };

  const filteredCodes = hsnSacCodes.filter(code =>
    code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    code.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    code.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stateOptions = [
    { code: '01', name: 'Jammu and Kashmir' },
    { code: '02', name: 'Himachal Pradesh' },
    { code: '03', name: 'Punjab' },
    { code: '04', name: 'Chandigarh' },
    { code: '05', name: 'Uttarakhand' },
    { code: '06', name: 'Haryana' },
    { code: '07', name: 'Delhi' },
    { code: '08', name: 'Rajasthan' },
    { code: '09', name: 'Uttar Pradesh' },
    { code: '10', name: 'Bihar' },
    { code: '11', name: 'Sikkim' },
    { code: '12', name: 'Arunachal Pradesh' },
    { code: '13', name: 'Nagaland' },
    { code: '14', name: 'Manipur' },
    { code: '15', name: 'Mizoram' },
    { code: '16', name: 'Tripura' },
    { code: '17', name: 'Meghalaya' },
    { code: '18', name: 'Assam' },
    { code: '19', name: 'West Bengal' },
    { code: '20', name: 'Jharkhand' },
    { code: '21', name: 'Odisha' },
    { code: '22', name: 'Chhattisgarh' },
    { code: '23', name: 'Madhya Pradesh' },
    { code: '24', name: 'Gujarat' },
    { code: '25', name: 'Daman and Diu' },
    { code: '26', name: 'Dadra and Nagar Haveli' },
    { code: '27', name: 'Maharashtra' },
    { code: '28', name: 'Andhra Pradesh' },
    { code: '29', name: 'Karnataka' },
    { code: '30', name: 'Goa' },
    { code: '31', name: 'Lakshadweep' },
    { code: '32', name: 'Kerala' },
    { code: '33', name: 'Tamil Nadu' },
    { code: '34', name: 'Puducherry' },
    { code: '35', name: 'Andaman and Nicobar Islands' },
    { code: '36', name: 'Telangana' },
    { code: '37', name: 'Andhra Pradesh (New)' }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">GST Configuration</h1>
        <p className="text-gray-600 mt-2">Manage HSN/SAC codes, tax rates, and business settings</p>
      </div>

      <Tabs defaultValue="business" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="business">Business Settings</TabsTrigger>
          <TabsTrigger value="hsn-sac">HSN/SAC Codes</TabsTrigger>
          <TabsTrigger value="tax-rates">Tax Rates</TabsTrigger>
        </TabsList>

        {/* Business Settings Tab */}
        <TabsContent value="business">
          <Card>
            <CardHeader>
              <CardTitle>Business Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {errors.general && (
                <Alert variant="destructive">
                  <AlertDescription>{errors.general}</AlertDescription>
                </Alert>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="gstin">GSTIN *</Label>
                  <Input
                    id="gstin"
                    value={businessConfig.gstin}
                    onChange={(e) => setBusinessConfig({...businessConfig, gstin: e.target.value.toUpperCase()})}
                    placeholder="22AAAAA0000A1Z5"
                    maxLength={15}
                    className={errors.gstin ? 'border-red-500' : ''}
                  />
                  {errors.gstin && <p className="text-red-500 text-sm mt-1">{errors.gstin}</p>}
                </div>
                
                <div>
                  <Label htmlFor="businessName">Business Name *</Label>
                  <Input
                    id="businessName"
                    value={businessConfig.businessName}
                    onChange={(e) => setBusinessConfig({...businessConfig, businessName: e.target.value})}
                    placeholder="Your Business Name"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={businessConfig.address}
                    onChange={(e) => setBusinessConfig({...businessConfig, address: e.target.value})}
                    placeholder="Business Address"
                  />
                </div>
                
                <div>
                  <Label htmlFor="stateCode">State</Label>
                  <Select
                    value={businessConfig.stateCode}
                    onValueChange={(value) => setBusinessConfig({...businessConfig, stateCode: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select State" />
                    </SelectTrigger>
                    <SelectContent>
                      {stateOptions.map(state => (
                        <SelectItem key={state.code} value={state.code}>
                          {state.code} - {state.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input
                    id="pincode"
                    value={businessConfig.pincode}
                    onChange={(e) => setBusinessConfig({...businessConfig, pincode: e.target.value})}
                    placeholder="123456"
                    maxLength={6}
                  />
                </div>
                
                <div>
                  <Label htmlFor="businessType">Business Type</Label>
                  <Select
                    value={businessConfig.businessType}
                    onValueChange={(value) => setBusinessConfig({...businessConfig, businessType: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Regular">Regular</SelectItem>
                      <SelectItem value="Composition">Composition</SelectItem>
                      <SelectItem value="Casual">Casual</SelectItem>
                      <SelectItem value="SEZ">SEZ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button onClick={saveBusinessConfig} disabled={loading}>
                {loading ? 'Saving...' : 'Save Configuration'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* HSN/SAC Codes Tab */}
        <TabsContent value="hsn-sac">
          <div className="space-y-6">
            {/* Add New Code */}
            <Card>
              <CardHeader>
                <CardTitle>Add New HSN/SAC Code</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div>
                    <Label htmlFor="newCode">Code *</Label>
                    <Input
                      id="newCode"
                      value={newCode.code}
                      onChange={(e) => setNewCode({...newCode, code: e.target.value})}
                      placeholder="2106"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <Label htmlFor="newDescription">Description *</Label>
                    <Input
                      id="newDescription"
                      value={newCode.description}
                      onChange={(e) => setNewCode({...newCode, description: e.target.value})}
                      placeholder="Product description"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="newTaxRate">Tax Rate (%)</Label>
                    <Input
                      id="newTaxRate"
                      type="number"
                      value={newCode.taxRate}
                      onChange={(e) => setNewCode({...newCode, taxRate: parseFloat(e.target.value) || 0})}
                      placeholder="18"
                      step="0.01"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="newType">Type</Label>
                    <Select
                      value={newCode.type}
                      onValueChange={(value) => setNewCode({...newCode, type: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HSN">HSN</SelectItem>
                        <SelectItem value="SAC">SAC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="newCategory">Category</Label>
                    <Input
                      id="newCategory"
                      value={newCode.category}
                      onChange={(e) => setNewCode({...newCode, category: e.target.value})}
                      placeholder="Food Products"
                    />
                  </div>
                </div>
                
                <div className="flex gap-2 mt-4">
                  <Button onClick={addHsnSacCode} disabled={loading || !newCode.code || !newCode.description}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Code
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Search and Actions */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search HSN/SAC codes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={exportHsnSacCodes}>
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                    
                    <Button variant="outline" onClick={() => document.getElementById('import-file').click()}>
                      <Upload className="w-4 h-4 mr-2" />
                      Import
                    </Button>
                    <input
                      id="import-file"
                      type="file"
                      accept=".csv"
                      onChange={importHsnSacCodes}
                      className="hidden"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* HSN/SAC Codes List */}
            <Card>
              <CardHeader>
                <CardTitle>HSN/SAC Codes ({filteredCodes.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Code</th>
                        <th className="text-left p-2">Description</th>
                        <th className="text-left p-2">Tax Rate</th>
                        <th className="text-left p-2">Type</th>
                        <th className="text-left p-2">Category</th>
                        <th className="text-left p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCodes.map((code) => (
                        <tr key={code.id} className="border-b hover:bg-gray-50">
                          <td className="p-2">
                            {editingCode === code.id ? (
                              <Input
                                value={code.code}
                                onChange={(e) => {
                                  const updated = filteredCodes.map(c => 
                                    c.id === code.id ? {...c, code: e.target.value} : c
                                  );
                                  setHsnSacCodes([...hsnSacCodes.filter(c => !filteredCodes.find(fc => fc.id === c.id)), ...updated]);
                                }}
                                className="w-20"
                              />
                            ) : (
                              <span className="font-mono">{code.code}</span>
                            )}
                          </td>
                          <td className="p-2">
                            {editingCode === code.id ? (
                              <Input
                                value={code.description}
                                onChange={(e) => {
                                  const updated = filteredCodes.map(c => 
                                    c.id === code.id ? {...c, description: e.target.value} : c
                                  );
                                  setHsnSacCodes([...hsnSacCodes.filter(c => !filteredCodes.find(fc => fc.id === c.id)), ...updated]);
                                }}
                              />
                            ) : (
                              <span>{code.description}</span>
                            )}
                          </td>
                          <td className="p-2">
                            {editingCode === code.id ? (
                              <Input
                                type="number"
                                value={code.taxRate}
                                onChange={(e) => {
                                  const updated = filteredCodes.map(c => 
                                    c.id === code.id ? {...c, taxRate: parseFloat(e.target.value) || 0} : c
                                  );
                                  setHsnSacCodes([...hsnSacCodes.filter(c => !filteredCodes.find(fc => fc.id === c.id)), ...updated]);
                                }}
                                className="w-20"
                                step="0.01"
                              />
                            ) : (
                              <span>{code.taxRate}%</span>
                            )}
                          </td>
                          <td className="p-2">
                            <Badge variant={code.type === 'HSN' ? 'default' : 'secondary'}>
                              {code.type}
                            </Badge>
                          </td>
                          <td className="p-2">
                            {editingCode === code.id ? (
                              <Input
                                value={code.category || ''}
                                onChange={(e) => {
                                  const updated = filteredCodes.map(c => 
                                    c.id === code.id ? {...c, category: e.target.value} : c
                                  );
                                  setHsnSacCodes([...hsnSacCodes.filter(c => !filteredCodes.find(fc => fc.id === c.id)), ...updated]);
                                }}
                              />
                            ) : (
                              <span>{code.category || '-'}</span>
                            )}
                          </td>
                          <td className="p-2">
                            <div className="flex gap-1">
                              {editingCode === code.id ? (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => updateHsnSacCode(code.id, code)}
                                    disabled={loading}
                                  >
                                    <Save className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setEditingCode(null);
                                      loadHsnSacCodes();
                                    }}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setEditingCode(code.id)}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => deleteHsnSacCode(code.id)}
                                    disabled={loading}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {filteredCodes.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      {searchTerm ? 'No HSN/SAC codes found matching your search.' : 'No HSN/SAC codes configured yet.'}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tax Rates Tab */}
        <TabsContent value="tax-rates">
          <Card>
            <CardHeader>
              <CardTitle>Tax Rates Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <AlertDescription>
                    Tax rates are automatically calculated based on HSN/SAC codes. 
                    For intra-state transactions: CGST + SGST = Total Tax Rate. 
                    For inter-state transactions: IGST = Total Tax Rate.
                  </AlertDescription>
                </Alert>
                
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">HSN/SAC Code</th>
                        <th className="text-left p-2">Description</th>
                        <th className="text-left p-2">Total Rate</th>
                        <th className="text-left p-2">CGST</th>
                        <th className="text-left p-2">SGST</th>
                        <th className="text-left p-2">IGST</th>
                        <th className="text-left p-2">Cess</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hsnSacCodes.map((code) => {
                        const cgstRate = code.taxRate / 2;
                        const sgstRate = code.taxRate / 2;
                        const igstRate = code.taxRate;
                        
                        return (
                          <tr key={code.id} className="border-b hover:bg-gray-50">
                            <td className="p-2 font-mono">{code.code}</td>
                            <td className="p-2">{code.description}</td>
                            <td className="p-2 font-semibold">{code.taxRate}%</td>
                            <td className="p-2">{cgstRate}%</td>
                            <td className="p-2">{sgstRate}%</td>
                            <td className="p-2">{igstRate}%</td>
                            <td className="p-2">0%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  
                  {hsnSacCodes.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No HSN/SAC codes configured yet. Add codes in the HSN/SAC tab to see tax rates.
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GSTConfig;