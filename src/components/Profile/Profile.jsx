import React, { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Alert, AlertDescription } from '../ui/alert'
import { Loader2, Save, Building, Phone, Mail, MapPin, FileText, User } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContextSupabase'
import { supabase } from '../../supabase/config'
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

  // Load saved business details from Supabase on component mount
  useEffect(() => {
    const loadBusinessDetails = async () => {
      if (currentUser) {
        try {
          const { data, error } = await supabase
            .from('user_profiles')
            .select('business_details')
            .eq('user_id', currentUser.id)
            .single()
          
          if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
            throw error
          }
          
          if (data?.business_details) {
            setBusinessDetails(data.business_details)
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

      // Save to Supabase
      if (currentUser) {
        const { error } = await supabase
          .from('user_profiles')
          .upsert({
            user_id: currentUser.id,
            business_details: businessDetails,
            updated_at: new Date().toISOString()
          })
        
        if (error) throw error
        
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
    <div className="p-6">
      <h1 className="text-2xl md:text-3xl font-semibold mb-6 capitalize">
        Business Profile
      </h1>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-3">
            <User className="h-8 w-8 text-blue-600" />
            <CardTitle className="text-2xl font-bold">Profile Settings</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {/* User Profile Section */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-blue-600 mb-4">User Profile</h2>
            
            {profileSuccess && (
              <Alert className="mb-4">
                <AlertDescription>
                  Display name updated successfully!
                </AlertDescription>
              </Alert>
            )}

            {profileError && (
              <Alert className="mb-4" variant="destructive">
                <AlertDescription>
                  {profileError}
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={handleDisplayNameChange}
                    placeholder="Enter your display name"
                    className="pl-10"
                  />
                </div>
                <p className="text-sm text-gray-500">This name will be shown in the welcome message</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    value={currentUser?.email || ''}
                    disabled
                    className="pl-10 bg-gray-50"
                  />
                </div>
                <p className="text-sm text-gray-500">Email address cannot be changed</p>
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <Button
                onClick={handleUpdateProfile}
                disabled={profileLoading || !displayName.trim()}
                className="px-6"
              >
                {profileLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Update Profile
                  </>
                )}
              </Button>
            </div>
        </div>

        <hr className="my-6" />

        {/* Business Details Section */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-blue-600 mb-4 flex items-center">
            <Building className="w-5 h-5 mr-2" />
            Business Details
          </h2>
            {success && (
              <Alert className="mb-6" variant="default">
                <AlertDescription>
                  Business details saved successfully!
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert className="mb-6" variant="destructive">
                <AlertDescription>
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="businessName">Business Name</Label>
            <div className="relative">
              <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="businessName"
                value={businessDetails.businessName}
                onChange={handleInputChange('businessName')}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number *</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="phoneNumber"
                value={businessDetails.phoneNumber}
                onChange={handleInputChange('phoneNumber')}
                placeholder="+91 XXXXXXXXXX"
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="emailId">Email ID *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="emailId"
                type="email"
                value={businessDetails.emailId}
                onChange={handleInputChange('emailId')}
                placeholder="business@example.com"
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gstin">GSTIN</Label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="gstin"
                value={businessDetails.gstin}
                onChange={handleInputChange('gstin')}
                placeholder="22AAAAA0000A1Z5"
                className="pl-10"
              />
            </div>
            <p className="text-sm text-gray-500">15-character GSTIN number (optional)</p>
          </div>

          <div className="col-span-1 md:col-span-2 space-y-2">
            <Label htmlFor="businessAddress">Business Address *</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <textarea
                id="businessAddress"
                rows={3}
                value={businessDetails.businessAddress}
                onChange={handleInputChange('businessAddress')}
                placeholder="Enter complete business address"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
          </div>

          <div className="space-y-2">
              <Label htmlFor="fssaiNumber">FSSAI Certificate Number</Label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="fssaiNumber"
                  value={businessDetails.fssaiNumber}
                  onChange={handleInputChange('fssaiNumber')}
                  placeholder="12345678901234"
                  className="pl-10"
                />
              </div>
              <p className="text-sm text-gray-500">14-digit FSSAI license number (optional)</p>
            </div>
          </div>

          <hr className="my-6" />

          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={loading}
              className="px-8 py-2 font-medium"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Account Information Section */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-blue-600 mb-4">Account Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="accountDisplayName">Display Name</Label>
              <Input
                id="accountDisplayName"
                value={currentUser?.displayName || ''}
                disabled
                className="bg-gray-50"
              />
              <p className="text-sm text-gray-500">Contact administrator to change display name</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountEmail">Email Address</Label>
              <Input
                id="accountEmail"
                value={currentUser?.email || ''}
                disabled
                className="bg-gray-50"
              />
              <p className="text-sm text-gray-500">Contact administrator to change email address</p>
            </div>
          </div>
        </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Profile