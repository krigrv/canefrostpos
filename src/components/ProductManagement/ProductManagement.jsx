import React, { useState, useEffect } from 'react'
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
  Badge
} from '@/components/ui'
import {
  Plus as AddIcon,
  Edit as EditIcon,
  Trash2 as DeleteIcon,
  Search as SearchIcon,
  Save,
  X
} from 'lucide-react'
import { useInventory } from '../../hooks/useInventory'
import toast from 'react-hot-toast'

function ProductManagement() {
  const { products, addProduct, updateProduct, deleteProduct } = useInventory()
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  // Dynamically get unique categories from products
  const categories = React.useMemo(() => {
    const uniqueCategories = [...new Set(products.map(product => product.category))]
    return uniqueCategories.sort()
  }, [products])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    taxPercentage: 12,
    stock: 0,
    size: '',
    type: ''
  })

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !selectedCategory || selectedCategory === 'all' || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

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
        type: product.type || ''
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
        type: ''
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
      type: ''
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
      type: formData.type
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
  const MobileProductCard = ({ product }) => (
    <div className="bg-white p-3 mb-3 rounded-lg shadow-sm border border-gray-200">
      <div className="flex justify-between items-start mb-2">
        <div>
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
        <div className="font-semibold text-green-600">₹{product.price}</div>
      </div>
      
      <div className="flex justify-between items-center mt-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">GST: {product.taxPercentage === 0 ? 'No GST' : `${product.taxPercentage || 12}%`}</span>
          <Badge 
            variant={product.stock > 10 ? "default" : product.stock > 0 ? "secondary" : "destructive"}
            className="text-xs h-6 font-semibold"
          >
            {product.stock || 0}
          </Badge>
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
        </div>
       </div>

      {/* Search and Filter */}
      <div className="bg-white p-3 md:p-6 mb-4 md:mb-6 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6 items-center">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 text-sm md:text-base"
            />
          </div>
          <div>
             <Label htmlFor="category-select" className="text-sm md:text-base block mb-1">Category</Label>
             <Select value={selectedCategory} onValueChange={setSelectedCategory}>
               <SelectTrigger className="text-sm md:text-base">
                 <SelectValue placeholder="Select category" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="all">All Categories</SelectItem>
                 {categories.map(category => (
                   <SelectItem key={category} value={category}>{category}</SelectItem>
                 ))}
               </SelectContent>
             </Select>
           </div>
         </div>
       </div>

      {/* Conditional rendering based on screen size */}
      {isMobile ? (
        // Mobile card view
        <div className="space-y-3">
          {filteredProducts.map((product) => (
            <MobileProductCard key={product.id} product={product} />
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
                 <TableHead className="font-semibold text-xs md:text-sm text-gray-700 py-3 md:py-4">Name</TableHead>
                 <TableHead className="font-semibold text-xs md:text-sm text-gray-700 py-3 md:py-4">Category</TableHead>
                 <TableHead className="font-semibold text-xs md:text-sm text-gray-700 py-3 md:py-4">Size</TableHead>
                 <TableHead className="font-semibold text-xs md:text-sm text-gray-700 py-3 md:py-4">Price (₹)</TableHead>
                 <TableHead className="font-semibold text-xs md:text-sm text-gray-700 py-3 md:py-4">GST (%)</TableHead>
                 <TableHead className="font-semibold text-xs md:text-sm text-gray-700 py-3 md:py-4">Stock</TableHead>
                 <TableHead className="font-semibold text-xs md:text-sm text-gray-700 py-3 md:py-4">Actions</TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
               {filteredProducts.map((product) => (
                 <TableRow 
                   key={product.id}
                   className="hover:bg-gray-50 transition-colors"
                  >
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
                      <Badge 
                        variant={product.stock > 10 ? "default" : product.stock > 0 ? "secondary" : "destructive"}
                        className="text-xs md:text-sm h-6 md:h-7 font-semibold"
                      >
                        {product.stock || 0}
                      </Badge>
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
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
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
      </div>
    );
  }

export default ProductManagement