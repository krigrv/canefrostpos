import React, { useState } from 'react'
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Chip,
  InputAdornment,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  useTheme,
  useMediaQuery
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material'
import { useInventory } from '../../hooks/useInventory'
import toast from 'react-hot-toast'

function ProductManagement() {
  const { products, addProduct, updateProduct, deleteProduct, uploadAllInventoryToFirebase } = useInventory()
  const theme = useTheme()
  const isXsScreen = useMediaQuery(theme.breakpoints.down('sm'))
  
  // Dynamically get unique categories from products
  const categories = React.useMemo(() => {
    const uniqueCategories = [...new Set(products.map(product => product.category))]
    return uniqueCategories.sort()
  }, [products])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    barcode: '',
    taxPercentage: 12,
    stock: 0
  })

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.barcode.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleOpenDialog = (product = null) => {
    if (product) {
      setEditingProduct(product)
      setFormData({
        name: product.name,
        category: product.category,
        price: product.price,
        barcode: product.barcode,
        taxPercentage: product.taxPercentage || 12,
        stock: product.stock || 0
      })
    } else {
      setEditingProduct(null)
      setFormData({
        name: '',
        category: '',
        price: '',
        barcode: '',
        taxPercentage: 12,
        stock: 0
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
      barcode: '',
      taxPercentage: 12,
      stock: 0
    })
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    if (!formData.name || !formData.category || !formData.price || !formData.barcode) {
      toast.error('Please fill in all required fields')
      return
    }

    const productData = {
      name: formData.name,
      category: formData.category,
      price: parseFloat(formData.price),
      barcode: formData.barcode,
      taxPercentage: parseFloat(formData.taxPercentage),
      stock: parseInt(formData.stock)
    }

    try {
      if (editingProduct) {
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

  return (
    <Box>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'stretch', md: 'center' }, 
        mb: 3,
        gap: { xs: 2, md: 0 }
      }}>
        <Typography 
          variant="h4" 
          sx={{ 
            fontSize: { xs: '1.5rem', md: '2rem' },
            fontWeight: 600,
            color: '#1F2937',
            mb: { xs: 1, md: 0 }
          }}
        >
          Product Management
        </Typography>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 1, sm: 2 },
          width: { xs: '100%', md: 'auto' }
        }}>

          <Button
            variant="outlined"
            color="primary"
            onClick={uploadAllInventoryToFirebase}
            sx={{
              fontSize: { xs: '0.75rem', md: '0.875rem' },
              py: { xs: 1, md: 0.75 },
              minHeight: { xs: 40, md: 36 }
            }}
          >
            Upload All Inventory
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon sx={{ fontSize: { xs: 18, md: 20 } }} />}
            onClick={() => handleOpenDialog()}
            sx={{
              fontSize: { xs: '0.75rem', md: '0.875rem' },
              py: { xs: 1, md: 0.75 },
              minHeight: { xs: 40, md: 36 },
              fontWeight: 600
            }}
          >
            Add Product
          </Button>
        </Box>
      </Box>

      {/* Search and Filter */}
      <Paper sx={{ 
        p: { xs: 2, md: 3 }, 
        mb: 3,
        borderRadius: 2,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <Grid container spacing={{ xs: 2, md: 3 }} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search by name or barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  fontSize: { xs: '0.875rem', md: '1rem' },
                  '& fieldset': {
                    borderColor: '#E5E7EB'
                  },
                  '&:hover fieldset': {
                    borderColor: '#9CA3AF'
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#3B82F6'
                  }
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ 
                      color: '#6B7280',
                      fontSize: { xs: 20, md: 24 }
                    }} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>Category</InputLabel>
              <Select
                value={selectedCategory}
                label="Category"
                onChange={(e) => setSelectedCategory(e.target.value)}
                sx={{
                  borderRadius: 2,
                  fontSize: { xs: '0.875rem', md: '1rem' },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#E5E7EB'
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#9CA3AF'
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#3B82F6'
                  }
                }}
              >
                <MenuItem value="All">All Categories</MenuItem>
                {categories.map(category => (
                  <MenuItem key={category} value={category}>{category}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Products Table */}
      <TableContainer 
        component={Paper} 
        sx={{ 
          borderRadius: 2,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          overflowX: 'auto',
          '&::-webkit-scrollbar': {
            height: 8
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: '#F3F4F6'
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#D1D5DB',
            borderRadius: 4
          }
        }}
      >
        <Table sx={{ minWidth: { xs: 700, md: 'auto' } }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#F9FAFB' }}>
              <TableCell sx={{ 
                fontWeight: 600,
                fontSize: { xs: '0.75rem', md: '0.875rem' },
                color: '#374151',
                py: { xs: 1.5, md: 2 }
              }}>Name</TableCell>
              <TableCell sx={{ 
                fontWeight: 600,
                fontSize: { xs: '0.75rem', md: '0.875rem' },
                color: '#374151',
                py: { xs: 1.5, md: 2 }
              }}>Category</TableCell>
              <TableCell sx={{ 
                fontWeight: 600,
                fontSize: { xs: '0.75rem', md: '0.875rem' },
                color: '#374151',
                py: { xs: 1.5, md: 2 }
              }}>Price (₹)</TableCell>
              <TableCell sx={{ 
                fontWeight: 600,
                fontSize: { xs: '0.75rem', md: '0.875rem' },
                color: '#374151',
                py: { xs: 1.5, md: 2 }
              }}>Barcode</TableCell>
              <TableCell sx={{ 
                fontWeight: 600,
                fontSize: { xs: '0.75rem', md: '0.875rem' },
                color: '#374151',
                py: { xs: 1.5, md: 2 }
              }}>Tax (%)</TableCell>
              <TableCell sx={{ 
                fontWeight: 600,
                fontSize: { xs: '0.75rem', md: '0.875rem' },
                color: '#374151',
                py: { xs: 1.5, md: 2 }
              }}>Stock</TableCell>
              <TableCell sx={{ 
                fontWeight: 600,
                fontSize: { xs: '0.75rem', md: '0.875rem' },
                color: '#374151',
                py: { xs: 1.5, md: 2 }
              }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredProducts.map((product) => (
              <TableRow 
                key={product.id}
                sx={{
                  '&:hover': {
                    backgroundColor: '#F9FAFB'
                  },
                  '&:last-child td, &:last-child th': {
                    border: 0
                  }
                }}
              >
                <TableCell sx={{ 
                  fontSize: { xs: '0.75rem', md: '0.875rem' },
                  py: { xs: 1.5, md: 2 },
                  fontWeight: 500,
                  color: '#111827'
                }}>{product.name}</TableCell>
                <TableCell sx={{ py: { xs: 1.5, md: 2 } }}>
                  <Chip 
                    label={product.category} 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                    sx={{
                      fontSize: { xs: '0.625rem', md: '0.75rem' },
                      height: { xs: 24, md: 28 }
                    }}
                  />
                </TableCell>
                <TableCell sx={{ 
                  fontSize: { xs: '0.75rem', md: '0.875rem' },
                  py: { xs: 1.5, md: 2 },
                  fontWeight: 600,
                  color: '#059669'
                }}>₹{product.price}</TableCell>
                <TableCell sx={{ 
                  fontSize: { xs: '0.75rem', md: '0.875rem' },
                  py: { xs: 1.5, md: 2 },
                  fontFamily: 'monospace',
                  color: '#6B7280'
                }}>{product.barcode}</TableCell>
                <TableCell sx={{ 
                  fontSize: { xs: '0.75rem', md: '0.875rem' },
                  py: { xs: 1.5, md: 2 },
                  color: '#6B7280'
                }}>{product.taxPercentage || 12}%</TableCell>
                <TableCell sx={{ py: { xs: 1.5, md: 2 } }}>
                  <Chip 
                    label={product.stock || 0} 
                    size="small" 
                    color={product.stock > 10 ? 'success' : product.stock > 0 ? 'warning' : 'error'}
                    sx={{
                      fontSize: { xs: '0.625rem', md: '0.75rem' },
                      height: { xs: 24, md: 28 },
                      fontWeight: 600
                    }}
                  />
                </TableCell>
                <TableCell sx={{ py: { xs: 1.5, md: 2 } }}>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton
                      color="primary"
                      onClick={() => handleOpenDialog(product)}
                      size="small"
                      sx={{
                        p: { xs: 0.5, md: 1 },
                        '&:hover': {
                          backgroundColor: 'rgba(59, 130, 246, 0.1)'
                        }
                      }}
                    >
                      <EditIcon sx={{ fontSize: { xs: 16, md: 20 } }} />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleDelete(product.id)}
                      size="small"
                      sx={{
                        p: { xs: 0.5, md: 1 },
                        '&:hover': {
                          backgroundColor: 'rgba(239, 68, 68, 0.1)'
                        }
                      }}
                    >
                      <DeleteIcon sx={{ fontSize: { xs: 16, md: 20 } }} />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Product Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
        fullScreen={isXsScreen}
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: { xs: 0, sm: 2 },
            margin: { xs: 0, sm: 2 },
            maxHeight: { xs: '100vh', sm: '90vh' }
          }
        }}
      >
        <DialogTitle sx={{
          fontSize: { xs: '1.25rem', md: '1.5rem' },
          fontWeight: 600,
          color: '#1F2937',
          borderBottom: '1px solid #E5E7EB',
          pb: 2
        }}>
          {editingProduct ? 'Edit Product' : 'Add New Product'}
        </DialogTitle>
        <DialogContent sx={{ 
          p: { xs: 2, md: 3 },
          '&.MuiDialogContent-root': {
            paddingTop: { xs: 2, md: 3 }
          }
        }}>
          <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mt: 0 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Product Name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    fontSize: { xs: '0.875rem', md: '1rem' }
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: { xs: '0.875rem', md: '1rem' }
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>Category</InputLabel>
                <Select
                  value={formData.category}
                  label="Category"
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  sx={{
                    borderRadius: 2,
                    fontSize: { xs: '0.875rem', md: '1rem' }
                  }}
                >
                  {categories.map(category => (
                    <MenuItem key={category} value={category}>{category}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Price"
                type="number"
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    fontSize: { xs: '0.875rem', md: '1rem' }
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: { xs: '0.875rem', md: '1rem' }
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Barcode"
                value={formData.barcode}
                onChange={(e) => handleInputChange('barcode', e.target.value)}
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    fontSize: { xs: '0.875rem', md: '1rem' }
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: { xs: '0.875rem', md: '1rem' }
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Tax Percentage"
                type="number"
                value={formData.taxPercentage}
                onChange={(e) => handleInputChange('taxPercentage', e.target.value)}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    fontSize: { xs: '0.875rem', md: '1rem' }
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: { xs: '0.875rem', md: '1rem' }
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Stock Quantity"
                type="number"
                value={formData.stock}
                onChange={(e) => handleInputChange('stock', e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    fontSize: { xs: '0.875rem', md: '1rem' }
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: { xs: '0.875rem', md: '1rem' }
                  }
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ 
          p: { xs: 2, md: 3 },
          borderTop: '1px solid #E5E7EB',
          gap: { xs: 1, md: 2 },
          flexDirection: { xs: 'column', sm: 'row' }
        }}>
          <Button 
            onClick={handleCloseDialog} 
            startIcon={<CancelIcon sx={{ fontSize: { xs: 18, md: 20 } }} />}
            sx={{
              fontSize: { xs: '0.875rem', md: '1rem' },
              py: { xs: 1.5, md: 1 },
              px: { xs: 3, md: 2 },
              minHeight: { xs: 44, md: 40 },
              width: { xs: '100%', sm: 'auto' },
              order: { xs: 2, sm: 1 }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            startIcon={<SaveIcon sx={{ fontSize: { xs: 18, md: 20 } }} />}
            sx={{
              fontSize: { xs: '0.875rem', md: '1rem' },
              py: { xs: 1.5, md: 1 },
              px: { xs: 3, md: 2 },
              minHeight: { xs: 44, md: 40 },
              width: { xs: '100%', sm: 'auto' },
              order: { xs: 1, sm: 2 },
              fontWeight: 600
            }}
          >
            {editingProduct ? 'Update' : 'Add'} Product
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ProductManagement