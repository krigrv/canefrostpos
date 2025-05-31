/**
 * Security Audit Service
 * Industry-grade security monitoring, audit logging, and compliance
 * Implements real-time threat detection and security analytics
 */
import {
  collection,
  doc,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { toast } from 'react-hot-toast';

class SecurityAuditService {
  constructor() {
    this.SECURITY_EVENTS = {
      LOGIN_SUCCESS: 'login_success',
      LOGIN_FAILURE: 'login_failure',
      LOGOUT: 'logout',
      PASSWORD_CHANGE: 'password_change',
      UNAUTHORIZED_ACCESS: 'unauthorized_access',
      DATA_EXPORT: 'data_export',
      DATA_IMPORT: 'data_import',
      BACKUP_CREATED: 'backup_created',
      BACKUP_RESTORED: 'backup_restored',
      OUTLET_CREATED: 'outlet_created',
      OUTLET_DELETED: 'outlet_deleted',
      USER_ASSIGNED: 'user_assigned',
      USER_REMOVED: 'user_removed',
      PERMISSION_CHANGED: 'permission_changed',
      SUSPICIOUS_ACTIVITY: 'suspicious_activity',
      BULK_OPERATION: 'bulk_operation',
      ADMIN_ACTION: 'admin_action'
    };
    
    this.RISK_LEVELS = {
      LOW: 'low',
      MEDIUM: 'medium',
      HIGH: 'high',
      CRITICAL: 'critical'
    };
    
    this.MAX_LOGIN_ATTEMPTS = 5;
    this.LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes
    this.SUSPICIOUS_ACTIVITY_THRESHOLD = 10; // actions per minute
  }

  /**
   * Log security event
   */
  async logSecurityEvent({
    eventType,
    userId,
    userEmail,
    outletId = null,
    ipAddress = null,
    userAgent = null,
    details = {},
    riskLevel = this.RISK_LEVELS.LOW
  }) {
    try {
      const eventData = {
        eventType,
        userId,
        userEmail,
        outletId,
        ipAddress: ipAddress || await this.getClientIP(),
        userAgent: userAgent || navigator.userAgent,
        timestamp: serverTimestamp(),
        riskLevel,
        details,
        sessionId: this.getSessionId(),
        deviceFingerprint: await this.generateDeviceFingerprint()
      };

      // Add geolocation if available
      const location = await this.getGeolocation();
      if (location) {
        eventData.location = location;
      }

      await addDoc(collection(db, 'security_logs'), eventData);

      // Check for suspicious patterns
      await this.analyzeSuspiciousActivity(userId, eventType);

      // Send alerts for high-risk events
      if (riskLevel === this.RISK_LEVELS.HIGH || riskLevel === this.RISK_LEVELS.CRITICAL) {
        await this.sendSecurityAlert(eventData);
      }

      console.log('Security event logged:', eventType);
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  /**
   * Track login attempts and implement account lockout
   */
  async trackLoginAttempt(email, success, ipAddress = null) {
    const eventType = success ? this.SECURITY_EVENTS.LOGIN_SUCCESS : this.SECURITY_EVENTS.LOGIN_FAILURE;
    
    await this.logSecurityEvent({
      eventType,
      userId: null,
      userEmail: email,
      ipAddress,
      riskLevel: success ? this.RISK_LEVELS.LOW : this.RISK_LEVELS.MEDIUM,
      details: {
        success,
        timestamp: new Date().toISOString()
      }
    });

    if (!success) {
      // Check for brute force attempts
      const recentFailures = await this.getRecentLoginFailures(email);
      
      if (recentFailures >= this.MAX_LOGIN_ATTEMPTS) {
        await this.lockAccount(email);
        
        await this.logSecurityEvent({
          eventType: this.SECURITY_EVENTS.SUSPICIOUS_ACTIVITY,
          userId: null,
          userEmail: email,
          ipAddress,
          riskLevel: this.RISK_LEVELS.HIGH,
          details: {
            reason: 'Multiple failed login attempts',
            attemptCount: recentFailures,
            action: 'account_locked'
          }
        });
        
        throw new Error('Account temporarily locked due to multiple failed login attempts');
      }
    }
  }

  /**
   * Monitor data access patterns
   */
  async auditDataAccess({
    userId,
    userEmail,
    outletId,
    collection: collectionName,
    operation, // 'read', 'write', 'delete'
    documentId = null,
    recordCount = 1
  }) {
    const riskLevel = this.assessDataAccessRisk(operation, recordCount);
    
    await this.logSecurityEvent({
      eventType: recordCount > 100 ? this.SECURITY_EVENTS.BULK_OPERATION : 'data_access',
      userId,
      userEmail,
      outletId,
      riskLevel,
      details: {
        collection: collectionName,
        operation,
        documentId,
        recordCount,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Monitor outlet management operations
   */
  async auditOutletOperation({
    userId,
    userEmail,
    operation, // 'create', 'update', 'delete', 'assign_user', 'remove_user'
    outletId,
    targetUserId = null,
    changes = {}
  }) {
    const riskLevel = operation === 'delete' ? this.RISK_LEVELS.HIGH : this.RISK_LEVELS.MEDIUM;
    
    await this.logSecurityEvent({
      eventType: this.getOutletEventType(operation),
      userId,
      userEmail,
      outletId,
      riskLevel,
      details: {
        operation,
        targetUserId,
        changes,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Generate security compliance report
   */
  async generateComplianceReport(outletId, startDate, endDate) {
    try {
      const securityLogs = await getDocs(
        query(
          collection(db, 'security_logs'),
          where('outletId', '==', outletId),
          where('timestamp', '>=', startDate),
          where('timestamp', '<=', endDate),
          orderBy('timestamp', 'desc')
        )
      );

      const logs = securityLogs.docs.map(doc => doc.data());
      
      const report = {
        period: {
          start: startDate,
          end: endDate
        },
        outletId,
        summary: {
          totalEvents: logs.length,
          riskDistribution: this.calculateRiskDistribution(logs),
          eventTypes: this.calculateEventTypeDistribution(logs),
          uniqueUsers: new Set(logs.map(log => log.userId)).size,
          suspiciousActivities: logs.filter(log => 
            log.eventType === this.SECURITY_EVENTS.SUSPICIOUS_ACTIVITY
          ).length
        },
        details: {
          loginAttempts: this.analyzeLoginAttempts(logs),
          dataAccess: this.analyzeDataAccess(logs),
          adminActions: this.analyzeAdminActions(logs),
          securityIncidents: this.identifySecurityIncidents(logs)
        },
        recommendations: this.generateSecurityRecommendations(logs),
        generatedAt: new Date().toISOString()
      };

      // Store report
      await addDoc(collection(db, 'compliance_reports'), {
        ...report,
        createdAt: serverTimestamp()
      });

      return report;
    } catch (error) {
      console.error('Failed to generate compliance report:', error);
      throw error;
    }
  }

  /**
   * Real-time security monitoring
   */
  startSecurityMonitoring(outletId, callback) {
    const unsubscribe = onSnapshot(
      query(
        collection(db, 'security_logs'),
        where('outletId', '==', outletId),
        where('riskLevel', 'in', [this.RISK_LEVELS.HIGH, this.RISK_LEVELS.CRITICAL]),
        orderBy('timestamp', 'desc'),
        limit(50)
      ),
      (snapshot) => {
        const alerts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        callback(alerts);
      },
      (error) => {
        console.error('Security monitoring error:', error);
      }
    );

    return unsubscribe;
  }

  /**
   * Check user permissions and log access attempts
   */
  async validateAccess(userId, userEmail, outletId, requiredPermission) {
    try {
      // Get user data
      const userDoc = await getDocs(
        query(collection(db, 'users'), where('__name__', '==', userId))
      );

      if (userDoc.empty) {
        await this.logSecurityEvent({
          eventType: this.SECURITY_EVENTS.UNAUTHORIZED_ACCESS,
          userId,
          userEmail,
          outletId,
          riskLevel: this.RISK_LEVELS.HIGH,
          details: {
            reason: 'User not found',
            requiredPermission
          }
        });
        return false;
      }

      const userData = userDoc.docs[0].data();
      
      // Check if user has access to outlet
      if (!userData.outlets || !userData.outlets.includes(outletId)) {
        await this.logSecurityEvent({
          eventType: this.SECURITY_EVENTS.UNAUTHORIZED_ACCESS,
          userId,
          userEmail,
          outletId,
          riskLevel: this.RISK_LEVELS.HIGH,
          details: {
            reason: 'No outlet access',
            userOutlets: userData.outlets,
            requiredPermission
          }
        });
        return false;
      }

      // Check specific permission
      const hasPermission = this.checkPermission(userData, requiredPermission);
      
      if (!hasPermission) {
        await this.logSecurityEvent({
          eventType: this.SECURITY_EVENTS.UNAUTHORIZED_ACCESS,
          userId,
          userEmail,
          outletId,
          riskLevel: this.RISK_LEVELS.MEDIUM,
          details: {
            reason: 'Insufficient permissions',
            userRole: userData.role,
            requiredPermission
          }
        });
      }

      return hasPermission;
    } catch (error) {
      console.error('Access validation failed:', error);
      return false;
    }
  }

  // Helper methods

  async getRecentLoginFailures(email) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const failuresSnapshot = await getDocs(
      query(
        collection(db, 'security_logs'),
        where('userEmail', '==', email),
        where('eventType', '==', this.SECURITY_EVENTS.LOGIN_FAILURE),
        where('timestamp', '>=', oneHourAgo)
      )
    );

    return failuresSnapshot.docs.length;
  }

  async lockAccount(email) {
    await addDoc(collection(db, 'account_locks'), {
      email,
      lockedAt: serverTimestamp(),
      unlockAt: new Date(Date.now() + this.LOCKOUT_DURATION),
      reason: 'Multiple failed login attempts'
    });
  }

  async analyzeSuspiciousActivity(userId, eventType) {
    if (!userId) return;

    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    
    const recentActivity = await getDocs(
      query(
        collection(db, 'security_logs'),
        where('userId', '==', userId),
        where('timestamp', '>=', oneMinuteAgo)
      )
    );

    if (recentActivity.docs.length > this.SUSPICIOUS_ACTIVITY_THRESHOLD) {
      await this.logSecurityEvent({
        eventType: this.SECURITY_EVENTS.SUSPICIOUS_ACTIVITY,
        userId,
        userEmail: recentActivity.docs[0]?.data()?.userEmail,
        riskLevel: this.RISK_LEVELS.HIGH,
        details: {
          reason: 'High activity rate',
          activityCount: recentActivity.docs.length,
          timeWindow: '1 minute'
        }
      });
    }
  }

  async sendSecurityAlert(eventData) {
    // In production, integrate with email/SMS service
    console.warn('SECURITY ALERT:', eventData);
    
    // Store alert for dashboard
    await addDoc(collection(db, 'security_alerts'), {
      ...eventData,
      alertSent: true,
      alertTimestamp: serverTimestamp()
    });
  }

  assessDataAccessRisk(operation, recordCount) {
    if (operation === 'delete' && recordCount > 10) {
      return this.RISK_LEVELS.HIGH;
    }
    if (recordCount > 1000) {
      return this.RISK_LEVELS.HIGH;
    }
    if (recordCount > 100) {
      return this.RISK_LEVELS.MEDIUM;
    }
    return this.RISK_LEVELS.LOW;
  }

  getOutletEventType(operation) {
    switch (operation) {
      case 'create': return this.SECURITY_EVENTS.OUTLET_CREATED;
      case 'delete': return this.SECURITY_EVENTS.OUTLET_DELETED;
      case 'assign_user': return this.SECURITY_EVENTS.USER_ASSIGNED;
      case 'remove_user': return this.SECURITY_EVENTS.USER_REMOVED;
      default: return this.SECURITY_EVENTS.ADMIN_ACTION;
    }
  }

  calculateRiskDistribution(logs) {
    const distribution = {
      [this.RISK_LEVELS.LOW]: 0,
      [this.RISK_LEVELS.MEDIUM]: 0,
      [this.RISK_LEVELS.HIGH]: 0,
      [this.RISK_LEVELS.CRITICAL]: 0
    };

    logs.forEach(log => {
      distribution[log.riskLevel] = (distribution[log.riskLevel] || 0) + 1;
    });

    return distribution;
  }

  calculateEventTypeDistribution(logs) {
    const distribution = {};
    
    logs.forEach(log => {
      distribution[log.eventType] = (distribution[log.eventType] || 0) + 1;
    });

    return distribution;
  }

  analyzeLoginAttempts(logs) {
    const loginLogs = logs.filter(log => 
      log.eventType === this.SECURITY_EVENTS.LOGIN_SUCCESS || 
      log.eventType === this.SECURITY_EVENTS.LOGIN_FAILURE
    );

    return {
      total: loginLogs.length,
      successful: loginLogs.filter(log => log.eventType === this.SECURITY_EVENTS.LOGIN_SUCCESS).length,
      failed: loginLogs.filter(log => log.eventType === this.SECURITY_EVENTS.LOGIN_FAILURE).length,
      uniqueUsers: new Set(loginLogs.map(log => log.userEmail)).size
    };
  }

  analyzeDataAccess(logs) {
    const dataLogs = logs.filter(log => log.details?.operation);
    
    return {
      total: dataLogs.length,
      reads: dataLogs.filter(log => log.details.operation === 'read').length,
      writes: dataLogs.filter(log => log.details.operation === 'write').length,
      deletes: dataLogs.filter(log => log.details.operation === 'delete').length,
      bulkOperations: logs.filter(log => log.eventType === this.SECURITY_EVENTS.BULK_OPERATION).length
    };
  }

  analyzeAdminActions(logs) {
    const adminLogs = logs.filter(log => log.eventType === this.SECURITY_EVENTS.ADMIN_ACTION);
    
    return {
      total: adminLogs.length,
      outletOperations: logs.filter(log => 
        [this.SECURITY_EVENTS.OUTLET_CREATED, this.SECURITY_EVENTS.OUTLET_DELETED].includes(log.eventType)
      ).length,
      userManagement: logs.filter(log => 
        [this.SECURITY_EVENTS.USER_ASSIGNED, this.SECURITY_EVENTS.USER_REMOVED].includes(log.eventType)
      ).length
    };
  }

  identifySecurityIncidents(logs) {
    return logs.filter(log => 
      log.riskLevel === this.RISK_LEVELS.HIGH || 
      log.riskLevel === this.RISK_LEVELS.CRITICAL ||
      log.eventType === this.SECURITY_EVENTS.SUSPICIOUS_ACTIVITY ||
      log.eventType === this.SECURITY_EVENTS.UNAUTHORIZED_ACCESS
    );
  }

  generateSecurityRecommendations(logs) {
    const recommendations = [];
    
    const failedLogins = logs.filter(log => log.eventType === this.SECURITY_EVENTS.LOGIN_FAILURE).length;
    if (failedLogins > 10) {
      recommendations.push({
        type: 'authentication',
        priority: 'high',
        message: 'Consider implementing two-factor authentication due to high number of failed login attempts'
      });
    }

    const suspiciousActivities = logs.filter(log => log.eventType === this.SECURITY_EVENTS.SUSPICIOUS_ACTIVITY).length;
    if (suspiciousActivities > 0) {
      recommendations.push({
        type: 'monitoring',
        priority: 'medium',
        message: 'Review user activity patterns and consider implementing rate limiting'
      });
    }

    const bulkOperations = logs.filter(log => log.eventType === this.SECURITY_EVENTS.BULK_OPERATION).length;
    if (bulkOperations > 5) {
      recommendations.push({
        type: 'data_protection',
        priority: 'medium',
        message: 'High number of bulk operations detected. Consider additional approval workflows for bulk changes'
      });
    }

    return recommendations;
  }

  checkPermission(userData, requiredPermission) {
    // Simple role-based permission check
    const rolePermissions = {
      'admin': ['*'], // All permissions
      'manager': ['read', 'write', 'manage_staff', 'view_reports'],
      'staff': ['read', 'write'],
      'viewer': ['read']
    };

    const userPermissions = rolePermissions[userData.role] || [];
    return userPermissions.includes('*') || userPermissions.includes(requiredPermission);
  }

  async getClientIP() {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      return 'unknown';
    }
  }

  getSessionId() {
    return sessionStorage.getItem('sessionId') || 'unknown';
  }

  async generateDeviceFingerprint() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Device fingerprint', 2, 2);
    
    return {
      screen: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      canvasFingerprint: canvas.toDataURL().slice(-50) // Last 50 chars
    };
  }

  async getGeolocation() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        () => resolve(null),
        { timeout: 5000 }
      );
    });
  }
}

export default SecurityAuditService;