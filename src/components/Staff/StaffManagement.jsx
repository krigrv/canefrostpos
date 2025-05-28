import React, { useState } from 'react'
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
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
  ListItemSecondaryAction,
  Switch,
  Divider
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Assessment as AssessmentIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { useStaff } from '../../contexts/StaffContext'

function StaffManagement() {
  const [tabValue, setTabValue] = useState(0)
  const { staff, shifts, addStaffMember, updateStaffMember, deleteStaffMember, addShift, updateShift, deleteShift, loading } = useStaff()
  
  const [openDialog, setOpenDialog] = useState(false)
  const [editingStaff, setEditingStaff] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Cashier'
  })

  const roles = ['Manager', 'Cashier', 'Supervisor', 'Assistant']
  const permissions = {
    'Manager': ['All Access', 'Staff Management', 'Reports', 'Settings'],
    'Supervisor': ['Sales', 'Inventory', 'Reports'],
    'Cashier': ['Sales', 'Basic Inventory'],
    'Assistant': ['Sales']
  }

  const handleAddStaff = () => {
    setEditingStaff(null)
    setFormData({ name: '', email: '', phone: '', role: 'Cashier' })
    setOpenDialog(true)
  }

  const handleEditStaff = (staffMember) => {
    setEditingStaff(staffMember)
    setFormData({
      name: staffMember.name,
      email: staffMember.email,
      phone: staffMember.phone,
      role: staffMember.role
    })
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
          joinDate: new Date(),
          totalSales: 0,
          shiftsThisWeek: 0,
          currentShift: 'Not Assigned',
          createdAt: new Date()
        }
        await addStaffMember(newStaff)
        toast.success('Staff member added successfully')
      }
      setOpenDialog(false)
    } catch (error) {
      toast.error('Error saving staff member')
    }
  }

  const handleDeleteStaff = async (id) => {
    try {
      await deleteStaffMember(id)
      toast.success('Staff member removed')
    } catch (error) {
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

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )

  return (
    <Box>
      <Typography 
        variant="h4" 
        gutterBottom
        sx={{ 
          fontSize: { xs: '1.5rem', md: '2rem' },
          textTransform: 'capitalize'
        }}
      >
        Staff Management
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={(e, newValue) => setTabValue(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              fontSize: { xs: '0.75rem', md: '0.875rem' },
              minHeight: { xs: 40, md: 48 },
              textTransform: 'capitalize'
            }
          }}
        >
          <Tab icon={<PersonIcon sx={{ fontSize: { xs: 18, md: 24 } }} />} label="All Staff" />
          <Tab icon={<ScheduleIcon sx={{ fontSize: { xs: 18, md: 24 } }} />} label="Shifts" />
          <Tab icon={<AssessmentIcon sx={{ fontSize: { xs: 18, md: 24 } }} />} label="Performance" />
        </Tabs>
      </Paper>

      {/* Staff Members Tab */}
      <TabPanel value={tabValue} index={0}>
        <Box sx={{ 
          mb: 3, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 2, sm: 0 }
        }}>
          <Typography 
            variant="h6"
            sx={{ 
              fontSize: { xs: '1rem', md: '1.25rem' },
              textTransform: 'capitalize'
            }}
          >
            Staff Members ({staff.length})
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon sx={{ fontSize: { xs: 18, md: 20 } }} />}
            onClick={handleAddStaff}
            sx={{
              fontSize: { xs: '0.75rem', md: '0.875rem' },
              py: { xs: 1, md: 0.75 },
              minHeight: { xs: 40, md: 36 },
              width: { xs: '100%', sm: 'auto' },
              textTransform: 'capitalize'
            }}
          >
            Add Staff Member
          </Button>
        </Box>

        <Grid container spacing={3}>
          {staff.map((member) => (
            <Grid item xs={12} md={6} lg={4} key={member.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6">{member.name}</Typography>
                    <Chip 
                      label={member.status} 
                      color={member.status === 'Active' ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {member.email}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {member.phone}
                  </Typography>
                  
                  <Box sx={{ mt: 2, mb: 2 }}>
                    <Chip label={member.role} color="primary" size="small" sx={{ mr: 1 }} />
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      Permissions: {permissions[member.role]?.join(', ')}
                    </Typography>
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="body2" gutterBottom>
                    <strong>Total Sales:</strong> ₹{member.totalSales.toLocaleString()}
                  </Typography>
                  
                  <Typography variant="body2" gutterBottom>
                    <strong>Shifts This Week:</strong> {member.shiftsThisWeek}
                  </Typography>
                  
                  <Typography variant="body2" gutterBottom>
                    <strong>Current Shift:</strong> {member.currentShift}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                    <Box>
                      <IconButton onClick={() => handleEditStaff(member)} size="small">
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDeleteStaff(member.id)} size="small" color="error">
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                    <Switch
                      checked={member.status === 'Active'}
                      onChange={() => toggleStaffStatus(member.id)}
                      size="small"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Shift Management Tab */}
      <TabPanel value={tabValue} index={1}>
        <Typography variant="h6" gutterBottom>Shift Management</Typography>
        
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Staff Member</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Start Time</TableCell>
                <TableCell>End Time</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Sales</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {shifts.map((shift) => (
                <TableRow key={shift.id}>
                  <TableCell>{shift.staffName}</TableCell>
                  <TableCell>{format(new Date(shift.date), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>{shift.startTime}</TableCell>
                  <TableCell>{shift.endTime}</TableCell>
                  <TableCell>
                    <Chip 
                      label={shift.status} 
                      color={shift.status === 'Active' ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>₹{shift.sales.toLocaleString()}</TableCell>
                  <TableCell>
                    <IconButton size="small">
                      <EditIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Performance Tab */}
      <TabPanel value={tabValue} index={2}>
        <Typography variant="h6" gutterBottom>Staff Performance</Typography>
        
        <Grid container spacing={3}>
          {staff.map((member) => (
            <Grid item xs={12} md={6} key={member.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>{member.name}</Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      <strong>Total Sales:</strong> ₹{member.totalSales.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Average per Shift:</strong> ₹{Math.round(member.totalSales / Math.max(member.shiftsThisWeek, 1)).toLocaleString()}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Shifts Completed:</strong> {member.shiftsThisWeek}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Performance Rating:</strong> 
                      <Chip 
                        label={member.totalSales > 30000 ? 'Excellent' : member.totalSales > 20000 ? 'Good' : 'Average'}
                        color={member.totalSales > 30000 ? 'success' : member.totalSales > 20000 ? 'primary' : 'default'}
                        size="small"
                        sx={{ ml: 1 }}
                      />
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Add/Edit Staff Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
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
          <FormControl fullWidth margin="normal">
            <InputLabel>Role</InputLabel>
            <Select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              {roles.map((role) => (
                <MenuItem key={role} value={role}>{role}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          {formData.role && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Role Permissions:
              </Typography>
              <List dense>
                {permissions[formData.role]?.map((permission) => (
                  <ListItem key={permission}>
                    <ListItemText primary={permission} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveStaff} variant="contained">
            {editingStaff ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default StaffManagement