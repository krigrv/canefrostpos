import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { toast } from 'sonner';
import { 
  Map, 
  Package, 
  CheckCircle, 
  AlertCircle, 
  Download, 
  RefreshCw, 
  Search,
  Filter,
  FileText,
  Zap
} from 'lucide-react';
import { skuHsnMappingService } from '../services/skuHsnMappingService';
import gstAuditService from '../services/gstAuditService';
import HSNCodeAnalyzer from '../utils/hsnCodeAnalyzer';

const SKUHSNMapper = () => {
  const [mappingStats, setMappingStats] = useState({
    total: 0,
    mapped: 0,
    unmapped: 0,
    percentage: 0
  });
  const [unmappedProducts, setUnmappedProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [hsnCodes, setHsnCodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [autoMappingProgress, setAutoMappingProgress] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newHsnCode, setNewHsnCode] = useState('');
  const [newTaxRate, setNewTaxRate] = useState('');
  const [hsnAnalyzer] = useState(() => new HSNCodeAnalyzer());
  const [analysisResults, setAnalysisResults] = useState([]);
  const [analyzingProduct, setAnalyzingProduct] = useState(null);
  const [showAnalysisDialog, setShowAnalysisDialog] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load mapping statistics
      const stats = await skuHsnMappingService.getMappingStats();
      setMappingStats(stats);

      // Load unmapped products
      const unmapped = await skuHsnMappingService.getProductsWithoutHsn();
      setUnmappedProducts(unmapped);

      // Load all products for the complete view
      const report = await skuHsnMappingService.generateMappingReport();
      setAllProducts(report.products || []);

      // Load HSN codes
      const hsn = await gstAuditService.hsnSacService.getHsnSacCodes();
      setHsnCodes(hsn);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load mapping data');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoMapping = async () => {
    setLoading(true);
    setAutoMappingProgress(0);
    
    try {
      toast.info('Starting automatic HSN mapping...');
      
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setAutoMappingProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const result = await skuHsnMappingService.autoMapHsnCodes();
      
      clearInterval(progressInterval);
      setAutoMappingProgress(100);

      if (result.success) {
        toast.success(`Successfully mapped ${result.mapped} products to HSN codes`);
        
        // Show detailed results
        if (result.details && result.details.length > 0) {
          console.log('Mapping Details:', result.details);
        }
        
        // Reload data to reflect changes
        await loadData();
      } else {
        toast.error(`Mapping completed with errors. Mapped: ${result.mapped}`);
        if (result.errors.length > 0) {
          console.error('Mapping errors:', result.errors);
        }
      }
    } catch (error) {
      console.error('Error in auto mapping:', error);
      toast.error('Failed to auto-map HSN codes');
    } finally {
      setLoading(false);
      setTimeout(() => setAutoMappingProgress(0), 2000);
    }
  };

  const handleManualUpdate = async () => {
    if (!selectedProduct || !newHsnCode || !newTaxRate) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const result = await skuHsnMappingService.updateProductHsn(
        selectedProduct.id,
        newHsnCode,
        parseFloat(newTaxRate)
      );

      if (result.success) {
        toast.success('Product HSN code updated successfully');
        setEditDialogOpen(false);
        setSelectedProduct(null);
        setNewHsnCode('');
        setNewTaxRate('');
        await loadData();
      } else {
        toast.error('Failed to update HSN code');
      }
    } catch (error) {
      console.error('Error updating HSN code:', error);
      toast.error('Failed to update HSN code');
    }
  };

  const handleExportReport = async () => {
    try {
      const result = await skuHsnMappingService.exportMappingReport();
      if (result.success) {
        toast.success('HSN mapping report exported successfully');
      } else {
        toast.error('Failed to export report');
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Failed to export report');
    }
  };

  const openEditDialog = (product) => {
    setSelectedProduct(product);
    setNewHsnCode(product.hsnCode || '');
    setNewTaxRate(product.taxRate?.toString() || '');
    setEditDialogOpen(true);
  };

  const analyzeProductHSN = async (product) => {
    setAnalyzingProduct(product.id);
    try {
      const suggestions = await hsnAnalyzer.analyzeProduct(product);
      setAnalysisResults(suggestions);
      setSelectedProduct(product);
      setShowAnalysisDialog(true);
      toast.success(`Found ${suggestions.length} HSN code suggestions`);
    } catch (error) {
      console.error('Error analyzing product:', error);
      toast.error('Failed to analyze product for HSN codes');
    } finally {
      setAnalyzingProduct(null);
    }
  };

  const applyHSNSuggestion = (suggestion) => {
    setNewHsnCode(suggestion.hsnCode);
    setNewTaxRate(suggestion.gstRate?.toString() || '');
    setShowAnalysisDialog(false);
    setEditDialogOpen(true);
  };

  const runInventoryAnalysis = async () => {
    setLoading(true);
    try {
      const report = await hsnAnalyzer.analyzeInventory();
      console.log('Inventory Analysis Report:', report);
      toast.success(`Analyzed ${report.totalProducts} products. Found ${report.suggestions.length} suggestions.`);
      
      // You can add UI to display the full report here
      setAnalysisResults(report.suggestions);
      setShowAnalysisDialog(true);
    } catch (error) {
      console.error('Error analyzing inventory:', error);
      toast.error('Failed to analyze inventory');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = allProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'mapped' && product.status === 'Mapped') ||
                         (filterStatus === 'unmapped' && product.status === 'Unmapped');
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">SKU to HSN Mapping</h2>
          <p className="text-muted-foreground">
            Map your product SKUs to appropriate HSN codes for GST compliance
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleExportReport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mappingStats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mapped Products</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{mappingStats.mapped}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unmapped Products</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{mappingStats.unmapped}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion</CardTitle>
            <Map className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{mappingStats.percentage}%</div>
            <Progress value={mappingStats.percentage} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* HSN Analysis Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            HSN Code Analysis
          </CardTitle>
          <CardDescription>
            Analyze products using HSN code database to find accurate classifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Use the HSN code package to analyze product descriptions and find the most appropriate HSN codes with confidence scores.
              </AlertDescription>
            </Alert>
            
            <Button 
              onClick={runInventoryAnalysis} 
              disabled={loading}
              className="w-full"
              variant="outline"
            >
              {loading ? 'Analyzing...' : 'Analyze All Products for HSN Codes'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Auto Mapping Section */}
      {mappingStats.unmapped > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Automatic HSN Mapping
            </CardTitle>
            <CardDescription>
              Automatically map products to HSN codes based on category and product type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {autoMappingProgress > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Mapping Progress</span>
                    <span>{autoMappingProgress}%</span>
                  </div>
                  <Progress value={autoMappingProgress} />
                </div>
              )}
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This will automatically assign HSN codes to {mappingStats.unmapped} unmapped products 
                  based on their category and product type. You can review and modify the mappings afterwards.
                </AlertDescription>
              </Alert>
              
              <Button 
                onClick={handleAutoMapping} 
                disabled={loading || autoMappingProgress > 0}
                className="w-full"
              >
                {loading ? 'Mapping...' : `Auto-Map ${mappingStats.unmapped} Products`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Product HSN Mapping</CardTitle>
          <CardDescription>
            View and manage HSN code mappings for all products
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filter */}
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products or SKUs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                <SelectItem value="mapped">Mapped Only</SelectItem>
                <SelectItem value="unmapped">Unmapped Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Products Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>SKU/Barcode</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>HSN Code</TableHead>
                  <TableHead>Tax Rate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      {loading ? 'Loading products...' : 'No products found'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.sku || '-'}</TableCell>
                      <TableCell>{product.category || '-'}</TableCell>
                      <TableCell>{product.type || '-'}</TableCell>
                      <TableCell>
                        {product.hsnCode ? (
                          <Badge variant="outline">{product.hsnCode}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {product.taxRate ? `${product.taxRate}%` : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={product.status === 'Mapped' ? 'default' : 'secondary'}
                          className={product.status === 'Mapped' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}
                        >
                          {product.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => analyzeProductHSN(product)}
                            disabled={analyzingProduct === product.id}
                          >
                            {analyzingProduct === product.id ? 'Analyzing...' : 'Analyze'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(product)}
                          >
                            Edit
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit HSN Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit HSN Mapping</DialogTitle>
            <DialogDescription>
              Update the HSN code and tax rate for {selectedProduct?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="hsn-code">HSN Code</Label>
              <Select value={newHsnCode} onValueChange={setNewHsnCode}>
                <SelectTrigger>
                  <SelectValue placeholder="Select HSN code" />
                </SelectTrigger>
                <SelectContent>
                  {hsnCodes.map((hsn) => (
                    <SelectItem key={hsn.code} value={hsn.code}>
                      {hsn.code} - {hsn.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="tax-rate">Tax Rate (%)</Label>
              <Input
                id="tax-rate"
                type="number"
                value={newTaxRate}
                onChange={(e) => setNewTaxRate(e.target.value)}
                placeholder="Enter tax rate"
                min="0"
                max="100"
                step="0.01"
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleManualUpdate}>
                Update Mapping
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* HSN Analysis Results Dialog */}
      <Dialog open={showAnalysisDialog} onOpenChange={setShowAnalysisDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>HSN Code Analysis Results</DialogTitle>
            <DialogDescription>
              {selectedProduct ? `Analysis results for "${selectedProduct.name}"` : 'Inventory analysis results'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {analysisResults.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No HSN code suggestions found.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {analysisResults.map((result, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="font-mono">
                            {result.hsnCode}
                          </Badge>
                          <Badge 
                            variant={result.confidence >= 0.8 ? 'default' : result.confidence >= 0.6 ? 'secondary' : 'outline'}
                            className={result.confidence >= 0.8 ? 'bg-green-100 text-green-800' : result.confidence >= 0.6 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}
                          >
                            {Math.round(result.confidence * 100)}% match
                          </Badge>
                          {result.gstRate && (
                            <Badge variant="outline">
                              GST: {result.gstRate}%
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium">{result.description}</p>
                        {result.reason && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Matched: {result.reason}
                          </p>
                        )}
                        {result.productName && (
                          <p className="text-xs text-blue-600 mt-1">
                            Product: {result.productName}
                          </p>
                        )}
                      </div>
                      {selectedProduct && (
                        <Button
                          size="sm"
                          onClick={() => applyHSNSuggestion(result)}
                          className="ml-4"
                        >
                          Apply
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
            
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowAnalysisDialog(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SKUHSNMapper;