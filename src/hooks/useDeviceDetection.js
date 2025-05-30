import { useState, useEffect } from 'react';

/**
 * Custom hook to detect device type based on screen width
 * Returns device type and screen dimensions
 */
export const useDeviceDetection = () => {
  const [deviceInfo, setDeviceInfo] = useState({
    deviceType: 'desktop',
    screenWidth: typeof window !== 'undefined' ? window.innerWidth : 1200,
    screenHeight: typeof window !== 'undefined' ? window.innerHeight : 800,
    isMobile: false,
    isTablet: false,
    isDesktop: true
  });

  useEffect(() => {
    const updateDeviceInfo = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      let deviceType = 'desktop';
      let isMobile = false;
      let isTablet = false;
      let isDesktop = false;

      // Device breakpoints
      if (width < 768) {
        deviceType = 'mobile';
        isMobile = true;
      } else if (width >= 768 && width < 1024) {
        deviceType = 'tablet';
        isTablet = true;
      } else {
        deviceType = 'desktop';
        isDesktop = true;
      }

      setDeviceInfo({
        deviceType,
        screenWidth: width,
        screenHeight: height,
        isMobile,
        isTablet,
        isDesktop
      });
    };

    // Initial detection
    updateDeviceInfo();

    // Listen for window resize
    window.addEventListener('resize', updateDeviceInfo);
    
    // Listen for orientation change (mobile/tablet)
    window.addEventListener('orientationchange', () => {
      // Small delay to ensure dimensions are updated after orientation change
      setTimeout(updateDeviceInfo, 100);
    });

    // Cleanup
    return () => {
      window.removeEventListener('resize', updateDeviceInfo);
      window.removeEventListener('orientationchange', updateDeviceInfo);
    };
  }, []);

  return deviceInfo;
};

/**
 * Enhanced device detection with user agent analysis
 * Provides more detailed device information
 */
export const useAdvancedDeviceDetection = () => {
  const basicDeviceInfo = useDeviceDetection();
  const [advancedInfo, setAdvancedInfo] = useState({
    ...basicDeviceInfo,
    userAgent: '',
    isIOS: false,
    isAndroid: false,
    isTouchDevice: false,
    orientation: 'landscape'
  });

  useEffect(() => {
    const detectAdvancedInfo = () => {
      const userAgent = navigator.userAgent;
      const isIOS = /iPad|iPhone|iPod/.test(userAgent);
      const isAndroid = /Android/.test(userAgent);
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      // Detect orientation
      const orientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';

      setAdvancedInfo({
        ...basicDeviceInfo,
        userAgent,
        isIOS,
        isAndroid,
        isTouchDevice,
        orientation
      });
    };

    detectAdvancedInfo();

    // Listen for orientation changes
    const handleOrientationChange = () => {
      setTimeout(detectAdvancedInfo, 100);
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', detectAdvancedInfo);

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', detectAdvancedInfo);
    };
  }, [basicDeviceInfo]);

  return advancedInfo;
};