import React, { useState, useEffect } from 'react'
import {
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
  Separator,
  Checkbox,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui'
import {
  Search as SearchIcon,
  Eye as VisibilityIcon,
  Receipt as ReceiptIcon,
  TrendingUp as TrendingUpIcon,
  ShoppingCart as ShoppingCartIcon,
  DollarSign as AttachMoneyIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  X as CancelIcon,
  Trash2 as DeleteIcon,
  CheckSquare as SelectAllIcon
} from 'lucide-react'
import { format, startOfDay, endOfDay, isWithinInterval } from 'date-fns'
import { supabaseOperations } from '../../utils/supabaseOperations'
import { useAdvancedDeviceDetection } from '../../hooks/useDeviceDetection'
import toast from 'react-hot-toast'

const SalesHistory = React.memo(() => {
  const [sales, setSales] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSale, setSelectedSale] = useState(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedSale, setEditedSale] = useState(null)
  const [selectedSales, setSelectedSales] = useState([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  
  // Device detection and responsive layout
  const deviceInfo = useAdvancedDeviceDetection()
  const { isMobile, isTablet, orientation } = deviceInfo
  const [showMobileLayout, setShowMobileLayout] = useState(false)

  useEffect(() => {
    const checkScreenSize = () => {
      // Use window width for more reliable responsive behavior
      const isMobileScreen = window.innerWidth < 1024
      const isDeviceMobile = isMobile || (isTablet && orientation === 'portrait')
      setShowMobileLayout(isMobileScreen || isDeviceMobile)
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [isMobile, isTablet, orientation])

  // Load sales data from Supabase
  useEffect(() => {
    const loadSales = async () => {
      console.log('SalesHistory: Loading sales from Supabase')
      try {
        const salesData = await supabaseOperations.sales.getAll()
        const formattedSales = salesData.map(sale => ({
          ...sale,
          id: sale.transaction_id || sale.id,
          timestamp: new Date(sale.created_at),
          customerName: sale.customer_name || 'Walk-in Customer'
        }))
        
        console.log(`SalesHistory: Loaded ${formattedSales.length} sales records`)
        setSales(formattedSales)
      } catch (error) {
        console.error('SalesHistory: Error loading sales:', error)
        toast.error('Error loading sales data')
      }
    }

    loadSales()

    // Set up real-time subscription for sales
    const unsubscribe = supabaseOperations.subscriptions.sales((payload) => {
      console.log('SalesHistory: Real-time sales update:', payload)
      loadSales() // Reload all sales on any change
    })

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [])

  // Filter sales based on search and date
  const filteredSales = sales.filter(sale => {
    const matchesSearch = sale.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sale.customerName.toLowerCase().includes(searchTerm.toLowerCase())
    
    let matchesDate = true
    if (selectedDate) {
      const saleDate = new Date(sale.timestamp)
      const filterDate = new Date(selectedDate)
      matchesDate = isWithinInterval(saleDate, {
        start: startOfDay(filterDate),
        end: endOfDay(filterDate)
      })
    }
    
    return matchesSearch && matchesDate
  })

  // Calculate statistics
  const todaysSales = sales.filter(sale => {
    const today = new Date()
    const saleDate = new Date(sale.timestamp)
    return isWithinInterval(saleDate, {
      start: startOfDay(today),
      end: endOfDay(today)
    })
  })

  const todaysRevenue = todaysSales.reduce((sum, sale) => sum + sale.total, 0)
  const todaysOrders = todaysSales.length
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0)
  const totalOrders = sales.length

  const handleViewDetails = (sale) => {
    setSelectedSale(sale)
    setDetailsOpen(true)
    setIsEditing(false)
    setEditedSale(null)
  }

  const handleCloseDetails = () => {
    setDetailsOpen(false)
    setSelectedSale(null)
    setIsEditing(false)
    setEditedSale(null)
  }

  const handleEditOrder = () => {
    setIsEditing(true)
    setEditedSale({ ...selectedSale })
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditedSale(null)
  }

  const handleSaveEdit = async () => {
    try {
      const { id, customerName, ...updateData } = editedSale
      
      // Remove customerName as it's not a column in sales table (it's in customers table)
      // Only update fields that exist in the sales table
      const dbUpdateData = {
        ...updateData
      }
      
      await supabaseOperations.sales.update(id, dbUpdateData)
      
      setSelectedSale(editedSale)
      setIsEditing(false)
      setEditedSale(null)
      toast.success('Sale updated successfully')
    } catch (error) {
      console.error('Error updating sale:', error)
      toast.error('Failed to update sale')
    }
  }

  const handleEditChange = (field, value) => {
    setEditedSale(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...editedSale.items]
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: field === 'quantity' || field === 'price' ? parseFloat(value) || 0 : value
    }
    
    // Recalculate totals
    const subtotal = updatedItems.reduce((sum, item) => sum + (item.quantity * item.price), 0)
    const tax = subtotal * 0.18 // Assuming 18% tax
    const total = subtotal + tax
    
    setEditedSale(prev => ({
      ...prev,
      items: updatedItems,
      subtotal,
      tax,
      total
    }))
  }

  const handleRemoveItem = (index) => {
    const updatedItems = editedSale.items.filter((_, i) => i !== index)
    
    // Recalculate totals
    const subtotal = updatedItems.reduce((sum, item) => sum + (item.quantity * item.price), 0)
    const tax = subtotal * 0.18
    const total = subtotal + tax
    
    setEditedSale(prev => ({
      ...prev,
      items: updatedItems,
      subtotal,
      tax,
      total
    }))
  }

  // Handle individual sale selection
  const handleSelectSale = (saleId) => {
    setSelectedSales(prev => 
      prev.includes(saleId) 
        ? prev.filter(id => id !== saleId)
        : [...prev, saleId]
    )
  }

  // Handle select all/none
  const handleSelectAll = () => {
    if (selectedSales.length === filteredSales.length) {
      setSelectedSales([])
    } else {
      setSelectedSales(filteredSales.map(sale => sale.id))
    }
  }

  // Delete single sale
  const handleDeleteSale = async (sale) => {
    try {
      console.log('Deleting sale with ID:', sale.id)
      // Optimistically update UI first
      const updatedSales = sales.filter(s => s.id !== sale.id)
      setSales(updatedSales)
      
      // Then perform the actual deletion
      await supabaseOperations.sales.delete(sale.id)
      toast.success('Sale deleted successfully!')
    } catch (error) {
      console.error('Error deleting sale:', error)
      toast.error('Failed to delete sale')
      // Reload data on error to restore correct state
      const salesData = await supabaseOperations.sales.getAll()
      const formattedSales = salesData.map(sale => ({
        ...sale,
        id: sale.transaction_id || sale.id,
        timestamp: new Date(sale.created_at),
        customerName: sale.customer_name || 'Walk-in Customer'
      }))
      setSales(formattedSales)
    }
  }

  // Delete multiple sales
  const handleDeleteSelected = async () => {
    try {
      console.log('Deleting selected sales:', selectedSales)
      // Optimistically update UI first
      const updatedSales = sales.filter(sale => !selectedSales.includes(sale.id))
      setSales(updatedSales)
      setSelectedSales([])
      setDeleteAllDialogOpen(false)
      
      // Then perform the actual deletion
      await supabaseOperations.sales.bulkDelete(selectedSales)
      toast.success(`${selectedSales.length} sales deleted successfully`)
    } catch (error) {
      console.error('Error deleting selected sales:', error)
      toast.error('Failed to delete selected sales')
      // Reload data on error to restore correct state
      const salesData = await supabaseOperations.sales.getAll()
      const formattedSales = salesData.map(sale => ({
        ...sale,
        id: sale.transaction_id || sale.id,
        timestamp: new Date(sale.created_at),
        customerName: sale.customer_name || 'Walk-in Customer'
      }))
      setSales(formattedSales)
    }
  }

  // Delete all sales
  const handleDeleteAllSales = async () => {
    try {
      console.log('Deleting all sales')
      const salesCount = sales.length
      // Optimistically update UI first
      setSales([])
      setDeleteAllDialogOpen(false)
      
      // Then perform the actual deletion
      await supabaseOperations.sales.deleteAll()
      toast.success(`All ${salesCount} sales deleted successfully!`)
    } catch (error) {
      console.error('Error deleting all sales:', error)
      toast.error('Failed to delete all sales')
      // Reload data on error to restore correct state
      const salesData = await supabaseOperations.sales.getAll()
      const formattedSales = salesData.map(sale => ({
        ...sale,
        id: sale.transaction_id || sale.id,
        timestamp: new Date(sale.created_at),
        customerName: sale.customer_name || 'Walk-in Customer'
      }))
      setSales(formattedSales)
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl md:text-4xl font-bold mb-6 capitalize">
        Sales History
      </h1>

      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <TrendingUpIcon className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <ReceiptIcon className="h-4 w-4" />
            Order History
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab - Statistics Cards */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center mb-2">
              <AttachMoneyIcon className="h-5 w-5 text-primary mr-2" />
              <h3 className="text-lg font-semibold">Today's Revenue</h3>
            </div>
            <p className="text-2xl font-bold text-primary">
              ₹{todaysRevenue.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center mb-2">
              <ShoppingCartIcon className="h-5 w-5 text-secondary mr-2" />
              <h3 className="text-lg font-semibold">Today's Orders</h3>
            </div>
            <p className="text-2xl font-bold text-secondary">
              {todaysOrders}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center mb-2">
              <TrendingUpIcon className="h-5 w-5 text-green-600 mr-2" />
              <h3 className="text-lg font-semibold">Total Revenue</h3>
            </div>
            <p className="text-2xl font-bold text-green-600">
              ₹{totalRevenue.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center mb-2">
              <ReceiptIcon className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold">Total Orders</h3>
            </div>
            <p className="text-2xl font-bold text-blue-600">
              {totalOrders}
            </p>
          </CardContent>
          </Card>
          </div>
        </TabsContent>

        {/* Order History Tab */}
        <TabsContent value="history" className="space-y-6">
          {/* Search and Filter */}
      <Card className="p-4 mb-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                className="pl-10"
                placeholder="Search by order ID or customer name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Input
                type="date"
                placeholder="Filter by Date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
          </div>
          
          {/* Delete Actions */}
          <div className="flex flex-wrap gap-2 items-center">
            {selectedSales.length > 0 && (
              <>
                <Badge variant="secondary" className="px-2 py-1">
                  {selectedSales.length} selected
                </Badge>
                <AlertDialog open={deleteAllDialogOpen} onOpenChange={setDeleteAllDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <DeleteIcon className="h-4 w-4 mr-1" />
                      Delete Selected
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Selected Sales</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete {selectedSales.length} selected sales? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteSelected} className="bg-red-600 hover:bg-red-700">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
            
            {sales.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-red-600 border-red-600 hover:bg-red-50">
                    <DeleteIcon className="h-4 w-4 mr-1" />
                    Delete All History
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete All Sales History</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete all sales history? This will permanently remove all {sales.length} sales records and cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAllSales} className="bg-red-600 hover:bg-red-700">
                      Delete All
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </Card>

      {/* Sales Display - Responsive */}
      {showMobileLayout ? (
        /* Mobile Card Layout */
        <div className="space-y-4">
          {/* Mobile Select All */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  size="sm"
                  checked={selectedSales.length === filteredSales.length && filteredSales.length > 0}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                />
                <span className="text-sm font-medium">Select All</span>
              </div>
              {selectedSales.length > 0 && (
                <Badge variant="secondary" className="px-2 py-1">
                  {selectedSales.length} selected
                </Badge>
              )}
            </div>
          </Card>
          
          {/* Mobile Sales Cards */}
          {filteredSales.map((sale) => (
            <Card key={sale.id} className="p-4">
              <div className="space-y-3">
                {/* Header Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      size="sm"
                      checked={selectedSales.includes(sale.id)}
                      onCheckedChange={() => handleSelectSale(sale.id)}
                      aria-label={`Select sale ${sale.id}`}
                    />
                    <span className="font-bold text-lg">#{sale.transactionId || sale.id}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDetails(sale)}
                      className="h-8 w-8 p-0"
                    >
                      <VisibilityIcon className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                        >
                          <DeleteIcon className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Sale</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this sale (Order ID: {sale.id})? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDeleteSale(sale)} 
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                
                {/* Date & Time */}
                <div>
                  <p className="text-sm text-gray-600">Date & Time</p>
                  <p className="font-medium">{format(new Date(sale.timestamp), 'MMM dd, yyyy HH:mm')}</p>
                </div>
                
                {/* Customer & Items Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm text-gray-600">Customer</p>
                    <p className="font-medium truncate">{sale.customerName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Items</p>
                    <Badge variant="outline" className="text-primary border-primary">
                      {sale.items.length} items
                    </Badge>
                  </div>
                </div>
                
                {/* Payment & Total Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm text-gray-600">Payment</p>
                    <Badge 
                      variant={sale.paymentMethod === 'Cash' ? 'default' : 'secondary'}
                      className={sale.paymentMethod === 'Cash' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}
                    >
                      {sale.paymentMethod}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="font-bold text-lg text-primary">₹{sale.total.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        /* Desktop Table Layout */
        <Card>
          <div className="overflow-x-auto">
            <Table className="min-w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    size="sm"
                    checked={selectedSales.length === filteredSales.length && filteredSales.length > 0}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead>Order ID</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Total (₹)</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>
                    <Checkbox
                      size="sm"
                      checked={selectedSales.includes(sale.id)}
                      onCheckedChange={() => handleSelectSale(sale.id)}
                      aria-label={`Select sale ${sale.id}`}
                    />
                  </TableCell>
                  <TableCell>
                    <span className="font-bold text-sm">
                      #{sale.transactionId || sale.id}
                    </span>
                  </TableCell>
                  <TableCell>
                    {format(new Date(sale.timestamp), 'MMM dd, yyyy HH:mm')}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {sale.customerName}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-primary border-primary">
                      {sale.items.length} items
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={sale.paymentMethod === 'Cash' ? 'default' : 'secondary'}
                      className={sale.paymentMethod === 'Cash' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}
                    >
                      {sale.paymentMethod}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-bold text-sm">
                      ₹{sale.total.toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(sale)}
                        className="h-8 w-8 p-0"
                      >
                        <VisibilityIcon className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                          >
                            <DeleteIcon className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Sale</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this sale (Order ID: {sale.id})? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteSale(sale)} 
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </Card>
      )}

      {/* Sale Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Order #{selectedSale?.transactionId || selectedSale?.id}</span>
              {!isEditing && (
                <Button variant="ghost" size="sm" onClick={handleEditOrder}>
                  <EditIcon className="h-4 w-4" />
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedSale && (
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">{format(new Date(selectedSale.timestamp), 'MMM dd, yyyy HH:mm')}</span>
                <Badge 
                  variant={selectedSale.paymentMethod === 'Cash' ? 'default' : 'secondary'}
                  className={selectedSale.paymentMethod === 'Cash' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}
                >
                  {selectedSale.paymentMethod}
                </Badge>
              </div>
              
              {selectedSale.customerName && (
                <div className="text-sm">
                  <span className="text-gray-600">Customer: </span>
                  <span className="font-medium">{selectedSale.customerName}</span>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium mb-2">Items</h3>
                <div className="text-sm">
                  {(isEditing ? editedSale?.items : selectedSale.items)?.map((item, index) => (
                    <div key={index} className="flex items-center justify-between py-2">
                      {isEditing ? (
                        <div className="flex items-center gap-2 w-full">
                          <Input
                            placeholder="Item Name"
                            value={item.name}
                            onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                            className="flex-1"
                            size="sm"
                          />
                          <Input
                            placeholder="Qty"
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                            className="w-16"
                            size="sm"
                          />
                          <Input
                            placeholder="Price"
                            type="number"
                            value={item.price}
                            onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                            className="w-20"
                            size="sm"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(index)}
                            className="h-7 w-7 p-0"
                          >
                            <DeleteIcon className="w-3 h-3 text-red-500" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="flex-1">
                            <span>{item.name}</span>
                            <span className="text-gray-500 ml-1">×{item.quantity}</span>
                          </div>
                          <span>₹{(item.quantity * item.price).toFixed(2)}</span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>₹{(isEditing ? editedSale?.total : selectedSale.total)?.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
          {isEditing ? (
            <div className="flex gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveEdit}
                disabled={!editedSale}
              >
                Save
              </Button>
            </div>
          ) : (
            <div className="mt-4">
              <Button size="sm" onClick={handleCloseDetails}>Close</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Selected Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Sales</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedSales.length} selected sale(s)? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteSelected} 
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Selected
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete All Confirmation Dialog */}
      <AlertDialog open={deleteAllDialogOpen} onOpenChange={setDeleteAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedSales.length > 0 ? 'Delete Selected Sales' : 'Delete All Sales History'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedSales.length > 0 
                ? `Are you sure you want to delete the ${selectedSales.length} selected sales? This will permanently remove these sales records and cannot be undone.`
                : `Are you sure you want to delete ALL sales history? This will permanently remove all ${sales.length} sales records and cannot be undone.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteAllSales} 
              className="bg-red-600 hover:bg-red-700"
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
        </TabsContent>
      </Tabs>
    </div>
  )
})

SalesHistory.displayName = "SalesHistory";

export default SalesHistory