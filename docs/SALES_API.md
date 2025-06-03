# Sales API Documentation

## Overview

This document provides detailed information about the sales-related functions in the CaneFrost POS application. These functions are part of the `InventoryContext` and handle operations such as adding, retrieving, and deleting sales records.

## Table of Contents

1. [Data Structures](#data-structures)
2. [Functions](#functions)
   - [loadSales](#loadsales)
   - [addSale](#addsale)
   - [getSalesByDateRange](#getsalesbydaterange)
   - [deleteSale](#deletesale)
   - [checkForDuplicates](#checkforduplicates)
3. [Error Handling](#error-handling)
4. [Database Fallback Mechanism](#database-fallback-mechanism)
5. [Usage Examples](#usage-examples)

## Data Structures

### Sale Object

```javascript
{
  id: string,                // Unique identifier for the sale
  transactionId: string,      // Human-readable transaction ID (e.g., INVCFN123456)
  items: Array<SaleItem>,     // Array of items in the sale
  subtotal: number,           // Sale subtotal (excluding tax)
  tax: number,                // Tax amount
  total: number,              // Total sale amount
  originalTotal: number,      // Total before any discounts
  discount: number,           // Discount amount
  timestamp: Date,            // When the sale occurred
  paymentMethod: string,      // 'CASH', 'UPI', or 'BOTH'
  cashAmount: number,         // Amount paid in cash
  upiAmount: number,          // Amount paid via UPI
  receivedAmount: number,     // Total amount received
  changeAmount: number        // Change given back to customer
}
```

### Sale Item Object

```javascript
{
  id: string,                // Product ID
  name: string,               // Product name
  price: number,              // Unit price
  quantity: number,           // Quantity sold
  category: string            // Product category
}
```

## Functions

### loadSales

Loads recent sales from the Supabase database.

```javascript
const loadSales = async (limit = 50) => { ... }
```

**Parameters:**
- `limit` (number, optional): Maximum number of sales to load. Default is 50.

**Returns:**
- Promise<Array>: Array of sales data or empty array on error.

**Validation:**
- Validates that limit is a positive number.

**Error Handling:**
- Returns an empty array and displays an error toast on failure.

---

### addSale

Adds a new sale to the database with duplicate prevention.

```javascript
const addSale = async (saleData) => { ... }
```

**Parameters:**
- `saleData` (Object): Sale data object containing transaction details.

**Returns:**
- Promise<string|null>: Created sale ID or null if duplicate/error.

**Validation:**
- Validates that saleData is a valid object.
- Ensures items array exists and is not empty.
- Verifies total is greater than zero.

**Duplicate Prevention:**
- Checks for sales with the same transaction ID in the last 5 minutes.

**Database Fallback:**
- Attempts to save to Supabase first.
- Falls back to Firebase if Supabase fails and Firebase is available.

---

### getSalesByDateRange

Retrieves sales within a specified date range.

```javascript
const getSalesByDateRange = async (startDate, endDate) => { ... }
```

**Parameters:**
- `startDate` (Date|string): Start date for the range.
- `endDate` (Date|string): End date for the range.

**Returns:**
- Promise<Array>: Array of sales within the date range.

**Validation:**
- Validates that both dates are provided.
- Ensures dates are valid Date objects.
- Verifies start date is not after end date.

**Error Handling:**
- Returns an empty array and displays an error toast on failure.

---

### deleteSale

Deletes a sale from the database.

```javascript
const deleteSale = async (id) => { ... }
```

**Parameters:**
- `id` (string): Unique identifier of the sale to delete.

**Returns:**
- Promise<boolean>: True if deletion was successful.

**Validation:**
- Validates that sale ID is provided.

**Error Handling:**
- Throws an error with detailed message on failure.

---

### checkForDuplicates

Checks for duplicate sales based on transaction ID within a 5-minute window.

```javascript
const checkForDuplicates = async (saleData) => { ... }
```

**Parameters:**
- `saleData` (Object): Sale data to check for duplicates.

**Returns:**
- Promise<boolean>: True if duplicate is found, false otherwise.

**Validation:**
- Validates that sale data with transaction ID is provided.

**Implementation Details:**
- Checks for sales with the same transaction ID in the last 5 minutes.

## Error Handling

All functions include comprehensive error handling:

1. **Input Validation**: Parameters are validated before processing.
2. **Detailed Error Messages**: Error messages include specific details about what went wrong.
3. **User Feedback**: Toast notifications inform users about successes and failures.
4. **Logging**: Errors are logged to the console for debugging.
5. **Graceful Degradation**: Functions return sensible defaults when possible instead of crashing.

## Database Fallback Mechanism

The `addSale` function implements a fallback mechanism:

1. **Primary Database**: Attempts to save to Supabase first.
2. **Error Detection**: Catches and logs Supabase errors.
3. **Fallback Check**: Checks if Firebase fallback is available.
4. **Fallback Attempt**: If available, attempts to save to Firebase.
5. **Comprehensive Error**: If both fail, throws an error with details from both attempts.

## Usage Examples

### Adding a Sale

```javascript
import { useInventory } from '../contexts/InventoryContext';

function CheckoutComponent() {
  const { addSale } = useInventory();
  
  const handlePlaceOrder = async () => {
    try {
      const sale = {
        items: cart,
        subtotal: getCartSubtotal(),
        tax: getCartTax(),
        total: getCartTotal(),
        originalTotal: getCartTotal(),
        discount: discount,
        timestamp: new Date(),
        paymentMethod: 'CASH',
        cashAmount: receivedAmount,
        receivedAmount: receivedAmount,
        changeAmount: receivedAmount - getCartTotal()
      };
      
      const saleId = await addSale(sale);
      if (saleId) {
        // Success handling
      }
    } catch (error) {
      // Error handling
    }
  };
  
  return (
    // Component JSX
  );
}
```

### Loading Sales for Reporting

```javascript
import { useInventory } from '../contexts/InventoryContext';
import { useEffect, useState } from 'react';

function ReportsComponent() {
  const { loadSales, getSalesByDateRange } = useInventory();
  const [recentSales, setRecentSales] = useState([]);
  const [dateRangeSales, setDateRangeSales] = useState([]);
  
  useEffect(() => {
    // Load recent sales on component mount
    const fetchSales = async () => {
      const sales = await loadSales(20); // Get last 20 sales
      setRecentSales(sales);
    };
    
    fetchSales();
  }, [loadSales]);
  
  const handleDateRangeSearch = async (startDate, endDate) => {
    const sales = await getSalesByDateRange(startDate, endDate);
    setDateRangeSales(sales);
  };
  
  return (
    // Component JSX
  );
}
```

### Deleting a Sale

```javascript
import { useInventory } from '../contexts/InventoryContext';

function SaleManagementComponent() {
  const { deleteSale } = useInventory();
  
  const handleDeleteSale = async (saleId) => {
    try {
      await deleteSale(saleId);
      // Update UI after successful deletion
    } catch (error) {
      // Handle error
    }
  };
  
  return (
    // Component JSX
  );
}
```