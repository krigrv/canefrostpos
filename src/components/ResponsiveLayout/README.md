# Responsive Layout System

A comprehensive responsive layout system that automatically detects device types (mobile, tablet, desktop) and adapts the UI accordingly.

## Features

- **Automatic Device Detection**: Detects mobile, tablet, and desktop devices based on screen width
- **Responsive Components**: Pre-built components that adapt to different screen sizes
- **Advanced Device Info**: Includes OS detection, touch capability, and orientation
- **Seamless Integration**: Easy to integrate with existing components
- **Performance Optimized**: Uses efficient event listeners and cleanup

## Device Breakpoints

- **Mobile**: < 768px
- **Tablet**: 768px - 1023px
- **Desktop**: ≥ 1024px

## Installation

The responsive system is already included in your project. Import the components you need:

```jsx
import { useDeviceDetection } from '../../hooks/useDeviceDetection';
import { ResponsiveLayout, ResponsiveGrid, ResponsiveCard } from '../../components/ResponsiveLayout';
```

## Basic Usage

### 1. Device Detection Hook

```jsx
import { useDeviceDetection } from '../../hooks/useDeviceDetection';

function MyComponent() {
  const { deviceType, isMobile, isTablet, isDesktop, screenWidth } = useDeviceDetection();

  return (
    <div>
      <p>Current device: {deviceType}</p>
      <p>Screen width: {screenWidth}px</p>
      
      {isMobile && <MobileComponent />}
      {isTablet && <TabletComponent />}
      {isDesktop && <DesktopComponent />}
    </div>
  );
}
```

### 2. Advanced Device Detection

```jsx
import { useAdvancedDeviceDetection } from '../../hooks/useDeviceDetection';

function AdvancedComponent() {
  const {
    deviceType,
    isMobile,
    isTablet,
    isDesktop,
    isIOS,
    isAndroid,
    isTouchDevice,
    orientation
  } = useAdvancedDeviceDetection();

  return (
    <div>
      {isIOS && <p>iOS-specific features</p>}
      {isAndroid && <p>Android-specific features</p>}
      {isTouchDevice && <p>Touch-optimized interface</p>}
      <p>Orientation: {orientation}</p>
    </div>
  );
}
```

### 3. Responsive Layout Components

```jsx
import {
  ResponsiveLayout,
  ResponsiveGrid,
  ResponsiveCard,
  ResponsiveButton
} from '../../components/ResponsiveLayout';

function MyPage() {
  return (
    <ResponsiveLayout>
      <h1>My Responsive Page</h1>
      
      <ResponsiveGrid>
        <ResponsiveCard title="Card 1">
          <p>This card adapts to screen size</p>
          <ResponsiveButton>Action</ResponsiveButton>
        </ResponsiveCard>
        
        <ResponsiveCard title="Card 2">
          <p>Another responsive card</p>
          <ResponsiveButton>Action</ResponsiveButton>
        </ResponsiveCard>
      </ResponsiveGrid>
    </ResponsiveLayout>
  );
}
```

### 4. Responsive Navigation

```jsx
import {
  ResponsiveNavigation,
  ResponsiveHeader,
  ResponsiveContent
} from '../../components/ResponsiveLayout/ResponsiveNavigation';

function App() {
  return (
    <ResponsiveNavigation>
      <ResponsiveHeader 
        title="Dashboard" 
        actions={
          <ResponsiveButton>Add New</ResponsiveButton>
        }
      />
      
      <ResponsiveContent>
        <p>Your main content here</p>
      </ResponsiveContent>
    </ResponsiveNavigation>
  );
}
```

## Integration with Existing Layout

To integrate with your existing `Layout.jsx`:

```jsx
// In your Layout.jsx
import { useDeviceDetection } from '../hooks/useDeviceDetection';

export const Layout = ({ children }) => {
  const { isMobile, isTablet, isDesktop } = useDeviceDetection();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(!isDesktop);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Automatically collapse sidebar on mobile/tablet
  useEffect(() => {
    if (isMobile || isTablet) {
      setSidebarCollapsed(true);
    }
  }, [isMobile, isTablet]);

  // Rest of your layout logic...
};
```

## Conditional Styling

```jsx
import { cn } from '../../lib/utils';
import { useDeviceDetection } from '../../hooks/useDeviceDetection';

function StyledComponent() {
  const { isMobile, isTablet, isDesktop } = useDeviceDetection();

  return (
    <div className={cn(
      'base-styles',
      isMobile && 'mobile-specific-styles px-2 py-4',
      isTablet && 'tablet-specific-styles px-4 py-6',
      isDesktop && 'desktop-specific-styles px-6 py-8'
    )}>
      Content
    </div>
  );
}
```

## Performance Considerations

1. **Event Listeners**: The hooks automatically clean up event listeners on unmount
2. **Debouncing**: Resize events are handled efficiently
3. **Orientation Changes**: Special handling for mobile orientation changes
4. **SSR Safe**: Handles server-side rendering gracefully

## API Reference

### useDeviceDetection()

Returns:
```typescript
{
  deviceType: 'mobile' | 'tablet' | 'desktop',
  screenWidth: number,
  screenHeight: number,
  isMobile: boolean,
  isTablet: boolean,
  isDesktop: boolean
}
```

### useAdvancedDeviceDetection()

Returns all properties from `useDeviceDetection()` plus:
```typescript
{
  userAgent: string,
  isIOS: boolean,
  isAndroid: boolean,
  isTouchDevice: boolean,
  orientation: 'portrait' | 'landscape'
}
```

### ResponsiveLayout

Props:
- `children`: React.ReactNode
- `className?`: string

### ResponsiveGrid

Props:
- `children`: React.ReactNode
- `className?`: string

Automatically adjusts grid columns:
- Mobile: 1 column
- Tablet: 2 columns
- Desktop: 3-4 columns

### ResponsiveCard

Props:
- `title`: string
- `children`: React.ReactNode
- `className?`: string

Adapts card size and typography based on device.

### ResponsiveButton

Props:
- `children`: React.ReactNode
- `className?`: string
- All standard button props

Adjusts button size and padding for different devices.

## Examples

See `ResponsiveDemo` component for a complete working example:

```jsx
import { ResponsiveDemo } from '../../components/ResponsiveLayout';

function TestPage() {
  return <ResponsiveDemo />;
}
```

## Best Practices

1. **Use Semantic Breakpoints**: Think in terms of content, not devices
2. **Test on Real Devices**: Emulators don't always match real device behavior
3. **Consider Touch Interactions**: Use larger touch targets on mobile
4. **Optimize Images**: Serve appropriate image sizes for each device
5. **Performance**: Minimize layout shifts during device detection

## Troubleshooting

### Common Issues

1. **Hydration Mismatch**: If using SSR, ensure consistent initial state
2. **Event Listener Memory Leaks**: Hooks automatically clean up, but check custom implementations
3. **Orientation Changes**: Allow time for dimension updates after orientation change

### Debug Mode

Use `DeviceInfoDisplay` component to debug device detection:

```jsx
import { DeviceInfoDisplay } from '../../components/ResponsiveLayout';

function DebugPage() {
  return (
    <div>
      <DeviceInfoDisplay />
      {/* Your other components */}
    </div>
  );
}
```