import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { 
  generateHighContrastTheme, 
  createSkipLink, 
  announceToScreenReader,
  auditThemeContrast,
  auditPageContrast
} from '../utils/accessibility'

const AccessibilityContext = createContext()

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext)
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider')
  }
  return context
}

export const AccessibilityProvider = ({ children }) => {
  const [highContrastMode, setHighContrastMode] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [fontSize, setFontSize] = useState('normal') // 'small', 'normal', 'large', 'extra-large'
  const [skipLinksEnabled, setSkipLinksEnabled] = useState(true)
  const [screenReaderMode, setScreenReaderMode] = useState(false)
  const [keyboardNavigation, setKeyboardNavigation] = useState(false)
  const [contrastAuditResults, setContrastAuditResults] = useState([])

  // Initialize accessibility preferences from localStorage
  useEffect(() => {
    const savedPreferences = localStorage.getItem('accessibility-preferences')
    if (savedPreferences) {
      try {
        const preferences = JSON.parse(savedPreferences)
        setHighContrastMode(preferences.highContrastMode || false)
        setReducedMotion(preferences.reducedMotion || false)
        setFontSize(preferences.fontSize || 'normal')
        setSkipLinksEnabled(preferences.skipLinksEnabled !== false)
        setScreenReaderMode(preferences.screenReaderMode || false)
      } catch (error) {
        console.error('Error loading accessibility preferences:', error)
      }
    }

    // Check for system preferences
    if (window.matchMedia) {
      // Check for reduced motion preference
      const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
      setReducedMotion(motionQuery.matches)
      motionQuery.addEventListener('change', (e) => setReducedMotion(e.matches))

      // Check for high contrast preference
      const contrastQuery = window.matchMedia('(prefers-contrast: high)')
      if (contrastQuery.matches && !localStorage.getItem('accessibility-preferences')) {
        setHighContrastMode(true)
      }
      contrastQuery.addEventListener('change', (e) => {
        if (e.matches) setHighContrastMode(true)
      })
    }

    // Detect keyboard navigation
    const handleKeyDown = (e) => {
      if (e.key === 'Tab') {
        setKeyboardNavigation(true)
        document.body.classList.add('keyboard-navigation')
      }
    }

    const handleMouseDown = () => {
      setKeyboardNavigation(false)
      document.body.classList.remove('keyboard-navigation')
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleMouseDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleMouseDown)
    }
  }, [])

  // Save preferences to localStorage
  useEffect(() => {
    const preferences = {
      highContrastMode,
      reducedMotion,
      fontSize,
      skipLinksEnabled,
      screenReaderMode
    }
    localStorage.setItem('accessibility-preferences', JSON.stringify(preferences))
  }, [highContrastMode, reducedMotion, fontSize, skipLinksEnabled, screenReaderMode])

  // Apply high contrast mode
  useEffect(() => {
    const root = document.documentElement
    
    if (highContrastMode) {
      root.classList.add('high-contrast')
      // Apply high contrast CSS custom properties
      const highContrastColors = generateHighContrastTheme({})
      Object.entries(highContrastColors).forEach(([key, value]) => {
        root.style.setProperty(`--${key}`, value)
      })
      announceToScreenReader('High contrast mode enabled')
    } else {
      root.classList.remove('high-contrast')
      // Remove high contrast overrides (let theme context handle normal colors)
      const highContrastColors = generateHighContrastTheme({})
      Object.keys(highContrastColors).forEach(key => {
        root.style.removeProperty(`--${key}`)
      })
    }
  }, [highContrastMode])

  // Apply reduced motion
  useEffect(() => {
    const root = document.documentElement
    
    if (reducedMotion) {
      root.classList.add('reduced-motion')
    } else {
      root.classList.remove('reduced-motion')
    }
  }, [reducedMotion])

  // Apply font size
  useEffect(() => {
    const root = document.documentElement
    
    // Remove existing font size classes
    root.classList.remove('font-small', 'font-normal', 'font-large', 'font-extra-large')
    
    // Add new font size class
    root.classList.add(`font-${fontSize}`)
  }, [fontSize])

  // Add skip links
  useEffect(() => {
    if (skipLinksEnabled) {
      const skipLink = createSkipLink('main-content')
      skipLink.id = 'skip-to-main'
      
      // Insert at the beginning of body
      if (document.body && !document.getElementById('skip-to-main')) {
        document.body.insertBefore(skipLink, document.body.firstChild)
      }
    } else {
      const existingSkipLink = document.getElementById('skip-to-main')
      if (existingSkipLink) {
        existingSkipLink.remove()
      }
    }

    return () => {
      const existingSkipLink = document.getElementById('skip-to-main')
      if (existingSkipLink) {
        existingSkipLink.remove()
      }
    }
  }, [skipLinksEnabled])

  // Functions to toggle accessibility features
  const toggleHighContrast = () => {
    setHighContrastMode(prev => {
      const newValue = !prev
      announceToScreenReader(
        newValue ? 'High contrast mode enabled' : 'High contrast mode disabled'
      )
      return newValue
    })
  }

  const toggleReducedMotion = () => {
    setReducedMotion(prev => {
      const newValue = !prev
      announceToScreenReader(
        newValue ? 'Reduced motion enabled' : 'Reduced motion disabled'
      )
      return newValue
    })
  }

  const changeFontSize = (size) => {
    setFontSize(size)
    announceToScreenReader(`Font size changed to ${size}`)
  }

  const toggleSkipLinks = () => {
    setSkipLinksEnabled(prev => {
      const newValue = !prev
      announceToScreenReader(
        newValue ? 'Skip navigation links enabled' : 'Skip navigation links disabled'
      )
      return newValue
    })
  }

  const toggleScreenReaderMode = () => {
    setScreenReaderMode(prev => {
      const newValue = !prev
      announceToScreenReader(
        newValue ? 'Screen reader optimizations enabled' : 'Screen reader optimizations disabled'
      )
      return newValue
    })
  }

  // Run contrast audit
  const runContrastAudit = useCallback(async () => {
    try {
      // Run comprehensive page contrast audit
      const pageResults = await auditPageContrast()
      
      // Filter to show only failing elements and limit results
      const failingElements = pageResults
        .filter(result => !result.meetsAA)
        .slice(0, 20) // Limit to first 20 failing elements
        .map(result => ({
          selector: result.selector,
          ratio: result.ratio,
          textColor: result.textColor,
          backgroundColor: result.backgroundColor,
          isLargeText: result.isLargeText,
          meetsAA: result.meetsAA,
          meetsAAA: result.meetsAAA
        }))
      
      setContrastAuditResults(failingElements)
      
      const totalElements = pageResults.length
      const failingCount = pageResults.filter(r => !r.meetsAA).length
      const passingCount = totalElements - failingCount
      
      announceToScreenReader(
        `Contrast audit completed. ${passingCount} of ${totalElements} elements pass WCAG AA standards. ${failingCount} elements need attention.`
      )
    } catch (error) {
      console.error('Error running contrast audit:', error)
      announceToScreenReader('Error running contrast audit')
    }
  }, [])

  // Audit current theme colors
  const auditCurrentTheme = (themeColors) => {
    const results = auditThemeContrast(themeColors)
    setContrastAuditResults(results)
    return results
  }

  // Reset all accessibility settings
  const resetAccessibilitySettings = () => {
    setHighContrastMode(false)
    setReducedMotion(false)
    setFontSize('normal')
    setSkipLinksEnabled(true)
    setScreenReaderMode(false)
    localStorage.removeItem('accessibility-preferences')
    announceToScreenReader('Accessibility settings reset to defaults')
  }

  const value = {
    // State
    highContrastMode,
    reducedMotion,
    fontSize,
    skipLinksEnabled,
    screenReaderMode,
    keyboardNavigation,
    contrastAuditResults,
    
    // Actions
    toggleHighContrast,
    toggleReducedMotion,
    changeFontSize,
    toggleSkipLinks,
    toggleScreenReaderMode,
    auditCurrentTheme,
    runContrastAudit,
    resetAccessibilitySettings,
    announceToScreenReader
  }

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  )
}

export default AccessibilityContext