import React, { useState } from 'react'
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Chip
} from '@mui/material'
import {
  People as PeopleIcon,
  PersonAdd as PersonAddIcon,
  Assessment as AssessmentIcon,
  Receipt as ReceiptIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Store as StoreIcon,
  Print as PrintIcon,
  Backup as BackupIcon,
  Update as UpdateIcon,
  Settings as SettingsIcon,
  AccountBalance as TaxIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

function Settings() {
  const navigate = useNavigate()
  const [settings, setSettings] = useState({
    notifications: true,
    autoBackup: true,
    receiptPrinting: true,
    taxCalculation: true,
    inventoryAlerts: true,
    salesReports: true
  })

  const handleSettingChange = (setting) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }))
    toast.success(`${setting} ${!settings[setting] ? 'enabled' : 'disabled'}`)
  }

  const managementCards = [
    {
      title: 'Staff Management',
      description: 'Manage employees, assign roles, track performance and shifts',
      icon: <PeopleIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      features: ['Role Assignment', 'Sales Monitoring', 'Shift Management', 'Performance Tracking'],
      action: () => navigate('/staff'),
      color: 'primary'
    },
    {
      title: 'Customer Management',
      description: 'Track customers, purchase history, and loyalty programs',
      icon: <PersonAddIcon sx={{ fontSize: 40, color: 'success.main' }} />,
      features: ['Customer Database', 'Purchase History', 'Loyalty Program', 'Customer Analytics'],
      action: () => navigate('/customers'),
      color: 'success'
    },
    {
      title: 'Reports & Analytics',
      description: 'Sales reports, peak hours analysis, tax filing assistance',
      icon: <AssessmentIcon sx={{ fontSize: 40, color: 'info.main' }} />,
      features: ['Sales Reports', 'Peak Hours', 'Popular Items', 'Tax & Audit'],
      action: () => navigate('/reports'),
      color: 'info'
    }
  ]

  const systemSettings = [
    {
      title: 'Notifications',
      description: 'Enable system notifications and alerts',
      icon: <NotificationsIcon />,
      setting: 'notifications'
    },
    {
      title: 'Auto Backup',
      description: 'Automatically backup data daily',
      icon: <BackupIcon />,
      setting: 'autoBackup'
    },
    {
      title: 'Receipt Printing',
      description: 'Enable automatic receipt printing',
      icon: <PrintIcon />,
      setting: 'receiptPrinting'
    },
    {
      title: 'Tax Calculation',
      description: 'Automatic tax calculation and compliance',
      icon: <TaxIcon />,
      setting: 'taxCalculation'
    },
    {
      title: 'Inventory Alerts',
      description: 'Low stock and inventory notifications',
      icon: <StoreIcon />,
      setting: 'inventoryAlerts'
    },
    {
      title: 'Sales Reports',
      description: 'Generate daily and weekly sales reports',
      icon: <TrendingUpIcon />,
      setting: 'salesReports'
    }
  ]

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Settings & Management
      </Typography>
      
      <Typography variant="body1" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
        Configure your POS system and manage business operations
      </Typography>

      {/* Management Cards */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
        Business Management
      </Typography>
      
      <Grid container spacing={3}>
        {managementCards.map((card) => (
          <Grid item xs={12} md={4} key={card.title}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  {card.icon}
                  <Typography variant="h6" sx={{ ml: 2 }}>
                    {card.title}
                  </Typography>
                </Box>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {card.description}
                </Typography>
                
                <Box sx={{ mt: 2 }}>
                  {card.features.map((feature) => (
                    <Chip
                      key={feature}
                      label={feature}
                      size="small"
                      variant="outlined"
                      sx={{ mr: 0.5, mb: 0.5 }}
                    />
                  ))}
                </Box>
              </CardContent>
              
              <CardActions>
                <Button
                  fullWidth
                  variant="contained"
                  color={card.color}
                  onClick={card.action}
                  startIcon={<SettingsIcon />}
                >
                  Manage
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* System Settings */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
        System Configuration
      </Typography>
      
      <Paper sx={{ p: 2 }}>
        <List>
          {systemSettings.map((item, index) => (
            <React.Fragment key={item.title}>
              <ListItem>
                <ListItemIcon>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.title}
                  secondary={item.description}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings[item.setting]}
                      onChange={() => handleSettingChange(item.setting)}
                      color="primary"
                    />
                  }
                  label={settings[item.setting] ? 'Enabled' : 'Disabled'}
                />
              </ListItem>
              {index < systemSettings.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </Paper>

      {/* Quick Actions */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
        Quick Actions
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12} md={3}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<BackupIcon />}
            onClick={() => toast.success('Backup initiated successfully!')}
          >
            Backup Data
          </Button>
        </Grid>
        <Grid item xs={12} md={3}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<UpdateIcon />}
            onClick={() => toast.info('System is up to date!')}
          >
            Check Updates
          </Button>
        </Grid>
        <Grid item xs={12} md={3}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<SecurityIcon />}
            onClick={() => toast.success('Security scan completed!')}
          >
            Security Scan
          </Button>
        </Grid>
        <Grid item xs={12} md={3}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<ReceiptIcon />}
            onClick={() => toast.success('Test receipt printed!')}
          >
            Test Receipt
          </Button>
        </Grid>
      </Grid>

      {/* System Status */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
        System Status
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Alert severity="success">
            <strong>System Health:</strong> All systems operational
          </Alert>
        </Grid>
        <Grid item xs={12} md={6}>
          <Alert severity="info">
            <strong>Last Backup:</strong> Today at 2:00 AM
          </Alert>
        </Grid>
        <Grid item xs={12} md={6}>
          <Alert severity="warning">
            <strong>Storage:</strong> 78% used (22% remaining)
          </Alert>
        </Grid>
        <Grid item xs={12} md={6}>
          <Alert severity="info">
            <strong>Version:</strong> POS System v2.1.0
          </Alert>
        </Grid>
      </Grid>
    </Box>
  )
}

export default Settings