import React, { useState, useEffect } from 'react'
import { useSettings } from '../../contexts/SettingsContext'
import { useInventory } from '../../hooks/useInventory'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog'
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
  Save,
  X
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

function Settings() {
  const { settings: contextSettings, saveSettings } = useSettings()
  const { cleanupDuplicates } = useInventory()
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

  const [printSettingsOpen, setPrintSettingsOpen] = useState(false)
  const [cleaningDuplicates, setCleaningDuplicates] = useState(false)
  const [printSettings, setPrintSettings] = useState({
    businessName: contextSettings.businessName || 'CANEFROST JUICE SHOP',
    businessAddress: contextSettings.businessAddress || 'Fresh Juices & Beverages\nPhone: +91 9876543210',
    gstNumber: contextSettings.gstNumber || '29XXXXX1234X1ZX',
    fontSize: contextSettings.fontSize || 'medium',
    printerWidth: contextSettings.printerWidth || '80mm',
    lineSpacing: contextSettings.lineSpacing || 'normal',
    showBusinessName: contextSettings.showBusinessName !== undefined ? contextSettings.showBusinessName : true,
    showBusinessAddress: contextSettings.showBusinessAddress !== undefined ? contextSettings.showBusinessAddress : true,
    showGSTNumber: contextSettings.showGSTNumber !== undefined ? contextSettings.showGSTNumber : true,
    showLogo: true,
    showAddress: true,
    showTax: true,
    showPackaging: true
  })

  const handleSettingChange = (setting) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }))
    toast.success(`${setting} ${!settings[setting] ? 'enabled' : 'disabled'}`)
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
      description: 'Sales reports, peak hours analysis, GST filing assistance',
      icon: <AssessmentIcon sx={{ fontSize: 40, color: 'info.main' }} />,
      features: ['Sales Reports', 'Peak Hours', 'Popular Items', 'GST & Audit'],
      action: () => navigate('/reports'),
      color: 'info'
    },
    {
      title: 'Print Settings',
      description: 'Customize receipt printing and preview options',
      icon: <PrintIcon sx={{ fontSize: 40, color: 'secondary.main' }} />,
      color: 'secondary',
      features: ['Receipt Layout', 'Font Size', 'Print Preview', 'Paper Settings'],
      action: () => setPrintSettingsOpen(true)
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
      <h2 className="text-2xl font-semibold mb-4 mt-8">
        Business Management
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {managementCards.map((card) => (
          <Card key={card.title} className="h-full flex flex-col">
            <CardContent className="flex-grow">
              <div className="flex items-center mb-4">
                <div className="text-blue-600">
                  {React.cloneElement(card.icon, { className: 'w-10 h-10' })}
                </div>
                <h3 className="text-lg font-semibold ml-3 capitalize">
                  {card.title}
                </h3>
              </div>
              
              <p className="text-gray-600 mb-4 capitalize">
                {card.description}
              </p>
              
              <div className="space-y-2">
                {card.features.map((feature) => (
                    <Badge
                      key={feature}
                      variant="outline"
                      className="mr-1 mb-1 text-xs capitalize"
                    >
                      {feature}
                    </Badge>
                  ))}
                </div>
              </CardContent>
              
              <div className="p-6 pt-0">
                <Button
                  className="w-full capitalize"
                  onClick={card.action}
                >
                  <SettingsIcon className="w-4 h-4 mr-2" />
                  Manage
                </Button>
              </div>
            </Card>
        ))}
      </div>

      {/* System Settings */}
      <h2 className="text-2xl font-semibold mb-4 mt-8">
        System Configuration
      </h2>
      
      <Card>
        <CardContent>
          <div className="space-y-4">
            {systemSettings.map((item, index) => (
              <div key={item.title}>
                <div className="flex items-center justify-between py-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-gray-600">
                      {React.cloneElement(item.icon, { className: 'w-5 h-5' })}
                    </div>
                    <div>
                      <h4 className="font-medium">{item.title}</h4>
                      <p className="text-sm text-gray-600">{item.description}</p>
                    </div>
                  </div>
                  <Switch
                     checked={settings[item.setting]}
                     onCheckedChange={() => handleSettingChange(item.setting)}
                   />
                 </div>
                 {index < systemSettings.length - 1 && <hr className="my-4" />}
               </div>
             ))}
           </div>
         </CardContent>
       </Card>

      {/* Quick Actions */}
      <h2 className="text-2xl font-semibold mb-4 mt-8">
        Quick Actions
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => toast.success('Backup initiated successfully!')}
        >
          <BackupIcon className="w-4 h-4 mr-2" />
          Backup Data
        </Button>
        
        <Button
          variant="outline"
          className="w-full"
          onClick={() => toast.info('System is up to date!')}
        >
          <UpdateIcon className="w-4 h-4 mr-2" />
          Check Updates
        </Button>
        
        <Button
          variant="outline"
          className="w-full"
          onClick={() => toast.success('Security scan completed!')}
        >
          <SecurityIcon className="w-4 h-4 mr-2" />
          Security Scan
        </Button>
        
        <Button
           variant="outline"
           className="w-full"
           onClick={handleCleanupDuplicates}
           disabled={cleaningDuplicates}
         >
           <CleaningServicesIcon className="w-4 h-4 mr-2" />
           {cleaningDuplicates ? 'Cleaning...' : 'Clean Duplicates'}
         </Button>
         
         <Button
           variant="outline"
           className="w-full"
           onClick={() => toast.success('Test receipt printed!')}
         >
           <ReceiptIcon className="w-4 h-4 mr-2" />
           Test Receipt
         </Button>
       </div>

       {/* System Status */}
       <h2 className="text-2xl font-semibold mb-4 mt-8">
         System Status
       </h2>
       
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <Alert className="border-green-200 bg-green-50">
           <CheckCircleIcon className="h-4 w-4" />
           <AlertTitle>System Health</AlertTitle>
           <AlertDescription>All systems operational</AlertDescription>
         </Alert>
         
         <Alert className="border-blue-200 bg-blue-50">
           <InfoIcon className="h-4 w-4" />
           <AlertTitle>Last Backup</AlertTitle>
           <AlertDescription>Today at 2:00 AM</AlertDescription>
         </Alert>
         
         <Alert className="border-yellow-200 bg-yellow-50">
           <AlertTriangleIcon className="h-4 w-4" />
           <AlertTitle>Storage</AlertTitle>
           <AlertDescription>78% used (22% remaining)</AlertDescription>
         </Alert>
         
         <Alert className="border-blue-200 bg-blue-50">
           <InfoIcon className="h-4 w-4" />
           <AlertTitle>Version</AlertTitle>
           <AlertDescription>POS System v2.1.0</AlertDescription>
         </Alert>
       </div>

      {/* Print Settings Dialog */}
      <Dialog open={printSettingsOpen} onOpenChange={setPrintSettingsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="capitalize">Print Settings - 80mm Thermal Printer</DialogTitle>
            <DialogDescription>
              Configure your thermal printer settings for receipts and reports.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 gap-6 mt-4">
            {/* Business Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4 capitalize">Business Information</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  value={printSettings.businessName}
                  onChange={(e) => setPrintSettings(prev => ({ ...prev, businessName: e.target.value }))}
                  placeholder="Enter business name"
                />
                <p className="text-sm text-gray-600 mt-1">This will appear at the top of receipts</p>
              </div>
              
              <div>
                <Label htmlFor="businessAddress">Business Address</Label>
                <textarea
                  id="businessAddress"
                  className="w-full p-2 border border-gray-300 rounded-md resize-none"
                  rows={3}
                  value={printSettings.businessAddress}
                  onChange={(e) => setPrintSettings(prev => ({ ...prev, businessAddress: e.target.value }))}
                  placeholder="Enter business address"
                />
                <p className="text-sm text-gray-600 mt-1">Use \n for line breaks. Include phone number and other contact details</p>
              </div>
              
              <div>
                <Label htmlFor="gstNumber">GST Number</Label>
                <Input
                  id="gstNumber"
                  value={printSettings.gstNumber}
                  onChange={(e) => setPrintSettings(prev => ({ ...prev, gstNumber: e.target.value }))}
                  placeholder="Enter GST number"
                />
                <p className="text-sm text-gray-600 mt-1">Your GST registration number</p>
              </div>
            </div>
            
            {/* Printer Settings */}
            <div>
              <h3 className="text-lg font-semibold mb-4 capitalize mt-6">Printer Settings</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
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
              
              <div>
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
              
              <div>
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
            
            {/* Receipt Content */}
            <div>
              <h3 className="text-lg font-semibold mb-4 capitalize mt-6">Receipt Content</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
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
                 
                 <div className="space-y-3">
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
             <div className="col-span-full">
               <h3 className="text-lg font-medium capitalize mt-6 mb-4">Thermal Printer Customization</h3>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label htmlFor="thermalHeaderText">Header Text</Label>
                 <Input
                   id="thermalHeaderText"
                   value={printSettings.thermalHeaderText || 'Thank you for choosing us!'}
                   onChange={(e) => setPrintSettings(prev => ({ ...prev, thermalHeaderText: e.target.value }))}
                   placeholder="Custom message at the top of receipt"
                 />
                 <p className="text-sm text-muted-foreground">Custom message at the top of receipt</p>
               </div>
               
               <div className="space-y-2">
                 <Label htmlFor="thermalFooterText">Footer Text</Label>
                 <Input
                   id="thermalFooterText"
                   value={printSettings.thermalFooterText || 'Visit us again soon!'}
                   onChange={(e) => setPrintSettings(prev => ({ ...prev, thermalFooterText: e.target.value }))}
                   placeholder="Custom message at the bottom of receipt"
                 />
                 <p className="text-sm text-muted-foreground">Custom message at the bottom of receipt</p>
               </div>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
               <div className="space-y-2">
                 <Label htmlFor="headerAlignment">Header Alignment</Label>
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
                 <Label htmlFor="footerAlignment">Footer Alignment</Label>
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
         </DialogContent>
         
         <DialogFooter>
           <Button variant="outline" onClick={() => setPrintSettingsOpen(false)}>Cancel</Button>
           <Button 
             onClick={async () => {
               try {
                 await saveSettings({
                   businessName: printSettings.businessName,
                   businessAddress: printSettings.businessAddress,
                   gstNumber: printSettings.gstNumber,
                   fontSize: printSettings.fontSize,
                   printerWidth: printSettings.printerWidth,
                   lineSpacing: printSettings.lineSpacing,
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
                   thermalHeaderText: printSettings.thermalHeaderText,
                   thermalFooterText: printSettings.thermalFooterText,
                   headerAlignment: printSettings.headerAlignment,
                   footerAlignment: printSettings.footerAlignment,
                   printDensity: printSettings.printDensity
                 })
                 setPrintSettingsOpen(false)
                 toast.success('Print settings saved successfully!')
               } catch (error) {
                 toast.error('Failed to save print settings')
               }
             }}
           >
             Save Settings
           </Button>
         </DialogFooter>
       </Dialog>
     </div>
   )
 }

export default Settings