import React from 'react';
import { useDeviceDetection, useAdvancedDeviceDetection } from '../../hooks/useDeviceDetection';
import {
  ResponsiveLayout,
  ResponsiveGrid,
  ResponsiveCard,
  ResponsiveButton,
  DeviceInfoDisplay
} from './ResponsiveLayout';
import {
  ResponsiveNavigation,
  ResponsiveHeader,
  ResponsiveContent
} from './ResponsiveNavigation';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';
import {
  Smartphone,
  Tablet,
  Monitor,
  Wifi,
  Battery,
  Signal,
  RotateCcw,
  Eye,
  Zap
} from 'lucide-react';

/**
 * Comprehensive test page for the responsive system
 */
export const ResponsiveTestPage = () => {
  const deviceInfo = useAdvancedDeviceDetection();
  const { isMobile, isTablet, isDesktop } = deviceInfo;

  const getDeviceIcon = () => {
    if (isMobile) return <Smartphone className="h-6 w-6" />;
    if (isTablet) return <Tablet className="h-6 w-6" />;
    return <Monitor className="h-6 w-6" />;
  };

  const getDeviceColor = () => {
    if (isMobile) return 'bg-blue-500';
    if (isTablet) return 'bg-green-500';
    return 'bg-purple-500';
  };

  return (
    <ResponsiveNavigation>
      <ResponsiveHeader 
        title="Responsive System Test" 
        actions={
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className={cn('text-white', getDeviceColor())}>
              {getDeviceIcon()}
              <span className="ml-1">{deviceInfo.deviceType}</span>
            </Badge>
            <ResponsiveButton variant="outline">
              Refresh
            </ResponsiveButton>
          </div>
        }
      />
      
      <ResponsiveContent>
        <ResponsiveLayout>
          {/* Device Information Section */}
          <section className="mb-8">
            <h2 className={cn(
              'font-bold mb-4 flex items-center',
              isMobile ? 'text-xl' : 'text-2xl'
            )}>
              <Eye className="mr-2 h-5 w-5" />
              Device Detection
            </h2>
            <DeviceInfoDisplay />
          </section>

          {/* Responsive Grid Demo */}
          <section className="mb-8">
            <h2 className={cn(
              'font-bold mb-4 flex items-center',
              isMobile ? 'text-xl' : 'text-2xl'
            )}>
              <Zap className="mr-2 h-5 w-5" />
              Responsive Grid System
            </h2>
            <p className="text-muted-foreground mb-6">
              This grid automatically adjusts: 
              <strong> Mobile (1 col) → Tablet (2 cols) → Desktop (3-4 cols)</strong>
            </p>
            
            <ResponsiveGrid>
              {[
                { title: 'Sales Overview', icon: '📊', color: 'bg-blue-50 border-blue-200' },
                { title: 'Inventory Status', icon: '📦', color: 'bg-green-50 border-green-200' },
                { title: 'Customer Analytics', icon: '👥', color: 'bg-purple-50 border-purple-200' },
                { title: 'Revenue Reports', icon: '💰', color: 'bg-yellow-50 border-yellow-200' },
                { title: 'Staff Performance', icon: '⭐', color: 'bg-red-50 border-red-200' },
                { title: 'System Health', icon: '🔧', color: 'bg-gray-50 border-gray-200' }
              ].map((item, index) => (
                <ResponsiveCard key={index} title={item.title} className={item.color}>
                  <div className="text-center">
                    <div className="text-4xl mb-4">{item.icon}</div>
                    <p className="text-muted-foreground mb-4">
                      Card content adapts to screen size and device capabilities.
                    </p>
                    <ResponsiveButton className="w-full">
                      {isMobile ? 'Tap' : 'Click'} to View
                    </ResponsiveButton>
                  </div>
                </ResponsiveCard>
              ))}
            </ResponsiveGrid>
          </section>

          {/* Device-Specific Features */}
          <section className="mb-8">
            <h2 className={cn(
              'font-bold mb-4 flex items-center',
              isMobile ? 'text-xl' : 'text-2xl'
            )}>
              <RotateCcw className="mr-2 h-5 w-5" />
              Device-Specific Features
            </h2>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* Touch Device Features */}
              {deviceInfo.isTouchDevice && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-blue-800 flex items-center">
                      <Smartphone className="mr-2 h-5 w-5" />
                      Touch Device
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-blue-700 space-y-2">
                      <li>• Larger touch targets</li>
                      <li>• Swipe gestures enabled</li>
                      <li>• Touch-optimized interactions</li>
                      <li>• Haptic feedback support</li>
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* iOS Specific */}
              {deviceInfo.isIOS && (
                <Card className="bg-gray-50 border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-gray-800 flex items-center">
                      📱 iOS Device
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-gray-700 space-y-2">
                      <li>• Safari-optimized styles</li>
                      <li>• iOS-specific gestures</li>
                      <li>• Native app integration</li>
                      <li>• Apple Pay support</li>
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Android Specific */}
              {deviceInfo.isAndroid && (
                <Card className="bg-green-50 border-green-200">
                  <CardHeader>
                    <CardTitle className="text-green-800 flex items-center">
                      🤖 Android Device
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-green-700 space-y-2">
                      <li>• Material Design elements</li>
                      <li>• Android-specific features</li>
                      <li>• Google Pay integration</li>
                      <li>• Chrome optimizations</li>
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Desktop Features */}
              {isDesktop && (
                <Card className="bg-purple-50 border-purple-200">
                  <CardHeader>
                    <CardTitle className="text-purple-800 flex items-center">
                      <Monitor className="mr-2 h-5 w-5" />
                      Desktop Experience
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-purple-700 space-y-2">
                      <li>• Full sidebar navigation</li>
                      <li>• Keyboard shortcuts</li>
                      <li>• Multi-window support</li>
                      <li>• Advanced data tables</li>
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          </section>

          {/* Orientation and Screen Info */}
          <section className="mb-8">
            <h2 className={cn(
              'font-bold mb-4',
              isMobile ? 'text-xl' : 'text-2xl'
            )}>
              Screen Information
            </h2>
            
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Screen Dimensions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Width:</span>
                      <Badge variant="outline">{deviceInfo.screenWidth}px</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Height:</span>
                      <Badge variant="outline">{deviceInfo.screenHeight}px</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Orientation:</span>
                      <Badge variant="outline">{deviceInfo.orientation}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Device Capabilities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span>Touch Support:</span>
                      <Badge variant={deviceInfo.isTouchDevice ? 'default' : 'secondary'}>
                        {deviceInfo.isTouchDevice ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Platform:</span>
                      <Badge variant="outline">
                        {deviceInfo.isIOS ? 'iOS' : deviceInfo.isAndroid ? 'Android' : 'Other'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Interactive Demo */}
          <section>
            <h2 className={cn(
              'font-bold mb-4',
              isMobile ? 'text-xl' : 'text-2xl'
            )}>
              Interactive Demo
            </h2>
            
            <Card>
              <CardHeader>
                <CardTitle>Try Resizing Your Browser</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Resize your browser window or rotate your device to see the responsive behavior in action.
                </p>
                
                <div className="grid gap-4">
                  <div className={cn(
                    'p-4 rounded-lg border-2 border-dashed transition-all duration-300',
                    isMobile && 'border-blue-300 bg-blue-50',
                    isTablet && 'border-green-300 bg-green-50',
                    isDesktop && 'border-purple-300 bg-purple-50'
                  )}>
                    <div className="text-center">
                      <div className="text-2xl mb-2">
                        {isMobile && '📱'}
                        {isTablet && '📱'}
                        {isDesktop && '🖥️'}
                      </div>
                      <p className="font-medium">
                        Currently viewing on: <strong>{deviceInfo.deviceType}</strong>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Screen: {deviceInfo.screenWidth} × {deviceInfo.screenHeight}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-center">
                    <ResponsiveButton onClick={() => window.location.reload()}>
                      🔄 Refresh to Test
                    </ResponsiveButton>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </ResponsiveLayout>
      </ResponsiveContent>
    </ResponsiveNavigation>
  );
};

export default ResponsiveTestPage;