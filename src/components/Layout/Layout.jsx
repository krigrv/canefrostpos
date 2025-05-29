import React, { useState, useEffect } from 'react'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Sheet, SheetContent } from '../ui/sheet'
import { Separator } from '../ui/separator'
import { Collapsible, CollapsibleContent } from '../ui/collapsible'
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
  Palette as PaletteIcon
} from 'lucide-react'
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
    text: 'UI Demo', 
    icon: <PaletteIcon />, 
    path: '/demo',
    badge: 'NEW'
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
      <div className={`flex items-center min-h-[64px] px-${sidebarCollapsed ? '2' : '4'} ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
        <div className={`flex items-center ${sidebarCollapsed ? 'gap-0' : 'gap-2'}`}>
          <img 
            src="/src/assets/images/logo.jpg" 
            alt="Canefrost Logo" 
            className={`object-cover rounded-lg transition-all duration-300 ${sidebarCollapsed ? 'w-8 h-8' : 'w-10 h-10'}`}
          />
          {!sidebarCollapsed && (
            <h6 className="font-bold text-black text-lg">
                CANEFROST
              </h6>
          )}
        </div>
        {!sidebarCollapsed && (
          <Button 
            variant="outline"
            size="sm"
            onClick={handleSidebarToggle}
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-50 p-2 shadow-sm"
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </Button>
        )}
        {sidebarCollapsed && (
          <Button
            onClick={handleSidebarToggle}
            variant="outline"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border border-gray-200 shadow-sm hover:bg-gray-50 z-10"
          >
            <ChevronRight className="h-3 w-3" />
          </Button>
        )}
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
                    ? 'bg-black text-white hover:bg-gray-800'
                    : (item.path ? isPathActive(item.path) : isParentActive(item.children))
                      ? 'bg-gray-100 text-black hover:bg-gray-200'
                      : 'text-gray-700 hover:bg-gray-50'
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
            {item.expandable && !sidebarCollapsed && (
              <Collapsible open={expandedSections[item.text]}>
                <CollapsibleContent>
                  <div className="pl-4">
                    {item.children?.map((child) => (
                      <div key={child.text} className="mb-1">
                        <button
                          className={`w-full min-h-[40px] rounded-md transition-colors duration-200 flex items-center justify-start px-4 py-2 ml-2 mr-1 ${
                            isPathActive(child.path)
                              ? 'bg-gray-100 text-black hover:bg-gray-200 border-l-2 border-black'
                              : 'text-gray-600 hover:bg-gray-50'
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
                </CollapsibleContent>
              </Collapsible>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  )

  return (
    <div className="flex">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-30 h-14">
        <div className="flex items-center justify-between h-full px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDrawerToggle}
            className="mr-2 sm:hidden"
          >
            <MenuIcon className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center justify-center flex-1">
            <span className="font-bold text-xl tracking-wider">
              {businessName}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="hidden md:block text-gray-500 text-sm">
              {lastSyncTime ? `Last synced: ${new Date(lastSyncTime).toLocaleString()}` : 'Never synced'}
            </span>
            
            <div 
              className={`flex items-center px-2 py-1 rounded bg-gray-100 cursor-pointer hover:bg-gray-200 transition-colors ${
                isOnline && syncStatus !== 'syncing' ? 'cursor-pointer' : 'cursor-default'
              }`}
              onClick={async () => {
                if (isOnline && syncStatus !== 'syncing') {
                  await forceSyncAll()
                }
              }}
            >
              <div
                className={`w-2 h-2 rounded-full mr-2 ${
                  isOnline 
                    ? (syncStatus === 'syncing' ? 'bg-orange-500 animate-pulse' : 'bg-green-500')
                    : 'bg-red-500'
                }`}
              />
              <span className="text-xs text-gray-600">
                {syncStatus === 'syncing' ? 'Syncing...' : isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
      </header>
      
      <nav>
        {/* Mobile drawer */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-64 p-0 bg-white border-r border-gray-200">
            {drawer}
          </SheetContent>
        </Sheet>

        {/* Desktop drawer */}
        <div className="hidden sm:block">
          <div 
            className={`fixed left-0 top-14 h-[calc(100vh-56px)] bg-white border-r border-gray-200 transition-all duration-300 z-10 ${
              sidebarCollapsed ? 'w-16 overflow-visible' : 'w-64 overflow-hidden'
            }`}
          >
            {drawer}
          </div>
        </div>
      </nav>
      
      {/* Main content area with responsive padding */}
      <main
        className="flex-1 bg-gray-50 transition-all duration-300 overflow-auto"
        style={{
          marginLeft: sidebarCollapsed ? 64 : 256,
          marginTop: '56px',
          height: 'calc(100vh - 56px)',
          width: sidebarCollapsed ? 'calc(100% - 64px)' : 'calc(100% - 256px)'
        }}
      >
        <div className="w-full h-full">
          {children}
        </div>
      </main>
    </div>
  )
}

export default Layout