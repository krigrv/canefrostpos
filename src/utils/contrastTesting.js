// WCAG 2.1 AA Color Contrast Testing Utilities

/**
 * Calculate relative luminance of a color
 * @param {string} color - Color in hex, rgb, or rgba format
 * @returns {number} Relative luminance value
 */
export function getRelativeLuminance(color) {
  const rgb = parseColor(color)
  if (!rgb) return 0

  const [r, g, b] = rgb.map(c => {
    c = c / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })

  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/**
 * Parse color string to RGB values
 * @param {string} color - Color string
 * @returns {number[]|null} RGB values or null if invalid
 */
export function parseColor(color) {
  if (!color) return null

  // Remove whitespace
  color = color.trim()

  // Hex color
  if (color.startsWith('#')) {
    const hex = color.slice(1)
    if (hex.length === 3) {
      return [
        parseInt(hex[0] + hex[0], 16),
        parseInt(hex[1] + hex[1], 16),
        parseInt(hex[2] + hex[2], 16)
      ]
    } else if (hex.length === 6) {
      return [
        parseInt(hex.slice(0, 2), 16),
        parseInt(hex.slice(2, 4), 16),
        parseInt(hex.slice(4, 6), 16)
      ]
    }
  }

  // RGB/RGBA color
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/)
  if (rgbMatch) {
    return [parseInt(rgbMatch[1]), parseInt(rgbMatch[2]), parseInt(rgbMatch[3])]
  }

  // HSL color (convert to RGB)
  const hslMatch = color.match(/hsla?\((\d+),\s*(\d+)%,\s*(\d+)%(?:,\s*[\d.]+)?\)/)
  if (hslMatch) {
    const h = parseInt(hslMatch[1]) / 360
    const s = parseInt(hslMatch[2]) / 100
    const l = parseInt(hslMatch[3]) / 100
    return hslToRgb(h, s, l)
  }

  // Named colors (basic set)
  const namedColors = {
    black: [0, 0, 0],
    white: [255, 255, 255],
    red: [255, 0, 0],
    green: [0, 128, 0],
    blue: [0, 0, 255],
    yellow: [255, 255, 0],
    cyan: [0, 255, 255],
    magenta: [255, 0, 255],
    gray: [128, 128, 128],
    grey: [128, 128, 128]
  }

  return namedColors[color.toLowerCase()] || null
}

/**
 * Convert HSL to RGB
 * @param {number} h - Hue (0-1)
 * @param {number} s - Saturation (0-1)
 * @param {number} l - Lightness (0-1)
 * @returns {number[]} RGB values
 */
function hslToRgb(h, s, l) {
  let r, g, b

  if (s === 0) {
    r = g = b = l // achromatic
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1/6) return p + (q - p) * 6 * t
      if (t < 1/2) return q
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
      return p
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1/3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1/3)
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)]
}

/**
 * Calculate contrast ratio between two colors
 * @param {string} color1 - First color
 * @param {string} color2 - Second color
 * @returns {number} Contrast ratio
 */
export function getContrastRatio(color1, color2) {
  const lum1 = getRelativeLuminance(color1)
  const lum2 = getRelativeLuminance(color2)
  
  const lighter = Math.max(lum1, lum2)
  const darker = Math.min(lum1, lum2)
  
  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Check if contrast ratio meets WCAG standards
 * @param {number} ratio - Contrast ratio
 * @param {string} level - 'AA' or 'AAA'
 * @param {boolean} isLargeText - Whether text is large (18pt+ or 14pt+ bold)
 * @returns {boolean} Whether it meets the standard
 */
export function meetsWCAGStandard(ratio, level = 'AA', isLargeText = false) {
  if (level === 'AAA') {
    return isLargeText ? ratio >= 4.5 : ratio >= 7
  }
  return isLargeText ? ratio >= 3 : ratio >= 4.5
}

/**
 * Get computed styles for an element
 * @param {Element} element - DOM element
 * @returns {object} Computed styles
 */
function getComputedStyles(element) {
  return window.getComputedStyle(element)
}

/**
 * Get effective background color by traversing up the DOM
 * @param {Element} element - DOM element
 * @returns {string} Background color
 */
function getEffectiveBackgroundColor(element) {
  let current = element
  
  while (current && current !== document.body) {
    const styles = getComputedStyles(current)
    const bgColor = styles.backgroundColor
    
    if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
      return bgColor
    }
    
    current = current.parentElement
  }
  
  return 'rgb(255, 255, 255)' // Default to white
}

/**
 * Check if text is considered large
 * @param {Element} element - DOM element
 * @returns {boolean} Whether text is large
 */
function isLargeText(element) {
  const styles = getComputedStyles(element)
  const fontSize = parseFloat(styles.fontSize)
  const fontWeight = styles.fontWeight
  
  // 18pt = 24px, 14pt = 18.67px
  return fontSize >= 24 || (fontSize >= 18.67 && (fontWeight === 'bold' || parseInt(fontWeight) >= 700))
}

/**
 * Audit color contrast for all text elements on the page
 * @returns {Promise<Array>} Array of contrast audit results
 */
export async function auditPageContrast() {
  const results = []
  const textElements = document.querySelectorAll('*')
  
  for (const element of textElements) {
    // Skip elements without text content
    const textContent = element.textContent?.trim()
    if (!textContent || textContent.length === 0) continue
    
    // Skip elements that are not visible
    const styles = getComputedStyles(element)
    if (styles.display === 'none' || styles.visibility === 'hidden' || styles.opacity === '0') continue
    
    const textColor = styles.color
    const backgroundColor = getEffectiveBackgroundColor(element)
    
    if (textColor && backgroundColor) {
      const ratio = getContrastRatio(textColor, backgroundColor)
      const isLarge = isLargeText(element)
      const meetsAA = meetsWCAGStandard(ratio, 'AA', isLarge)
      const meetsAAA = meetsWCAGStandard(ratio, 'AAA', isLarge)
      
      // Generate a selector for the element
      let selector = element.tagName.toLowerCase()
      if (element.id) {
        selector += `#${element.id}`
      } else if (element.className) {
        const classes = element.className.split(' ').filter(c => c.trim()).slice(0, 2)
        if (classes.length > 0) {
          selector += `.${classes.join('.')}`
        }
      }
      
      results.push({
        element,
        selector,
        textColor,
        backgroundColor,
        ratio,
        isLargeText: isLarge,
        meetsAA,
        meetsAAA,
        textContent: textContent.substring(0, 50) + (textContent.length > 50 ? '...' : '')
      })
    }
  }
  
  // Sort by contrast ratio (worst first)
  return results.sort((a, b) => a.ratio - b.ratio)
}

/**
 * Generate high contrast color alternatives
 * @param {string} color - Original color
 * @param {string} background - Background color
 * @returns {object} High contrast alternatives
 */
export function generateHighContrastAlternatives(color, background) {
  const currentRatio = getContrastRatio(color, background)
  
  if (currentRatio >= 7) {
    return { color, ratio: currentRatio, level: 'AAA' }
  }
  
  // Try pure black or white
  const blackRatio = getContrastRatio('#000000', background)
  const whiteRatio = getContrastRatio('#ffffff', background)
  
  if (blackRatio >= 7) {
    return { color: '#000000', ratio: blackRatio, level: 'AAA' }
  }
  
  if (whiteRatio >= 7) {
    return { color: '#ffffff', ratio: whiteRatio, level: 'AAA' }
  }
  
  // Return the better option
  if (blackRatio > whiteRatio) {
    return { 
      color: '#000000', 
      ratio: blackRatio, 
      level: blackRatio >= 4.5 ? 'AA' : 'Fail' 
    }
  } else {
    return { 
      color: '#ffffff', 
      ratio: whiteRatio, 
      level: whiteRatio >= 4.5 ? 'AA' : 'Fail' 
    }
  }
}

/**
 * Create a comprehensive contrast report
 * @returns {Promise<object>} Detailed contrast report
 */
export async function generateContrastReport() {
  const auditResults = await auditPageContrast()
  
  const summary = {
    total: auditResults.length,
    passing: auditResults.filter(r => r.meetsAA).length,
    failing: auditResults.filter(r => !r.meetsAA).length,
    aaaCompliant: auditResults.filter(r => r.meetsAAA).length
  }
  
  const failingElements = auditResults.filter(r => !r.meetsAA)
  const recommendations = failingElements.map(element => ({
    selector: element.selector,
    currentRatio: element.ratio,
    recommendation: generateHighContrastAlternatives(element.textColor, element.backgroundColor)
  }))
  
  return {
    summary,
    auditResults,
    failingElements,
    recommendations,
    timestamp: new Date().toISOString()
  }
}