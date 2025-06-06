import React, { useState } from 'react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { useStaff } from '../../contexts/StaffContext'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Switch } from '../ui/switch'
import { Badge } from '../ui/badge'
import { Separator } from '../ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Plus, Edit, Trash2, User, Clock, BarChart3 } from 'lucide-react'

function StaffManagement() {
  const [activeTab, setActiveTab] = useState('staff')
  const { staff, shifts, addStaffMember, updateStaffMember, deleteStaffMember, addShift, updateShift, deleteShift, loading } = useStaff()
  
  const [openDialog, setOpenDialog] = useState(false)
  const [editingStaff, setEditingStaff] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'staff',
    accessCode: ''
  })
  const [generateAccessCode, setGenerateAccessCode] = useState(true)

  const roles = ['admin', 'manager', 'staff']
  const permissions = {
    'admin': ['All Access', 'Staff Management', 'Reports', 'Settings'],
    'manager': ['Sales', 'Inventory', 'Reports', 'Staff Management'],
    'staff': ['Sales', 'Basic Inventory']
  }

  const generateRandomAccessCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }

  const handleAddStaff = () => {
    setEditingStaff(null)
    const newAccessCode = generateRandomAccessCode()
    setFormData({ name: '', email: '', phone: '', role: 'staff', accessCode: newAccessCode })
    setGenerateAccessCode(true)
    setOpenDialog(true)
  }

  const handleEditStaff = (staffMember) => {
    setEditingStaff(staffMember)
    setFormData({
      name: staffMember.name,
      email: staffMember.email,
      phone: staffMember.phone,
      role: staffMember.role,
      accessCode: staffMember.accessCode || ''
    })
    setGenerateAccessCode(false)
    setOpenDialog(true)
  }

  const handleSaveStaff = async () => {
    try {
      if (editingStaff) {
        await updateStaffMember(editingStaff.id, formData)
        toast.success('Staff member updated successfully')
      } else {
        const newStaff = {
          ...formData,
          status: 'Active',
          join_date: new Date(),
          totalsales: 0,
          shiftsthisweek: 0,
          currentshift: 'Not Assigned',
          created_at: new Date(),
          accessCode: formData.accessCode || generateRandomAccessCode()
        }
        await addStaffMember(newStaff)
        toast.success('Staff member added successfully')
      }
      setOpenDialog(false)
    } catch (error) {
      toast.error('Error saving staff member')
    }
  }

  const handleDeleteStaff = async (id, name) => {
    const confirmed = window.confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)
    if (!confirmed) return
    
    try {
      await deleteStaffMember(id)
      toast.success('Staff member removed successfully')
    } catch (error) {
      console.error('Error removing staff member:', error)
      toast.error('Error removing staff member')
    }
  }

  const toggleStaffStatus = async (id) => {
    try {
      const staffMember = staff.find(s => s.id === id)
      if (staffMember) {
        await updateStaffMember(id, {
          status: staffMember.status === 'Active' ? 'Inactive' : 'Active'
        })
      }
    } catch (error) {
      toast.error('Error updating staff status')
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">Staff Management</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="staff" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            All Staff
          </TabsTrigger>
          <TabsTrigger value="shifts" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Shifts
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Performance
          </TabsTrigger>
        </TabsList>

        {/* Staff Members Tab */}
        <TabsContent value="staff" className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-lg font-semibold">Staff Members ({staff.length})</h2>
            <Button onClick={handleAddStaff} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Staff Member
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {staff.map((member) => (
              <Card key={member.id}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{member.name}</CardTitle>
                    <Badge variant={member.status === 'Active' ? 'default' : 'secondary'}>
                      {member.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>{member.email}</p>
                    <p>{member.phone}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Badge variant="outline">{member.role}</Badge>
                    <p className="text-xs text-muted-foreground">
                      Permissions: {permissions[member.role]?.join(', ')}
                    </p>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-1 text-sm">
                    <p><strong>Total Sales:</strong> ₹{member.totalsales.toLocaleString()}</p>
                <p><strong>Shifts This Week:</strong> {member.shiftsthisweek}</p>
                    <p><strong>Current Shift:</strong> {member.currentshift}</p>
                  </div>
                  
                  <div className="flex justify-between items-center pt-2">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditStaff(member)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteStaff(member.id, member.name)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`status-${member.id}`} className="text-xs">
                        Active
                      </Label>
                      <Switch
                        id={`status-${member.id}`}
                        checked={member.status === 'Active'}
                        onCheckedChange={() => toggleStaffStatus(member.id)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Shift Management Tab */}
        <TabsContent value="shifts" className="space-y-6">
          <h2 className="text-lg font-semibold">Shift Management</h2>
          
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff Member</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>End Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sales</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shifts.map((shift) => (
                  <TableRow key={shift.id}>
                    <TableCell>{shift.staffName}</TableCell>
                    <TableCell>{format(new Date(shift.date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>{shift.startTime}</TableCell>
                    <TableCell>{shift.endTime}</TableCell>
                    <TableCell>
                      <Badge variant={shift.status === 'Active' ? 'default' : 'secondary'}>
                        {shift.status}
                      </Badge>
                    </TableCell>
                    <TableCell>₹{shift.sales.toLocaleString()}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        <Edit className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <h2 className="text-lg font-semibold">Staff Performance</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {staff.map((member) => (
              <Card key={member.id}>
                <CardHeader>
                  <CardTitle>{member.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <p><strong>Total Sales:</strong> ₹{member.totalsales.toLocaleString()}</p>
                <p><strong>Average per Shift:</strong> ₹{Math.round(member.totalsales / Math.max(member.shiftsthisweek, 1)).toLocaleString()}</p>
                <p><strong>Shifts Completed:</strong> {member.shiftsthisweek}</p>
                    <div className="flex items-center gap-2">
                      <strong>Performance Rating:</strong>
                      <Badge 
                        variant={member.totalsales > 30000 ? 'default' : member.totalsales > 20000 ? 'secondary' : 'outline'}
              >
                {member.totalsales > 30000 ? 'Excellent' : member.totalsales > 20000 ? 'Good' : 'Average'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Staff Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
            </DialogTitle>
            <DialogDescription>
              {editingStaff ? 'Update staff member information and permissions.' : 'Add a new staff member to your team with appropriate access levels.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter staff member name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter email address"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Enter phone number"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role} value={role}>{role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="accessCode">Access Code</Label>
              <div className="flex gap-2">
                <Input
                  id="accessCode"
                  value={formData.accessCode}
                  onChange={(e) => setFormData({ ...formData, accessCode: e.target.value })}
                  placeholder="Access code for staff login"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFormData({ ...formData, accessCode: generateRandomAccessCode() })}
                  className="px-3"
                >
                  Generate
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                This code will be used for staff login along with their mobile number.
              </p>
            </div>
            
            {formData.role && (
              <div className="space-y-2">
                <Label>Role Permissions:</Label>
                <div className="space-y-1">
                  {permissions[formData.role]?.map((permission) => (
                    <p key={permission} className="text-sm text-muted-foreground">• {permission}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveStaff}>
              {editingStaff ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default StaffManagement