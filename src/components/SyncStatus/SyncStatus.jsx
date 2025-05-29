import React from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import './SyncStatus.css';
import {
  CloudCheck as CloudDoneIcon,
  CloudOff as CloudOffIcon,
  RotateCw as SyncIcon,
  AlertTriangle as WarningIcon,
  RefreshCw as RefreshIcon
} from 'lucide-react';
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
    <div className="p-4 mb-2 bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-700">
          Sync Status
        </h3>
        
        <div className="flex items-center gap-2">
          <Badge 
            className="text-white font-medium"
            style={{ backgroundColor: getSyncStatusColor() }}
          >
            <span className="mr-1">{getSyncIcon()}</span>
            {getSyncStatusText()}
          </Badge>
          
          {(queueCount > 0 || syncError) && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={forceSyncAll}
                    disabled={isSyncing}
                    className="h-8 w-8 p-0 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  >
                    <RefreshIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Force sync all data</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      {/* Progress bar for syncing */}
      {isSyncing && (
        <div className="mb-2">
          <Progress value={undefined} className="h-1" />
        </div>
      )}

      {/* Additional info */}
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-500">
          Last sync: {formatLastSyncTime()}
        </span>
        
        {!isOnline && (
          <span className="text-xs text-red-600 font-medium">
            Working offline
          </span>
        )}
      </div>

      {/* Error message */}
      {syncError && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
          <span className="text-xs text-red-600 block">
            {syncError}
          </span>
        </div>
      )}
    </div>
  );
};

export default SyncStatus;