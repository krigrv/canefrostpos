/**
 * OutletManagement - Multi-Outlet Management Interface
 * Allows main account to create, manage, and monitor all outlets
 */
import React, { useState, useEffect } from 'react';
import { useOutlet } from '../../contexts/OutletContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { toast } from 'react-hot-toast';
import {
  Building2,
  Plus,
  Edit3,
  Trash2,
  Users,
  Settings,
  BarChart3,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Activity,
  DollarSign,
  Package,
  ShoppingCart,
  Building2 as BuildingOfficeIcon,
  Plus as PlusIcon,
  Pencil as PencilIcon,
  Trash2 as TrashIcon,
  Users as UserGroupIcon,
  BarChart3 as ChartBarIcon,
  ShoppingBag as ShoppingBagIcon,
  Package as CubeIcon
} from 'lucide-react';

const OutletManagement = () => {
  const { currentUser } = useAuth();
  const {
    outlets,
    isMainAccount,
    createOutlet,
    updateOutlet,
    deleteOutlet,
    assignUserToOutlet,
    switchOutlet,
    currentOutlet
  } = useOutlet();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedOutlet, setSelectedOutlet] = useState(null);
  const [users, setUsers] = useState([]);
  const [outletStats, setOutletStats] = useState({});
  const [loading, setLoading] = useState(false);

  const [newOutlet, setNewOutlet] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    managerName: '',
    managerId: '',
    settings: {
      businessName: 'Canefrost POS',
      currency: 'INR',
      taxRate: 12,
      receiptFooter: 'Thank you for your business!'
    }
  });

  // Load users and outlet statistics
  useEffect(() => {
    if (isMainAccount) {
      loadUsers();
      loadOutletStatistics();
    }
  }, [isMainAccount, outlets]);

  // Load all users for assignment
  const loadUsers = async () => {
    try {
      const usersQuery = query(collection(db, 'users'));
      const snapshot = await getDocs(usersQuery);
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  // Load outlet statistics
  const loadOutletStatistics = async () => {
    try {
      const stats = {};
      
      for (const outlet of outlets) {
        // Get sales data for each outlet
        const salesQuery = query(
          collection(db, `outlets/${outlet.id}/sales`),
          where('timestamp', '>=', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) // Last 30 days
        );
        
        const salesSnapshot = await getDocs(salesQuery);
        const sales = salesSnapshot.docs.map(doc => doc.data());
        
        // Get products count
        const productsSnapshot = await getDocs(collection(db, `outlets/${outlet.id}/products`));
        
        // Calculate statistics
        const totalSales = sales.reduce((sum, sale) => sum + (sale.total || 0), 0);
        const totalOrders = sales.length;
        const totalProducts = productsSnapshot.docs.length;
        
        stats[outlet.id] = {
          totalSales,
          totalOrders,
          totalProducts,
          avgOrderValue: totalOrders > 0 ? totalSales / totalOrders : 0
        };
      }
      
      setOutletStats(stats);
    } catch (error) {
      console.error('Error loading outlet statistics:', error);
    }
  };

  // Handle create outlet
  const handleCreateOutlet = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const outletId = await createOutlet(newOutlet);
      if (outletId) {
        setShowCreateModal(false);
        setNewOutlet({
          name: '',
          address: '',
          phone: '',
          email: '',
          managerName: '',
          managerId: '',
          settings: {
            businessName: 'Canefrost POS',
            currency: 'INR',
            taxRate: 12,
            receiptFooter: 'Thank you for your business!'
          }
        });
        loadOutletStatistics();
      }
    } catch (error) {
      console.error('Error creating outlet:', error);
      toast.error('Failed to create outlet');
    } finally {
      setLoading(false);
    }
  };

  // Handle edit outlet
  const handleEditOutlet = async (e) => {
    e.preventDefault();
    if (!selectedOutlet) return;
    
    setLoading(true);
    
    try {
      const success = await updateOutlet(selectedOutlet.id, selectedOutlet);
      if (success) {
        setShowEditModal(false);
        setSelectedOutlet(null);
      }
    } catch (error) {
      console.error('Error updating outlet:', error);
      toast.error('Failed to update outlet');
    } finally {
      setLoading(false);
    }
  };

  // Handle delete outlet
  const handleDeleteOutlet = async (outlet) => {
    if (window.confirm(`Are you sure you want to delete "${outlet.name}"? This action cannot be undone.`)) {
      await deleteOutlet(outlet.id);
      loadOutletStatistics();
    }
  };

  // Handle assign user to outlet
  const handleAssignUser = async (userId, outletId) => {
    await assignUserToOutlet(userId, outletId);
    setShowAssignModal(false);
  };

  if (!isMainAccount) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Building2 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
          <p className="mt-1 text-sm text-gray-500">
            Only the main account can access outlet management.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Outlet Management</h1>
                <p className="text-sm text-gray-500">Manage all outlets from central dashboard</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              {outlets.length === 1 ? 'Add New Outlet' : 'Create Outlet'}
            </button>
          </div>
        </div>
      </div>

      {/* Welcome Message for New Multi-Outlet Setup */}
      {outlets.length === 1 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <div className="flex items-start">
              <Building2 className="h-6 w-6 text-blue-600 mt-1 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  Welcome to Multi-Outlet Management!
                </h3>
                <p className="text-blue-800 mb-3">
                  Your existing data has been successfully organized as your <strong>Main Outlet</strong>. 
                  You can now create additional outlets to expand your business operations.
                </p>
                <p className="text-blue-700 text-sm">
                  Each new outlet will have its own independent inventory, sales, and staff management.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Outlets Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {outlets.map((outlet) => {
            const stats = outletStats[outlet.id] || {};
            
            return (
              <div key={outlet.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Outlet Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-3 ${
                        outlet.status === 'active' ? 'bg-green-400' : 'bg-red-400'
                      }`} />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{outlet.name}</h3>
                        <p className="text-sm text-gray-500">{outlet.code}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedOutlet(outlet);
                          setShowEditModal(true);
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteOutlet(outlet)}
                        className="p-2 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Outlet Details */}
                <div className="p-6">
                  <div className="space-y-3">
                    {outlet.address && (
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2" />
                        {outlet.address}
                      </div>
                    )}
                    {outlet.phone && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="h-4 w-4 mr-2" />
                        {outlet.phone}
                      </div>
                    )}
                    {outlet.email && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="h-4 w-4 mr-2" />
                        {outlet.email}
                      </div>
                    )}
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="h-4 w-4 mr-2" />
                      Manager: {outlet.managerName || 'Not assigned'}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      Created: {outlet.createdAt?.toLocaleDateString()}
                    </div>
                  </div>

                  {/* Statistics */}
                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 text-blue-600 mr-2" />
                        <span className="text-xs text-blue-600 font-medium">Sales (30d)</span>
                      </div>
                      <p className="text-lg font-semibold text-blue-900">
                        ₹{(stats.totalSales || 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="flex items-center">
                        <ShoppingCart className="h-4 w-4 text-green-600 mr-2" />
                        <span className="text-xs text-green-600 font-medium">Orders</span>
                      </div>
                      <p className="text-lg font-semibold text-green-900">
                        {stats.totalOrders || 0}
                      </p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <div className="flex items-center">
                        <Package className="h-4 w-4 text-purple-600 mr-2" />
                        <span className="text-xs text-purple-600 font-medium">Products</span>
                      </div>
                      <p className="text-lg font-semibold text-purple-900">
                        {stats.totalProducts || 0}
                      </p>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-lg">
                      <div className="flex items-center">
                        <BarChart3 className="h-4 w-4 text-orange-600 mr-2" />
                        <span className="text-xs text-orange-600 font-medium">Avg Order</span>
                      </div>
                      <p className="text-lg font-semibold text-orange-900">
                        ₹{(stats.avgOrderValue || 0).toFixed(0)}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-6 flex space-x-2">
                    <button
                      onClick={() => switchOutlet(outlet)}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium ${
                        currentOutlet?.id === outlet.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {currentOutlet?.id === outlet.id ? 'Current' : 'Switch To'}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedOutlet(outlet);
                        setShowAssignModal(true);
                      }}
                      className="py-2 px-3 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200"
                    >
                      <Users className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create Outlet Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {outlets.length === 1 ? 'Add New Outlet' : 'Create New Outlet'}
            </h3>
            {outlets.length === 1 && (
              <p className="text-sm text-gray-600 mb-4">
                Create an additional outlet to expand your business operations. This will be independent from your main outlet.
              </p>
            )}
            <form onSubmit={handleCreateOutlet}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Outlet Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newOutlet.name}
                    onChange={(e) => setNewOutlet({ ...newOutlet, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <textarea
                    value={newOutlet.address}
                    onChange={(e) => setNewOutlet({ ...newOutlet, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={newOutlet.phone}
                    onChange={(e) => setNewOutlet({ ...newOutlet, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={newOutlet.email}
                    onChange={(e) => setNewOutlet({ ...newOutlet, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Manager
                  </label>
                  <select
                    value={newOutlet.managerId}
                    onChange={(e) => {
                      const selectedUser = users.find(u => u.id === e.target.value);
                      setNewOutlet({
                        ...newOutlet,
                        managerId: e.target.value,
                        managerName: selectedUser?.displayName || selectedUser?.email || ''
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Manager</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.displayName || user.email}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Outlet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Outlet Modal */}
      {showEditModal && selectedOutlet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Edit Outlet</h3>
            <form onSubmit={handleEditOutlet}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Outlet Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={selectedOutlet.name}
                    onChange={(e) => setSelectedOutlet({ ...selectedOutlet, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <textarea
                    value={selectedOutlet.address || ''}
                    onChange={(e) => setSelectedOutlet({ ...selectedOutlet, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={selectedOutlet.phone || ''}
                    onChange={(e) => setSelectedOutlet({ ...selectedOutlet, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={selectedOutlet.status}
                    onChange={(e) => setSelectedOutlet({ ...selectedOutlet, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update Outlet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign User Modal */}
      {showAssignModal && selectedOutlet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">
              Assign User to {selectedOutlet.name}
            </h3>
            <div className="space-y-3">
              {users.map(user => (
                <div key={user.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium">{user.displayName || user.email}</p>
                    <p className="text-sm text-gray-500">{user.role || 'staff'}</p>
                  </div>
                  <button
                    onClick={() => handleAssignUser(user.id, selectedOutlet.id)}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    Assign
                  </button>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OutletManagement;