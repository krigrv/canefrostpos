import React from 'react'
import { useAccessibility } from '../../contexts/AccessibilityContext'

const SkipNavigation = () => {
  const { skipLinks } = useAccessibility()

  const handleSkipToMain = () => {
    const mainContent = document.getElementById('main-content')
    if (mainContent) {
      mainContent.focus()
      mainContent.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleSkipToNav = () => {
    const navigation = document.querySelector('nav[role="navigation"]')
    if (navigation) {
      const firstLink = navigation.querySelector('a, button')
      if (firstLink) {
        firstLink.focus()
      }
    }
  }

  const handleSkipToSearch = () => {
    const searchInput = document.querySelector('input[type="search"], input[placeholder*="search" i]')
    if (searchInput) {
      searchInput.focus()
    }
  }

  if (!skipLinks) return null

  return (
    <div className="skip-navigation" role="navigation" aria-label="Skip navigation">
      <button
        className="skip-link"
        onClick={handleSkipToMain}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleSkipToMain()
          }
        }}
      >
        Skip to main content
      </button>
      <button
        className="skip-link"
        onClick={handleSkipToNav}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleSkipToNav()
          }
        }}
      >
        Skip to navigation
      </button>
      <button
        className="skip-link"
        onClick={handleSkipToSearch}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleSkipToSearch()
          }
        }}
      >
        Skip to search
      </button>
    </div>
  )
}

export default SkipNavigation