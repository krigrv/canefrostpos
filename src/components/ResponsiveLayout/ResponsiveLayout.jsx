import React from 'react';
import { useDeviceDetection, useAdvancedDeviceDetection } from '../../hooks/useDeviceDetection';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

/**
 * Responsive Layout Component that adapts based on device type
 */
export const ResponsiveLayout = ({ children, className }) => {
  const { deviceType, isMobile, isTablet, isDesktop, screenWidth } = useDeviceDetection();

  // Define responsive classes based on device type
  const getResponsiveClasses = () => {
    const baseClasses = 'transition-all duration-300 ease-in-out';
    
    if (isMobile) {
      return `${baseClasses} px-2 py-4 space-y-3`;
    } else if (isTablet) {
      return `${baseClasses} px-4 py-6 space-y-4`;
    } else {
      return `${baseClasses} px-6 py-8 space-y-6`;
    }
  };

  return (
    <div className={cn(getResponsiveClasses(), className)}>
      {children}
    </div>
  );
};

/**
 * Responsive Grid Component
 */
export const ResponsiveGrid = ({ children, className }) => {
  const { isMobile, isTablet, isDesktop } = useDeviceDetection();

  const getGridClasses = () => {
    if (isMobile) {
      return 'grid grid-cols-1 gap-3';
    } else if (isTablet) {
      return 'grid grid-cols-2 gap-4';
    } else {
      return 'grid grid-cols-3 lg:grid-cols-4 gap-6';
    }
  };

  return (
    <div className={cn(getGridClasses(), className)}>
      {children}
    </div>
  );
};

/**
 * Responsive Card Component
 */
export const ResponsiveCard = ({ title, children, className }) => {
  const { isMobile, isTablet } = useDeviceDetection();

  const getCardClasses = () => {
    if (isMobile) {
      return 'w-full min-h-[200px]';
    } else if (isTablet) {
      return 'w-full min-h-[250px]';
    } else {
      return 'w-full min-h-[300px]';
    }
  };

  const getTitleSize = () => {
    if (isMobile) {
      return 'text-lg';
    } else if (isTablet) {
      return 'text-xl';
    } else {
      return 'text-2xl';
    }
  };

  return (
    <Card className={cn(getCardClasses(), className)}>
      <CardHeader className={isMobile ? 'pb-3' : 'pb-4'}>
        <CardTitle className={getTitleSize()}>{title}</CardTitle>
      </CardHeader>
      <CardContent className={isMobile ? 'pt-0' : 'pt-2'}>
        {children}
      </CardContent>
    </Card>
  );
};

/**
 * Responsive Button Component
 */
export const ResponsiveButton = ({ children, className, ...props }) => {
  const { isMobile, isTablet } = useDeviceDetection();

  const getButtonClasses = () => {
    if (isMobile) {
      return 'h-12 px-4 text-sm';
    } else if (isTablet) {
      return 'h-11 px-6 text-base';
    } else {
      return 'h-10 px-8 text-base';
    }
  };

  return (
    <Button className={cn(getButtonClasses(), className)} {...props}>
      {children}
    </Button>
  );
};

/**
 * Device Info Display Component (for debugging/testing)
 */
export const DeviceInfoDisplay = () => {
  const deviceInfo = useAdvancedDeviceDetection();

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-lg">Device Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div><strong>Device Type:</strong> {deviceInfo.deviceType}</div>
          <div><strong>Screen Size:</strong> {deviceInfo.screenWidth} x {deviceInfo.screenHeight}</div>
          <div><strong>Orientation:</strong> {deviceInfo.orientation}</div>
          <div><strong>Touch Device:</strong> {deviceInfo.isTouchDevice ? 'Yes' : 'No'}</div>
          <div><strong>iOS:</strong> {deviceInfo.isIOS ? 'Yes' : 'No'}</div>
          <div><strong>Android:</strong> {deviceInfo.isAndroid ? 'Yes' : 'No'}</div>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Demo Component showing responsive behavior
 */
export const ResponsiveDemo = () => {
  const { deviceType, isMobile, isTablet, isDesktop } = useDeviceDetection();

  return (
    <ResponsiveLayout>
      <DeviceInfoDisplay />
      
      <div className="mb-6">
        <h1 className={cn(
          'font-bold mb-4',
          isMobile ? 'text-2xl' : isTablet ? 'text-3xl' : 'text-4xl'
        )}>
          Responsive Layout Demo
        </h1>
        <p className={cn(
          'text-muted-foreground',
          isMobile ? 'text-sm' : 'text-base'
        )}>
          This layout automatically adapts to {deviceType} devices.
        </p>
      </div>

      <ResponsiveGrid>
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <ResponsiveCard key={item} title={`Card ${item}`}>
            <p className="text-muted-foreground mb-4">
              This card adapts its size and spacing based on the device type.
            </p>
            <ResponsiveButton>
              {isMobile ? 'Tap' : 'Click'} Me
            </ResponsiveButton>
          </ResponsiveCard>
        ))}
      </ResponsiveGrid>

      {/* Device-specific content */}
      {isMobile && (
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <p className="text-blue-800 font-medium">
              📱 Mobile-specific content: Optimized for touch interactions
            </p>
          </CardContent>
        </Card>
      )}

      {isTablet && (
        <Card className="mt-6 bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <p className="text-green-800 font-medium">
              📱 Tablet-specific content: Balanced layout for medium screens
            </p>
          </CardContent>
        </Card>
      )}

      {isDesktop && (
        <Card className="mt-6 bg-purple-50 border-purple-200">
          <CardContent className="pt-6">
            <p className="text-purple-800 font-medium">
              🖥️ Desktop-specific content: Full-featured experience
            </p>
          </CardContent>
        </Card>
      )}
    </ResponsiveLayout>
  );
};