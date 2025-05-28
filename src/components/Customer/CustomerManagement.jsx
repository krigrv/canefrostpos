import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Card,
  CardContent,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Divider,
  InputAdornment
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  History as HistoryIcon,
  Star as StarIcon,
  Search as SearchIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

function CustomerManagement() {
  const [tabValue, setTabValue] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [customers, setCustomers] = useState([
    {
      id: 1,
      name: 'Rajesh Kumar',
      email: 'rajesh@email.com',
      phone: '+91 9876543210',
      address: '123 MG Road, Bangalore',
      joinDate: '2024-01-15',
      totalPurchases: 15600,
      visitCount: 24,
      lastVisit: '2024-12-18',
      loyaltyPoints: 156,
      tier: 'Gold',
      favoriteItems: ['LEMON 500ml', 'ORANGE 240ml', 'JUSTCANE (PLAIN) 500ml']
    },
    {
      id: 2,
      name: 'Priya Sharma',
      email: 'priya@email.com',
      phone: '+91 9876543211',
      address: '456 Brigade Road, Bangalore',
      joinDate: '2024-02-20',
      totalPurchases: 8900,
      visitCount: 18,
      lastVisit: '2024-12-19',
      loyaltyPoints: 89,
      tier: 'Silver',
      favoriteItems: ['STRAWBERRY 240ml', 'BLUEBERRY 500ml']
    },
    {
      id: 3,
      name: 'Amit Patel',
      email: 'amit@email.com',
      phone: '+91 9876543212',
      address: '789 Commercial Street, Bangalore',
      joinDate: '2024-03-10',
      totalPurchases: 25400,
      visitCount: 35,
      lastVisit: '2024-12-20',
      loyaltyPoints: 254,
      tier: 'Platinum',
      favoriteItems: ['POMEGRANATE 500ml', 'JAMUN 240ml', 'ICE APPLE 500ml']
    }
  ])
  
  const [purchaseHistory, setPurchaseHistory] = useState([
    {
      id: 1,
      customerId: 1,
      customerName: 'Rajesh Kumar',
      date: '2024-12-18',
      items: ['LEMON 500ml', 'ORANGE 240ml'],
      total: 110,
      pointsEarned: 11
    },
    {
      id: 2,
      customerId: 2,
      customerName: 'Priya Sharma',
      date: '2024-12-19',
      items: ['STRAWBERRY 240ml', 'BLUEBERRY 500ml'],
      total: 210,
      pointsEarned: 21
    },
    {
      id: 3,
      customerId: 3,
      customerName: 'Amit Patel',
      date: '2024-12-20',
      items: ['POMEGRANATE 500ml', 'JAMUN 240ml', 'ICE APPLE 500ml'],
      total: 300,
      pointsEarned: 30
    }
  ])
  
  const [openDialog, setOpenDialog] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  })

  const getTierColor = (tier) => {
    switch (tier) {
      case 'Platinum': return 'primary'
      case 'Gold': return 'warning'
      case 'Silver': return 'info'
      default: return 'default'
    }
  }

  const getTierIcon = (tier) => {
    return <StarIcon sx={{ color: tier === 'Platinum' ? '#1976d2' : tier === 'Gold' ? '#ed6c02' : '#0288d1' }} />
  }

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  )

  const handleAddCustomer = () => {
    setEditingCustomer(null)
    setFormData({ name: '', email: '', phone: '', address: '' })
    setOpenDialog(true)
  }

  const handleEditCustomer = (customer) => {
    setEditingCustomer(customer)
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address
    })
    setOpenDialog(true)
  }

  const handleSaveCustomer = () => {
    if (editingCustomer) {
      setCustomers(customers.map(c => 
        c.id === editingCustomer.id 
          ? { ...c, ...formData }
          : c
      ))
      toast.success('Customer updated successfully')
    } else {
      const newCustomer = {
        id: Date.now(),
        ...formData,
        joinDate: format(new Date(), 'yyyy-MM-dd'),
        totalPurchases: 0,
        visitCount: 0,
        lastVisit: null,
        loyaltyPoints: 0,
        tier: 'Bronze',
        favoriteItems: []
      }
      setCustomers([...customers, newCustomer])
      toast.success('Customer added successfully')
    }
    setOpenDialog(false)
  }

  const handleDeleteCustomer = (id) => {
    setCustomers(customers.filter(c => c.id !== id))
    toast.success('Customer removed')
  }

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Customer Management
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab icon={<PersonIcon />} label="Customers" />
          <Tab icon={<HistoryIcon />} label="Purchase History" />
          <Tab icon={<StarIcon />} label="Loyalty Program" />
        </Tabs>
      </Paper>

      {/* Customers Tab */}
      <TabPanel value={tabValue} index={0}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <TextField
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ width: 300 }}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddCustomer}
          >
            Add Customer
          </Button>
        </Box>

        <Grid container spacing={3}>
          {filteredCustomers.map((customer) => (
            <Grid item xs={12} md={6} lg={4} key={customer.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                      {customer.name.charAt(0)}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6">{customer.name}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getTierIcon(customer.tier)}
                        <Chip 
                          label={customer.tier} 
                          color={getTierColor(customer.tier)}
                          size="small"
                        />
                      </Box>
                    </Box>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <EmailIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {customer.email}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <PhoneIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {customer.phone}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <LocationIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {customer.address}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="body2" gutterBottom>
                    <strong>Total Purchases:</strong> ₹{customer.totalPurchases.toLocaleString()}
                  </Typography>
                  
                  <Typography variant="body2" gutterBottom>
                    <strong>Visits:</strong> {customer.visitCount}
                  </Typography>
                  
                  <Typography variant="body2" gutterBottom>
                    <strong>Loyalty Points:</strong> {customer.loyaltyPoints}
                  </Typography>
                  
                  <Typography variant="body2" gutterBottom>
                    <strong>Last Visit:</strong> {customer.lastVisit ? format(new Date(customer.lastVisit), 'MMM dd, yyyy') : 'Never'}
                  </Typography>
                  
                  {customer.favoriteItems.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" gutterBottom>
                        <strong>Favorite Items:</strong>
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {customer.favoriteItems.slice(0, 2).map((item, index) => (
                          <Chip key={index} label={item} size="small" variant="outlined" />
                        ))}
                        {customer.favoriteItems.length > 2 && (
                          <Chip label={`+${customer.favoriteItems.length - 2} more`} size="small" variant="outlined" />
                        )}
                      </Box>
                    </Box>
                  )}
                  
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <IconButton onClick={() => handleEditCustomer(customer)} size="small">
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDeleteCustomer(customer.id)} size="small" color="error">
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Purchase History Tab */}
      <TabPanel value={tabValue} index={1}>
        <Typography variant="h6" gutterBottom>Purchase History</Typography>
        
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Customer</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Items</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Points Earned</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {purchaseHistory.map((purchase) => (
                <TableRow key={purchase.id}>
                  <TableCell>{purchase.customerName}</TableCell>
                  <TableCell>{format(new Date(purchase.date), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {purchase.items.map((item, index) => (
                        <Chip key={index} label={item} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell>₹{purchase.total}</TableCell>
                  <TableCell>{purchase.pointsEarned} pts</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Loyalty Program Tab */}
      <TabPanel value={tabValue} index={2}>
        <Typography variant="h6" gutterBottom>Loyalty Program Overview</Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Tier Distribution</Typography>
                <List>
                  <ListItem>
                    <ListItemText 
                      primary="Platinum Members" 
                      secondary={`${customers.filter(c => c.tier === 'Platinum').length} customers`}
                    />
                    <StarIcon sx={{ color: '#1976d2' }} />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Gold Members" 
                      secondary={`${customers.filter(c => c.tier === 'Gold').length} customers`}
                    />
                    <StarIcon sx={{ color: '#ed6c02' }} />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Silver Members" 
                      secondary={`${customers.filter(c => c.tier === 'Silver').length} customers`}
                    />
                    <StarIcon sx={{ color: '#0288d1' }} />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Top Customers by Points</Typography>
                <List>
                  {customers
                    .sort((a, b) => b.loyaltyPoints - a.loyaltyPoints)
                    .slice(0, 5)
                    .map((customer) => (
                      <ListItem key={customer.id}>
                        <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                          {customer.name.charAt(0)}
                        </Avatar>
                        <ListItemText 
                          primary={customer.name}
                          secondary={`${customer.loyaltyPoints} points • ${customer.tier} tier`}
                        />
                        <Typography variant="body2" color="text.secondary">
                          ₹{customer.totalPurchases.toLocaleString()}
                        </Typography>
                      </ListItem>
                    ))
                  }
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Add/Edit Customer Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Address"
            multiline
            rows={3}
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveCustomer} variant="contained">
            {editingCustomer ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default CustomerManagement