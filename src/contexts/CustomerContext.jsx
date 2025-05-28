import React, { createContext, useContext, useState, useEffect } from 'react'
import { db } from '../firebase/config'
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore'
import toast from 'react-hot-toast'
import { useSync } from './SyncContext'

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
  const { queueOperation, isOnline } = useSync()

  // Load customers from Firestore with real-time updates
  useEffect(() => {
    console.log('CustomerContext: Setting up real-time listener for customers')
    
    const customersQuery = query(collection(db, 'customers'), orderBy('createdAt', 'desc'))
    const unsubscribe = onSnapshot(
      customersQuery,
      (snapshot) => {
        const customersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          joinDate: doc.data().joinDate?.toDate?.() || doc.data().joinDate,
          lastVisit: doc.data().lastVisit?.toDate?.() || doc.data().lastVisit
        }))
        
        console.log(`CustomerContext: Loaded ${customersData.length} customers (real-time)`)
        setCustomers(customersData)
        setLoading(false)
      },
      (error) => {
        console.error('Error loading customers from Firestore:', error)
        setCustomers([])
        setLoading(false)
      }
    )

    return () => {
      console.log('CustomerContext: Cleanup - unsubscribing from real-time listener')
      unsubscribe()
    }
  }, [])

  // Add new customer with sync support
  const addCustomer = async (customerData) => {
    try {
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const customerWithDefaults = {
        ...customerData,
        id: tempId,
        joinDate: new Date(customerData.joinDate || new Date()),
        lastVisit: new Date(),
        totalSpent: customerData.totalSpent || 0,
        visits: customerData.visits || 1,
        loyaltyPoints: customerData.loyaltyPoints || 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // Add to local state immediately for optimistic updates
      setCustomers(prev => [...prev, customerWithDefaults])
      
      if (isOnline) {
        // Try immediate sync
        try {
          const docRef = await addDoc(collection(db, 'customers'), customerWithDefaults)
          // Update local state with real Firebase ID
          setCustomers(prev => prev.map(c => 
            c.id === tempId ? { ...c, id: docRef.id } : c
          ))
          console.log('Customer added with ID:', docRef.id)
          toast.success('Customer added successfully')
          return docRef.id
        } catch (error) {
          // Queue for later sync if immediate sync fails
          queueOperation({
            type: 'create',
            collection: 'customers',
            data: customerWithDefaults,
            tempId
          })
          toast.success('Customer added (will sync when online)')
          return tempId
        }
      } else {
        // Queue for sync when online
        queueOperation({
          type: 'create',
          collection: 'customers',
          data: customerWithDefaults,
          tempId
        })
        toast.success('Customer added (will sync when online)')
        return tempId
      }
    } catch (error) {
      console.error('Error adding customer:', error)
      toast.error('Failed to add customer')
      throw error
    }
  }

  // Update customer
  const updateCustomer = async (customerId, customerData) => {
    try {
      const updateData = {
        ...customerData,
        updatedAt: new Date()
      }
      
      // Convert dates to Date objects if they're strings
      if (customerData.joinDate && typeof customerData.joinDate === 'string') {
        updateData.joinDate = new Date(customerData.joinDate)
      }
      if (customerData.lastVisit && typeof customerData.lastVisit === 'string') {
        updateData.lastVisit = new Date(customerData.lastVisit)
      }
      
      await updateDoc(doc(db, 'customers', customerId), updateData)
      toast.success('Customer updated successfully')
    } catch (error) {
      console.error('Error updating customer:', error)
      toast.error('Failed to update customer')
      throw error
    }
  }

  // Delete customer
  const deleteCustomer = async (customerId) => {
    try {
      await deleteDoc(doc(db, 'customers', customerId))
      toast.success('Customer deleted successfully')
    } catch (error) {
      console.error('Error deleting customer:', error)
      toast.error('Failed to delete customer')
      throw error
    }
  }

  // Update customer visit and spending
  const updateCustomerVisit = async (customerId, purchaseAmount = 0) => {
    try {
      const customer = customers.find(c => c.id === customerId)
      if (!customer) {
        throw new Error('Customer not found')
      }

      const updatedData = {
        lastVisit: new Date(),
        visits: (customer.visits || 0) + 1,
        totalSpent: (customer.totalSpent || 0) + purchaseAmount,
        loyaltyPoints: Math.floor(((customer.totalSpent || 0) + purchaseAmount) / 100), // 1 point per ₹100
        updatedAt: new Date()
      }

      await updateDoc(doc(db, 'customers', customerId), updatedData)
      console.log('Customer visit updated:', customerId)
    } catch (error) {
      console.error('Error updating customer visit:', error)
      throw error
    }
  }

  // Get customer by phone number
  const getCustomerByPhone = (phoneNumber) => {
    return customers.find(customer => customer.phone === phoneNumber)
  }

  // Get customer by email
  const getCustomerByEmail = (email) => {
    return customers.find(customer => customer.email === email)
  }

  // Get top customers by spending
  const getTopCustomers = (limit = 10) => {
    return [...customers]
      .sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0))
      .slice(0, limit)
  }

  // Get customers by loyalty tier
  const getCustomersByTier = (tier) => {
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
  }




  const value = {
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
  }

  return (
    <CustomerContext.Provider value={value}>
      {children}
    </CustomerContext.Provider>
  )
}