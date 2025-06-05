// Screen Reader Testing Utilities

/**
 * Check if element has proper ARIA attributes
 * @param {Element} element - Element to check
 * @returns {object} ARIA compliance results
 */
export function checkARIACompliance(element) {
  const results = {
    hasRole: false,
    hasLabel: false,
    hasDescription: false,
    hasState: false,
    hasProperties: false,
    issues: [],
    recommendations: []
  }
  
  const tagName = element.tagName.toLowerCase()
  const role = element.getAttribute('role')
  
  // Check for role
  if (role) {
    results.hasRole = true
  } else if (!isSemanticElement(element)) {
    results.issues.push('Missing role attribute for non-semantic element')
    results.recommendations.push('Add appropriate role attribute')
  }
  
  // Check for labeling
  const ariaLabel = element.getAttribute('aria-label')
  const ariaLabelledby = element.getAttribute('aria-labelledby')
  const hasTextContent = element.textContent?.trim().length > 0
  
  if (ariaLabel || ariaLabelledby || hasTextContent) {
    results.hasLabel = true
  } else if (needsLabel(element)) {
    results.issues.push('Missing accessible label')
    results.recommendations.push('Add aria-label or aria-labelledby')
  }
  
  // Check for description
  const ariaDescribedby = element.getAttribute('aria-describedby')
  if (ariaDescribedby) {
    results.hasDescription = true
  }
  
  // Check for state attributes
  const stateAttributes = [
    'aria-expanded', 'aria-selected', 'aria-checked', 'aria-pressed',
    'aria-hidden', 'aria-disabled', 'aria-invalid'
  ]
  
  const hasStateAttrs = stateAttributes.some(attr => element.hasAttribute(attr))
  if (hasStateAttrs) {
    results.hasState = true
  }
  
  // Check for property attributes
  const propertyAttributes = [
    'aria-live', 'aria-atomic', 'aria-relevant', 'aria-busy',
    'aria-controls', 'aria-owns', 'aria-flowto'
  ]
  
  const hasPropertyAttrs = propertyAttributes.some(attr => element.hasAttribute(attr))
  if (hasPropertyAttrs) {
    results.hasProperties = true
  }
  
  // Specific checks based on role or tag
  performSpecificARIAChecks(element, results)
  
  return results
}

/**
 * Check if element is a semantic HTML element
 * @param {Element} element - Element to check
 * @returns {boolean} Whether element is semantic
 */
function isSemanticElement(element) {
  const semanticTags = [
    'header', 'nav', 'main', 'section', 'article', 'aside', 'footer',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'button', 'a', 'input',
    'select', 'textarea', 'label', 'fieldset', 'legend', 'table',
    'th', 'td', 'caption', 'figure', 'figcaption'
  ]
  
  return semanticTags.includes(element.tagName.toLowerCase())
}

/**
 * Check if element needs a label
 * @param {Element} element - Element to check
 * @returns {boolean} Whether element needs a label
 */
function needsLabel(element) {
  const tagName = element.tagName.toLowerCase()
  const role = element.getAttribute('role')
  
  const needsLabelTags = ['input', 'select', 'textarea', 'button']
  const needsLabelRoles = [
    'button', 'link', 'menuitem', 'tab', 'option', 'checkbox',
    'radio', 'slider', 'spinbutton', 'textbox'
  ]
  
  return needsLabelTags.includes(tagName) || needsLabelRoles.includes(role)
}

/**
 * Perform specific ARIA checks based on element type
 * @param {Element} element - Element to check
 * @param {object} results - Results object to update
 */
function performSpecificARIAChecks(element, results) {
  const role = element.getAttribute('role')
  const tagName = element.tagName.toLowerCase()
  
  // Button checks
  if (tagName === 'button' || role === 'button') {
    if (element.hasAttribute('aria-pressed')) {
      const pressed = element.getAttribute('aria-pressed')
      if (!['true', 'false', 'mixed'].includes(pressed)) {
        results.issues.push('Invalid aria-pressed value')
        results.recommendations.push('Use "true", "false", or "mixed" for aria-pressed')
      }
    }
  }
  
  // Link checks
  if (tagName === 'a' || role === 'link') {
    if (tagName === 'a' && !element.hasAttribute('href')) {
      results.issues.push('Link without href attribute')
      results.recommendations.push('Add href attribute or use button element')
    }
  }
  
  // Input checks
  if (tagName === 'input') {
    const type = element.getAttribute('type')
    if (type === 'checkbox' || type === 'radio') {
      if (!element.hasAttribute('aria-checked') && !element.checked) {
        // This is actually fine for native inputs
      }
    }
    
    if (element.hasAttribute('required') && !element.hasAttribute('aria-required')) {
      results.recommendations.push('Consider adding aria-required="true" for required fields')
    }
  }
  
  // Dialog checks
  if (role === 'dialog') {
    if (!element.hasAttribute('aria-labelledby') && !element.hasAttribute('aria-label')) {
      results.issues.push('Dialog missing accessible name')
      results.recommendations.push('Add aria-labelledby or aria-label to dialog')
    }
  }
  
  // Live region checks
  if (element.hasAttribute('aria-live')) {
    const liveValue = element.getAttribute('aria-live')
    if (!['off', 'polite', 'assertive'].includes(liveValue)) {
      results.issues.push('Invalid aria-live value')
      results.recommendations.push('Use "off", "polite", or "assertive" for aria-live')
    }
  }
}

/**
 * Find all ARIA landmarks on the page
 * @param {Element} container - Container to search
 * @returns {object} Landmark analysis
 */
export function analyzeLandmarks(container = document) {
  const landmarks = {
    banner: [],
    navigation: [],
    main: [],
    complementary: [],
    contentinfo: [],
    search: [],
    form: [],
    region: []
  }
  
  const landmarkSelectors = [
    '[role="banner"], header',
    '[role="navigation"], nav',
    '[role="main"], main',
    '[role="complementary"], aside',
    '[role="contentinfo"], footer',
    '[role="search"]',
    '[role="form"]',
    '[role="region"]'
  ]
  
  landmarkSelectors.forEach(selector => {
    const elements = container.querySelectorAll(selector)
    elements.forEach(element => {
      const role = element.getAttribute('role') || getImplicitRole(element)
      if (landmarks[role]) {
        landmarks[role].push({
          element,
          selector: getElementSelector(element),
          hasLabel: hasAccessibleName(element)
        })
      }
    })
  })
  
  const analysis = {
    landmarks,
    issues: [],
    recommendations: []
  }
  
  // Check for required landmarks
  if (landmarks.main.length === 0) {
    analysis.issues.push('Missing main landmark')
    analysis.recommendations.push('Add <main> element or role="main"')
  }
  
  if (landmarks.main.length > 1) {
    analysis.issues.push('Multiple main landmarks found')
    analysis.recommendations.push('Use only one main landmark per page')
  }
  
  // Check for multiple landmarks of same type without labels
  Object.entries(landmarks).forEach(([type, elements]) => {
    if (elements.length > 1) {
      const unlabeled = elements.filter(item => !item.hasLabel)
      if (unlabeled.length > 0) {
        analysis.issues.push(`Multiple ${type} landmarks without distinguishing labels`)
        analysis.recommendations.push(`Add aria-label or aria-labelledby to distinguish ${type} landmarks`)
      }
    }
  })
  
  return analysis
}

/**
 * Get implicit ARIA role for semantic elements
 * @param {Element} element - Element to check
 * @returns {string} Implicit role
 */
function getImplicitRole(element) {
  const tagName = element.tagName.toLowerCase()
  const roleMap = {
    'header': 'banner',
    'nav': 'navigation',
    'main': 'main',
    'aside': 'complementary',
    'footer': 'contentinfo'
  }
  
  return roleMap[tagName] || tagName
}

/**
 * Check if element has accessible name
 * @param {Element} element - Element to check
 * @returns {boolean} Whether element has accessible name
 */
function hasAccessibleName(element) {
  return !!(element.getAttribute('aria-label') || 
           element.getAttribute('aria-labelledby') ||
           element.textContent?.trim())
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
 * Check heading structure for proper hierarchy
 * @param {Element} container - Container to check
 * @returns {object} Heading analysis
 */
export function analyzeHeadingStructure(container = document) {
  const headings = Array.from(container.querySelectorAll('h1, h2, h3, h4, h5, h6'))
  const structure = headings.map(heading => ({
    element: heading,
    level: parseInt(heading.tagName.charAt(1)),
    text: heading.textContent.trim(),
    selector: getElementSelector(heading)
  }))
  
  const analysis = {
    headings: structure,
    issues: [],
    recommendations: []
  }
  
  if (structure.length === 0) {
    analysis.issues.push('No headings found')
    analysis.recommendations.push('Add heading elements to structure content')
    return analysis
  }
  
  // Check for h1
  const h1Count = structure.filter(h => h.level === 1).length
  if (h1Count === 0) {
    analysis.issues.push('No h1 heading found')
    analysis.recommendations.push('Add an h1 heading as the main page title')
  } else if (h1Count > 1) {
    analysis.issues.push('Multiple h1 headings found')
    analysis.recommendations.push('Use only one h1 heading per page')
  }
  
  // Check heading hierarchy
  for (let i = 1; i < structure.length; i++) {
    const current = structure[i]
    const previous = structure[i - 1]
    
    if (current.level > previous.level + 1) {
      analysis.issues.push(`Heading level skipped: ${previous.level} to ${current.level}`)
      analysis.recommendations.push('Use consecutive heading levels (don\'t skip levels)')
    }
  }
  
  return analysis
}

/**
 * Check form accessibility
 * @param {Element} container - Container to check
 * @returns {object} Form accessibility analysis
 */
export function analyzeFormAccessibility(container = document) {
  const forms = Array.from(container.querySelectorAll('form'))
  const inputs = Array.from(container.querySelectorAll('input, select, textarea'))
  
  const analysis = {
    forms: forms.length,
    inputs: inputs.length,
    issues: [],
    recommendations: [],
    inputAnalysis: []
  }
  
  inputs.forEach(input => {
    const inputAnalysis = {
      element: input,
      selector: getElementSelector(input),
      hasLabel: false,
      hasDescription: false,
      hasErrorHandling: false,
      issues: []
    }
    
    // Check for label
    const id = input.id
    const ariaLabel = input.getAttribute('aria-label')
    const ariaLabelledby = input.getAttribute('aria-labelledby')
    const associatedLabel = id ? document.querySelector(`label[for="${id}"]`) : null
    const wrappingLabel = input.closest('label')
    
    if (ariaLabel || ariaLabelledby || associatedLabel || wrappingLabel) {
      inputAnalysis.hasLabel = true
    } else {
      inputAnalysis.issues.push('Missing label')
      analysis.issues.push(`Input ${getElementSelector(input)} missing label`)
    }
    
    // Check for description
    const ariaDescribedby = input.getAttribute('aria-describedby')
    if (ariaDescribedby) {
      inputAnalysis.hasDescription = true
    }
    
    // Check for error handling
    const ariaInvalid = input.getAttribute('aria-invalid')
    const hasErrorMessage = input.getAttribute('aria-describedby') && 
                           document.querySelector(`#${input.getAttribute('aria-describedby')}`)?.textContent.includes('error')
    
    if (ariaInvalid || hasErrorMessage) {
      inputAnalysis.hasErrorHandling = true
    }
    
    // Check required fields
    if (input.hasAttribute('required') && !input.hasAttribute('aria-required')) {
      inputAnalysis.issues.push('Required field missing aria-required')
    }
    
    analysis.inputAnalysis.push(inputAnalysis)
  })
  
  // Generate recommendations
  const unlabeledInputs = analysis.inputAnalysis.filter(input => !input.hasLabel).length
  if (unlabeledInputs > 0) {
    analysis.recommendations.push(`${unlabeledInputs} inputs need proper labels`)
  }
  
  const inputsWithoutErrorHandling = analysis.inputAnalysis.filter(input => !input.hasErrorHandling).length
  if (inputsWithoutErrorHandling > 0) {
    analysis.recommendations.push('Implement proper error handling for form validation')
  }
  
  return analysis
}

/**
 * Generate comprehensive screen reader compatibility report
 * @param {Element} container - Container to analyze
 * @returns {object} Complete screen reader report
 */
export function generateScreenReaderReport(container = document) {
  const allElements = Array.from(container.querySelectorAll('*'))
  const interactiveElements = allElements.filter(el => 
    el.matches('button, a, input, select, textarea, [role="button"], [role="link"], [tabindex]')
  )
  
  const ariaCompliance = interactiveElements.map(el => ({
    element: el,
    selector: getElementSelector(el),
    compliance: checkARIACompliance(el)
  }))
  
  const landmarkAnalysis = analyzeLandmarks(container)
  const headingAnalysis = analyzeHeadingStructure(container)
  const formAnalysis = analyzeFormAccessibility(container)
  
  const totalIssues = ariaCompliance.reduce((sum, item) => sum + item.compliance.issues.length, 0) +
                     landmarkAnalysis.issues.length +
                     headingAnalysis.issues.length +
                     formAnalysis.issues.length
  
  const score = Math.max(0, 100 - (totalIssues * 5))
  
  return {
    score,
    summary: {
      totalElements: allElements.length,
      interactiveElements: interactiveElements.length,
      totalIssues,
      landmarks: Object.values(landmarkAnalysis.landmarks).flat().length,
      headings: headingAnalysis.headings.length,
      forms: formAnalysis.forms,
      inputs: formAnalysis.inputs
    },
    ariaCompliance,
    landmarks: landmarkAnalysis,
    headings: headingAnalysis,
    forms: formAnalysis,
    recommendations: [
      ...landmarkAnalysis.recommendations,
      ...headingAnalysis.recommendations,
      ...formAnalysis.recommendations,
      ...ariaCompliance.flatMap(item => item.compliance.recommendations)
    ].filter((rec, index, arr) => arr.indexOf(rec) === index), // Remove duplicates
    timestamp: new Date().toISOString()
  }
}