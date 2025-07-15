'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/app/components/DashboardLayout';
import AuthWrapper from '@/app/components/AuthWrapper';
import ProductSelector from '@/app/components/ProductSelector';
import ordersManagementAPI from '@/app/services/OrdersManagementAPI';

export default function CreateOrderManagement() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
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
    workerContactId: '',
    products: [] // Array of { productId, quantity }
  });

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

    fetchTailors();
  }, []);

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProductChange = (productId, quantity) => {
    console.log('Product change:', { productId, quantity });

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

      console.log('Updated products:', products);
      return { ...prev, products };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
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

      console.log('Submitting form data:', formData);

      // Use orders-management API for creation
      const result = await ordersManagementAPI.createOrder(formData);

      console.log('Order creation result:', result);

      // Handle stock warnings if any
      if (result.stockResults && result.stockResults.hasStockIssues) {
        const warnings = result.stockResults.warnings || [];
        const alerts = result.stockResults.alerts || [];

        if (warnings.length > 0 || alerts.length > 0) {
          const stockMessage = [
            ...warnings,
            ...alerts.map(alert => `Purchase alert created for ${alert.materialName}`)
          ].join('; ');

          setSuccessMessage(`Order created successfully! Stock notifications: ${stockMessage}`);
        } else {
          setSuccessMessage('Order created successfully!');
        }
      } else {
        setSuccessMessage('Order created successfully!');
      }

      setShowSuccessModal(true);

      // Reset form
      setFormData({
        customerNote: '',
        dueDate: '',
        description: '',
        priority: 'MEDIUM',
        workerContactId: '',
        products: []
      });

      // Redirect to orders management after 3 seconds
      setTimeout(() => {
        setShowSuccessModal(false);
        router.push('/dashboard/orders-management');
      }, 3000);

    } catch (err) {
      console.error('Error creating order:', err);
      setError(err.message);
    } finally {
      setLoading(false);
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
                  <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">Create New Order</span>
                </div>
              </li>
            </ol>
          </nav>

          {/* Header */}
          <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Order</h1>
              <p className="text-gray-600">
              Fill in the order details below. All fields marked with * are required.
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Due Date */}
                    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-300 shadow-sm">
                      <label htmlFor="dueDate" className="text-xs font-semibold text-gray-500 block mb-2 uppercase tracking-wider">
                      Due Date <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="date"
                      id="dueDate"
                      name="dueDate"
                      value={formData.dueDate}
                      onChange={handleInputChange}
                        className="w-full h-10 px-3 py-2 text-sm bg-white/80 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200"
                      required
                    />
                  </div>

                  {/* Priority */}
                    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-300 shadow-sm">
                      <label htmlFor="priority" className="text-xs font-semibold text-gray-500 block mb-2 uppercase tracking-wider">
                      Priority
                    </label>
                    <select
                      id="priority"
                      name="priority"
                      value={formData.priority}
                      onChange={handleInputChange}
                        className="w-full h-10 px-3 py-2 text-sm bg-white/80 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>

                  {/* Tailor Assignment */}
                    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-300 shadow-sm">
                      <label htmlFor="workerContactId" className="text-xs font-semibold text-gray-500 block mb-2 uppercase tracking-wider">
                      Assigned Tailor
                    </label>
                    <div className="flex items-center space-x-2">
                      <select
                        id="workerContactId"
                        name="workerContactId"
                        value={formData.workerContactId}
                        onChange={handleInputChange}
                          className="flex-1 h-10 px-3 py-2 text-sm bg-white/80 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200"
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
                          className="px-2 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md"
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
                      <p className="mt-2 text-xs text-gray-500">
                      Assign a tailor to this order for progress tracking
                    </p>
                  </div>
                </div>

                {/* Product Selection */}
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-gray-300 shadow-sm">
                    <label className="text-xs font-semibold text-gray-500 block mb-4 uppercase tracking-wider">
                    Products & Quantities <span className="text-red-600">*</span>
                  </label>
                  <ProductSelector
                    selectedProducts={formData.products}
                    onProductChange={handleProductChange}
                  />
                    <p className="mt-4 text-xs text-gray-500">
                    Select products and specify quantities. Material stock will be automatically checked.
                  </p>
                </div>

                {/* Description */}
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-300 shadow-sm">
                    <label htmlFor="description" className="text-xs font-semibold text-gray-500 block mb-2 uppercase tracking-wider">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    value={formData.description}
                    onChange={handleInputChange}
                      className="w-full px-4 py-3 text-sm bg-white/80 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200 min-h-[100px]"
                    placeholder="Enter order description..."
                  />
                </div>

                {/* Customer Notes */}
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-300 shadow-sm">
                    <label htmlFor="customerNote" className="text-xs font-semibold text-gray-500 block mb-2 uppercase tracking-wider">
                    Customer Notes
                  </label>
                  <textarea
                    id="customerNote"
                    name="customerNote"
                    rows={3}
                    value={formData.customerNote}
                    onChange={handleInputChange}
                      className="w-full px-4 py-3 text-sm bg-white/80 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200 min-h-[100px]"
                    placeholder="Enter customer notes..."
                  />
                </div>

                {/* Form Actions */}
                  <div className="flex justify-end space-x-4 pt-8 border-t border-gray-300">
                  <button
                    type="button"
                    onClick={() => router.push('/dashboard/orders-management')}
                      className="px-6 py-3 border border-gray-300 rounded-xl shadow-lg text-sm font-medium text-gray-700 bg-white/80 backdrop-blur-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 hover:scale-105"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                      className="px-6 py-3 border border-transparent rounded-xl shadow-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-300 hover:scale-105"
                  >
                    {loading ? 'Creating...' : 'Create Order'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Help Section */}
            <div className="mt-8 bg-blue-600 border border-gray-300 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300">
              <h3 className="text-xl font-bold text-white mb-4">Enhanced Features</h3>
              <ul className="text-sm text-blue-100 space-y-2">
              <li>• <strong>Tailor Assignment:</strong> Assign orders directly to tailors for better tracking</li>
              <li>• <strong>Material Stock Checking:</strong> Automatic material availability verification</li>
              <li>• <strong>Purchase Alerts:</strong> Automatic alerts when materials are low</li>
              <li>• <strong>Progress Tracking:</strong> Integrated progress reporting system</li>
              <li>• <strong>WhatsApp Integration:</strong> Direct communication with assigned tailors</li>
            </ul>
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