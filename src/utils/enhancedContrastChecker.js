// Enhanced Color Contrast Checker with Theme Validation
import ColorContrastChecker from 'color-contrast-checker';
import { parseColor, getContrastRatio } from './contrastTesting.js';

const ccc = new ColorContrastChecker();

/**
 * Enhanced contrast checker that validates color combinations
 * and provides accessible alternatives
 */
export class EnhancedContrastChecker {
  constructor() {
    this.minContrastAA = 4.5;
    this.minContrastAAA = 7;
    this.minContrastLargeAA = 3;
    this.minContrastLargeAAA = 4.5;
  }

  /**
   * Check if a color combination passes WCAG contrast requirements
   * @param {string} foreground - Foreground color (hex, rgb, hsl)
   * @param {string} background - Background color (hex, rgb, hsl)
   * @param {string} level - 'AA' or 'AAA'
   * @param {boolean} isLargeText - Whether text is large (18pt+ or 14pt+ bold)
   * @returns {object} Contrast validation result
   */
  validateContrast(foreground, background, level = 'AA', isLargeText = false) {
    try {
      // Convert colors to hex format for the library
      const fgHex = this.normalizeColorToHex(foreground);
      const bgHex = this.normalizeColorToHex(background);
      
      if (!fgHex || !bgHex) {
        return {
          isValid: false,
          ratio: 0,
          level: 'Fail',
          error: 'Invalid color format'
        };
      }

      // Calculate contrast ratio using both libraries for validation
      const ratio1 = ccc.getContrastRatio(fgHex, bgHex);
      const ratio2 = getContrastRatio(foreground, background);
      
      // Use the more accurate ratio (they should be similar)
      const ratio = Math.max(ratio1, ratio2);
      
      // Determine if it passes the required level
      const minRatio = this.getMinimumRatio(level, isLargeText);
      const isValid = ratio >= minRatio;
      
      // Determine the highest level it passes
      let passedLevel = 'Fail';
      if (ratio >= this.getMinimumRatio('AAA', isLargeText)) {
        passedLevel = 'AAA';
      } else if (ratio >= this.getMinimumRatio('AA', isLargeText)) {
        passedLevel = 'AA';
      }
      
      return {
        isValid,
        ratio: Math.round(ratio * 100) / 100,
        level: passedLevel,
        requiredRatio: minRatio,
        foreground: fgHex,
        background: bgHex
      };
    } catch (error) {
      return {
        isValid: false,
        ratio: 0,
        level: 'Fail',
        error: error.message
      };
    }
  }

  /**
   * Get minimum contrast ratio for a given level and text size
   * @param {string} level - 'AA' or 'AAA'
   * @param {boolean} isLargeText - Whether text is large
   * @returns {number} Minimum contrast ratio
   */
  getMinimumRatio(level, isLargeText) {
    if (level === 'AAA') {
      return isLargeText ? this.minContrastLargeAAA : this.minContrastAAA;
    }
    return isLargeText ? this.minContrastLargeAA : this.minContrastAA;
  }

  /**
   * Convert any color format to hex
   * @param {string} color - Color in any format
   * @returns {string|null} Hex color or null if invalid
   */
  normalizeColorToHex(color) {
    if (!color) return null;
    
    // If already hex, validate and return
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      if (/^[0-9A-Fa-f]{3}$|^[0-9A-Fa-f]{6}$/.test(hex)) {
        return color.length === 4 ? 
          `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}` : 
          color;
      }
      return null;
    }
    
    // Parse RGB values and convert to hex
    const rgb = parseColor(color);
    if (!rgb) return null;
    
    const [r, g, b] = rgb;
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }

  /**
   * Generate accessible color alternatives for a given background
   * @param {string} background - Background color
   * @param {string} level - Target WCAG level ('AA' or 'AAA')
   * @param {boolean} isLargeText - Whether text is large
   * @returns {object} Color alternatives
   */
  generateAccessibleAlternatives(background, level = 'AA', isLargeText = false) {
    const bgHex = this.normalizeColorToHex(background);
    if (!bgHex) {
      return { error: 'Invalid background color' };
    }

    const alternatives = {
      light: [],
      dark: [],
      recommended: null
    };

    // Test common accessible colors
    const testColors = {
      dark: ['#000000', '#1a1a1a', '#333333', '#4a4a4a', '#666666'],
      light: ['#ffffff', '#f5f5f5', '#e0e0e0', '#cccccc', '#b3b3b3']
    };

    // Test dark colors
    for (const color of testColors.dark) {
      const result = this.validateContrast(color, background, level, isLargeText);
      if (result.isValid) {
        alternatives.dark.push({
          color,
          ratio: result.ratio,
          level: result.level
        });
      }
    }

    // Test light colors
    for (const color of testColors.light) {
      const result = this.validateContrast(color, background, level, isLargeText);
      if (result.isValid) {
        alternatives.light.push({
          color,
          ratio: result.ratio,
          level: result.level
        });
      }
    }

    // Sort by contrast ratio (highest first)
    alternatives.dark.sort((a, b) => b.ratio - a.ratio);
    alternatives.light.sort((a, b) => b.ratio - a.ratio);

    // Recommend the best option
    const allAlternatives = [...alternatives.dark, ...alternatives.light];
    if (allAlternatives.length > 0) {
      alternatives.recommended = allAlternatives.reduce((best, current) => 
        current.ratio > best.ratio ? current : best
      );
    }

    return alternatives;
  }

  /**
   * Filter theme colors to only include accessible combinations
   * @param {object} themeColors - Theme color palette
   * @param {string} level - Target WCAG level ('AA' or 'AAA')
   * @returns {object} Filtered theme colors with accessibility info
   */
  filterAccessibleThemeColors(themeColors, level = 'AA') {
    const accessibleCombinations = [];
    const failedCombinations = [];
    const colorKeys = Object.keys(themeColors);

    // Test all color combinations
    for (let i = 0; i < colorKeys.length; i++) {
      for (let j = 0; j < colorKeys.length; j++) {
        if (i === j) continue;
        
        const fgKey = colorKeys[i];
        const bgKey = colorKeys[j];
        const fgColor = themeColors[fgKey]?.DEFAULT || themeColors[fgKey];
        const bgColor = themeColors[bgKey]?.DEFAULT || themeColors[bgKey];
        
        if (fgColor && bgColor) {
          const result = this.validateContrast(fgColor, bgColor, level);
          
          const combination = {
            foregroundKey: fgKey,
            backgroundKey: bgKey,
            foreground: fgColor,
            background: bgColor,
            ...result
          };
          
          if (result.isValid) {
            accessibleCombinations.push(combination);
          } else {
            failedCombinations.push(combination);
          }
        }
      }
    }

    return {
      accessible: accessibleCombinations.sort((a, b) => b.ratio - a.ratio),
      failed: failedCombinations.sort((a, b) => a.ratio - b.ratio),
      summary: {
        total: accessibleCombinations.length + failedCombinations.length,
        accessible: accessibleCombinations.length,
        failed: failedCombinations.length,
        accessibilityScore: Math.round(
          (accessibleCombinations.length / (accessibleCombinations.length + failedCombinations.length)) * 100
        )
      }
    };
  }

  /**
   * Shuffle theme colors while maintaining accessibility
   * @param {object} themeColors - Original theme colors
   * @param {string} level - Target WCAG level ('AA' or 'AAA')
   * @returns {object} Shuffled accessible theme colors
   */
  shuffleAccessibleColors(themeColors, level = 'AA') {
    const filtered = this.filterAccessibleThemeColors(themeColors, level);
    
    if (filtered.accessible.length === 0) {
      console.warn('No accessible color combinations found in theme');
      return themeColors; // Return original if no accessible combinations
    }

    // Create a new theme using only accessible combinations
    const shuffledTheme = { ...themeColors };
    const accessiblePairs = filtered.accessible;
    
    // Randomly select accessible combinations for key UI elements
    const keyElements = [
      { fg: 'primary', bg: 'background' },
      { fg: 'foreground', bg: 'background' },
      { fg: 'primary-foreground', bg: 'primary' },
      { fg: 'secondary-foreground', bg: 'secondary' },
      { fg: 'muted-foreground', bg: 'muted' }
    ];

    keyElements.forEach(element => {
      const suitablePairs = accessiblePairs.filter(pair => 
        pair.foregroundKey.includes(element.fg.split('-')[0]) ||
        pair.backgroundKey.includes(element.bg.split('-')[0])
      );
      
      if (suitablePairs.length > 0) {
        const randomPair = suitablePairs[Math.floor(Math.random() * suitablePairs.length)];
        if (shuffledTheme[element.fg]) {
          shuffledTheme[element.fg] = randomPair.foreground;
        }
        if (shuffledTheme[element.bg]) {
          shuffledTheme[element.bg] = randomPair.background;
        }
      }
    });

    return shuffledTheme;
  }

  /**
   * Validate an entire theme for accessibility
   * @param {object} themeColors - Theme color palette
   * @param {string} level - Target WCAG level ('AA' or 'AAA')
   * @returns {object} Theme validation report
   */
  validateTheme(themeColors, level = 'AA') {
    const filtered = this.filterAccessibleThemeColors(themeColors, level);
    
    // Check critical UI element combinations
    const criticalCombinations = [
      { fg: 'foreground', bg: 'background', name: 'Main Text' },
      { fg: 'primary-foreground', bg: 'primary', name: 'Primary Button' },
      { fg: 'secondary-foreground', bg: 'secondary', name: 'Secondary Button' },
      { fg: 'muted-foreground', bg: 'muted', name: 'Muted Text' },
      { fg: 'card-foreground', bg: 'card', name: 'Card Content' }
    ];

    const criticalResults = criticalCombinations.map(combo => {
      const fgColor = themeColors[combo.fg]?.DEFAULT || themeColors[combo.fg];
      const bgColor = themeColors[combo.bg]?.DEFAULT || themeColors[combo.bg];
      
      if (fgColor && bgColor) {
        const result = this.validateContrast(fgColor, bgColor, level);
        return {
          name: combo.name,
          foregroundKey: combo.fg,
          backgroundKey: combo.bg,
          ...result
        };
      }
      
      return {
        name: combo.name,
        foregroundKey: combo.fg,
        backgroundKey: combo.bg,
        isValid: false,
        error: 'Color not found in theme'
      };
    });

    const criticalPassing = criticalResults.filter(r => r.isValid).length;
    const criticalTotal = criticalResults.length;

    return {
      overall: filtered,
      critical: {
        results: criticalResults,
        passing: criticalPassing,
        total: criticalTotal,
        score: Math.round((criticalPassing / criticalTotal) * 100)
      },
      recommendations: this.generateThemeRecommendations(criticalResults, themeColors, level)
    };
  }

  /**
   * Generate recommendations for improving theme accessibility
   * @param {Array} criticalResults - Critical combination test results
   * @param {object} themeColors - Original theme colors
   * @param {string} level - Target WCAG level
   * @returns {Array} Recommendations
   */
  generateThemeRecommendations(criticalResults, themeColors, level) {
    const recommendations = [];

    criticalResults.forEach(result => {
      if (!result.isValid && result.background) {
        const alternatives = this.generateAccessibleAlternatives(
          result.background, 
          level
        );
        
        if (alternatives.recommended) {
          recommendations.push({
            element: result.name,
            issue: `Contrast ratio ${result.ratio} is below ${result.requiredRatio}`,
            suggestion: `Use ${alternatives.recommended.color} for text`,
            currentForeground: result.foreground,
            recommendedForeground: alternatives.recommended.color,
            background: result.background,
            newRatio: alternatives.recommended.ratio
          });
        }
      }
    });

    return recommendations;
  }
}

// Create a singleton instance
export const contrastChecker = new EnhancedContrastChecker();

// Export utility functions for backward compatibility
export const validateContrast = (fg, bg, level, isLarge) => 
  contrastChecker.validateContrast(fg, bg, level, isLarge);

export const generateAccessibleAlternatives = (bg, level, isLarge) => 
  contrastChecker.generateAccessibleAlternatives(bg, level, isLarge);

export const filterAccessibleThemeColors = (colors, level) => 
  contrastChecker.filterAccessibleThemeColors(colors, level);

export const shuffleAccessibleColors = (colors, level) => 
  contrastChecker.shuffleAccessibleColors(colors, level);

export const validateTheme = (colors, level) => 
  contrastChecker.validateTheme(colors, level);