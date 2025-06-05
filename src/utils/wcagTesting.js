// WCAG 2.1 AA Compliance Testing Suite

import { 
  auditPageContrast, 
  generateContrastReport,
  generateScreenReaderReport,
  analyzeLandmarks,
  analyzeHeadingStructure,
  analyzeFormAccessibility
} from './accessibility.js'

import {
  testKeyboardNavigation,
  generateKeyboardAccessibilityReport
} from './keyboardTesting.js'

/**
 * WCAG 2.1 Success Criteria mapping
 */
const WCAG_CRITERIA = {
  // Perceivable
  '1.1.1': 'Non-text Content',
  '1.2.1': 'Audio-only and Video-only (Prerecorded)',
  '1.2.2': 'Captions (Prerecorded)',
  '1.2.3': 'Audio Description or Media Alternative (Prerecorded)',
  '1.3.1': 'Info and Relationships',
  '1.3.2': 'Meaningful Sequence',
  '1.3.3': 'Sensory Characteristics',
  '1.4.1': 'Use of Color',
  '1.4.2': 'Audio Control',
  '1.4.3': 'Contrast (Minimum)',
  '1.4.4': 'Resize text',
  '1.4.5': 'Images of Text',
  
  // Operable
  '2.1.1': 'Keyboard',
  '2.1.2': 'No Keyboard Trap',
  '2.1.4': 'Character Key Shortcuts',
  '2.2.1': 'Timing Adjustable',
  '2.2.2': 'Pause, Stop, Hide',
  '2.3.1': 'Three Flashes or Below Threshold',
  '2.4.1': 'Bypass Blocks',
  '2.4.2': 'Page Titled',
  '2.4.3': 'Focus Order',
  '2.4.4': 'Link Purpose (In Context)',
  '2.4.5': 'Multiple Ways',
  '2.4.6': 'Headings and Labels',
  '2.4.7': 'Focus Visible',
  
  // Understandable
  '3.1.1': 'Language of Page',
  '3.1.2': 'Language of Parts',
  '3.2.1': 'On Focus',
  '3.2.2': 'On Input',
  '3.3.1': 'Error Identification',
  '3.3.2': 'Labels or Instructions',
  '3.3.3': 'Error Suggestion',
  '3.3.4': 'Error Prevention (Legal, Financial, Data)',
  
  // Robust
  '4.1.1': 'Parsing',
  '4.1.2': 'Name, Role, Value',
  '4.1.3': 'Status Messages'
}

/**
 * Test WCAG 1.1.1 - Non-text Content
 * @param {Element} container - Container to test
 * @returns {object} Test results
 */
export function testNonTextContent(container = document) {
  const images = Array.from(container.querySelectorAll('img'))
  const issues = []
  const recommendations = []
  
  images.forEach(img => {
    const alt = img.getAttribute('alt')
    const ariaLabel = img.getAttribute('aria-label')
    const ariaLabelledby = img.getAttribute('aria-labelledby')
    const role = img.getAttribute('role')
    
    if (role === 'presentation' || role === 'none') {
      // Decorative images should have empty alt
      if (alt !== '') {
        issues.push(`Decorative image has non-empty alt text: ${getElementSelector(img)}`)
      }
    } else {
      // Content images need alt text
      if (!alt && !ariaLabel && !ariaLabelledby) {
        issues.push(`Image missing alt text: ${getElementSelector(img)}`)
        recommendations.push('Add descriptive alt text to images')
      }
    }
  })
  
  return {
    criterion: '1.1.1',
    name: WCAG_CRITERIA['1.1.1'],
    level: 'A',
    passed: issues.length === 0,
    issues,
    recommendations,
    elementsChecked: images.length
  }
}

/**
 * Test WCAG 1.3.1 - Info and Relationships
 * @param {Element} container - Container to test
 * @returns {object} Test results
 */
export function testInfoAndRelationships(container = document) {
  const issues = []
  const recommendations = []
  
  // Check form labels
  const inputs = Array.from(container.querySelectorAll('input, select, textarea'))
  inputs.forEach(input => {
    const id = input.id
    const ariaLabel = input.getAttribute('aria-label')
    const ariaLabelledby = input.getAttribute('aria-labelledby')
    const associatedLabel = id ? container.querySelector(`label[for="${id}"]`) : null
    const wrappingLabel = input.closest('label')
    
    if (!ariaLabel && !ariaLabelledby && !associatedLabel && !wrappingLabel) {
      issues.push(`Form control missing label: ${getElementSelector(input)}`)
    }
  })
  
  // Check table headers
  const tables = Array.from(container.querySelectorAll('table'))
  tables.forEach(table => {
    const headers = table.querySelectorAll('th')
    const cells = table.querySelectorAll('td')
    
    if (headers.length === 0 && cells.length > 0) {
      issues.push(`Table missing header cells: ${getElementSelector(table)}`)
    }
    
    // Check for scope attributes on complex tables
    if (headers.length > 0) {
      const hasScope = Array.from(headers).some(th => th.hasAttribute('scope'))
      const hasHeaders = Array.from(cells).some(td => td.hasAttribute('headers'))
      
      if (!hasScope && !hasHeaders && isComplexTable(table)) {
        recommendations.push('Use scope or headers attributes for complex tables')
      }
    }
  })
  
  // Check heading hierarchy
  const headings = Array.from(container.querySelectorAll('h1, h2, h3, h4, h5, h6'))
  for (let i = 1; i < headings.length; i++) {
    const current = parseInt(headings[i].tagName.charAt(1))
    const previous = parseInt(headings[i - 1].tagName.charAt(1))
    
    if (current > previous + 1) {
      issues.push(`Heading level skipped: h${previous} to h${current}`)
    }
  }
  
  if (issues.length === 0 && recommendations.length === 0) {
    recommendations.push('Ensure programmatic relationships are maintained')
  }
  
  return {
    criterion: '1.3.1',
    name: WCAG_CRITERIA['1.3.1'],
    level: 'A',
    passed: issues.length === 0,
    issues,
    recommendations,
    elementsChecked: inputs.length + tables.length + headings.length
  }
}

/**
 * Test WCAG 1.4.3 - Contrast (Minimum)
 * @param {Element} container - Container to test
 * @returns {object} Test results
 */
export function testContrastMinimum(container = document) {
  const contrastResults = auditPageContrast(container)
  
  // auditPageContrast returns an array of results, not an object with failingElements
  const failingElements = Array.isArray(contrastResults) ? 
    contrastResults.filter(result => !result.meetsAA) : []
  const totalElements = Array.isArray(contrastResults) ? contrastResults.length : 0
  
  return {
    criterion: '1.4.3',
    name: WCAG_CRITERIA['1.4.3'],
    level: 'AA',
    passed: failingElements.length === 0,
    issues: failingElements.map(el => 
      `Low contrast: ${el.selector} (${el.ratio.toFixed(2)}, needs ${el.isLargeText ? '3:1' : '4.5:1'})`
    ),
    recommendations: failingElements.length > 0 ? 
      ['Increase color contrast to meet WCAG AA standards'] : [],
    elementsChecked: totalElements,
    details: contrastResults
  }
}

/**
 * Test WCAG 2.1.1 - Keyboard
 * @param {Element} container - Container to test
 * @returns {object} Test results
 */
export function testKeyboard(container = document) {
  const keyboardResults = testKeyboardNavigation(container)
  
  // Calculate score based on issues found
  const totalIssues = (keyboardResults.elementsWithoutFocus?.length || 0) +
                     (keyboardResults.elementsWithoutLabels?.length || 0) +
                     (keyboardResults.elementsWithoutKeyboardHandlers?.length || 0) +
                     (keyboardResults.tabOrderIssues?.length || 0)
  
  const totalElements = keyboardResults.totalFocusable || 0
  const score = totalElements > 0 ? Math.max(0, ((totalElements - totalIssues) / totalElements) * 100) : 100
  
  const issues = [
    ...(keyboardResults.elementsWithoutFocus?.map(el => `No focus indicator: ${el.selector}`) || []),
    ...(keyboardResults.elementsWithoutLabels?.map(el => `Missing label: ${el.selector}`) || []),
    ...(keyboardResults.elementsWithoutKeyboardHandlers?.map(el => `No keyboard handler: ${el.selector}`) || []),
    ...(keyboardResults.tabOrderIssues?.map(el => `Tab order issue: ${el.selector}`) || [])
  ]
  
  return {
    criterion: '2.1.1',
    name: WCAG_CRITERIA['2.1.1'],
    level: 'A',
    passed: score >= 80,
    issues: issues,
    recommendations: keyboardResults.recommendations || [],
    elementsChecked: totalElements,
    details: keyboardResults
  }
}

/**
 * Test WCAG 2.4.1 - Bypass Blocks
 * @param {Element} container - Container to test
 * @returns {object} Test results
 */
export function testBypassBlocks(container = document) {
  const skipLinks = Array.from(container.querySelectorAll('a[href^="#"]'))
  const skipToMain = skipLinks.some(link => 
    link.textContent.toLowerCase().includes('skip') &&
    (link.textContent.toLowerCase().includes('main') || 
     link.textContent.toLowerCase().includes('content'))
  )
  
  const landmarks = analyzeLandmarks(container)
  const hasMainLandmark = landmarks.landmarks.main.length > 0
  
  const issues = []
  const recommendations = []
  
  if (!skipToMain && !hasMainLandmark) {
    issues.push('No skip navigation mechanism found')
    recommendations.push('Add skip links or ARIA landmarks')
  }
  
  return {
    criterion: '2.4.1',
    name: WCAG_CRITERIA['2.4.1'],
    level: 'A',
    passed: skipToMain || hasMainLandmark,
    issues,
    recommendations,
    elementsChecked: skipLinks.length + Object.values(landmarks.landmarks).flat().length
  }
}

/**
 * Test WCAG 2.4.2 - Page Titled
 * @param {Element} container - Container to test
 * @returns {object} Test results
 */
export function testPageTitled(container = document) {
  const title = document.title
  const issues = []
  const recommendations = []
  
  if (!title || title.trim().length === 0) {
    issues.push('Page missing title')
    recommendations.push('Add descriptive page title')
  } else if (title.trim().length < 3) {
    issues.push('Page title too short')
    recommendations.push('Use more descriptive page title')
  }
  
  return {
    criterion: '2.4.2',
    name: WCAG_CRITERIA['2.4.2'],
    level: 'A',
    passed: issues.length === 0,
    issues,
    recommendations,
    elementsChecked: 1
  }
}

/**
 * Test WCAG 2.4.6 - Headings and Labels
 * @param {Element} container - Container to test
 * @returns {object} Test results
 */
export function testHeadingsAndLabels(container = document) {
  const headingAnalysis = analyzeHeadingStructure(container)
  const formAnalysis = analyzeFormAccessibility(container)
  
  const allIssues = [...headingAnalysis.issues, ...formAnalysis.issues]
  const allRecommendations = [...headingAnalysis.recommendations, ...formAnalysis.recommendations]
  
  return {
    criterion: '2.4.6',
    name: WCAG_CRITERIA['2.4.6'],
    level: 'AA',
    passed: allIssues.length === 0,
    issues: allIssues,
    recommendations: allRecommendations,
    elementsChecked: headingAnalysis.headings.length + formAnalysis.inputs
  }
}

/**
 * Test WCAG 3.1.1 - Language of Page
 * @param {Element} container - Container to test
 * @returns {object} Test results
 */
export function testLanguageOfPage(container = document) {
  const htmlElement = document.documentElement
  const lang = htmlElement.getAttribute('lang')
  
  const issues = []
  const recommendations = []
  
  if (!lang) {
    issues.push('Page missing lang attribute')
    recommendations.push('Add lang attribute to html element')
  } else if (lang.length < 2) {
    issues.push('Invalid lang attribute value')
    recommendations.push('Use valid language code (e.g., "en", "es", "fr")')
  }
  
  return {
    criterion: '3.1.1',
    name: WCAG_CRITERIA['3.1.1'],
    level: 'A',
    passed: issues.length === 0,
    issues,
    recommendations,
    elementsChecked: 1
  }
}

/**
 * Test WCAG 4.1.2 - Name, Role, Value
 * @param {Element} container - Container to test
 * @returns {object} Test results
 */
export function testNameRoleValue(container = document) {
  const screenReaderResults = generateScreenReaderReport(container)
  const ariaIssues = screenReaderResults.ariaCompliance
    .filter(item => item.compliance.issues.length > 0)
    .flatMap(item => item.compliance.issues)
  
  return {
    criterion: '4.1.2',
    name: WCAG_CRITERIA['4.1.2'],
    level: 'A',
    passed: ariaIssues.length === 0,
    issues: ariaIssues,
    recommendations: screenReaderResults.recommendations,
    elementsChecked: screenReaderResults.summary.interactiveElements,
    details: screenReaderResults
  }
}

/**
 * Run comprehensive WCAG 2.1 AA compliance test
 * @param {Element} container - Container to test
 * @returns {object} Complete WCAG compliance report
 */
export function runWCAGCompliance(container = document) {
  const tests = [
    testNonTextContent,
    testInfoAndRelationships,
    testContrastMinimum,
    testKeyboard,
    testBypassBlocks,
    testPageTitled,
    testHeadingsAndLabels,
    testLanguageOfPage,
    testNameRoleValue
  ]
  
  const results = tests.map(test => {
    try {
      return test(container)
    } catch (error) {
      console.error(`WCAG test failed:`, error)
      return {
        criterion: 'unknown',
        name: 'Test Error',
        level: 'A',
        passed: false,
        issues: [`Test execution failed: ${error.message}`],
        recommendations: ['Fix test execution error'],
        elementsChecked: 0
      }
    }
  })
  
  const totalTests = results.length
  const passedTests = results.filter(r => r.passed).length
  const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0)
  const totalElements = results.reduce((sum, r) => sum + r.elementsChecked, 0)
  
  const complianceScore = Math.round((passedTests / totalTests) * 100)
  const overallGrade = getComplianceGrade(complianceScore)
  
  return {
    score: complianceScore,
    grade: overallGrade,
    summary: {
      totalTests,
      passedTests,
      failedTests: totalTests - passedTests,
      totalIssues,
      totalElements,
      timestamp: new Date().toISOString()
    },
    results,
    recommendations: results.flatMap(r => r.recommendations)
      .filter((rec, index, arr) => arr.indexOf(rec) === index), // Remove duplicates
    criticalIssues: results.filter(r => !r.passed && r.level === 'A'),
    aaIssues: results.filter(r => !r.passed && r.level === 'AA')
  }
}

/**
 * Get compliance grade based on score
 * @param {number} score - Compliance score (0-100)
 * @returns {string} Grade letter
 */
function getComplianceGrade(score) {
  if (score >= 95) return 'A+'
  if (score >= 90) return 'A'
  if (score >= 85) return 'A-'
  if (score >= 80) return 'B+'
  if (score >= 75) return 'B'
  if (score >= 70) return 'B-'
  if (score >= 65) return 'C+'
  if (score >= 60) return 'C'
  if (score >= 55) return 'C-'
  if (score >= 50) return 'D'
  return 'F'
}

/**
 * Check if table is complex (has merged cells or multiple header levels)
 * @param {Element} table - Table element
 * @returns {boolean} Whether table is complex
 */
function isComplexTable(table) {
  const cells = Array.from(table.querySelectorAll('td, th'))
  return cells.some(cell => 
    cell.hasAttribute('colspan') || 
    cell.hasAttribute('rowspan') ||
    parseInt(cell.getAttribute('colspan') || '1') > 1 ||
    parseInt(cell.getAttribute('rowspan') || '1') > 1
  )
}

/**
 * Generate CSS selector for element
 * @param {Element} element - Element to generate selector for
 * @returns {string} CSS selector
 */
function getElementSelector(element) {
  if (element.id) {
    return `#${element.id}`
  }
  
  let selector = element.tagName.toLowerCase()
  
  if (element.className) {
    const classes = element.className.split(' ').filter(c => c.trim()).slice(0, 2)
    if (classes.length > 0) {
      selector += `.${classes.join('.')}`
    }
  }
  
  return selector
}

/**
 * Export comprehensive accessibility testing function
 * @param {Element} container - Container to test
 * @returns {object} Complete accessibility report
 */
export function generateAccessibilityReport(container = document) {
  const wcagResults = runWCAGCompliance(container)
  const contrastReport = generateContrastReport(container)
  const screenReaderReport = generateScreenReaderReport(container)
  const keyboardReport = generateKeyboardAccessibilityReport(container)
  
  return {
    wcag: wcagResults,
    contrast: contrastReport,
    screenReader: screenReaderReport,
    keyboard: keyboardReport,
    overall: {
      score: Math.round((wcagResults.score + screenReaderReport.score + keyboardReport.score) / 3),
      grade: getComplianceGrade(Math.round((wcagResults.score + screenReaderReport.score + keyboardReport.score) / 3)),
      timestamp: new Date().toISOString()
    }
  }
}