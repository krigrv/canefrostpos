import React, { createContext, useContext, useState, useEffect } from 'react'
import { db } from '../firebase/config'
import { doc, setDoc, onSnapshot } from 'firebase/firestore'
import { useAuth } from './AuthContext'
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

  // Load settings from Firestore with real-time updates
  useEffect(() => {
    if (!currentUser) {
      setLoading(false)
      return
    }

    console.log('SettingsContext: Setting up real-time listener for settings')
    
    const settingsDocRef = doc(db, 'settings', currentUser.uid)
    const unsubscribe = onSnapshot(
      settingsDocRef,
      (doc) => {
        if (doc.exists()) {
          const settingsData = doc.data()
          console.log('SettingsContext: Loaded settings from Firestore')
          setSettings(prevSettings => ({
            ...prevSettings,
            ...settingsData
          }))
        } else {
          console.log('SettingsContext: No settings document found, using defaults')
        }
        setLoading(false)
      },
      (error) => {
        console.error('Error loading settings from Firestore:', error)
        setLoading(false)
      }
    )

    return () => {
      console.log('SettingsContext: Cleanup - unsubscribing from real-time listener')
      unsubscribe()
    }
  }, [currentUser])

  // Save settings to Firestore
  const saveSettings = async (newSettings) => {
    if (!currentUser) {
      console.error('SettingsContext: User not authenticated')
      toast.error('User not authenticated. Please log in again.')
      return
    }

    console.log('SettingsContext: Attempting to save settings:', newSettings)

    try {
      // Validate Firebase connection
      if (!db) {
        throw new Error('Firebase database not initialized')
      }

      const settingsDocRef = doc(db, 'settings', currentUser.uid)
      const updatedSettings = {
        ...settings,
        ...newSettings,
        updatedAt: new Date()
      }
      
      console.log('SettingsContext: Saving to Firestore with document ID:', currentUser.uid)
      await setDoc(settingsDocRef, updatedSettings, { merge: true })
      
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
      
      if (error.code === 'permission-denied') {
        errorMessage = 'Permission denied. Please check your account permissions.'
      } else if (error.code === 'unavailable') {
        errorMessage = 'Service temporarily unavailable. Please try again.'
      } else if (error.code === 'unauthenticated') {
        errorMessage = 'Authentication expired. Please log in again.'
      } else if (error.message.includes('Firebase')) {
        errorMessage = 'Database connection error. Please check your internet connection.'
      }
      
      toast.error(errorMessage)
      throw error
    }
  }

  // Update specific setting
  const updateSetting = async (key, value) => {
    await saveSettings({ [key]: value })
  }

  // Reset settings to default
  const resetSettings = async () => {
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
  }

  // Export settings
  const exportSettings = () => {
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
  }

  // Import settings
  const importSettings = async (settingsData) => {
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
  }

  // Get formatted currency
  const formatCurrency = (amount) => {
    const formattedAmount = new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)

    if (settings.currencyPosition === 'before') {
      return `${settings.currencySymbol}${formattedAmount}`
    } else {
      return `${formattedAmount}${settings.currencySymbol}`
    }
  }

  // Calculate tax amount
  const calculateTax = (amount, taxRate = null) => {
    if (!settings.enableTax) return 0
    
    const rate = taxRate || settings.defaultTaxRate
    if (settings.taxInclusive) {
      return (amount * rate) / (100 + rate)
    } else {
      return (amount * rate) / 100
    }
  }

  // Calculate loyalty points
  const calculateLoyaltyPoints = (amount) => {
    if (!settings.enableLoyalty) return 0
    return Math.floor(amount * settings.pointsPerRupee)
  }

  // Convert points to currency
  const pointsToCurrency = (points) => {
    return points / settings.pointsRedemptionRate
  }

  const value = {
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
  }

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}