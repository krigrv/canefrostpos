import React, { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material'
import {
  Save as SaveIcon,
  Business as BusinessIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon
} from '@mui/icons-material'
import { useAuth } from '../../contexts/AuthContext'
import { db } from '../../firebase/config'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import toast from 'react-hot-toast'

function Profile() {
  const { currentUser, updateUserProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [error, setError] = useState('')
  const [profileError, setProfileError] = useState('')
  
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '')
  
  const [businessDetails, setBusinessDetails] = useState({
    businessName: 'Canefrost Juice Shop',
    phoneNumber: '',
    gstin: '',
    emailId: '',
    businessAddress: '',
    fssaiNumber: ''
  })

  // Load saved business details from Firebase on component mount
  useEffect(() => {
    const loadBusinessDetails = async () => {
      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid)
          const userDoc = await getDoc(userDocRef)
          if (userDoc.exists() && userDoc.data().businessDetails) {
            setBusinessDetails(userDoc.data().businessDetails)
          }
        } catch (error) {
          console.error('Error loading business details:', error)
          // Fallback to localStorage for migration
          const savedDetails = localStorage.getItem('businessDetails')
          if (savedDetails) {
            setBusinessDetails(JSON.parse(savedDetails))
          }
        }
      }
    }
    loadBusinessDetails()
  }, [currentUser])

  // Update display name when currentUser changes
  useEffect(() => {
    setDisplayName(currentUser?.displayName || '')
  }, [currentUser])

  const handleInputChange = (field) => (event) => {
    setBusinessDetails({
      ...businessDetails,
      [field]: event.target.value
    })
    // Clear messages when user starts typing
    if (success) setSuccess(false)
    if (error) setError('')
  }

  const handleDisplayNameChange = (event) => {
    setDisplayName(event.target.value)
    // Clear messages when user starts typing
    if (profileSuccess) setProfileSuccess(false)
    if (profileError) setProfileError('')
  }

  const handleUpdateProfile = async () => {
    setProfileLoading(true)
    setProfileError('')
    setProfileSuccess(false)

    try {
      if (!displayName.trim()) {
        throw new Error('Display name is required')
      }

      await updateUserProfile({ displayName: displayName.trim() })
      setProfileSuccess(true)
      setTimeout(() => setProfileSuccess(false), 3000)
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile')
    } finally {
      setProfileLoading(false)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      // Validate required fields
      if (!businessDetails.phoneNumber.trim()) {
        throw new Error('Phone number is required')
      }
      if (!businessDetails.emailId.trim()) {
        throw new Error('Email ID is required')
      }
      if (!businessDetails.businessAddress.trim()) {
        throw new Error('Business address is required')
      }

      // Validate phone number format (basic validation)
      const phoneRegex = /^[+]?[0-9]{10,15}$/
      if (!phoneRegex.test(businessDetails.phoneNumber.replace(/\s/g, ''))) {
        throw new Error('Please enter a valid phone number')
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(businessDetails.emailId)) {
        throw new Error('Please enter a valid email address')
      }

      // Validate GSTIN format (if provided)
      if (businessDetails.gstin && businessDetails.gstin.length !== 15) {
        throw new Error('GSTIN should be 15 characters long')
      }

      // Save to Firebase Firestore
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid)
        await setDoc(userDocRef, {
          businessDetails: businessDetails,
          updatedAt: new Date()
        }, { merge: true })
        
        // Also save to localStorage as backup
        localStorage.setItem('businessDetails', JSON.stringify(businessDetails))
        
        toast.success('Business details saved successfully!')
      } else {
        throw new Error('User not authenticated')
      }
      
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography 
        variant="h4" 
        gutterBottom 
        sx={{ 
          mb: 3, 
          fontWeight: 600,
          fontSize: { xs: '1.5rem', md: '2rem' },
          textTransform: 'capitalize'
        }}
      >
        Business Profile
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <PersonIcon sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            Profile Settings
          </Typography>
        </Box>

        {/* User Profile Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main' }}>
            User Profile
          </Typography>
          
          {profileSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Display name updated successfully!
            </Alert>
          )}

          {profileError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {profileError}
            </Alert>
          )}

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Display Name *"
                value={displayName}
                onChange={handleDisplayNameChange}
                placeholder="Enter your display name"
                helperText="This name will be shown in the welcome message"
                InputProps={{
                  startAdornment: <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email Address"
                value={currentUser?.email || ''}
                disabled
                helperText="Email address cannot be changed"
                InputProps={{
                  startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button
              variant="contained"
              onClick={handleUpdateProfile}
              disabled={profileLoading || !displayName.trim()}
              startIcon={profileLoading ? <CircularProgress size={20} /> : <SaveIcon />}
              sx={{
                px: 3,
                py: 1
              }}
            >
              {profileLoading ? 'Updating...' : 'Update Profile'}
            </Button>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Business Details Section */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main' }}>
            Business Details
          </Typography>
        </Box>

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Business details saved successfully!
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Business Name"
              value={businessDetails.businessName}
              onChange={handleInputChange('businessName')}
              InputProps={{
                startAdornment: <BusinessIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Phone Number *"
              value={businessDetails.phoneNumber}
              onChange={handleInputChange('phoneNumber')}
              placeholder="+91 XXXXXXXXXX"
              InputProps={{
                startAdornment: <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Email ID *"
              type="email"
              value={businessDetails.emailId}
              onChange={handleInputChange('emailId')}
              placeholder="business@example.com"
              InputProps={{
                startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="GSTIN"
              value={businessDetails.gstin}
              onChange={handleInputChange('gstin')}
              placeholder="22AAAAA0000A1Z5"
              helperText="15-character GSTIN number (optional)"
              InputProps={{
                startAdornment: <AssignmentIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Business Address *"
              multiline
              rows={3}
              value={businessDetails.businessAddress}
              onChange={handleInputChange('businessAddress')}
              placeholder="Enter complete business address"
              InputProps={{
                startAdornment: <LocationIcon sx={{ mr: 1, color: 'text.secondary', alignSelf: 'flex-start', mt: 1 }} />
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="FSSAI Certificate Number"
              value={businessDetails.fssaiNumber}
              onChange={handleInputChange('fssaiNumber')}
              placeholder="12345678901234"
              helperText="14-digit FSSAI license number (optional)"
              InputProps={{
                startAdornment: <AssignmentIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
            sx={{
              px: 4,
              py: 1.5,
              fontWeight: 500
            }}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 500 }}>
          Account Information
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Display Name"
              value={currentUser?.displayName || ''}
              disabled
              helperText="Contact administrator to change display name"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Email Address"
              value={currentUser?.email || ''}
              disabled
              helperText="Contact administrator to change email address"
            />
          </Grid>
        </Grid>
      </Paper>
    </Box>
  )
}

export default Profile