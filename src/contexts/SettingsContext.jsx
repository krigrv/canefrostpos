import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../supabase/config'
import { useAuth } from './AuthContextSupabase'
import toast from 'react-hot-toast'

const SettingsContext = createContext()

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}

export function SettingsProvider({ children }) {
  const { currentUser } = useAuth()
  const [settings, setSettings] = useState({
    // General Settings
    storeName: 'CaneFrost POS',
    storeAddress: '',
    storePhone: '',
    storeEmail: '',
    gstin: '',
    
    // Tax Settings
    defaultTaxRate: 18,
    enableTax: true,
    taxInclusive: false,
    
    // Currency Settings
    currency: 'INR',
    currencySymbol: '₹',
    currencyPosition: 'before', // 'before' or 'after'
    
    // Receipt Settings
    receiptHeader: 'Thank you for your purchase!',
    receiptFooter: 'Visit us again!',
    showLogo: true,
    printReceipt: true,
    
    // Print Settings for Thermal Printer
    businessName: 'CANEFROST JUICE SHOP',
    businessAddress: 'Fresh Juices & Beverages\nPhone: +91 9876543210',
    gstNumber: '29XXXXX1234X1ZX',
    printerWidth: '80mm',
    fontSize: 'medium',
    lineSpacing: 'normal',
    showBusinessName: true,
    showBusinessAddress: true,
    showGSTNumber: true,
    thermalHeaderText: 'Thank you for choosing us!',
    thermalFooterText: 'Visit us again soon!',
    showDateTime: true,
    showReceiptNumber: true,
    showPaymentMethod: true,
    showCustomerInfo: true,
    fontFamily: 'monospace',
    headerAlignment: 'center',
    footerAlignment: 'center',
    showDividers: true,
    paperCutType: 'full', // 'full', 'partial', 'none'
    printDensity: 'normal', // 'light', 'normal', 'dark'
    characterWidth: 32, // characters per line for 80mm
    showItemCodes: false,
    showTaxBreakdown: true,
    companyLogo: '',
    logoSize: 'medium',
    
    // Inventory Settings
    lowStockThreshold: 10,
    enableStockAlerts: true,
    autoDeductStock: true,
    
    // Loyalty Settings
    enableLoyalty: true,
    pointsPerRupee: 1,
    pointsRedemptionRate: 100, // 100 points = ₹1
    
    // Notification Settings
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    
    // Theme Settings
    theme: 'light',
    primaryColor: '#1976d2',
    secondaryColor: '#dc004e',
    
    // Backup Settings
    autoBackup: true,
    backupFrequency: 'daily', // 'daily', 'weekly', 'monthly'
    
    // Security Settings
    sessionTimeout: 30, // minutes
    requirePasswordForRefunds: true,
    enableAuditLog: true
  })
  const [loading, setLoading] = useState(true)

  // Load settings from Supabase
  useEffect(() => {
    if (!currentUser) {
      setLoading(false)
      return
    }

    console.log('SettingsContext: Loading settings from Supabase')
    
    const loadSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('settings')
          .eq('user_id', currentUser.id)
          .single()
        
        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
          if (error.code === '42P01') {
            // Table doesn't exist - use defaults silently
            console.log('Settings table not found, using defaults')
            return
          }
          throw error
        }
        
        if (data?.settings) {
          console.log('SettingsContext: Loaded settings from Supabase')
          setSettings(prevSettings => ({
            ...prevSettings,
            ...data.settings
          }))
        } else {
          console.log('SettingsContext: No settings found, using defaults')
        }
      } catch (error) {
        console.error('Error loading settings from Supabase:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadSettings()
  }, [currentUser])

  // Save settings to Supabase
  const saveSettings = useCallback(async (newSettings) => {
    if (!currentUser) {
      console.error('SettingsContext: User not authenticated')
      toast.error('User not authenticated. Please log in again.')
      return
    }

    console.log('SettingsContext: Attempting to save settings:', newSettings)

    try {
      const updatedSettings = {
        ...settings,
        ...newSettings,
        updatedAt: new Date().toISOString()
      }
      
      console.log('SettingsContext: Saving to Supabase for user:', currentUser.id)
      
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: currentUser.id,
          settings: updatedSettings,
          updated_at: new Date().toISOString()
        })
      
      if (error) {
        if (error.code === '42P01') {
          console.log('Settings table not found, skipping save')
          return
        }
        throw error
      }
      
      setSettings(updatedSettings)
      
      // Also save to localStorage as backup
      try {
        localStorage.setItem('posSettings', JSON.stringify(updatedSettings))
        console.log('SettingsContext: Settings also saved to localStorage')
      } catch (localStorageError) {
        console.warn('SettingsContext: Failed to save to localStorage:', localStorageError)
      }
      
      console.log('SettingsContext: Settings saved successfully')
      toast.success('Settings saved successfully')
    } catch (error) {
      console.error('SettingsContext: Error saving settings:', error)
      
      // Provide more specific error messages
      let errorMessage = 'Failed to save settings'
      
      if (error.code === '42501') {
        errorMessage = 'Permission denied. Please check your account permissions.'
      } else if (error.message?.includes('network')) {
        errorMessage = 'Network error. Please check your internet connection.'
      }
      
      toast.error(errorMessage)
      throw error
    }
  }, [currentUser, settings])

  // Update specific setting
  const updateSetting = useCallback(async (key, value) => {
    await saveSettings({ [key]: value })
  }, [saveSettings])

  // Reset settings to default
  const resetSettings = useCallback(async () => {
    if (!currentUser) {
      toast.error('User not authenticated')
      return
    }

    try {
      const defaultSettings = {
        storeName: 'CaneFrost POS',
        storeAddress: '',
        storePhone: '',
        storeEmail: '',
        gstin: '',
        defaultTaxRate: 18,
        enableTax: true,
        taxInclusive: false,
        currency: 'INR',
        currencySymbol: '₹',
        currencyPosition: 'before',
        receiptHeader: 'Thank you for your purchase!',
        receiptFooter: 'Visit us again!',
        showLogo: true,
        printReceipt: true,
        lowStockThreshold: 10,
        enableStockAlerts: true,
        autoDeductStock: true,
        enableLoyalty: true,
        pointsPerRupee: 1,
        pointsRedemptionRate: 100,
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true,
        theme: 'light',
        primaryColor: '#1976d2',
        secondaryColor: '#dc004e',
        autoBackup: true,
        backupFrequency: 'daily',
        sessionTimeout: 30,
        requirePasswordForRefunds: true,
        enableAuditLog: true,
        updatedAt: new Date()
      }

      const settingsDocRef = doc(db, 'settings', currentUser.uid)
      await setDoc(settingsDocRef, defaultSettings)
      setSettings(defaultSettings)
      
      localStorage.setItem('posSettings', JSON.stringify(defaultSettings))
      toast.success('Settings reset to default')
    } catch (error) {
      console.error('Error resetting settings:', error)
      toast.error('Failed to reset settings')
      throw error
    }
  }, [currentUser])

  // Export settings
  const exportSettings = useCallback(() => {
    try {
      const dataStr = JSON.stringify(settings, null, 2)
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
      
      const exportFileDefaultName = `canefrost-settings-${new Date().toISOString().split('T')[0]}.json`
      
      const linkElement = document.createElement('a')
      linkElement.setAttribute('href', dataUri)
      linkElement.setAttribute('download', exportFileDefaultName)
      linkElement.click()
      
      toast.success('Settings exported successfully')
    } catch (error) {
      console.error('Error exporting settings:', error)
      toast.error('Failed to export settings')
    }
  }, [settings])

  // Import settings
  const importSettings = useCallback(async (settingsData) => {
    try {
      // Validate settings data
      if (typeof settingsData !== 'object' || settingsData === null) {
        throw new Error('Invalid settings data')
      }

      await saveSettings(settingsData)
      toast.success('Settings imported successfully')
    } catch (error) {
      console.error('Error importing settings:', error)
      toast.error('Failed to import settings')
      throw error
    }
  }, [saveSettings])

  // Get formatted currency
  const formatCurrency = useCallback((amount) => {
    const formattedAmount = new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)

    if (settings.currencyPosition === 'before') {
      return `${settings.currencySymbol}${formattedAmount}`
    } else {
      return `${formattedAmount}${settings.currencySymbol}`
    }
  }, [settings.currencyPosition, settings.currencySymbol])

  // Calculate tax amount
  const calculateTax = useCallback((amount, taxRate = null) => {
    if (!settings.enableTax) return 0
    
    const rate = taxRate || settings.defaultTaxRate
    if (settings.taxInclusive) {
      return (amount * rate) / (100 + rate)
    } else {
      return (amount * rate) / 100
    }
  }, [settings.enableTax, settings.defaultTaxRate, settings.taxInclusive])

  // Calculate loyalty points
  const calculateLoyaltyPoints = useCallback((amount) => {
    if (!settings.enableLoyalty) return 0
    return Math.floor(amount * settings.pointsPerRupee)
  }, [settings.enableLoyalty, settings.pointsPerRupee])

  // Convert points to currency
  const pointsToCurrency = useCallback((points) => {
    return points / settings.pointsRedemptionRate
  }, [settings.pointsRedemptionRate])

  const value = useMemo(() => ({
    settings,
    loading,
    saveSettings,
    updateSetting,
    resetSettings,
    exportSettings,
    importSettings,
    formatCurrency,
    calculateTax,
    calculateLoyaltyPoints,
    pointsToCurrency
  }), [
    settings,
    loading,
    saveSettings,
    updateSetting,
    resetSettings,
    exportSettings,
    importSettings,
    formatCurrency,
    calculateTax,
    calculateLoyaltyPoints,
    pointsToCurrency
  ])

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}