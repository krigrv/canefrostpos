// Accessibility utilities for WCAG 2.1 AA compliance

// Export contrast testing utilities
export {
  getRelativeLuminance,
  getContrastRatio,
  meetsWCAGStandard,
  auditPageContrast,
  generateContrastReport,
  generateHighContrastAlternatives
} from './contrastTesting.js'

// Export screen reader testing utilities
export {
  checkARIACompliance,
  analyzeLandmarks,
  analyzeHeadingStructure,
  analyzeFormAccessibility,
  generateScreenReaderReport
} from './screenReaderTesting.js'

// Export keyboard testing utilities
export {
  testKeyboardNavigation,
  generateKeyboardAccessibilityReport
} from './keyboardTesting.js'

// Export WCAG testing utilities
export {
  runWCAGCompliance,
  generateAccessibilityReport,
    testNonTextContent,
    testInfoAndRelationships,
    testContrastMinimum,
    testKeyboard,
    testBypassBlocks,
    testPageTitled,
    testHeadingsAndLabels,
    testLanguageOfPage,
    testNameRoleValue
  } from './wcagTesting.js'

/**
 * Check if color combination meets WCAG AA standards
 * @param {string} foreground - Foreground color
 * @param {string} background - Background color
 * @param {boolean} isLargeText - Whether text is large (18pt+ or 14pt+ bold)
 * @returns {boolean} Whether combination meets WCAG AA
 */
export function checkColorContrast(foreground, background, isLargeText = false) {
  return meetsWCAGStandard(foreground, background, 'AA', isLargeText)
}

/**
 * Audit all color combinations in the current theme
 * @param {object} themeColors - Theme color object
 * @returns {array} Array of contrast audit results
 */
export function auditThemeContrast(themeColors) {
  const results = []
  
  // Common color combinations to check
  const combinations = [
    { fg: 'raisin_black', bg: 'champagne', context: 'Body text on background' },
    { fg: 'white', bg: 'castleton_green', context: 'Primary button text' },
    { fg: 'white', bg: 'dark_spring_green', context: 'Secondary button text' },
    { fg: 'raisin_black', bg: 'rose_quartz', context: 'Muted text areas' },
    { fg: 'white', bg: 'drab_dark_brown', context: 'Accent elements' },
    { fg: 'raisin_black', bg: 'white', context: 'Card content' }
  ]
  
  combinations.forEach(combo => {
    if (themeColors[combo.fg] && themeColors[combo.bg]) {
      const fgColor = themeColors[combo.fg].DEFAULT || themeColors[combo.fg]
      const bgColor = themeColors[combo.bg].DEFAULT || themeColors[combo.bg]
      
      const ratio = getContrastRatio(fgColor, bgColor)
      
      results.push({
        context: combo.context,
        foreground: fgColor,
        background: bgColor,
        ratio,
        passesAA: meetsWCAGStandard(ratio, 'AA'),
        passesAALarge: meetsWCAGStandard(ratio, 'AA', true),
        passesAAA: meetsWCAGStandard(ratio, 'AAA'),
        passesAAALarge: meetsWCAGStandard(ratio, 'AAA', true)
      })
    }
  })
  
  return results
}

/**
 * Generate high contrast color alternatives
 * @param {object} themeColors - Original theme colors
 * @returns {object} High contrast theme colors
 */
export function generateHighContrastTheme(themeColors) {
  return {
    ...themeColors,
    // High contrast overrides
    background: '#000000',
    foreground: '#ffffff',
    primary: '#ffffff',
    'primary-foreground': '#000000',
    secondary: '#ffff00', // High contrast yellow
    'secondary-foreground': '#000000',
    muted: '#333333',
    'muted-foreground': '#ffffff',
    accent: '#00ffff', // High contrast cyan
    'accent-foreground': '#000000',
    destructive: '#ff0000',
    'destructive-foreground': '#ffffff',
    border: '#ffffff',
    input: '#000000',
    ring: '#ffffff'
  }
}

/**
 * Create skip navigation link
 * @param {string} targetId - ID of main content area
 * @returns {HTMLElement} Skip link element
 */
export function createSkipLink(targetId = 'main-content') {
  const skipLink = document.createElement('a')
  skipLink.href = `#${targetId}`
  skipLink.textContent = 'Skip to main content'
  skipLink.className = 'skip-link'
  
  // Add styles for skip link
  const styles = `
    .skip-link {
      position: absolute;
      top: -40px;
      left: 6px;
      background: #000;
      color: #fff;
      padding: 8px;
      text-decoration: none;
      border-radius: 4px;
      z-index: 9999;
      font-weight: bold;
      transition: top 0.3s;
    }
    .skip-link:focus {
      top: 6px;
    }
  `
  
  // Add styles to document if not already present
  if (!document.querySelector('#skip-link-styles')) {
    const styleSheet = document.createElement('style')
    styleSheet.id = 'skip-link-styles'
    styleSheet.textContent = styles
    document.head.appendChild(styleSheet)
  }
  
  return skipLink
}

/**
 * Add ARIA landmarks to improve navigation
 * @param {HTMLElement} element - Element to add landmark to
 * @param {string} role - ARIA role (banner, navigation, main, complementary, contentinfo)
 * @param {string} label - Accessible label for the landmark
 */
export function addARIALandmark(element, role, label) {
  element.setAttribute('role', role)
  if (label) {
    element.setAttribute('aria-label', label)
  }
}

/**
 * Enhance keyboard navigation for custom components
 * @param {HTMLElement} element - Element to enhance
 * @param {object} options - Configuration options
 */
export function enhanceKeyboardNavigation(element, options = {}) {
  const {
    role = 'button',
    tabIndex = 0,
    ariaLabel,
    onEnter,
    onSpace,
    onEscape
  } = options
  
  // Set ARIA attributes
  element.setAttribute('role', role)
  element.setAttribute('tabindex', tabIndex)
  if (ariaLabel) {
    element.setAttribute('aria-label', ariaLabel)
  }
  
  // Add keyboard event handlers
  element.addEventListener('keydown', (event) => {
    switch (event.key) {
      case 'Enter':
        if (onEnter) {
          event.preventDefault()
          onEnter(event)
        }
        break
      case ' ':
        if (onSpace) {
          event.preventDefault()
          onSpace(event)
        }
        break
      case 'Escape':
        if (onEscape) {
          event.preventDefault()
          onEscape(event)
        }
        break
    }
  })
}

/**
 * Screen reader announcements
 * @param {string} message - Message to announce
 * @param {string} priority - 'polite' or 'assertive'
 */
export function announceToScreenReader(message, priority = 'polite') {
  const announcement = document.createElement('div')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = message
  
  document.body.appendChild(announcement)
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

/**
 * Focus management utilities
 */
export const focusManagement = {
  /**
   * Trap focus within an element
   * @param {HTMLElement} element - Container element
   */
  trapFocus(element) {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]
    
    element.addEventListener('keydown', (event) => {
      if (event.key === 'Tab') {
        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault()
            lastElement.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault()
            firstElement.focus()
          }
        }
      }
    })
  },
  
  /**
   * Return focus to previous element
   * @param {HTMLElement} element - Element to focus
   */
  returnFocus(element) {
    if (element && typeof element.focus === 'function') {
      element.focus()
    }
  },
  
  /**
   * Get all focusable elements within a container
   * @param {HTMLElement} container - Container element
   * @returns {NodeList} Focusable elements
   */
  getFocusableElements(container) {
    return container.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
    )
  }
}

/**
 * Validate form accessibility
 * @param {HTMLFormElement} form - Form element to validate
 * @returns {object} Validation results
 */
export function validateFormAccessibility(form) {
  const issues = []
  const inputs = form.querySelectorAll('input, select, textarea')
  
  inputs.forEach((input, index) => {
    // Check for labels
    const hasLabel = input.labels && input.labels.length > 0
    const hasAriaLabel = input.hasAttribute('aria-label')
    const hasAriaLabelledBy = input.hasAttribute('aria-labelledby')
    
    if (!hasLabel && !hasAriaLabel && !hasAriaLabelledBy) {
      issues.push({
        element: input,
        issue: 'Missing label',
        severity: 'error',
        suggestion: 'Add a <label> element or aria-label attribute'
      })
    }
    
    // Check for required field indicators
    if (input.hasAttribute('required')) {
      const hasRequiredIndicator = input.hasAttribute('aria-required') || 
                                  input.closest('.form-group')?.querySelector('[aria-label*="required"]')
      
      if (!hasRequiredIndicator) {
        issues.push({
          element: input,
          issue: 'Required field not properly indicated',
          severity: 'warning',
          suggestion: 'Add aria-required="true" or visual required indicator'
        })
      }
    }
  })
  
  return {
    isAccessible: issues.filter(i => i.severity === 'error').length === 0,
    issues,
    score: Math.max(0, 100 - (issues.length * 10))
  }
}

export default {
  checkColorContrast,
  auditThemeContrast,
  generateHighContrastTheme,
  createSkipLink,
  addARIALandmark,
  enhanceKeyboardNavigation,
  announceToScreenReader,
  focusManagement,
  validateFormAccessibility
}