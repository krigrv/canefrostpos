# Database Cleanup System

This document describes the enhanced database cleanup system for Canefrost POS, which includes automatic duplicate prevention and periodic cleanup routines.

## Overview

The cleanup system consists of three main components:

1. **Enhanced Cleanup Script** (`cleanup-database.js`) - Removes duplicates and fixes data integrity issues
2. **Automatic Duplicate Prevention** - Integrated into the application to prevent duplicate creation
3. **Periodic Cleanup Service** (`periodic-cleanup-service.js`) - Runs continuous background cleanup

## Features

### ✨ Enhanced Duplicate Detection
- Detects duplicates by product name (case-insensitive)
- Detects duplicates by barcode
- Identifies data integrity issues (missing required fields)
- Provides detailed reporting of found issues

### 🛡️ Automatic Prevention
- Prevents duplicate products from being created
- Validates against existing products before adding new ones
- Shows user-friendly error messages
- Logs prevention activities for monitoring

### ⏰ Periodic Cleanup
- Configurable cleanup intervals
- Background service for continuous monitoring
- Graceful shutdown handling
- Comprehensive logging and statistics

## Usage

### Manual Cleanup

#### Basic Cleanup
```bash
npm run cleanup-db
```
Runs the original cleanup with user confirmation.

#### Enhanced Cleanup
```bash
npm run cleanup-enhanced
```
Runs enhanced cleanup with automatic duplicate detection by name and barcode.

#### Direct Node Commands
```bash
# Enhanced cleanup
node cleanup-database.js enhanced

# Scheduled cleanup (runs every 24 hours)
node cleanup-database.js schedule

# Basic cleanup
node cleanup-database.js
```

### Periodic Cleanup Service

#### Start the Service
```bash
npm run cleanup-service
```

#### Configuration
Set environment variables to configure the service:

```bash
# Set cleanup interval (default: 24 hours)
export CLEANUP_INTERVAL_HOURS=12

# Disable initial cleanup on start (default: true)
export CLEANUP_ON_START=false

# Start the service
npm run cleanup-service
```

#### Production Deployment
For production, you can run the service as a background process:

```bash
# Using nohup
nohup npm run cleanup-service > cleanup.log 2>&1 &

# Using PM2 (recommended)
pm2 start periodic-cleanup-service.js --name "canefrost-cleanup"
```

## Environment Setup

Ensure your `.env` file contains the required Firebase configuration:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

## Integration with Application

The cleanup system is automatically integrated into the application:

### Automatic Duplicate Prevention
- When adding new products through the UI, the system checks for duplicates
- Prevents creation if a product with the same name or barcode exists
- Shows error messages to users
- Logs prevention activities

### Real-time Monitoring
- The `DebugProducts` component shows duplicate statistics
- Console logs provide detailed information about duplicate detection
- Toast notifications inform users of duplicate prevention

## Monitoring and Logs

### Cleanup Logs
The cleanup system provides detailed logging:

```
🔍 Starting enhanced database cleanup...
📊 Found 7829 total documents in products collection
🔄 Found name duplicate: "Apple Juice" (IDs: abc123, def456)
📋 Enhanced Cleanup Summary:
   • Total products: 7829
   • Unique by name: 136
   • Unique by barcode: 136
   • Duplicates found: 7693
   • Data errors found: 0
✅ Successfully deleted 7693 problematic entries!
```

### Prevention Logs
```
🚫 Duplicate prevented: "Apple Juice" already exists (ID: abc123)
```

### Service Logs
```
🚀 Starting Canefrost POS Periodic Cleanup Service
⏰ Cleanup interval: 24 hours
✅ Initial cleanup completed: 0 items cleaned, 0 errors fixed
🎯 Periodic cleanup service is now running...
```

## API Reference

### Functions Available for Import

```javascript
import { 
  preventDuplicateCreation,
  enhancedCleanupDatabase,
  periodicCleanup,
  schedulePeriodicCleanup 
} from './cleanup-database.js';
```

#### `preventDuplicateCreation(productData)`
Checks if a product would be a duplicate before creation.

**Parameters:**
- `productData` (Object): Product data with `name` and optional `barcode`

**Returns:**
```javascript
{
  isDuplicate: boolean,
  existingId?: string,
  existingData?: Object,
  error?: Error
}
```

#### `enhancedCleanupDatabase()`
Runs enhanced cleanup with duplicate detection by name and barcode.

**Returns:**
```javascript
{
  cleaned: number,
  errors: number,
  duplicates: number
}
```

#### `periodicCleanup()`
Runs a single cleanup cycle.

#### `schedulePeriodicCleanup()`
Starts the periodic cleanup scheduler (24-hour intervals).

## Troubleshooting

### Common Issues

#### Environment Variables Not Found
```
❌ Missing required Firebase environment variables.
```
**Solution:** Ensure your `.env` file exists and contains all required Firebase configuration variables.

#### Permission Errors
```
❌ Error during cleanup: FirebaseError: Missing or insufficient permissions
```
**Solution:** Ensure your Firebase project has proper Firestore rules and the service account has write permissions.

#### Import Errors
```
❌ Cannot resolve module './cleanup-database.js'
```
**Solution:** Ensure the cleanup script is in the project root and uses ES modules (`.js` extension).

### Performance Considerations

- Large databases (>10,000 products) may take several minutes to clean
- The cleanup process uses batched writes for efficiency
- Periodic cleanup runs are designed to be lightweight when no duplicates exist
- Consider running manual cleanup during low-traffic periods

## Best Practices

1. **Regular Monitoring**: Check cleanup logs regularly for duplicate patterns
2. **Backup Before Cleanup**: Always backup your database before running manual cleanup
3. **Test Environment**: Test cleanup scripts in a development environment first
4. **Gradual Rollout**: Start with longer cleanup intervals and adjust based on duplicate frequency
5. **Monitor Performance**: Watch for any performance impact during cleanup operations

## Support

For issues or questions about the cleanup system:

1. Check the logs for detailed error messages
2. Verify environment configuration
3. Test with a small dataset first
4. Review Firebase console for any service issues

---

*Last updated: December 2024*