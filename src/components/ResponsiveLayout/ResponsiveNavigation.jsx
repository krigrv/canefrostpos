import React, { useState } from 'react';
import { useDeviceDetection } from '../../hooks/useDeviceDetection';
import { Button } from '../ui/button';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import { cn } from '../../lib/utils';
import {
  Home,
  ShoppingCart,
  Users,
  Settings,
  Menu,
  X,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

/**
 * Responsive Navigation Component
 * Automatically switches between sidebar (desktop/tablet) and drawer (mobile)
 */
export const ResponsiveNavigation = ({ children }) => {
  const { isMobile, isTablet, isDesktop } = useDeviceDetection();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});

  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      href: '/dashboard'
    },
    {
      id: 'sales',
      label: 'Sales',
      icon: ShoppingCart,
      href: '/sales',
      children: [
        { id: 'pos', label: 'Point of Sale', href: '/sales/pos' },
        { id: 'orders', label: 'Orders', href: '/sales/orders' },
        { id: 'invoices', label: 'Invoices', href: '/sales/invoices' }
      ]
    },
    {
      id: 'customers',
      label: 'Customers',
      icon: Users,
      href: '/customers'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      href: '/settings',
      children: [
        { id: 'general', label: 'General', href: '/settings/general' },
        { id: 'users', label: 'Users', href: '/settings/users' },
        { id: 'integrations', label: 'Integrations', href: '/settings/integrations' }
      ]
    }
  ];

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const NavigationItem = ({ item, level = 0 }) => {
    const Icon = item.icon;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedSections[item.id];
    
    const itemClasses = cn(
      'flex items-center w-full text-left transition-colors duration-200',
      level === 0 ? 'px-3 py-2 rounded-lg' : 'px-6 py-1.5 text-sm',
      'hover:bg-gray-100 dark:hover:bg-gray-800',
      level > 0 && 'border-l-2 border-gray-200 dark:border-gray-700 ml-4'
    );

    return (
      <div key={item.id}>
        <button
          className={itemClasses}
          onClick={() => hasChildren ? toggleSection(item.id) : null}
        >
          {Icon && (
            <Icon className={cn(
              'flex-shrink-0',
              isMobile ? 'h-5 w-5' : 'h-4 w-4',
              level === 0 ? 'mr-3' : 'mr-2'
            )} />
          )}
          <span className="flex-1 text-left">{item.label}</span>
          {hasChildren && (
            <div className="ml-2">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </div>
          )}
        </button>
        
        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">
            {item.children.map(child => (
              <NavigationItem key={child.id} item={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  const NavigationContent = () => (
    <div className={cn(
      'space-y-2',
      isMobile ? 'p-4' : 'p-6'
    )}>
      <div className="mb-6">
        <h2 className={cn(
          'font-bold text-gray-900 dark:text-gray-100',
          isMobile ? 'text-lg' : 'text-xl'
        )}>
          CANEFROST
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Point of Sale System
        </p>
      </div>
      
      <nav className="space-y-1">
        {navigationItems.map(item => (
          <NavigationItem key={item.id} item={item} />
        ))}
      </nav>
    </div>
  );

  // Mobile Navigation (Drawer)
  if (isMobile) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        {/* Mobile Header */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between px-4 py-3">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              CANEFROST
            </h1>
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0">
                <NavigationContent />
              </SheetContent>
            </Sheet>
          </div>
        </div>
        
        {/* Main Content */}
        <main className="flex-1 pt-16 overflow-auto">
          {children}
        </main>
      </div>
    );
  }

  // Tablet Navigation (Collapsible Sidebar)
  if (isTablet) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        {/* Tablet Sidebar */}
        <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
          <NavigationContent />
        </div>
        
        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    );
  }

  // Desktop Navigation (Full Sidebar)
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Desktop Sidebar */}
      <div className="w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
        <NavigationContent />
      </div>
      
      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
};

/**
 * Responsive Header Component
 */
export const ResponsiveHeader = ({ title, actions }) => {
  const { isMobile, isTablet } = useDeviceDetection();

  return (
    <header className={cn(
      'bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700',
      isMobile ? 'px-4 py-3' : isTablet ? 'px-6 py-4' : 'px-8 py-6'
    )}>
      <div className="flex items-center justify-between">
        <h1 className={cn(
          'font-semibold text-gray-900 dark:text-gray-100',
          isMobile ? 'text-xl' : isTablet ? 'text-2xl' : 'text-3xl'
        )}>
          {title}
        </h1>
        
        {actions && (
          <div className={cn(
            'flex items-center',
            isMobile ? 'space-x-2' : 'space-x-4'
          )}>
            {actions}
          </div>
        )}
      </div>
    </header>
  );
};

/**
 * Responsive Content Container
 */
export const ResponsiveContent = ({ children, className }) => {
  const { isMobile, isTablet } = useDeviceDetection();

  return (
    <div className={cn(
      'flex-1',
      isMobile ? 'p-4' : isTablet ? 'p-6' : 'p-8',
      className
    )}>
      {children}
    </div>
  );
};