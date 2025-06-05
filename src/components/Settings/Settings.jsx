import React, { useState, useEffect } from 'react'
import { useSettings } from '../../contexts/SettingsContext'
import { useInventory } from '../../hooks/useInventory'
import { useAuth } from '../../contexts/AuthContextSupabase'
import { useAccessibility } from '../../contexts/AccessibilityContext'
import { auditPageContrast, generateScreenReaderReport, generateAccessibilityReport, testKeyboardNavigation } from '../../utils/accessibility'
import { supabase } from '../../supabase/config'


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
  X,
  Eye,
  Keyboard,
  Volume2,
  Contrast,
  Type,
  MousePointer,
  Accessibility
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import LogAnalyzerPanel from '../DevTools/LogAnalyzerPanel'
import DebugProducts from '../DebugProducts'

function Settings() {
  const { settings: contextSettings, saveSettings, shuffleThemeColors } = useSettings()
  const { cleanupDuplicates } = useInventory()
  const { currentUser } = useAuth()
  const {
    highContrastMode,
    reducedMotion,
    fontSize,
    skipLinks,
    screenReaderMode,
    keyboardNavigation,
    contrastAuditResults,
    toggleHighContrast,
    toggleReducedMotion,
    setFontSize,
    toggleSkipLinks,
    toggleScreenReaderMode,
    toggleKeyboardNavigation,
    runContrastAudit,
    announceToScreenReader,
    resetAccessibilitySettings
  } = useAccessibility()
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
  
  // Accessibility testing states
  const [contrastResults, setContrastResults] = useState(null)
  const [isAuditing, setIsAuditing] = useState(false)
  const [screenReaderResults, setScreenReaderResults] = useState(null)
  const [isTestingScreenReader, setIsTestingScreenReader] = useState(false)
  const [wcagResults, setWcagResults] = useState(null)
  const [isTestingWCAG, setIsTestingWCAG] = useState(false)
  const [keyboardResults, setKeyboardResults] = useState(null)
  const [isTestingKeyboard, setIsTestingKeyboard] = useState(false)


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

  // Load business details from Supabase (synced with Profile component)
  useEffect(() => {
    const loadBusinessDetails = async () => {
      if (currentUser) {
        try {
          const { data, error } = await supabase
            .from('user_profiles')
            .select('business_details')
            .eq('user_id', currentUser.id)
            .single()
          
          if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
            throw error
          }
          
          if (data?.business_details) {
            const details = data.business_details
            setBusinessDetails(details)
            
            // Update print settings with loaded business details
            setPrintSettings(prev => ({
              ...prev,
              businessName: details.businessName || prev.businessName || '',
              businessAddress: details.businessAddress || prev.businessAddress || '',
              gstNumber: details.gstin || prev.gstNumber || ''
            }))
            
            // Update context settings with business information
            await saveSettings({
              storeName: details.businessName || 'CaneFrost POS',
              storeAddress: details.businessAddress || '',
              storePhone: details.phoneNumber || '',
              storeEmail: details.emailId || '',
              gstin: details.gstin || '',
              businessName: details.businessName || 'CANEFROST JUICE SHOP',
              businessAddress: details.businessAddress || '',
              gstNumber: details.gstin || ''
            })
          }
        } catch (error) {
          console.error('Error loading business details:', error)
          // Fallback to localStorage for migration
          const savedDetails = localStorage.getItem('businessDetails')
          if (savedDetails) {
            try {
              const details = JSON.parse(savedDetails)
              setBusinessDetails(details)
              
              // Update print settings with loaded business details
              setPrintSettings(prev => ({
                ...prev,
                businessName: details.businessName || prev.businessName || '',
                businessAddress: details.businessAddress || prev.businessAddress || '',
                gstNumber: details.gstin || prev.gstNumber || ''
              }))
            } catch (parseError) {
              console.error('Error parsing saved business details:', parseError)
            }
          }
        }
      }
    }
    loadBusinessDetails()
  }, [currentUser, saveSettings])
  
  // Function to save business details separately
  const saveBusinessDetails = async () => {
    try {
      if (!currentUser) {
        toast.error('User not authenticated. Please log in again.')
        return
      }
      
      const loadingToast = toast.loading('Saving business information...')
      
      // Save to Supabase
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: currentUser.id,
          business_details: businessDetails
        })
      
      if (error) throw error
      
      // Update context settings with business information
      await saveSettings({
        storeName: businessDetails.businessName || 'CaneFrost POS',
        storeAddress: businessDetails.businessAddress || '',
        storePhone: businessDetails.phoneNumber || '',
        storeEmail: businessDetails.emailId || '',
        gstin: businessDetails.gstin || '',
        businessName: businessDetails.businessName || 'CANEFROST JUICE SHOP',
        businessAddress: businessDetails.businessAddress || '',
        gstNumber: businessDetails.gstin || ''
      })
      
      // Also save to localStorage as backup
      localStorage.setItem('businessDetails', JSON.stringify(businessDetails))
      
      toast.dismiss(loadingToast)
      toast.success('✅ Business information saved successfully!')
    } catch (error) {
      console.error('Error saving business details:', error)
      toast.error('❌ Failed to save business information. Please try again.')
    }
  }
  
  // Accessibility testing functions
  const handleContrastAudit = async () => {
    setIsAuditing(true)
    announceToScreenReader('Running color contrast audit...')
    
    try {
      await runContrastAudit()
      // Get results from context after audit
      setContrastResults(contrastAuditResults)
      announceToScreenReader(`Contrast audit complete. Found ${contrastAuditResults?.failingElements?.length || 0} issues.`)
    } catch (error) {
      console.error('Contrast audit failed:', error)
      announceToScreenReader('Contrast audit failed. Please try again.')
    } finally {
      setIsAuditing(false)
    }
  }

  const runScreenReaderTest = async () => {
    setIsTestingScreenReader(true)
    announceToScreenReader('Running screen reader compatibility test...')
    
    try {
      const results = generateScreenReaderReport()
      setScreenReaderResults(results)
      announceToScreenReader(`Screen reader test complete. Accessibility score: ${results.score}%. Found ${results.summary.totalIssues} issues.`)
    } catch (error) {
      console.error('Screen reader test failed:', error)
      announceToScreenReader('Screen reader test failed. Please try again.')
    } finally {
      setIsTestingScreenReader(false)
    }
  }

  const runWCAGTest = async () => {
    setIsTestingWCAG(true)
    announceToScreenReader('Running comprehensive WCAG 2.1 AA compliance test...')
    
    try {
      const results = generateAccessibilityReport()
      setWcagResults(results)
      announceToScreenReader(`WCAG test complete. Overall score: ${results.overall.score}%. Grade: ${results.overall.grade}.`)
    } catch (error) {
      console.error('WCAG test failed:', error)
      announceToScreenReader('WCAG test failed. Please try again.')
    } finally {
      setIsTestingWCAG(false)
    }
  }

  const runKeyboardTest = async () => {
    setIsTestingKeyboard(true)
    announceToScreenReader('Running keyboard accessibility test...')
    
    try {
      const results = testKeyboardNavigation()
      setKeyboardResults(results)
      announceToScreenReader(`Keyboard test complete. Score: ${results.score}%. Found ${results.issues.length} issues.`)
    } catch (error) {
      console.error('Keyboard test failed:', error)
      announceToScreenReader('Keyboard test failed. Please try again.')
    } finally {
      setIsTestingKeyboard(false)
    }
  }
  
  const getContrastBadgeVariant = (ratio) => {
    if (ratio >= 7) return 'default' // AAA
    if (ratio >= 4.5) return 'secondary' // AA
    if (ratio >= 3) return 'outline' // AA Large
    return 'destructive' // Fail
  }

  const getContrastLabel = (ratio) => {
    if (ratio >= 7) return 'AAA'
    if (ratio >= 4.5) return 'AA'
    if (ratio >= 3) return 'AA Large'
    return 'Fail'
  }

  const handleSettingChange = async (setting, value = null, showToast = true) => {
    const newValue = value !== null ? value : !contextSettings[setting]
    try {
      await saveSettings({ [setting]: newValue })
      if (showToast) {
        if (typeof newValue === 'boolean') {
          toast.success(`${setting} ${newValue ? 'enabled' : 'disabled'} and saved`)
        } else {
          toast.success(`${setting} updated to ${newValue}`)
        }
      }
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





  const managementCards = [
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
                    <div className="text-gray-600 bg-muted p-2 rounded-lg">
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

      {/* Theme Settings */}
      <h2 className="text-2xl font-semibold mb-6 mt-8">
        Appearance & Themes
      </h2>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <PaletteIcon className="w-5 h-5" />
            Theme Selection
          </CardTitle>
          <CardDescription>
            Choose your preferred color theme for the application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Light Theme */}
              <div 
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  contextSettings.customTheme === 'light' || !contextSettings.customTheme 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleSettingChange('customTheme', 'light', false)}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">Light Theme</h4>
                  {(contextSettings.customTheme === 'light' || !contextSettings.customTheme) && (
                    <CheckCircleIcon className="w-5 h-5 text-blue-500" />
                  )}
                </div>
                <div className="flex space-x-2 mb-3">
                  <div className="w-6 h-6 bg-background border border-border rounded"></div>
                  <div className="w-6 h-6 bg-blue-500 rounded"></div>
                  <div className="w-6 h-6 bg-muted rounded"></div>
                  <div className="w-6 h-6 bg-gray-800 rounded"></div>
                </div>
                <p className="text-sm text-gray-600">Clean and bright interface</p>
              </div>

              {/* Dark Theme */}
              <div 
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  contextSettings.customTheme === 'dark' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleSettingChange('customTheme', 'dark', false)}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">Dark Theme</h4>
                  {contextSettings.customTheme === 'dark' && (
                    <CheckCircleIcon className="w-5 h-5 text-blue-500" />
                  )}
                </div>
                <div className="flex space-x-2 mb-3">
                  <div className="w-6 h-6 bg-gray-900 rounded"></div>
                  <div className="w-6 h-6 bg-blue-400 rounded"></div>
                  <div className="w-6 h-6 bg-gray-700 rounded"></div>
                  <div className="w-6 h-6 bg-gray-200 rounded"></div>
                </div>
                <p className="text-sm text-gray-600">Easy on the eyes</p>
              </div>

              {/* CaneFrost Theme */}
              <div 
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all relative ${
                  contextSettings.customTheme === 'canefrost' 
                    ? 'border-green-600 bg-green-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleSettingChange('customTheme', 'canefrost', false)}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">CaneFrost Theme</h4>
                  <div className="flex items-center gap-2">
                    {contextSettings.customTheme === 'canefrost' && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          shuffleThemeColors();
                        }}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1 text-xs px-2 py-1 h-7 hover:bg-green-100 hover:border-green-400 focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
                        aria-label="Shuffle theme colors for better accessibility"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Shuffle
                      </Button>
                    )}
                    {contextSettings.customTheme === 'canefrost' && (
                      <CheckCircleIcon className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                </div>
                <div className="flex space-x-2 mb-3">
                  <div className="w-6 h-6 rounded" style={{backgroundColor: '#f5e7d0'}}></div>
                  <div className="w-6 h-6 rounded" style={{backgroundColor: '#024e39'}}></div>
                  <div className="w-6 h-6 rounded" style={{backgroundColor: '#127743'}}></div>
                  <div className="w-6 h-6 rounded" style={{backgroundColor: '#bbadbe'}}></div>
                </div>
                <p className="text-sm text-gray-600">Warm champagne background with natural greens</p>
              </div>
            </div>


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

          {/* Render Developer Tools when enabled */}
          {showDevTools && (
            <div className="space-y-6">
              {/* Log Analyzer Panel */}
              <LogAnalyzerPanel />
              
              {/* Product Debug Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <InfoIcon className="w-5 h-5" />
                    Product Debug Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <h4 className="font-semibold mb-2">Database Schema Status</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Sales Table:</span>
                            <Badge variant="outline">Missing Columns</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Staff Table:</span>
                            <Badge variant="outline">Missing Columns</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Customers Table:</span>
                            <Badge variant="outline">Missing Columns</Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-muted rounded-lg">
                        <h4 className="font-semibold mb-2">Required Actions</h4>
                        <div className="space-y-2 text-sm">
                          <p>• Run fix_missing_columns.sql in Supabase</p>
                          <p>• Execute create_user_tables.sql</p>
                          <p>• Execute fix_supabase_security.sql</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <h4 className="font-semibold mb-2 text-amber-800">Console Errors Detected</h4>
                      <div className="space-y-1 text-sm text-amber-700">
                        <p>• Column 'transactionId' does not exist in sales table</p>
                        <p>• Column 'cashAmount' not found in sales schema cache</p>
                        <p>• Column 'createdAt' not found in staff schema cache</p>
                        <p>• Column 'createdAt' not found in customers schema cache</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const debugInfo = {
                            timestamp: new Date().toISOString(),
                            userAgent: navigator.userAgent,
                            url: window.location.href,
                            errors: [
                              'Column sales.transactionId does not exist',
                              'Could not find cashAmount column in sales schema cache',
                              'Could not find createdAt column in staff schema cache',
                              'Could not find createdAt column in customers schema cache'
                            ],
                            requiredSQLScripts: [
                              'fix_missing_columns.sql',
                              'create_user_tables.sql', 
                              'fix_supabase_security.sql'
                            ]
                          }
                          navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2))
                          toast.success('Debug info copied to clipboard')
                        }}
                      >
                        Copy Debug Info
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          console.log('=== PRODUCT DEBUG INFO ===')
                          console.log('Missing columns detected in database schema')
                          console.log('Required SQL scripts: fix_missing_columns.sql, create_user_tables.sql, fix_supabase_security.sql')
                          console.log('==========================')
                          toast.success('Debug info logged to console')
                        }}
                      >
                        Log to Console
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Product Debug Information */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <InfoIcon className="w-5 h-5" />
                    Product Debug Information
                  </CardTitle>
                  <CardDescription>
                    Real-time product statistics and duplicate detection
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DebugProducts />
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}

      {/* Accessibility Settings */}
      <h2 className="text-2xl font-semibold mb-6 mt-8">
        Accessibility Settings
      </h2>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Accessibility className="w-5 h-5" />
            Accessibility Features
          </CardTitle>
          <CardDescription>
            Configure accessibility options and run compliance tests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {/* Visual Settings */}
            <div>
              <h4 className="font-semibold text-base mb-4 flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Visual Settings
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Contrast className="w-5 h-5 text-gray-600" />
                    <div>
                      <h5 className="font-medium">High Contrast</h5>
                      <p className="text-sm text-gray-600">Enhance visual contrast for better readability</p>
                    </div>
                  </div>
                  <Switch
                    checked={highContrastMode}
                    onCheckedChange={toggleHighContrast}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <MousePointer className="w-5 h-5 text-gray-600" />
                    <div>
                      <h5 className="font-medium">Reduced Motion</h5>
                      <p className="text-sm text-gray-600">Minimize animations and transitions</p>
                    </div>
                  </div>
                  <Switch
                    checked={reducedMotion}
                    onCheckedChange={toggleReducedMotion}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <Type className="w-5 h-5 text-gray-600" />
                    <div>
                      <h5 className="font-medium">Font Size</h5>
                      <p className="text-sm text-gray-600">Adjust text size for better readability</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => adjustFontSize('decrease')}
                      disabled={fontSize <= 12}
                    >
                      A-
                    </Button>
                    <span className="text-sm font-medium min-w-[60px] text-center">
                      {fontSize}px
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => adjustFontSize('increase')}
                      disabled={fontSize >= 24}
                    >
                      A+
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Navigation Settings */}
            <div>
              <h4 className="font-semibold text-base mb-4 flex items-center gap-2">
                <Keyboard className="w-4 h-4" />
                Navigation Settings
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <MousePointer className="w-5 h-5 text-gray-600" />
                    <div>
                      <h5 className="font-medium">Skip Links</h5>
                      <p className="text-sm text-gray-600">Enable keyboard navigation shortcuts</p>
                    </div>
                  </div>
                  <Switch
                    checked={skipLinks}
                    onCheckedChange={toggleSkipLinks}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Keyboard className="w-5 h-5 text-gray-600" />
                    <div>
                      <h5 className="font-medium">Enhanced Keyboard Navigation</h5>
                      <p className="text-sm text-gray-600">Improve keyboard focus indicators</p>
                    </div>
                  </div>
                  <Switch
                    checked={keyboardNavigation}
                    onCheckedChange={toggleKeyboardNavigation}
                  />
                </div>
              </div>
            </div>
            
            {/* Screen Reader Settings */}
            <div>
              <h4 className="font-semibold text-base mb-4 flex items-center gap-2">
                <Volume2 className="w-4 h-4" />
                Screen Reader Settings
              </h4>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Volume2 className="w-5 h-5 text-gray-600" />
                  <div>
                    <h5 className="font-medium">Screen Reader Mode</h5>
                    <p className="text-sm text-gray-600">Optimize interface for screen readers</p>
                  </div>
                </div>
                <Switch
                  checked={screenReaderMode}
                  onCheckedChange={toggleScreenReaderMode}
                />
              </div>
            </div>
            
            {/* Accessibility Testing */}
            <div>
              <h4 className="font-semibold text-base mb-4 flex items-center gap-2">
                <Accessibility className="w-4 h-4" />
                Accessibility Testing
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  onClick={handleContrastAudit}
                  disabled={isAuditing}
                  className="h-auto p-4 flex flex-col items-start space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <Contrast className="w-4 h-4" />
                    <span className="font-medium">Color Contrast Audit</span>
                  </div>
                  <span className="text-sm text-muted-foreground text-left">
                    {isAuditing ? 'Running audit...' : 'Check color contrast compliance'}
                  </span>
                  {contrastResults && (
                    <Badge variant={contrastResults.failingElements?.length > 0 ? 'destructive' : 'default'}>
                      {contrastResults.failingElements?.length || 0} issues found
                    </Badge>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={runScreenReaderTest}
                  disabled={isTestingScreenReader}
                  className="h-auto p-4 flex flex-col items-start space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <Volume2 className="w-4 h-4" />
                    <span className="font-medium">Screen Reader Test</span>
                  </div>
                  <span className="text-sm text-muted-foreground text-left">
                    {isTestingScreenReader ? 'Testing...' : 'Test screen reader compatibility'}
                  </span>
                  {screenReaderResults && (
                    <Badge variant={screenReaderResults.score >= 80 ? 'default' : 'destructive'}>
                      Score: {screenReaderResults.score}%
                    </Badge>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={runWCAGTest}
                  disabled={isTestingWCAG}
                  className="h-auto p-4 flex flex-col items-start space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <Accessibility className="w-4 h-4" />
                    <span className="font-medium">WCAG 2.1 AA Test</span>
                  </div>
                  <span className="text-sm text-muted-foreground text-left">
                    {isTestingWCAG ? 'Testing...' : 'Run comprehensive accessibility test'}
                  </span>
                  {wcagResults && (
                    <Badge variant={wcagResults.overall?.grade === 'A' ? 'default' : 'destructive'}>
                      Grade: {wcagResults.overall?.grade || 'N/A'}
                    </Badge>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={runKeyboardTest}
                  disabled={isTestingKeyboard}
                  className="h-auto p-4 flex flex-col items-start space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <Keyboard className="w-4 h-4" />
                    <span className="font-medium">Keyboard Navigation Test</span>
                  </div>
                  <span className="text-sm text-muted-foreground text-left">
                    {isTestingKeyboard ? 'Testing...' : 'Test keyboard accessibility'}
                  </span>
                  {keyboardResults && (
                    <Badge variant={keyboardResults.score >= 80 ? 'default' : 'destructive'}>
                      Score: {keyboardResults.score}%
                    </Badge>
                  )}
                </Button>
              </div>
            </div>
            
            {/* Reset Accessibility Settings */}
            <div className="pt-4 border-t">
              <Button
                variant="outline"
                onClick={resetAccessibilitySettings}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                Reset All Accessibility Settings
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

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
                      value={businessDetails.businessName}
                      onChange={(e) => setBusinessDetails(prev => ({ ...prev, businessName: e.target.value }))}
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
                      value={businessDetails.businessAddress}
                      onChange={(e) => setBusinessDetails(prev => ({ ...prev, businessAddress: e.target.value }))}
                      placeholder="Enter business address"
                    />
                    <p className="text-sm text-muted-foreground mt-1">Use \n for line breaks. Include phone number and other contact details</p>
                  </div>
                  
                  <div>
                    <Label htmlFor="gstNumber">GST Number</Label>
                    <Input
                      id="gstNumber"
                      value={businessDetails.gstin}
                      onChange={(e) => setBusinessDetails(prev => ({ ...prev, gstin: e.target.value }))}
                      placeholder="Enter GST number"
                    />
                    <p className="text-sm text-muted-foreground mt-1">Your GST registration number</p>
                  </div>
                  
                  <div className="pt-4">
                    <Button 
                      onClick={saveBusinessDetails}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Business Information
                    </Button>
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
                        size="sm"
                        checked={printSettings.showHeaderText}
                        onCheckedChange={(checked) => setPrintSettings(prev => ({ ...prev, showHeaderText: checked }))}
                      />
                      <Label htmlFor="showHeaderText">Show Header Text</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="showFooterText"
                        size="sm"
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
                      size="sm"
                      checked={printSettings.showBusinessName}
                      onCheckedChange={(checked) => setPrintSettings(prev => ({ ...prev, showBusinessName: checked }))}
                    />
                    <Label htmlFor="showBusinessName">Show Business Name</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="showBusinessAddress"
                      size="sm"
                      checked={printSettings.showBusinessAddress}
                      onCheckedChange={(checked) => setPrintSettings(prev => ({ ...prev, showBusinessAddress: checked }))}
                    />
                    <Label htmlFor="showBusinessAddress">Show Business Address</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="showGSTNumber"
                      size="sm"
                      checked={printSettings.showGSTNumber}
                      onCheckedChange={(checked) => setPrintSettings(prev => ({ ...prev, showGSTNumber: checked }))}
                    />
                    <Label htmlFor="showGSTNumber">Show GST Number</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="showDateTime"
                      size="sm"
                      checked={printSettings.showDateTime || true}
                      onCheckedChange={(checked) => setPrintSettings(prev => ({ ...prev, showDateTime: checked }))}
                    />
                    <Label htmlFor="showDateTime">Show Date & Time</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="showReceiptNumber"
                      size="sm"
                      checked={printSettings.showReceiptNumber || true}
                      onCheckedChange={(checked) => setPrintSettings(prev => ({ ...prev, showReceiptNumber: checked }))}
                    />
                    <Label htmlFor="showReceiptNumber">Show Receipt Number</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                     <Checkbox
                       id="showPaymentMethod"
                       size="sm"
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
                       size="sm"
                       checked={printSettings.showCustomerInfo || true}
                       onCheckedChange={(checked) => setPrintSettings(prev => ({ ...prev, showCustomerInfo: checked }))}
                     />
                     <Label htmlFor="showCustomerInfo">Show Customer Info</Label>
                   </div>
                   
                   <div className="flex items-center space-x-2">
                     <Checkbox
                       id="showItemCodes"
                       size="sm"
                       checked={printSettings.showItemCodes || false}
                       onCheckedChange={(checked) => setPrintSettings(prev => ({ ...prev, showItemCodes: checked }))}
                     />
                     <Label htmlFor="showItemCodes">Show Item Codes</Label>
                   </div>
                   
                   <div className="flex items-center space-x-2">
                     <Checkbox
                       id="showTaxBreakdown"
                       size="sm"
                       checked={printSettings.showTaxBreakdown || true}
                       onCheckedChange={(checked) => setPrintSettings(prev => ({ ...prev, showTaxBreakdown: checked }))}
                     />
                     <Label htmlFor="showTaxBreakdown">Show GST Breakdown</Label>
                   </div>
                   
                   <div className="flex items-center space-x-2">
                     <Checkbox
                       id="showDividers"
                       size="sm"
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
     </div>
   )
 }
 
 export default Settings