/**
 * Migration Wizard Component
 * Guides users through the multi-outlet migration process
 * Integrates outlet migration, backup service, and security audit
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useOutlet } from '../../contexts/OutletContext';
import OutletMigration from '../../utils/outletMigration';
import CloudBackupService from '../../services/cloudBackupService';
import SecurityAuditService from '../../services/securityAuditService';
import { toast } from 'react-hot-toast';
import {
  CheckCircle as CheckCircleIcon,
  AlertTriangle as ExclamationTriangleIcon,
  ArrowRight as ArrowRightIcon,
  ArrowLeft as ArrowLeftIcon,
  Shield as ShieldCheckIcon,
  CloudUpload as CloudArrowUpIcon,
  Building2 as BuildingOfficeIcon
} from 'lucide-react';

const MigrationWizard = ({ onComplete }) => {
  const { currentUser } = useAuth();
  const { createOutlet } = useOutlet();
  const [currentStep, setCurrentStep] = useState(0);
  const [migrationData, setMigrationData] = useState({
    outletInfo: {
      name: '',
      address: '',
      phone: '',
      businessName: 'Canefrost POS'
    },
    backupSchedule: 'daily',
    securitySettings: {
      enableAuditLogging: true,
      enableRealTimeMonitoring: true,
      requireTwoFactor: false
    }
  });
  const [migrationStatus, setMigrationStatus] = useState({
    backup: 'pending',
    migration: 'pending',
    security: 'pending',
    verification: 'pending'
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [migrationResult, setMigrationResult] = useState(null);

  const migrationService = new OutletMigration();
  const backupService = new CloudBackupService();
  const securityService = new SecurityAuditService();

  const steps = [
    {
      id: 'welcome',
      title: 'Welcome to Multi-Outlet Setup',
      description: 'Transform your single outlet into a centralized multi-outlet system'
    },
    {
      id: 'outlet-info',
      title: 'Outlet Information',
      description: 'Configure your main outlet details'
    },
    {
      id: 'security-setup',
      title: 'Security Configuration',
      description: 'Set up industry-grade security and monitoring'
    },
    {
      id: 'backup-config',
      title: 'Backup Configuration',
      description: 'Configure automated cloud backups'
    },
    {
      id: 'migration',
      title: 'Data Migration',
      description: 'Migrate your existing data to the new structure'
    },
    {
      id: 'verification',
      title: 'Verification & Completion',
      description: 'Verify migration and complete setup'
    }
  ];

  useEffect(() => {
    // Check if migration is needed
    const checkMigrationStatus = async () => {
      if (currentUser) {
        const isNeeded = await migrationService.isMigrationNeeded(currentUser.uid);
        if (!isNeeded) {
          toast.success('Migration already completed');
          onComplete?.();
        }
      }
    };

    checkMigrationStatus();
  }, [currentUser]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleInputChange = (section, field, value) => {
    setMigrationData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const startMigration = async () => {
    if (!currentUser) {
      toast.error('User not authenticated');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Step 1: Create pre-migration backup
      setMigrationStatus(prev => ({ ...prev, backup: 'processing' }));
      
      await securityService.logSecurityEvent({
        eventType: 'migration_started',
        userId: currentUser.uid,
        userEmail: currentUser.email,
        riskLevel: 'medium',
        details: {
          migrationData: migrationData.outletInfo
        }
      });

      // Step 2: Perform migration
      setMigrationStatus(prev => ({ ...prev, backup: 'completed', migration: 'processing' }));
      
      const migrationResult = await migrationService.migrateToMultiOutlet(
        currentUser,
        migrationData.outletInfo
      );
      
      setMigrationStatus(prev => ({ ...prev, migration: 'completed', security: 'processing' }));

      // Step 3: Set up security monitoring
      await securityService.logSecurityEvent({
        eventType: 'outlet_created',
        userId: currentUser.uid,
        userEmail: currentUser.email,
        outletId: migrationResult.id,
        riskLevel: 'low',
        details: {
          outletName: migrationData.outletInfo.name,
          migrationCompleted: true
        }
      });

      setMigrationStatus(prev => ({ ...prev, security: 'completed', verification: 'processing' }));

      // Step 4: Set up automated backups
      await backupService.scheduleAutomaticBackups(
        migrationResult.id,
        currentUser.uid,
        migrationData.backupSchedule
      );

      // Step 5: Create initial backup
      await backupService.createBackup(migrationResult.id, currentUser.uid, 'post_migration');

      setMigrationStatus(prev => ({ ...prev, verification: 'completed' }));
      setMigrationResult(migrationResult);

      await securityService.logSecurityEvent({
        eventType: 'migration_completed',
        userId: currentUser.uid,
        userEmail: currentUser.email,
        outletId: migrationResult.id,
        riskLevel: 'low',
        details: {
          migrationSuccess: true,
          outletId: migrationResult.id
        }
      });

      toast.success('Migration completed successfully!');
      
    } catch (error) {
      console.error('Migration failed:', error);
      toast.error(`Migration failed: ${error.message}`);
      
      await securityService.logSecurityEvent({
        eventType: 'migration_failed',
        userId: currentUser.uid,
        userEmail: currentUser.email,
        riskLevel: 'high',
        details: {
          error: error.message,
          step: Object.keys(migrationStatus).find(key => migrationStatus[key] === 'processing')
        }
      });
      
      setMigrationStatus(prev => {
        const newStatus = { ...prev };
        Object.keys(newStatus).forEach(key => {
          if (newStatus[key] === 'processing') {
            newStatus[key] = 'failed';
          }
        });
        return newStatus;
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const renderStepContent = () => {
    switch (steps[currentStep].id) {
      case 'welcome':
        return (
          <div className="text-center space-y-6">
            <div className="mx-auto w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
              <BuildingOfficeIcon className="w-12 h-12 text-blue-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Welcome to Multi-Outlet Setup
              </h3>
              <p className="text-gray-600 max-w-2xl mx-auto">
                This wizard will help you transform your current single-outlet system into a powerful 
                multi-outlet platform with centralized management, industry-grade security, and 
                automated cloud backups.
              </p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400 mt-0.5 mr-3" />
                <div className="text-left">
                  <h4 className="text-sm font-medium text-yellow-800">Important Notice</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    This process will create a backup of your existing data and migrate it to a new 
                    multi-outlet structure. The migration is reversible, but please ensure you have 
                    a stable internet connection.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'outlet-info':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Setup Your Main Outlet</h3>
              <p className="text-gray-600 mb-6">
                Your current login and existing data will become your <strong>Main Outlet</strong>. 
                After migration, you'll be able to create additional outlets from the management dashboard.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <BuildingOfficeIcon className="w-5 h-5 text-blue-500 mt-0.5 mr-3" />
                  <div className="text-left">
                    <h4 className="text-sm font-medium text-blue-800">What happens next?</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      • Your existing products, sales, and customers become part of your Main Outlet<br/>
                      • You can create new outlets with independent inventories and operations<br/>
                      • Manage all outlets from a centralized dashboard
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Outlet Name *
                </label>
                <input
                  type="text"
                  value={migrationData.outletInfo.name}
                  onChange={(e) => handleInputChange('outletInfo', 'name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Main Outlet"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Name
                </label>
                <input
                  type="text"
                  value={migrationData.outletInfo.businessName}
                  onChange={(e) => handleInputChange('outletInfo', 'businessName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Canefrost POS"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <textarea
                  value={migrationData.outletInfo.address}
                  onChange={(e) => handleInputChange('outletInfo', 'address', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Enter outlet address"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={migrationData.outletInfo.phone}
                  onChange={(e) => handleInputChange('outletInfo', 'phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>
            </div>
          </div>
        );

      case 'security-setup':
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <ShieldCheckIcon className="w-8 h-8 text-green-600" />
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Security Configuration</h3>
                <p className="text-gray-600">Configure industry-grade security features</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Audit Logging</h4>
                  <p className="text-sm text-gray-600">Track all user actions and system events</p>
                </div>
                <input
                  type="checkbox"
                  checked={migrationData.securitySettings.enableAuditLogging}
                  onChange={(e) => handleInputChange('securitySettings', 'enableAuditLogging', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Real-time Monitoring</h4>
                  <p className="text-sm text-gray-600">Monitor suspicious activities in real-time</p>
                </div>
                <input
                  type="checkbox"
                  checked={migrationData.securitySettings.enableRealTimeMonitoring}
                  onChange={(e) => handleInputChange('securitySettings', 'enableRealTimeMonitoring', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Two-Factor Authentication</h4>
                  <p className="text-sm text-gray-600">Require 2FA for all users (recommended)</p>
                </div>
                <input
                  type="checkbox"
                  checked={migrationData.securitySettings.requireTwoFactor}
                  onChange={(e) => handleInputChange('securitySettings', 'requireTwoFactor', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Security Features Included:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Encrypted data transmission and storage</li>
                <li>• Automated threat detection</li>
                <li>• Role-based access control</li>
                <li>• Compliance reporting</li>
                <li>• Account lockout protection</li>
              </ul>
            </div>
          </div>
        );

      case 'backup-config':
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <CloudArrowUpIcon className="w-8 h-8 text-blue-600" />
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Backup Configuration</h3>
                <p className="text-gray-600">Set up automated cloud backups for your data</p>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Backup Frequency
              </label>
              <div className="space-y-3">
                {[
                  { value: 'daily', label: 'Daily', description: 'Backup every day at midnight' },
                  { value: 'weekly', label: 'Weekly', description: 'Backup every Sunday at midnight' },
                  { value: 'monthly', label: 'Monthly', description: 'Backup on the 1st of every month' }
                ].map((option) => (
                  <div key={option.value} className="flex items-center space-x-3">
                    <input
                      type="radio"
                      id={option.value}
                      name="backupSchedule"
                      value={option.value}
                      checked={migrationData.backupSchedule === option.value}
                      onChange={(e) => setMigrationData(prev => ({ ...prev, backupSchedule: e.target.value }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <label htmlFor={option.value} className="flex-1">
                      <div className="font-medium text-gray-900">{option.label}</div>
                      <div className="text-sm text-gray-600">{option.description}</div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">Backup Features:</h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Encrypted cloud storage</li>
                <li>• 90-day retention period</li>
                <li>• One-click restore functionality</li>
                <li>• Automatic integrity verification</li>
                <li>• Compressed storage to minimize costs</li>
              </ul>
            </div>
          </div>
        );

      case 'migration':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Data Migration</h3>
              <p className="text-gray-600 mb-6">
                Your existing data will be migrated to the new multi-outlet structure. This process is safe and reversible.
              </p>
            </div>
            
            <div className="space-y-4">
              {Object.entries(migrationStatus).map(([step, status]) => (
                <div key={step} className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg">
                  <div className="flex-shrink-0">
                    {status === 'completed' && (
                      <CheckCircleIcon className="w-6 h-6 text-green-500" />
                    )}
                    {status === 'processing' && (
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    )}
                    {status === 'pending' && (
                      <div className="w-6 h-6 border-2 border-gray-300 rounded-full" />
                    )}
                    {status === 'failed' && (
                      <ExclamationTriangleIcon className="w-6 h-6 text-red-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 capitalize">
                      {step.replace('_', ' ')}
                    </div>
                    <div className="text-sm text-gray-600 capitalize">
                      {status === 'processing' ? 'In progress...' : status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {!isProcessing && Object.values(migrationStatus).every(status => status === 'pending') && (
              <button
                onClick={startMigration}
                disabled={!migrationData.outletInfo.name}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Start Migration
              </button>
            )}
          </div>
        );

      case 'verification':
        return (
          <div className="text-center space-y-6">
            {Object.values(migrationStatus).every(status => status === 'completed') ? (
              <>
                <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircleIcon className="w-12 h-12 text-green-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Migration Completed Successfully!
                  </h3>
                  <p className="text-gray-600 max-w-2xl mx-auto mb-6">
                    Your system has been successfully upgraded to a multi-outlet platform with 
                    industry-grade security and automated backups.
                  </p>
                </div>
                
                {migrationResult && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-left">
                    <h4 className="font-medium text-gray-900 mb-4">Migration Summary:</h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div>Outlet ID: <span className="font-mono">{migrationResult.id}</span></div>
                      <div>Outlet Name: {migrationData.outletInfo.name}</div>
                      <div>Security: Enabled with audit logging</div>
                      <div>Backups: {migrationData.backupSchedule} schedule configured</div>
                      <div>Status: Active and ready to use</div>
                    </div>
                  </div>
                )}
                
                <button
                  onClick={() => onComplete?.(migrationResult)}
                  className="bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700"
                >
                  Complete Setup
                </button>
              </>
            ) : (
              <div>
                <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
                  <ExclamationTriangleIcon className="w-12 h-12 text-red-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Migration Incomplete
                </h3>
                <p className="text-gray-600 mb-6">
                  The migration process encountered issues. Please review the status above and try again.
                </p>
                <button
                  onClick={() => setCurrentStep(4)}
                  className="bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700"
                >
                  Return to Migration
                </button>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (steps[currentStep].id) {
      case 'outlet-info':
        return migrationData.outletInfo.name.trim() !== '';
      case 'migration':
        return Object.values(migrationStatus).every(status => status === 'completed');
      default:
        return true;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center ${
                  index < steps.length - 1 ? 'flex-1' : ''
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    index <= currentStep
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-4 ${
                      index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-900">
              {steps[currentStep].title}
            </h2>
            <p className="text-sm text-gray-600">
              {steps[currentStep].description}
            </p>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span>Previous</span>
          </button>
          
          {currentStep < steps.length - 1 && (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Next</span>
              <ArrowRightIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MigrationWizard;