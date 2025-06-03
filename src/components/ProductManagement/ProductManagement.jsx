import React, { useState, useEffect, useRef, useMemo, lazy, Suspense } from 'react'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
  Checkbox
} from '@/components/ui'
import {
  Plus as AddIcon,
  Plus,
  Edit as EditIcon,
  Trash2 as DeleteIcon,
  Search as SearchIcon,
  Save,
  X,
  Download as ExportIcon,
  Eye as VisibilityIcon,
  EyeOff as HideIcon,
  DollarSign as PriceIcon,
  Filter as FilterIcon,
  Settings
} from 'lucide-react'
import { useInventory } from '../../hooks/useInventory'
import { useAdvancedDeviceDetection } from '../../hooks/useDeviceDetection'
import toast from 'react-hot-toast'
import { uploadCSVProducts } from '../../utils/simpleCSVUpload'

const ProductManagement = React.memo(() => {
  const { 
    products, 
    addProduct, 
    updateProduct, 
    deleteProduct, 
    categories, 
    addCategory, 
    deleteCategory,
    getCategoriesForDropdown 
  } = useInventory()
  const deviceInfo = useAdvancedDeviceDetection()
  const { isMobile, isTablet, orientation } = deviceInfo
  
  // Determine if we should show mobile filter layout
  const showMobileFilters = isMobile || (isTablet && orientation === 'portrait')
  
  // Categories are now managed through InventoryContext
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [stockFilter, setStockFilter] = useState('all')
  const [visibilityFilter, setVisibilityFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [selectedProducts, setSelectedProducts] = useState(new Set())
  const [bulkPriceDialogOpen, setBulkPriceDialogOpen] = useState(false)
  const [bulkPrice, setBulkPrice] = useState('')
  const [filterDialogOpen, setFilterDialogOpen] = useState(false)
  const [createCategoryDialogOpen, setCreateCategoryDialogOpen] = useState(false)
  const [manageCategoriesDialogOpen, setManageCategoriesDialogOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef(null)
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    taxPercentage: 12,
    stock: 0,
    size: '',
    type: '',
    visibility: 'shown'
  })

  const handleCSVUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return
    
    try {
      setIsUploading(true)
      await uploadCSVProducts(file, addProduct)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('CSV upload error:', error)
    } finally {
      setIsUploading(false)
    }
  }

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !selectedCategory || selectedCategory === 'all' || product.category.toLowerCase() === selectedCategory
    
    // Stock filter logic
    let matchesStock = true
    if (stockFilter === 'in-stock') {
      matchesStock = product.stock > 0
    } else if (stockFilter === 'out-of-stock') {
      matchesStock = product.stock === 0
    } else if (stockFilter === 'partially-out-of-stock') {
      matchesStock = product.stock > 0 && product.stock <= 10 // Low stock threshold
    }
    
    // Visibility filter logic
    let matchesVisibility = true
    if (visibilityFilter === 'shown') {
      matchesVisibility = product.visibility === 'shown' || !product.visibility // Default to shown if not set
    } else if (visibilityFilter === 'hidden') {
      matchesVisibility = product.visibility === 'hidden'
    }
    
    return matchesSearch && matchesCategory && matchesStock && matchesVisibility
  })

  // Bulk operations
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedProducts(new Set(filteredProducts.map(p => p.id)))
    } else {
      setSelectedProducts(new Set())
    }
  }

  const handleSelectProduct = (productId, checked) => {
    const newSelected = new Set(selectedProducts)
    if (checked) {
      newSelected.add(productId)
    } else {
      newSelected.delete(productId)
    }
    setSelectedProducts(newSelected)
  }

  const handleBulkDelete = async () => {
    if (selectedProducts.size === 0) return
    if (window.confirm(`Are you sure you want to delete ${selectedProducts.size} products?`)) {
      try {
        for (const productId of selectedProducts) {
          await deleteProduct(productId)
        }
        setSelectedProducts(new Set())
        toast.success(`${selectedProducts.size} products deleted successfully`)
      } catch (error) {
        toast.error('Failed to delete some products')
      }
    }
  }

  const handleBulkVisibility = async (visibility) => {
    if (selectedProducts.size === 0) return
    try {
      for (const productId of selectedProducts) {
        const product = products.find(p => p.id === productId)
        if (product) {
          await updateProduct(productId, { ...product, visibility })
        }
      }
      setSelectedProducts(new Set())
      toast.success(`${selectedProducts.size} products visibility updated`)
    } catch (error) {
      toast.error('Failed to update visibility for some products')
    }
  }

  const handleBulkPriceUpdate = async () => {
    if (selectedProducts.size === 0 || !bulkPrice) return
    try {
      for (const productId of selectedProducts) {
        const product = products.find(p => p.id === productId)
        if (product) {
          await updateProduct(productId, { ...product, price: parseFloat(bulkPrice) })
        }
      }
      setSelectedProducts(new Set())
      setBulkPriceDialogOpen(false)
      setBulkPrice('')
      toast.success(`${selectedProducts.size} products price updated`)
    } catch (error) {
      toast.error('Failed to update price for some products')
    }
  }

  const handleBulkExport = () => {
    if (selectedProducts.size === 0) return
    const selectedProductsData = products.filter(p => selectedProducts.has(p.id))
    const csvContent = [
      ['Name', 'Category', 'Size', 'Price', 'GST %', 'Stock', 'Visibility'].join(','),
      ...selectedProductsData.map(p => [
        p.name,
        p.category,
        p.size || '',
        p.price,
        p.taxPercentage || 12,
        p.stock || 0,
        p.visibility || 'shown'
      ].join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `products_export_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success(`${selectedProducts.size} products exported`)
  }

  const isAllSelected = filteredProducts.length > 0 && selectedProducts.size === filteredProducts.length
  const isIndeterminate = selectedProducts.size > 0 && selectedProducts.size < filteredProducts.length

  const handleOpenDialog = (product = null) => {
    if (product) {
      setEditingProduct(product)
      setFormData({
        name: product.name,
        category: product.category,
        price: product.price,
        taxPercentage: product.taxPercentage || 12,
        stock: product.stock || 0,
        size: product.size || '',
        type: product.type || '',
        visibility: product.visibility || 'shown'
      })
    } else {
      setEditingProduct(null)
      setFormData({
        name: '',
        category: '',
        price: '',
        taxPercentage: 12,
        stock: 0,
        size: '',
        type: '',
        visibility: 'shown'
      })
    }
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingProduct(null)
    setFormData({
      name: '',
      category: '',
      price: '',
      taxPercentage: 12,
      stock: 0,
      size: '',
      type: '',
      visibility: 'shown'
    })
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    if (!formData.name || !formData.category || !formData.price) {
      toast.error('Please fill in all required fields')
      return
    }

    const productData = {
      name: formData.name,
      category: formData.category,
      price: parseFloat(formData.price),
      taxPercentage: parseFloat(formData.taxPercentage),
      stock: parseInt(formData.stock),
      size: formData.size,
      type: formData.type,
      visibility: formData.visibility
    }

    try {
      if (editingProduct) {
        // Pass the ID correctly to updateProduct
        await updateProduct(editingProduct.id, productData)
        toast.success('Product updated successfully')
      } else {
        await addProduct(productData)
        toast.success('Product added successfully')
      }
      handleCloseDialog()
    } catch (error) {
      console.error('Error saving product:', error)
      toast.error(`Failed to ${editingProduct ? 'update' : 'add'} product: ${error.message || 'Unknown error'}`)
    }
  }

  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(productId)
        toast.success('Product deleted successfully')
      } catch (error) {
        console.error('Error deleting product:', error)
        toast.error(`Failed to delete product: ${error.message || 'Unknown error'}`)
      }
    }
  }

  // Mobile card view for products
  const MobileProductCard = ({ product, isSelected, onSelect }) => (
    <div className="bg-white p-3 mb-3 rounded-lg shadow-sm border border-gray-200">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-start gap-3 flex-1">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onSelect}
            className="mt-1"
          />
          <div className="flex-1">
            <h3 className="font-medium text-gray-900">{product.name}</h3>
            <div className="flex flex-wrap gap-1 mt-1">
              <Badge variant="outline" className="text-xs h-6">
                {product.category}
              </Badge>
              {product.size && (
                <Badge variant="outline" className="text-xs h-6 bg-blue-50 text-blue-700 border-blue-200">
                  {product.size}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="font-semibold text-green-600">₹{product.price}</div>
      </div>
      
      <div className="flex justify-between items-center mt-3">
        <div className="flex flex-col gap-2">
          <span className="text-xs text-gray-500">GST: {product.taxPercentage === 0 ? 'No GST' : `${product.taxPercentage || 12}%`}</span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                product.stock > 10 ? 'bg-green-500' : 
                product.stock > 0 ? 'bg-yellow-500' : 'bg-red-500'
              }`}></div>
              <span className="text-xs font-medium text-gray-700">
                Stock: {product.stock || 0}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {product.visibility === 'shown' ? (
                <HideIcon className="h-3 w-3 text-blue-500" />
              ) : (
                <VisibilityIcon className="h-3 w-3 text-gray-400" />
              )}
              <span className="text-xs text-gray-600">
                {product.visibility === 'shown' ? 'Shown' : 'Not Shown'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenDialog(product)}
            className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50"
          >
            <EditIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(product.id)}
            className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
          >
            <DeleteIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="p-3 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center mb-4 md:mb-6 gap-3 md:gap-0">
        <h1 className="text-xl md:text-3xl font-semibold text-gray-800 mb-2 md:mb-0">
          Product Management
        </h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <Button
            onClick={() => handleOpenDialog()}
            className="text-sm py-2 min-h-10 w-full md:w-auto"
          >
            <AddIcon className="w-4 h-4 mr-2" />
            Add Product
          </Button>
          
          {/* CSV Upload Button */}
          <div className="relative">
            <input
              type="file"
              accept=".csv"
              ref={fileInputRef}
              onChange={handleCSVUpload}
              className="hidden"
              id="csv-upload"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="text-sm py-2 min-h-10 w-full md:w-auto"
            >
              {isUploading ? (
                <span className="flex items-center">
                  <span className="animate-spin mr-2">⏳</span>
                  Uploading...
                </span>
              ) : (
                <>
                  <ExportIcon className="w-4 h-4 mr-2" />
                  Import CSV
                </>
              )}
            </Button>
          </div>
        </div>
       </div>

      {/* Search and Filter */}
      <div className="bg-white p-4 md:p-6 mb-6 md:mb-8 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 items-end">
          <div className="relative">
            <Label className="text-sm md:text-base block mb-2">Search</Label>
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              <Input
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-sm md:text-base h-10"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="category-select" className="text-sm md:text-base block mb-2">Category</Label>
            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="text-sm md:text-base h-10">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {getCategoriesForDropdown().map(category => (
                    <SelectItem key={category.value} value={category.value}>{category.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCreateCategoryDialogOpen(true)}
                className="h-10 px-3 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setManageCategoriesDialogOpen(true)}
                className="h-10 px-3 whitespace-nowrap"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
          {/* Desktop/Landscape Tablet Filters */}
          {!showMobileFilters && (
            <>
              <div>
                <Label className="text-sm md:text-base block mb-2">Inventory</Label>
                <Select value={stockFilter} onValueChange={setStockFilter}>
                  <SelectTrigger className="text-sm md:text-base h-10">
                    <SelectValue placeholder="Select inventory status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="in-stock">In Stock</SelectItem>
                    <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                    <SelectItem value="partially-out-of-stock">Partially Out</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm md:text-base block mb-2">Visibility</Label>
                <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
                  <SelectTrigger className="text-sm md:text-base h-10">
                    <SelectValue placeholder="Select visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <span>All</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="shown">
                      <div className="flex items-center gap-2">
                        <VisibilityIcon className="w-4 h-4" />
                        <span>Visible</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="hidden">
                      <div className="flex items-center gap-2">
                        <HideIcon className="w-4 h-4" />
                        <span>Hidden</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          
          {/* Mobile/Portrait Tablet Filter Button */}
          {showMobileFilters && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilterDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <FilterIcon className="w-4 h-4" />
                Filters
                {(stockFilter !== 'all' || visibilityFilter !== 'all') && (
                  <Badge variant="secondary" className="ml-1 px-1 py-0 text-xs">
                    {[stockFilter !== 'all' ? 1 : 0, visibilityFilter !== 'all' ? 1 : 0].reduce((a, b) => a + b, 0)}
                  </Badge>
                )}
              </Button>
            </div>
          )}
         </div>
       </div>

      {/* Bulk Actions */}
      {selectedProducts.size > 0 && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900">
              {selectedProducts.size} product{selectedProducts.size > 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  // Toggle visibility based on first selected product's current state
                  const firstProduct = products.find(p => selectedProducts.has(p.id))
                  const newVisibility = firstProduct?.visibility === 'shown' ? 'hidden' : 'shown'
                  handleBulkVisibility(newVisibility)
                }}
                className="text-gray-600 border-gray-300 hover:bg-gray-100"
              >
                {(() => {
                  const firstProduct = products.find(p => selectedProducts.has(p.id))
                  return firstProduct?.visibility === 'shown' ? (
                    <HideIcon className="w-4 h-4" />
                  ) : (
                    <VisibilityIcon className="w-4 h-4" />
                  )
                })()}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleBulkDelete}
                className="text-gray-600 border-gray-300 hover:bg-gray-100"
              >
                <DeleteIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Conditional rendering based on screen size */}
      {isMobile ? (
        // Mobile card view
        <div className="space-y-3">
          {filteredProducts.map((product) => (
            <MobileProductCard 
              key={product.id} 
              product={product} 
              isSelected={selectedProducts.has(product.id)}
              onSelect={(checked) => handleSelectProduct(product.id, checked)}
            />
          ))}
          {filteredProducts.length === 0 && (
            <div className="text-center py-8 text-gray-500">No products found</div>
          )}
        </div>
      ) : (
        // Desktop table view
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
          <Table>
            <TableHeader>
               <TableRow className="bg-gray-50">
                 <TableHead className="w-12 px-4">
                   <div className="flex justify-center">
                     <Checkbox
                       checked={isAllSelected}
                       onCheckedChange={handleSelectAll}
                       ref={(el) => {
                         if (el) el.indeterminate = isIndeterminate
                       }}
                     />
                   </div>
                 </TableHead>
                 <TableHead className="font-semibold text-xs md:text-sm text-gray-700 py-3 md:py-4">Name</TableHead>
                 <TableHead className="font-semibold text-xs md:text-sm text-gray-700 py-3 md:py-4">Category</TableHead>
                 <TableHead className="font-semibold text-xs md:text-sm text-gray-700 py-3 md:py-4">Size</TableHead>
                 <TableHead className="font-semibold text-xs md:text-sm text-gray-700 py-3 md:py-4">Price (₹)</TableHead>
                 <TableHead className="font-semibold text-xs md:text-sm text-gray-700 py-3 md:py-4">GST (%)</TableHead>
                 <TableHead className="font-semibold text-xs md:text-sm text-gray-700 py-3 md:py-4">Status</TableHead>
                 <TableHead className="font-semibold text-xs md:text-sm text-gray-700 py-3 md:py-4">Actions</TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
               {filteredProducts.map((product) => (
                 <TableRow 
                   key={product.id}
                   className="hover:bg-gray-50 transition-colors"
                  >
                    <TableCell className="px-4">
                      <div className="flex justify-center">
                        <Checkbox
                          checked={selectedProducts.has(product.id)}
                          onCheckedChange={(checked) => handleSelectProduct(product.id, checked)}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-xs md:text-sm py-3 md:py-4 font-medium text-gray-900">{product.name}</TableCell>
                    <TableCell className="py-3 md:py-4">
                      <Badge variant="outline" className="text-xs md:text-sm h-6 md:h-7">
                        {product.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 md:py-4">
                      {product.size ? (
                        <Badge variant="outline" className="text-xs md:text-sm h-6 md:h-7 bg-blue-50 text-blue-700 border-blue-200">
                          {product.size}
                        </Badge>
                      ) : (
                        <span className="text-xs md:text-sm text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs md:text-sm py-3 md:py-4 font-semibold text-green-600">₹{product.price}</TableCell>
                    <TableCell className="text-xs md:text-sm py-3 md:py-4 text-gray-500">{product.taxPercentage === 0 ? 'No GST' : `${product.taxPercentage || 12}%`}</TableCell>
                    <TableCell className="py-3 md:py-4">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            product.stock > 10 ? 'bg-green-500' : 
                            product.stock > 0 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}></div>
                          <span className="text-xs md:text-sm font-medium text-gray-700">
                            Stock: {product.stock || 0}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {product.visibility === 'shown' ? (
                            <HideIcon className="h-4 w-4 text-blue-500" />
                          ) : (
                            <VisibilityIcon className="h-4 w-4 text-gray-400" />
                          )}
                          <span className="text-xs md:text-sm text-gray-600">
                            {product.visibility === 'shown' ? 'Shown' : 'Not Shown'}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 md:py-4">
                      <div className="flex gap-1 md:gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(product)}
                          className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50"
                        >
                          <EditIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(product.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                        >
                          <DeleteIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredProducts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">No products found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Bulk Price Update Dialog */}
        <Dialog open={bulkPriceDialogOpen} onOpenChange={setBulkPriceDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Update Price for Selected Products</DialogTitle>
              <DialogDescription>
                Set a new price for {selectedProducts.size} selected product{selectedProducts.size > 1 ? 's' : ''}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="bulk-price">New Price (₹)</Label>
                <Input
                  id="bulk-price"
                  type="number"
                  step="0.01"
                  value={bulkPrice}
                  onChange={(e) => setBulkPrice(e.target.value)}
                  placeholder="Enter new price"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBulkPriceDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleBulkPriceUpdate}>
                Update Price
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add/Edit Product Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-md max-w-[95vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
              <DialogDescription>
                {editingProduct ? 'Update the product information below.' : 'Fill in the details to add a new product.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Enter product name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {getCategoriesForDropdown().map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="price">Price (₹)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  placeholder="Enter price"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="size">Size</Label>
                <Input
                  id="size"
                  value={formData.size}
                  onChange={(e) => setFormData({...formData, size: e.target.value})}
                  placeholder="Enter size (e.g., 250ml, 1kg, Large)"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="type">Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="citrus">Citrus</SelectItem>
                    <SelectItem value="berries">Berries</SelectItem>
                    <SelectItem value="tropical">Tropical</SelectItem>
                    <SelectItem value="spiced, herbal & others">Spiced/Herbal/Others</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="visibility">Visibility</Label>
                <Select value={formData.visibility} onValueChange={(value) => setFormData(prev => ({ ...prev, visibility: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shown">Shown in online store</SelectItem>
                    <SelectItem value="hidden">Not shown in online store</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="gst">GST</Label>
                <Select value={formData.taxPercentage.toString()} onValueChange={(value) => setFormData({...formData, taxPercentage: parseFloat(value)})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select GST rate" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No GST</SelectItem>
                    <SelectItem value="5">GST 5%</SelectItem>
                    <SelectItem value="12">GST 12%</SelectItem>
                    <SelectItem value="18">GST 18%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="stock">Stock</Label>
                <Input
                  id="stock"
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({...formData, stock: e.target.value})}
                  placeholder="Enter stock quantity"
                />
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={handleCloseDialog} className="w-full sm:w-auto">
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave} className="w-full sm:w-auto">
                <Save className="w-4 h-4 mr-2" />
                {editingProduct ? 'Update' : 'Add'} Product
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Mobile Filter Dialog */}
        <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FilterIcon className="w-5 h-5" />
                Filter Products
              </DialogTitle>
              <DialogDescription>
                Apply filters to narrow down your product list
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Inventory Filter */}
              <div>
                <Label className="text-base font-medium block mb-3">Inventory Status</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'All', value: 'all' },
                    { label: 'In Stock', value: 'in-stock' },
                    { label: 'Out of Stock', value: 'out-of-stock' },
                    { label: 'Partially Out', value: 'partially-out-of-stock' }
                  ].map((option) => (
                    <Button
                      key={option.value}
                      variant={stockFilter === option.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setStockFilter(option.value)}
                      className={`transition-all duration-200 text-xs ${
                        stockFilter === option.value 
                          ? 'bg-blue-600 text-white shadow-md' 
                          : 'hover:bg-blue-50 hover:border-blue-300'
                      }`}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Visibility Filter */}
              <div>
                <Label className="text-base font-medium block mb-3">Visibility</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'All', value: 'all' },
                    { label: 'Shown', value: 'shown' },
                    { label: 'Not Shown', value: 'hidden' }
                  ].map((option) => (
                    <Button
                      key={option.value}
                      variant={visibilityFilter === option.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setVisibilityFilter(option.value)}
                      className={`transition-all duration-200 text-xs ${
                        visibilityFilter === option.value 
                          ? 'bg-blue-600 text-white shadow-md' 
                          : 'hover:bg-blue-50 hover:border-blue-300'
                      }`}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            
            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setStockFilter('all')
                  setVisibilityFilter('all')
                }}
                className="flex-1"
              >
                Clear All
              </Button>
              <Button
                onClick={() => setFilterDialogOpen(false)}
                className="flex-1"
              >
                Apply Filters
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Category Dialog */}
        <Dialog open={createCategoryDialogOpen} onOpenChange={setCreateCategoryDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Category</DialogTitle>
              <DialogDescription>
                Add a new category for your products.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="category-name" className="text-sm font-medium">Category Name</Label>
                <Input
                  id="category-name"
                  placeholder="Enter category name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            
            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setCreateCategoryDialogOpen(false)
                  setNewCategoryName('')
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (newCategoryName.trim()) {
                    try {
                      // Actually save to Firebase
                      await addCategory({
                        name: newCategoryName.trim(),
                        description: `Custom category: ${newCategoryName.trim()}`
                      })
                      
                      // Update local form state
                      setFormData(prev => ({ ...prev, category: newCategoryName.trim() }))
                      setSelectedCategory(newCategoryName.trim())
                      setCreateCategoryDialogOpen(false)
                      setNewCategoryName('')
                      // Success toast is already handled by addCategory function
                    } catch (error) {
                      toast.error('Failed to create category')
                    }
                  } else {
                    toast.error('Please enter a category name')
                  }
                }}
                className="flex-1"
                disabled={!newCategoryName.trim()}
              >
                Create Category
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Manage Categories Dialog */}
        <Dialog open={manageCategoriesDialogOpen} onOpenChange={setManageCategoriesDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Manage Categories</DialogTitle>
              <DialogDescription>
                View and delete existing categories. Note: Categories with products cannot be deleted.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {categories.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No categories found</p>
              ) : (
                categories.map((category) => (
                  <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{category.name}</h4>
                      {category.description && (
                        <p className="text-xs text-gray-500 mt-1">{category.description}</p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          await deleteCategory(category.id)
                          // Success toast is handled by deleteCategory function
                        } catch (error) {
                          toast.error('Failed to delete category')
                        }
                      }}
                      className="ml-2 h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <DeleteIcon className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setManageCategoriesDialogOpen(false)}
                className="w-full"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  })

ProductManagement.displayName = "ProductManagement";

export default ProductManagement