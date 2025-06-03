# Performance Optimization Guide

## Overview

This document provides guidelines and best practices for optimizing performance in the CaneFrost POS application. It focuses on React optimization techniques, particularly memoization strategies used in the Dashboard component.

## Table of Contents

1. [Memoization Techniques](#memoization-techniques)
   - [useMemo](#usememo)
   - [useCallback](#usecallback)
   - [React.memo](#reactmemo)
2. [Dashboard Component Optimizations](#dashboard-component-optimizations)
   - [Cart Calculations](#cart-calculations)
   - [Packaging Charge Calculations](#packaging-charge-calculations)
   - [Payment Processing](#payment-processing)
3. [Database Optimization](#database-optimization)
4. [Rendering Optimization](#rendering-optimization)
5. [Performance Testing](#performance-testing)

## Memoization Techniques

### useMemo

`useMemo` is used to memoize expensive calculations so they are only recomputed when dependencies change.

```javascript
const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);
```

**When to use:**
- Complex calculations that don't need to be recomputed on every render
- Derived data that depends on props or state
- Values that are used by multiple child components

**Best practices:**
- Include all dependencies in the dependency array
- Don't overuse for simple calculations
- Use for calculations that take more than ~1ms to compute

### useCallback

`useCallback` is used to memoize functions so they are not recreated on every render.

```javascript
const memoizedCallback = useCallback(() => {
  doSomething(a, b);
}, [a, b]);
```

**When to use:**
- Event handlers passed to child components
- Functions used as dependencies for other hooks
- Functions that trigger expensive operations

**Best practices:**
- Include all dependencies in the dependency array
- Don't overuse for simple functions
- Use when the function is passed as a prop to memoized child components

### React.memo

`React.memo` is a higher-order component that memoizes a component to prevent unnecessary re-renders.

```javascript
const MemoizedComponent = React.memo(MyComponent);
```

**When to use:**
- Components that render often but with the same props
- Components that are expensive to render
- Components that receive complex objects as props

**Best practices:**
- Use with custom comparison functions for complex props
- Don't overuse for simple components
- Combine with useCallback for event handler props

## Dashboard Component Optimizations

### Cart Calculations

The Dashboard component uses memoization for cart calculations to prevent unnecessary recalculations.

```javascript
// Memoized cart subtotal calculation
const cartSubtotal = useMemo(() => {
  return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}, [cart]);

// Memoized tax calculation
const cartTax = useMemo(() => {
  return cartSubtotal * TAX_RATE;
}, [cartSubtotal]);

// Memoized total calculation
const cartTotal = useMemo(() => {
  return cartSubtotal + cartTax;
}, [cartSubtotal, cartTax]);
```

**Benefits:**
- Prevents recalculation when unrelated state changes
- Creates a dependency chain (cartTotal depends on cartTax which depends on cartSubtotal)
- Improves performance for large carts

### Packaging Charge Calculations

The packaging charge calculation is memoized to prevent recalculation when the cart doesn't change.

```javascript
// Memoized packaging charge calculation
const packagingCharge = useMemo(() => {
  // Complex calculation based on cart items
  return calculatePackagingCharge(cart);
}, [cart]);

// Memoized cart total with packaging
const cartTotalWithPackaging = useMemo(() => {
  return includePackaging ? cartTotal + packagingCharge : cartTotal;
}, [cartTotal, packagingCharge, includePackaging]);
```

**Implementation details:**
- The packaging charge calculation depends only on the cart
- The total with packaging depends on cartTotal, packagingCharge, and includePackaging
- Getter functions return the memoized values

### Payment Processing

Payment calculations are memoized to improve performance during checkout.

```javascript
// Memoized change amount calculation
const changeAmount = useMemo(() => {
  if (paymentMethod === 'CASH') {
    return receivedAmount - cartTotalWithPackaging;
  } else if (paymentMethod === 'BOTH') {
    return receivedAmount - (cartTotalWithPackaging - upiAmount);
  }
  return 0;
}, [paymentMethod, receivedAmount, cartTotalWithPackaging, upiAmount]);
```

**Benefits:**
- Prevents recalculation when unrelated state changes
- Improves responsiveness during payment entry
- Ensures consistent values across the UI

## Database Optimization

### Query Optimization

- Use indexed fields for queries
- Limit the number of records returned
- Use pagination for large datasets

```javascript
// Optimized query with limit
const loadSales = async (limit = 50) => {
  try {
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error loading sales:', error);
    toast.error('Failed to load sales');
    return [];
  }
};
```

### Batch Operations

- Use batch operations for multiple updates
- Combine related queries when possible
- Use transactions for related operations

## Rendering Optimization

### Component Splitting

Split large components into smaller, focused components to minimize re-renders.

```javascript
// Before: Single large component
function Dashboard() {
  // Many state variables and calculations
  return (
    <div>
      {/* Complex UI with many sections */}
    </div>
  );
}

// After: Split into smaller components
function Dashboard() {
  // Shared state and context
  return (
    <div>
      <ProductList />
      <Cart />
      <PaymentSection />
    </div>
  );
}
```

### Virtualization

Use virtualization for long lists to render only visible items.

```javascript
import { FixedSizeList } from 'react-window';

function ProductList({ products }) {
  const Row = ({ index, style }) => (
    <div style={style}>
      <ProductItem product={products[index]} />
    </div>
  );

  return (
    <FixedSizeList
      height={500}
      width="100%"
      itemCount={products.length}
      itemSize={50}
    >
      {Row}
    </FixedSizeList>
  );
}
```

## Performance Testing

### Profiling

- Use React DevTools Profiler to identify performance bottlenecks
- Measure component render times
- Identify unnecessary re-renders

### Benchmarking

- Create performance benchmarks for critical operations
- Compare performance before and after optimizations
- Test with realistic data volumes

```javascript
// Simple benchmark function
function benchmark(fn, iterations = 100) {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  const end = performance.now();
  return (end - start) / iterations;
}

// Example usage
const cartCalculationTime = benchmark(() => {
  return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
});

console.log(`Cart calculation average time: ${cartCalculationTime}ms`);
```

## Best Practices Summary

1. **Memoize expensive calculations** with `useMemo`
2. **Memoize callback functions** with `useCallback`
3. **Prevent unnecessary re-renders** with `React.memo`
4. **Create dependency chains** for related calculations
5. **Split large components** into smaller, focused components
6. **Use virtualization** for long lists
7. **Optimize database queries** with indexing and limits
8. **Profile and benchmark** to identify bottlenecks

## Example: Optimizing a Slow Component

### Before Optimization

```javascript
function ProductList({ products, onAddToCart }) {
  // Expensive calculation on every render
  const sortedProducts = products.sort((a, b) => a.name.localeCompare(b.name));
  
  // New function created on every render
  const handleAddToCart = (product) => {
    onAddToCart(product);
  };
  
  return (
    <div>
      {sortedProducts.map(product => (
        <div key={product.id}>
          <span>{product.name}</span>
          <span>${product.price}</span>
          <button onClick={() => handleAddToCart(product)}>Add to Cart</button>
        </div>
      ))}
    </div>
  );
}
```

### After Optimization

```javascript
// Memoized child component
const ProductItem = React.memo(({ product, onAddToCart }) => {
  return (
    <div>
      <span>{product.name}</span>
      <span>${product.price}</span>
      <button onClick={() => onAddToCart(product)}>Add to Cart</button>
    </div>
  );
});

function ProductList({ products, onAddToCart }) {
  // Memoized expensive calculation
  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);
  
  // Memoized callback function
  const handleAddToCart = useCallback((product) => {
    onAddToCart(product);
  }, [onAddToCart]);
  
  return (
    <div>
      {sortedProducts.map(product => (
        <ProductItem 
          key={product.id} 
          product={product} 
          onAddToCart={handleAddToCart} 
        />
      ))}
    </div>
  );
}
```

## Conclusion

Performance optimization is an ongoing process that requires careful consideration of how components render and interact. By applying the techniques described in this guide, you can significantly improve the performance and user experience of the CaneFrost POS application.

Remember to measure performance before and after optimizations to ensure your changes are having the desired effect. Not all optimizations are necessary for every component, so focus on areas where performance issues are noticeable.