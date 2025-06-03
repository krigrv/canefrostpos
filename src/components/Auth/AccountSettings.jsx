/*
 * Account Settings - Main Account Management
 * Allows main account to update email address and other account settings
 * Includes security measures and verification processes
 */
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { AlertCircle, Mail, Shield, Key, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContextSupabase';
import { useOutlet } from '../../contexts/OutletContext';
import {
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendEmailVerification,
  updateProfile
} from 'firebase/auth';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import toast from 'react-hot-toast';

function AccountSettings() {
  const { currentUser } = useAuth();
  const { isMainAccount } = useOutlet();
  const [loading, setLoading] = useState(false);
  const [emailForm, setEmailForm] = useState({
    newEmail: '',
    currentPassword: '',
    confirmNewEmail: ''
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [profileForm, setProfileForm] = useState({
    displayName: currentUser?.displayName || ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [activeSection, setActiveSection] = useState('profile');

  useEffect(() => {
    if (currentUser) {
      setProfileForm({
        displayName: currentUser.displayName || ''
      });
    }
  }, [currentUser]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    if (!profileForm.displayName.trim()) {
      toast.error('Display name cannot be empty');
      return;
    }

    try {
      setLoading(true);
      await updateProfile(currentUser, {
        displayName: profileForm.displayName.trim()
      });
      
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEmail = async (e) => {
    e.preventDefault();
    
    if (!emailForm.newEmail || !emailForm.currentPassword || !emailForm.confirmNewEmail) {
      toast.error('Please fill in all fields');
      return;
    }

    if (emailForm.newEmail !== emailForm.confirmNewEmail) {
      toast.error('Email addresses do not match');
      return;
    }

    if (emailForm.newEmail === currentUser.email) {
      toast.error('New email must be different from current email');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailForm.newEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        emailForm.currentPassword
      );
      await reauthenticateWithCredential(currentUser, credential);
      
      // Update email in Firebase Auth
      await updateEmail(currentUser, emailForm.newEmail);
      
      // Send verification email
      await sendEmailVerification(currentUser);
      
      // Update email in all relevant Firestore documents if this is the main account
      if (isMainAccount) {
        await updateMainAccountEmail(emailForm.newEmail);
      }
      
      toast.success('Email updated successfully! Please check your new email for verification.');
      setEmailForm({ newEmail: '', currentPassword: '', confirmNewEmail: '' });
      
    } catch (error) {
      console.error('Error updating email:', error);
      if (error.code === 'auth/wrong-password') {
        toast.error('Current password is incorrect');
      } else if (error.code === 'auth/email-already-in-use') {
        toast.error('This email is already in use by another account');
      } else if (error.code === 'auth/requires-recent-login') {
        toast.error('Please log out and log back in before changing your email');
      } else {
        toast.error('Failed to update email. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateMainAccountEmail = async (newEmail) => {
    try {
      // Update user document
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        email: newEmail,
        emailUpdatedAt: new Date()
      });

      // Update any access codes created by this account
      const accessCodesQuery = query(
        collection(db, 'accessCodes'),
        where('createdByEmail', '==', currentUser.email)
      );
      const accessCodesSnapshot = await getDocs(accessCodesQuery);
      
      const updatePromises = accessCodesSnapshot.docs.map(doc => 
        updateDoc(doc.ref, {
          createdByEmail: newEmail
        })
      );
      
      await Promise.all(updatePromises);
      
      // Update outlet documents if any reference the main account email
      const outletsQuery = query(
        collection(db, 'outlets'),
        where('createdBy', '==', currentUser.email)
      );
      const outletsSnapshot = await getDocs(outletsQuery);
      
      const outletUpdatePromises = outletsSnapshot.docs.map(doc => 
        updateDoc(doc.ref, {
          createdBy: newEmail
        })
      );
      
      await Promise.all(outletUpdatePromises);
      
    } catch (error) {
      console.error('Error updating main account email in Firestore:', error);
      // Don't throw error as the auth email update was successful
      toast.warning('Email updated in authentication, but some references may need manual update');
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmNewPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      toast.error('New password must be different from current password');
      return;
    }

    try {
      setLoading(true);
      
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        passwordForm.currentPassword
      );
      await reauthenticateWithCredential(currentUser, credential);
      
      // Update password
      await updatePassword(currentUser, passwordForm.newPassword);
      
      toast.success('Password updated successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
      
    } catch (error) {
      console.error('Error updating password:', error);
      if (error.code === 'auth/wrong-password') {
        toast.error('Current password is incorrect');
      } else if (error.code === 'auth/weak-password') {
        toast.error('New password is too weak');
      } else if (error.code === 'auth/requires-recent-login') {
        toast.error('Please log out and log back in before changing your password');
      } else {
        toast.error('Failed to update password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Not Authenticated
              </h3>
              <p className="text-gray-600">
                Please log in to access account settings.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Account Settings</h2>
        <p className="text-gray-600 mt-1">
          Manage your account information and security settings
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'profile', label: 'Profile', icon: CheckCircle },
            { id: 'email', label: 'Email', icon: Mail },
            { id: 'password', label: 'Password', icon: Key }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeSection === id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Profile Section */}
      {activeSection === 'profile' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  type="text"
                  value={profileForm.displayName}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, displayName: e.target.value }))}
                  placeholder="Enter your display name"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Current Email</Label>
                <Input
                  type="email"
                  value={currentUser.email}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500">
                  To change your email, use the Email tab
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Account Type</Label>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">
                    {isMainAccount ? 'Main Account (Full Access)' : 'Staff Account'}
                  </span>
                </div>
              </div>
              
              <Button type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Update Profile'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Email Section */}
      {activeSection === 'email' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Change Email Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">Important</span>
              </div>
              <p className="text-sm text-yellow-700 mt-1">
                Changing your email will require verification. You'll need to verify the new email before it becomes active.
                {isMainAccount && ' As the main account, this will also update references throughout the system.'}
              </p>
            </div>
            
            <form onSubmit={handleUpdateEmail} className="space-y-4">
              <div className="space-y-2">
                <Label>Current Email</Label>
                <Input
                  type="email"
                  value={currentUser.email}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="newEmail">New Email Address</Label>
                <Input
                  id="newEmail"
                  type="email"
                  value={emailForm.newEmail}
                  onChange={(e) => setEmailForm(prev => ({ ...prev, newEmail: e.target.value }))}
                  placeholder="Enter new email address"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmNewEmail">Confirm New Email</Label>
                <Input
                  id="confirmNewEmail"
                  type="email"
                  value={emailForm.confirmNewEmail}
                  onChange={(e) => setEmailForm(prev => ({ ...prev, confirmNewEmail: e.target.value }))}
                  placeholder="Confirm new email address"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="currentPasswordEmail">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPasswordEmail"
                    type={showPasswords.current ? 'text' : 'password'}
                    value={emailForm.currentPassword}
                    onChange={(e) => setEmailForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                    placeholder="Enter your current password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => togglePasswordVisibility('current')}
                  >
                    {showPasswords.current ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              <Button type="submit" disabled={loading}>
                {loading ? 'Updating Email...' : 'Update Email'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Password Section */}
      {activeSection === 'password' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Change Password
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPasswordChange">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPasswordChange"
                    type={showPasswords.current ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                    placeholder="Enter your current password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => togglePasswordVisibility('current')}
                  >
                    {showPasswords.current ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPasswords.new ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="Enter new password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => togglePasswordVisibility('new')}
                  >
                    {showPasswords.new ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Must be at least 6 characters long
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmNewPassword"
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwordForm.confirmNewPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmNewPassword: e.target.value }))}
                    placeholder="Confirm new password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => togglePasswordVisibility('confirm')}
                  >
                    {showPasswords.confirm ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              <Button type="submit" disabled={loading}>
                {loading ? 'Updating Password...' : 'Update Password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default AccountSettings;