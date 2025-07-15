'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import AuthWrapper from '@/app/components/AuthWrapper';
import DashboardLayout from '@/app/components/DashboardLayout';
import ProductSelector from '@/app/components/ProductSelector';
import ordersManagementAPI from '@/app/services/OrdersManagementAPI';

export default function EditOrderManagement({ params }) {
  const router = useRouter();
  const { id } = use(params);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [tailors, setTailors] = useState([]);
  const [refreshingTailors, setRefreshingTailors] = useState(false);

  const [formData, setFormData] = useState({
    customerNote: '',
    dueDate: '',
    description: '',
    priority: 'MEDIUM',
    status: 'CREATED',
    workerContactId: '',
    products: [] // Array of { productId, quantity }
  });

  // Fetch order data and pre-populate form
  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        setLoading(true);
        setError('');

        // Fetch order details using orders-management API
        const orderData = await ordersManagementAPI.getOrderDetails(id);

        // Pre-populate form data
        setFormData({
          customerNote: orderData.customerNote || '',
          dueDate: orderData.dueDate ? orderData.dueDate.split('T')[0] : '', // Format date for input
          description: orderData.description || '',
          priority: orderData.priority || 'MEDIUM',
          status: orderData.status || 'CREATED',
          workerContactId: orderData.tailorContactId || '',
          products: orderData.Products?.map(p => ({
            productId: p.id,
            quantity: p.OrderProduct.qty
          })) || []
        });

        // Fetch tailors for dropdown
        const token = localStorage.getItem('token');
        if (token) {
          const response = await fetch('http://localhost:8080/api/contacts/type/WORKER', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              setTailors(data.contacts || []);
            }
          }
        }

      } catch (err) {
        setError('Error loading order data: ' + err.message);
        console.error('Error fetching order data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderData();
  }, [id]);

  // Fetch tailors on component mount
  useEffect(() => {
    const fetchTailors = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.warn('No authentication token for loading tailors');
          return;
        }

        const response = await fetch('http://localhost:8080/api/contacts/type/WORKER', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setTailors(data.contacts || []);
          } else {
            console.error('Failed to load tailors:', data.message);
          }
        } else {
          console.error('Tailors API error:', response.status, response.statusText);
        }
      } catch (err) {
        console.error('Error loading tailors:', err);
        // Don't show error for tailors, just log it
      }
    };

    if (id) {
      fetchTailors();
    }
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProductChange = (productId, quantity) => {
    setFormData(prev => {
      const products = [...prev.products];
      const existingIndex = products.findIndex(p => p.productId === productId);

      if (existingIndex >= 0) {
        if (quantity > 0) {
          products[existingIndex].quantity = quantity;
        } else {
          products.splice(existingIndex, 1);
        }
      } else if (quantity > 0) {
        products.push({ productId, quantity });
      }

      return { ...prev, products };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Validate form
      if (!formData.dueDate) {
        throw new Error('Due date is required');
      }
      if (formData.products.length === 0) {
        throw new Error('Please select at least one product');
      }

      // Use orders-management API for update
      const result = await ordersManagementAPI.updateOrder(id, formData);

      // Handle stock warnings if any
      if (result.stockResults && result.stockResults.hasStockIssues) {
        const warnings = result.stockResults.warnings || [];
        const alerts = result.stockResults.alerts || [];

        if (warnings.length > 0 || alerts.length > 0) {
          const stockMessage = [
            ...warnings,
            ...alerts.map(alert => `Purchase alert updated for ${alert.materialName}`)
          ].join('; ');

          setSuccessMessage(`Order updated successfully! Stock notifications: ${stockMessage}`);
        } else {
          setSuccessMessage('Order updated successfully!');
        }
      } else {
        setSuccessMessage('Order updated successfully!');
      }

      setShowSuccessModal(true);

      // Redirect to order details after 3 seconds
      setTimeout(() => {
        setShowSuccessModal(false);
        router.push(`/dashboard/orders-management/${id}`);
      }, 3000);

    } catch (err) {
      setError(err.message);
      console.error('Error updating order:', err);
    } finally {
      setSaving(false);
    }
  };

  // Manual refresh tailors function
  const handleRefreshTailors = async () => {
    try {
      setRefreshingTailors(true);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token required');
      }

      const response = await fetch('http://localhost:8080/api/contacts/type/WORKER', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setTailors(data.contacts || []);
          setSuccessMessage('Tailors list refreshed successfully!');
          setShowSuccessModal(true);
          setTimeout(() => setShowSuccessModal(false), 3000);
        } else {
          throw new Error(data.message || 'Failed to refresh tailors');
        }
      } else {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      setError('Failed to refresh tailors: ' + error.message);
      setTimeout(() => setError(''), 5000);
    } finally {
      setRefreshingTailors(false);
    }
  };

  // Handle escape key for modals
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        setShowSuccessModal(false);
      }
    };

    if (showSuccessModal) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => document.removeEventListener('keydown', handleEscapeKey);
    }
  }, [showSuccessModal]);

  // Handle click outside modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSuccessModal && event.target.classList.contains('modal-backdrop')) {
        setShowSuccessModal(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showSuccessModal]);

  if (loading) {
    return (
      <AuthWrapper>
        <DashboardLayout>
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </DashboardLayout>
      </AuthWrapper>
    );
  }

  return (
    <AuthWrapper>
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-6xl mx-auto">
            {/* Breadcrumb Navigation */}
            <nav className="flex mb-8" aria-label="Breadcrumb">
              <ol className="inline-flex items-center space-x-1 md:space-x-3">
                <li className="inline-flex items-center">
                  <button
                    onClick={() => router.push('/dashboard/orders-management')}
                    className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    Orders Management
                  </button>
                </li>
                <li>
                  <div className="flex items-center">
                    <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">Edit Order</span>
                  </div>
                </li>
              </ol>
            </nav>

            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Order</h1>
              <p className="text-gray-600">
                Update the order details below. All fields marked with * are required.
              </p>
            </div>

            {/* Error Messages */}
            {error && (
              <div className="mb-6 bg-red-600 border border-gray-300 rounded-xl p-4">
                <div className="flex">
                  <svg className="w-5 h-5 text-white mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-white">{error}</p>
                </div>
              </div>
            )}

            {/* Form */}
            <div className="bg-gradient-to-br from-white/95 via-white/90 to-white/95 backdrop-blur-xl rounded-3xl border border-gray-300 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-300 bg-gradient-to-r from-gray-100/50 to-gray-50/50 backdrop-blur-sm">
                <h2 className="text-xl font-bold text-gray-900">Order Information</h2>
              </div>
              <div className="px-8 py-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Basic Information Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Status */}
                    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-5 border border-gray-300 shadow-sm hover:shadow-md transition-all duration-300">
                      <label htmlFor="status" className="block text-sm font-medium text-base-content/70 mb-3">
                        Status <span className="text-red-600">*</span>
                      </label>
                      <select
                        id="status"
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 text-sm"
                        required
                      >
                        <option value="CREATED">Created</option>
                        <option value="CONFIRMED">Confirmed</option>
                        <option value="PROCESSING">Processing</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="SHIPPED">Shipped</option>
                        <option value="DELIVERED">Delivered</option>
                        <option value="CANCELLED">Cancelled</option>
                        <option value="NEED_MATERIAL">Need Material</option>
                      </select>
                    </div>

                    {/* Due Date */}
                    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-5 border border-gray-300 shadow-sm hover:shadow-md transition-all duration-300">
                      <label htmlFor="dueDate" className="block text-sm font-medium text-base-content/70 mb-3">
                        Due Date <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="date"
                        id="dueDate"
                        name="dueDate"
                        value={formData.dueDate}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 text-sm"
                        required
                      />
                    </div>

                    {/* Priority */}
                    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-5 border border-gray-300 shadow-sm hover:shadow-md transition-all duration-300">
                      <label htmlFor="priority" className="block text-sm font-medium text-base-content/70 mb-3">
                        Priority
                      </label>
                      <select
                        id="priority"
                        name="priority"
                        value={formData.priority}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 text-sm"
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="URGENT">Urgent</option>
                      </select>
                    </div>

                    {/* Tailor Assignment */}
                    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-5 border border-gray-300 shadow-sm hover:shadow-md transition-all duration-300">
                      <label htmlFor="workerContactId" className="block text-sm font-medium text-base-content/70 mb-3">
                        Assigned Tailor
                      </label>
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <select
                            id="workerContactId"
                            name="workerContactId"
                            value={formData.workerContactId}
                            onChange={handleInputChange}
                            className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 text-sm"
                          >
                            <option value="">Select Tailor (Optional)</option>
                            {tailors.map(tailor => (
                              <option key={tailor.id} value={tailor.id}>
                                {tailor.name}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={handleRefreshTailors}
                            disabled={refreshingTailors}
                            className="px-3 py-3 bg-primary text-primary-content rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
                            title="Refresh tailors list"
                          >
                            {refreshingTailors ? (
                              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : (
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            )}
                          </button>
                        </div>
                        <p className="text-xs text-base-content/50 leading-relaxed">
                          Assign a tailor to this order for progress tracking
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Product Selection */}
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-gray-300 shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg">
                        <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                        </svg>
                      </div>
                      <label className="text-sm font-medium text-base-content/70">
                        Products & Quantities <span className="text-red-600">*</span>
                      </label>
                    </div>
                    <ProductSelector
                      selectedProducts={formData.products}
                      onProductChange={handleProductChange}
                    />
                  </div>

                  {/* Description */}
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-gray-300 shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg">
                        <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        </svg>
                      </div>
                      <label htmlFor="description" className="text-sm font-medium text-base-content/70">
                        Description
                      </label>
                    </div>
                    <textarea
                      id="description"
                      name="description"
                      rows={4}
                      value={formData.description}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 resize-none text-sm"
                      placeholder="Enter order description..."
                    />
                  </div>

                  {/* Customer Notes */}
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-gray-300 shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg">
                        <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"/>
                        </svg>
                      </div>
                      <label htmlFor="customerNote" className="text-sm font-medium text-base-content/70">
                        Customer Notes
                      </label>
                    </div>
                    <textarea
                      id="customerNote"
                      name="customerNote"
                      rows={4}
                      value={formData.customerNote}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 resize-none text-sm"
                      placeholder="Enter customer notes..."
                    />
                  </div>

                  {/* Form Actions */}
                  <div className="bg-white/40 backdrop-blur-sm rounded-xl p-6 border border-gray-300 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:justify-end gap-4">
                      <button
                        type="button"
                        onClick={() => router.push(`/dashboard/orders-management/${id}`)}
                        className="px-6 py-3 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/20 transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                        </svg>
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-3 bg-primary text-primary-content rounded-lg shadow-sm text-sm font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        {saving ? (
                          <>
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Updating...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                            </svg>
                            Update Order
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 modal-backdrop">
            <div className="bg-gradient-to-br from-white/95 via-white/90 to-white/95 backdrop-blur-xl rounded-3xl border border-gray-300 shadow-2xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-center mb-6">
                  <div className="bg-gradient-to-br from-green-100 to-green-200 p-3 rounded-full">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 text-center mb-4">
                  Success!
                </h3>
                
                <div className="mb-6">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <p className="text-green-800 text-sm text-center">{successMessage}</p>
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <button
                    type="button"
                    className="px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-200 font-medium"
                    onClick={() => setShowSuccessModal(false)}
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </AuthWrapper>
  );
} 