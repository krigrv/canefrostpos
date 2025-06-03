# Dashboard Component API Documentation

## Overview

This document provides detailed information about the Dashboard component in the CaneFrost POS application, focusing on the cart calculation functions and packaging-related features.

## Table of Contents

1. [Cart Calculation Functions](#cart-calculation-functions)
   - [getCartSubtotal](#getcartsubtotal)
   - [getCartTax](#getcarttax)
   - [getCartTotal](#getcarttotal)
   - [getPackagingCharge](#getpackagingcharge)
   - [getCartTotalWithPackaging](#getcarttotalwithpackaging)
   - [getCartTaxWithPackaging](#getcarttaxwithpackaging)
   - [getFinalTotal](#getfinaltotal)
   - [getChangeAmount](#getchangeamount)
2. [Order Processing](#order-processing)
   - [handlePlaceOrder](#handleplaceorder)
   - [generateOrderId](#generateorderid)
3. [State Management](#state-management)
   - [includePackaging](#includepackaging)
   - [packagingCharge](#packagingcharge)
4. [Error Handling](#error-handling)
5. [Usage Examples](#usage-examples)

## Cart Calculation Functions

### getCartSubtotal

Calculates the subtotal of all items in the cart (before tax).

**Returns:**
- `number`: The sum of (price × quantity) for all items in the cart.

---

### getCartTax

Calculates the tax amount for the current cart.

**Returns:**
- `number`: The tax amount based on the cart subtotal and configured tax rate.

---

### getCartTotal

Calculates the total amount for the current cart (subtotal + tax).

**Returns:**
- `number`: The total cart amount including tax.

---

### getPackagingCharge

Returns the current packaging charge amount.

```javascript
const getPackagingCharge = () => packagingCharge || 0;
```

**Returns:**
- `number`: The current packaging charge amount or 0 if undefined.

**Implementation Details:**
- Returns the memoized `packagingCharge` value.
- Includes a fallback to 0 to prevent undefined values.

---

### getCartTotalWithPackaging

Calculates the cart total including packaging charge if enabled.

```javascript
const getCartTotalWithPackaging = () => {
  return includePackaging ? getCartTotal() + getPackagingCharge() : getCartTotal() || 0;
};
```

**Returns:**
- `number`: The cart total with packaging charge (if enabled) or just the cart total.

**Implementation Details:**
- Adds packaging charge to cart total only if `includePackaging` is true.
- Includes a fallback to 0 to prevent undefined values.

---

### getCartTaxWithPackaging

Calculates the tax amount including packaging charge if enabled.

```javascript
const getCartTaxWithPackaging = () => {
  return cartTaxWithPackaging || 0;
};
```

**Returns:**
- `number`: The tax amount including packaging charge (if enabled).

**Implementation Details:**
- Returns the memoized `cartTaxWithPackaging` value.
- Includes a fallback to 0 to prevent undefined values.

---

### getFinalTotal

Calculates the final total amount after applying any discounts.

```javascript
const getFinalTotal = () => {
  return finalTotal || 0;
};
```

**Returns:**
- `number`: The final total after discounts.

**Implementation Details:**
- Returns the memoized `finalTotal` value.
- Includes a fallback to 0 to prevent undefined values.

---

### getChangeAmount

Calculates the change amount to return to the customer.

```javascript
const getChangeAmount = () => {
  return changeAmount || 0;
};
```

**Returns:**
- `number`: The change amount to return to the customer.

**Implementation Details:**
- Returns the memoized `changeAmount` value.
- Includes a fallback to 0 to prevent undefined values.

## Order Processing

### handlePlaceOrder

Processes a new order, validates payment information, and saves the sale.

```javascript
const handlePlaceOrder = async () => { ... };
```

**Validation:**
- Checks for empty cart.
- Validates payment method and amounts.
- Ensures total is greater than zero.
- Verifies received amount is sufficient.

**Error Handling:**
- Prevents multiple simultaneous order processing.
- Catches and displays database errors.
- Provides user feedback via toast notifications.

**Implementation Details:**
- Generates a unique transaction ID.
- Creates a sale object with all relevant information.
- Saves the sale to the database.
- Resets the cart and payment state after successful order.

---

### generateOrderId

Generates a unique order ID for transactions.

```javascript
const generateOrderId = () => { ... };
```

**Returns:**
- `string`: A unique order ID in the format "INVCFN" followed by a timestamp and random digits.

**Implementation Details:**
- Combines current timestamp with random numbers.
- Prefixes with "INVCFN" (Invoice CaneFrost).

## State Management

### includePackaging

State variable that determines whether to include packaging charge.

```javascript
const [includePackaging, setIncludePackaging] = useState(false);
```

**Usage:**
- Toggle this state to add or remove packaging charge from the total.

---

### packagingCharge

Memoized value that calculates the packaging charge based on cart items.

```javascript
const packagingCharge = useMemo(() => {
  // Calculation logic
}, [cart]);
```

**Implementation Details:**
- Recalculates whenever the cart changes.
- Based on the number and types of items in the cart.

## Error Handling

The Dashboard component implements comprehensive error handling:

1. **Input Validation**: Validates all inputs before processing orders.
2. **Payment Validation**: Ensures payment amounts are valid and sufficient.
3. **Database Error Handling**: Catches and displays database errors during order processing.
4. **Fallback Values**: Provides fallback values (|| 0) for all calculation functions to prevent NaN or undefined errors.
5. **Processing State**: Uses `processingPayment` state to prevent multiple simultaneous order submissions.

## Usage Examples

### Toggling Packaging Charge

```javascript
<FormControlLabel
  control={
    <Switch
      checked={includePackaging}
      onChange={(e) => setIncludePackaging(e.target.checked)}
      color="primary"
    />
  }
  label="Include Packaging"
/>
```

### Displaying Cart Totals

```javascript
<Typography variant="h6">
  Subtotal: ₹{getCartSubtotal().toFixed(2)}
</Typography>
<Typography variant="h6">
  Tax: ₹{getCartTax().toFixed(2)}
</Typography>
{includePackaging && (
  <Typography variant="h6">
    Packaging: ₹{getPackagingCharge().toFixed(2)}
  </Typography>
)}
<Typography variant="h6" fontWeight="bold">
  Total: ₹{getCartTotalWithPackaging().toFixed(2)}
</Typography>
```

### Processing an Order

```javascript
<Button
  variant="contained"
  color="primary"
  disabled={cart.length === 0 || processingPayment}
  onClick={handlePlaceOrder}
>
  {processingPayment ? <CircularProgress size={24} /> : "Place Order"}
</Button>
```