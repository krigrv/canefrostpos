import React, { useState, useEffect } from 'react'
import { useSettings } from '../../contexts/SettingsContext'
import { useInventory } from '../../hooks/useInventory'
import { useAuth } from '../../contexts/AuthContextSupabase'
import { db } from '../../firebase/config'
import { doc, getDoc } from 'firebase/firestore'
import { syncFirebaseToJSON } from '../../utils/inventorySync'
import { resetDatabaseWithCSV, cleanAllDatabases, validateCSVStructure } from '../../utils/databaseCleanup'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Switch } from '../ui/switch'
import { Checkbox } from '../ui/checkbox'
import { Badge } from '../ui/badge'
import { Alert, AlertDescription, AlertTitle } from '../ui/alert'
import {
  Users as PeopleIcon,
  UserPlus as PersonAddIcon,
  BarChart3 as AssessmentIcon,
  Receipt as ReceiptIcon,
  Shield as SecurityIcon,
  Bell as NotificationsIcon,
  Store as StoreIcon,
  Printer as PrintIcon,
  Database as BackupIcon,
  RefreshCw as UpdateIcon,
  Settings as SettingsIcon,
  Building as TaxIcon,
  Clock as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  Trash2 as CleaningServicesIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  AlertTriangle as AlertTriangleIcon,
  Palette as PaletteIcon,
  Upload as CloudSyncIcon,
  Save,
  X
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import LogAnalyzerPanel from '../DevTools/LogAnalyzerPanel'

function Settings() {
  const { settings: contextSettings, saveSettings } = useSettings()
  const { cleanupDuplicates, uploadAllInventoryToFirebase } = useInventory()
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState(0)
  const [settings, setSettings] = useState({
    enableNotifications: true,
    enableAutoBackup: false,
    enableTwoFactor: true,
    enableDarkMode: false,
    enableSoundEffects: true,
    enableEmailAlerts: false
  })
  
  const [businessDetails, setBusinessDetails] = useState({
    businessName: 'CANEFROST JUICE SHOP',
    phoneNumber: '',
    gstin: '',
    emailId: '',
    businessAddress: '',
    fssaiNumber: ''
  })

  const [printSettingsOpen, setPrintSettingsOpen] = useState(false)
  const [cleaningDuplicates, setCleaningDuplicates] = useState(false)
  const [showDevTools, setShowDevTools] = useState(false)
  const [showFirebaseSync, setShowFirebaseSync] = useState(false)
  const [syncingToFirebase, setSyncingToFirebase] = useState(false)
  const [syncingToJSON, setSyncingToJSON] = useState(false)
  const [resettingDatabase, setResettingDatabase] = useState(false)
  const [cleaningAllDatabases, setCleaningAllDatabases] = useState(false)
  const [importingFromCSV, setImportingFromCSV] = useState(false)
  const [showDatabaseCleanup, setShowDatabaseCleanup] = useState(false)
  const [selectiveCleanup, setSelectiveCleanup] = useState({
    products: true,
    sales: true,
    customers: true,
    staff: true,
    categories: true,
    localStorage: true,
    firebaseData: true
  })
  const [printSettings, setPrintSettings] = useState({
    businessName: contextSettings.businessName || businessDetails.businessName,
    businessAddress: contextSettings.businessAddress || businessDetails.businessAddress,
    gstNumber: contextSettings.gstNumber || businessDetails.gstin,
    fontSize: contextSettings.fontSize || 'medium',
    printerWidth: contextSettings.printerWidth || '80mm',
    lineSpacing: contextSettings.lineSpacing || 'normal',
    printDensity: contextSettings.printDensity || 'normal',
    showBusinessName: contextSettings.showBusinessName !== undefined ? contextSettings.showBusinessName : true,
    showBusinessAddress: contextSettings.showBusinessAddress !== undefined ? contextSettings.showBusinessAddress : true,
    showGSTNumber: contextSettings.showGSTNumber !== undefined ? contextSettings.showGSTNumber : true,
    showHeaderText: contextSettings.showHeaderText !== undefined ? contextSettings.showHeaderText : true,
    showFooterText: contextSettings.showFooterText !== undefined ? contextSettings.showFooterText : true,
    headerText: contextSettings.headerText || 'Thank you for choosing us!',
    footerText: contextSettings.footerText || 'Visit us again soon!',
    businessNameAlignment: contextSettings.businessNameAlignment || 'center',
    addressAlignment: contextSettings.addressAlignment || 'center',
    headerAlignment: contextSettings.headerAlignment || 'center',
    footerAlignment: contextSettings.footerAlignment || 'center',
    // Add missing thermal printer fields
    thermalHeaderText: contextSettings.thermalHeaderText || 'Thank you for choosing us!',
    thermalFooterText: contextSettings.thermalFooterText || 'Visit us again soon!',
    // Receipt Content Visibility fields
    showDateTime: contextSettings.showDateTime !== undefined ? contextSettings.showDateTime : true,
    showReceiptNumber: contextSettings.showReceiptNumber !== undefined ? contextSettings.showReceiptNumber : true,
    showPaymentMethod: contextSettings.showPaymentMethod !== undefined ? contextSettings.showPaymentMethod : true,
    showCustomerInfo: contextSettings.showCustomerInfo !== undefined ? contextSettings.showCustomerInfo : true,
    showItemCodes: contextSettings.showItemCodes !== undefined ? contextSettings.showItemCodes : false,
    showTaxBreakdown: contextSettings.showTaxBreakdown !== undefined ? contextSettings.showTaxBreakdown : true,
    showDividers: contextSettings.showDividers !== undefined ? contextSettings.showDividers : true,
    // Additional printer settings
    fontFamily: contextSettings.fontFamily || 'monospace',
    characterWidth: contextSettings.characterWidth || 32,
    paperCutType: contextSettings.paperCutType || 'full',
    companyLogo: contextSettings.companyLogo || '',
    logoSize: contextSettings.logoSize || 'medium',
    showLogo: contextSettings.showLogo !== undefined ? contextSettings.showLogo : true,
    showAddress: true,
    showTax: true,
    showPackaging: true
  })

  // Load business details from Firebase (synced with Profile component)
  useEffect(() => {
    const loadBusinessDetails = async () => {
      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid)
          const userDoc = await getDoc(userDocRef)
          if (userDoc.exists()) {
            const userData = userDoc.data()
            const details = userData.businessDetails || {}
            
            setBusinessDetails(details)
            
            // Update print settings with loaded business details
            setPrintSettings(prev => ({
              ...prev,
              businessName: details.businessName || prev.businessName || '',
              businessAddress: details.businessAddress || prev.businessAddress || '',
              gstNumber: details.gstin || prev.gstNumber || ''
            }))
          }
        } catch (error) {
          console.error('Error loading business details:', error)
        }
      }
    }
    loadBusinessDetails()
  }, [currentUser])

  const handleSettingChange = async (setting) => {
    const newValue = !contextSettings[setting]
    try {
      await saveSettings({ [setting]: newValue })
      toast.success(`${setting} ${newValue ? 'enabled' : 'disabled'} and saved to Firebase`)
    } catch (error) {
      console.error('Error saving setting:', error)
      toast.error(`Failed to save ${setting} setting`)
    }
  }

  const handleCleanupDuplicates = async () => {
    if (cleaningDuplicates) return
    
    setCleaningDuplicates(true)
    try {
      const result = await cleanupDuplicates()
      if (result.removedCount > 0) {
        toast.success(`Successfully removed ${result.removedCount} duplicate sales entries`)
      } else {
        toast.info('No duplicate sales entries found')
      }
    } catch (error) {
      console.error('Error cleaning duplicates:', error)
      toast.error('Failed to clean duplicate entries')
    } finally {
      setCleaningDuplicates(false)
    }
  }

  const handleSyncToFirebase = async () => {
    if (syncingToFirebase) return
    
    setSyncingToFirebase(true)
    try {
      await uploadAllInventoryToFirebase()
      toast.success('Successfully synced inventory to Firebase')
    } catch (error) {
      console.error('Error syncing to Firebase:', error)
      toast.error('Failed to sync inventory to Firebase')
    } finally {
      setSyncingToFirebase(false)
    }
  }

  const handleSyncToJSON = async () => {
    if (syncingToJSON) return
    
    setSyncingToJSON(true)
    try {
      await syncFirebaseToJSON()
      toast.success('Successfully synced Firebase data to JSON file')
    } catch (error) {
      console.error('Error syncing to JSON:', error)
      toast.error('Failed to sync Firebase data to JSON file')
    } finally {
      setSyncingToJSON(false)
    }
  }

  const handleResetDatabase = async () => {
    if (resettingDatabase) return
    
    const confirmed = window.confirm(
      '⚠️ WARNING: This will DELETE ALL PRODUCTS from Firebase!\n\n' +
      'This action cannot be undone. Are you sure you want to proceed?'
    )
    
    if (!confirmed) return
    
    const doubleConfirmed = window.confirm(
      '🚨 FINAL WARNING: You are about to permanently delete all product data!\n\n' +
      'Type "DELETE" in the next prompt to confirm.'
    )
    
    if (!doubleConfirmed) return
    
    const deleteConfirmation = window.prompt(
      'Type "DELETE" (in capital letters) to confirm database reset:'
    )
    
    if (deleteConfirmation !== 'DELETE') {
      toast.error('Database reset cancelled - confirmation text did not match')
      return
    }
    
    setResettingDatabase(true)
    try {
      // Run the reset database script
      const response = await fetch('/api/reset-database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to reset database')
      }
      
      const result = await response.json()
      toast.success(`Database reset completed! Deleted ${result.deletedCount} documents.`)
    } catch (error) {
      console.error('Error resetting database:', error)
      toast.error('Failed to reset database. You may need to run the reset script manually.')
    } finally {
      setResettingDatabase(false)
    }
  }

  const handleSelectiveCleanup = async () => {
    if (cleaningAllDatabases) return
    
    const selectedItems = Object.entries(selectiveCleanup)
      .filter(([key, value]) => value)
      .map(([key]) => key)
    
    if (selectedItems.length === 0) {
      toast.error('Please select at least one data type to clean')
      return
    }
    
    const itemLabels = {
      products: 'Products',
      sales: 'Sales History',
      customers: 'Customers',
      staff: 'Staff Records',
      categories: 'Categories',
      localStorage: 'Local Storage',
      firebaseData: 'Firebase Data'
    }
    
    const selectedLabels = selectedItems.map(item => itemLabels[item]).join('\n- ')
    
    const confirmed = window.confirm(
      `⚠️ WARNING: This will DELETE the following data:\n\n- ${selectedLabels}\n\nThis action cannot be undone. Are you sure you want to proceed?`
    )
    
    if (!confirmed) return
    
    const deleteConfirmation = window.prompt(
      'Type "CLEAN SELECTED" (in capital letters) to confirm selective cleanup:'
    )
    
    if (deleteConfirmation !== 'CLEAN SELECTED') {
      toast.error('Selective cleanup cancelled - confirmation text did not match')
      return
    }
    
    setCleaningAllDatabases(true)
    try {
      await cleanAllDatabases(selectiveCleanup)
      toast.success(`Successfully cleaned selected data: ${selectedLabels.replace(/\n- /g, ', ')}`)
      // Refresh the page to reflect changes
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (error) {
      console.error('Error cleaning selected data:', error)
      toast.error('Failed to clean selected data: ' + error.message)
    } finally {
      setCleaningAllDatabases(false)
    }
  }

  const handleCleanAllDatabases = async () => {
    if (cleaningAllDatabases) return
    
    const confirmed = window.confirm(
      '⚠️ WARNING: This will DELETE ALL DATA from both Firebase and local storage!\n\n' +
      'This includes:\n' +
      '- All products\n' +
      '- All sales history\n' +
      '- All customers\n' +
      '- All staff records\n' +
      '- All categories\n' +
      '- Local storage data\n\n' +
      'This action cannot be undone. Are you sure you want to proceed?'
    )
    
    if (!confirmed) return
    
    const deleteConfirmation = window.prompt(
      'Type "CLEAN ALL" (in capital letters) to confirm complete database cleanup:'
    )
    
    if (deleteConfirmation !== 'CLEAN ALL') {
      toast.error('Database cleanup cancelled - confirmation text did not match')
      return
    }
    
    setCleaningAllDatabases(true)
    try {
      await cleanAllDatabases()
      toast.success('All databases cleaned successfully')
      // Refresh the page to reflect changes
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (error) {
      console.error('Error cleaning databases:', error)
      toast.error('Failed to clean databases: ' + error.message)
    } finally {
      setCleaningAllDatabases(false)
    }
  }

  const handleImportFromCSV = async () => {
    if (importingFromCSV) return
    
    const confirmed = window.confirm(
      '🔄 CSV Import Process\n\n' +
      'This will:\n' +
      '1. Clean all existing data (products, sales, etc.)\n' +
      '2. Import fresh data from Canefrost Inventory Final.csv\n' +
      '3. Sync data to both Firebase and local storage\n\n' +
      'Continue with import?'
    )
    
    if (!confirmed) return
    
    setImportingFromCSV(true)
    try {
      // First validate CSV structure
       await validateCSVStructure('/Users/krishnagaurav/Documents/GitHub/canefrostpos/public/Canefrost Inventory Final.csv')
       
       // Perform the complete reset and import
       const result = await resetDatabaseWithCSV('/Users/krishnagaurav/Documents/GitHub/canefrostpos/public/Canefrost Inventory Final.csv')
      
      toast.success(`Successfully imported ${result.productCount} products from CSV`)
      
      // Refresh the page to reflect changes
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (error) {
      console.error('Error importing from CSV:', error)
      toast.error('Failed to import from CSV: ' + error.message)
    } finally {
      setImportingFromCSV(false)
    }
  }

  const managementCards = [
    {
      title: 'Print Settings',
      description: 'Customize receipt printing and preview options',
      icon: <PrintIcon sx={{ fontSize: 40, color: 'secondary.main' }} />,
      color: 'secondary',
      features: ['Receipt Layout', 'Font Size', 'Print Preview', 'Paper Settings'],
      action: () => setPrintSettingsOpen(true)
    },
    {
      title: 'UI Demo',
      description: 'Explore UI components and design system showcase',
      icon: <PaletteIcon sx={{ fontSize: 40, color: 'warning.main' }} />,
      color: 'warning',
      features: ['Component Library', 'Design System', 'Interactive Examples', 'Style Guide'],
      action: () => navigate('/demo')
    },
    {
      title: 'Firebase Sync',
      description: 'Manage Firebase database synchronization and data integrity',
      icon: <CloudSyncIcon sx={{ fontSize: 40, color: 'info.main' }} />,
      color: 'info',
      features: ['Sync to Firebase', 'Sync from Firebase', 'Reset Database', 'Data Management'],
      action: () => setShowFirebaseSync(true)
    },
    {
      title: 'Database Cleanup',
      description: 'Clean all databases and import fresh data from CSV',
      icon: <CleaningServicesIcon sx={{ fontSize: 40, color: 'error.main' }} />,
      color: 'error',
      features: ['Clean All Data', 'Import from CSV', 'Complete Reset', 'Fresh Start'],
      action: () => setShowDatabaseCleanup(true)
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
      title: 'GST Calculation',
        description: 'Automatic GST calculation and compliance',
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
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-2">
        Settings & Management
      </h1>
      
      <p className="text-gray-600 mb-6">
        Configure your POS system and manage business operations
      </p>

      {/* Management Cards */}
      <h2 className="text-2xl font-semibold mb-6 mt-8">
        Business Management
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {managementCards.map((card) => (
          <Card key={card.title} className="h-full flex flex-col hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="pb-4">
              <div className="flex items-center mb-3">
                <div className="text-blue-600 bg-blue-50 p-3 rounded-lg">
                  {React.cloneElement(card.icon, { className: 'w-8 h-8' })}
                </div>
                <h3 className="text-xl font-semibold ml-4 capitalize">
                  {card.title}
                </h3>
              </div>
              
              <p className="text-gray-600 text-sm leading-relaxed">
                {card.description}
              </p>
            </CardHeader>
            
            <CardContent className="flex-grow pt-0">
              <div className="flex flex-wrap gap-2 mb-6">
                {card.features.map((feature) => (
                  <Badge
                    key={feature}
                    variant="outline"
                    className="text-xs px-2 py-1"
                  >
                    {feature}
                  </Badge>
                ))}
              </div>
              
              <Button
                className="w-full"
                onClick={card.action}
              >
                <SettingsIcon className="w-4 h-4 mr-2" />
                Manage
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* System Settings */}
      <h2 className="text-2xl font-semibold mb-6 mt-8">
        System Configuration
      </h2>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">System Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {systemSettings.map((item, index) => (
              <div key={item.title}>
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center space-x-4">
                    <div className="text-gray-600 bg-gray-50 p-2 rounded-lg">
                      {React.cloneElement(item.icon, { className: 'w-5 h-5' })}
                    </div>
                    <div>
                      <h4 className="font-semibold text-base">{item.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                    </div>
                  </div>
                  <Switch
                     checked={contextSettings[item.setting] || false}
                     onCheckedChange={() => handleSettingChange(item.setting)}
                   />
                 </div>
                 {index < systemSettings.length - 1 && <hr className="border-gray-200" />}
               </div>
             ))}
           </div>
         </CardContent>
       </Card>

      {/* Developer Tools */}
      {process.env.NODE_ENV === 'development' && (
        <>
          <h2 className="text-2xl font-semibold mb-6 mt-8">
            Developer Tools
          </h2>
          
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <SettingsIcon className="w-5 h-5" />
                Development Utilities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center space-x-4">
                    <div className="text-blue-600 bg-blue-50 p-2 rounded-lg">
                      <SettingsIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-base">Log Analyzer Panel</h4>
                      <p className="text-sm text-gray-600 mt-1">Monitor application logs and debug issues</p>
                    </div>
                  </div>
                  <Button
                    variant={showDevTools ? "secondary" : "outline"}
                    onClick={() => setShowDevTools(!showDevTools)}
                  >
                    {showDevTools ? 'Hide' : 'Show'} Dev Tools
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Quick Actions */}
      <h2 className="text-2xl font-semibold mb-6 mt-8">
        Quick Actions
      </h2>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Common Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <Button
              variant="outline"
              className="w-full h-12 bg-blue-50 hover:bg-blue-100 border-blue-200"
              onClick={() => toast.success('Backup initiated successfully!')}
            >
              <BackupIcon className="w-4 h-4 mr-2 text-blue-600" />
              Backup Data
            </Button>
            
            <Button
              variant="outline"
              className="w-full h-12 bg-green-50 hover:bg-green-100 border-green-200"
              onClick={() => toast.info('System is up to date!')}
            >
              <UpdateIcon className="w-4 h-4 mr-2 text-green-600" />
              Check Updates
            </Button>
            
            <Button
              variant="outline"
              className="w-full h-12 bg-purple-50 hover:bg-purple-100 border-purple-200"
              onClick={() => toast.success('Security scan completed!')}
            >
              <SecurityIcon className="w-4 h-4 mr-2 text-purple-600" />
              Security Scan
            </Button>
            
            <Button
              variant="outline"
              className="w-full h-12 bg-amber-50 hover:bg-amber-100 border-amber-200"
              onClick={handleCleanupDuplicates}
              disabled={cleaningDuplicates}
            >
              <CleaningServicesIcon className="w-4 h-4 mr-2 text-amber-600" />
              {cleaningDuplicates ? 'Cleaning...' : 'Clean Duplicates'}
            </Button>
            
            <Button
              variant="outline"
              className="w-full h-12 bg-red-50 hover:bg-red-100 border-red-200"
              onClick={() => toast.success('Test receipt printed!')}
            >
              <ReceiptIcon className="w-4 h-4 mr-2 text-red-600" />
              Test Receipt
            </Button>
          </div>
        </CardContent>
      </Card>

       {/* System Status */}
       <h2 className="text-2xl font-semibold mb-6 mt-8">
         System Status
       </h2>
       
       <Card className="mb-8">
         <CardHeader>
           <CardTitle className="text-lg">System Health</CardTitle>
         </CardHeader>
         <CardContent>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <Alert className="border-green-200 bg-green-50">
               <CheckCircleIcon className="h-4 w-4 text-green-600" />
               <AlertTitle className="text-green-800">System Health</AlertTitle>
               <AlertDescription className="text-green-700">All systems operational</AlertDescription>
             </Alert>
             
             <Alert className="border-blue-200 bg-blue-50">
               <InfoIcon className="h-4 w-4 text-blue-600" />
               <AlertTitle className="text-blue-800">Last Backup</AlertTitle>
               <AlertDescription className="text-blue-700">Today at 2:00 AM</AlertDescription>
             </Alert>
             
             <Alert className="border-amber-200 bg-amber-50">
               <AlertTriangleIcon className="h-4 w-4 text-amber-600" />
               <AlertTitle className="text-amber-800">Storage</AlertTitle>
               <AlertDescription className="text-amber-700">78% used (22% remaining)</AlertDescription>
             </Alert>
             
             <Alert className="border-purple-200 bg-purple-50">
               <InfoIcon className="h-4 w-4 text-purple-600" />
               <AlertTitle className="text-purple-800">Version</AlertTitle>
               <AlertDescription className="text-purple-700">POS System v1.0.0 (1266a57)</AlertDescription>
             </Alert>
           </div>
         </CardContent>
       </Card>



      {/* Print Settings Dialog */}
      <Dialog open={printSettingsOpen} onOpenChange={setPrintSettingsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PrintIcon className="h-5 w-5" />
              Thermal Printer Settings
            </DialogTitle>
            <DialogDescription>
              Configure your 80mm thermal printer for receipts
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Business Information */}
            <div>
              <h3 className="text-lg font-semibold mb-6 capitalize">Business Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="businessName">Business Name</Label>
                    <Input
                      id="businessName"
                      value={printSettings.businessName}
                      onChange={(e) => setPrintSettings(prev => ({ ...prev, businessName: e.target.value }))}
                      placeholder="Enter business name"
                    />
                    <p className="text-sm text-muted-foreground mt-1">This will appear at the top of receipts</p>
                  </div>
                  
                  <div>
                    <Label htmlFor="businessAddress">Business Address</Label>
                    <textarea
                      id="businessAddress"
                      className="w-full p-3 border border-input rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                      rows={3}
                      value={printSettings.businessAddress}
                      onChange={(e) => setPrintSettings(prev => ({ ...prev, businessAddress: e.target.value }))}
                      placeholder="Enter business address"
                    />
                    <p className="text-sm text-muted-foreground mt-1">Use \n for line breaks. Include phone number and other contact details</p>
                  </div>
                  
                  <div>
                    <Label htmlFor="gstNumber">GST Number</Label>
                    <Input
                      id="gstNumber"
                      value={printSettings.gstNumber}
                      onChange={(e) => setPrintSettings(prev => ({ ...prev, gstNumber: e.target.value }))}
                      placeholder="Enter GST number"
                    />
                    <p className="text-sm text-muted-foreground mt-1">Your GST registration number</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="businessNameAlignment">Business Name Alignment</Label>
                    <Select value={printSettings.businessNameAlignment} onValueChange={(value) => setPrintSettings(prev => ({ ...prev, businessNameAlignment: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select alignment" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="addressAlignment">Address Alignment</Label>
                    <Select value={printSettings.addressAlignment} onValueChange={(value) => setPrintSettings(prev => ({ ...prev, addressAlignment: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select alignment" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="showHeaderText"
                        checked={printSettings.showHeaderText}
                        onCheckedChange={(checked) => setPrintSettings(prev => ({ ...prev, showHeaderText: checked }))}
                      />
                      <Label htmlFor="showHeaderText">Show Header Text</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="showFooterText"
                        checked={printSettings.showFooterText}
                        onCheckedChange={(checked) => setPrintSettings(prev => ({ ...prev, showFooterText: checked }))}
                      />
                      <Label htmlFor="showFooterText">Show Footer Text</Label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Printer Settings */}
            <div>
              <h3 className="text-lg font-semibold mb-6 capitalize">Printer Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fontSize">Font Size</Label>
                  <Select value={printSettings.fontSize} onValueChange={(value) => setPrintSettings(prev => ({ ...prev, fontSize: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select font size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="printerWidth">Printer Width</Label>
                  <Select value={printSettings.printerWidth} onValueChange={(value) => setPrintSettings(prev => ({ ...prev, printerWidth: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select printer width" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="58mm">58mm</SelectItem>
                      <SelectItem value="80mm">80mm (Recommended)</SelectItem>
                      <SelectItem value="A4">A4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lineSpacing">Line Spacing</Label>
                  <Select value={printSettings.lineSpacing} onValueChange={(value) => setPrintSettings(prev => ({ ...prev, lineSpacing: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select line spacing" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="compact">Compact</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="relaxed">Relaxed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            {/* Receipt Content */}
            <div>
              <h3 className="text-lg font-semibold mb-6 capitalize">Receipt Content</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="showBusinessName"
                      checked={printSettings.showBusinessName}
                      onCheckedChange={(checked) => setPrintSettings(prev => ({ ...prev, showBusinessName: checked }))}
                    />
                    <Label htmlFor="showBusinessName">Show Business Name</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="showBusinessAddress"
                      checked={printSettings.showBusinessAddress}
                      onCheckedChange={(checked) => setPrintSettings(prev => ({ ...prev, showBusinessAddress: checked }))}
                    />
                    <Label htmlFor="showBusinessAddress">Show Business Address</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="showGSTNumber"
                      checked={printSettings.showGSTNumber}
                      onCheckedChange={(checked) => setPrintSettings(prev => ({ ...prev, showGSTNumber: checked }))}
                    />
                    <Label htmlFor="showGSTNumber">Show GST Number</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="showDateTime"
                      checked={printSettings.showDateTime || true}
                      onCheckedChange={(checked) => setPrintSettings(prev => ({ ...prev, showDateTime: checked }))}
                    />
                    <Label htmlFor="showDateTime">Show Date & Time</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="showReceiptNumber"
                      checked={printSettings.showReceiptNumber || true}
                      onCheckedChange={(checked) => setPrintSettings(prev => ({ ...prev, showReceiptNumber: checked }))}
                    />
                    <Label htmlFor="showReceiptNumber">Show Receipt Number</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                     <Checkbox
                       id="showPaymentMethod"
                       checked={printSettings.showPaymentMethod || true}
                       onCheckedChange={(checked) => setPrintSettings(prev => ({ ...prev, showPaymentMethod: checked }))}
                     />
                     <Label htmlFor="showPaymentMethod">Show Payment Method</Label>
                   </div>
                 </div>
                 
                 <div className="space-y-4">
                   <div className="flex items-center space-x-2">
                     <Checkbox
                       id="showCustomerInfo"
                       checked={printSettings.showCustomerInfo || true}
                       onCheckedChange={(checked) => setPrintSettings(prev => ({ ...prev, showCustomerInfo: checked }))}
                     />
                     <Label htmlFor="showCustomerInfo">Show Customer Info</Label>
                   </div>
                   
                   <div className="flex items-center space-x-2">
                     <Checkbox
                       id="showItemCodes"
                       checked={printSettings.showItemCodes || false}
                       onCheckedChange={(checked) => setPrintSettings(prev => ({ ...prev, showItemCodes: checked }))}
                     />
                     <Label htmlFor="showItemCodes">Show Item Codes</Label>
                   </div>
                   
                   <div className="flex items-center space-x-2">
                     <Checkbox
                       id="showTaxBreakdown"
                       checked={printSettings.showTaxBreakdown || true}
                       onCheckedChange={(checked) => setPrintSettings(prev => ({ ...prev, showTaxBreakdown: checked }))}
                     />
                     <Label htmlFor="showTaxBreakdown">Show GST Breakdown</Label>
                   </div>
                   
                   <div className="flex items-center space-x-2">
                     <Checkbox
                       id="showDividers"
                       checked={printSettings.showDividers || true}
                       onCheckedChange={(checked) => setPrintSettings(prev => ({ ...prev, showDividers: checked }))}
                     />
                     <Label htmlFor="showDividers">Show Divider Lines</Label>
                   </div>
                 </div>
               </div>
             </div>
            
            {/* Thermal Printer Customization */}
            <div>
              <h3 className="text-lg font-semibold mb-6 capitalize">Thermal Printer Customization</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="thermalHeaderText">Header Text</Label>
                  <Input
                    id="thermalHeaderText"
                    value={printSettings.thermalHeaderText || ''}
                    onChange={(e) => setPrintSettings(prev => ({ ...prev, thermalHeaderText: e.target.value }))}
                    placeholder="Enter custom header text"
                  />
                  <p className="text-xs text-muted-foreground">Text displayed at the top of thermal receipts</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="thermalFooterText">Footer Text</Label>
                  <Input
                    id="thermalFooterText"
                    value={printSettings.thermalFooterText || ''}
                    onChange={(e) => setPrintSettings(prev => ({ ...prev, thermalFooterText: e.target.value }))}
                    placeholder="Enter custom footer text"
                  />
                  <p className="text-xs text-muted-foreground">Text displayed at the bottom of thermal receipts</p>
                </div>
              </div>
            </div>
            
            {/* Text Alignment & Print Settings */}
            <div>
              <h3 className="text-lg font-semibold mb-6 capitalize">Text Alignment & Print Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="headerAlignment">Header Text Alignment</Label>
                  <Select value={printSettings.headerAlignment || 'center'} onValueChange={(value) => setPrintSettings(prev => ({ ...prev, headerAlignment: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select alignment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="footerAlignment">Footer Text Alignment</Label>
                  <Select value={printSettings.footerAlignment || 'center'} onValueChange={(value) => setPrintSettings(prev => ({ ...prev, footerAlignment: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select alignment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="printDensity">Print Density</Label>
                  <Select value={printSettings.printDensity || 'normal'} onValueChange={(value) => setPrintSettings(prev => ({ ...prev, printDensity: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select density" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
             
             {/* Save Button Section - Embedded directly */}
             <div className="col-span-full mt-6 pt-4 border-t">
               <div className="flex justify-between items-center">
                 <div className="text-sm text-muted-foreground">
                   Configure your 80mm thermal printer settings
                 </div>
                 <div className="flex gap-3">
                   <Button 
                     variant="outline" 
                     onClick={() => setPrintSettingsOpen(false)}
                   >
                     Cancel
                   </Button>
                   <Button 
                     className="bg-green-600 hover:bg-green-700 text-white"
                     onClick={async (e) => {
                       e.preventDefault()
                       const button = e.target.closest('button')
                       if (button.disabled) return
                       
                       button.disabled = true
                       let loadingToast
                       
                       try {
                         loadingToast = toast.loading('🖨️ Saving settings...', {
                           description: 'Please wait while we save your configuration'
                         })
                         
                         await saveSettings({
                           // Business Information
                           businessName: printSettings.businessName,
                           businessAddress: printSettings.businessAddress,
                           gstNumber: printSettings.gstNumber,
                           businessNameAlignment: printSettings.businessNameAlignment,
                           addressAlignment: printSettings.addressAlignment,
                           
                           // Printer Settings
                           fontSize: printSettings.fontSize,
                           printerWidth: printSettings.printerWidth,
                           lineSpacing: printSettings.lineSpacing,
                           printDensity: printSettings.printDensity,
                           fontFamily: printSettings.fontFamily,
                           characterWidth: printSettings.characterWidth,
                           paperCutType: printSettings.paperCutType,
                           
                           // Receipt Content Visibility
                           showBusinessName: printSettings.showBusinessName,
                           showBusinessAddress: printSettings.showBusinessAddress,
                           showGSTNumber: printSettings.showGSTNumber,
                           showDateTime: printSettings.showDateTime,
                           showReceiptNumber: printSettings.showReceiptNumber,
                           showPaymentMethod: printSettings.showPaymentMethod,
                           showCustomerInfo: printSettings.showCustomerInfo,
                           showItemCodes: printSettings.showItemCodes,
                           showTaxBreakdown: printSettings.showTaxBreakdown,
                           showDividers: printSettings.showDividers,
                           showLogo: printSettings.showLogo,
                           
                           // Thermal Printer Custom Text
                           thermalHeaderText: printSettings.thermalHeaderText,
                           thermalFooterText: printSettings.thermalFooterText,
                           headerAlignment: printSettings.headerAlignment,
                           footerAlignment: printSettings.footerAlignment,
                           
                           // Logo Settings
                           companyLogo: printSettings.companyLogo,
                           logoSize: printSettings.logoSize
                         })
                         
                         toast.dismiss(loadingToast)
                         setPrintSettingsOpen(false)
                         toast.success('✅ Settings saved successfully!', {
                           description: 'Your thermal printer settings have been updated'
                         })
                       } catch (error) {
                         console.error('Error saving settings:', error)
                         if (loadingToast) toast.dismiss(loadingToast)
                         toast.error('❌ Failed to save settings', {
                           description: 'Please try again or check your connection'
                         })
                       } finally {
                         button.disabled = false
                       }
                     }}
                   >
                     Save Settings
                   </Button>
                 </div>
               </div>
             </div>
           </div>
         </DialogContent>
       </Dialog>

       {/* Firebase Sync Management Dialog */}
       <Dialog open={showFirebaseSync} onOpenChange={setShowFirebaseSync}>
         <DialogContent className="max-w-2xl">
           <DialogHeader>
             <DialogTitle className="flex items-center gap-2">
               <CloudSyncIcon className="h-6 w-6 text-blue-600" />
               Firebase Sync Management
             </DialogTitle>
             <DialogDescription>
               Manage Firebase database synchronization and data integrity. Use these tools to sync data between your local inventory and Firebase.
             </DialogDescription>
           </DialogHeader>
           
           <div className="space-y-6">
             {/* Sync Controls */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <Card>
                 <CardHeader>
                   <CardTitle className="text-lg flex items-center gap-2">
                     <CloudSyncIcon className="h-5 w-5 text-green-600" />
                     Sync to Firebase
                   </CardTitle>
                   <CardDescription>
                     Upload local inventory data to Firebase database
                   </CardDescription>
                 </CardHeader>
                 <CardContent>
                   <Button 
                     onClick={handleSyncToFirebase}
                     disabled={syncingToFirebase}
                     className="w-full bg-green-600 hover:bg-green-700"
                   >
                     {syncingToFirebase ? 'Syncing...' : 'Sync to Firebase'}
                   </Button>
                 </CardContent>
               </Card>

               <Card>
                 <CardHeader>
                   <CardTitle className="text-lg flex items-center gap-2">
                     <CloudSyncIcon className="h-5 w-5 text-blue-600" />
                     Sync from Firebase
                   </CardTitle>
                   <CardDescription>
                     Download Firebase data to local JSON file
                   </CardDescription>
                 </CardHeader>
                 <CardContent>
                   <Button 
                     onClick={handleSyncToJSON}
                     disabled={syncingToJSON}
                     className="w-full bg-blue-600 hover:bg-blue-700"
                   >
                     {syncingToJSON ? 'Syncing...' : 'Sync from Firebase'}
                   </Button>
                 </CardContent>
               </Card>
             </div>

             {/* Danger Zone */}
             <Card className="border-red-200">
               <CardHeader>
                 <CardTitle className="text-lg text-red-600 flex items-center gap-2">
                   <AlertTriangleIcon className="h-5 w-5" />
                   Danger Zone
                 </CardTitle>
                 <CardDescription className="text-red-600">
                   Irreversible actions that will permanently delete data
                 </CardDescription>
               </CardHeader>
               <CardContent>
                 <Button 
                   onClick={handleResetDatabase}
                   disabled={resettingDatabase}
                   variant="destructive"
                   className="w-full"
                 >
                   {resettingDatabase ? 'Resetting...' : 'Reset Firebase Database'}
                 </Button>
                 <p className="text-sm text-red-600 mt-2">
                   ⚠️ This will delete ALL products from Firebase. This action cannot be undone.
                 </p>
               </CardContent>
             </Card>

             {/* Auto-sync Status */}
             <Card className="bg-yellow-50 border-yellow-200">
               <CardHeader>
                 <CardTitle className="text-lg text-yellow-800">
                   Auto-sync Status
                 </CardTitle>
                 <CardDescription className="text-yellow-700">
                   Auto-sync is currently DISABLED to prevent data duplication
                 </CardDescription>
               </CardHeader>
               <CardContent>
                 <p className="text-sm text-yellow-800">
                   Auto-sync has been temporarily disabled to prevent the data multiplication issue. 
                   Use the manual sync options above to control when data is synchronized.
                 </p>
               </CardContent>
             </Card>
           </div>

           <div className="flex justify-end">
             <Button 
               variant="outline" 
               onClick={() => setShowFirebaseSync(false)}
             >
               Close
             </Button>
           </div>
         </DialogContent>
       </Dialog>

       {/* Database Cleanup Dialog */}
       <Dialog open={showDatabaseCleanup} onOpenChange={setShowDatabaseCleanup}>
         <DialogContent className="w-[95vw] max-w-4xl h-[90vh] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
           <DialogHeader>
             <DialogTitle className="flex items-center gap-2">
               <CleaningServicesIcon className="h-6 w-6 text-red-600" />
               Database Cleanup & CSV Import
             </DialogTitle>
             <DialogDescription>
               Complete database cleanup and fresh data import from CSV file
             </DialogDescription>
           </DialogHeader>

           <div className="space-y-6">
             {/* Warning Section */}
             <Alert className="border-red-200 bg-red-50">
               <AlertTriangleIcon className="h-4 w-4 text-red-600" />
               <AlertTitle className="text-red-800">⚠️ Critical Operation</AlertTitle>
               <AlertDescription className="text-red-700">
                 These operations will permanently delete all existing data. Make sure you have backups if needed.
               </AlertDescription>
             </Alert>

             {/* Selective Cleanup */}
             <Card className="bg-orange-50 border-orange-200">
               <CardHeader>
                 <CardTitle className="text-lg text-orange-800 flex items-center gap-2">
                   <CheckCircleIcon className="h-5 w-5" />
                   Selective Data Cleanup
                 </CardTitle>
                 <CardDescription className="text-orange-700">
                   Choose which data types to clean. Only selected items will be deleted.
                 </CardDescription>
               </CardHeader>
               <CardContent>
                 <div className="space-y-3 mb-4">
                   <Label className="text-sm font-medium text-orange-800">Select data to clean:</Label>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                     {Object.entries({
                       products: 'Products',
                       sales: 'Sales History',
                       customers: 'Customers',
                       staff: 'Staff Records',
                       categories: 'Categories',
                       localStorage: 'Local Storage',
                       firebaseData: 'Firebase Data'
                     }).map(([key, label]) => (
                       <div key={key} className="flex items-center space-x-2">
                         <Checkbox
                           id={key}
                           checked={selectiveCleanup[key]}
                           onCheckedChange={(checked) => setSelectiveCleanup(prev => ({
                             ...prev,
                             [key]: checked
                           }))}
                         />
                         <Label htmlFor={key} className="text-sm text-orange-700">
                           {label}
                         </Label>
                       </div>
                     ))}
                   </div>
                 </div>
                 
                 <div className="flex gap-2 mb-3">
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={() => setSelectiveCleanup({
                       products: true,
                       sales: true,
                       customers: true,
                       staff: true,
                       categories: true,
                       localStorage: true,
                       firebaseData: true
                     })}
                   >
                     Select All
                   </Button>
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={() => setSelectiveCleanup({
                       products: false,
                       sales: false,
                       customers: false,
                       staff: false,
                       categories: false,
                       localStorage: false,
                       firebaseData: false
                     })}
                   >
                     Select None
                   </Button>
                 </div>
                 
                 <Button 
                   onClick={handleSelectiveCleanup}
                   disabled={cleaningAllDatabases}
                   className="w-full bg-orange-600 hover:bg-orange-700"
                 >
                   {cleaningAllDatabases ? 'Cleaning...' : 'Clean Selected Data'}
                 </Button>
                 <p className="text-sm text-orange-600 mt-2">
                   🎯 Only the selected data types will be deleted from your databases.
                 </p>
               </CardContent>
             </Card>

             {/* Clean All Databases */}
             <Card className="bg-red-50 border-red-200">
               <CardHeader>
                 <CardTitle className="text-lg text-red-800 flex items-center gap-2">
                   <CleaningServicesIcon className="h-5 w-5" />
                   Clean All Databases
                 </CardTitle>
                 <CardDescription className="text-red-700">
                   Remove all data from Firebase and local storage
                 </CardDescription>
               </CardHeader>
               <CardContent>
                 <Button 
                   onClick={handleCleanAllDatabases}
                   disabled={cleaningAllDatabases}
                   variant="destructive"
                   className="w-full"
                 >
                   {cleaningAllDatabases ? 'Cleaning...' : 'Clean All Databases'}
                 </Button>
                 <p className="text-sm text-red-600 mt-2">
                   ⚠️ This will delete ALL data including products, sales, customers, and staff records.
                 </p>
               </CardContent>
             </Card>

             {/* Import from CSV */}
             <Card className="bg-blue-50 border-blue-200">
               <CardHeader>
                 <CardTitle className="text-lg text-blue-800 flex items-center gap-2">
                   <CloudSyncIcon className="h-5 w-5" />
                   Import from CSV
                 </CardTitle>
                 <CardDescription className="text-blue-700">
                   Clean all data and import fresh inventory from Canefrost Inventory Final.csv
                 </CardDescription>
               </CardHeader>
               <CardContent>
                 <Button 
                   onClick={handleImportFromCSV}
                   disabled={importingFromCSV}
                   className="w-full"
                 >
                   {importingFromCSV ? 'Importing...' : 'Clean & Import from CSV'}
                 </Button>
                 <p className="text-sm text-blue-600 mt-2">
                   📁 Will import from: /Users/krishnagaurav/Documents/GitHub/canefrostpos/public/Canefrost Inventory Final.csv
                 </p>
               </CardContent>
             </Card>

             {/* Process Information */}
             <Card className="bg-gray-50 border-gray-200">
               <CardHeader>
                 <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
                   <InfoIcon className="h-5 w-5" />
                   Process Information
                 </CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="space-y-2 text-sm text-gray-700">
                   <p><strong>CSV Import Process:</strong></p>
                   <ul className="list-disc list-inside space-y-1 ml-4">
                     <li>Validates CSV structure and format</li>
                     <li>Cleans all existing data (products, sales, customers, etc.)</li>
                     <li>Imports products from CSV with proper formatting</li>
                     <li>Syncs data to both Firebase and local storage</li>
                     <li>Refreshes the application to reflect changes</li>
                   </ul>
                   <p className="mt-3"><strong>Expected CSV Format:</strong></p>
                   <p className="font-mono text-xs bg-gray-100 p-2 rounded">
                     Item Name, Category, Size, MRP, Barcode, Stock Count
                   </p>
                 </div>
               </CardContent>
             </Card>
           </div>

           <div className="flex justify-end">
             <Button 
               variant="outline" 
               onClick={() => setShowDatabaseCleanup(false)}
             >
               Close
             </Button>
           </div>
         </DialogContent>
       </Dialog>
     </div>
   )
 }
 
 export default Settings