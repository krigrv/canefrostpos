// Keyboard Navigation Testing Utilities

/**
 * Check if an element is focusable
 * @param {Element} element - DOM element to check
 * @returns {boolean} Whether the element is focusable
 */
export function isFocusable(element) {
  if (!element || element.disabled) return false
  
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]'
  ]
  
  return focusableSelectors.some(selector => element.matches(selector))
}

/**
 * Get all focusable elements in a container
 * @param {Element} container - Container element
 * @returns {Element[]} Array of focusable elements
 */
export function getFocusableElements(container = document) {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]'
  ].join(', ')
  
  const elements = Array.from(container.querySelectorAll(focusableSelectors))
  
  return elements.filter(element => {
    const style = window.getComputedStyle(element)
    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0' &&
      element.offsetWidth > 0 &&
      element.offsetHeight > 0
    )
  })
}

/**
 * Check if element has visible focus indicator
 * @param {Element} element - Element to check
 * @returns {boolean} Whether element has visible focus
 */
export function hasVisibleFocus(element) {
  if (!element) return false
  
  const styles = window.getComputedStyle(element)
  const pseudoStyles = window.getComputedStyle(element, ':focus')
  
  // Check for outline
  if (pseudoStyles.outline && pseudoStyles.outline !== 'none' && pseudoStyles.outline !== '0') {
    return true
  }
  
  // Check for box-shadow
  if (pseudoStyles.boxShadow && pseudoStyles.boxShadow !== 'none') {
    return true
  }
  
  // Check for border changes
  if (pseudoStyles.border !== styles.border) {
    return true
  }
  
  // Check for background changes
  if (pseudoStyles.backgroundColor !== styles.backgroundColor) {
    return true
  }
  
  return false
}

/**
 * Test keyboard navigation for a container
 * @param {Element} container - Container to test
 * @returns {object} Test results
 */
export function testKeyboardNavigation(container = document) {
  const focusableElements = getFocusableElements(container)
  const results = {
    totalFocusable: focusableElements.length,
    elementsWithoutFocus: [],
    elementsWithoutLabels: [],
    elementsWithoutKeyboardHandlers: [],
    tabOrderIssues: [],
    recommendations: []
  }
  
  focusableElements.forEach((element, index) => {
    // Check for visible focus indicator
    if (!hasVisibleFocus(element)) {
      results.elementsWithoutFocus.push({
        element,
        selector: getElementSelector(element),
        tagName: element.tagName.toLowerCase()
      })
    }
    
    // Check for proper labeling
    if (!hasProperLabel(element)) {
      results.elementsWithoutLabels.push({
        element,
        selector: getElementSelector(element),
        tagName: element.tagName.toLowerCase()
      })
    }
    
    // Check for keyboard event handlers
    if (!hasKeyboardHandlers(element)) {
      results.elementsWithoutKeyboardHandlers.push({
        element,
        selector: getElementSelector(element),
        tagName: element.tagName.toLowerCase()
      })
    }
    
    // Check tab order
    const tabIndex = element.tabIndex
    if (tabIndex > 0) {
      results.tabOrderIssues.push({
        element,
        selector: getElementSelector(element),
        tabIndex,
        issue: 'Positive tabindex can cause tab order issues'
      })
    }
  })
  
  // Generate recommendations
  if (results.elementsWithoutFocus.length > 0) {
    results.recommendations.push(
      `${results.elementsWithoutFocus.length} elements lack visible focus indicators. Add CSS focus styles.`
    )
  }
  
  if (results.elementsWithoutLabels.length > 0) {
    results.recommendations.push(
      `${results.elementsWithoutLabels.length} elements lack proper labels. Add aria-label or associate with label elements.`
    )
  }
  
  if (results.elementsWithoutKeyboardHandlers.length > 0) {
    results.recommendations.push(
      `${results.elementsWithoutKeyboardHandlers.length} interactive elements may not be fully keyboard accessible.`
    )
  }
  
  if (results.tabOrderIssues.length > 0) {
    results.recommendations.push(
      `${results.tabOrderIssues.length} elements have positive tabindex values which can disrupt natural tab order.`
    )
  }
  
  return results
}

/**
 * Check if element has proper labeling
 * @param {Element} element - Element to check
 * @returns {boolean} Whether element has proper label
 */
function hasProperLabel(element) {
  const tagName = element.tagName.toLowerCase()
  
  // Elements that don't need labels
  if (['a', 'button'].includes(tagName) && element.textContent.trim()) {
    return true
  }
  
  // Check for aria-label
  if (element.getAttribute('aria-label')) {
    return true
  }
  
  // Check for aria-labelledby
  if (element.getAttribute('aria-labelledby')) {
    return true
  }
  
  // Check for associated label
  if (element.id) {
    const label = document.querySelector(`label[for="${element.id}"]`)
    if (label) return true
  }
  
  // Check if wrapped in label
  if (element.closest('label')) {
    return true
  }
  
  // Check for title attribute (not ideal but acceptable)
  if (element.getAttribute('title')) {
    return true
  }
  
  return false
}

/**
 * Check if element has keyboard event handlers
 * @param {Element} element - Element to check
 * @returns {boolean} Whether element has keyboard handlers
 */
function hasKeyboardHandlers(element) {
  const tagName = element.tagName.toLowerCase()
  
  // Native interactive elements are keyboard accessible by default
  if (['button', 'input', 'select', 'textarea', 'a'].includes(tagName)) {
    return true
  }
  
  // Check for keyboard event listeners
  const events = ['onkeydown', 'onkeyup', 'onkeypress']
  return events.some(event => element[event] || element.getAttribute(event))
}

/**
 * Generate a CSS selector for an element
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
 * Simulate keyboard navigation through focusable elements
 * @param {Element} container - Container to navigate
 * @returns {Promise<object>} Navigation test results
 */
export async function simulateKeyboardNavigation(container = document) {
  const focusableElements = getFocusableElements(container)
  const results = {
    totalElements: focusableElements.length,
    successfullyFocused: 0,
    failedToFocus: [],
    navigationPath: []
  }
  
  for (let i = 0; i < focusableElements.length; i++) {
    const element = focusableElements[i]
    
    try {
      element.focus()
      
      // Wait a bit for focus to settle
      await new Promise(resolve => setTimeout(resolve, 10))
      
      if (document.activeElement === element) {
        results.successfullyFocused++
        results.navigationPath.push({
          index: i,
          element,
          selector: getElementSelector(element),
          focused: true
        })
      } else {
        results.failedToFocus.push({
          index: i,
          element,
          selector: getElementSelector(element),
          reason: 'Element did not receive focus'
        })
      }
    } catch (error) {
      results.failedToFocus.push({
        index: i,
        element,
        selector: getElementSelector(element),
        reason: error.message
      })
    }
  }
  
  return results
}

/**
 * Test for keyboard traps
 * @param {Element} container - Container to test
 * @returns {object} Trap test results
 */
export function testForKeyboardTraps(container = document) {
  const focusableElements = getFocusableElements(container)
  const results = {
    potentialTraps: [],
    recommendations: []
  }
  
  // Look for elements that might trap focus
  focusableElements.forEach(element => {
    const tagName = element.tagName.toLowerCase()
    
    // Check for modals/dialogs without proper escape handling
    if (element.getAttribute('role') === 'dialog' || element.classList.contains('modal')) {
      const hasEscapeHandler = element.onkeydown || element.getAttribute('onkeydown')
      if (!hasEscapeHandler) {
        results.potentialTraps.push({
          element,
          selector: getElementSelector(element),
          issue: 'Modal/dialog may not handle Escape key properly'
        })
      }
    }
    
    // Check for custom dropdowns
    if (element.getAttribute('role') === 'listbox' || element.classList.contains('dropdown')) {
      const hasArrowHandlers = element.onkeydown || element.getAttribute('onkeydown')
      if (!hasArrowHandlers) {
        results.potentialTraps.push({
          element,
          selector: getElementSelector(element),
          issue: 'Dropdown may not handle arrow keys properly'
        })
      }
    }
  })
  
  if (results.potentialTraps.length > 0) {
    results.recommendations.push(
      'Ensure all interactive components handle keyboard navigation properly and provide escape mechanisms.'
    )
  }
  
  return results
}

/**
 * Generate comprehensive keyboard accessibility report
 * @param {Element} container - Container to test
 * @returns {Promise<object>} Complete keyboard accessibility report
 */
export async function generateKeyboardAccessibilityReport(container = document) {
  const navigationTest = testKeyboardNavigation(container)
  const simulationTest = await simulateKeyboardNavigation(container)
  const trapTest = testForKeyboardTraps(container)
  
  const overallScore = calculateKeyboardScore(navigationTest, simulationTest, trapTest)
  
  return {
    score: overallScore,
    navigation: navigationTest,
    simulation: simulationTest,
    traps: trapTest,
    summary: {
      totalFocusableElements: navigationTest.totalFocusable,
      elementsWithIssues: navigationTest.elementsWithoutFocus.length + 
                          navigationTest.elementsWithoutLabels.length + 
                          navigationTest.elementsWithoutKeyboardHandlers.length,
      potentialTraps: trapTest.potentialTraps.length,
      overallAccessible: overallScore >= 80
    },
    recommendations: [
      ...navigationTest.recommendations,
      ...trapTest.recommendations
    ],
    timestamp: new Date().toISOString()
  }
}

/**
 * Calculate overall keyboard accessibility score
 * @param {object} navigationTest - Navigation test results
 * @param {object} simulationTest - Simulation test results
 * @param {object} trapTest - Trap test results
 * @returns {number} Score out of 100
 */
function calculateKeyboardScore(navigationTest, simulationTest, trapTest) {
  let score = 100
  
  // Deduct points for focus issues
  const focusIssues = navigationTest.elementsWithoutFocus.length
  score -= Math.min(focusIssues * 5, 30)
  
  // Deduct points for labeling issues
  const labelIssues = navigationTest.elementsWithoutLabels.length
  score -= Math.min(labelIssues * 3, 20)
  
  // Deduct points for keyboard handler issues
  const handlerIssues = navigationTest.elementsWithoutKeyboardHandlers.length
  score -= Math.min(handlerIssues * 4, 25)
  
  // Deduct points for tab order issues
  const tabOrderIssues = navigationTest.tabOrderIssues.length
  score -= Math.min(tabOrderIssues * 2, 10)
  
  // Deduct points for potential traps
  const trapIssues = trapTest.potentialTraps.length
  score -= Math.min(trapIssues * 10, 30)
  
  return Math.max(score, 0)
}