import React from 'react';
import { ResponsiveTestPage } from './ResponsiveTestPage';
import { useDeviceDetection } from '../../hooks/useDeviceDetection';
import { ResponsiveLayout, ResponsiveGrid, ResponsiveCard, ResponsiveButton } from './ResponsiveLayout';

/**
 * Example of how to integrate responsive components into existing app
 */
export const IntegrationExample = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎯 Responsive System Integration
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            This example shows how to integrate the responsive system into your existing CANEFROST POS application.
          </p>
        </div>

        <ResponsiveGrid className="mb-8">
          <ResponsiveCard title="📱 Device Detection">
            <p className="text-gray-600 mb-4">
              Automatically detects mobile, tablet, and desktop devices with real-time updates.
            </p>
            <ResponsiveButton className="w-full">
              Learn More
            </ResponsiveButton>
          </ResponsiveCard>

          <ResponsiveCard title="🎨 Adaptive UI">
            <p className="text-gray-600 mb-4">
              Components automatically adjust their layout, spacing, and behavior based on screen size.
            </p>
            <ResponsiveButton className="w-full">
              View Examples
            </ResponsiveButton>
          </ResponsiveCard>

          <ResponsiveCard title="⚡ Easy Integration">
            <p className="text-gray-600 mb-4">
              Drop-in replacement for existing components with zero configuration required.
            </p>
            <ResponsiveButton className="w-full">
              Get Started
            </ResponsiveButton>
          </ResponsiveCard>
        </ResponsiveGrid>

        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            🚀 Try the Interactive Demo
          </h2>
          <p className="text-gray-600 mb-6">
            Experience the responsive system in action with our comprehensive test page.
          </p>
          <ResponsiveButton 
            onClick={() => {
              // In a real app, this would navigate to the test page
              console.log('Navigate to responsive test page');
              alert('In a real app, this would navigate to the ResponsiveTestPage component!');
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
          >
            Launch Demo →
          </ResponsiveButton>
        </div>
      </div>
    </div>
  );
};

/**
 * Quick Start Guide Component
 */
export const QuickStartGuide = () => {
  const { deviceType } = useDeviceDetection();

  const steps = [
    {
      title: '1. Import the Hook',
      code: `import { useDeviceDetection } from './hooks/useDeviceDetection';`,
      description: 'Start by importing the device detection hook'
    },
    {
      title: '2. Use in Component',
      code: `const { isMobile, isTablet, isDesktop } = useDeviceDetection();`,
      description: 'Get device information in your component'
    },
    {
      title: '3. Conditional Rendering',
      code: `{isMobile && <MobileComponent />}
{isTablet && <TabletComponent />}
{isDesktop && <DesktopComponent />}`,
      description: 'Render different components based on device type'
    },
    {
      title: '4. Responsive Styling',
      code: `className={cn(
  'base-styles',
  isMobile && 'mobile-styles',
  isTablet && 'tablet-styles',
  isDesktop && 'desktop-styles'
)}`,
      description: 'Apply device-specific styles conditionally'
    }
  ];

  return (
    <ResponsiveLayout>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          🚀 Quick Start Guide
        </h2>
        <p className="text-gray-600 mb-2">
          Get started with the responsive system in 4 easy steps.
        </p>
        <p className="text-sm text-blue-600 font-medium">
          Currently viewing on: {deviceType}
        </p>
      </div>

      <div className="space-y-6">
        {steps.map((step, index) => (
          <ResponsiveCard key={index} title={step.title}>
            <p className="text-gray-600 mb-4">{step.description}</p>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
              <pre>{step.code}</pre>
            </div>
          </ResponsiveCard>
        ))}
      </div>

      <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          💡 Pro Tip
        </h3>
        <p className="text-blue-800">
          For the best experience, test your responsive components on real devices, not just browser dev tools. 
          The system detects actual device capabilities like touch support and platform-specific features.
        </p>
      </div>
    </ResponsiveLayout>
  );
};

/**
 * How to add to your existing App.jsx or routing
 */
export const RoutingExample = () => {
  return (
    <div className="bg-gray-900 text-green-400 p-6 rounded-lg font-mono text-sm">
      <div className="mb-4 text-white font-bold">// Add to your App.jsx or routing:</div>
      <pre>{`
import { ResponsiveTestPage } from './components/ResponsiveLayout';
import { IntegrationExample } from './components/ResponsiveLayout/IntegrationExample';

// In your routing or component:
<Routes>
  <Route path="/responsive-demo" element={<ResponsiveTestPage />} />
  <Route path="/responsive-guide" element={<IntegrationExample />} />
  {/* Your existing routes */}
</Routes>

// Or add as a direct component:
<div>
  <ResponsiveTestPage />
</div>
      `}</pre>
    </div>
  );
};

export default IntegrationExample;