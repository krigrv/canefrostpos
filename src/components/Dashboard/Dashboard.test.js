import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Dashboard from './Dashboard';
import { InventoryProvider } from '../../contexts/InventoryContext';
import { AuthProvider } from '../../contexts/AuthContext';
import { ToastContainer } from 'react-toastify';

// Mock the inventory context functions
jest.mock('../../contexts/InventoryContext', () => ({
  ...jest.requireActual('../../contexts/InventoryContext'),
  useInventory: () => ({
    products: [
      { id: '1', name: 'Test Product 1', price: 100, category: 'Test Category', stock: 10 },
      { id: '2', name: 'Test Product 2', price: 200, category: 'Test Category', stock: 5 }
    ],
    categories: [{ id: '1', name: 'Test Category' }],
    addSale: jest.fn().mockResolvedValue('test-sale-id'),
    loadProducts: jest.fn(),
    loadCategories: jest.fn(),
    updateProduct: jest.fn(),
  })
}));

// Mock the auth context
jest.mock('../../contexts/AuthContext', () => ({
  ...jest.requireActual('../../contexts/AuthContext'),
  useAuth: () => ({
    currentUser: { email: 'test@example.com' },
    isAdmin: true
  })
}));

// Mock window.print
window.print = jest.fn();

// Helper function to render Dashboard with providers
const renderDashboard = () => {
  return render(
    <AuthProvider>
      <InventoryProvider>
        <Dashboard />
        <ToastContainer />
      </InventoryProvider>
    </AuthProvider>
  );
};

describe('Dashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders dashboard with empty cart', () => {
    renderDashboard();
    expect(screen.getByText(/cart is empty/i)).toBeInTheDocument();
  });

  test('adds product to cart when clicked', async () => {
    renderDashboard();
    
    // Find and click a product
    const productButton = await screen.findByText('Test Product 1');
    fireEvent.click(productButton);
    
    // Check if product is added to cart
    expect(screen.getByText('Test Product 1')).toBeInTheDocument();
    expect(screen.getByText('₹100.00')).toBeInTheDocument();
  });

  test('calculates cart subtotal correctly', async () => {
    renderDashboard();
    
    // Add products to cart
    const product1 = await screen.findByText('Test Product 1');
    const product2 = await screen.findByText('Test Product 2');
    
    fireEvent.click(product1);
    fireEvent.click(product2);
    
    // Check subtotal (100 + 200 = 300)
    expect(screen.getByText('Subtotal: ₹300.00')).toBeInTheDocument();
  });

  test('calculates tax correctly', async () => {
    renderDashboard();
    
    // Add product to cart
    const product = await screen.findByText('Test Product 1');
    fireEvent.click(product);
    
    // Check tax (assuming 18% tax rate: 100 * 0.18 = 18)
    expect(screen.getByText('Tax: ₹18.00')).toBeInTheDocument();
  });

  test('toggles packaging charge when switch is clicked', async () => {
    renderDashboard();
    
    // Add product to cart
    const product = await screen.findByText('Test Product 1');
    fireEvent.click(product);
    
    // Find and toggle packaging switch
    const packagingSwitch = screen.getByRole('checkbox', { name: /include packaging/i });
    fireEvent.click(packagingSwitch);
    
    // Check if packaging charge is displayed
    expect(screen.getByText(/packaging:/i)).toBeInTheDocument();
  });

  test('calculates total with packaging when enabled', async () => {
    renderDashboard();
    
    // Add product to cart
    const product = await screen.findByText('Test Product 1');
    fireEvent.click(product);
    
    // Initial total without packaging (100 + 18 = 118)
    expect(screen.getByText('Total: ₹118.00')).toBeInTheDocument();
    
    // Enable packaging
    const packagingSwitch = screen.getByRole('checkbox', { name: /include packaging/i });
    fireEvent.click(packagingSwitch);
    
    // Check if total includes packaging charge
    // Assuming packaging charge is calculated based on cart items
    // The exact value will depend on the implementation
    expect(screen.queryByText('Total: ₹118.00')).not.toBeInTheDocument();
  });

  test('getPackagingCharge returns 0 when undefined', async () => {
    renderDashboard();
    
    // Enable packaging without any items in cart
    const packagingSwitch = screen.getByRole('checkbox', { name: /include packaging/i });
    fireEvent.click(packagingSwitch);
    
    // The packaging charge should be 0 for an empty cart
    expect(screen.getByText('Packaging: ₹0.00')).toBeInTheDocument();
  });

  test('handles cash payment correctly', async () => {
    renderDashboard();
    
    // Add product to cart
    const product = await screen.findByText('Test Product 1');
    fireEvent.click(product);
    
    // Select cash payment method
    const cashRadio = screen.getByLabelText(/cash/i);
    fireEvent.click(cashRadio);
    
    // Enter received amount
    const receivedInput = screen.getByLabelText(/received amount/i);
    fireEvent.change(receivedInput, { target: { value: '200' } });
    
    // Check change amount (200 - 118 = 82)
    expect(screen.getByText('Change: ₹82.00')).toBeInTheDocument();
  });

  test('place order button is disabled with empty cart', () => {
    renderDashboard();
    
    const placeOrderButton = screen.getByRole('button', { name: /place order/i });
    expect(placeOrderButton).toBeDisabled();
  });

  test('place order button is enabled with items in cart', async () => {
    renderDashboard();
    
    // Add product to cart
    const product = await screen.findByText('Test Product 1');
    fireEvent.click(product);
    
    // Select cash payment method
    const cashRadio = screen.getByLabelText(/cash/i);
    fireEvent.click(cashRadio);
    
    // Enter received amount
    const receivedInput = screen.getByLabelText(/received amount/i);
    fireEvent.change(receivedInput, { target: { value: '200' } });
    
    const placeOrderButton = screen.getByRole('button', { name: /place order/i });
    expect(placeOrderButton).not.toBeDisabled();
  });

  test('successfully places an order', async () => {
    const { useInventory } = require('../../contexts/InventoryContext');
    const addSaleMock = useInventory().addSale;
    
    renderDashboard();
    
    // Add product to cart
    const product = await screen.findByText('Test Product 1');
    fireEvent.click(product);
    
    // Select cash payment method
    const cashRadio = screen.getByLabelText(/cash/i);
    fireEvent.click(cashRadio);
    
    // Enter received amount
    const receivedInput = screen.getByLabelText(/received amount/i);
    fireEvent.change(receivedInput, { target: { value: '200' } });
    
    // Place order
    const placeOrderButton = screen.getByRole('button', { name: /place order/i });
    fireEvent.click(placeOrderButton);
    
    // Wait for the order to be processed
    await waitFor(() => {
      expect(addSaleMock).toHaveBeenCalled();
    });
    
    // Check that the sale data includes all required fields
    const saleData = addSaleMock.mock.calls[0][0];
    expect(saleData).toHaveProperty('items');
    expect(saleData).toHaveProperty('subtotal');
    expect(saleData).toHaveProperty('tax');
    expect(saleData).toHaveProperty('total');
    expect(saleData).toHaveProperty('paymentMethod', 'CASH');
    expect(saleData).toHaveProperty('cashAmount');
    expect(saleData).toHaveProperty('receivedAmount');
    expect(saleData).toHaveProperty('changeAmount');
    expect(saleData).toHaveProperty('transactionId');
  });
});