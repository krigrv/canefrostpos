import React, { useState } from 'react'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
  Card,
  CardContent,
  CardHeader,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Avatar,
  AvatarFallback
} from '@/components/ui'
import {
  Plus as AddIcon,
  Edit as EditIcon,
  Trash2 as DeleteIcon,
  User as PersonIcon,
  History as HistoryIcon,
  Star as StarIcon,
  Search as SearchIcon,
  Phone as PhoneIcon,
  Mail as EmailIcon,
  MapPin as LocationIcon,
  Save,
  X
} from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { useCustomers } from '../../contexts/CustomerContext'

function CustomerManagement() {
  const [tabValue, setTabValue] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const { customers, addCustomer, updateCustomer, deleteCustomer, loading } = useCustomers()
  
  const [openDialog, setOpenDialog] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  })

  // Purchase history will be loaded from actual transaction data
  const [purchaseHistory, setPurchaseHistory] = useState([]);

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

  const handleSaveCustomer = async () => {
    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, formData)
        toast.success('Customer updated successfully')
      } else {
        const newCustomer = {
          ...formData,
          joinDate: new Date(),
          totalPurchases: 0,
          visitCount: 0,
          lastVisit: null,
          loyaltyPoints: 0,
          tier: 'Bronze',
          favoriteItems: [],
          createdAt: new Date()
        }
        await addCustomer(newCustomer)
        toast.success('Customer added successfully')
      }
      setOpenDialog(false)
    } catch (error) {
      toast.error('Error saving customer')
    }
  }

  const handleDeleteCustomer = async (id) => {
    try {
      await deleteCustomer(id)
      toast.success('Customer removed')
    } catch (error) {
      toast.error('Error removing customer')
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 capitalize">
        Customer Management
      </h1>

      <Tabs value={tabValue.toString()} onValueChange={(value) => setTabValue(parseInt(value))} className="mb-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="0" className="flex items-center gap-2">
            <PersonIcon className="w-4 h-4" />
            All Customers
          </TabsTrigger>
          <TabsTrigger value="1" className="flex items-center gap-2">
            <HistoryIcon className="w-4 h-4" />
            Purchase History
          </TabsTrigger>
          <TabsTrigger value="2" className="flex items-center gap-2">
            <StarIcon className="w-4 h-4" />
            Loyalty Program
          </TabsTrigger>
        </TabsList>

        {/* Customers Tab */}
        <TabsContent value="0" className="mt-6">
          <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full sm:w-auto">
              <SearchIcon className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
              <Input
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              onClick={handleAddCustomer}
              className="w-full sm:w-auto"
            >
              <AddIcon className="w-4 h-4 mr-2" />
              Add Customer
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCustomers.map((customer) => (
              <Card key={customer.id} className="h-full">
                <CardContent className="p-4">
                  <div className="flex items-center mb-4">
                    <Avatar className="mr-3">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {customer.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg capitalize">
                        {customer.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        {getTierIcon(customer.tier)}
                        <Badge 
                          variant={getTierColor(customer.tier) === 'primary' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {customer.tier}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center">
                      <EmailIcon className="w-4 h-4 mr-2 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {customer.email}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <PhoneIcon className="w-4 h-4 mr-2 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {customer.phone}
                      </span>
                    </div>
                     <div className="flex items-center">
                       <LocationIcon className="w-4 h-4 mr-2 text-gray-500" />
                       <span className="text-sm text-gray-600">
                         {customer.address}
                       </span>
                     </div>
                   </div>
                   
                   <hr className="my-4" />
                   
                   <div className="space-y-2 text-sm">
                     <div>
                       <strong>Total Purchases:</strong> ₹{customer.totalPurchases.toLocaleString()}
                     </div>
                     
                     <div>
                       <strong>Visits:</strong> {customer.visitCount}
                     </div>
                     
                     <div>
                       <strong>Loyalty Points:</strong> {customer.loyaltyPoints}
                     </div>
                     
                     <div>
                       <strong>Last Visit:</strong> {customer.lastVisit ? format(new Date(customer.lastVisit), 'MMM dd, yyyy') : 'Never'}
                     </div>
                   </div>
                   
                   {customer.favoriteItems.length > 0 && (
                     <div className="mt-4">
                       <div className="text-sm font-medium mb-2">
                         Favorite Items:
                       </div>
                       <div className="flex flex-wrap gap-1">
                         {customer.favoriteItems.slice(0, 2).map((item, index) => (
                           <Badge key={index} variant="outline" className="text-xs">
                             {item}
                           </Badge>
                         ))}
                         {customer.favoriteItems.length > 2 && (
                           <Badge variant="outline" className="text-xs">
                             +{customer.favoriteItems.length - 2} more
                           </Badge>
                         )}
                       </div>
                     </div>
                   )}
                   
                   <div className="flex justify-end gap-2 mt-4">
                     <Button variant="outline" size="sm" onClick={() => handleEditCustomer(customer)}>
                       <EditIcon className="w-4 h-4" />
                     </Button>
                     <Button variant="outline" size="sm" onClick={() => handleDeleteCustomer(customer.id)} className="text-red-600 hover:text-red-700">
                      <DeleteIcon className="w-4 h-4" />
                     </Button>
                   </div>
                 </CardContent>
               </Card>
             ))}
         </div>
       </TabsContent>

       {/* Purchase History Tab */}
       <TabsContent value="1">
         <h2 className="text-xl font-semibold mb-4">Purchase History</h2>
         
         <div className="bg-white rounded-lg shadow">
           <Table>
             <TableHeader>
               <TableRow>
                 <TableHead>Customer</TableHead>
                 <TableHead>Date</TableHead>
                 <TableHead>Items</TableHead>
                 <TableHead>Total</TableHead>
                 <TableHead>Points Earned</TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
               {purchaseHistory.map((purchase) => (
                 <TableRow key={purchase.id}>
                   <TableCell>{purchase.customerName}</TableCell>
                   <TableCell>{format(new Date(purchase.date), 'MMM dd, yyyy')}</TableCell>
                   <TableCell>
                     <div className="flex flex-wrap gap-1">
                       {purchase.items.map((item, index) => (
                         <Badge key={index} variant="outline" className="text-xs">
                           {item}
                         </Badge>
                       ))}
                     </div>
                   </TableCell>
                   <TableCell>₹{purchase.total}</TableCell>
                   <TableCell>{purchase.pointsEarned} pts</TableCell>
                 </TableRow>
               ))}
             </TableBody>
           </Table>
         </div>
       </TabsContent>

        {/* Loyalty Program Tab */}
        <TabsContent value="2">
          <h2 className="text-xl font-semibold mb-4">Loyalty Program Overview</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <Card>
                <CardContent>
                  <h3 className="text-lg font-semibold mb-4">Tier Distribution</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Platinum Members</div>
                        <div className="text-sm text-gray-600">
                          {customers.filter(c => c.tier === 'Platinum').length} customers
                        </div>
                      </div>
                      <StarIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Gold Members</div>
                        <div className="text-sm text-gray-600">
                          {customers.filter(c => c.tier === 'Gold').length} customers
                        </div>
                      </div>
                      <StarIcon className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Silver Members</div>
                        <div className="text-sm text-gray-600">
                          {customers.filter(c => c.tier === 'Silver').length} customers
                        </div>
                      </div>
                      <StarIcon className="w-5 h-5 text-cyan-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="md:col-span-2">
              <Card>
                <CardContent>
                  <h3 className="text-lg font-semibold mb-4">Top Customers by Points</h3>
                  <div className="space-y-3">
                    {customers
                      .sort((a, b) => b.loyaltyPoints - a.loyaltyPoints)
                      .slice(0, 5)
                      .map((customer) => (
                        <div key={customer.id} className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarFallback className="bg-blue-600 text-white">
                              {customer.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="font-medium">{customer.name}</div>
                            <div className="text-sm text-gray-600">
                              {customer.loyaltyPoints} points • {customer.tier} tier
                            </div>
                          </div>
                          <div className="text-sm text-gray-600">
                            ₹{customer.totalPurchases.toLocaleString()}
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Add/Edit Customer Dialog */}
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
            <DialogTitle>
              {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
            </DialogTitle>
            <DialogDescription>
              {editingCustomer ? 'Update customer information and contact details.' : 'Add a new customer to your database with their contact information.'}
            </DialogDescription>
          </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <textarea
                  id="address"
                  rows={3}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenDialog(false)}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSaveCustomer}>
                <Save className="w-4 h-4 mr-2" />
                {editingCustomer ? 'Update' : 'Add'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Tabs>
    </div>
  )
}

export default CustomerManagement