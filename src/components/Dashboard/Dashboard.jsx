import React, { useState, useMemo } from 'react'
import {
  Grid,
  Paper,
  Typography,
  Box,
  TextField,
  InputAdornment,
  Chip,
  Card,
  CardContent,
  CardActions,
  Button,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  ToggleButtonGroup,
  ToggleButton,
  FormControlLabel,
  Checkbox
} from '@mui/material'
import {
  Search as SearchIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  ShoppingCart as CartIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material'
import { useInventory } from '../../hooks/useInventory'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { v4 as uuidv4 } from 'uuid'

// Import SVG icons
import CitrusIcon from '../../../svg/citrus.svg'
import BerriesIcon from '../../../svg/berries.svg'
import TropicalIcon from '../../../svg/tropical.svg'
import SpicedHerbalOthersIcon from '../../../svg/spicedherbalothers.svg'

function Dashboard() {
  const {
    products,
    cart,
    loading,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    getCartTotal,
    getCartTax,
    getCategoryGroup
  } = useInventory()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [checkoutDialog, setCheckoutDialog] = useState(false)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [receiptDialog, setReceiptDialog] = useState(false)
  const [lastSale, setLastSale] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [showReceipt, setShowReceipt] = useState(false)
  const [includePackaging, setIncludePackaging] = useState(true) // Default to true to suggest packaging charge
  
  // Helper function to get product size
  const getProductSize = (productName) => {
    const name = productName.toLowerCase()
    if (name.includes('240ml') || name.includes('240 ml')) {
      return '240ml'
    } else if (name.includes('500ml') || name.includes('500 ml') || name.includes('cane fusion')) {
      return '500ml'
    } else if (name.includes('1 litre') || name.includes('1litre') || name.includes('1000ml')) {
      return '1 Litre'
    }
    return null
  }

  // Calculate dynamic packaging charge based on 500ml bottles (excluding water bottles)
  const getPackagingCharge = () => {
    // First check if cart has any items
    if (cart.length === 0) return 0;
    
    const bottleCount = cart.reduce((count, item) => {
      const size = getProductSize(item.name)
      const isWaterBottle = item.name.toLowerCase().includes('water')
      
      // Only charge for 500ml products that are NOT water bottles
      if (size === '500ml' && !isWaterBottle) {
        return count + item.quantity
      }
      return count
    }, 0)
    
    // Return ₹10 per 500ml bottle (excluding water bottles)
    return bottleCount * 10
  }
  
  const packagingCharge = getPackagingCharge()

  // Get unique category-size combinations from products (memoized to prevent re-renders)
  const categoryFilters = useMemo(() => {
    const filterSet = new Set()
    products.forEach(product => {
      const size = getProductSize(product.name)
      if (size) {
        filterSet.add(`${product.category} - ${size}`)
      } else {
        filterSet.add(product.category)
      }
    })
    return ['All', ...Array.from(filterSet).sort()]
  }, [products])

  // Filter and sort products based on search and combined category-size filter
  const filteredProducts = useMemo(() => {
    return products
      .filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
        
        if (selectedCategory === 'All') {
          return matchesSearch
        }
        
        const size = getProductSize(product.name)
        const productFilter = size ? `${product.category} - ${size}` : product.category
        const matchesFilter = productFilter === selectedCategory
        
        return matchesSearch && matchesFilter
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [products, searchTerm, selectedCategory])

  // Calculate total with optional packaging charge
  const getCartTotalWithPackaging = () => {
    const baseTotal = getCartTotal()
    return includePackaging ? baseTotal + packagingCharge : baseTotal
  }

  // Calculate tax with optional packaging charge
  const getCartTaxWithPackaging = () => {
    const baseTax = getCartTax()
    if (includePackaging) {
      // Add tax for packaging charge (12% of 10 Rs = 1.2 Rs)
      const packagingTax = packagingCharge * 0.12
      return baseTax + packagingTax
    }
    return baseTax
  }

  const handlePrintReceipt = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty')
      return
    }

    setProcessingPayment(true)
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Create items array with optional packaging charge
      const saleItems = [...cart]
      if (includePackaging) {
        saleItems.push({
          id: 'packaging',
          name: 'PACKAGING CHARGE',
          price: packagingCharge,
          quantity: 1,
          category: 'Others'
        })
      }
      
      const sale = {
        id: uuidv4(),
        items: saleItems,
        subtotal: getCartTotalWithPackaging() - getCartTaxWithPackaging(),
        tax: getCartTaxWithPackaging(),
        total: getCartTotalWithPackaging(),
        timestamp: new Date(),
        paymentMethod: paymentMethod,
        packagingIncluded: includePackaging
      }

      // In a real app, you would save this to Firestore
      console.log('Sale completed:', sale)
      
      setLastSale(sale)
      setShowReceipt(true)
      toast.success('Transaction completed successfully!')
    } catch (error) {
      toast.error('Transaction failed. Please try again.')
    } finally {
      setProcessingPayment(false)
    }
  }

  const handleCloseCheckout = () => {
    console.log('handleCloseCheckout called')
    setCheckoutDialog(false)
    setShowReceipt(false)
    if (showReceipt && lastSale) {
      clearCart()
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Point of Sale
      </Typography>

      <Grid container spacing={3}>
        {/* Products Section */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, mb: 2 }}>
            {/* Search and Filter */}
            <Box 
              sx={{ 
                mb: 3,
                p: 3,
                background: '#F9FAFB',
                borderRadius: 2,
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
              }}
            >
              <TextField
                fullWidth
                placeholder="Search products by name, category, or size..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="primary" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#FFFFFF',
                    borderRadius: 1,
                    '&:hover': {
                      boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                    },
                    '& fieldset': {
                      borderColor: '#E5E7EB'
                    },
                    '&:hover fieldset': {
                      borderColor: '#111827'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#111827'
                    }
                  }
                }}
              />
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 'bold', color: '#111827' }}>
                  Filter by Category & Size
                </Typography>
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                  {categoryFilters.map(filter => (
                    <Chip
                      key={filter}
                      label={filter}
                      onClick={() => setSelectedCategory(filter)}
                      color={selectedCategory === filter ? 'primary' : 'default'}
                      variant={selectedCategory === filter ? 'filled' : 'outlined'}
                      sx={{
                        fontWeight: selectedCategory === filter ? 'bold' : 'normal',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                        }
                      }}
                    />
                  ))}
                </Box>
              </Box>
            </Box>

            {/* Products Grouped by Category */}
            {(() => {
              // Group filtered products by category group
              const groupedProducts = {}
              const categoryGroups = ['citrus', 'berries', 'tropical', 'spiced, herbal & others']
              
              // Initialize groups
              categoryGroups.forEach(group => {
                groupedProducts[group] = []
              })
              
              // Group products
              filteredProducts.forEach(product => {
                const group = getCategoryGroup(product.name)
                if (groupedProducts[group]) {
                  groupedProducts[group].push(product)
                }
              })
              
              // Get icon for category group
              const getCategoryGroupIcon = (groupName) => {
                switch(groupName) {
                  case 'citrus':
                    return CitrusIcon
                  case 'berries':
                    return BerriesIcon
                  case 'tropical':
                    return TropicalIcon
                  case 'spiced, herbal & others':
                    return SpicedHerbalOthersIcon
                  default:
                    return null
                }
              }
              
              return categoryGroups.map(group => {
                const products = groupedProducts[group]
                if (products.length === 0) return null
                
                const iconSrc = getCategoryGroupIcon(group)
                
                return (
                  <Box key={group} sx={{ mb: 4 }}>
                    {/* Category Group Header */}
                    <Box sx={{ 
                       display: 'flex', 
                       alignItems: 'center', 
                       gap: 1.5, 
                       mb: 1.5,
                       p: 0.75,
                       backgroundColor: 'transparent'
                     }}>
                      {iconSrc && (
                        <img 
                          src={iconSrc} 
                          alt={group} 
                          style={{ 
                            width: 20, 
                            height: 20,
                            filter: 'brightness(0) saturate(100%) invert(18%) sepia(95%) saturate(1352%) hue-rotate(127deg) brightness(96%) contrast(101%)'
                          }} 
                        />
                      )}
                      <Typography variant="subtitle1" sx={{ 
                        fontWeight: '500', 
                        color: '#374151',
                        textTransform: 'capitalize',
                        fontSize: '0.9rem'
                      }}>
                        {group}
                      </Typography>
                      <Typography variant="caption" sx={{ 
                        color: '#6B7280',
                        fontSize: '0.7rem'
                      }}>
                        {products.length} items
                      </Typography>
                    </Box>
                    
                    {/* Products Grid for this group */}
                    <Grid container spacing={2}>
                      {products.map(product => (
                        <Grid item xs={12} sm={6} md={4} key={product.id}>
                          <Card 
                            sx={{ 
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              borderRadius: 1,
                              overflow: 'hidden',
                              border: '1px solid #E5E7EB',
                              boxShadow: 'none',
                              '&:hover': {
                                borderColor: '#3B82F6',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                              }
                            }}
                            onClick={(e) => {
                              console.log('Card clicked:', product.name)
                              e.preventDefault()
                              e.stopPropagation()
                              try {
                                addToCart(product)
                                console.log('Product added to cart successfully:', product.name)
                              } catch (error) {
                                console.error('Error adding to cart:', error)
                              }
                            }}
                          >
                            <CardContent sx={{ p: 1.5 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 'bold', lineHeight: 1.2, fontSize: '0.9rem' }}>
                                  {product.name}
                                </Typography>
                                {getProductSize(product.name) && (
                                  <Chip 
                                    label={getProductSize(product.name)} 
                                    size="small" 
                                    color="secondary" 
                                    variant="outlined"
                                    sx={{ 
                                      fontWeight: '500',
                                      fontSize: '0.65rem',
                                      height: '20px',
                                      '& .MuiChip-label': {
                                        px: 0.5,
                                        fontSize: '0.65rem'
                                      }
                                    }}
                                  />
                                )}
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ 
                                  backgroundColor: '#F3F4F6',
                                  color: '#374151',
                                  px: 1,
                                  py: 0.25,
                                  borderRadius: 1,
                                  fontWeight: 'medium',
                                  fontSize: '0.7rem'
                                }}>
                                  {product.category}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="h5" color="primary" sx={{ fontWeight: 'bold' }}>
                                  ₹{product.price}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <Typography variant="caption" color={product.stock > 10 ? 'success.main' : product.stock > 0 ? 'warning.main' : 'error.main'} fontWeight="medium">
                                    Stock: {product.stock || 0}
                                  </Typography>
                                </Box>
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )
              })
            })()}
          </Paper>
        </Grid>

        {/* Cart Section */}
        <Grid item xs={12} md={4}>
          <Paper 
            elevation={1}
            sx={{ 
              p: 2, 
              position: 'sticky', 
              top: 100,
              borderRadius: 1,
              background: '#FFFFFF',
              color: '#111827',
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <CartIcon sx={{ mr: 1.5, fontSize: 24, color: '#111827' }} />
              <Typography variant="h6" fontWeight="600" sx={{ color: '#111827' }}>
                Cart ({cart.length})
              </Typography>
            </Box>
            
            <Divider sx={{ mb: 2, borderColor: '#E5E7EB' }} />

            {cart.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" sx={{ mb: 1.5, opacity: 0.9 }}>
                  Your cart is empty
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.7 }}>
                  Click on products to add them to your cart
                </Typography>
              </Box>
            ) : (
              <>
                <List sx={{ maxHeight: 300, overflow: 'auto', '& .MuiListItem-root': { borderRadius: 1, mb: 0.5, backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB' } }}>
                  {cart.map(item => (
                    <ListItem key={item.id} sx={{ px: 1.5, py: 0.75 }}>
                      <ListItemText
                        primary={
                          <Typography variant="body2" fontWeight="500" sx={{ color: '#111827', fontSize: '0.85rem' }}>
                            {item.name}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="caption" sx={{ color: '#6B7280', fontSize: '0.7rem' }}>
                            ₹{item.price} each
                          </Typography>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <IconButton
                            size="small"
                            onClick={() => {
                              updateCartQuantity(item.id, item.quantity - 1)
                            }}
                            sx={{ 
                              backgroundColor: '#3B82F6',
                              color: 'white',
                              width: 24,
                              height: 24,
                              '&:hover': { backgroundColor: '#2563EB' }
                            }}
                          >
                            <RemoveIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                          <Typography variant="body2" fontWeight="500" sx={{ minWidth: 24, textAlign: 'center', color: '#111827', fontSize: '0.8rem' }}>
                            {item.quantity}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => {
                              updateCartQuantity(item.id, item.quantity + 1)
                            }}
                            sx={{ 
                              backgroundColor: '#3B82F6',
                              color: 'white',
                              width: 24,
                              height: 24,
                              '&:hover': { backgroundColor: '#2563EB' }
                            }}
                          >
                            <AddIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => {
                              removeFromCart(item.id)
                            }}
                            sx={{ 
                              backgroundColor: '#EF4444',
                              color: 'white',
                              ml: 0.5,
                              width: 24,
                              height: 24,
                              '&:hover': { backgroundColor: '#DC2626' }
                            }}
                          >
                            <DeleteIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Box>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>

                <Divider sx={{ my: 1.5 }} />

                <Box sx={{ 
                  backgroundColor: 'surface.variant', 
                  borderRadius: 1, 
                  p: 1.5, 
                  mb: 1.5,
                  border: '1px solid',
                  borderColor: 'outline.variant'
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body1" sx={{ color: 'text.primary' }}>
                      Items ({cart.reduce((sum, item) => sum + item.quantity, 0)}{includePackaging ? ' + Packaging' : ''}):
                    </Typography>
                    <Typography variant="body1" fontWeight="500" sx={{ color: 'text.primary' }}>
                      ₹{getCartTotalWithPackaging().toFixed(2)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Subtotal (excl. tax):
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      ₹{(getCartTotalWithPackaging() - getCartTaxWithPackaging()).toFixed(2)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Tax (12% included):
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      ₹{getCartTaxWithPackaging().toFixed(2)}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h6" fontWeight="600" sx={{ color: 'text.primary' }}>
                      Total:
                    </Typography>
                    <Typography variant="h4" fontWeight="600" sx={{ color: 'primary.main' }}>
                      ₹{getCartTotalWithPackaging().toFixed(2)}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      clearCart()
                    }}
                    sx={{ 
                       flex: 1,
                       color: 'text.primary',
                       borderColor: 'outline.main',
                       '&:hover': {
                         borderColor: 'primary.main',
                         backgroundColor: 'primary.light'
                       }
                     }}
                  >
                    Clear
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => {
                      setCheckoutDialog(true)
                    }}
                    startIcon={<ReceiptIcon />}
                    sx={{
                       flex: 2,
                       backgroundColor: 'primary.main',
                       color: 'primary.contrastText',
                       fontWeight: '500',
                       '&:hover': {
                         backgroundColor: 'primary.dark'
                       }
                     }}
                  >
                    Checkout
                  </Button>
                </Box>
              </>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Checkout Dialog */}
      <Dialog 
        open={checkoutDialog} 
        onClose={() => handleCloseCheckout()}
        maxWidth={showReceipt ? "md" : "sm"} 
        fullWidth
        PaperProps={{
           sx: {
             borderRadius: 1,
             backgroundColor: 'background.paper',
             color: 'text.primary'
           }
         }}
      >
        <DialogTitle sx={{ 
          textAlign: 'center', 
          pb: 1,
          backgroundColor: 'surface.variant',
          borderRadius: '4px 4px 0 0'
        }}>
          <Typography variant="h5" fontWeight="600" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, color: 'text.primary' }}>
            {showReceipt ? 'Transaction Summary' : 'Order Summary'}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 2 }}>
          {!showReceipt ? (
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1, color: 'text.primary' }}>
                Items
              </Typography>
              <Box sx={{ 
                 backgroundColor: 'surface.variant', 
                 borderRadius: 1, 
                 p: 1.5, 
                 mb: 1.5,
                 border: '1px solid',
                 borderColor: 'outline.variant'
               }}>
                {cart.map(item => (
                  <Box key={item.id} sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    mb: 1.5,
                    p: 1,
                    backgroundColor: 'background.paper',
                    borderRadius: 1
                  }}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="500" sx={{ color: 'text.primary' }}>
                        {item.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        ₹{item.price} × {item.quantity}
                      </Typography>
                    </Box>
                    <Typography variant="h6" fontWeight="500" sx={{ color: 'primary.main' }}>
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </Typography>
                  </Box>
                ))}
              </Box>
              
              {/* Payment Method Selection */}
              <Typography variant="h6" gutterBottom sx={{ mb: 1.5, color: 'text.primary' }}>
                Payment Method
              </Typography>
              <Box sx={{ mb: 2 }}>
                <ToggleButtonGroup
                  value={paymentMethod}
                  exclusive
                  onChange={(event, newPaymentMethod) => {
                    if (newPaymentMethod !== null) {
                      setPaymentMethod(newPaymentMethod)
                    }
                  }}
                  sx={{ mb: 2, width: '100%' }}
                >
                  <ToggleButton 
                    value="Cash" 
                    sx={{ 
                      flex: 1, 
                      py: 1.5,
                      '&.Mui-selected': {
                        backgroundColor: '#000000',
                        color: '#ffffff',
                        '&:hover': {
                          backgroundColor: '#333333'
                        }
                      }
                    }}
                  >
                    <Typography variant="body1" fontWeight="500">Cash</Typography>
                  </ToggleButton>
                  <ToggleButton 
                    value="UPI" 
                    sx={{ 
                      flex: 1, 
                      py: 1.5,
                      '&.Mui-selected': {
                        backgroundColor: '#000000',
                        color: '#ffffff',
                        '&:hover': {
                          backgroundColor: '#333333'
                        }
                      }
                    }}
                  >
                    <Typography variant="body1" fontWeight="500">UPI</Typography>
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>
              
              <Divider sx={{ my: 2, borderColor: 'outline.variant' }} />
              
              <Box sx={{ 
                 backgroundColor: 'surface.variant', 
                 borderRadius: 1, 
                 p: 1.5,
                 border: '1px solid',
                 borderColor: 'outline.variant'
               }}>
                {/* Packaging Charge Suggestion */}
              <Box sx={{ 
                 backgroundColor: '#fffde7', 
                 borderRadius: 1, 
                 p: 1.5, 
                 mb: 2,
                 border: '1px solid',
                 borderColor: '#fbc02d'
               }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={includePackaging}
                      onChange={(e) => setIncludePackaging(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1" fontWeight="500" sx={{ color: 'text.primary' }}>
                        Add Packaging Charge (Recommended)
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        ₹{packagingCharge} - Eco-friendly packaging for your order
                      </Typography>
                    </Box>
                  }
                />
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body1" sx={{ color: 'text.primary' }}>Subtotal (excl. tax):</Typography>
                <Typography variant="body1" fontWeight="500" sx={{ color: 'text.primary' }}>₹{(getCartTotalWithPackaging() - getCartTaxWithPackaging()).toFixed(2)}</Typography>
              </Box>
              {includePackaging && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary', ml: 2 }}>• Packaging Charge:</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>₹{packagingCharge.toFixed(2)}</Typography>
                </Box>
              )}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Tax (12%):</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>₹{getCartTaxWithPackaging().toFixed(2)}</Typography>
              </Box>
              <Divider sx={{ my: 1, borderColor: 'outline.variant' }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h5" fontWeight="600" sx={{ color: 'text.primary' }}>Total:</Typography>
                <Typography variant="h4" fontWeight="600" sx={{ color: 'primary.main' }}>
                  ₹{getCartTotalWithPackaging().toFixed(2)}
                </Typography>
              </Box>
              </Box>
            </Box>
          ) : (
            /* Receipt Preview - 80mm Thermal Printer Format */
            lastSale && (
              <Box sx={{ 
                fontFamily: 'monospace', 
                fontSize: '11px', 
                lineHeight: 1.1,
                color: 'black',
                backgroundColor: 'white',
                border: '1px solid #ddd',
                p: 1,
                borderRadius: 0,
                width: '80mm',
                maxWidth: '80mm',
                margin: '0 auto',
                maxHeight: '70vh',
                overflow: 'auto'
              }}>
                {/* Receipt Header */}
                <Box sx={{ textAlign: 'center', mb: 1, borderBottom: '1px dashed #333', pb: 1 }}>
                  <Typography sx={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 'bold', letterSpacing: '1px' }}>
                    {(() => {
                      const businessDetails = JSON.parse(localStorage.getItem('businessDetails') || '{}')
                      return businessDetails.businessName || 'CANEFROST POS'
                    })()}
                  </Typography>
                  <Typography sx={{ fontFamily: 'monospace', fontSize: '9px' }}>
                    Fresh Juice & Beverages
                  </Typography>
                  <Typography sx={{ fontFamily: 'monospace', fontSize: '8px' }}>
                    {(() => {
                      const businessDetails = JSON.parse(localStorage.getItem('businessDetails') || '{}')
                      return businessDetails.phoneNumber ? `Tel: ${businessDetails.phoneNumber}` : 'Tel: +91-XXXXXXXXXX'
                    })()}
                  </Typography>
                  {(() => {
                    const businessDetails = JSON.parse(localStorage.getItem('businessDetails') || '{}')
                    return businessDetails.businessAddress && (
                      <Typography sx={{ fontFamily: 'monospace', fontSize: '8px', mt: 0.5 }}>
                        {businessDetails.businessAddress}
                      </Typography>
                    )
                  })()}
                  {(() => {
                    const businessDetails = JSON.parse(localStorage.getItem('businessDetails') || '{}')
                    return businessDetails.gstin && (
                      <Typography sx={{ fontFamily: 'monospace', fontSize: '8px' }}>
                        GSTIN: {businessDetails.gstin}
                      </Typography>
                    )
                  })()}
                  {(() => {
                    const businessDetails = JSON.parse(localStorage.getItem('businessDetails') || '{}')
                    return businessDetails.fssaiNumber && (
                      <Typography sx={{ fontFamily: 'monospace', fontSize: '8px' }}>
                        FSSAI: {businessDetails.fssaiNumber}
                      </Typography>
                    )
                  })()}
                </Box>

                {/* Receipt Details */}
                <Box sx={{ mb: 1 }}>
                  <Typography sx={{ fontFamily: 'monospace', fontSize: '8px' }}>
                    Bill No: {lastSale.id.slice(-8).toUpperCase()}
                  </Typography>
                  <Typography sx={{ fontFamily: 'monospace', fontSize: '8px' }}>
                    Date: {format(lastSale.timestamp, 'dd/MM/yyyy HH:mm:ss')}
                  </Typography>
                  <Typography sx={{ fontFamily: 'monospace', fontSize: '8px' }}>
                    Cashier: Admin
                  </Typography>
                </Box>

                {/* Items */}
                <Box sx={{ borderTop: '1px dashed #333', borderBottom: '1px dashed #333', py: 0.5, mb: 1 }}>
                  <Typography sx={{ fontFamily: 'monospace', fontSize: '9px', fontWeight: 'bold', mb: 0.5, textAlign: 'center' }}>
                    ================================
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography sx={{ fontFamily: 'monospace', fontSize: '8px', fontWeight: 'bold' }}>ITEM</Typography>
                    <Typography sx={{ fontFamily: 'monospace', fontSize: '8px', fontWeight: 'bold' }}>QTY</Typography>
                    <Typography sx={{ fontFamily: 'monospace', fontSize: '8px', fontWeight: 'bold' }}>RATE</Typography>
                    <Typography sx={{ fontFamily: 'monospace', fontSize: '8px', fontWeight: 'bold' }}>AMT</Typography>
                  </Box>
                  <Typography sx={{ fontFamily: 'monospace', fontSize: '9px', fontWeight: 'bold', mb: 0.5, textAlign: 'center' }}>
                    ================================
                  </Typography>
                  {lastSale.items.map((item, index) => (
                    <Box key={index} sx={{ mb: 0.3 }}>
                      <Typography sx={{ fontFamily: 'monospace', fontSize: '8px', wordBreak: 'break-word' }}>
                        {item.name.length > 32 ? item.name.substring(0, 32) + '...' : item.name}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography sx={{ fontFamily: 'monospace', fontSize: '8px', width: '20%' }}>
                          {item.quantity}
                        </Typography>
                        <Typography sx={{ fontFamily: 'monospace', fontSize: '8px', width: '25%', textAlign: 'right' }}>
                          ₹{item.price.toFixed(2)}
                        </Typography>
                        <Typography sx={{ fontFamily: 'monospace', fontSize: '8px', width: '25%', textAlign: 'right' }}>
                          ₹{(item.quantity * item.price).toFixed(2)}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                  <Typography sx={{ fontFamily: 'monospace', fontSize: '9px', fontWeight: 'bold', mt: 0.5, textAlign: 'center' }}>
                    ================================
                  </Typography>
                </Box>

                {/* Totals */}
                <Box sx={{ mb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
                    <Typography sx={{ fontFamily: 'monospace', fontSize: '8px' }}>
                      Subtotal:
                    </Typography>
                    <Typography sx={{ fontFamily: 'monospace', fontSize: '8px' }}>
                      ₹{lastSale.subtotal.toFixed(2)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
                    <Typography sx={{ fontFamily: 'monospace', fontSize: '8px' }}>
                      Tax (12%):
                    </Typography>
                    <Typography sx={{ fontFamily: 'monospace', fontSize: '8px' }}>
                      ₹{lastSale.tax.toFixed(2)}
                    </Typography>
                  </Box>
                  <Typography sx={{ fontFamily: 'monospace', fontSize: '9px', fontWeight: 'bold', textAlign: 'center', my: 0.5 }}>
                    ================================
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontFamily: 'monospace', fontSize: '10px', fontWeight: 'bold' }}>
                      TOTAL:
                    </Typography>
                    <Typography sx={{ fontFamily: 'monospace', fontSize: '10px', fontWeight: 'bold' }}>
                      ₹{lastSale.total.toFixed(2)}
                    </Typography>
                  </Box>
                  <Typography sx={{ fontFamily: 'monospace', fontSize: '9px', fontWeight: 'bold', textAlign: 'center', mt: 0.5 }}>
                    ================================
                  </Typography>
                </Box>

                {/* Payment Method */}
                <Box sx={{ mb: 1, borderTop: '1px dashed #333', pt: 0.5 }}>
                  <Typography sx={{ fontFamily: 'monospace', fontSize: '8px' }}>
                    Payment: {lastSale.paymentMethod}
                  </Typography>
                  <Typography sx={{ fontFamily: 'monospace', fontSize: '8px' }}>
                    Paid: ₹{lastSale.total.toFixed(2)}
                  </Typography>
                  <Typography sx={{ fontFamily: 'monospace', fontSize: '8px' }}>
                    Change: ₹0.00
                  </Typography>
                </Box>

                {/* Footer */}
                <Box sx={{ textAlign: 'center', borderTop: '1px dashed #333', pt: 0.5 }}>
                  <Typography sx={{ fontFamily: 'monospace', fontSize: '8px' }}>
                    Thank you for your purchase!
                  </Typography>
                  <Typography sx={{ fontFamily: 'monospace', fontSize: '8px' }}>
                    Visit us again soon!
                  </Typography>
                  <Typography sx={{ fontFamily: 'monospace', fontSize: '7px', mt: 0.5 }}>
                    ** CUSTOMER COPY **
                  </Typography>
                  <Typography sx={{ fontFamily: 'monospace', fontSize: '7px', mt: 0.5 }}>
                    Powered by Canefrost POS
                  </Typography>
                </Box>
              </Box>
            )
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          {!showReceipt ? (
            <>
              <Button 
                onClick={() => {
                  console.log('Cancel button clicked')
                  handleCloseCheckout()
                }} 
                disabled={processingPayment}
                sx={{
                   color: 'text.primary',
                   borderColor: 'outline.main',
                   '&:hover': {
                     borderColor: 'primary.main',
                     backgroundColor: 'primary.light'
                   }
                 }}
                variant="outlined"
              >
                Cancel
              </Button>
              <Button 
                onClick={handlePrintReceipt} 
                variant="contained" 
                disabled={processingPayment}
                startIcon={processingPayment ? <CircularProgress size={20} /> : <ReceiptIcon />}
                sx={{
                   backgroundColor: 'primary.main',
                   color: 'primary.contrastText',
                   fontWeight: '500',
                   px: 4,
                   py: 1.5,
                   '&:hover': {
                     backgroundColor: 'primary.dark'
                   },
                   '&:disabled': {
                     backgroundColor: 'action.disabled',
                     color: 'text.disabled'
                   }
                 }}
              >
                {processingPayment ? 'Processing...' : 'Print Receipt'}
              </Button>
            </>
          ) : (
            <>
              <Button 
                onClick={() => {
                  console.log('Print Receipt button clicked')
                  window.print()
                }}
                variant="contained" 
                startIcon={<ReceiptIcon />}
                sx={{
                   backgroundColor: 'primary.main',
                   color: 'primary.contrastText',
                   fontWeight: '500',
                   px: 4,
                   py: 1.5,
                   '&:hover': {
                     backgroundColor: 'primary.dark'
                   }
                 }}
              >
                Print Receipt
              </Button>
              <Button 
                onClick={handleCloseCheckout} 
                variant="outlined"
                sx={{
                   color: 'text.primary',
                   borderColor: 'outline.main',
                   '&:hover': {
                     borderColor: 'primary.main',
                     backgroundColor: 'primary.light'
                   }
                 }}
              >
                Close
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>


    </Box>
  )
}

export default Dashboard