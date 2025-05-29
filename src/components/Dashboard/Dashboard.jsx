import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Badge } from '../ui/badge'
import { Separator } from '../ui/separator'
import { Checkbox } from '../ui/checkbox'
import { RadioGroup, RadioGroupItem } from '../ui/radio-group'
import { Alert, AlertDescription } from '../ui/alert'
import { Progress } from '../ui/progress'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet'
import { Avatar, AvatarFallback } from '../ui/avatar'
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  Receipt,
  X,
  Store,
  TrendingUp,
  DollarSign,
  Package,
  Users,
  Calendar,
  Filter,
  User,
  Phone,
  Banknote,
  History,
  LayoutDashboard,
  Settings,
  LogOut,
  Tag,
  Percent,
  BarChart3,
  Bell,
  HelpCircle,
  Info,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  RotateCcw,
  Cloud,
  CloudOff,
  Wifi,
  WifiOff,
  Database,
  Gauge,
  TrendingDown,
  CreditCard,
  QrCode,
  Printer,
  Download,
  Upload,
  Share,
  Mail,
  MessageSquare
} from 'lucide-react'
import { useInventory } from '../../hooks/useInventory'
import { useCustomers } from '../../contexts/CustomerContext'
import { useSettings } from '../../contexts/SettingsContext'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { v4 as uuidv4 } from 'uuid'
import { render, Printer as ThermalPrinter, Text, Row, Br, Line, Cut } from 'react-thermal-printer'
import { useReactToPrint } from 'react-to-print'

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
    addSale
  } = useInventory()
  
  const { customers } = useCustomers()
  const { settings } = useSettings()
  const { currentUser } = useAuth()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [checkoutDialog, setCheckoutDialog] = useState(false)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [receiptDialog, setReceiptDialog] = useState(false)
  const [orderSuccessDialog, setOrderSuccessDialog] = useState(false)
  const [lastSale, setLastSale] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [cashAmount, setCashAmount] = useState(0)
  const [upiAmount, setUpiAmount] = useState(0)
  const [receivedAmount, setReceivedAmount] = useState(0)
  const [discount, setDiscount] = useState(0)

  // Thermal receipt ref for browser printing fallback
  const thermalReceiptRef = useRef()

  // Browser print function using react-to-print
  const handleBrowserPrint = useReactToPrint({
    content: () => thermalReceiptRef.current,
    documentTitle: 'Thermal Receipt'
  })

  // Print function for thermal receipt
  const handlePrint = async () => {
    if (!lastSale) return;
    
    // First attempt: Try thermal printing
    try {
      const width = settings?.printerWidth === '58mm' ? 32 : settings?.printerWidth === 'A4' ? 48 : 42;
      
      const receipt = (
        <ThermalPrinter type="epson" width={width}>
          {/* Header */}
          {settings?.showBusinessName && (
            <>
              <Text align="center" size={{ width: 2, height: 2 }} bold={true}>
                {settings?.businessName || `Welcome, ${currentUser?.displayName || 'Guest'}`}
              </Text>
              {settings?.thermalHeaderText && (
                <Text align="center">{settings.thermalHeaderText}</Text>
              )}
            </>
          )}
          
          {settings?.showBusinessAddress && settings?.businessAddress && (
            <Text align="center">{settings.businessAddress}</Text>
          )}
          
          {settings?.showGstNumber && settings?.gstNumber && (
            <Text align="center">GST: {settings.gstNumber}</Text>
          )}
          
          {settings?.showDividers && <Line />}
          
          {/* Transaction Details */}
          {settings?.showReceiptNumber && (
            <Text>Receipt #: {lastSale.transactionId}</Text>
          )}
          {settings?.showDateTime && (
            <>
              <Text>Date: {format(new Date(), 'dd/MM/yyyy')}</Text>
              <Text>Time: {format(new Date(), 'HH:mm:ss')}</Text>
            </>
          )}
          <Text>Cashier: {currentUser?.displayName || 'Staff'}</Text>
          
          {settings?.showDividers && <Line />}
          
          {/* Items */}
          {lastSale.items.map((item, index) => (
            <div key={index}>
              <Row 
                left={item.name} 
                right={`₹${(item.price * item.quantity).toFixed(2)}`} 
              />
              <Text>  {item.quantity} x ₹{item.price.toFixed(2)}</Text>
            </div>
          ))}
          
          {settings?.showDividers && <Line />}
          
          {/* Totals */}
          <Row left="Subtotal:" right={`₹${lastSale.subtotal.toFixed(2)}`} />
          
          {settings?.showTaxBreakdown && (
            <Row left="GST (12%):" right={`₹${lastSale.tax.toFixed(2)}`} />
          )}
          
          <Line />
          <Row left={<Text bold={true}>TOTAL:</Text>} right={<Text bold={true}>₹{lastSale.total.toFixed(2)}</Text>} />
          
          {/* Payment Details */}
          {settings?.showPaymentMethod && (
            <>
              <Br />
              <Text>Payment: {lastSale.paymentMethod}</Text>
              {lastSale.changeAmount > 0 && (
                <Text>Change: ₹{lastSale.changeAmount.toFixed(2)}</Text>
              )}
            </>
          )}
          
          {settings?.showDividers && <Line />}
          
          {/* Footer */}
          <Text align="center">
            {settings?.thermalFooterText || 'Thank you for your business!'}
          </Text>
          
          <Br />
          <Br />
          <Cut />
        </ThermalPrinter>
      );
      
      // Render and print
      const data = await render(receipt);
      
      // For web browsers, we'll need to use a different approach
      // This is a placeholder - actual printing would require additional setup
      console.log('Thermal receipt data generated:', data);
      toast.success('Receipt generated successfully!');
      
      // Fall back to browser printing immediately since thermal printing 
      // requires additional setup for web browsers
      handleBrowserPrint();
      
    } catch (thermalError) {
      console.warn('Thermal printing failed, falling back to browser print:', thermalError);
      
      // Second attempt: Fall back to browser printing
      try {
        handleBrowserPrint();
        toast.success('Receipt sent to browser printer!');
      } catch (browserError) {
        console.error('Browser printing also failed:', browserError);
        toast.error('Failed to print receipt. Please check your printer connection.');
      }
    }
  }

  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [showReceipt, setShowReceipt] = useState(false)
  const [includePackaging, setIncludePackaging] = useState(true)
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

  // Calculate packaging charge for 500ml bottles in cane fusion or cane blend
  const getPackagingCharge = () => {
    if (cart.length === 0) return 0;
    
    const bottleCount = cart.reduce((count, item) => {
      // Use the size field from the product data, fallback to parsing name
      const size = item.size || getProductSize(item.name)
      const isCaneCategory = item.category && (
        item.category.toLowerCase().includes('cane fusion') ||
        item.category.toLowerCase().includes('cane blend')
      )
      
      if (size === '500ml' && isCaneCategory) {
        return count + item.quantity
      }
      return count
    }, 0)
    
    return bottleCount * 10 // ₹10 per 500ml bottle in cane fusion/blend
  }
  
  const packagingCharge = getPackagingCharge()

  // Get unique categories from products
  const categoryFilters = useMemo(() => {
    const filterSet = new Set()
    products.forEach(product => {
      filterSet.add(product.category)
    })
    return Array.from(filterSet).sort()
  }, [products])

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return products
      .filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesCategory = !selectedCategory || selectedCategory === 'all' || product.category === selectedCategory
        return matchesSearch && matchesCategory
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
    return getCartTotalWithPackaging() - discount
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

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty')
      return
    }

    if (processingPayment) {
      toast.warning('Order is already being processed')
      return
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
      
      // Generate order ID with INVCFN format
      const generateOrderId = () => {
        const timestamp = Date.now().toString().slice(-6)
        const randomNum = Math.floor(Math.random() * 100).toString().padStart(2, '0')
        return `INVCFN${timestamp}${randomNum}`
      }
      
      const transactionId = generateOrderId()
      const sale = {
        id: uuidv4(),
        transactionId,
        items: saleItems,
        subtotal: getCartTotalWithPackaging() - getCartTaxWithPackaging(),
        tax: getCartTaxWithPackaging(),
        total: getFinalTotal(),
        originalTotal: getCartTotalWithPackaging(),
        discount: discount,
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
    <div className="h-full flex flex-col">
      {/* Simplified Header */}
      <Card className="bg-black text-white border-0 rounded-none m-0">
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 bg-white/20 border-2 border-white/30">
              <AvatarFallback className="bg-transparent">
                <Store className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-lg font-bold mb-1">
                Welcome, {currentUser?.displayName || 'Guest'}
              </h1>
              <p className="text-gray-300 text-sm">
                Point of Sale System • {format(new Date(), 'EEEE, MMMM do, yyyy')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main POS Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-1 p-1 flex-1">
        {/* Product Selection Area */}
        <div className="lg:col-span-2 xl:col-span-3 space-y-2">
          <Card>
            <CardContent className="p-3 flex flex-col">
              {/* Search and Filter Controls */}
              <div className="mb-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categoryFilters.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Product Grid */}
              <div className="flex-1 overflow-auto max-h-[calc(100vh-280px)] p-2">
                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-2"></div>
                      <p className="text-muted-foreground">Loading products...</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 auto-rows-max p-2">
                    {filteredProducts.map((product) => {
                      const isInCart = cart.some(item => item.id === product.id)
                      return (
                        <Card 
          key={product.id} 
          className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
            isInCart ? 'ring-2 ring-black bg-gray-50 relative z-10' : 'hover:bg-gray-50'
          }`}
          onClick={() => addToCart(product)}
        >
                          <CardContent className="p-3">
                            <div className="space-y-2">
                              <div className="flex justify-between items-start gap-1">
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-medium text-sm leading-tight">{product.name}</h3>
                                  {product.size && (
                                    <Badge variant="outline" className="text-[9px] px-1 py-0 h-3 mt-1 bg-blue-50 text-blue-700 border-blue-200">
                                      {product.size}
                                    </Badge>
                                  )}
                                </div>
                                <Badge variant={product.stock > 10 ? 'default' : 'destructive'} className="text-[10px] px-1 py-0 h-4 shrink-0 min-w-fit">
                                  {product.stock}
                                </Badge>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-base">₹{product.price}</span>
                                {isInCart && (
                                  <div className="flex items-center justify-center">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cart Area */}
        <div className="xl:col-span-1">
          <Card className="max-h-[calc(100vh-200px)]">
            <CardHeader className="pb-2 px-3 pt-3">
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <ShoppingCart className="h-4 w-4" />
                  Cart ({cart.length})
                </CardTitle>
                {cart.length > 0 && (
                  <Button variant="outline" size="sm" onClick={clearCart}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex flex-col px-3 pb-3 max-h-[calc(100vh-280px)]">
              {cart.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Your cart is empty</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Cart Items */}
                  <div className="flex-1 overflow-auto space-y-1 mb-3">
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-1.5 border rounded text-sm">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-xs truncate">{item.name}</p>
                          <div className="flex items-center gap-1 flex-wrap">
                            <p className="text-xs text-muted-foreground">₹{item.price}</p>
                            {item.category && (
                              <span className="text-[9px] px-1 py-0.5 bg-gray-100 text-gray-600 rounded">
                                {item.category}
                              </span>
                            )}
                            {item.size && (
                              <span className="text-[9px] px-1 py-0.5 bg-blue-50 text-blue-600 rounded">
                                {item.size}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeFromCart(item.id)}
                            className="h-5 w-5 p-0"
                          >
                            <Minus className="h-2 w-2" />
                          </Button>
                          <span className="w-6 text-center text-xs">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => addToCart(item)}
                            className="h-5 w-5 p-0"
                          >
                            <Plus className="h-2 w-2" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Packaging Option */}
                  <div className="space-y-1 mb-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="packaging"
                        checked={includePackaging}
                        onCheckedChange={setIncludePackaging}
                      />
                      <Label htmlFor="packaging" className="text-sm">
                        Include Packaging (₹{packagingCharge})
                      </Label>
                    </div>
                  </div>

                  {/* Cart Summary */}
                  <div className="space-y-1 pt-2 border-t">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span>₹{getCartSubtotal().toLocaleString()}</span>
                    </div>
                    {includePackaging && packagingCharge > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Packaging:</span>
                        <span>₹{packagingCharge}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span>GST (12%):</span>
                      <span>₹{getCartTaxWithPackaging().toLocaleString()}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold">
                      <span>Total:</span>
                      <span>₹{getCartTotalWithPackaging().toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Checkout Button */}
                  <Button
                    className="w-full mt-3 bg-black hover:bg-gray-800 text-white font-semibold py-3"
                    onClick={() => setCheckoutDialog(true)}
                    disabled={cart.length === 0}
                    size="lg"
                  >
                    <Receipt className="h-4 w-4 mr-2" />
                    Proceed to Checkout
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Checkout Dialog */}
      <Dialog open={checkoutDialog} onOpenChange={setCheckoutDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Checkout</DialogTitle>
            <DialogDescription>
              Review your order details and complete the payment.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Order Summary */}
            <div className="space-y-2">
              <h4 className="font-medium">Order Summary</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{getCartSubtotal().toLocaleString()}</span>
                </div>
                {includePackaging && packagingCharge > 0 && (
                  <div className="flex justify-between">
                    <span>Packaging:</span>
                    <span>₹{packagingCharge}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>GST (12%):</span>
                  <span>₹{getCartTaxWithPackaging().toLocaleString()}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount:</span>
                    <span>-₹{discount.toLocaleString()}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span>₹{getFinalTotal().toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Discount Section */}
            <div className="space-y-3">
              <Label>Discount</Label>
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <Input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                    placeholder="Enter discount amount"
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDiscount(0)}
                    disabled={discount === 0}
                  >
                    Clear
                  </Button>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDiscount(50)}
                    className="flex-1"
                  >
                    ₹50
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDiscount(100)}
                    className="flex-1"
                  >
                    ₹100
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDiscount(Math.round(getCartTotalWithPackaging() * 0.1))}
                    className="flex-1"
                  >
                    10%
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDiscount(Math.round(getCartTotalWithPackaging() * 0.2))}
                    className="flex-1"
                  >
                    20%
                  </Button>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-3">
              <Label>Payment Method</Label>
              <div className="grid grid-cols-3 gap-2">
                <Card 
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    paymentMethod === 'CASH' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setPaymentMethod('CASH')}
                >
                  <CardContent className="p-3 text-center">
                    <div className="space-y-1">
                      <div className="text-lg">💵</div>
                      <div className="text-sm font-medium">Cash</div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card 
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    paymentMethod === 'UPI' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setPaymentMethod('UPI')}
                >
                  <CardContent className="p-3 text-center">
                    <div className="space-y-1">
                      <div className="text-lg">📱</div>
                      <div className="text-sm font-medium">UPI</div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card 
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    paymentMethod === 'BOTH' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setPaymentMethod('BOTH')}
                >
                  <CardContent className="p-3 text-center">
                    <div className="space-y-1">
                      <div className="text-lg">💳</div>
                      <div className="text-sm font-medium">Both</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Payment Amount Fields */}
            {paymentMethod === 'CASH' && (
              <div className="space-y-2">
                <Label htmlFor="received">Amount Received</Label>
                <Input
                  id="received"
                  type="number"
                  value={receivedAmount}
                  onChange={(e) => setReceivedAmount(Number(e.target.value))}
                  placeholder="Enter received amount"
                />
                {receivedAmount > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Change: ₹{getChangeAmount().toLocaleString()}
                  </p>
                )}
              </div>
            )}

            {paymentMethod === 'BOTH' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cash-amount">Cash Amount</Label>
                  <Input
                    id="cash-amount"
                    type="number"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(Number(e.target.value))}
                    placeholder="Cash amount"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="upi-amount">UPI Amount</Label>
                  <Input
                    id="upi-amount"
                    type="number"
                    value={upiAmount}
                    onChange={(e) => setUpiAmount(Number(e.target.value))}
                    placeholder="UPI amount"
                  />
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckoutDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handlePlaceOrder} disabled={processingPayment}>
              {processingPayment ? 'Processing...' : 'Place Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={receiptDialog} onOpenChange={setReceiptDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Order Completed</DialogTitle>
            <DialogDescription>
              Your order has been successfully processed and completed.
            </DialogDescription>
          </DialogHeader>
          
          {lastSale && (
            <div className="space-y-4">
              <div className="text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                <p className="text-lg font-medium">Order Successful!</p>
                <p className="text-sm text-muted-foreground">
                  Transaction ID: {lastSale.transactionId}
                </p>
              </div>
              
              {/* Thermal Receipt Preview */}
              <div className="border rounded-lg p-3 bg-gray-50 max-h-64 overflow-y-auto">
                <div className="text-xs font-mono leading-tight" style={{ width: '80mm', maxWidth: '100%' }}>
                  {/* Header */}
                  {settings?.showBusinessName && (
                    <div className="text-center font-bold text-sm mb-1">
                      {settings?.businessName || `Welcome, ${currentUser?.displayName || 'Guest'}`}
                    </div>
                  )}
                  
                  {settings?.thermalHeaderText && (
                    <div className="text-center mb-1">
                      {settings.thermalHeaderText}
                    </div>
                  )}
                  
                  {settings?.showBusinessAddress && settings?.businessAddress && (
                    <div className="text-center mb-1">
                      {settings.businessAddress}
                    </div>
                  )}
                  
                  {settings?.showGstNumber && settings?.gstNumber && (
                    <div className="text-center mb-1">
                      GST: {settings.gstNumber}
                    </div>
                  )}
                  
                  {settings?.showDividers && <div className="border-t border-dashed border-gray-400 my-1" />}
                  
                  {/* Transaction Details */}
                  <div className="text-left">
                    {settings?.showReceiptNumber && (
                      <div>Receipt #: {lastSale.transactionId}</div>
                    )}
                    {settings?.showDateTime && (
                      <>
                        <div>Date: {format(new Date(), 'dd/MM/yyyy')}</div>
                        <div>Time: {format(new Date(), 'HH:mm:ss')}</div>
                      </>
                    )}
                  </div>
                  
                  {settings?.showDividers && <div className="border-t border-dashed border-gray-400 my-1" />}
                  
                  {/* Items */}
                  <div className="space-y-1">
                    {(lastSale.items || []).map((item, index) => (
                      <div key={index}>
                        <div className="flex justify-between">
                          <span className="truncate flex-1 mr-2">{item.name || 'Unknown Item'}</span>
                          <span>₹{(item.price || 0).toLocaleString()}</span>
                        </div>
                        {(item.quantity || 1) > 1 && (
                          <div className="flex justify-between text-xs text-gray-600">
                            <span>{item.quantity || 1} x ₹{(item.price || 0).toLocaleString()}</span>
                            <span>₹{((item.quantity || 1) * (item.price || 0)).toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {settings?.showDividers && <div className="border-t border-dashed border-gray-400 my-1" />}
                  
                  {/* Totals */}
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>₹{(lastSale.subtotal || 0).toLocaleString()}</span>
                    </div>
                    {(lastSale.packagingCharge || 0) > 0 && (
                      <div className="flex justify-between">
                        <span>Packaging:</span>
                        <span>₹{(lastSale.packagingCharge || 0).toLocaleString()}</span>
                      </div>
                    )}
                    {(lastSale.tax || 0) > 0 && (
                      <div className="flex justify-between">
                        <span>Tax:</span>
                        <span>₹{(lastSale.tax || 0).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold border-t border-gray-400 pt-1">
                      <span>TOTAL:</span>
                      <span>₹{(lastSale.total || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Payment ({lastSale.paymentMethod || 'Cash'}):</span>
                      <span>₹{(lastSale.amountPaid || 0).toLocaleString()}</span>
                    </div>
                    {(lastSale.changeAmount || 0) > 0 && (
                      <div className="flex justify-between font-bold">
                        <span>Change:</span>
                        <span>₹{(lastSale.changeAmount || 0).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                  
                  {settings?.showDividers && <div className="border-t border-dashed border-gray-400 my-1" />}
                  
                  {settings?.thermalFooterText && (
                    <div className="text-center mt-2">
                      {settings.thermalFooterText}
                    </div>
                  )}
                  
                  <div className="text-center mt-2 text-xs">
                    Thank you for your business!
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total Amount:</span>
                  <span>₹{lastSale.total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Method:</span>
                  <span>{lastSale.paymentMethod}</span>
                </div>
                {lastSale.changeAmount > 0 && (
                  <div className="flex justify-between font-medium">
                    <span>Change Given:</span>
                    <span>₹{lastSale.changeAmount.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setReceiptDialog(false)}>
              Close
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hidden Thermal Receipt for Browser Printing */}
      <div 
        ref={thermalReceiptRef}
        style={{
          display: 'none',
          fontFamily: settings?.thermalFontFamily || 'monospace',
          fontSize: settings?.thermalFontSize || '12px',
          lineHeight: settings?.thermalLineHeight || '1.2',
          width: settings?.printerWidth === '58mm' ? '58mm' : settings?.printerWidth === 'A4' ? '210mm' : '80mm'
        }}
      >
        <style>{`
          @media print {
            @page {
              size: ${settings?.printerWidth === '58mm' ? '58mm auto' : settings?.printerWidth === 'A4' ? 'A4' : '80mm auto'};
              margin: 0;
            }
            body {
              margin: 0;
              padding: 8px;
              font-family: ${settings?.thermalFontFamily || 'monospace'};
              font-size: ${settings?.thermalFontSize || '12px'};
              line-height: ${settings?.thermalLineHeight || '1.2'};
            }
            .thermal-receipt {
              width: 100%;
              max-width: none;
            }
            .center { text-align: center; }
            .left { text-align: left; }
            .right { text-align: right; }
            .bold { font-weight: bold; }
            .divider { border-top: 1px dashed #000; margin: 4px 0; }
            .item-row { display: flex; justify-content: space-between; }
          }
        `}</style>
        
        {lastSale && (
          <div className="thermal-receipt">
            {/* Header */}
            {settings?.showBusinessName && (
              <div className="center bold" style={{ fontSize: '16px', marginBottom: '4px' }}>
                {settings?.businessName || `Welcome, ${currentUser?.displayName || 'Guest'}`}
              </div>
            )}
            
            {settings?.thermalHeaderText && (
              <div className="center" style={{ marginBottom: '4px' }}>
                {settings.thermalHeaderText}
              </div>
            )}
            
            {settings?.showBusinessAddress && settings?.businessAddress && (
              <div className="center" style={{ marginBottom: '4px' }}>
                {settings.businessAddress}
              </div>
            )}
            
            {settings?.showGstNumber && settings?.gstNumber && (
              <div className="center" style={{ marginBottom: '4px' }}>
                GST: {settings.gstNumber}
              </div>
            )}
            
            {settings?.showDividers && <div className="divider" />}
            
            {/* Transaction Details */}
            <div className="left">
              {settings?.showReceiptNumber && (
                <div>Receipt #: {lastSale.transactionId}</div>
              )}
              {settings?.showDateTime && (
                <>
                  <div>Date: {format(new Date(), 'dd/MM/yyyy')}</div>
                  <div>Time: {format(new Date(), 'HH:mm:ss')}</div>
                </>
              )}
              <div>Cashier: {currentUser?.displayName || 'Staff'}</div>
            </div>
            
            {settings?.showDividers && <div className="divider" />}
            
            {/* Items */}
            <div>
              {lastSale.items.map((item, index) => (
                <div key={index}>
                  <div className="item-row">
                    <span>{item.name}</span>
                    <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                  <div style={{ paddingLeft: '8px', fontSize: '11px' }}>
                    {item.quantity} x ₹{item.price.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
            
            {settings?.showDividers && <div className="divider" />}
            
            {/* Totals */}
            <div>
              <div className="item-row">
                <span>Subtotal:</span>
                <span>₹{lastSale.subtotal.toFixed(2)}</span>
              </div>
              
              {settings?.showTaxBreakdown && (
                <div className="item-row">
                  <span>GST (12%):</span>
                  <span>₹{lastSale.tax.toFixed(2)}</span>
                </div>
              )}
              
              <div className="divider" />
              <div className="item-row bold" style={{ fontSize: '14px' }}>
                <span>TOTAL:</span>
                <span>₹{lastSale.total.toFixed(2)}</span>
              </div>
            </div>
            
            {/* Payment Details */}
            {settings?.showPaymentMethod && (
              <div style={{ marginTop: '8px' }}>
                <div>Payment: {lastSale.paymentMethod}</div>
                {lastSale.changeAmount > 0 && (
                  <div>Change: ₹{lastSale.changeAmount.toFixed(2)}</div>
                )}
              </div>
            )}
            
            {settings?.showDividers && <div className="divider" />}
            
            {/* Footer */}
            <div className="center" style={{ marginTop: '8px' }}>
              {settings?.thermalFooterText || 'Thank you for your business!'}
            </div>
            
            <div style={{ marginTop: '16px' }}></div>
          </div>
        )}
      </div>

    </div>
  )
}

export default Dashboard