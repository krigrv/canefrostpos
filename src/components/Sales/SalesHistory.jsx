import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  InputAdornment
} from '@mui/material'
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Receipt as ReceiptIcon,
  TrendingUp as TrendingUpIcon,
  ShoppingCart as ShoppingCartIcon,
  AttachMoney as AttachMoneyIcon
} from '@mui/icons-material'
import { format, startOfDay, endOfDay, isWithinInterval } from 'date-fns'

function SalesHistory() {
  const [sales, setSales] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSale, setSelectedSale] = useState(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  // Real-time sales data from Firestore - No mock data
  useEffect(() => {
    // Initialize with empty sales array - real sales will be added through the POS system
    setSales([])
    
    // TODO: Add Firestore listener for real-time sales data
    // const unsubscribe = onSnapshot(collection(db, 'sales'), (snapshot) => {
    //   const salesData = snapshot.docs.map(doc => ({
    //     id: doc.id,
    //     ...doc.data(),
    //     timestamp: doc.data().timestamp?.toDate()
    //   }))
    //   setSales(salesData)
    // })
    // return () => unsubscribe()
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
  }

  const handleCloseDetails = () => {
    setDetailsOpen(false)
    setSelectedSale(null)
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Sales History
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AttachMoneyIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Today's Revenue</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                ₹{todaysRevenue.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ShoppingCartIcon color="secondary" sx={{ mr: 1 }} />
                <Typography variant="h6">Today's Orders</Typography>
              </Box>
              <Typography variant="h4" color="secondary">
                {todaysOrders}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingUpIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">Total Revenue</Typography>
              </Box>
              <Typography variant="h4" color="success.main">
                ₹{totalRevenue.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ReceiptIcon color="info" sx={{ mr: 1 }} />
                <Typography variant="h6">Total Orders</Typography>
              </Box>
              <Typography variant="h4" color="info.main">
                {totalOrders}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filter */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search by order ID or customer name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="date"
              label="Filter by Date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Sales Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Order ID</TableCell>
              <TableCell>Date & Time</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Items</TableCell>
              <TableCell>Payment Method</TableCell>
              <TableCell>Total (₹)</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredSales.map((sale) => (
              <TableRow key={sale.id}>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">
                    {sale.id}
                  </Typography>
                </TableCell>
                <TableCell>
                  {format(new Date(sale.timestamp), 'MMM dd, yyyy HH:mm')}
                </TableCell>
                <TableCell>{sale.customerName}</TableCell>
                <TableCell>
                  <Chip 
                    label={`${sale.items.length} items`} 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={sale.paymentMethod} 
                    size="small" 
                    color={sale.paymentMethod === 'Cash' ? 'success' : 'info'}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">
                    ₹{sale.total.toFixed(2)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <IconButton
                    color="primary"
                    onClick={() => handleViewDetails(sale)}
                    size="small"
                  >
                    <VisibilityIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Sale Details Dialog */}
      <Dialog open={detailsOpen} onClose={handleCloseDetails} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ReceiptIcon sx={{ mr: 1 }} />
            Order Details - {selectedSale?.id}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedSale && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">Date & Time</Typography>
                  <Typography variant="body1">
                    {format(new Date(selectedSale.timestamp), 'MMMM dd, yyyy HH:mm:ss')}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">Customer</Typography>
                  <Typography variant="body1">{selectedSale.customerName}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">Payment Method</Typography>
                  <Chip 
                    label={selectedSale.paymentMethod} 
                    size="small" 
                    color={selectedSale.paymentMethod === 'Cash' ? 'success' : 'info'}
                  />
                </Grid>
              </Grid>

              <Typography variant="h6" gutterBottom>Items Ordered</Typography>
              <List>
                {selectedSale.items.map((item, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={item.name}
                      secondary={`Quantity: ${item.quantity} × ₹${item.price}`}
                    />
                    <Typography variant="body2" fontWeight="bold">
                      ₹{(item.quantity * item.price).toFixed(2)}
                    </Typography>
                  </ListItem>
                ))}
              </List>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body1">Subtotal:</Typography>
                <Typography variant="body1">₹{selectedSale.subtotal.toFixed(2)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body1">Tax:</Typography>
                <Typography variant="body1">₹{selectedSale.tax.toFixed(2)}</Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6">Total:</Typography>
                <Typography variant="h6" color="primary">
                  ₹{selectedSale.total.toFixed(2)}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default SalesHistory