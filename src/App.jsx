import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { OutletProvider } from './contexts/OutletContext'
import { InventoryProvider } from './contexts/InventoryContext'
import { SettingsProvider } from './contexts/SettingsContext'
import { StaffProvider } from './contexts/StaffContext'
import { CustomerProvider } from './contexts/CustomerContext'
import { SyncProvider } from './contexts/SyncContext'
import Login from './components/Auth/Login'
import Dashboard from './components/Dashboard/Dashboard'
import ProductManagement from './components/ProductManagement/ProductManagement'
import SalesHistory from './components/Sales/SalesHistory'
import Profile from './components/Profile/Profile'
import StaffManagement from './components/Staff/StaffManagement'
import CustomerManagement from './components/Customer/CustomerManagement'
import Reports from './components/Reports/Reports'
import Settings from './components/Settings/Settings'
import Layout from './components/Layout/Layout'
import ShadcnDemo from './components/Demo/ShadcnDemo'
import MultiOutletSystem from './components/MultiOutletSystem/MultiOutletSystem'
import { Loader2 } from 'lucide-react'
import { Toaster } from './components/ui/toaster'

function ProtectedRoute({ children }) {
  const { currentUser } = useAuth()
  return currentUser ? children : <Navigate to="/login" />
}

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
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/products" 
        element={
          <ProtectedRoute>
            <Layout>
              <ProductManagement />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/sales" 
        element={
          <ProtectedRoute>
            <Layout>
              <SalesHistory />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/staff" 
        element={
          <ProtectedRoute>
            <Layout>
              <StaffManagement />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/customers" 
        element={
          <ProtectedRoute>
            <Layout>
              <CustomerManagement />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/reports" 
        element={
          <ProtectedRoute>
            <Layout>
              <Reports />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/reports/sales" 
        element={
          <ProtectedRoute>
            <Layout>
              <Reports />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/reports/payments" 
        element={
          <ProtectedRoute>
            <Layout>
              <Reports />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/reports/daybook" 
        element={
          <ProtectedRoute>
            <Layout>
              <Reports />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/settings" 
        element={
          <ProtectedRoute>
            <Layout>
              <Settings />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/demo" 
        element={
          <ProtectedRoute>
            <Layout>
              <ShadcnDemo />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <Layout>
              <Profile />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/multi-outlet" 
        element={
          <ProtectedRoute>
            <Layout>
              <MultiOutletSystem />
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
        <OutletProvider>
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
        </OutletProvider>
      </AuthProvider>
    </Router>
  )
}

export default App