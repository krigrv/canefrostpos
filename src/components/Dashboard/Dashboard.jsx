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
  MessageSquare,
  FileText
} from 'lucide-react'
import { useInventory } from '../../hooks/useInventory'
import { useCustomers } from '../../contexts/CustomerContext'
import { useSettings } from '../../contexts/SettingsContext'
import { useAuth } from '../../contexts/AuthContextSupabase'

import toast from 'react-hot-toast'
import { format } from 'date-fns'
// import { render, Printer as ThermalPrinter, Text, Row, Br, Line, Cut } from 'react-thermal-printer'
import { useReactToPrint } from 'react-to-print'
import { jsPDF } from 'jspdf'

// Import SVG icons - using static paths for Vercel deployment
const CitrusIcon = '/static/citrus.svg'
const BerriesIcon = '/static/berries.svg'
const TropicalIcon = '/static/tropical.svg'
const SpicedHerbalOthersIcon = '/static/spicedherbalothers.svg'

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
    categories,
    sales,
    addSale
  } = useInventory()
  
  const { customers } = useCustomers()
  const { settings } = useSettings()
  const { currentUser } = useAuth()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedType, setSelectedType] = useState('all')

  // Helper function to extract category type from full category string
  const getMainCategoryName = (fullCategory) => {
    if (!fullCategory) return null;
    // Extract category type like "Cane Fusion" or "Cane Juice" from strings like "Citrus - Cane Fusion (CFRST63)"
    const parts = fullCategory.split(' - ');
    if (parts.length >= 2) {
      // Get the second part and remove the product code in parentheses
      return parts[1].replace(/\s*\([^)]*\)$/, '');
    }
    return fullCategory;
  };

  // Memoized categories and types based on products and filters
  const productCategories = useMemo(() => {
    const relevantProducts = products.filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const mainCategories = relevantProducts.map(p => getMainCategoryName(p.category)).filter(Boolean);
    const uniqueCategories = new Set(mainCategories);
    return ['all', ...Array.from(uniqueCategories).sort()];
  }, [products, searchTerm]);

  const productTypes = useMemo(() => {
    const relevantProducts = products.filter(product => 
      (selectedCategory === 'all' || product.category === selectedCategory) &&
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const uniqueTypes = new Set(relevantProducts.map(p => p.type).filter(Boolean));
    return ['all', ...Array.from(uniqueTypes).sort()];
  }, [products, selectedCategory, searchTerm]);
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
  const [showMobileCart, setShowMobileCart] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [customerSearchTerm, setCustomerSearchTerm] = useState('')
  
  // Thermal receipt ref for browser printing fallback
  const thermalReceiptRef = useRef()

  // Browser print function using react-to-print
  const handleBrowserPrint = useReactToPrint({
    content: () => thermalReceiptRef.current,
    documentTitle: 'Thermal Receipt'
  })

  // PDF generation function
  const handlePDFGeneration = () => {
    if (!lastSale) return;
    
    try {
      // Create new PDF document
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Set font
      doc.setFont('helvetica');
      
      let yPosition = 20;
      const lineHeight = 6;
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Header
      if (settings?.showBusinessName) {
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        const businessName = settings?.businessName || `Welcome, ${currentUser?.user_metadata?.displayName || currentUser?.displayName || 'Guest'}`;
        doc.text(businessName, pageWidth / 2, yPosition, { align: 'center' });
        yPosition += lineHeight + 2;
        
        if (settings?.thermalHeaderText) {
          doc.setFontSize(12);
          doc.setFont('helvetica', 'normal');
          doc.text(settings.thermalHeaderText, pageWidth / 2, yPosition, { align: 'center' });
          yPosition += lineHeight;
        }
      }
      
      if (settings?.showBusinessAddress && settings?.businessAddress) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(settings.businessAddress, pageWidth / 2, yPosition, { align: 'center' });
        yPosition += lineHeight;
      }
      
      if (settings?.showGstNumber && settings?.gstNumber) {
        doc.setFontSize(10);
        doc.text(`GST: ${settings.gstNumber}`, pageWidth / 2, yPosition, { align: 'center' });
        yPosition += lineHeight;
      }
      
      // Divider
      if (settings?.showDividers) {
        yPosition += 3;
        doc.line(20, yPosition, pageWidth - 20, yPosition);
        yPosition += 5;
      }
      
      // Transaction Details
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      if (settings?.showReceiptNumber) {
        doc.text(`Receipt #: ${lastSale.transactionId}`, 20, yPosition);
        yPosition += lineHeight;
      }
      
      if (settings?.showDateTime) {
        doc.text(`Date: ${format(new Date(), 'dd/MM/yyyy')}`, 20, yPosition);
        yPosition += lineHeight;
        doc.text(`Time: ${format(new Date(), 'HH:mm:ss')}`, 20, yPosition);
        yPosition += lineHeight;
      }
      
      doc.text(`Cashier: ${currentUser?.displayName || 'Staff'}`, 20, yPosition);
      yPosition += lineHeight + 3;
      
      // Divider
      if (settings?.showDividers) {
        doc.line(20, yPosition, pageWidth - 20, yPosition);
        yPosition += 5;
      }
      
      // Items header
      doc.setFont('helvetica', 'bold');
      doc.text('Item', 20, yPosition);
      doc.text('Qty', pageWidth - 80, yPosition);
      doc.text('Price', pageWidth - 60, yPosition);
      doc.text('Total', pageWidth - 30, yPosition, { align: 'right' });
      yPosition += lineHeight;
      
      // Items
      doc.setFont('helvetica', 'normal');
      lastSale.items.forEach((item) => {
        doc.text(item.name, 20, yPosition);
        doc.text(item.quantity.toString(), pageWidth - 80, yPosition);
        doc.text(`₹${item.price.toFixed(2)}`, pageWidth - 60, yPosition);
        doc.text(`₹${(item.price * item.quantity).toFixed(2)}`, pageWidth - 30, yPosition, { align: 'right' });
        yPosition += lineHeight;
      });
      
      yPosition += 3;
      
      // Divider
      if (settings?.showDividers) {
        doc.line(20, yPosition, pageWidth - 20, yPosition);
        yPosition += 5;
      }
      
      // Totals
      doc.text('Subtotal:', pageWidth - 80, yPosition);
      doc.text(`₹${lastSale.subtotal.toFixed(2)}`, pageWidth - 30, yPosition, { align: 'right' });
      yPosition += lineHeight;
      
      if (settings?.showTaxBreakdown) {
        doc.text('GST (12%):', pageWidth - 80, yPosition);
        doc.text(`₹${lastSale.tax.toFixed(2)}`, pageWidth - 30, yPosition, { align: 'right' });
        yPosition += lineHeight;
      }
      
      // Total line
      doc.line(pageWidth - 90, yPosition, pageWidth - 20, yPosition);
      yPosition += 3;
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('TOTAL:', pageWidth - 80, yPosition);
      doc.text(`₹${lastSale.total.toFixed(2)}`, pageWidth - 30, yPosition, { align: 'right' });
      yPosition += lineHeight + 3;
      
      // Payment Details
      if (settings?.showPaymentMethod) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Payment: ${lastSale.paymentMethod}`, 20, yPosition);
        yPosition += lineHeight;
        
        if (lastSale.changeAmount > 0) {
          doc.text(`Change: ₹${lastSale.changeAmount.toFixed(2)}`, 20, yPosition);
          yPosition += lineHeight;
        }
      }
      
      yPosition += 5;
      
      // Divider
      if (settings?.showDividers) {
        doc.line(20, yPosition, pageWidth - 20, yPosition);
        yPosition += 5;
      }
      
      // Footer
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      const footerText = settings?.thermalFooterText || 'Thank you for your business!';
      doc.text(footerText, pageWidth / 2, yPosition, { align: 'center' });
      
      // Save the PDF
      const fileName = `receipt-${lastSale.transactionId}-${format(new Date(), 'yyyyMMdd-HHmmss')}.pdf`;
      doc.save(fileName);
      
      toast.success('Receipt PDF generated and downloaded successfully!');
      
    } catch (error) {
      console.error('PDF generation failed:', error);
      toast.error('Failed to generate PDF receipt. Please try again.');
    }
  }

  // Print function for receipt (thermal printing temporarily disabled)
  const handlePrint = async () => {
    if (!lastSale) return;
    
    try {
      // Using browser printing as thermal printing is currently disabled
      console.log('Using browser print for receipt');
      handleBrowserPrint();
      toast.success('Receipt sent to browser printer!');
    } catch (error) {
      console.error('Printing failed:', error);
      toast.error('Failed to print receipt. Please check your printer connection.');
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
  // Memoize packaging charge calculation to prevent unnecessary re-computations
  const packagingCharge = useMemo(() => {
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
  }, [cart])



  // Get unique categories from products using category field
  const categoryFilters = useMemo(() => {
    // Only include main categories like 'Cane Blend', 'Cane Fusion', etc.
    // and exclude type values like 'Tropical', 'Citrus', etc.
    const mainCategories = products
      .map(product => getMainCategoryName(product.category))
      .filter(Boolean)
      .filter(category => 
        category.includes('Cane') || 
        category === 'Special' || 
        category === 'Others'
      );
    const uniqueCategoryNames = new Set(mainCategories);
    return Array.from(uniqueCategoryNames).sort();
  }, [products]);

  // Get unique product types for filtering
  const typeFilters = useMemo(() => {
    const filterSet = new Set()
    products.forEach(product => {
      if (product.type) {
        filterSet.add(product.type)
      }
    })
    return Array.from(filterSet).sort()
  }, [products])

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return products
      .filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
        const productMainCategory = getMainCategoryName(product.category)
        const matchesCategory = !selectedCategory || selectedCategory === 'all' || 
                             productMainCategory === selectedCategory
        const matchesType = !selectedType || selectedType === 'all' || 
                           (product.type && product.type.toLowerCase() === selectedType.toLowerCase())
        return matchesSearch && matchesCategory && matchesType
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [products, searchTerm, selectedCategory, selectedType])

  // Group products by size for Cane Blend category
  const groupedProducts = useMemo(() => {
    const shouldGroup = selectedCategory === 'Cane Blend' || (selectedCategory === 'all' && !searchTerm)
    
    if (!shouldGroup) {
      return { all: filteredProducts }
    }

    const groups = {
      '240ml': [],
      '500ml': [],
      other: []
    }

    filteredProducts.forEach(product => {
      const productMainCategory = getMainCategoryName(product.category)
      const size = product.size || getProductSize(product.name)
      
      if (productMainCategory === 'Cane Blend') {
        if (size === '240ml') {
          groups['240ml'].push(product)
        } else if (size === '500ml') {
          groups['500ml'].push(product)
        } else {
          groups.other.push(product)
        }
      } else {
        groups.other.push(product)
      }
    })

    return groups
  }, [filteredProducts, selectedCategory, searchTerm])

  // Memoize cart calculations to prevent unnecessary re-computations
  const cartTotalWithPackaging = useMemo(() => {
    const baseTotal = getCartTotal()
    return includePackaging ? baseTotal + packagingCharge : baseTotal
  }, [getCartTotal, includePackaging, packagingCharge])

  // Memoize final total calculation
  const finalTotal = useMemo(() => {
    return cartTotalWithPackaging - discount
  }, [cartTotalWithPackaging, discount])

  /**
   * Gets the current packaging charge for 500ml bottles in cane fusion/blend categories
   * @returns {number} The packaging charge amount in rupees
   */
  const getPackagingCharge = () => {
    return packagingCharge || 0
  }

  // Memoize change amount calculation
  const changeAmount = useMemo(() => {
    if (paymentMethod === 'CASH') {
      return Math.max(0, receivedAmount - finalTotal)
    }
    if (paymentMethod === 'BOTH') {
      const totalPaid = cashAmount + upiAmount
      return Math.max(0, totalPaid - finalTotal)
    }
    return 0
  }, [paymentMethod, receivedAmount, finalTotal, cashAmount, upiAmount])

  // Memoize tax calculation with packaging charge
  const cartTaxWithPackaging = useMemo(() => {
    const baseTax = getCartTax()
    if (includePackaging) {
      const packagingTax = packagingCharge * 0.12
      return baseTax + packagingTax
    }
    return baseTax
  }, [getCartTax, includePackaging, packagingCharge])

  /**
   * Gets the cart total including optional packaging charge
   * @returns {number} The total cart amount with packaging if enabled
   */
  const getCartTotalWithPackaging = () => {
    return cartTotalWithPackaging || 0
  }

  /**
   * Gets the final total after applying discounts
   * @returns {number} The final amount to be paid
   */
  const getFinalTotal = () => {
    return finalTotal || 0
  }

  /**
   * Calculates the change amount to be returned to customer
   * @returns {number} The change amount in rupees
   */
  const getChangeAmount = () => {
    return changeAmount || 0
  }

  /**
   * Gets the total tax amount including packaging tax if applicable
   * @returns {number} The total tax amount in rupees
   */
  const getCartTaxWithPackaging = () => {
    return cartTaxWithPackaging || 0
  }

  /**
   * Generates a unique order ID with INVCFN format
   * @returns {string} Formatted transaction ID
   */
  const generateOrderId = () => {
    const timestamp = Date.now().toString().slice(-6)
    const randomNum = Math.floor(Math.random() * 100).toString().padStart(2, '0')
    return `INVCFN${timestamp}${randomNum}`
  }

  /**
   * Handles the order placement process including validation, payment processing,
   * and saving the sale to the database
   * @returns {Promise<void>}
   */
  const handlePlaceOrder = async () => {
    // Input validation
    if (cart.length === 0) {
      toast.error('Cart is empty')
      return
    }

    if (processingPayment) {
      toast.warning('Order is already being processed')
      return
    }

    // Payment validation
    const finalAmount = getFinalTotal()
    if (finalAmount <= 0) {
      toast.error('Invalid order total')
      return
    }

    // Payment method specific validation
    if (paymentMethod === 'CASH' && receivedAmount < finalAmount) {
      toast.error('Received amount is less than total amount')
      return
    }

    if (paymentMethod === 'BOTH') {
      const totalPaid = cashAmount + upiAmount
      if (isNaN(totalPaid) || totalPaid < finalAmount) {
        toast.error('Total payment amount is less than bill amount')
        return
      }
    }

    setProcessingPayment(true)
    
    try {
      // Simulate processing delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Prepare sale items including packaging if enabled
      const saleItems = [...cart]
      if (includePackaging) {
        saleItems.push({
          id: '00000000-0000-0000-0000-000000000001', // Special UUID for packaging
          name: 'PACKAGING CHARGE',
          price: packagingCharge,
          quantity: 1,
          category: 'Others'
        })
      }
      
      // Create sale object with all required information
      const transactionId = generateOrderId()
      const sale = {
        transactionId,
        items: saleItems,
        subtotal: getCartTotalWithPackaging() - getCartTaxWithPackaging(),
        tax: getCartTaxWithPackaging(),
        total: getFinalTotal(),
        originalTotal: getCartTotalWithPackaging(),
        discount: discount,
        timestamp: new Date(),
        paymentMethod: paymentMethod,
        cashAmount: paymentMethod === 'CASH' ? receivedAmount : (paymentMethod === 'BOTH' ? cashAmount : 0),
        upiAmount: paymentMethod === 'UPI' ? getFinalTotal() : (paymentMethod === 'BOTH' ? upiAmount : 0),
        receivedAmount: paymentMethod === 'CASH' ? receivedAmount : 0,
        changeAmount: getChangeAmount(),
        customer_id: null,
        staff_id: null,
        outlet_id: null
      }
      
      try {
        // Save sale to database (Supabase with Firebase fallback)
        await addSale(sale)
        
        // Update UI state after successful save
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
        
        toast.success(`Order #${transactionId} placed successfully!`)
      } catch (dbError) {
        console.error('Database error:', dbError)
        toast.error(`Database error: ${dbError.message || 'Failed to save order'}`)
        throw dbError // Re-throw to be caught by outer catch
      }
    } catch (error) {
      console.error('Order processing error:', error)
      toast.error(`Failed to place order: ${error.message || 'Unknown error'}`)
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

  // Run accessibility check on component mount
  useEffect(() => {
    const runAccessibilityCheck = async () => {
      try {
        // This will check for accessibility issues in the component
        if (typeof window !== 'undefined') {
          const { generateAccessibilityReport } = await import('../../utils/accessibility');
          const report = generateAccessibilityReport();
          console.log('Dashboard Accessibility Report:', report);
          
          // Log any critical issues
          if (report.wcag && report.wcag.criticalIssues && report.wcag.criticalIssues.length > 0) {
            console.warn('Critical accessibility issues found in Dashboard:', report.wcag.criticalIssues);
          }
        }
      } catch (error) {
        console.error('Failed to run accessibility check:', error);
      }
    };
    
    // Run the check after the component has rendered
    const timer = setTimeout(() => {
      runAccessibilityCheck();
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="h-full flex flex-col relative">
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
                Welcome, {currentUser?.user_metadata?.displayName || currentUser?.displayName || 'Guest'}
              </h1>
              <p className="text-gray-300 text-sm">
                Point of Sale System • {format(new Date(), 'EEEE, MMMM do, yyyy')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main POS Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-1 p-1 flex-1 pb-20 lg:pb-1">
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
                  {/* Category Dropdown - Only visible on mobile */}
                  <div className="block sm:hidden">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
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
                      <div>
                        <Select value={selectedType} onValueChange={setSelectedType}>
                          <SelectTrigger>
                            <SelectValue placeholder="Filter by type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            {typeFilters.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Category Cards - Only visible on desktop */}
                <div className="hidden sm:flex flex-col gap-3 mt-3">
                  {/* Category row */}
                  <div>
                    <div className="text-sm font-medium mb-2">Categories</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                      <Card 
                        className={`cursor-pointer transition-all duration-200 hover:shadow-md ${selectedCategory === 'all' ? 'ring-2 ring-black bg-muted' : ''}`}
                        onClick={() => setSelectedCategory('all')}
                      >
                        <CardContent className="p-3 flex items-center justify-start">
                          <div className="text-sm font-medium truncate">All Categories</div>
                        </CardContent>
                      </Card>
                      
                      {categoryFilters.map((category) => (
                        <Card 
                          key={category}
                          className={`cursor-pointer transition-all duration-200 hover:shadow-md ${selectedCategory === category ? 'ring-2 ring-black bg-muted' : ''}`}
                          onClick={() => setSelectedCategory(category)}
                        >
                          <CardContent className="p-3 flex items-center justify-start">
                            <div className="text-sm font-medium truncate">{category}</div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                  
                  {/* Type row */}
                  <div>
                    <div className="text-sm font-medium mb-2">Types</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
                      <Card 
                        className={`cursor-pointer transition-all duration-200 hover:shadow-md ${selectedType === 'all' ? 'ring-2 ring-black bg-muted' : ''}`}
                        onClick={() => setSelectedType('all')}
                      >
                        <CardContent className="p-3 flex items-center justify-start">
                          <div className="text-sm font-medium truncate">All Types</div>
                        </CardContent>
                      </Card>
                      
                      {/* Citrus Category Card */}
                      <Card 
                        className={`cursor-pointer transition-all duration-200 hover:shadow-md ${selectedType === 'citrus' ? 'ring-2 ring-black bg-muted' : ''}`}
                        onClick={() => setSelectedType('citrus')}
                      >
                        <CardContent className="p-3 flex items-center justify-start">
                          <img src={CitrusIcon} alt="Citrus" className="w-6 h-6 mr-2 flex-shrink-0" />
                          <div className="text-sm font-medium truncate">Citrus</div>
                        </CardContent>
                      </Card>
                      
                      {/* Berries Category Card */}
                      <Card 
                        className={`cursor-pointer transition-all duration-200 hover:shadow-md ${selectedType === 'berries' ? 'ring-2 ring-black bg-muted' : ''}`}
                        onClick={() => setSelectedType('berries')}
                      >
                        <CardContent className="p-3 flex items-center justify-start">
                          <img src={BerriesIcon} alt="Berries" className="w-6 h-6 mr-2 flex-shrink-0" />
                          <div className="text-sm font-medium truncate">Berries</div>
                        </CardContent>
                      </Card>
                      
                      {/* Tropical Category Card */}
                      <Card 
                        className={`cursor-pointer transition-all duration-200 hover:shadow-md ${selectedType === 'tropical' ? 'ring-2 ring-black bg-muted' : ''}`}
                        onClick={() => setSelectedType('tropical')}
                      >
                        <CardContent className="p-3 flex items-center justify-start">
                          <img src={TropicalIcon} alt="Tropical" className="w-6 h-6 mr-2 flex-shrink-0" />
                          <div className="text-sm font-medium truncate">Tropical</div>
                        </CardContent>
                      </Card>
                      
                      {/* Spiced/Herbal/Others Category Card */}
                      <Card 
                        className={`cursor-pointer transition-all duration-200 hover:shadow-md ${selectedType === 'spiced/herbal/others' ? 'ring-2 ring-black bg-muted' : ''}`}
                        onClick={() => setSelectedType('spiced/herbal/others')}
                      >
                        <CardContent className="p-3 flex items-center justify-start">
                          <img src={SpicedHerbalOthersIcon} alt="Spiced/Herbal/Others" className="w-6 h-6 mr-2 flex-shrink-0" />
                          <div className="text-sm font-medium truncate">Spiced/Herbal/Others</div>
                        </CardContent>
                      </Card>
                      
                      {/* Dynamic Type Cards */}
                      {typeFilters
                        .filter(type => !['citrus', 'berries', 'tropical', 'spiced/herbal/others', 'spiced, herbal & others'].includes(type.toLowerCase()))
                        .map((type) => (
                          <Card 
                            key={type}
                            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${selectedType === type ? 'ring-2 ring-black bg-muted' : ''}`}
                            onClick={() => setSelectedType(type)}
                          >
                            <CardContent className="p-3 flex items-center justify-start">
                              <div className="text-sm font-medium truncate">{type.charAt(0).toUpperCase() + type.slice(1)}</div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  </div>
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
                  <div className="space-y-4 p-2">
                    {groupedProducts.all ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 auto-rows-max">
                        {groupedProducts.all.map((product) => {
                          const isInCart = cart.some(item => item.id === product.id)
                          return (
                            <Card 
              key={product.id} 
              className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                isInCart ? 'ring-2 ring-black bg-muted relative z-10' : 'hover:bg-muted'
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
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-base">₹{product.price}</span>
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px]">{product.stock}</span>
                                  <div 
                                    className={`h-2 w-2 rounded-full ${product.stock > 15 ? 'bg-green-500' : product.stock > 10 ? 'bg-orange-500' : 'bg-red-500'}`}
                                  ></div>
                                  {isInCart && (
                                    <div className="flex items-center justify-center">
                                      <CheckCircle className="h-4 w-4 text-green-600" />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                              </CardContent>
                            </Card>
                          )
                        })}
                      </div>
                    ) : (
                      <>
                        {/* 240ml Section */}
                        {groupedProducts['240ml']?.length > 0 && (
                          <>
                            <div className="flex items-center gap-2 mb-3">
                              <span className="w-2 h-2 bg-primary rounded-full"></span>
                              <h3 className="font-semibold text-sm text-primary">Cane Blend - 240ml</h3>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 auto-rows-max mb-6">
                              {groupedProducts['240ml'].map((product) => {
                                const isInCart = cart.some(item => item.id === product.id)
                                return (
                                  <Card 
                    key={product.id} 
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                      isInCart ? 'ring-2 ring-black bg-muted relative z-10' : 'hover:bg-muted'
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
                                        </div>
                                        <div className="flex justify-between items-center">
                                          <span className="font-bold text-base">₹{product.price}</span>
                                          <div className="flex items-center gap-1">
                                            <span className="text-[10px]">{product.stock}</span>
                                            <div 
                                              className={`h-2 w-2 rounded-full ${product.stock > 15 ? 'bg-green-500' : product.stock > 10 ? 'bg-orange-500' : 'bg-red-500'}`}
                                            ></div>
                                            {isInCart && (
                                              <div className="flex items-center justify-center">
                                                <CheckCircle className="h-4 w-4 text-green-600" />
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                )
                              })}
                            </div>
                          </>
                        )}

                        {/* 500ml Section */}
                        {groupedProducts['500ml']?.length > 0 && (
                          <>
                            <div className="flex items-center gap-2 mb-3">
                              <span className="w-2 h-2 bg-primary rounded-full"></span>
                              <h3 className="font-semibold text-sm text-primary">Cane Blend - 500ml</h3>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 auto-rows-max mb-6">
                              {groupedProducts['500ml'].map((product) => {
                                const isInCart = cart.some(item => item.id === product.id)
                                return (
                                  <Card 
                    key={product.id} 
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                      isInCart ? 'ring-2 ring-black bg-muted relative z-10' : 'hover:bg-muted'
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
                                        </div>
                                        <div className="flex justify-between items-center">
                                          <span className="font-bold text-base">₹{product.price}</span>
                                          <div className="flex items-center gap-1">
                                            <span className="text-[10px]">{product.stock}</span>
                                            <div 
                                              className={`h-2 w-2 rounded-full ${product.stock > 15 ? 'bg-green-500' : product.stock > 10 ? 'bg-orange-500' : 'bg-red-500'}`}
                                            ></div>
                                            {isInCart && (
                                              <div className="flex items-center justify-center">
                                                <CheckCircle className="h-4 w-4 text-green-600" />
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                )
                              })}
                            </div>
                          </>
                        )}

                        {/* Other Products Section */}
                        {groupedProducts.other?.length > 0 && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 auto-rows-max">
                            {groupedProducts.other.map((product) => {
                              const isInCart = cart.some(item => item.id === product.id)
                              return (
                                <Card 
                  key={product.id} 
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    isInCart ? 'ring-2 ring-black bg-muted relative z-10' : 'hover:bg-muted'
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
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <span className="font-bold text-base">₹{product.price}</span>
                                        <div className="flex items-center gap-1">
                                          <span className="text-[10px]">{product.stock}</span>
                                          <div 
                                            className={`h-2 w-2 rounded-full ${product.stock > 15 ? 'bg-green-500' : product.stock > 10 ? 'bg-orange-500' : 'bg-red-500'}`}
                                          ></div>
                                          {isInCart && (
                                            <div className="flex items-center justify-center">
                                              <CheckCircle className="h-4 w-4 text-green-600" />
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              )
                            })}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cart Area */}
        <div className="xl:col-span-1 hidden lg:block">
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
                              <span className="text-[9px] px-1 py-0.5 bg-muted text-muted-foreground rounded">
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
                            onClick={(e) => {
                              e.stopPropagation();
                              updateCartQuantity(item.id, item.quantity - 1);
                            }}
                            className="h-5 w-5 p-0"
                          >
                            <Minus className="h-2 w-2" />
                          </Button>
                          <span className="w-6 text-center text-xs">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(item);
                            }}
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
                        size="sm"
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
            <div className="space-y-2">
              <Label>Discount</Label>
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                  placeholder="₹0"
                  className="flex-1 h-8"
                />
                <div className="flex space-x-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDiscount(50)}
                    className="h-8 px-2 text-xs"
                  >
                    ₹50
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDiscount(Math.round(getCartTotalWithPackaging() * 0.1))}
                    className="h-8 px-2 text-xs"
                  >
                    10%
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDiscount(0)}
                    disabled={discount === 0}
                    className="h-8 px-2 text-xs"
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-3">
              <Label>Payment Method</Label>
              <div className="grid grid-cols-2 gap-2">
                <Card 
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    paymentMethod === 'CASH' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-muted'
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
                    paymentMethod === 'UPI' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-muted'
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
                    paymentMethod === 'BOTH' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-muted'
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
                
                <Card 
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    paymentMethod === 'CREDIT' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-muted'
                  }`}
                  onClick={() => setPaymentMethod('CREDIT')}
                >
                  <CardContent className="p-3 text-center">
                    <div className="space-y-1">
                      <div className="text-lg">🏦</div>
                      <div className="text-sm font-medium">Credit</div>
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

            {paymentMethod === 'CREDIT' && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Select Customer</Label>
                  <div className="space-y-2">
                    <Input
                      placeholder="Search customers..."
                      value={customerSearchTerm}
                      onChange={(e) => setCustomerSearchTerm(e.target.value)}
                      className="h-8"
                    />
                    <Select value={selectedCustomer?.id || ''} onValueChange={(value) => {
                      const customer = customers.find(c => c.id === value)
                      setSelectedCustomer(customer || null)
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a customer for credit" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers
                          .filter(customer => 
                            customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
                            customer.phone.includes(customerSearchTerm)
                          )
                          .map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{customer.name}</span>
                              <span className="text-xs text-muted-foreground">{customer.phone}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {selectedCustomer && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm">
                      <p className="font-medium">{selectedCustomer.name}</p>
                      <p className="text-muted-foreground">{selectedCustomer.phone}</p>
                      <p className="text-muted-foreground">Credit Limit: ₹{selectedCustomer.creditLimit || 10000}</p>
                    </div>
                  </div>
                )}
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
              <div className="border rounded-lg p-2 bg-muted max-h-64 overflow-y-auto">
                <div className="text-xs font-mono leading-tight w-full max-w-sm mx-auto">
                  {/* Header */}
                  {settings?.showBusinessName && (
                    <div className="text-center font-bold text-sm">
                      {settings?.businessName || `Welcome, ${currentUser?.user_metadata?.displayName || currentUser?.displayName || 'Guest'}`}
                    </div>
                  )}
                  
                  {settings?.thermalHeaderText && (
                    <div className="text-center">
                      {settings.thermalHeaderText}
                    </div>
                  )}
                  
                  {settings?.showBusinessAddress && settings?.businessAddress && (
                    <div className="text-center">
                      {settings.businessAddress}
                    </div>
                  )}
                  
                  {settings?.showGstNumber && settings?.gstNumber && (
                    <div className="text-center">
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
                  <div className="space-y-0.5">
                    {(lastSale.items || []).map((item, index) => (
                      <div key={index}>
                        <div className="flex justify-between">
                          <span className="truncate flex-1 mr-2">{item.name || 'Unknown Item'}</span>
                          <span className="flex-shrink-0">₹{(item.price || 0).toLocaleString()}</span>
                        </div>
                        {(item.quantity || 1) > 1 && (
                          <div className="flex justify-between text-xs text-gray-600">
                            <span>{item.quantity || 1} x ₹{(item.price || 0).toLocaleString()}</span>
                            <span className="flex-shrink-0">₹{((item.quantity || 1) * (item.price || 0)).toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {settings?.showDividers && <div className="border-t border-dashed border-gray-400 my-1" />}
                  
                  {/* Totals */}
                  <div className="space-y-0.5">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span className="flex-shrink-0">₹{(lastSale.subtotal || 0).toLocaleString()}</span>
                    </div>
                    {(lastSale.packagingCharge || 0) > 0 && (
                      <div className="flex justify-between">
                        <span>Packaging:</span>
                        <span className="flex-shrink-0">₹{(lastSale.packagingCharge || 0).toLocaleString()}</span>
                      </div>
                    )}
                    {(lastSale.tax || 0) > 0 && (
                      <div className="flex justify-between">
                        <span>Tax:</span>
                        <span className="flex-shrink-0">₹{(lastSale.tax || 0).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold border-t border-gray-400 pt-1">
                      <span>TOTAL:</span>
                      <span className="flex-shrink-0">₹{(lastSale.total || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Payment ({lastSale.paymentMethod || 'Cash'}):</span>
                      <span className="flex-shrink-0">₹{(
                        lastSale.paymentMethod === 'CASH' ? (lastSale.cashAmount || lastSale.receivedAmount || lastSale.total) :
                        lastSale.paymentMethod === 'UPI' ? (lastSale.upiAmount || lastSale.total) :
                        lastSale.paymentMethod === 'BOTH' ? ((lastSale.cashAmount || 0) + (lastSale.upiAmount || 0)) :
                        lastSale.total || 0
                      ).toLocaleString()}</span>
                    </div>
                    {(lastSale.changeAmount || 0) > 0 && (
                      <div className="flex justify-between font-bold">
                        <span>Change:</span>
                        <span className="flex-shrink-0">₹{(lastSale.changeAmount || 0).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                  
                  {settings?.showDividers && <div className="border-t border-dashed border-gray-400 my-1" />}
                  
                  {settings?.thermalFooterText && (
                    <div className="text-center mt-2">
                      {settings.thermalFooterText}
                    </div>
                  )}
                  
                  <div className="text-center text-xs mt-2">
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
            <div className="flex space-x-2">
              <Button onClick={handlePrint} variant="outline">
                <Printer className="h-4 w-4 mr-2" />
                Print Receipt
              </Button>
              <Button onClick={handlePDFGeneration}>
                <FileText className="h-4 w-4 mr-2" />
                Save as PDF
              </Button>
            </div>
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
                {settings?.businessName || `Welcome, ${currentUser?.user_metadata?.displayName || currentUser?.displayName || 'Guest'}`}
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

      {/* Mobile Cart Button - Fixed Bottom */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-lg">
        {cart.length > 0 ? (
          <div className="p-4">
            <Button 
              onClick={() => setShowMobileCart(true)}
              className="w-full bg-black text-white hover:bg-gray-800 flex items-center justify-between"
              size="lg"
            >
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                <span>View Cart ({cart.length} items)</span>
              </div>
              <span className="font-bold">₹{getCartTotalWithPackaging().toFixed(2)}</span>
            </Button>
          </div>
        ) : null}
      </div>

      {/* Mobile Cart Modal */}
      {showMobileCart && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50">
          <div className="fixed bottom-0 left-0 right-0 bg-background rounded-t-lg max-h-[80vh] flex flex-col">
            {/* Cart Header */}
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Your Cart ({cart.length} items)</h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowMobileCart(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            {/* Cart Items */}
            <div className="flex-1 overflow-auto p-4">
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500">Your cart is empty</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-medium text-sm">{item.name}</h3>
                        {item.size && (
                          <Badge variant="outline" className="text-xs mt-1">{item.size}</Badge>
                        )}
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-sm text-gray-600">{item.category}</p>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.id, Math.max(0, item.quantity - 1))}
                              className="h-6 w-6 p-0"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-6 text-center text-xs font-medium">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="h-6 w-6 p-0"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-sm">₹{(item.price * item.quantity).toFixed(2)}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.id)}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Packaging Option & Cart Summary */}
            {cart.length > 0 && (
              <div className="border-t p-4 space-y-3">
                {/* Packaging Option */}
                <div className="flex items-center space-x-2 pb-2">
                  <Checkbox
                    id="mobile-packaging"
                    size="sm"
                    checked={includePackaging}
                    onCheckedChange={setIncludePackaging}
                  />
                  <Label htmlFor="mobile-packaging" className="text-sm">
                    Include Packaging (₹{getPackagingCharge()})
                  </Label>
                </div>
                
                {/* Cart Summary */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>₹{getCartSubtotal().toFixed(2)}</span>
                  </div>
                  {includePackaging && getPackagingCharge() > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Packaging:</span>
                      <span>₹{getPackagingCharge()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span>GST (12%):</span>
                    <span>₹{getCartTaxWithPackaging().toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-bold">
                      <span>Total:</span>
                      <span>₹{getCartTotalWithPackaging().toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                
                <Button 
                  onClick={() => {
                    setShowMobileCart(false)
                    setCheckoutDialog(true)
                  }}
                  className="w-full bg-black text-white hover:bg-gray-800"
                  size="lg"
                >
                  Proceed to Checkout
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  )
}

export default Dashboard