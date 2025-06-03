import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../supabase/config'
import toast from 'react-hot-toast'
import { useAuth } from './AuthContextSupabase'

const CustomerContext = createContext()

export function useCustomers() {
  const context = useContext(CustomerContext)
  if (!context) {
    throw new Error('useCustomers must be used within a CustomerProvider')
  }
  return context
}

export function CustomerProvider({ children }) {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const { currentUser } = useAuth()

  // Load customers from Supabase
  useEffect(() => {
    const loadCustomers = async () => {
      if (!currentUser) {
        setLoading(false)
        return
      }
      
      try {
        console.log('CustomerContext: Loading customers from Supabase')
        
        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (error) {
          throw error
        }
        
        // Format dates if needed
        const customersData = data.map(customer => ({
          ...customer,
          joinDate: customer.join_date ? new Date(customer.join_date) : null,
          lastVisit: customer.last_visit ? new Date(customer.last_visit) : null
        }))
        
        console.log(`CustomerContext: Loaded ${customersData.length} customers`)
        setCustomers(customersData)
      } catch (error) {
        console.error('Error loading customers from Supabase:', error)
        toast.error('Failed to load customers')
        setCustomers([])
      } finally {
        setLoading(false)
      }
    }
    
    loadCustomers()
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('customers-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, () => {
        // Reload customers when changes occur
        loadCustomers()
      })
      .subscribe()
    
    return () => {
      subscription.unsubscribe()
    }
  }, [currentUser])

  // Add new customer
  const addCustomer = useCallback(async (customerData) => {
    try {
      const customerWithDefaults = {
        ...customerData,
        join_date: new Date(customerData.joinDate || new Date()).toISOString(),
        last_visit: new Date().toISOString(),
        total_spent: customerData.totalSpent || 0,
        visits: customerData.visits || 1,
        loyalty_points: customerData.loyaltyPoints || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('customers')
        .insert([customerWithDefaults])
        .select()
        .single()
      
      if (error) {
        throw error
      }
      
      // Format the returned data
      const formattedCustomer = {
        ...data,
        joinDate: data.join_date ? new Date(data.join_date) : null,
        lastVisit: data.last_visit ? new Date(data.last_visit) : null
      }
      
      // Update local state
      setCustomers(prev => [formattedCustomer, ...prev])
      
      console.log('Customer added with ID:', data.id)
      toast.success('Customer added successfully')
      return data.id
    } catch (error) {
      console.error('Error adding customer:', error)
      toast.error('Failed to add customer')
      throw error
    }
  }, [])

  // Update customer
  const updateCustomer = useCallback(async (customerId, customerData) => {
    try {
      // Prepare update payload with snake_case for Supabase
      const updatePayload = {
        ...customerData,
        updated_at: new Date().toISOString()
      }

      // Convert dates to ISO strings if they exist
      if (customerData.joinDate) {
        updatePayload.join_date = new Date(customerData.joinDate).toISOString()
        delete updatePayload.joinDate // Remove camelCase version
      }
      if (customerData.lastVisit) {
        updatePayload.last_visit = new Date(customerData.lastVisit).toISOString()
        delete updatePayload.lastVisit // Remove camelCase version
      }
      
      // Convert other camelCase to snake_case
      if ('totalSpent' in customerData) {
        updatePayload.total_spent = customerData.totalSpent
        delete updatePayload.totalSpent
      }
      if ('loyaltyPoints' in customerData) {
        updatePayload.loyalty_points = customerData.loyaltyPoints
        delete updatePayload.loyaltyPoints
      }

      const { error } = await supabase
        .from('customers')
        .update(updatePayload)
        .eq('id', customerId)
      
      if (error) {
        throw error
      }

      // Update local state with the updated customer
      setCustomers(prev => {
        return prev.map(c => {
          if (c.id === customerId) {
            // Create a properly formatted customer object
            return {
              ...c,
              ...customerData,
              updatedAt: new Date(),
              // Ensure dates are Date objects in local state
              joinDate: customerData.joinDate ? new Date(customerData.joinDate) : c.joinDate,
              lastVisit: customerData.lastVisit ? new Date(customerData.lastVisit) : c.lastVisit
            }
          }
          return c
        })
      })
      
      toast.success('Customer updated successfully')
    } catch (error) {
      console.error('Error updating customer:', error)
      toast.error('Failed to update customer')
      throw error
    }
  }, [])

  // Delete customer
  const deleteCustomer = useCallback(async (customerId) => {
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerId)
      
      if (error) {
        throw error
      }
      
      // Update local state
      setCustomers(prev => prev.filter(c => c.id !== customerId))
      
      toast.success('Customer deleted successfully')
    } catch (error) {
      console.error('Error deleting customer:', error)
      toast.error('Failed to delete customer')
      throw error
    }
  }, [])

  // Update customer visit and spending
  const updateCustomerVisit = useCallback(async (customerId, purchaseAmount = 0) => {
    try {
      const customer = customers.find(c => c.id === customerId)
      if (!customer) {
        throw new Error('Customer not found')
      }

      const updatedData = {
        last_visit: new Date().toISOString(),
        visits: (customer.visits || 0) + 1,
        total_spent: (customer.totalSpent || 0) + purchaseAmount,
        loyalty_points: Math.floor(((customer.totalSpent || 0) + purchaseAmount) / 100), // 1 point per ₹100
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('customers')
        .update(updatedData)
        .eq('id', customerId)
      
      if (error) {
        throw error
      }
      
      // Update local state
      setCustomers(prev => {
        return prev.map(c => {
          if (c.id === customerId) {
            return {
              ...c,
              lastVisit: new Date(),
              visits: (c.visits || 0) + 1,
              totalSpent: (c.totalSpent || 0) + purchaseAmount,
              loyaltyPoints: Math.floor(((c.totalSpent || 0) + purchaseAmount) / 100),
              updatedAt: new Date()
            }
          }
          return c
        })
      })
      
      console.log('Customer visit updated:', customerId)
    } catch (error) {
      console.error('Error updating customer visit:', error)
      throw error
    }
  }, [customers])

  // Get customer by phone number
  const getCustomerByPhone = useCallback((phoneNumber) => {
    return customers.find(customer => customer.phone === phoneNumber)
  }, [customers])

  // Get customer by email
  const getCustomerByEmail = useCallback((email) => {
    return customers.find(customer => customer.email === email)
  }, [customers])

  // Get top customers by spending
  const getTopCustomers = useCallback((limit = 10) => {
    return [...customers]
      .sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0))
      .slice(0, limit)
  }, [customers])

  // Get customers by loyalty tier
  const getCustomersByTier = useCallback((tier) => {
    return customers.filter(customer => {
      const points = customer.loyaltyPoints || 0
      switch (tier) {
        case 'Bronze':
          return points >= 0 && points < 100
        case 'Silver':
          return points >= 100 && points < 500
        case 'Gold':
          return points >= 500 && points < 1000
        case 'Platinum':
          return points >= 1000
        default:
          return false
      }
    })
  }, [customers])




  const value = useMemo(() => ({
    customers,
    loading,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    updateCustomerVisit,
    getCustomerByPhone,
    getCustomerByEmail,
    getTopCustomers,
    getCustomersByTier
  }), [
    customers,
    loading,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    updateCustomerVisit,
    getCustomerByPhone,
    getCustomerByEmail,
    getTopCustomers,
    getCustomersByTier
  ])

  return (
    <CustomerContext.Provider value={value}>
      {children}
    </CustomerContext.Provider>
  )
}