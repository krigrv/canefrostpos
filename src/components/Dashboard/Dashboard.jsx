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
  Checkbox,
  Fab,
  Badge,
  Drawer
} from '@mui/material'
import {
  Search as SearchIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  ShoppingCart as CartIcon,
  Receipt as ReceiptIcon,
  Close as CloseIcon
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
    getCartSubtotal,
    getCategoryGroup
  } = useInventory()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [checkoutDialog, setCheckoutDialog] = useState(false)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [receiptDialog, setReceiptDialog] = useState(false)
  const [lastSale, setLastSale] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [cashAmount, setCashAmount] = useState(0)
  const [upiAmount, setUpiAmount] = useState(0)
  const [showReceipt, setShowReceipt] = useState(false)
  const [includePackaging, setIncludePackaging] = useState(true) // Default to true to suggest packaging charge
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false)
  
  // Standard tax rate (12%)
  const taxRate = 0.12
  
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
        ...(paymentMethod === 'Both' && {
          cashAmount: cashAmount,
          upiAmount: upiAmount
        }),
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
    <Box sx={{ pb: { xs: 10, md: 0 } }}> {/* Add bottom padding for mobile cart */}
      <Typography 
        variant="h4" 
        gutterBottom
        className="responsive-title"
        sx={{
          fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
          fontWeight: 'bold',
          color: '#111827',
          mb: { xs: 2, md: 3 }
        }}
      >
        Point of Sale
      </Typography>

      <Grid container spacing={{ xs: 1, md: 3 }}>
        {/* Products Section - Full width on mobile */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: { xs: 0.5, md: 2 }, mb: 2, borderRadius: 2 }}>
            {/* Search and Filter */}
            <Box 
              sx={{ 
                mb: 3,
                p: { xs: 1, md: 3 },
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
                    fontSize: { xs: '0.875rem', md: '1rem' },
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
                <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 'bold', color: '#111827', fontSize: { xs: '1rem', md: '1.25rem' } }}>
                  Filter by Category & Size
                </Typography>
                <Box sx={{ 
                  display: 'flex', 
                  gap: { xs: 0.75, md: 1.5 }, 
                  flexWrap: 'wrap',
                  justifyContent: { xs: 'flex-start', sm: 'flex-start' }
                }}>
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
                  <Box key={group} sx={{ mb: { xs: 3, md: 4 } }}>
                    {/* Category Group Header */}
                    <Box sx={{ 
                       display: 'flex', 
                       alignItems: 'center', 
                       gap: 1.5, 
                       mb: { xs: 1, md: 2 },
                       p: { xs: 0.5, md: 0.75 },
                       backgroundColor: 'transparent',
                       px: { xs: 0.25, md: 0 }
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
                        fontSize: { xs: '0.85rem', md: '0.9rem' }
                      }}>
                        {group}
                      </Typography>
                      <Typography variant="caption" sx={{ 
                        color: '#6B7280',
                        fontSize: { xs: '0.65rem', md: '0.7rem' }
                      }}>
                        {products.length} items
                      </Typography>
                    </Box>
                    
                    {/* Products Grid for this group */}
                    <Grid container spacing={{ xs: 1, sm: 2, md: 3 }} className="product-grid">
                      {products.map(product => (
                        <Grid item xs={12} sm={6} md={4} lg={3} xl={2.4} key={product.id}>
                          <Card 
                            className="product-card"
                            sx={{ 
                              cursor: 'pointer',
                              transition: 'all 0.2s ease-in-out',
                              borderRadius: 3,
                              overflow: 'visible',
                              border: 'none',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                              height: '100%',
                              backgroundColor: '#FFFFFF',
                              '&:hover': {
                                transform: { xs: 'scale(1.02)', md: 'translateY(-4px)' },
                                boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
                              },
                              '&:active': {
                                transform: 'scale(0.98)',
                                transition: 'transform 0.1s ease-in-out'
                              },
                              opacity: product.stock === 0 ? 0.6 : 1,
                              minHeight: { xs: 160, sm: 180, md: 200 },
                              display: 'flex',
                              flexDirection: 'column',
                              position: 'relative'
                            }}
                            onClick={(e) => {
                              if (product.stock === 0) return
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
                            <CardContent sx={{ 
                              p: { xs: 2, md: 2.5 }, 
                              display: 'flex', 
                              flexDirection: 'column', 
                              height: '100%',
                              justifyContent: 'space-between',
                              position: 'relative',
                              '&:last-child': { pb: { xs: 2, md: 2.5 } }
                            }}>
                              {/* Quantity Badge - Top Left */}
                              {getProductSize(product.name) && (
                                <Box 
                                  sx={{ 
                                    position: 'absolute',
                                    top: -8,
                                    left: 12,
                                    backgroundColor: (getProductSize(product.name) === '500ml' || getProductSize(product.name) === '240ml') ? '#059669' : '#4A5D23',
                                    color: 'white',
                                    px: 2,
                                    py: 0.75,
                                    borderRadius: 20,
                                    fontSize: { xs: '0.75rem', md: '0.8rem' },
                                    fontWeight: '600',
                                    lineHeight: 1,
                                    zIndex: 2,
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                                  }}
                                >
                                  {getProductSize(product.name)}
                                </Box>
                              )}
                              
                              {/* Stock Badge - Top Right */}
                              <Box 
                                sx={{ 
                                  position: 'absolute',
                                  top: 12,
                                  right: 12,
                                  color: '#9CA3AF',
                                  fontSize: { xs: '0.75rem', md: '0.8rem' },
                                  fontWeight: '500'
                                }}
                              >
                                stock
                              </Box>
                              
                              {/* Main Content */}
                              <Box sx={{ mt: 3 }}>
                                {/* Product Name */}
                                <Typography 
                                  variant="h5" 
                                  component="h3" 
                                  sx={{ 
                                    fontWeight: '700', 
                                    lineHeight: 1.2, 
                                    fontSize: { xs: '1.25rem', sm: '1.4rem', md: '1.5rem' },
                                    color: '#000000',
                                    mb: 1,
                                    letterSpacing: '-0.025em',
                                    textTransform: 'capitalize'
                                  }}
                                >
                                  {product.name}
                                </Typography>
                                
                                {/* Category */}
                                <Typography 
                                   variant="body2" 
                                   sx={{ 
                                     color: '#6B7280',
                                     fontSize: { xs: '0.9rem', md: '1rem' },
                                     fontWeight: '400',
                                     mb: 2
                                  }}
                                >
                                  {product.category}
                                </Typography>
                              </Box>
                              
                              {/* Bottom Row - Price and Stock */}
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                <Typography 
                                  variant="h4" 
                                  sx={{ 
                                    fontWeight: '700',
                                    fontSize: { xs: '1.75rem', md: '2rem' },
                                    color: '#000000',
                                    lineHeight: 1,
                                    letterSpacing: '-0.025em'
                                  }}
                                >
                                  ₹{product.price}
                                </Typography>
                                
                                {/* Stock Number */}
                                <Typography 
                                  variant="h6" 
                                  sx={{
                                    color: '#6B7280',
                                    fontWeight: '500',
                                    fontSize: { xs: '1.1rem', md: '1.25rem' },
                                    lineHeight: 1
                                  }}
                                >
                                  {product.stock || 0}
                                </Typography>
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

        {/* View Cart Button - Mobile Only */}
        {cart.length > 0 && (
          <Box
            sx={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 1000,
              display: { xs: 'block', lg: 'none' },
              backgroundColor: '#FFFFFF',
              borderTop: '1px solid #E5E7EB',
              p: 2
            }}
          >
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={() => setCartDrawerOpen(true)}
              sx={{
                backgroundColor: '#059669',
                '&:hover': { backgroundColor: '#047857' },
                '&:active': { backgroundColor: '#065F46' },
                boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)',
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 'bold',
                borderRadius: 0,
                textTransform: 'none'
              }}
              startIcon={
                <Badge badgeContent={cart.reduce((sum, item) => sum + item.quantity, 0)} color="error">
                  <CartIcon />
                </Badge>
              }
            >
              View Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)})
            </Button>
          </Box>
        )}

        {/* Cart Drawer - Mobile */}
        <Drawer
          anchor="right"
          open={cartDrawerOpen}
          onClose={() => setCartDrawerOpen(false)}
          sx={{
            display: { xs: 'block', lg: 'none' },
            '& .MuiDrawer-paper': {
              width: '100vw',
              maxWidth: 400,
              backgroundColor: '#FFFFFF'
            }
          }}
        >
          <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              mb: 2,
              pb: 1,
              borderBottom: '1px solid #E5E7EB'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CartIcon sx={{ mr: 1.5, fontSize: 24, color: '#111827' }} />
                <Typography variant="h6" fontWeight="600" sx={{ color: '#111827' }}>
                  Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)})
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {cart.length > 0 && (
                  <Typography variant="caption" sx={{ color: '#6B7280' }}>
                    ₹{cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
                  </Typography>
                )}
                <IconButton onClick={() => setCartDrawerOpen(false)} size="small">
                  <CloseIcon />
                </IconButton>
              </Box>
            </Box>
            
            {cart.length === 0 ? (
              <Box sx={{ 
                textAlign: 'center', 
                py: 4,
                color: '#6B7280',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}>
                <CartIcon sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
                <Typography variant="h6" sx={{ mb: 1.5, opacity: 0.9 }}>
                  Your cart is empty
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.7 }}>
                  Add some delicious items to get started!
                </Typography>
              </Box>
            ) : (
              <>
                <List sx={{ 
                  flex: 1,
                  overflow: 'auto',
                  '& .MuiListItem-root': { 
                    borderRadius: 1, 
                    mb: 1, 
                    backgroundColor: '#F9FAFB', 
                    border: '1px solid #E5E7EB' 
                  } 
                }}>
                  {cart.map(item => (
                    <ListItem 
                      key={item.id} 
                      sx={{ 
                        px: 1.5, 
                        py: 1,
                        borderRadius: 1,
                        mb: 1,
                        backgroundColor: '#F9FAFB',
                        border: '1px solid #E5E7EB'
                      }}
                    >
                      <ListItemText
                        primaryTypographyProps={{ component: 'div' }}
                        primary={
                          <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'flex-start',
                            flexDirection: 'column',
                            gap: 1
                          }}>
                            <Typography variant="body2" component="div" sx={{ fontWeight: 'medium', color: '#111827' }}>
                              {item.name}
                            </Typography>
                            <Box sx={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center',
                              width: '100%'
                            }}>
                              <Typography variant="body2" component="div" sx={{ color: '#059669', fontWeight: 'bold' }}>
                                ₹{(item.price * item.quantity).toFixed(2)}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <IconButton
                                  size="small"
                                  onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                                  sx={{ 
                                    backgroundColor: '#FEE2E2', 
                                    color: '#DC2626',
                                    '&:hover': { backgroundColor: '#FECACA' },
                                    width: 32,
                                    height: 32
                                  }}
                                >
                                  <RemoveIcon fontSize="small" />
                                </IconButton>
                                <Typography variant="body2" component="div" sx={{ minWidth: 24, textAlign: 'center', fontWeight: 'medium' }}>
                                  {item.quantity}
                                </Typography>
                                <IconButton
                                  size="small"
                                  onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                                  sx={{ 
                                    backgroundColor: '#DCFCE7', 
                                    color: '#16A34A',
                                    '&:hover': { backgroundColor: '#BBF7D0' },
                                    width: 32,
                                    height: 32
                                  }}
                                >
                                  <AddIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => removeFromCart(item.id)}
                                  sx={{ 
                                    backgroundColor: '#FEE2E2', 
                                    color: '#DC2626',
                                    '&:hover': { backgroundColor: '#FECACA' },
                                    width: 32,
                                    height: 32,
                                    ml: 0.5
                                  }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>

                <Divider sx={{ my: 1.5 }} />

                <Box sx={{ 
                  backgroundColor: '#F9FAFB', 
                  borderRadius: 2, 
                  p: 1.5, 
                  mb: 1.5,
                  border: '1px solid #E5E7EB'
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body1" sx={{ color: '#111827' }}>
                      Items ({cart.reduce((sum, item) => sum + item.quantity, 0)}{includePackaging ? ' + Packaging' : ''}):
                    </Typography>
                    <Typography variant="body1" fontWeight="500" sx={{ color: '#111827' }}>
                      ₹{getCartTotalWithPackaging().toFixed(2)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ color: '#6B7280' }}>
                      Subtotal (excl. tax):
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#6B7280' }}>
                      ₹{getCartSubtotal().toFixed(2)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ color: '#6B7280' }}>
                      Tax ({(taxRate * 100).toFixed(1)}%):
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#6B7280' }}>
                      ₹{getCartTax().toFixed(2)}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ color: '#111827' }}>
                      Total:
                    </Typography>
                    <Typography variant="h6" fontWeight="bold" sx={{ color: '#059669' }}>
                      ₹{getCartTotal().toFixed(2)}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    onClick={clearCart}
                    sx={{
                      flex: 1,
                      backgroundColor: '#FFFFFF',
                      borderColor: '#DC2626',
                      color: '#DC2626',
                      py: 1.5,
                      fontWeight: 'bold',
                      '&:hover': {
                        backgroundColor: '#FEE2E2',
                        borderColor: '#B91C1C'
                      }
                    }}
                  >
                    Clear Cart
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => {
                      setCheckoutDialog(true);
                      setCartDrawerOpen(false);
                    }}
                    sx={{
                      flex: 2,
                      backgroundColor: '#059669',
                      py: 1.5,
                      fontWeight: 'bold',
                      '&:hover': { backgroundColor: '#047857' }
                    }}
                  >
                    Checkout
                  </Button>
                </Box>
              </>
            )}
          </Box>
        </Drawer>

        {/* Cart Section - Desktop Sidebar */}
        <Grid item xs={12} lg={4} sx={{ display: { xs: 'none', lg: 'block' } }}>
          <Paper 
            elevation={1}
            sx={{ 
              p: 2, 
              position: 'sticky',
              top: 100,
              maxHeight: 'calc(100vh - 120px)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              background: '#FFFFFF',
              color: '#111827',
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              mb: { xs: 1, md: 2 },
              pb: 1,
              borderBottom: '1px solid #E5E7EB'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CartIcon sx={{ mr: 1.5, fontSize: 24, color: '#111827' }} />
                <Typography 
                  variant="h6" 
                  fontWeight="600" 
                  sx={{ 
                    color: '#111827',
                    fontSize: { xs: '1rem', md: '1.25rem' }
                  }}
                >
                  Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)})
                </Typography>
              </Box>
              {cart.length > 0 && (
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: '#6B7280',
                    fontSize: { xs: '0.75rem', md: '0.875rem' }
                  }}
                >
                  ₹{cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
                </Typography>
              )}
            </Box>
            
            <Divider sx={{ mb: 2, borderColor: '#E5E7EB' }} />

            {cart.length === 0 ? (
              <Box sx={{ 
                textAlign: 'center', 
                py: { xs: 3, md: 4 },
                color: '#6B7280'
              }}>
                <CartIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                <Typography variant="h6" sx={{ mb: 1.5, opacity: 0.9 }}>
                  Your cart is empty
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.7, mb: 2 }}>
                  Click on products to add them to your cart
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => {
                    // Close cart drawer if on mobile
                    setCartDrawerOpen(false)
                  }}
                  sx={{
                    backgroundColor: '#059669',
                    '&:hover': { backgroundColor: '#047857' },
                    borderRadius: 2,
                    px: 3,
                    py: 1
                  }}
                >
                  Continue Shopping
                </Button>
              </Box>
            ) : (
              <>
                <List sx={{ 
                  maxHeight: { xs: '30vh', md: 300 }, 
                  overflow: 'auto', 
                  flex: 1,
                  '& .MuiListItem-root': { borderRadius: 1, mb: 0.5, backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB' } 
                }}>
                  {cart.map(item => (
                    <ListItem 
                      key={item.id} 
                      sx={{ 
                        px: { xs: 1, md: 1.5 }, 
                        py: { xs: 1, md: 0.75 },
                        borderRadius: 1,
                        mb: 0.5,
                        backgroundColor: '#F9FAFB',
                        border: '1px solid #E5E7EB'
                      }}
                    >
                      <ListItemText
                        primaryTypographyProps={{ component: 'div' }}
                        primary={
                          <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'flex-start',
                            flexDirection: { xs: 'column', sm: 'row' },
                            gap: { xs: 0.5, sm: 0 }
                          }}>
                            <Typography 
                              variant="body2" 
                              component="div"
                              sx={{ 
                                fontWeight: 'medium', 
                                color: '#111827',
                                fontSize: { xs: '0.875rem', md: '0.875rem' },
                                lineHeight: 1.2
                              }}
                            >
                              {item.name}
                            </Typography>
                            <Typography 
                              variant="body2" 
                              component="div"
                              sx={{ 
                                fontWeight: 'bold', 
                                color: '#059669',
                                fontSize: { xs: '0.875rem', md: '0.875rem' }
                              }}
                            >
                              ₹{(item.price * item.quantity).toFixed(2)}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            mt: { xs: 1, md: 0.5 },
                            flexDirection: { xs: 'column', sm: 'row' },
                            gap: { xs: 1, sm: 0 }
                          }}>
                            <Typography 
                              variant="caption" 
                              component="div"
                              sx={{ 
                                color: '#6B7280',
                                fontSize: { xs: '0.75rem', md: '0.75rem' }
                              }}
                            >
                              ₹{item.price} × {item.quantity}
                            </Typography>
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: { xs: 0.5, md: 1 },
                              justifyContent: { xs: 'center', sm: 'flex-end' }
                            }}>
                              <IconButton
                                size="small"
                                onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                                sx={{ 
                                  backgroundColor: '#FEE2E2', 
                                  color: '#DC2626',
                                  '&:hover': { backgroundColor: '#FECACA' },
                                  width: { xs: 28, md: 24 },
                                  height: { xs: 28, md: 24 },
                                  minWidth: 'unset'
                                }}
                              >
                                <RemoveIcon fontSize="small" />
                              </IconButton>
                              <Typography 
                                variant="body2" 
                                component="div"
                                sx={{ 
                                  minWidth: { xs: 24, md: 20 }, 
                                  textAlign: 'center', 
                                  fontWeight: 'medium',
                                  fontSize: { xs: '0.875rem', md: '0.875rem' }
                                }}
                              >
                                {item.quantity}
                              </Typography>
                              <IconButton
                                size="small"
                                onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                                sx={{ 
                                  backgroundColor: '#DCFCE7', 
                                  color: '#16A34A',
                                  '&:hover': { backgroundColor: '#BBF7D0' },
                                  width: { xs: 28, md: 24 },
                                  height: { xs: 28, md: 24 },
                                  minWidth: 'unset'
                                }}
                              >
                                <AddIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => removeFromCart(item.id)}
                                sx={{ 
                                  backgroundColor: '#FEE2E2', 
                                  color: '#DC2626',
                                  '&:hover': { backgroundColor: '#FECACA' },
                                  width: { xs: 28, md: 24 },
                                  height: { xs: 28, md: 24 },
                                  ml: { xs: 0.5, md: 0.5 },
                                  minWidth: 'unset'
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>

                <Divider sx={{ my: 1.5 }} />

                <Box sx={{ 
                  backgroundColor: '#F9FAFB', 
                  borderRadius: 2, 
                  p: { xs: 1.5, md: 1.5 }, 
                  mb: { xs: 1.5, md: 1.5 },
                  border: '1px solid #E5E7EB'
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        color: '#111827',
                        fontSize: { xs: '0.875rem', md: '1rem' }
                      }}
                    >
                      Items ({cart.reduce((sum, item) => sum + item.quantity, 0)}{includePackaging ? ' + Packaging' : ''}):
                    </Typography>
                    <Typography 
                      variant="body1" 
                      fontWeight="500" 
                      sx={{ 
                        color: '#111827',
                        fontSize: { xs: '0.875rem', md: '1rem' }
                      }}
                    >
                      ₹{getCartTotalWithPackaging().toFixed(2)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#6B7280',
                        fontSize: { xs: '0.75rem', md: '0.875rem' }
                      }}
                    >
                      Subtotal (excl. tax):
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#6B7280',
                        fontSize: { xs: '0.75rem', md: '0.875rem' }
                      }}
                    >
                      ₹{(getCartTotalWithPackaging() - getCartTaxWithPackaging()).toFixed(2)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#6B7280',
                        fontSize: { xs: '0.75rem', md: '0.875rem' }
                      }}
                    >
                      Tax (12% included):
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#6B7280',
                        fontSize: { xs: '0.75rem', md: '0.875rem' }
                      }}
                    >
                      ₹{getCartTaxWithPackaging().toFixed(2)}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography 
                      variant="h6" 
                      fontWeight="600" 
                      sx={{ 
                        color: '#111827',
                        fontSize: { xs: '1rem', md: '1.25rem' }
                      }}
                    >
                      Total:
                    </Typography>
                    <Typography 
                      variant="h4" 
                      fontWeight="600" 
                      sx={{ 
                        color: '#059669',
                        fontSize: { xs: '1.25rem', md: '1.5rem' }
                      }}
                    >
                      ₹{getCartTotalWithPackaging().toFixed(2)}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ 
                  display: 'flex', 
                  gap: { xs: 1, md: 1 },
                  flexDirection: { xs: 'column', sm: 'row' }
                }}>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      clearCart()
                    }}
                    sx={{ 
                       flex: { xs: 'none', sm: 1 },
                       color: '#6B7280',
                       borderColor: '#D1D5DB',
                       borderRadius: 2,
                       py: { xs: 1.5, md: 1.25 },
                       fontSize: { xs: '0.875rem', md: '0.875rem' },
                       fontWeight: '500',
                       textTransform: 'none',
                       minHeight: { xs: 44, md: 40 },
                       '&:hover': {
                         borderColor: '#9CA3AF',
                         backgroundColor: '#F9FAFB'
                       }
                     }}
                  >
                    Clear Cart
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => {
                      console.log('Checkout button clicked')
                      console.log('Current cart:', cart)
                      console.log('Setting checkoutDialog to true')
                      setCheckoutDialog(true)
                      console.log('checkoutDialog state should now be true')
                    }}
                    startIcon={<ReceiptIcon sx={{ fontSize: { xs: 18, md: 20 } }} />}
                    sx={{
                       flex: { xs: 'none', sm: 2 },
                       backgroundColor: '#059669',
                       color: 'white',
                       fontWeight: '600',
                       fontSize: { xs: '0.875rem', md: '0.875rem' },
                       borderRadius: 2,
                       py: { xs: 1.5, md: 1.25 },
                       textTransform: 'none',
                       minHeight: { xs: 44, md: 40 },
                       boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)',
                       transition: 'all 0.2s ease-in-out',
                       '&:hover': {
                         backgroundColor: '#047857',
                         boxShadow: '0 6px 16px rgba(5, 150, 105, 0.4)'
                       },
                       '&:active': {
                         backgroundColor: '#065F46',
                         transform: 'translateY(1px)'
                       }
                     }}
                  >
                    Proceed to Checkout
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
        onClose={() => {
          console.log('Dialog onClose triggered')
          handleCloseCheckout()
        }}
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
        {console.log('Dialog render - checkoutDialog:', checkoutDialog, 'showReceipt:', showReceipt)}
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
                      // Reset amounts when payment method changes
                      if (newPaymentMethod !== 'Both') {
                        setCashAmount(0)
                        setUpiAmount(0)
                      } else {
                        // Initialize with total amount split equally
                        const total = getCartTotalWithPackaging()
                        setCashAmount(Math.round(total / 2))
                        setUpiAmount(total - Math.round(total / 2))
                      }
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
                  <ToggleButton 
                    value="Both" 
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
                    <Typography variant="body1" fontWeight="500">Both</Typography>
                  </ToggleButton>
                </ToggleButtonGroup>
                
                {/* Cash and UPI Amount Inputs for 'Both' payment method */}
                {paymentMethod === 'Both' && (
                  <Box sx={{ mb: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                    <Typography variant="subtitle1" fontWeight="500" sx={{ mb: 2, color: 'text.primary' }}>
                      Split Payment
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <TextField
                          label="Cash Amount"
                          type="number"
                          value={cashAmount}
                          onChange={(e) => {
                            const cash = parseFloat(e.target.value) || 0
                            setCashAmount(cash)
                            setUpiAmount(getCartTotalWithPackaging() - cash)
                          }}
                          fullWidth
                          InputProps={{
                            startAdornment: <Typography sx={{ mr: 1 }}>₹</Typography>
                          }}
                          sx={{ mb: 1 }}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          label="UPI Amount"
                          type="number"
                          value={upiAmount}
                          onChange={(e) => {
                            const upi = parseFloat(e.target.value) || 0
                            setUpiAmount(upi)
                            setCashAmount(getCartTotalWithPackaging() - upi)
                          }}
                          fullWidth
                          InputProps={{
                            startAdornment: <Typography sx={{ mr: 1 }}>₹</Typography>
                          }}
                          sx={{ mb: 1 }}
                        />
                      </Grid>
                    </Grid>
                    <Box sx={{ mt: 1, p: 1, backgroundColor: cashAmount + upiAmount === getCartTotalWithPackaging() ? '#e8f5e8' : '#fff3e0', borderRadius: 1 }}>
                      <Typography variant="body2" sx={{ color: cashAmount + upiAmount === getCartTotalWithPackaging() ? '#2e7d32' : '#f57c00' }}>
                        Total: ₹{(cashAmount + upiAmount).toFixed(2)} / ₹{getCartTotalWithPackaging().toFixed(2)}
                        {cashAmount + upiAmount !== getCartTotalWithPackaging() && (
                          <span> (Difference: ₹{Math.abs(getCartTotalWithPackaging() - (cashAmount + upiAmount)).toFixed(2)})</span>
                        )}
                      </Typography>
                    </Box>
                  </Box>
                )}
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
                  {lastSale.paymentMethod === 'Both' ? (
                    <>
                      <Typography sx={{ fontFamily: 'monospace', fontSize: '8px' }}>
                        Cash: ₹{lastSale.cashAmount.toFixed(2)}
                      </Typography>
                      <Typography sx={{ fontFamily: 'monospace', fontSize: '8px' }}>
                        UPI: ₹{lastSale.upiAmount.toFixed(2)}
                      </Typography>
                      <Typography sx={{ fontFamily: 'monospace', fontSize: '8px' }}>
                        Total Paid: ₹{(lastSale.cashAmount + lastSale.upiAmount).toFixed(2)}
                      </Typography>
                    </>
                  ) : (
                    <Typography sx={{ fontFamily: 'monospace', fontSize: '8px' }}>
                      Paid: ₹{lastSale.total.toFixed(2)}
                    </Typography>
                  )}
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
                disabled={processingPayment || (paymentMethod === 'Both' && Math.abs((cashAmount + upiAmount) - getCartTotalWithPackaging()) > 0.01)}
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
                {processingPayment ? 'Processing...' : 
                 (paymentMethod === 'Both' && Math.abs((cashAmount + upiAmount) - getCartTotalWithPackaging()) > 0.01) ? 
                 'Amount Mismatch' : 'Print Receipt'}
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