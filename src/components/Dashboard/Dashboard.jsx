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
  Drawer,
  Avatar,
  Stack,
  Alert,
  LinearProgress,
  Radio,
  RadioGroup,
  FormControl,
  FormLabel,
  MenuItem,
  Select,
  InputLabel,
  Autocomplete,
  ButtonGroup
} from '@mui/material'
import {
  Search as SearchIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  ShoppingCart as CartIcon,
  Receipt as ReceiptIcon,
  Close as CloseIcon,
  Store as StoreIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as AttachMoneyIcon,
  Inventory as InventoryIcon,
  People as PeopleIcon,
  Today as TodayIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  AccountBalance as UpiIcon,

  Person as PersonIcon,
  Phone as PhoneIcon,
  Money as CashIcon,
  History as HistoryIcon,
  Dashboard as DashboardIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  FilterList as FilterIcon,
  Category as CategoryIcon,
  LocalOffer as OfferIcon,
  TrendingUp as TrendingIcon,
  Assessment as ReportIcon,
  Notifications as NotificationIcon,
  Help as HelpIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Sync as SyncIcon,
  SyncProblem as SyncProblemIcon,
  CloudDone as CloudDoneIcon,
  CloudOff as CloudOffIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  Storage as StorageIcon,
  Speed as SpeedIcon,
  Timeline as TimelineIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as MoneyIcon,
  LocalAtm as AtmIcon,
  Payment as PaymentIcon,
  QrCode as QrCodeIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Share as ShareIcon,
   Email as EmailIcon,
   Sms as SmsIcon
} from '@mui/icons-material'
import { useInventory } from '../../hooks/useInventory'
import { useCustomers } from '../../contexts/CustomerContext'
import { useSettings } from '../../contexts/SettingsContext'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { v4 as uuidv4 } from 'uuid'
import { useReactToPrint } from 'react-to-print'
import { useRef } from 'react'

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
    getCategoryGroup,
    sales,
    addSale,
    cleanupDuplicates
  } = useInventory()
  
  const { customers } = useCustomers()
  const { settings } = useSettings()
  const { currentUser } = useAuth()
  const thermalReceiptRef = useRef()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [checkoutDialog, setCheckoutDialog] = useState(false)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [receiptDialog, setReceiptDialog] = useState(false)
  const [orderSuccessDialog, setOrderSuccessDialog] = useState(false)
  const [lastSale, setLastSale] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [cashAmount, setCashAmount] = useState(0)
  const [upiAmount, setUpiAmount] = useState(0)
  const [receivedAmount, setReceivedAmount] = useState(0)

  // Print function for thermal receipt
  const handlePrint = useReactToPrint({
    content: () => thermalReceiptRef.current,
    documentTitle: 'Thermal Receipt',
    pageStyle: `
      @page {
        size: 80mm auto;
        margin: 0;
        padding: 0;
      }
      @media print {
        body {
          margin: 0;
          padding: 0;
          font-family: 'Courier New', monospace;
          font-size: 12px;
          line-height: 1.2;
        }
        .thermal-receipt {
          width: 80mm;
          max-width: 80mm;
          margin: 0;
          padding: 2mm;
          background: white;
          color: black;
        }
        .thermal-header {
          text-align: center;
          border-bottom: 1px dashed black;
          padding-bottom: 2mm;
          margin-bottom: 2mm;
        }
        .thermal-footer {
          text-align: center;
          border-top: 1px dashed black;
          padding-top: 2mm;
          margin-top: 2mm;
        }
        * {
          visibility: visible;
        }
      }
    `
  })

  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [showReceipt, setShowReceipt] = useState(false)
  const [includePackaging, setIncludePackaging] = useState(true)
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false)
  const [cleaningDuplicates, setCleaningDuplicates] = useState(false)
  
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
    if (cart.length === 0) return 0;
    
    const bottleCount = cart.reduce((count, item) => {
      const size = getProductSize(item.name)
      const isWaterBottle = item.name.toLowerCase().includes('water')
      
      if (size === '500ml' && !isWaterBottle) {
        return count + item.quantity
      }
      return count
    }, 0)
    
    return bottleCount * 10
  }
  
  const packagingCharge = getPackagingCharge()

  // Get unique category-size combinations from products
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

  // Filter and sort products
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

  // Calculate final total
  const getFinalTotal = () => {
    return getCartTotalWithPackaging()
  }

  // Calculate change to be given
  const getChangeAmount = () => {
    if (paymentMethod === 'CASH') {
      return Math.max(0, receivedAmount - getFinalTotal())
    }
    if (paymentMethod === 'BOTH') {
      const totalPaid = cashAmount + upiAmount
      return Math.max(0, totalPaid - getFinalTotal())
    }
    return 0
  }

  // Calculate tax with optional packaging charge
  const getCartTaxWithPackaging = () => {
    const baseTax = getCartTax()
    if (includePackaging) {
      const packagingTax = packagingCharge * 0.12
      return baseTax + packagingTax
    }
    return baseTax
  }

  // Handle cleanup of duplicate sales
  const handleCleanupDuplicates = async () => {
    if (cleaningDuplicates) return // Prevent multiple clicks
    
    setCleaningDuplicates(true)
    try {
      await cleanupDuplicates()
    } catch (error) {
      console.error('Error during cleanup:', error)
    } finally {
      setCleaningDuplicates(false)
    }
  }

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty')
      return
    }

    if (processingPayment) {
      toast.warning('Order is already being processed')
      return // Prevent double-clicking
    }

    // Validation for payment methods
    if (paymentMethod === 'CASH' && receivedAmount < getFinalTotal()) {
      toast.error('Received amount is less than total amount')
      return
    }

    if (paymentMethod === 'BOTH') {
      const totalPaid = cashAmount + upiAmount
      if (totalPaid < getFinalTotal()) {
        toast.error('Total payment amount is less than bill amount')
        return
      }
    }

    setProcessingPayment(true)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
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
      
      const transactionId = uuidv4()
      const sale = {
        id: uuidv4(),
        transactionId,
        items: saleItems,
        subtotal: getCartTotalWithPackaging() - getCartTaxWithPackaging(),
        tax: getCartTaxWithPackaging(),
        total: getFinalTotal(),
        originalTotal: getCartTotalWithPackaging(),
        timestamp: new Date(),
        paymentMethod,
        cashAmount: paymentMethod === 'CASH' ? receivedAmount : (paymentMethod === 'BOTH' ? cashAmount : 0),
        upiAmount: paymentMethod === 'UPI' ? getFinalTotal() : (paymentMethod === 'BOTH' ? upiAmount : 0),
        receivedAmount: paymentMethod === 'CASH' ? receivedAmount : 0,
        changeAmount: getChangeAmount()
      }
      
      // Save sale to Firebase
      await addSale(sale)
      
      setLastSale(sale)
      clearCart()
      setCheckoutDialog(false)
      setReceiptDialog(true)
      
      // Reset payment fields
      setDiscount(0)
      setReceivedAmount(0)
      setCashAmount(0)
      setUpiAmount(0)
      setPaymentMethod('CASH')
      setSelectedCustomer(null)
      setCustomerName('')
      setCustomerPhone('')
      setCustomerEmail('')
      
      toast.success('Order placed successfully!')
      
    } catch (error) {
      toast.error('Failed to place order')
    } finally {
      setProcessingPayment(false)
    }
  }

  // Business metrics for dashboard header
  const today = new Date()
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
  
  const todaysSales = (sales || [])
    .filter(sale => {
      const saleDate = sale.timestamp instanceof Date ? sale.timestamp : new Date(sale.timestamp)
      return saleDate >= startOfToday && saleDate < endOfToday
    })
    .reduce((total, sale) => total + (sale.total || 0), 0)
    
  const totalProducts = products.length
  const lowStockItems = products.filter(p => p.stock < 10).length

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Enhanced Header with Business Branding */}
      <Paper 
        elevation={1} 
        sx={{ 
          p: 3, 
          mb: 2, 
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          color: 'white',
          borderRadius: 2
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar 
                sx={{ 
                  width: 56, 
                  height: 56, 
                  bgcolor: 'rgba(255,255,255,0.2)',
                  border: '2px solid rgba(255,255,255,0.3)'
                }}
              >
                <StoreIcon sx={{ fontSize: 32 }} />
              </Avatar>
              <Box>
                <Typography variant="h4" fontWeight="bold" sx={{ mb: 0.5 }}>
                  Welcome, {currentUser?.displayName || currentUser?.email || 'Username'}
                </Typography>
                <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                  Point of Sale System • {format(new Date(), 'EEEE, MMMM do, yyyy')}
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" fontWeight="bold">
                    ₹{todaysSales.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    Today's Sales
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" fontWeight="bold">
                    {totalProducts}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    Products
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" fontWeight="bold" color={lowStockItems > 0 ? 'warning.light' : 'inherit'}>
                    {lowStockItems}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    Low Stock
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleCleanupDuplicates}
                    disabled={cleaningDuplicates}
                    startIcon={cleaningDuplicates ? <CircularProgress size={16} /> : <RefreshIcon />}
                    sx={{ 
                      color: 'white', 
                      borderColor: 'rgba(255,255,255,0.5)',
                      '&:hover': {
                        borderColor: 'white',
                        backgroundColor: 'rgba(255,255,255,0.1)'
                      }
                    }}
                  >
                    {cleaningDuplicates ? 'Cleaning...' : 'Clean Duplicates'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Paper>

      {/* Main POS Interface */}
      <Grid container spacing={2} sx={{ flexGrow: 1 }}>
        {/* Product Selection Area */}
        <Grid item xs={12} lg={8}>
          <Paper elevation={1} sx={{ p: 2, height: '100%', borderRadius: 2 }}>
            {/* Search and Filter Controls */}
            <Box sx={{ mb: 3 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon color="action" />
                        </InputAdornment>
                      ),
                      endAdornment: searchTerm && (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={() => setSearchTerm('')}>
                            <ClearIcon />
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {categoryFilters.map((category) => (
                      <Chip
                        key={category}
                        label={category}
                        onClick={() => setSelectedCategory(category)}
                        color={selectedCategory === category ? 'primary' : 'default'}
                        variant={selectedCategory === category ? 'filled' : 'outlined'}
                        size="small"
                        sx={{ 
                          borderRadius: 1,
                          textTransform: 'none',
                          fontSize: '0.875rem',
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: selectedCategory === category ? 'primary.dark' : 'action.hover'
                          }
                        }}
                      />
                    ))}
                  </Box>
                </Grid>
              </Grid>
            </Box>

            {/* Product Grid */}
            <Box sx={{ height: 'calc(100% - 120px)', overflowY: 'auto' }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                  <CircularProgress />
                </Box>
              ) : filteredProducts.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <InventoryIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No products found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Try adjusting your search or filter criteria
                  </Typography>
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {filteredProducts.map((product) => {
                    const cartItem = cart.find(item => item.id === product.id)
                    const inCart = !!cartItem
                    const quantity = cartItem?.quantity || 0
                    
                    return (
                      <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
                        <Card 
                          elevation={inCart ? 3 : 1}
                          sx={{ 
                            height: '100%',
                            borderRadius: 2,
                            border: inCart ? '2px solid #1976d2' : '1px solid #e0e0e0',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              elevation: 3,
                              transform: 'translateY(-2px)'
                            }
                          }}
                        >
                          <CardContent sx={{ pb: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                              <Chip 
                                label={product.category} 
                                size="small" 
                                sx={{ 
                                  fontSize: '0.7rem',
                                  height: 20,
                                  backgroundColor: '#E3F2FD',
                                  color: '#1976d2'
                                }} 
                              />
                              {product.stock < 10 && (
                                <Chip 
                                  label="Low Stock" 
                                  size="small" 
                                  color="warning"
                                  sx={{ fontSize: '0.7rem', height: 20 }}
                                />
                              )}
                            </Box>
                            <Typography 
                              variant="subtitle2" 
                              fontWeight="bold" 
                              sx={{ 
                                mb: 1,
                                lineHeight: 1.3,
                                height: '2.6em',
                                overflow: 'hidden',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical'
                              }}
                            >
                              {product.name}
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                              <Typography variant="h6" color="primary" fontWeight="bold">
                                ₹{product.price}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Stock: {product.stock}
                              </Typography>
                            </Box>
                          </CardContent>
                          <CardActions sx={{ pt: 0, px: 2, pb: 2 }}>
                            {!inCart ? (
                              <Button
                                fullWidth
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={() => addToCart(product)}
                                disabled={product.stock === 0}
                                sx={{ borderRadius: 1.5 }}
                              >
                                Add to Cart
                              </Button>
                            ) : (
                              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1 }}>
                                <IconButton 
                                  size="small" 
                                  onClick={() => removeFromCart(product.id)}
                                  sx={{ 
                                    backgroundColor: '#f5f5f5',
                                    '&:hover': { backgroundColor: '#e0e0e0' }
                                  }}
                                >
                                  <RemoveIcon fontSize="small" />
                                </IconButton>
                                <Typography 
                                  variant="h6" 
                                  sx={{ 
                                    flexGrow: 1, 
                                    textAlign: 'center',
                                    fontWeight: 'bold',
                                    color: 'primary.main'
                                  }}
                                >
                                  {quantity}
                                </Typography>
                                <IconButton 
                                  size="small" 
                                  onClick={() => addToCart(product)}
                                  disabled={quantity >= product.stock}
                                  sx={{ 
                                    backgroundColor: '#1976d2',
                                    color: 'white',
                                    '&:hover': { backgroundColor: '#1565c0' },
                                    '&:disabled': { backgroundColor: '#e0e0e0', color: '#9e9e9e' }
                                  }}
                                >
                                  <AddIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            )}
                          </CardActions>
                        </Card>
                      </Grid>
                    )
                  })}
                </Grid>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Enhanced Cart Sidebar */}
        <Grid item xs={12} lg={4}>
          <Paper elevation={2} sx={{ p: 2, height: { xs: 'auto', lg: '100%' }, minHeight: { xs: '500px', lg: 'auto' }, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" fontWeight="bold">
                Shopping Cart
              </Typography>
              <Badge badgeContent={cart.length} color="primary">
                <CartIcon />
              </Badge>
            </Box>
            
            {cart.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <CartIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Cart is empty
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Add products to get started
                </Typography>
              </Box>
            ) : (
              <>
                <Box sx={{ 
                  height: { xs: '250px', lg: 'calc(100% - 250px)' }, 
                  maxHeight: '350px',
                  overflowY: 'auto', 
                  mb: 2 
                }}>
                  <List>
                    {cart.map((item) => (
                      <ListItem key={item.id} sx={{ px: 0, py: 1 }}>
                        <Box sx={{ width: '100%' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                            <Typography variant="subtitle2" fontWeight="bold" sx={{ flexGrow: 1, pr: 1 }}>
                              {item.name}
                            </Typography>
                            <IconButton 
                              size="small" 
                              onClick={() => removeFromCart(item.id, true)}
                              sx={{ color: 'error.main' }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <IconButton 
                                size="small" 
                                onClick={() => removeFromCart(item.id)}
                                sx={{ backgroundColor: '#f5f5f5' }}
                              >
                                <RemoveIcon fontSize="small" />
                              </IconButton>
                              <Typography variant="body2" fontWeight="bold">
                                {item.quantity}
                              </Typography>
                              <IconButton 
                                size="small" 
                                onClick={() => addToCart(item)}
                                sx={{ backgroundColor: '#1976d2', color: 'white' }}
                              >
                                <AddIcon fontSize="small" />
                              </IconButton>
                            </Box>
                            <Typography variant="subtitle2" fontWeight="bold" color="primary">
                              ₹{(item.price * item.quantity).toFixed(2)}
                            </Typography>
                          </Box>
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                </Box>
                
                {/* Cart Summary */}
                <Box sx={{ 
                  borderTop: '1px solid #e0e0e0', 
                  pt: 2,
                  backgroundColor: 'white',
                  position: 'sticky',
                  bottom: 0,
                  zIndex: 1,
                  mt: 'auto'
                }}>
                  {includePackaging && packagingCharge > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Packaging Charge:</Typography>
                      <Typography variant="body2" fontWeight="bold">₹{packagingCharge}</Typography>
                    </Box>
                  )}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Subtotal:</Typography>
                    <Typography variant="body2" fontWeight="bold">₹{getCartSubtotal().toFixed(2)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Tax (12%):</Typography>
                    <Typography variant="body2" fontWeight="bold">₹{getCartTaxWithPackaging().toFixed(2)}</Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" fontWeight="bold">Total:</Typography>
                    <Typography variant="h6" fontWeight="bold" color="primary">
                      ₹{getCartTotalWithPackaging().toFixed(2)}
                    </Typography>
                  </Box>
                  
                  <Stack spacing={1}>
                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      startIcon={<ReceiptIcon />}
                      onClick={() => setCheckoutDialog(true)}
                      sx={{ 
                        borderRadius: 2,
                        py: 1.5,
                        fontSize: '1rem',
                        fontWeight: 'bold'
                      }}
                    >
                      Checkout
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={clearCart}
                      sx={{ borderRadius: 2 }}
                    >
                      Clear Cart
                    </Button>
                  </Stack>
                </Box>
              </>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Enhanced Checkout Dialog */}
      <Dialog 
        open={checkoutDialog} 
        onClose={() => setCheckoutDialog(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <Typography variant="h5" fontWeight="600" sx={{ color: '#1a1a1a' }}>
              Order Summary
            </Typography>
            <IconButton 
              onClick={() => setCheckoutDialog(false)}
              sx={{ 
                position: 'absolute', 
                right: 0,
                color: '#666'
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ px: 3, py: 2 }}>
          {/* Items Section */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 2, color: '#1a1a1a' }}>
              Items
            </Typography>
            <Box sx={{ bgcolor: '#f8f9fa', borderRadius: 2, p: 2 }}>
              {cart.map((item, index) => (
                <Box key={item.id} sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  mb: index < cart.length - 1 ? 2 : 0
                }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body1" fontWeight="500" sx={{ color: '#1a1a1a', mb: 0.5 }}>
                      {item.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#888', fontSize: '0.75rem', mb: 0.5 }}>
                      {item.category}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666' }}>
                      ₹{item.price} × {item.quantity}
                    </Typography>
                  </Box>
                  <Typography variant="body1" fontWeight="600" sx={{ color: '#1a1a1a' }}>
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </Typography>
                </Box>
              ))}
              
              {includePackaging && packagingCharge > 0 && (
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  mt: 2
                }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body1" fontWeight="500" sx={{ color: '#1a1a1a', mb: 0.5 }}>
                      Packaging Charge
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#888', fontSize: '0.75rem', mb: 0.5 }}>
                      Eco-friendly packaging
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666' }}>
                      ₹10 × {packagingCharge / 10} bottles
                    </Typography>
                  </Box>
                  <Typography variant="body1" fontWeight="600" sx={{ color: '#1a1a1a' }}>
                    ₹{packagingCharge.toFixed(2)}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>



          {/* Payment Method Section */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 2, color: '#1a1a1a' }}>
              Payment Method
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant={paymentMethod === 'CASH' ? 'contained' : 'outlined'}
                onClick={() => setPaymentMethod('CASH')}
                sx={{ 
                  flex: 1,
                  py: 1.5,
                  fontWeight: '600',
                  textTransform: 'none',
                  borderRadius: 2,
                  ...(paymentMethod === 'CASH' ? {
                    bgcolor: '#000',
                    color: '#fff',
                    '&:hover': { bgcolor: '#333' }
                  } : {
                    borderColor: '#e0e0e0',
                    color: '#666',
                    '&:hover': { borderColor: '#000', color: '#000' }
                  })
                }}
              >
                CASH
              </Button>
              <Button
                variant={paymentMethod === 'UPI' ? 'contained' : 'outlined'}
                onClick={() => setPaymentMethod('UPI')}
                sx={{ 
                  flex: 1,
                  py: 1.5,
                  fontWeight: '600',
                  textTransform: 'none',
                  borderRadius: 2,
                  ...(paymentMethod === 'UPI' ? {
                    bgcolor: '#000',
                    color: '#fff',
                    '&:hover': { bgcolor: '#333' }
                  } : {
                    borderColor: '#e0e0e0',
                    color: '#666',
                    '&:hover': { borderColor: '#000', color: '#000' }
                  })
                }}
              >
                UPI
              </Button>
              <Button
                variant={paymentMethod === 'BOTH' ? 'contained' : 'outlined'}
                onClick={() => setPaymentMethod('BOTH')}
                sx={{ 
                  flex: 1,
                  py: 1.5,
                  fontWeight: '600',
                  textTransform: 'none',
                  borderRadius: 2,
                  ...(paymentMethod === 'BOTH' ? {
                    bgcolor: '#000',
                    color: '#fff',
                    '&:hover': { bgcolor: '#333' }
                  } : {
                    borderColor: '#e0e0e0',
                    color: '#666',
                    '&:hover': { borderColor: '#000', color: '#000' }
                  })
                }}
              >
                BOTH
              </Button>
            </Box>
          </Box>

          {/* Bill Summary */}
           <Box sx={{ mb: 3 }}>
             <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
               <Typography variant="body1" sx={{ color: '#666' }}>Subtotal (excl. GST):</Typography>
               <Typography variant="body1" fontWeight="600">₹{getCartSubtotal().toFixed(2)}</Typography>
             </Box>
             
             <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
               <Typography variant="body2" sx={{ color: '#666' }}>• Packaging Charge:</Typography>
               <Typography variant="body2" sx={{ color: '#666' }}>₹{includePackaging ? packagingCharge.toFixed(2) : '0.00'}</Typography>
             </Box>
             
             <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
               <Typography variant="body2" sx={{ color: '#666' }}>GST (12%):</Typography>
               <Typography variant="body2" sx={{ color: '#666' }}>₹{getCartTaxWithPackaging().toFixed(2)}</Typography>
             </Box>
             
             <Divider sx={{ my: 2 }} />
             
             <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <Typography variant="h6" fontWeight="700" sx={{ color: '#1a1a1a' }}>Total:</Typography>
               <Typography variant="h6" fontWeight="700" sx={{ color: '#1a1a1a' }}>₹{getFinalTotal().toFixed(2)}</Typography>
             </Box>
           </Box>

          {/* Payment Fields */}
          {paymentMethod === 'CASH' && (
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                label="Received Amount"
                type="number"
                value={receivedAmount}
                onChange={(e) => setReceivedAmount(parseFloat(e.target.value) || 0)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>
                }}
                sx={{ 
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />
              {receivedAmount > 0 && (
                <Box sx={{ p: 2, bgcolor: receivedAmount >= getFinalTotal() ? 'success.light' : 'error.light', borderRadius: 2 }}>
                  <Typography variant="body2" fontWeight="bold">
                    Change to Return: ₹{getChangeAmount().toFixed(2)}
                  </Typography>
                  {receivedAmount < getFinalTotal() && (
                    <Typography variant="body2" color="error">
                      Insufficient amount! Need ₹{(getFinalTotal() - receivedAmount).toFixed(2)} more
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          )}
          
          {paymentMethod === 'BOTH' && (
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                label="Cash Amount"
                type="number"
                value={cashAmount}
                onChange={(e) => setCashAmount(parseFloat(e.target.value) || 0)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>
                }}
                sx={{ 
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />
              <TextField
                fullWidth
                label="UPI Amount"
                type="number"
                value={upiAmount}
                onChange={(e) => setUpiAmount(parseFloat(e.target.value) || 0)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>
                }}
                sx={{ 
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />
              <Box sx={{ p: 2, bgcolor: 'info.light', borderRadius: 2 }}>
                <Typography variant="body2">
                  Total Paid: ₹{(cashAmount + upiAmount).toFixed(2)}
                </Typography>
                <Typography variant="body2">
                  Remaining: ₹{Math.max(0, getFinalTotal() - (cashAmount + upiAmount)).toFixed(2)}
                </Typography>
                {(cashAmount + upiAmount) > getFinalTotal() && (
                  <Typography variant="body2" color="success.main">
                    Change: ₹{getChangeAmount().toFixed(2)}
                  </Typography>
                )}
              </Box>
            </Box>
          )}
          
          {paymentMethod === 'UPI' && (
            <Box sx={{ p: 2, bgcolor: 'info.light', borderRadius: 2, mb: 2 }}>
              <Typography variant="body2">
                UPI Payment: ₹{getFinalTotal().toFixed(2)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Please confirm UPI payment before placing order
              </Typography>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 1, gap: 2 }}>
          <Button
            onClick={() => setCheckoutDialog(false)}
            variant="outlined"
            fullWidth
            sx={{ 
              py: 1.5,
              fontWeight: '600',
              textTransform: 'none',
              borderRadius: 2,
              borderColor: '#e0e0e0',
              color: '#666',
              '&:hover': { borderColor: '#000', color: '#000' }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePlaceOrder}
            variant="contained"
            fullWidth
            disabled={processingPayment}
            startIcon={processingPayment ? <CircularProgress size={20} /> : <ReceiptIcon />}
            sx={{ 
              py: 1.5,
              fontWeight: '600',
              textTransform: 'none',
              borderRadius: 2,
              bgcolor: '#000',
              color: '#fff',
              '&:hover': { bgcolor: '#333' },
              '&:disabled': { bgcolor: '#ccc' }
            }}
          >
            {processingPayment ? 'Processing...' : 'Print Receipt'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Order Success Dialog */}
      <Dialog open={orderSuccessDialog} onClose={() => setOrderSuccessDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" fontWeight="bold" color="success.main">
              Order Placed Successfully!
            </Typography>
            <IconButton onClick={() => setOrderSuccessDialog(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {lastSale && (
            <Box>
              {/* Success Header */}
              <Box sx={{ textAlign: 'center', py: 2, mb: 3 }}>
                <Typography variant="h4" color="success.main" sx={{ mb: 2 }}>
                  ✓
                </Typography>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Order Placed Successfully!
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Order #{lastSale.id.slice(-8).toUpperCase()}
                </Typography>
              </Box>

              {/* Print Summary Card */}
              <Card sx={{ mb: 2, border: '1px solid #e0e0e0' }}>
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="h6" sx={{ mb: 2, textAlign: 'center', fontWeight: 'bold' }}>
                    {settings.businessName || 'CANEFROST JUICE SHOP'}
                  </Typography>
                  
                  {/* Order Details */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Receipt No:</span>
                      <span>{lastSale.id.slice(-8).toUpperCase()}</span>
                    </Typography>
                    <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Date:</span>
                      <span>{format(lastSale.timestamp, 'dd/MM/yyyy HH:mm:ss')}</span>
                    </Typography>
                    <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Payment:</span>
                      <span>{lastSale.paymentMethod}</span>
                    </Typography>
                    {lastSale.customer && (
                      <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Customer:</span>
                        <span>{lastSale.customer.name}</span>
                      </Typography>
                    )}
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  {/* Items */}
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                    ITEMS
                  </Typography>
                  {lastSale.items.map((item, index) => (
                    <Box key={index} sx={{ mb: 1 }}>
                      <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{item.name}</span>
                        <span>{item.quantity} × ₹{item.price.toFixed(2)}</span>
                      </Typography>
                      <Typography variant="body2" sx={{ textAlign: 'right', color: 'text.secondary' }}>
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </Typography>
                    </Box>
                  ))}

                  <Divider sx={{ my: 2 }} />

                  {/* Totals */}
                  <Box>
                    <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Subtotal:</span>
                      <span>₹{lastSale.subtotal.toFixed(2)}</span>
                    </Typography>
                    <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Tax (12%):</span>
                      <span>₹{lastSale.tax.toFixed(2)}</span>
                    </Typography>
                    <Typography variant="subtitle1" sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', mt: 1, pt: 1, borderTop: '1px solid #e0e0e0' }}>
                      <span>TOTAL:</span>
                      <span>₹{lastSale.total.toFixed(2)}</span>
                    </Typography>
                  </Box>

                  {/* Payment Details */}
                  <Box sx={{ mt: 2, pt: 2, borderTop: '1px dashed #ccc' }}>
                    {lastSale.paymentMethod === 'CASH' && (
                      <>
                        <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Cash Received:</span>
                          <span>₹{lastSale.receivedAmount.toFixed(2)}</span>
                        </Typography>
                        <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Change:</span>
                          <span>₹{lastSale.changeAmount.toFixed(2)}</span>
                        </Typography>
                      </>
                    )}
                    {lastSale.paymentMethod === 'BOTH' && (
                      <>
                        <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Cash:</span>
                          <span>₹{lastSale.cashAmount.toFixed(2)}</span>
                        </Typography>
                        <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>UPI:</span>
                          <span>₹{lastSale.upiAmount.toFixed(2)}</span>
                        </Typography>
                        {lastSale.changeAmount > 0 && (
                          <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Change:</span>
                            <span>₹{lastSale.changeAmount.toFixed(2)}</span>
                          </Typography>
                        )}
                      </>
                    )}
                    {lastSale.paymentMethod === 'UPI' && (
                      <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>UPI Payment:</span>
                        <span>₹{lastSale.total.toFixed(2)}</span>
                      </Typography>
                    )}

                  </Box>

                  {/* Footer */}
                  <Box sx={{ textAlign: 'center', mt: 2, pt: 2, borderTop: '1px dashed #ccc' }}>
                    <Typography variant="body2" color="text.secondary">
                      Thank you for visiting!
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Powered by CaneFrost POS
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, justifyContent: 'center' }}>
          <Button
            onClick={() => window.print()}
            variant="contained"
            startIcon={<ReceiptIcon />}
            sx={{ mr: 1 }}
          >
            Print
          </Button>
          <Button
            onClick={() => {
              setOrderSuccessDialog(false)
              setReceiptDialog(true)
            }}
            variant="contained"
            startIcon={<ReceiptIcon />}
            sx={{ mr: 1, bgcolor: '#2e7d32', '&:hover': { bgcolor: '#1b5e20' } }}
          >
            Thermal Print
          </Button>
          <Button
            onClick={() => setOrderSuccessDialog(false)}
            variant="outlined"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Thermal Receipt Dialog */}
      <Dialog open={receiptDialog} onClose={() => setReceiptDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" fontWeight="bold">
              80mm Thermal Receipt
            </Typography>
            <IconButton onClick={() => setReceiptDialog(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {lastSale && (
            <Box 
              ref={thermalReceiptRef}
              className="thermal-receipt"
              sx={{ 
                fontFamily: 'Courier New, monospace', 
                fontSize: settings.fontSize || '12px', 
                lineHeight: settings.lineSpacing || 1.2,
                width: '80mm',
                maxWidth: '80mm',
                margin: '0 auto',
                backgroundColor: '#fff',
                color: '#000',
                padding: '8px',
                '@media print': {
                  width: '80mm',
                  maxWidth: '80mm',
                  margin: 0,
                  padding: '2mm',
                  fontSize: '12px',
                  lineHeight: 1.2,
                  backgroundColor: 'white',
                  color: 'black'
                }
              }}>
              {/* Custom Header Text */}
              {settings.thermalHeaderText && (
                <Box sx={{ 
                  textAlign: settings.headerAlignment || 'center', 
                  mb: 1, 
                  fontSize: '11px', 
                  fontStyle: 'italic',
                  fontFamily: 'monospace'
                }}>
                  {settings.thermalHeaderText}
                </Box>
              )}
              
              {/* Header */}
              <Box className="thermal-header" sx={{ textAlign: 'center', mb: 1, borderBottom: settings.showDividers !== false ? '1px dashed #000' : 'none', pb: 1 }}>
                {settings.showBusinessName !== false && (
                  <Typography sx={{ 
                    fontFamily: 'monospace', 
                    fontSize: '14px', 
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}>
                    {settings.businessName || 'CANEFROST JUICE SHOP'}
                  </Typography>
                )}
                {settings.showBusinessAddress !== false && (
                  <Box sx={{ fontFamily: 'monospace', mt: 0.5 }}>
                    {(settings.businessAddress || 'Fresh Juices & Beverages\nPhone: +91 9876543210').split('\n').map((line, index) => (
                      <Typography key={index} sx={{ 
                        fontFamily: 'monospace', 
                        fontSize: '10px',
                        lineHeight: 1.1
                      }}>
                        {line}
                      </Typography>
                    ))}
                  </Box>
                )}
                {settings.showGSTNumber !== false && (
                  <Typography sx={{ 
                    fontFamily: 'monospace', 
                    fontSize: '10px',
                    mt: 0.5
                  }}>
                    GST: {settings.gstNumber || '29XXXXX1234X1ZX'}
                  </Typography>
                )}
              </Box>

              {/* Sale Info */}
              <Box sx={{ mb: 1, borderBottom: settings.showDividers !== false ? '1px dashed #000' : 'none', pb: 1 }}>
                {settings.showReceiptNumber !== false && (
                  <Typography sx={{ fontFamily: 'monospace', fontSize: '10px' }}>
                    Receipt: {lastSale.id.slice(-8).toUpperCase()}
                  </Typography>
                )}
                {settings.showDateTime !== false && (
                  <Typography sx={{ fontFamily: 'monospace', fontSize: '10px' }}>
                    Date: {format(lastSale.timestamp, 'dd/MM/yy HH:mm')}
                  </Typography>
                )}
                {settings.showPaymentMethod !== false && (
                  <Typography sx={{ fontFamily: 'monospace', fontSize: '10px' }}>
                    Payment: {lastSale.paymentMethod}
                  </Typography>
                )}
                {lastSale.customer && settings.showCustomerInfo !== false && (
                  <Typography sx={{ fontFamily: 'monospace', fontSize: '10px' }}>
                    Customer: {lastSale.customer.name}
                  </Typography>
                )}
              </Box>

              {/* Items */}
              <Box sx={{ mb: 1 }}>
                <Typography sx={{ 
                  fontFamily: 'monospace', 
                  fontWeight: 'bold', 
                  borderBottom: settings.showDividers !== false ? '1px solid #000' : 'none', 
                  pb: 0.5,
                  fontSize: '10px'
                }}>
                  ITEM            QTY  RATE  AMT
                </Typography>
                {lastSale.items.map((item, index) => (
                  <Box key={index} sx={{ py: 0.2 }}>
                    <Typography sx={{ fontFamily: 'monospace', fontSize: '9px' }}>
                      {item.name.substring(0, 14).padEnd(14)} {item.quantity.toString().padStart(2)} {item.price.toFixed(0).padStart(4)} {(item.price * item.quantity).toFixed(0).padStart(4)}
                    </Typography>
                    {settings.showItemCodes && item.code && (
                      <Typography sx={{ fontFamily: 'monospace', fontSize: '8px', color: '#666', ml: 1 }}>
                        Code: {item.code}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Box>

              {/* Totals */}
              <Box sx={{ borderTop: settings.showDividers !== false ? '1px dashed #000' : 'none', pt: 1 }}>
                <Typography sx={{ 
                  fontFamily: 'monospace', 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  fontSize: '10px'
                }}>
                  <span>Subtotal:</span>
                  <span>₹{lastSale.subtotal.toFixed(2)}</span>
                </Typography>
                {settings.showTaxBreakdown !== false && (
                  <Typography sx={{ 
                    fontFamily: 'monospace', 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    fontSize: '10px'
                  }}>
                    <span>Tax (12%):</span>
                    <span>₹{lastSale.tax.toFixed(2)}</span>
                  </Typography>
                )}
                <Typography sx={{ 
                  fontFamily: 'monospace', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  fontWeight: 'bold', 
                  borderTop: settings.showDividers !== false ? '1px solid #000' : 'none', 
                  pt: 0.5, 
                  mt: 0.5,
                  fontSize: '12px'
                }}>
                  <span>TOTAL:</span>
                  <span>₹{lastSale.total.toFixed(2)}</span>
                </Typography>
              </Box>

              {/* Payment Details */}
              <Box sx={{ mt: 1, borderTop: settings.showDividers !== false ? '1px dashed #000' : 'none', pt: 1 }}>
                {lastSale.paymentMethod === 'CASH' && (
                  <>
                    <Typography sx={{ 
                      fontFamily: 'monospace', 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      fontSize: '10px'
                    }}>
                      <span>Cash Received:</span>
                      <span>₹{lastSale.receivedAmount.toFixed(2)}</span>
                    </Typography>
                    <Typography sx={{ 
                      fontFamily: 'monospace', 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      fontSize: '10px'
                    }}>
                      <span>Change:</span>
                      <span>₹{lastSale.changeAmount.toFixed(2)}</span>
                    </Typography>
                  </>
                )}
                {lastSale.paymentMethod === 'BOTH' && (
                  <>
                    <Typography sx={{ 
                      fontFamily: 'monospace', 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      fontSize: '10px'
                    }}>
                      <span>Cash:</span>
                      <span>₹{lastSale.cashAmount.toFixed(2)}</span>
                    </Typography>
                    <Typography sx={{ 
                      fontFamily: 'monospace', 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      fontSize: '10px'
                    }}>
                      <span>UPI:</span>
                      <span>₹{lastSale.upiAmount.toFixed(2)}</span>
                    </Typography>
                    {lastSale.changeAmount > 0 && (
                      <Typography sx={{ 
                        fontFamily: 'monospace', 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        fontSize: '10px'
                      }}>
                        <span>Change:</span>
                        <span>₹{lastSale.changeAmount.toFixed(2)}</span>
                      </Typography>
                    )}
                  </>
                )}
                {lastSale.paymentMethod === 'UPI' && (
                  <Typography sx={{ 
                    fontFamily: 'monospace', 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    fontSize: '10px'
                  }}>
                    <span>UPI Payment:</span>
                    <span>₹{lastSale.total.toFixed(2)}</span>
                  </Typography>
                )}

              </Box>

              {/* Footer */}
              <Box className="thermal-footer" sx={{ textAlign: settings.footerAlignment || 'center', mt: 1, borderTop: settings.showDividers !== false ? '1px dashed #000' : 'none', pt: 1 }}>
                {settings.thermalFooterText ? (
                  <Typography sx={{ fontFamily: 'monospace', fontSize: '9px' }}>
                    {settings.thermalFooterText}
                  </Typography>
                ) : (
                  <>
                    <Typography sx={{ fontFamily: 'monospace', fontSize: '9px' }}>
                      Thank you for visiting!
                    </Typography>
                    <Typography sx={{ fontFamily: 'monospace', fontSize: '9px' }}>
                      Visit us again for fresh juices
                    </Typography>
                  </>
                )}
                <Typography sx={{ fontFamily: 'monospace', fontSize: '8px', mt: 0.5 }}>
                  Powered by CaneFrost POS
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={handlePrint}
            variant="contained"
            startIcon={<ReceiptIcon />}
            sx={{ mr: 1 }}
          >
            Print Receipt
          </Button>
          <Button
            onClick={() => setReceiptDialog(false)}
            variant="outlined"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  )
}

export default Dashboard