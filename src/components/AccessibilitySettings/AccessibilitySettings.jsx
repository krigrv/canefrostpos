import React, { useState } from 'react'
import { useAccessibility } from '../../contexts/AccessibilityContext'
import { auditPageContrast, generateScreenReaderReport, generateAccessibilityReport, testKeyboardNavigation } from '../../utils/accessibility'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Switch } from '../ui/switch'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Badge } from '../ui/badge'
import { Separator } from '../ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog'
import {
  Settings,
  Eye,
  Keyboard,
  Volume2,
  Contrast,
  Type,
  MousePointer,
  Accessibility,
  RefreshCw,
  CheckCircle
} from 'lucide-react'
import './AccessibilitySettings.css'

const AccessibilitySettings = () => {
  const {
    highContrastMode,
    reducedMotion,
    fontSize,
    skipLinks,
    screenReaderMode,
    keyboardNavigation,
    contrastAuditResults,
    toggleHighContrast,
    toggleReducedMotion,
    setFontSize,
    toggleSkipLinks,
    toggleScreenReaderMode,
    toggleKeyboardNavigation,
    runContrastAudit,
    announceToScreenReader
  } = useAccessibility()

  const [isOpen, setIsOpen] = useState(false)
  const [contrastResults, setContrastResults] = useState(null)
  const [isAuditing, setIsAuditing] = useState(false)
  const [screenReaderResults, setScreenReaderResults] = useState(null)
  const [isTestingScreenReader, setIsTestingScreenReader] = useState(false)
  const [wcagResults, setWcagResults] = useState(null)
  const [isTestingWCAG, setIsTestingWCAG] = useState(false)
  const [keyboardResults, setKeyboardResults] = useState(null)
  const [isTestingKeyboard, setIsTestingKeyboard] = useState(false)

  const handleContrastAudit = async () => {
    setIsAuditing(true)
    announceToScreenReader('Running color contrast audit...')
    
    try {
      await runContrastAudit()
      // Get results from context after audit
      setContrastResults(contrastAuditResults)
      announceToScreenReader(`Contrast audit complete. Found ${contrastAuditResults?.failingElements?.length || 0} issues.`)
    } catch (error) {
      console.error('Contrast audit failed:', error)
      announceToScreenReader('Contrast audit failed. Please try again.')
    } finally {
      setIsAuditing(false)
    }
  }

  const runScreenReaderTest = async () => {
    setIsTestingScreenReader(true)
    announceToScreenReader('Running screen reader compatibility test...')
    
    try {
      const results = generateScreenReaderReport()
      setScreenReaderResults(results)
      announceToScreenReader(`Screen reader test complete. Accessibility score: ${results.score}%. Found ${results.summary.totalIssues} issues.`)
    } catch (error) {
      console.error('Screen reader test failed:', error)
      announceToScreenReader('Screen reader test failed. Please try again.')
    } finally {
      setIsTestingScreenReader(false)
    }
  }

  const runWCAGTest = async () => {
    setIsTestingWCAG(true)
    announceToScreenReader('Running comprehensive WCAG 2.1 AA compliance test...')
    
    try {
      const results = generateAccessibilityReport()
      setWcagResults(results)
      announceToScreenReader(`WCAG test complete. Overall score: ${results.overall.score}%. Grade: ${results.overall.grade}.`)
    } catch (error) {
      console.error('WCAG test failed:', error)
      announceToScreenReader('WCAG test failed. Please try again.')
    } finally {
      setIsTestingWCAG(false)
    }
  }

  const runKeyboardTest = async () => {
    setIsTestingKeyboard(true)
    announceToScreenReader('Running keyboard accessibility test...')
    
    try {
      const results = testKeyboardNavigation()
      setKeyboardResults(results)
      announceToScreenReader(`Keyboard test complete. Score: ${results.score}%. Found ${results.issues.length} issues.`)
    } catch (error) {
      console.error('Keyboard test failed:', error)
      announceToScreenReader('Keyboard test failed. Please try again.')
    } finally {
      setIsTestingKeyboard(false)
    }
  }

  const getContrastBadgeVariant = (ratio) => {
    if (ratio >= 7) return 'default' // AAA
    if (ratio >= 4.5) return 'secondary' // AA
    if (ratio >= 3) return 'outline' // AA Large
    return 'destructive' // Fail
  }

  const getContrastLabel = (ratio) => {
    if (ratio >= 7) return 'AAA'
    if (ratio >= 4.5) return 'AA'
    if (ratio >= 3) return 'AA Large'
    return 'Fail'
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-4 right-4 z-50 shadow-lg"
          aria-label="Open accessibility settings"
        >
          <Accessibility className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Accessibility Settings
          </DialogTitle>
          <DialogDescription>
            Customize your accessibility preferences to improve your experience.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Visual Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Eye className="h-4 w-4" />
                Visual Settings
              </CardTitle>
              <CardDescription>
                Adjust visual elements for better readability and contrast.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="high-contrast">High Contrast Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Increases contrast for better visibility
                  </p>
                </div>
                <Switch
                  id="high-contrast"
                  checked={highContrastMode}
                  onCheckedChange={toggleHighContrast}
                  aria-describedby="high-contrast-desc"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="reduced-motion">Reduced Motion</Label>
                  <p className="text-sm text-muted-foreground">
                    Minimizes animations and transitions
                  </p>
                </div>
                <Switch
                  id="reduced-motion"
                  checked={reducedMotion}
                  onCheckedChange={toggleReducedMotion}
                  aria-describedby="reduced-motion-desc"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="font-size">Font Size</Label>
                <Select value={fontSize} onValueChange={setFontSize}>
                  <SelectTrigger id="font-size">
                    <SelectValue placeholder="Select font size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium (Default)</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                    <SelectItem value="extra-large">Extra Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Navigation Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Keyboard className="h-4 w-4" />
                Navigation Settings
              </CardTitle>
              <CardDescription>
                Configure navigation and interaction preferences.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="skip-links">Skip Navigation Links</Label>
                  <p className="text-sm text-muted-foreground">
                    Show links to skip to main content areas
                  </p>
                </div>
                <Switch
                  id="skip-links"
                  checked={skipLinks}
                  onCheckedChange={toggleSkipLinks}
                  aria-describedby="skip-links-desc"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="keyboard-nav">Enhanced Keyboard Navigation</Label>
                  <p className="text-sm text-muted-foreground">
                    Improved focus indicators and keyboard shortcuts
                  </p>
                </div>
                <Switch
                  id="keyboard-nav"
                  checked={keyboardNavigation}
                  onCheckedChange={toggleKeyboardNavigation}
                  aria-describedby="keyboard-nav-desc"
                />
              </div>
            </CardContent>
          </Card>

          {/* Screen Reader Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Volume2 className="h-4 w-4" />
                Screen Reader Settings
              </CardTitle>
              <CardDescription>
                Configure settings for screen reader compatibility.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="screen-reader">Screen Reader Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Optimizes interface for screen readers
                  </p>
                </div>
                <Switch
                  id="screen-reader"
                  checked={screenReaderMode}
                  onCheckedChange={toggleScreenReaderMode}
                  aria-describedby="screen-reader-desc"
                />
              </div>
            </CardContent>
          </Card>

          {/* Color Contrast Audit */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Contrast className="h-4 w-4" />
                Color Contrast Audit
              </CardTitle>
              <CardDescription>
                Check color contrast ratios for WCAG compliance.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={handleContrastAudit}
                disabled={isAuditing}
                className="w-full"
                aria-describedby="contrast-audit-desc"
              >
                {isAuditing ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Running Audit...
                  </>
                ) : (
                  <>
                    <Contrast className="mr-2 h-4 w-4" />
                    Run Contrast Audit
                  </>
                )}
              </Button>
              
              <Button
                onClick={runScreenReaderTest}
                disabled={isTestingScreenReader}
                className="w-full"
              >
                {isTestingScreenReader ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Volume2 className="mr-2 h-4 w-4" />
                    Run Screen Reader Test
                  </>
                )}
              </Button>
              
              <Button
                onClick={runKeyboardTest}
                disabled={isTestingKeyboard}
                className="w-full"
              >
                {isTestingKeyboard ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Keyboard className="mr-2 h-4 w-4" />
                    Run Keyboard Test
                  </>
                )}
              </Button>
              
              <Button
                onClick={runWCAGTest}
                disabled={isTestingWCAG}
                className="w-full"
                variant="default"
              >
                {isTestingWCAG ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Run Full WCAG 2.1 AA Test
                  </>
                )}
              </Button>

              {contrastResults && (
                <div className="space-y-2">
                  <h4 className="font-medium">Contrast Audit Results</h4>
                  <p className="text-sm">Total elements checked: {contrastResults.totalElements}</p>
                  <p className="text-sm">Failing elements: {contrastResults.failingElements.length}</p>
                  <p className="text-sm">Pass rate: {Math.round((1 - contrastResults.failingElements.length / contrastResults.totalElements) * 100)}%</p>
                  
                  {contrastResults.failingElements.length > 0 && (
                    <details className="text-sm">
                      <summary>View failing elements ({contrastResults.failingElements.length})</summary>
                      <ul className="mt-2 space-y-1">
                        {contrastResults.failingElements.slice(0, 10).map((item, index) => (
                          <li key={index}>
                            <strong>{item.selector}</strong>: {item.ratio.toFixed(2)} 
                            (needs {item.required})
                          </li>
                        ))}
                        {contrastResults.failingElements.length > 10 && (
                          <li>...and {contrastResults.failingElements.length - 10} more</li>
                        )}
                      </ul>
                    </details>
                  )}
                </div>
              )}
              
              {screenReaderResults && (
                <div className="space-y-2">
                  <h4 className="font-medium">Screen Reader Compatibility Results</h4>
                  <p className="text-sm">Accessibility Score: <strong>{screenReaderResults.score}%</strong></p>
                  <p className="text-sm">Total Issues: {screenReaderResults.summary.totalIssues}</p>
                  <p className="text-sm">Interactive Elements: {screenReaderResults.summary.interactiveElements}</p>
                  <p className="text-sm">Landmarks: {screenReaderResults.summary.landmarks}</p>
                  <p className="text-sm">Headings: {screenReaderResults.summary.headings}</p>
                  <p className="text-sm">Forms: {screenReaderResults.summary.forms}</p>
                  
                  {screenReaderResults.recommendations.length > 0 && (
                    <details className="text-sm">
                      <summary>Recommendations ({screenReaderResults.recommendations.length})</summary>
                      <ul className="mt-2 space-y-1">
                        {screenReaderResults.recommendations.slice(0, 10).map((rec, index) => (
                          <li key={index}>{rec}</li>
                        ))}
                        {screenReaderResults.recommendations.length > 10 && (
                          <li>...and {screenReaderResults.recommendations.length - 10} more</li>
                        )}
                      </ul>
                    </details>
                  )}
                  
                  {screenReaderResults.landmarks.issues.length > 0 && (
                    <details className="text-sm">
                      <summary>Landmark Issues ({screenReaderResults.landmarks.issues.length})</summary>
                      <ul className="mt-2 space-y-1">
                        {screenReaderResults.landmarks.issues.map((issue, index) => (
                          <li key={index}>{issue}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                  
                  {screenReaderResults.headings.issues.length > 0 && (
                    <details className="text-sm">
                      <summary>Heading Issues ({screenReaderResults.headings.issues.length})</summary>
                      <ul className="mt-2 space-y-1">
                        {screenReaderResults.headings.issues.map((issue, index) => (
                          <li key={index}>{issue}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              )}
              
              {keyboardResults && (
                <div className="space-y-2">
                  <h4 className="font-medium">Keyboard Accessibility Results</h4>
                  <p className="text-sm">Score: <strong>{keyboardResults.score}%</strong></p>
                  <p className="text-sm">Focusable Elements: {keyboardResults.summary.focusableElements}</p>
                  <p className="text-sm">Issues Found: {keyboardResults.issues.length}</p>
                  
                  {keyboardResults.issues.length > 0 && (
                    <details className="text-sm">
                      <summary>Issues ({keyboardResults.issues.length})</summary>
                      <ul className="mt-2 space-y-1">
                        {keyboardResults.issues.slice(0, 10).map((issue, index) => (
                          <li key={index}>{issue}</li>
                        ))}
                        {keyboardResults.issues.length > 10 && (
                          <li>...and {keyboardResults.issues.length - 10} more</li>
                        )}
                      </ul>
                    </details>
                  )}
                </div>
              )}
              
              {wcagResults && (
                <div className="space-y-2">
                  <h4 className="font-medium">WCAG 2.1 AA Compliance Results</h4>
                  <p className="text-sm">Overall Score: <strong>{wcagResults.overall.score}%</strong></p>
                  <p className="text-sm">Grade: <strong>{wcagResults.overall.grade}</strong></p>
                  <p className="text-sm">Tests Passed: {wcagResults.wcag.summary.passedTests}/{wcagResults.wcag.summary.totalTests}</p>
                  <p className="text-sm">Total Issues: {wcagResults.wcag.summary.totalIssues}</p>
                  
                  {wcagResults.wcag.criticalIssues.length > 0 && (
                    <details className="text-sm">
                      <summary>Critical Issues (Level A) - {wcagResults.wcag.criticalIssues.length}</summary>
                      <ul className="mt-2 space-y-1">
                        {wcagResults.wcag.criticalIssues.map((test, index) => (
                          <li key={index}>
                            <strong>{test.criterion} - {test.name}</strong>
                            <ul className="ml-4 mt-1">
                              {test.issues.slice(0, 3).map((issue, i) => (
                                <li key={i}>• {issue}</li>
                              ))}
                              {test.issues.length > 3 && (
                                <li>• ...and {test.issues.length - 3} more</li>
                              )}
                            </ul>
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                  
                  {wcagResults.wcag.aaIssues.length > 0 && (
                    <details className="text-sm">
                      <summary>AA Level Issues - {wcagResults.wcag.aaIssues.length}</summary>
                      <ul className="mt-2 space-y-1">
                        {wcagResults.wcag.aaIssues.map((test, index) => (
                          <li key={index}>
                            <strong>{test.criterion} - {test.name}</strong>
                            <ul className="ml-4 mt-1">
                              {test.issues.slice(0, 3).map((issue, i) => (
                                <li key={i}>• {issue}</li>
                              ))}
                              {test.issues.length > 3 && (
                                <li>• ...and {test.issues.length - 3} more</li>
                              )}
                            </ul>
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                  
                  {wcagResults.wcag.recommendations.length > 0 && (
                    <details className="text-sm">
                      <summary>Recommendations ({wcagResults.wcag.recommendations.length})</summary>
                      <ul className="mt-2 space-y-1">
                        {wcagResults.wcag.recommendations.slice(0, 10).map((rec, index) => (
                          <li key={index}>• {rec}</li>
                        ))}
                        {wcagResults.wcag.recommendations.length > 10 && (
                          <li>• ...and {wcagResults.wcag.recommendations.length - 10} more</li>
                        )}
                      </ul>
                    </details>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Separator />

          <div className="text-sm text-muted-foreground">
            <p>
              These settings are saved locally and will persist across sessions.
              For additional accessibility support, please contact our support team.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default AccessibilitySettings