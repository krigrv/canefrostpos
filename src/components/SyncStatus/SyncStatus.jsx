import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import './SyncStatus.css';
import {
  CloudDone as CloudDoneIcon,
  CloudOff as CloudOffIcon,
  Sync as SyncIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useSync } from '../../contexts/SyncContext';

const SyncStatus = () => {
  const {
    isOnline,
    isSyncing,
    queueCount,
    lastSyncTime,
    syncError,
    forceSyncAll
  } = useSync();

  const getSyncStatusColor = () => {
    if (!isOnline) return '#DC2626'; // Red for offline
    if (syncError) return '#F59E0B'; // Amber for error
    if (isSyncing) return '#3B82F6'; // Blue for syncing
    if (queueCount > 0) return '#F59E0B'; // Amber for pending
    return '#059669'; // Green for synced
  };

  const getSyncStatusText = () => {
    if (!isOnline) return 'Offline';
    if (syncError) return 'Sync Error';
    if (isSyncing) return 'Syncing...';
    if (queueCount > 0) return `${queueCount} Pending`;
    return 'Synced';
  };

  const getSyncIcon = () => {
    if (!isOnline) return <CloudOffIcon />;
    if (syncError) return <WarningIcon />;
    if (isSyncing) return <SyncIcon className="animate-spin" />;
    if (queueCount > 0) return <SyncIcon />;
    return <CloudDoneIcon />;
  };

  const formatLastSyncTime = () => {
    if (!lastSyncTime) return 'Never';
    const now = new Date();
    const diff = now - lastSyncTime;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return lastSyncTime.toLocaleDateString();
  };

  return (
    <Paper
      elevation={1}
      sx={{
        p: 2,
        mb: 1,
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: 2,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="subtitle2" sx={{ color: '#374151', fontWeight: 600 }}>
          Sync Status
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            icon={getSyncIcon()}
            label={getSyncStatusText()}
            size="small"
            sx={{
              backgroundColor: getSyncStatusColor(),
              color: 'white',
              fontWeight: 500,
              '& .MuiChip-icon': {
                color: 'white'
              }
            }}
          />
          
          {(queueCount > 0 || syncError) && (
            <Tooltip title="Force sync all data">
              <IconButton
                size="small"
                onClick={forceSyncAll}
                disabled={isSyncing}
                sx={{
                  color: '#6B7280',
                  '&:hover': {
                    backgroundColor: '#F3F4F6',
                    color: '#374151'
                  }
                }}
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Progress bar for syncing */}
      {isSyncing && (
        <LinearProgress
          sx={{
            mb: 1,
            backgroundColor: '#E5E7EB',
            '& .MuiLinearProgress-bar': {
              backgroundColor: '#3B82F6'
            }
          }}
        />
      )}

      {/* Additional info */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="caption" sx={{ color: '#6B7280' }}>
          Last sync: {formatLastSyncTime()}
        </Typography>
        
        {!isOnline && (
          <Typography variant="caption" sx={{ color: '#DC2626', fontWeight: 500 }}>
            Working offline
          </Typography>
        )}
      </Box>

      {/* Error message */}
      {syncError && (
        <Box sx={{ mt: 1, p: 1, backgroundColor: '#FEF2F2', borderRadius: 1, border: '1px solid #FECACA' }}>
          <Typography variant="caption" sx={{ color: '#DC2626', display: 'block' }}>
            {syncError}
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default SyncStatus;