import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Sheet, SheetContent } from '../ui/sheet'
import { Separator } from '../ui/separator'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { Card, CardContent } from '../ui/card'
import {
  Menu as MenuIcon,
  LayoutDashboard as DashboardIcon,
  Package as InventoryIcon,
  Receipt as ReceiptIcon,
  LogOut as LogoutIcon,
  User as AccountCircle,
  User as PersonIcon,
  Settings as SettingsIcon,
  Bell as NotificationsIcon,
  Users as PeopleIcon,
  UserPlus as PersonAddIcon,
  BarChart3 as AssessmentIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRight,
  ChevronUp as ExpandLess,
  ChevronDown as ExpandMore,
  Store as StoreIcon,
  BookOpen as BookOnlineIcon,
  TrendingUp as TrendingUpIcon,
  Palette as PaletteIcon,
  X as CloseIcon,
  Building2 as BuildingIcon,
  Mail as MailIcon
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContextSupabase'
import { useSync } from '../../contexts/SyncContext'
import { useSettings } from '../../contexts/SettingsContext'

import { supabase } from '../../supabase/config'
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
    path: '/reports'
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

const Layout = React.memo(({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [expandedSections, setExpandedSections] = useState({})
  const [businessName, setBusinessName] = useState('CANEFROST')
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640)
  const navigate = useNavigate()
  const location = useLocation()
  const { currentUser, logout } = useAuth()
  const { isOnline, syncStatus, lastSyncTime, forceSyncAll } = useSync()

  const { settings } = useSettings()

  const currentDrawerWidth = sidebarCollapsed ? collapsedDrawerWidth : drawerWidth

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640)
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Load business name from settings context
  useEffect(() => {
    if (settings?.businessName && settings.businessName !== 'CANEFROST JUICE SHOP') {
      setBusinessName(settings.businessName)
    } else {
      // Fallback to loading from Supabase if not in settings
      const loadBusinessName = async () => {
        if (!currentUser?.id) return
        
        try {
          const { data, error } = await supabase
            .from('user_profiles')
            .select('business_details')
            .eq('user_id', currentUser.id)
            .single()
          
          if (error) {
            // If user_profiles doesn't exist or user not found, keep default
            if (error.code === 'PGRST116' || error.code === '42P01') {
              console.log('User profiles table not found or no profile exists, using default business name')
              return
            }
            throw error
          }
          
          if (data?.business_details?.businessName) {
            setBusinessName(data.business_details.businessName)
          }
        } catch (error) {
          console.error('Error loading business name:', error)
          // Keep default name on error
        }
      }
      
      loadBusinessName()
    }
  }, [currentUser, settings?.businessName])

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

  // Create separate drawer content for mobile and desktop
  const mobileDrawer = (
    <div className="h-full bg-background">
      {/* Header with logo */}
      <div className="flex items-center min-h-[64px] px-4 justify-between">
        <div className="flex items-center gap-2">
          <img 
            src="/static/logo.jpg" 
            alt="Canefrost Logo" 
            className="object-cover rounded-lg w-8 h-8 sm:w-10 sm:h-10"
            onError={(e) => {
              e.target.style.display = 'none'
              console.error('Logo image failed to load')
            }}
          />
          <h6 className="font-bold text-black text-sm sm:text-lg truncate max-w-[120px] sm:max-w-none">
            {businessName}
          </h6>
        </div>
      </div>
      <Separator />
      
      {/* Navigation Menu */}
      <div className="pt-2 px-2">
        {menuItems.map((item) => (
          <React.Fragment key={item.text}>
            <div className="mb-2">
              <button
                className={`w-full min-h-[48px] rounded-lg transition-all duration-200 flex items-center justify-start px-4 py-3 ${
                  item.primary 
                    ? 'bg-accent text-accent-foreground hover:bg-accent/80 border border-primary/20'
                    : (item.path ? isPathActive(item.path) : isParentActive(item.children))
                      ? 'bg-muted text-foreground hover:bg-muted/80'
                      : 'text-muted-foreground hover:bg-muted/50'
                }`}
                onClick={() => {
                  if (item.expandable) {
                    handleExpandToggle(item.text)
                  } else if (item.action === 'logout') {
                    handleLogout()
                  } else if (item.path) {
                    navigate(item.path)
                    setMobileOpen(false)
                  }
                }}
              >
                <div className="flex items-center justify-center w-10">
                  {item.icon}
                </div>
                <span className="text-sm font-medium flex-1 text-left ml-3">
                  {item.text}
                </span>
                {item.badge && (
                  <Badge 
                    variant="secondary"
                    className={`h-5 text-xs font-bold text-white ${
                      item.badge === 'NEW' ? 'bg-green-500' : 'bg-orange-500'
                    }`}
                  >
                    {item.badge}
                  </Badge>
                )}
                {item.expandable && (
                  <div className="ml-auto">
                    {expandedSections[item.text] ? <ExpandLess className="w-4 h-4" /> : <ExpandMore className="w-4 h-4" />}
                  </div>
                )}
              </button>
            </div>
            
            {/* Expandable submenu */}
            {item.expandable && expandedSections[item.text] && (
              <div className="pl-4">
                {item.children?.map((child) => (
                  <div key={child.text} className="mb-1">
                    <button
                      className={`w-full min-h-[40px] rounded-md transition-colors duration-200 flex items-center justify-start px-4 py-2 ml-2 mr-1 ${
                        isPathActive(child.path)
                          ? 'bg-muted text-foreground hover:bg-muted/80 border-l-2 border-primary'
                          : 'text-muted-foreground hover:bg-muted/50'
                      }`}
                      onClick={() => {
                        navigate(child.path)
                        setMobileOpen(false)
                      }}
                    >
                      <span className={`text-sm ${
                        isPathActive(child.path) ? 'font-semibold' : 'font-normal'
                      }`}>
                        {child.text}
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </React.Fragment>
        ))}
        

      </div>
    </div>
  )

  const drawer = (
    <div className="h-full bg-background">
      {/* Header with logo and collapse button */}
      <div className={`flex items-center min-h-[64px] ${sidebarCollapsed ? 'px-2 justify-center' : 'px-4 justify-between'}`}>
        <div className={`flex items-center ${sidebarCollapsed ? 'gap-0' : 'gap-2'}`}>
          {!sidebarCollapsed && (
            <>
              <img 
                src="/static/logo.jpg" 
                alt="Canefrost Logo" 
                className="object-cover rounded-lg w-10 h-10"
                onError={(e) => {
                  e.target.style.display = 'none'
                  console.error('Logo image failed to load')
                }}
              />
              <h6 className="font-bold text-black text-lg">
                {businessName}
              </h6>
            </>
          )}
        </div>
        <Button 
          variant="outline"
          size="sm"
          onClick={handleSidebarToggle}
          className={`text-muted-foreground hover:text-foreground hover:bg-muted/50 shadow-sm transition-all duration-300 ${
            sidebarCollapsed 
              ? 'w-8 h-8 p-1' 
              : 'p-2'
          }`}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeftIcon className="w-4 h-4" />
          )}
        </Button>
      </div>
      <Separator />
      

      
      {/* Navigation Menu */}
      <div className="pt-2 px-2">
        {menuItems.map((item) => (
          <React.Fragment key={item.text}>
            <div className="mb-2">
              <button
                className={`w-full min-h-[48px] rounded-lg transition-all duration-200 flex items-center ${
                  sidebarCollapsed ? 'justify-center px-2' : 'justify-start px-4'
                } py-3 ${
                  item.primary 
                    ? 'bg-accent text-accent-foreground hover:bg-accent/80 border border-primary/20'
                    : (item.path ? isPathActive(item.path) : isParentActive(item.children))
                      ? 'bg-muted text-foreground hover:bg-muted/80'
                      : 'text-muted-foreground hover:bg-muted/50'
                }`}
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
              >
                <div className={`flex items-center justify-center ${sidebarCollapsed ? 'w-6' : 'w-10'}`}>
                  {item.icon}
                </div>
                {!sidebarCollapsed && (
                  <>
                    <span className="text-sm font-medium flex-1 text-left ml-3">
                      {item.text}
                    </span>
                    {item.badge && (
                      <Badge 
                        variant="secondary"
                        className={`h-5 text-xs font-bold text-white ${
                          item.badge === 'NEW' ? 'bg-green-500' : 'bg-orange-500'
                        }`}
                      >
                        {item.badge}
                      </Badge>
                    )}
                    {item.expandable && (
                      <div className="ml-auto">
                        {expandedSections[item.text] ? <ExpandLess className="w-4 h-4" /> : <ExpandMore className="w-4 h-4" />}
                      </div>
                    )}
                  </>
                )}
              </button>
            </div>
            
            {/* Expandable submenu */}
            {item.expandable && !sidebarCollapsed && expandedSections[item.text] && (
              <div className="pl-4">
                {item.children?.map((child) => (
                  <div key={child.text} className="mb-1">
                    <button
                      className={`w-full min-h-[40px] rounded-md transition-colors duration-200 flex items-center justify-start px-4 py-2 ml-2 mr-1 ${
                        isPathActive(child.path)
                          ? 'bg-muted text-foreground hover:bg-muted/80 border-l-2 border-primary'
                          : 'text-muted-foreground hover:bg-muted/50'
                      }`}
                      onClick={() => {
                        navigate(child.path)
                        if (mobileOpen) {
                          setMobileOpen(false)
                        }
                      }}
                    >
                      <span className={`text-sm ${
                        isPathActive(child.path) ? 'font-semibold' : 'font-normal'
                      }`}>
                        {child.text}
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </React.Fragment>
        ))}
        

      </div>
    </div>
  )

  return (
    <div className="flex">
      {/* Header */}
      <header 
        role="banner" 
        aria-label="Site header"
        className="fixed top-0 left-0 right-0 bg-background border-b border-border z-30 h-14"
      >
        <div className="flex items-center justify-between h-full px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDrawerToggle}
            className="mr-2 sm:hidden"
            aria-label="Open navigation menu"
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
          >
            <MenuIcon className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center justify-center flex-1">
            <h1 className="font-bold text-xl tracking-wider">
              {businessName}
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="hidden lg:block text-gray-500 text-sm" aria-live="polite">
              {lastSyncTime ? `Last synced: ${new Date(lastSyncTime).toLocaleString()}` : 'Never synced'}
            </span>
            
            <button 
              className={`flex items-center px-2 py-1 rounded bg-muted hover:bg-muted/80 transition-colors ${
                isOnline && syncStatus !== 'syncing' ? 'cursor-pointer' : 'cursor-default'
              }`}
              onClick={async () => {
                if (isOnline && syncStatus !== 'syncing') {
                  await forceSyncAll()
                }
              }}
              disabled={!isOnline || syncStatus === 'syncing'}
              aria-label={`Connection status: ${syncStatus === 'syncing' ? 'Syncing data' : isOnline ? 'Online' : 'Offline'}. ${isOnline && syncStatus !== 'syncing' ? 'Click to sync data' : ''}`}
            >
              <div
                className={`w-2 h-2 rounded-full mr-2 ${
                  isOnline 
                    ? (syncStatus === 'syncing' ? 'bg-orange-500 animate-pulse' : 'bg-green-500')
                    : 'bg-red-500'
                }`}
                aria-hidden="true"
              />
              <span className="text-xs text-gray-600 hidden sm:inline">
                {syncStatus === 'syncing' ? 'Syncing...' : isOnline ? 'Online' : 'Offline'}
              </span>
            </button>
            
            {/* Notifications Icon */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-2 hover:bg-muted/50"
              aria-label="Notifications"
            >
              <NotificationsIcon className="h-5 w-5 text-muted-foreground" />
            </Button>
            
            {/* Logout Button */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout}
              className="p-2 hover:bg-muted/50"
              aria-label="Logout"
            >
              <LogoutIcon className="h-5 w-5 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </header>
      
      {/* Navigation */}
      <nav role="navigation" aria-label="Main navigation">
        {/* Mobile drawer */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent 
            side="left" 
            className="w-64 p-0 bg-background border-r border-border overflow-y-auto"
            id="mobile-navigation"
            aria-label="Mobile navigation menu"
          >
            <div className="h-full">
              {mobileDrawer}
            </div>
          </SheetContent>
        </Sheet>

        {/* Desktop drawer */}
        <div className="hidden sm:block">
          <div 
            className={`fixed left-0 top-14 h-[calc(100vh-56px)] bg-background border-r border-border transition-all duration-300 z-10 ${
              sidebarCollapsed ? 'w-16 overflow-visible' : 'w-64 overflow-hidden'
            }`}
            role="complementary"
            aria-label="Desktop navigation menu"
          >
            {drawer}
          </div>
        </div>
      </nav>
      
      {/* Main content area with responsive padding */}
      <main
        id="main-content"
        role="main"
        aria-label="Main content"
        className="flex-1 bg-muted/30 transition-all duration-300 overflow-auto"
        style={{
          marginLeft: isMobile ? 0 : (sidebarCollapsed ? 64 : 256),
          marginTop: '56px',
          height: 'calc(100vh - 56px)',
          width: isMobile ? '100%' : (sidebarCollapsed ? 'calc(100% - 64px)' : 'calc(100% - 256px)')
        }}
        tabIndex={-1}
      >
        <div className="w-full h-full">
          {children}
        </div>
      </main>
    </div>
  )
})

Layout.displayName = "Layout";

export default Layout