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

const StaffContext = createContext()

export function useStaff() {
  const context = useContext(StaffContext)
  if (!context) {
    throw new Error('useStaff must be used within a StaffProvider')
  }
  return context
}

export function StaffProvider({ children }) {
  const [staff, setStaff] = useState([])
  const [shifts, setShifts] = useState([])
  const [loading, setLoading] = useState(true)
  const { queueOperation, isOnline } = useSync()

  // Load staff from Firestore with real-time updates
  useEffect(() => {
    console.log('StaffContext: Setting up real-time listener for staff')
    
    const staffQuery = query(collection(db, 'staff'), orderBy('createdAt', 'desc'))
    const unsubscribeStaff = onSnapshot(
      staffQuery,
      (snapshot) => {
        const staffData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          joinDate: doc.data().joinDate?.toDate?.() || doc.data().joinDate
        }))
        
        console.log(`StaffContext: Loaded ${staffData.length} staff members (real-time)`)
        setStaff(staffData)
        setLoading(false)
      },
      (error) => {
        console.error('Error loading staff from Firestore:', error)
        setStaff([])
        setLoading(false)
      }
    )

    // Load shifts from Firestore
    const shiftsQuery = query(collection(db, 'shifts'), orderBy('date', 'desc'))
    const unsubscribeShifts = onSnapshot(
      shiftsQuery,
      (snapshot) => {
        const shiftsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date?.toDate?.() || doc.data().date
        }))
        
        console.log(`StaffContext: Loaded ${shiftsData.length} shifts (real-time)`)
        setShifts(shiftsData)
      },
      (error) => {
        console.error('Error loading shifts from Firestore:', error)
        setShifts([])
      }
    )

    return () => {
      console.log('StaffContext: Cleanup - unsubscribing from real-time listeners')
      unsubscribeStaff()
      unsubscribeShifts()
    }
  }, [])

  // Add new staff member with sync support
  const addStaffMember = async (staffData) => {
    try {
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const staffWithDefaults = {
        ...staffData,
        id: tempId,
        joinDate: new Date(staffData.joinDate),
        totalSales: 0,
        shiftsThisWeek: 0,
        status: 'Active',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // Add to local state immediately for optimistic updates
      setStaff(prev => [...prev, staffWithDefaults])
      
      if (isOnline) {
        // Try immediate sync
        try {
          const docRef = await addDoc(collection(db, 'staff'), staffWithDefaults)
          // Update local state with real Firebase ID
          setStaff(prev => prev.map(s => 
            s.id === tempId ? { ...s, id: docRef.id } : s
          ))
          console.log('Staff member added with ID:', docRef.id)
          toast.success('Staff member added successfully')
          return docRef.id
        } catch (error) {
          // Queue for later sync if immediate sync fails
          queueOperation({
            type: 'create',
            collection: 'staff',
            data: staffWithDefaults,
            tempId
          })
          toast.success('Staff member added (will sync when online)')
          return tempId
        }
      } else {
        // Queue for sync when online
        queueOperation({
          type: 'create',
          collection: 'staff',
          data: staffWithDefaults,
          tempId
        })
        toast.success('Staff member added (will sync when online)')
        return tempId
      }
    } catch (error) {
      console.error('Error adding staff member:', error)
      toast.error('Failed to add staff member')
      throw error
    }
  }

  // Update staff member
  const updateStaffMember = async (staffId, staffData) => {
    try {
      const updateData = {
        ...staffData,
        updatedAt: new Date()
      }
      
      // Convert joinDate to Date if it's a string
      if (staffData.joinDate && typeof staffData.joinDate === 'string') {
        updateData.joinDate = new Date(staffData.joinDate)
      }
      
      await updateDoc(doc(db, 'staff', staffId), updateData)
      toast.success('Staff member updated successfully')
    } catch (error) {
      console.error('Error updating staff member:', error)
      toast.error('Failed to update staff member')
      throw error
    }
  }

  // Delete staff member
  const deleteStaffMember = async (staffId) => {
    try {
      await deleteDoc(doc(db, 'staff', staffId))
      toast.success('Staff member deleted successfully')
    } catch (error) {
      console.error('Error deleting staff member:', error)
      toast.error('Failed to delete staff member')
      throw error
    }
  }

  // Add new shift
  const addShift = async (shiftData) => {
    try {
      const docRef = await addDoc(collection(db, 'shifts'), {
        ...shiftData,
        date: new Date(shiftData.date),
        createdAt: new Date(),
        updatedAt: new Date()
      })
      
      console.log('Shift added with ID:', docRef.id)
      toast.success('Shift added successfully')
      return docRef.id
    } catch (error) {
      console.error('Error adding shift:', error)
      toast.error('Failed to add shift')
      throw error
    }
  }

  // Update shift
  const updateShift = async (shiftId, shiftData) => {
    try {
      const updateData = {
        ...shiftData,
        updatedAt: new Date()
      }
      
      // Convert date to Date if it's a string
      if (shiftData.date && typeof shiftData.date === 'string') {
        updateData.date = new Date(shiftData.date)
      }
      
      await updateDoc(doc(db, 'shifts', shiftId), updateData)
      toast.success('Shift updated successfully')
    } catch (error) {
      console.error('Error updating shift:', error)
      toast.error('Failed to update shift')
      throw error
    }
  }

  // Delete shift
  const deleteShift = async (shiftId) => {
    try {
      await deleteDoc(doc(db, 'shifts', shiftId))
      toast.success('Shift deleted successfully')
    } catch (error) {
      console.error('Error deleting shift:', error)
      toast.error('Failed to delete shift')
      throw error
    }
  }



  const value = {
    staff,
    shifts,
    loading,
    addStaffMember,
    updateStaffMember,
    deleteStaffMember,
    addShift,
    updateShift,
    deleteShift
  }

  return (
    <StaffContext.Provider value={value}>
      {children}
    </StaffContext.Provider>
  )
}