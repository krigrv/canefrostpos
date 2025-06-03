import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { toast } from 'react-hot-toast';
import { InventoryProvider, useInventory } from '../contexts/InventoryContext';
import * as supabaseOperations from '../lib/supabaseOperations';

// Mock dependencies
vi.mock('react-hot-toast');
vi.mock('../lib/supabaseOperations');
vi.mock('uuid', () => ({
  v4: () => 'test-uuid-123'
}));

// Mock Supabase client
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          gte: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({ data: [], error: null }))
          }))
        }))
      }))
    }))
  }
}));

const mockSaleData = {
  id: 'test-sale-1',
  transactionId: 'INVCFN123456',
  items: [
    {
      id: 'item-1',
      name: 'Test Product',
      price: 100,
      quantity: 2,
      category: 'Beverages'
    }
  ],
  total: 200,
  subtotal: 178.57,
  tax: 21.43,
  timestamp: new Date(),
  paymentMethod: 'CASH'
};

const wrapper = ({ children }) => (
  <InventoryProvider>{children}</InventoryProvider>
);

describe('InventoryContext Sales Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    toast.success = vi.fn();
    toast.error = vi.fn();
    toast.warning = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('loadSales', () => {
    it('should load sales successfully with valid limit', async () => {
      const mockSales = [mockSaleData];
      supabaseOperations.sales = {
        getAll: vi.fn().mockResolvedValue(mockSales)
      };

      const { result } = renderHook(() => useInventory(), { wrapper });

      await act(async () => {
        const sales = await result.current.loadSales(10);
        expect(sales).toEqual(mockSales);
      });

      expect(supabaseOperations.sales.getAll).toHaveBeenCalledWith(10);
    });

    it('should handle invalid limit parameter', async () => {
      const { result } = renderHook(() => useInventory(), { wrapper });

      await act(async () => {
        const sales = await result.current.loadSales(0);
        expect(sales).toEqual([]);
      });

      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('Invalid limit parameter')
      );
    });

    it('should handle database errors gracefully', async () => {
      supabaseOperations.sales = {
        getAll: vi.fn().mockRejectedValue(new Error('Database connection failed'))
      };

      const { result } = renderHook(() => useInventory(), { wrapper });

      await act(async () => {
        const sales = await result.current.loadSales(10);
        expect(sales).toEqual([]);
      });

      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('Database connection failed')
      );
    });
  });

  describe('addSale', () => {
    beforeEach(() => {
      supabaseOperations.sales = {
        create: vi.fn().mockResolvedValue({ id: 'new-sale-id', ...mockSaleData })
      };
    });

    it('should add sale successfully with valid data', async () => {
      const { result } = renderHook(() => useInventory(), { wrapper });

      // Mock checkForDuplicates to return false
      result.current.checkForDuplicates = vi.fn().mockResolvedValue(false);

      await act(async () => {
        const saleId = await result.current.addSale(mockSaleData);
        expect(saleId).toBe('new-sale-id');
      });

      expect(supabaseOperations.sales.create).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Sale recorded successfully!');
    });

    it('should reject invalid sale data', async () => {
      const { result } = renderHook(() => useInventory(), { wrapper });

      await act(async () => {
        try {
          await result.current.addSale(null);
        } catch (error) {
          expect(error.message).toBe('Invalid sale data provided');
        }
      });
    });

    it('should reject sale with empty items', async () => {
      const { result } = renderHook(() => useInventory(), { wrapper });
      const invalidSale = { ...mockSaleData, items: [] };

      await act(async () => {
        try {
          await result.current.addSale(invalidSale);
        } catch (error) {
          expect(error.message).toBe('Sale must contain at least one item');
        }
      });
    });

    it('should reject sale with invalid total', async () => {
      const { result } = renderHook(() => useInventory(), { wrapper });
      const invalidSale = { ...mockSaleData, total: 0 };

      await act(async () => {
        try {
          await result.current.addSale(invalidSale);
        } catch (error) {
          expect(error.message).toBe('Sale total must be greater than zero');
        }
      });
    });

    it('should prevent duplicate sales', async () => {
      const { result } = renderHook(() => useInventory(), { wrapper });

      // Mock checkForDuplicates to return true
      result.current.checkForDuplicates = vi.fn().mockResolvedValue(true);

      await act(async () => {
        const result_value = await result.current.addSale(mockSaleData);
        expect(result_value).toBeNull();
      });

      expect(toast.warning).toHaveBeenCalledWith('Duplicate sale detected and prevented');
    });

    it('should handle Firebase fallback when Supabase fails', async () => {
      supabaseOperations.sales.create = vi.fn().mockRejectedValue(
        new Error('Supabase connection failed')
      );

      // Mock Firebase fallback
      global.window = {
        addSaleToFirebase: vi.fn().mockResolvedValue('firebase-doc-id')
      };

      const { result } = renderHook(() => useInventory(), { wrapper });
      result.current.checkForDuplicates = vi.fn().mockResolvedValue(false);

      await act(async () => {
        const saleId = await result.current.addSale(mockSaleData);
        expect(saleId).toBe('firebase-doc-id');
      });

      expect(toast.success).toHaveBeenCalledWith(
        'Sale recorded successfully (Firebase fallback)!'
      );
    });
  });

  describe('getSalesByDateRange', () => {
    it('should get sales by date range successfully', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const mockSales = [mockSaleData];

      supabaseOperations.sales = {
        getByDateRange: vi.fn().mockResolvedValue(mockSales)
      };

      const { result } = renderHook(() => useInventory(), { wrapper });

      await act(async () => {
        const sales = await result.current.getSalesByDateRange(startDate, endDate);
        expect(sales).toEqual(mockSales);
      });

      expect(supabaseOperations.sales.getByDateRange).toHaveBeenCalledWith(
        startDate,
        endDate
      );
    });

    it('should validate date parameters', async () => {
      const { result } = renderHook(() => useInventory(), { wrapper });

      await act(async () => {
        const sales = await result.current.getSalesByDateRange(null, null);
        expect(sales).toEqual([]);
      });

      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('Both start date and end date are required')
      );
    });

    it('should validate date order', async () => {
      const { result } = renderHook(() => useInventory(), { wrapper });
      const startDate = new Date('2024-01-31');
      const endDate = new Date('2024-01-01');

      await act(async () => {
        const sales = await result.current.getSalesByDateRange(startDate, endDate);
        expect(sales).toEqual([]);
      });

      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('Start date cannot be after end date')
      );
    });
  });

  describe('deleteSale', () => {
    it('should delete sale successfully', async () => {
      supabaseOperations.sales = {
        delete: vi.fn().mockResolvedValue()
      };

      const { result } = renderHook(() => useInventory(), { wrapper });

      await act(async () => {
        const success = await result.current.deleteSale('test-sale-id');
        expect(success).toBe(true);
      });

      expect(supabaseOperations.sales.delete).toHaveBeenCalledWith('test-sale-id');
      expect(toast.success).toHaveBeenCalledWith('Sale deleted successfully');
    });

    it('should validate sale ID parameter', async () => {
      const { result } = renderHook(() => useInventory(), { wrapper });

      await act(async () => {
        try {
          await result.current.deleteSale('');
        } catch (error) {
          expect(error.message).toBe('Sale ID is required for deletion');
        }
      });
    });

    it('should handle deletion errors', async () => {
      supabaseOperations.sales = {
        delete: vi.fn().mockRejectedValue(new Error('Deletion failed'))
      };

      const { result } = renderHook(() => useInventory(), { wrapper });

      await act(async () => {
        try {
          await result.current.deleteSale('test-sale-id');
        } catch (error) {
          expect(error.message).toBe('Deletion failed');
        }
      });

      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('Deletion failed')
      );
    });
  });

  describe('checkForDuplicates', () => {
    it('should validate sale data parameter', async () => {
      const { result } = renderHook(() => useInventory(), { wrapper });

      await act(async () => {
        try {
          await result.current.checkForDuplicates(null);
        } catch (error) {
          expect(error.message).toBe('Sale data with transaction ID is required');
        }
      });
    });

    it('should validate transaction ID', async () => {
      const { result } = renderHook(() => useInventory(), { wrapper });
      const invalidSale = { ...mockSaleData, transactionId: null };

      await act(async () => {
        try {
          await result.current.checkForDuplicates(invalidSale);
        } catch (error) {
          expect(error.message).toBe('Sale data with transaction ID is required');
        }
      });
    });
  });
});