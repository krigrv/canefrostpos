import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react'
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

// Theme Manager Class - Isolated from React lifecycle
class ThemeManager {
  constructor() {
    this.isApplying = false
    this.pendingTheme = null
  }

  hexToHsl(hex) {
    const r = parseInt(hex.slice(1, 3), 16) / 255
    const g = parseInt(hex.slice(3, 5), 16) / 255
    const b = parseInt(hex.slice(5, 7), 16) / 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h, s, l = (max + min) / 2

    if (max === min) {
      h = s = 0 // achromatic
    } else {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break
        case g: h = (b - r) / d + 2; break
        case b: h = (r - g) / d + 4; break
      }
      h /= 6
    }

    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
  }

  applyTheme(themeName, themeColors) {
    // Prevent multiple simultaneous applications
    if (this.isApplying) {
      this.pendingTheme = { themeName, themeColors }
      return
    }

    this.isApplying = true
    
    try {
      const root = document.documentElement
      
      root.classList.add('theme-changing')
      
      if (themeName === 'canefrost' && themeColors) {
        // Apply CaneFrost theme colors using HSL format
        root.style.setProperty('--background', this.hexToHsl(themeColors.champagne.DEFAULT))
        root.style.setProperty('--foreground', this.hexToHsl(themeColors.raisin_black.DEFAULT))
        root.style.setProperty('--card', this.hexToHsl(themeColors.white.DEFAULT))
        root.style.setProperty('--card-foreground', this.hexToHsl(themeColors.raisin_black.DEFAULT))
        root.style.setProperty('--popover', this.hexToHsl(themeColors.white.DEFAULT))
        root.style.setProperty('--popover-foreground', this.hexToHsl(themeColors.raisin_black.DEFAULT))
        root.style.setProperty('--primary', this.hexToHsl(themeColors.castleton_green.DEFAULT))
        root.style.setProperty('--primary-foreground', this.hexToHsl(themeColors.white.DEFAULT))
        root.style.setProperty('--secondary', this.hexToHsl(themeColors.dark_spring_green.DEFAULT))
        root.style.setProperty('--secondary-foreground', this.hexToHsl(themeColors.white.DEFAULT))
        root.style.setProperty('--muted', this.hexToHsl(themeColors.rose_quartz.DEFAULT))
        root.style.setProperty('--muted-foreground', this.hexToHsl(themeColors.raisin_black.DEFAULT))
        root.style.setProperty('--accent', this.hexToHsl(themeColors.drab_dark_brown.DEFAULT))
        root.style.setProperty('--accent-foreground', this.hexToHsl(themeColors.white.DEFAULT))
        root.style.setProperty('--destructive', '0 84.2% 60.2%')
        root.style.setProperty('--destructive-foreground', this.hexToHsl(themeColors.white.DEFAULT))
        root.style.setProperty('--border', this.hexToHsl(themeColors.rose_quartz.DEFAULT))
        root.style.setProperty('--input', this.hexToHsl(themeColors.champagne.DEFAULT))
        root.style.setProperty('--ring', this.hexToHsl(themeColors.castleton_green.DEFAULT))
      } else if (themeName === 'dark') {
        // Apply dark theme
        root.style.setProperty('--background', '222.2 84% 4.9%')
        root.style.setProperty('--foreground', '210 40% 98%')
        root.style.setProperty('--card', '222.2 84% 4.9%')
        root.style.setProperty('--card-foreground', '210 40% 98%')
        root.style.setProperty('--popover', '222.2 84% 4.9%')
        root.style.setProperty('--popover-foreground', '210 40% 98%')
        root.style.setProperty('--primary', '210 40% 98%')
        root.style.setProperty('--primary-foreground', '222.2 84% 4.9%')
        root.style.setProperty('--secondary', '217.2 32.6% 17.5%')
        root.style.setProperty('--secondary-foreground', '210 40% 98%')
        root.style.setProperty('--muted', '217.2 32.6% 17.5%')
        root.style.setProperty('--muted-foreground', '215 20.2% 65.1%')
        root.style.setProperty('--accent', '217.2 32.6% 17.5%')
        root.style.setProperty('--accent-foreground', '210 40% 98%')
        root.style.setProperty('--destructive', '0 62.8% 30.6%')
        root.style.setProperty('--destructive-foreground', '210 40% 98%')
        root.style.setProperty('--border', '217.2 32.6% 17.5%')
        root.style.setProperty('--input', '217.2 32.6% 17.5%')
        root.style.setProperty('--ring', '212.7 26.8% 83.9%')
      } else {
        // Apply light theme (default)
        root.style.setProperty('--background', '0 0% 100%')
        root.style.setProperty('--foreground', '222.2 84% 4.9%')
        root.style.setProperty('--card', '0 0% 100%')
        root.style.setProperty('--card-foreground', '222.2 84% 4.9%')
        root.style.setProperty('--popover', '0 0% 100%')
        root.style.setProperty('--popover-foreground', '222.2 84% 4.9%')
        root.style.setProperty('--primary', '222.2 47.4% 11.2%')
        root.style.setProperty('--primary-foreground', '210 40% 98%')
        root.style.setProperty('--secondary', '210 40% 96%')
        root.style.setProperty('--secondary-foreground', '222.2 84% 4.9%')
        root.style.setProperty('--muted', '210 40% 96%')
        root.style.setProperty('--muted-foreground', '215.4 16.3% 46.9%')
        root.style.setProperty('--accent', '210 40% 96%')
        root.style.setProperty('--accent-foreground', '222.2 84% 4.9%')
        root.style.setProperty('--destructive', '0 84.2% 60.2%')
        root.style.setProperty('--destructive-foreground', '210 40% 98%')
        root.style.setProperty('--border', '214.3 31.8% 91.4%')
        root.style.setProperty('--input', '214.3 31.8% 91.4%')
        root.style.setProperty('--ring', '221.2 83.2% 53.3%')
      }
      
      // Re-enable transitions after styles are applied
      requestAnimationFrame(() => {
        // Ensure styles are painted, then remove the class in the next frame
        requestAnimationFrame(() => {
          root.classList.remove('theme-changing');
        });
      });
      
    } finally {
      this.isApplying = false
      
      // Apply any pending theme
      if (this.pendingTheme) {
        const pending = this.pendingTheme
        this.pendingTheme = null
        // Use setTimeout to avoid stack overflow
        setTimeout(() => this.applyTheme(pending.themeName, pending.themeColors), 0)
      }
    }
  }
}

// Create singleton instance
const themeManager = new ThemeManager()

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
    customTheme: 'default',
    
    // Custom Theme Colors
    themeColors: {
      champagne: {
        DEFAULT: '#f5e7d0',
        100: '#4b3410',
        200: '#966920',
        300: '#d59a3b',
        400: '#e5c186',
        500: '#f5e7d0',
        600: '#f7ecda',
        700: '#f9f1e3',
        800: '#fbf5ec',
        900: '#fdfaf6'
      },
      castleton_green: {
        DEFAULT: '#024e39',
        100: '#00100c',
        200: '#012017',
        300: '#013023',
        400: '#02402e',
        500: '#024e39',
        600: '#04a376',
        700: '#06f7b3',
        800: '#58fbcd',
        900: '#abfde6'
      },
      dark_spring_green: {
        DEFAULT: '#127743',
        100: '#04180d',
        200: '#07301b',
        300: '#0b4828',
        400: '#0e6036',
        500: '#127743',
        600: '#1cb967',
        700: '#3de28d',
        800: '#7decb3',
        900: '#bef5d9'
      },
      white: {
        DEFAULT: '#ffffff',
        100: '#333333',
        200: '#666666',
        300: '#999999',
        400: '#cccccc',
        500: '#ffffff',
        600: '#ffffff',
        700: '#ffffff',
        800: '#ffffff',
        900: '#ffffff'
      },
      raisin_black: {
        DEFAULT: '#231f20',
        100: '#070606',
        200: '#0e0c0d',
        300: '#151313',
        400: '#1c191a',
        500: '#231f20',
        600: '#52494b',
        700: '#817376',
        800: '#aca1a4',
        900: '#d5d0d1'
      },
      rose_quartz: {
        DEFAULT: '#bbadbe',
        100: '#272029',
        200: '#4e4051',
        300: '#75607a',
        400: '#99849e',
        500: '#bbadbe',
        600: '#c8bdcb',
        700: '#d6cdd8',
        800: '#e4dee5',
        900: '#f1eef2'
      },
      drab_dark_brown: {
        DEFAULT: '#454521',
        100: '#0e0e07',
        200: '#1c1c0d',
        300: '#292914',
        400: '#37371b',
        500: '#454521',
        600: '#7c7c3c',
        700: '#afaf5a',
        800: '#caca91',
        900: '#e4e4c8'
      }
    },
    
    // Backup Settings
    autoBackup: true,
    backupFrequency: 'daily', // 'daily', 'weekly', 'monthly'
    
    // Security Settings
    sessionTimeout: 30, // minutes
    requirePasswordForRefunds: true,
    enableAuditLog: true
  })
  const [loading, setLoading] = useState(true)

  // Apply initial theme from localStorage immediately to prevent flash
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('posSettings')
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings)
        if (parsed.customTheme || parsed.themeColors) {
          // Apply theme immediately without waiting for Supabase
          themeManager.applyTheme(parsed.customTheme, parsed.themeColors)
          // Also update the current theme state to prevent conflicts
          setCurrentTheme({ theme: parsed.customTheme, colors: parsed.themeColors })
        }
      }
    } catch (error) {
      console.warn('Failed to load initial theme from localStorage:', error)
    }
  }, [])

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

  // Stable theme state to prevent flickering
  const [currentTheme, setCurrentTheme] = useState({ theme: null, colors: null })
  const themeUpdateRef = useRef(false)

  // Shuffle function for theme colors
  const shuffleThemeColors = useCallback(() => {
    if (settings.customTheme !== 'canefrost') return

    const colorKeys = Object.keys(settings.themeColors)
    const colorValues = colorKeys.map(key => settings.themeColors[key])
    
    // Fisher-Yates shuffle algorithm
    for (let i = colorValues.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[colorValues[i], colorValues[j]] = [colorValues[j], colorValues[i]]
    }
    
    // Create new shuffled theme colors
    const shuffledColors = {}
    colorKeys.forEach((key, index) => {
      shuffledColors[key] = colorValues[index]
    })
    
    // Update settings with shuffled colors
    setSettings(prev => ({
      ...prev,
      themeColors: shuffledColors
    }))
    
    // Apply the shuffled theme immediately
    themeManager.applyTheme('canefrost', shuffledColors)
    
    toast.success('Theme colors shuffled! 🎨')
  }, [settings.customTheme, settings.themeColors])
  
  // Apply theme only when explicitly changed, not on every settings update
  const applyThemeChange = useCallback((themeName, themeColors) => {
    if (themeUpdateRef.current) return // Prevent concurrent updates
    
    themeUpdateRef.current = true
    
    // Apply theme immediately without state update to prevent re-render
    themeManager.applyTheme(themeName, themeColors)
    
    // Update theme state after a delay to prevent loops
    setTimeout(() => {
      setCurrentTheme({ theme: themeName, colors: themeColors })
      themeUpdateRef.current = false
    }, 50)
  }, [])
  
  // Only apply theme on initial load or explicit theme changes
  useEffect(() => {
    // Skip if theme is already applied to prevent unnecessary re-applications
    if (settings.customTheme && settings.themeColors && 
        (settings.customTheme !== currentTheme.theme || 
         JSON.stringify(settings.themeColors) !== JSON.stringify(currentTheme.colors))) {
      applyThemeChange(settings.customTheme, settings.themeColors)
      
      // Persist theme to localStorage immediately
      try {
        const currentSettings = JSON.parse(localStorage.getItem('posSettings') || '{}')
        const updatedSettings = {
          ...currentSettings,
          customTheme: settings.customTheme,
          themeColors: settings.themeColors
        }
        localStorage.setItem('posSettings', JSON.stringify(updatedSettings))
      } catch (error) {
        console.warn('Failed to persist theme to localStorage:', error)
      }
    }
  }, [settings.customTheme, settings.themeColors, currentTheme, applyThemeChange])

  // Batching mechanism for settings updates
  const pendingUpdates = useRef({})
  const saveTimeoutRef = useRef(null)
  
  // Save settings to Supabase with batching - prevent duplicate saves
  const saveInProgress = useRef(false)
  
  const saveSettings = useCallback(async (newSettings) => {
    if (!currentUser) {
      console.error('SettingsContext: User not authenticated')
      toast.error('User not authenticated. Please log in again.')
      return
    }

    // Prevent duplicate saves
    if (saveInProgress.current) {
      return
    }

    // Batch the updates
    Object.assign(pendingUpdates.current, newSettings)
    
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    
    // Update local state only once
    setSettings(prevSettings => ({
      ...prevSettings,
      ...newSettings,
      updatedAt: new Date().toISOString()
    }))
    
    // Debounce the actual save operation
     saveTimeoutRef.current = setTimeout(async () => {
       if (saveInProgress.current) return // Double-check to prevent race conditions
       
       saveInProgress.current = true
       const settingsToSave = { ...pendingUpdates.current }
       pendingUpdates.current = {} // Clear pending updates
       
       console.log('SettingsContext: Attempting to save batched settings:', settingsToSave)

       try {
         const finalSettings = {
           ...settings,
           ...settingsToSave,
           updatedAt: new Date().toISOString()
         }
        
        console.log('SettingsContext: Saving to Supabase for user:', currentUser.id)
        
        const { error } = await supabase
          .from('user_settings')
          .upsert({
            user_id: currentUser.id,
            settings: finalSettings,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          })
        
        if (error) {
          if (error.code === '42P01') {
            console.log('Settings table not found, skipping save')
            return
          }
          throw error
        }
        
        // Also save to localStorage as backup
        try {
          localStorage.setItem('posSettings', JSON.stringify(finalSettings))
          console.log('SettingsContext: Settings also saved to localStorage')
        } catch (localStorageError) {
          console.warn('SettingsContext: Failed to save to localStorage:', localStorageError)
        }
        
        console.log('SettingsContext: Settings saved successfully')
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
       } finally {
         saveInProgress.current = false // Reset flag in all cases
       }
     }, 500) // Increased debounce time to reduce save frequency
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

  // Expose theme manager's applyTheme method
  const applyTheme = useCallback((themeName, themeColors) => {
    themeManager.applyTheme(themeName, themeColors)
  }, [])

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
    pointsToCurrency,
    applyTheme,
    shuffleThemeColors
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
    pointsToCurrency,
    applyTheme,
    shuffleThemeColors
  ])

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}