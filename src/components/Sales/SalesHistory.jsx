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
  
  // Device detection
  const deviceInfo = useAdvancedDeviceDetection()
  const { isMobile, isTablet, orientation } = deviceInfo
  const showMobileLayout = isMobile || (isTablet && orientation === 'portrait')

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
    const subscription = supabaseOperations.subscriptions.sales((payload) => {
      console.log('SalesHistory: Real-time sales update:', payload)
      loadSales() // Reload all sales on any change
    })

    return () => {
      if (subscription) {
        subscription.unsubscribe()
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
      const { id, ...updateData } = editedSale
      
      await supabaseOperations.sales.update(id, updateData)
      
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
      await supabaseOperations.sales.delete(sale.id)
      toast.success('Sale deleted successfully!')
      setDeleteDialogOpen(false)
    } catch (error) {
      console.error('Error deleting sale:', error)
      toast.error('Failed to delete sale')
    }
  }

  // Delete multiple sales
  const handleDeleteSelected = async () => {
    try {
      console.log('Deleting selected sales:', selectedSales)
      await supabaseOperations.sales.bulkDelete(selectedSales)
      toast.success(`${selectedSales.length} sales deleted successfully`)
      setSelectedSales([])
      setDeleteDialogOpen(false)
    } catch (error) {
      console.error('Error deleting selected sales:', error)
      toast.error('Failed to delete selected sales')
    }
  }

  // Delete all sales
  const handleDeleteAllSales = async () => {
    try {
      console.log('Deleting all sales')
      await supabaseOperations.sales.deleteAll()
      setDeleteAllDialogOpen(false)
      toast.success(`All ${sales.length} sales deleted successfully!`)
    } catch (error) {
      console.error('Error deleting all sales:', error)
      toast.error('Failed to delete all sales')
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
                      checked={selectedSales.includes(sale.id)}
                      onCheckedChange={() => handleSelectSale(sale.id)}
                      aria-label={`Select sale ${sale.id}`}
                    />
                    <span className="font-bold text-lg">{sale.id}</span>
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Customer</p>
                    <p className="font-medium">{sale.customerName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Items</p>
                    <Badge variant="outline" className="text-primary border-primary">
                      {sale.items.length} items
                    </Badge>
                  </div>
                </div>
                
                {/* Payment & Total Row */}
                <div className="grid grid-cols-2 gap-4">
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
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
                      checked={selectedSales.includes(sale.id)}
                      onCheckedChange={() => handleSelectSale(sale.id)}
                      aria-label={`Select sale ${sale.id}`}
                    />
                  </TableCell>
                  <TableCell>
                    <span className="font-bold text-sm">
                      {sale.id}
                    </span>
                  </TableCell>
                  <TableCell>
                    {format(new Date(sale.timestamp), 'MMM dd, yyyy HH:mm')}
                  </TableCell>
                  <TableCell>{sale.customerName}</TableCell>
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
        </Card>
      )}

      {/* Sale Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <ReceiptIcon className="h-5 w-5 mr-2" />
                Order Details - {selectedSale?.id}
              </div>
              {!isEditing && (
                <Button variant="ghost" size="sm" onClick={handleEditOrder}>
                  <EditIcon className="h-4 w-4" />
                </Button>
              )}
            </DialogTitle>
            <DialogDescription>
              View and edit order details, customer information, and payment details.
            </DialogDescription>
          </DialogHeader>
          {selectedSale && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Date & Time</p>
                  <p className="font-medium">
                    {format(new Date(selectedSale.timestamp), 'MMMM dd, yyyy HH:mm:ss')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Customer</p>
                  {isEditing ? (
                    <Input
                      value={editedSale?.customerName || ''}
                      onChange={(e) => handleEditChange('customerName', e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="font-medium">{selectedSale.customerName}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Payment Method</p>
                  <Badge 
                    variant={selectedSale.paymentMethod === 'Cash' ? 'default' : 'secondary'}
                    className={selectedSale.paymentMethod === 'Cash' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}
                  >
                    {selectedSale.paymentMethod}
                  </Badge>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Items Ordered</h3>
                <div className="space-y-3">
                  {(isEditing ? editedSale?.items : selectedSale.items)?.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      {isEditing ? (
                        <div className="flex items-center gap-2 w-full">
                          <Input
                            placeholder="Item Name"
                            value={item.name}
                            onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                            className="flex-1"
                          />
                          <Input
                            placeholder="Quantity"
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                            className="w-20"
                          />
                          <Input
                            placeholder="Price"
                            type="number"
                            value={item.price}
                            onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                            className="w-24"
                          />
                          <span className="font-semibold text-sm min-w-[80px]">
                            ₹{(item.quantity * item.price).toFixed(2)}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(index)}
                          >
                            <DeleteIcon className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-gray-600">Quantity: {item.quantity} × ₹{item.price}</p>
                          </div>
                          <span className="font-bold text-sm">
                            ₹{(item.quantity * item.price).toFixed(2)}
                          </span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{(isEditing ? editedSale?.subtotal : selectedSale.subtotal)?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST:</span>
                  <span>₹{(isEditing ? editedSale?.tax : selectedSale.tax)?.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total:</span>
                  <span className="text-primary">₹{(isEditing ? editedSale?.total : selectedSale.total)?.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
          {isEditing ? (
            <div className="flex gap-2 mt-6">
              <Button variant="outline" onClick={handleCancelEdit}>
                <CancelIcon className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={!editedSale}
              >
                <SaveIcon className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          ) : (
            <div className="mt-6">
              <Button onClick={handleCloseDetails}>Close</Button>
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
            <AlertDialogTitle>Delete All Sales History</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete ALL sales history? This will permanently remove all {sales.length} sales records and cannot be undone.
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