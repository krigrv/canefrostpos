/*
 * Main entry point for Canefrost POS application
 * Updated to include ErrorBoundary for debugging blank screen issues
 * Added comprehensive error handling and logging
 */
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import TestApp from './TestApp.jsx'
import SimpleApp from './SimpleApp.jsx'
import BasicTest from './BasicTest.jsx'
import './index.css'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { Toaster } from 'react-hot-toast'
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary.jsx'

const theme = createTheme({
  palette: {
    primary: {
      main: '#000000', // Pure black for primary actions
      light: '#404040',
      dark: '#000000',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#6B7280', // Gray-500 for secondary elements
      light: '#9CA3AF',
      dark: '#374151',
      contrastText: '#FFFFFF',
    },
    tertiary: {
      main: '#4B5563', // Gray-600 for tertiary elements
      light: '#6B7280',
      dark: '#1F2937',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#EF4444', // Red-500 for errors
      light: '#FEE2E2',
      dark: '#DC2626',
      contrastText: '#FFFFFF',
    },
    warning: {
      main: '#374151', // Gray-700 for warnings
      light: '#F3F4F6',
      dark: '#1F2937',
      contrastText: '#FFFFFF',
    },
    success: {
      main: '#111827', // Gray-900 for success
      light: '#F9FAFB',
      dark: '#000000',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#FFFFFF', // Pure white background
      paper: '#FFFFFF',
    },
    surface: {
      main: '#F9FAFB', // Gray-50 for subtle surfaces
      variant: '#F3F4F6', // Gray-100 for card backgrounds
    },
    text: {
      primary: '#111827', // Gray-900 for primary text
      secondary: '#6B7280', // Gray-500 for secondary text
      disabled: '#9CA3AF', // Gray-400 for disabled text
    },
    divider: '#E5E7EB', // Gray-200 for borders and dividers
    outline: {
      main: '#D1D5DB', // Gray-300 for outlines
      variant: '#E5E7EB', // Gray-200 for subtle outlines
    },
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
    // Shadcn UI Typography Scale - Refined and Compact
    displayLarge: {
      fontWeight: 600,
      fontSize: '2.25rem',
      lineHeight: '2.5rem',
      letterSpacing: '-0.02rem',
    },
    displayMedium: {
      fontWeight: 600,
      fontSize: '1.875rem',
      lineHeight: '2.25rem',
      letterSpacing: '-0.015rem',
    },
    displaySmall: {
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: '2rem',
      letterSpacing: '-0.01rem',
    },
    headlineLarge: {
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: '1.75rem',
      letterSpacing: '-0.005rem',
    },
    headlineMedium: {
      fontWeight: 500,
      fontSize: '1.125rem',
      lineHeight: '1.5rem',
      letterSpacing: '0rem',
    },
    headlineSmall: {
      fontWeight: 500,
      fontSize: '1rem',
      lineHeight: '1.5rem',
      letterSpacing: '0rem',
    },
    titleLarge: {
      fontWeight: 500,
      fontSize: '0.875rem',
      lineHeight: '1.25rem',
      letterSpacing: '0rem',
    },
    titleMedium: {
      fontWeight: 500,
      fontSize: '1rem',
      lineHeight: '1.5rem',
      letterSpacing: '0.009375rem',
    },
    titleSmall: {
      fontWeight: 500,
      fontSize: '0.875rem',
      lineHeight: '1.25rem',
      letterSpacing: '0.00625rem',
    },
    labelLarge: {
      fontWeight: 500,
      fontSize: '0.875rem',
      lineHeight: '1.25rem',
      letterSpacing: '0.00625rem',
    },
    labelMedium: {
      fontWeight: 500,
      fontSize: '0.75rem',
      lineHeight: '1rem',
      letterSpacing: '0.03125rem',
    },
    labelSmall: {
      fontWeight: 500,
      fontSize: '0.6875rem',
      lineHeight: '1rem',
      letterSpacing: '0.03125rem',
    },
    bodyLarge: {
      fontWeight: 400,
      fontSize: '1rem',
      lineHeight: '1.5rem',
      letterSpacing: '0.03125rem',
    },
    bodyMedium: {
      fontWeight: 400,
      fontSize: '0.875rem',
      lineHeight: '1.25rem',
      letterSpacing: '0.015625rem',
    },
    bodySmall: {
      fontWeight: 400,
      fontSize: '0.75rem',
      lineHeight: '1rem',
      letterSpacing: '0.025rem',
    },
    // Legacy MUI typography for compatibility - Shadcn UI Refined
    h1: {
      fontWeight: 600,
      fontSize: '1.875rem',
      lineHeight: '2.25rem',
      letterSpacing: '-0.01rem',
    },
    h2: {
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: '2rem',
      letterSpacing: '-0.005rem',
    },
    h3: {
      fontWeight: 500,
      fontSize: '1.25rem',
      lineHeight: '1.75rem',
    },
    h4: {
      fontWeight: 500,
      fontSize: '1.125rem',
      lineHeight: '1.5rem',
    },
    h5: {
      fontWeight: 500,
      fontSize: '1rem',
      lineHeight: '1.5rem',
    },
    h6: {
      fontWeight: 500,
      fontSize: '0.875rem',
      lineHeight: '1.25rem',
    },
    body1: {
      fontWeight: 400,
      fontSize: '1rem',
      lineHeight: '1.5rem',
    },
    body2: {
      fontWeight: 400,
      fontSize: '0.875rem',
      lineHeight: '1.25rem',
    },
  },
  shape: {
    borderRadius: 6, // Subtle rounded corners like shadcn/ui
  },
  // Minimal shadow system inspired by shadcn/ui
  shadows: [
    'none', // 0
    '0 1px 2px 0 rgb(0 0 0 / 0.05)', // 1 - Very subtle
    '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)', // 2 - Subtle
    '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', // 3 - Small
    '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', // 4 - Medium
    '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)', // 5 - Large
    ...Array(19).fill('0 25px 50px -12px rgb(0 0 0 / 0.25)') // 6-24 - Extra large
  ],
  components: {
    // shadcn/ui inspired Button Components
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: 6, // Subtle rounded corners
          padding: '8px 16px',
          fontSize: '0.875rem',
          lineHeight: '1.25rem',
          letterSpacing: 'normal',
          transition: 'all 0.2s ease-in-out',
        },
        contained: {
          backgroundColor: '#000000',
          color: '#FFFFFF',
          boxShadow: 'none',
          '&:hover': {
            backgroundColor: '#1F2937',
            boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
          },
          '&:active': {
            backgroundColor: '#111827',
          },
        },
        outlined: {
          borderWidth: '1px',
          borderColor: '#E5E7EB',
          color: '#111827',
          backgroundColor: '#FFFFFF',
          '&:hover': {
            backgroundColor: '#F9FAFB',
            borderColor: '#D1D5DB',
            borderWidth: '1px',
          },
        },
        text: {
          color: '#111827',
          '&:hover': {
            backgroundColor: '#F9FAFB',
          },
        },
      },
    },
    // shadcn/ui inspired Card Component
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: '#FFFFFF',
          border: '1px solid #E5E7EB',
          boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          },
        },
      },
    },
    // shadcn/ui inspired Paper Component
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: '#FFFFFF',
          border: '1px solid #E5E7EB',
        },
        elevation0: {
          boxShadow: 'none',
          border: '1px solid #E5E7EB',
        },
        elevation1: {
          boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
          border: '1px solid #E5E7EB',
        },
        elevation2: {
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
          border: '1px solid #E5E7EB',
        },
        elevation3: {
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          border: '1px solid #E5E7EB',
        },
      },
    },
    // shadcn/ui inspired AppBar
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          color: '#111827',
          boxShadow: 'none',
          borderBottom: '1px solid #E5E7EB',
        },
      },
    },
    // shadcn/ui inspired Chip Component
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontSize: '0.75rem',
          fontWeight: 500,
          backgroundColor: '#F3F4F6',
          color: '#374151',
          border: '1px solid #E5E7EB',
          '&:hover': {
            backgroundColor: '#E5E7EB',
          },
        },
        filled: {
          backgroundColor: '#111827',
          color: '#FFFFFF',
          '&:hover': {
            backgroundColor: '#1F2937',
          },
        },
      },
    },
    // shadcn/ui inspired TextField
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 6,
            backgroundColor: '#FFFFFF',
            '& fieldset': {
              borderColor: '#E5E7EB',
            },
            '&:hover fieldset': {
              borderColor: '#D1D5DB',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#111827',
              borderWidth: '2px',
            },
          },
          '& .MuiInputLabel-root': {
            color: '#6B7280',
            '&.Mui-focused': {
              color: '#111827',
            },
          },
        },
      },
    },
  },
})

console.log('🚀 Main.jsx loading at:', new Date().toISOString())

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
      <Toaster position="top-right" />
    </ThemeProvider>
  </ErrorBoundary>
)

console.log('✅ Main.jsx render complete at:', new Date().toISOString())