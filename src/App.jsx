import React, { useState, Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContextSupabase'

import { InventoryProvider } from './contexts/InventoryContext' // Using Supabase-based context
import { SettingsProvider } from './contexts/SettingsContext'
import { StaffProvider } from './contexts/StaffContext'
import { CustomerProvider } from './contexts/CustomerContext'
import { SyncProvider } from './contexts/SyncContext'
import { AccessibilityProvider } from './contexts/AccessibilityContext'
import './styles/accessibility.css'
import Login from './components/Auth/Login'
const Dashboard = lazy(() => import('./components/Dashboard/Dashboard'))
const ProductManagement = lazy(() => import('./components/ProductManagement/ProductManagement'))
const SalesHistory = lazy(() => import('./components/Sales/SalesHistory'))
const Profile = lazy(() => import('./components/Profile/Profile'))
const StaffManagement = lazy(() => import('./components/Staff/StaffManagement'))
const CustomerManagement = lazy(() => import('./components/Customer/CustomerManagement'))
const Reports = lazy(() => import('./components/Reports/Reports'))
const Settings = lazy(() => import('./components/Settings/Settings'))
import Layout from './components/Layout/Layout'
const ShadcnDemo = lazy(() => import('./components/Demo/ShadcnDemo'))

import { Loader2 } from 'lucide-react'
import { Toaster } from './components/ui/toaster'


const ProtectedRoute = React.memo(({ children }) => {
  const { currentUser } = useAuth()
  return currentUser ? children : <Navigate to="/login" />
})
ProtectedRoute.displayName = "ProtectedRoute"

function AppRoutes() {
  const { currentUser, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={currentUser ? <Navigate to="/" /> : <Login />} 
      />
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <Layout>
              <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
                <Dashboard />
              </Suspense>
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/products" 
        element={
          <ProtectedRoute>
            <Layout>
              <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
                <ProductManagement />
              </Suspense>
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/sales" 
        element={
          <ProtectedRoute>
            <Layout>
              <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
                <SalesHistory />
              </Suspense>
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/staff" 
        element={
          <ProtectedRoute>
            <Layout>
              <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
                <StaffManagement />
              </Suspense>
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/customers" 
        element={
          <ProtectedRoute>
            <Layout>
              <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
                <CustomerManagement />
              </Suspense>
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/reports" 
        element={
          <ProtectedRoute>
            <Layout>
              <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
                <Reports />
              </Suspense>
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/reports/sales" 
        element={
          <ProtectedRoute>
            <Layout>
              <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
                <Reports />
              </Suspense>
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/reports/payments" 
        element={
          <ProtectedRoute>
            <Layout>
              <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
                <Reports />
              </Suspense>
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/reports/daybook" 
        element={
          <ProtectedRoute>
            <Layout>
              <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
                <Reports />
              </Suspense>
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/settings" 
        element={
          <ProtectedRoute>
            <Layout>
              <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
                <Settings />
              </Suspense>
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/demo" 
        element={
          <ProtectedRoute>
            <Layout>
              <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
                <ShadcnDemo />
              </Suspense>
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <Layout>
              <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
                <Profile />
              </Suspense>
            </Layout>
          </ProtectedRoute>
        } 
      />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

function App() {
  console.log('🔄 App component rendering at:', new Date().toISOString())
  
  React.useEffect(() => {
    console.log('🎯 App component mounted at:', new Date().toISOString())
    return () => {
      console.log('🗑️ App component unmounting at:', new Date().toISOString())
    }
  }, [])
  
  return (
    <Router>
      <AuthProvider>
        <AccessibilityProvider>
          <SyncProvider>
              <SettingsProvider>
                <InventoryProvider>
                  <StaffProvider>
                    <CustomerProvider>
                    <div className="app">
                      <AppRoutes />
                      <Toaster />
                    </div>
                    </CustomerProvider>
                  </StaffProvider>
                </InventoryProvider>
              </SettingsProvider>
            </SyncProvider>
        </AccessibilityProvider>
      </AuthProvider>
    </Router>
  )
}

export default App