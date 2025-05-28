import React, { useState, useEffect } from 'react'
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useTheme,
  useMediaQuery,
  Collapse,
  Badge,
  Chip,
  Divider
} from '@mui/material'
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  Receipt as ReceiptIcon,
  Logout as LogoutIcon,
  AccountCircle,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  People as PeopleIcon,
  PersonAdd as PersonAddIcon,
  Assessment as AssessmentIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ExpandLess,
  ExpandMore,
  Store as StoreIcon,
  BookOnline as BookOnlineIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useSync } from '../../contexts/SyncContext'
import { db } from '../../firebase/config'
import { doc, getDoc } from 'firebase/firestore'
import toast from 'react-hot-toast'

const drawerWidth = 280
const collapsedDrawerWidth = 64

const menuItems = [
  { 
    text: 'POS / New Sale', 
    icon: <StoreIcon />, 
    path: '/',
    badge: 'MAIN',
    primary: true
  },
  {
    text: 'Inventory',
    icon: <InventoryIcon />,
    path: '/products'
  },
  {
    text: 'Sales & History',
    icon: <ReceiptIcon />,
    path: '/sales'
  },
  {
    text: 'Management',
    icon: <PeopleIcon />,
    expandable: true,
    children: [
      { text: 'Staff Management', path: '/staff' },
      { text: 'Customer Management', path: '/customers' }
    ]
  },
  {
    text: 'Reports',
    icon: <AssessmentIcon />,
    expandable: true,
    children: [
      { text: 'Sales Report', path: '/reports/sales' },
      { text: 'Payment Report', path: '/reports/payments' },
      { text: 'DayBook', path: '/reports/daybook' }
    ]
  },
  { 
    text: 'Profile', 
    icon: <PersonIcon />, 
    path: '/profile' 
  },
  { 
    text: 'Settings', 
    icon: <SettingsIcon />, 
    path: '/settings' 
  },
  { 
    text: 'Logout', 
    icon: <LogoutIcon />, 
    action: 'logout',
    color: 'error.main'
  }
]

function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [expandedSections, setExpandedSections] = useState({})
  const [businessName, setBusinessName] = useState('CANEFROST')
  const navigate = useNavigate()
  const location = useLocation()
  const { currentUser, logout } = useAuth()
  const { isOnline, syncStatus, lastSyncTime, forceSyncAll } = useSync()

  const currentDrawerWidth = sidebarCollapsed ? collapsedDrawerWidth : drawerWidth

  // Load business name from Firebase
  useEffect(() => {
    const loadBusinessName = async () => {
      if (currentUser) {
        try {
          const docRef = doc(db, 'businessDetails', currentUser.uid)
          const docSnap = await getDoc(docRef)
          if (docSnap.exists()) {
            const data = docSnap.data()
            setBusinessName(data.businessName || 'Business Name')
          }
        } catch (error) {
          console.error('Error loading business name:', error)
        }
      }
    }
    loadBusinessName()
  }, [currentUser])

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed)
    // Collapse all expanded items when sidebar is collapsed
    if (!sidebarCollapsed) {
      setExpandedSections({})
    }
  }

  const handleExpandToggle = (itemText) => {
    if (sidebarCollapsed) return // Don't expand when collapsed
    setExpandedSections(prev => ({
      ...prev,
      [itemText]: !prev[itemText]
    }))
  }

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const isPathActive = (path) => {
    return location.pathname === path
  }

  const isParentActive = (children) => {
    return children?.some(child => location.pathname === child.path)
  }

  const drawer = (
    <div>
      {/* Header with logo and collapse button */}
      <Toolbar sx={{ 
        justifyContent: sidebarCollapsed ? 'center' : 'space-between',
        px: sidebarCollapsed ? 1 : 2
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          gap: sidebarCollapsed ? 0 : 2
        }}>
          <img 
            src="/images/logo.jpg" 
            alt="Canefrost Logo" 
            style={{ 
              height: sidebarCollapsed ? '32px' : '40px', 
              width: sidebarCollapsed ? '32px' : '40px', 
              objectFit: 'cover',
              borderRadius: '8px',
              transition: 'all 0.3s ease'
            }} 
          />
          {!sidebarCollapsed && (
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 'bold',
                color: '#1976d2',
                fontSize: '1.1rem'
              }}
            >
              CANEFROST
            </Typography>
          )}
        </Box>
        {!sidebarCollapsed && (
          <IconButton 
            onClick={handleSidebarToggle}
            size="small"
            sx={{ 
              color: '#6B7280',
              '&:hover': { backgroundColor: '#F3F4F6' }
            }}
          >
            <ChevronLeftIcon />
          </IconButton>
        )}
        {sidebarCollapsed && (
          <IconButton 
            onClick={handleSidebarToggle}
            size="small"
            sx={{ 
              position: 'absolute',
              right: -12,
              top: '50%',
              transform: 'translateY(-50%)',
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              boxShadow: 1,
              '&:hover': { backgroundColor: '#F9FAFB' },
              zIndex: 1
            }}
          >
            <ChevronRightIcon fontSize="small" />
          </IconButton>
        )}
      </Toolbar>
      <Divider />
      
      {/* User Profile Section */}
      {!sidebarCollapsed && (
        <Box sx={{ p: 2, borderBottom: '1px solid #E5E7EB' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <AccountCircle sx={{ fontSize: 32, color: '#6B7280', mr: 1.5 }} />
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography 
                variant="subtitle2" 
                fontWeight="bold"
                sx={{ 
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {currentUser?.displayName || 'User'}
              </Typography>
              <Typography 
                variant="caption" 
                color="text.secondary"
                sx={{ 
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  display: 'block'
                }}
              >
                {currentUser?.email}
              </Typography>
            </Box>
          </Box>
          {lastSyncTime && (
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ 
                fontSize: '0.7rem',
                display: 'block',
                textAlign: 'center',
                mt: 1
              }}
            >
              Last sync: {new Date(lastSyncTime.toDate()).toLocaleTimeString()}
            </Typography>
          )}
        </Box>
      )}
      
      {/* Navigation Menu */}
      <List sx={{ pt: 1, px: 1 }}>
        {menuItems.map((item) => (
          <React.Fragment key={item.text}>
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={item.path ? isPathActive(item.path) : isParentActive(item.children)}
                onClick={() => {
                  if (item.expandable) {
                    handleExpandToggle(item.text)
                  } else if (item.action === 'logout') {
                    handleLogout()
                  } else if (item.path) {
                    navigate(item.path)
                    if (mobileOpen) {
                      setMobileOpen(false)
                    }
                  }
                }}
                sx={{
                  minHeight: 48,
                  px: sidebarCollapsed ? 1 : 2,
                  py: 1.5,
                  borderRadius: 2,
                  transition: 'all 0.2s ease-in-out',
                  backgroundColor: item.primary ? '#1976d2' : 'transparent',
                  color: item.primary ? 'white' : 'inherit',
                  '&.Mui-selected': {
                    backgroundColor: item.primary ? '#1565c0' : '#E3F2FD',
                    color: item.primary ? 'white' : '#1976d2',
                    '&:hover': {
                      backgroundColor: item.primary ? '#1565c0' : '#BBDEFB',
                    },
                  },
                  '&:hover': {
                    backgroundColor: item.primary ? '#1565c0' : 
                      (item.path ? isPathActive(item.path) : isParentActive(item.children)) ? '#BBDEFB' : '#F5F5F5',
                  },
                  justifyContent: sidebarCollapsed ? 'center' : 'flex-start'
                }}
              >
                <ListItemIcon
                  sx={{
                    color: item.primary ? 'white' : 
                      (item.path ? isPathActive(item.path) : isParentActive(item.children)) ? '#1976d2' : '#6B7280',
                    minWidth: sidebarCollapsed ? 'auto' : 40,
                    mr: sidebarCollapsed ? 0 : 1,
                    transition: 'all 0.2s ease-in-out',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {!sidebarCollapsed && (
                  <>
                    <ListItemText 
                      primary={item.text}
                      primaryTypographyProps={{
                        fontSize: '0.875rem',
                        fontWeight: (item.path ? isPathActive(item.path) : isParentActive(item.children)) || item.primary ? 600 : 500,
                        color: item.color || (item.primary ? 'white' : 
                          (item.path ? isPathActive(item.path) : isParentActive(item.children)) ? '#1976d2' : '#374151')
                      }}
                    />
                    {item.badge && (
                      <Chip 
                        label={item.badge} 
                        size="small" 
                        sx={{ 
                          height: 20, 
                          fontSize: '0.7rem',
                          backgroundColor: item.badge === 'NEW' ? '#4CAF50' : '#FF9800',
                          color: 'white',
                          fontWeight: 'bold'
                        }} 
                      />
                    )}
                    {item.expandable && (
                    expandedSections[item.text] ? <ExpandLess /> : <ExpandMore />
                  )}
                  </>
                )}
              </ListItemButton>
            </ListItem>
            
            {/* Expandable submenu */}
            {item.expandable && !sidebarCollapsed && (
              <Collapse in={expandedSections[item.text]} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {item.children?.map((child) => (
                    <ListItem key={child.text} disablePadding sx={{ mb: 0.3 }}>
                      <ListItemButton
                        selected={isPathActive(child.path)}
                        onClick={() => {
                          navigate(child.path)
                          if (mobileOpen) {
                            setMobileOpen(false)
                          }
                        }}
                        sx={{
                          minHeight: 40,
                          pl: 4,
                          pr: 2,
                          py: 1,
                          borderRadius: 1,
                          ml: 1,
                          mr: 0.5,
                          transition: 'all 0.2s ease-in-out',
                          '&.Mui-selected': {
                            backgroundColor: '#E3F2FD',
                            color: '#1976d2',
                            borderLeft: '3px solid #1976d2',
                            '&:hover': {
                              backgroundColor: '#BBDEFB',
                            },
                          },
                          '&:hover': {
                            backgroundColor: isPathActive(child.path) ? '#BBDEFB' : '#F5F5F5',
                          },
                        }}
                      >
                        <ListItemText 
                          primary={child.text}
                          primaryTypographyProps={{
                            fontSize: '0.8rem',
                            fontWeight: isPathActive(child.path) ? 600 : 400,
                            color: isPathActive(child.path) ? '#1976d2' : '#6B7280'
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            )}
          </React.Fragment>
        ))}
      </List>
    </div>
  )

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${currentDrawerWidth}px)` },
          ml: { sm: `${currentDrawerWidth}px` },
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: '#FFFFFF',
          color: '#1F2937',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          transition: 'all 0.3s ease'
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ 
              mr: 2, 
              display: { sm: 'none' },
              minWidth: 44,
              minHeight: 44
            }}
          >
            <MenuIcon />
          </IconButton>
          
          {/* Mobile-optimized header layout */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: { xs: 'flex-start', sm: 'center' },
            flexGrow: 1,
            overflow: 'hidden'
          }}>
            <Typography 
              variant="h6" 
              noWrap 
              component="div" 
              sx={{ 
                fontWeight: 'bold',
                fontSize: { xs: '1.1rem', sm: '1.25rem' },
                letterSpacing: { xs: '0.5px', sm: '1px' }
              }}
            >
              {businessName}
            </Typography>
          </Box>
          
          {/* Welcome Message and Sync Status */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Welcome Message */}
            <Typography 
              variant="body2" 
              sx={{ 
                display: { xs: 'none', md: 'block' },
                maxWidth: 200,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {lastSyncTime ? `Last synced: ${new Date(lastSyncTime).toLocaleString()}` : 'Never synced'}
            </Typography>
            
            {/* Sync Status */}
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                px: 1,
                py: 0.5,
                borderRadius: 1,
                bgcolor: 'rgba(0,0,0,0.05)',
                cursor: isOnline && syncStatus !== 'syncing' ? 'pointer' : 'default',
                '&:hover': {
                  bgcolor: isOnline && syncStatus !== 'syncing' ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.05)'
                }
              }}
              onClick={async () => {
                if (isOnline && syncStatus !== 'syncing') {
                  await forceSyncAll()
                }
              }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: isOnline 
                    ? (syncStatus === 'syncing' ? '#ff9800' : '#4caf50')
                    : '#f44336',
                  mr: 1,
                  animation: syncStatus === 'syncing' ? 'pulse 1.5s infinite' : 'none',
                  '@keyframes pulse': {
                    '0%': { opacity: 1 },
                    '50%': { opacity: 0.5 },
                    '100%': { opacity: 1 }
                  }
                }}
              />
              <Typography variant="caption" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                {syncStatus === 'syncing' ? 'Syncing...' : isOnline ? 'Online' : 'Offline'}
              </Typography>
            </Box>
          </Box>


        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: currentDrawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="navigation menu"
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth, // Always full width on mobile
              backgroundColor: '#FFFFFF',
              borderRight: '1px solid #E5E7EB',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            },
          }}
        >
          {drawer}
        </Drawer>
        
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: currentDrawerWidth,
              backgroundColor: '#FFFFFF',
              borderRight: '1px solid #E5E7EB',
              transition: 'width 0.3s ease',
              overflow: 'visible' // Allow collapse button to show outside
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      {/* Main content area with responsive padding */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1, sm: 3 },
          width: { sm: `calc(100% - ${currentDrawerWidth}px)` },
          minHeight: '100vh',
          backgroundColor: '#F8FAFC',
          transition: 'all 0.3s ease'
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }} />
        <Box sx={{ 
          maxWidth: '100%',
          overflow: 'hidden',
          mt: 1
        }}>
          {children}
        </Box>
      </Box>
    </Box>
  )
}

export default Layout