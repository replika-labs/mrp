'use client';

import { useState, useEffect } from 'react';
import { FiPlus, FiSearch, FiFilter, FiEye, FiEdit2, FiTrash2, FiDollarSign, FiPackage, FiCalendar, FiTrendingUp, FiX } from 'react-icons/fi';
import DashboardLayout from '@/app/components/DashboardLayout';
import AuthWrapper from '@/app/components/AuthWrapper';
import { formatCurrencyShort } from '@/utils/formatNominal';

function PurchaseLogsPage() {
  const [purchaseLogs, setPurchaseLogs] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    status: '',
    supplier: '',
    materialId: '',
    startDate: '',
    endDate: '',
    sortBy: 'purchaseDate',
    sortOrder: 'DESC'
  });

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [selectedPurchaseLog, setSelectedPurchaseLog] = useState(null);
  const [purchaseLogToDelete, setPurchaseLogToDelete] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [validationError, setValidationError] = useState('');

  // Form data
  const [formData, setFormData] = useState({
    purchaseDate: '',
    materialId: '',
    quantity: '',
    unit: 'pcs',
    supplier: '',
    pricePerUnit: '',
    status: 'PENDING',
    invoiceNumber: '',
    deliveryDate: '',
    receivedQuantity: '',
    notes: ''
  });

  // Load purchase logs
  const loadPurchaseLogs = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: 20,
        ...filters
      });

      const token = localStorage.getItem('token');

      // Try the API first
      try {
        const response = await fetch(`http://localhost:8080/api/purchase-logs?${queryParams}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();

          if (data.success) {
            const apiPurchaseLogs = data.data.purchaseLogs || [];

            console.log('API purchase logs loaded:', apiPurchaseLogs.length);
            setPurchaseLogs(apiPurchaseLogs);
            setTotalPages(data.data.pagination?.totalPages || 1);
            setError(''); // Clear any previous errors
            return;
          } else {
            throw new Error(data.message || 'Failed to load purchase logs');
          }
        } else if (response.status === 401) {
          throw new Error('Authentication required. Please login again.');
        } else {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
      } catch (apiError) {
        console.error('API error:', apiError.message);
        setError(`Error connecting to server: ${apiError.message}`);
        // Don't fall back to demo data - show the actual error
        setPurchaseLogs([]);
        setTotalPages(1);
        return;
      }

      // Removed demo data fallback - show actual API errors instead

    } catch (error) {
      console.error('Error loading purchase logs:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Load materials for dropdown
  const loadMaterials = async () => {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        console.warn('No authentication token for loading materials');
        return;
      }

      const response = await fetch('http://localhost:8080/api/materials-management', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();

        if (data.success) {
          const apiMaterials = data.data.materials || [];
          console.log('Materials loaded for dropdown:', apiMaterials.length);
          setMaterials(apiMaterials);
        } else {
          console.error('Failed to load materials:', data.message);
        }
      } else if (response.status === 401) {
        console.error('Authentication required for loading materials');
      } else {
        console.error('Materials API error:', response.status, response.statusText);
      }

    } catch (error) {
      console.error('Error loading materials:', error);
    }
  };

  // Load suppliers from contacts API
  const loadSuppliers = async () => {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        console.warn('No authentication token for loading suppliers');
        return;
      }

      const response = await fetch('http://localhost:8080/api/contacts/type/SUPPLIER', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();

        if (data.success) {
          const apiSuppliers = data.contacts || [];
          console.log('Suppliers loaded for dropdown:', apiSuppliers.length);
          setSuppliers(apiSuppliers);
        } else {
          console.error('Failed to load suppliers:', data.message);
        }
      } else if (response.status === 401) {
        console.error('Authentication required for loading suppliers');
      } else {
        console.error('Suppliers API error:', response.status, response.statusText);
      }

    } catch (error) {
      console.error('Error loading suppliers:', error);
    }
  };

  // Load purchase log details for view/edit
  const loadPurchaseLogDetails = async (purchaseLogId) => {
    if (!purchaseLogId) {
      setValidationError('Purchase log ID not found');
      setShowValidationModal(true);
      return null;
    }

    try {
      const token = localStorage.getItem('token');

      if (!token) {
        setValidationError('Authentication required. Please login again.');
        setShowValidationModal(true);
        return null;
      }

      const response = await fetch(`http://localhost:8080/api/purchase-logs/${purchaseLogId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please login again.');
        } else if (response.status === 404) {
          throw new Error('Purchase log not found');
        } else {
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
      }

      const data = await response.json();

      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to load purchase log details');
      }
    } catch (error) {
      console.error('Error loading purchase log details:', error);
      setError(error.message);
      setErrorMessage(`Error loading purchase log details: ${error.message}`);
      setShowErrorModal(true);
      return null;
    }
  };

  // Create purchase log
  const handleCreatePurchaseLog = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!formData.purchaseDate || !formData.materialId || !formData.quantity || !formData.pricePerUnit || !formData.supplier) {
      setValidationError('Please fill in required fields: Purchase Date, Material, Quantity, Price per Unit, and Supplier');
      setShowValidationModal(true);
      return;
    }

    try {
      const token = localStorage.getItem('token');

      if (!token) {
        setValidationError('Authentication required. Please login again.');
        setShowValidationModal(true);
        return;
      }

      // Find the selected supplier and use its company field
      const selectedSupplier = suppliers.find(supplier => supplier.id.toString() === formData.supplier);
      const supplierCompany = selectedSupplier ? (selectedSupplier.company || selectedSupplier.name) : '';

      const submissionData = {
        ...formData,
        supplier: supplierCompany
      };

      const response = await fetch('http://localhost:8080/api/purchase-logs', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submissionData)
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please login again.');
        } else if (response.status === 400) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Invalid data provided');
        } else {
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
      }

      const data = await response.json();

      if (data.success) {
        clearAllModals();
        resetForm();
        setSuccessMessage('Purchase log created successfully!');
        setShowSuccessModal(true);
        loadPurchaseLogs();
        
        // Auto-close success modal after 3 seconds
        setTimeout(() => {
          setShowSuccessModal(false);
        }, 3000);
      } else {
        throw new Error(data.message || 'Failed to create purchase log');
      }
    } catch (error) {
      console.error('Error creating purchase log:', error);
      setErrorMessage(error.message);
      setShowErrorModal(true);
    }
  };

  // Update purchase log
  const handleUpdatePurchaseLog = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!formData.purchaseDate || !formData.materialId || !formData.quantity || !formData.pricePerUnit || !formData.supplier) {
      setValidationError('Please fill in required fields: Purchase Date, Material, Quantity, Price per Unit, and Supplier');
      setShowValidationModal(true);
      return;
    }

    if (!selectedPurchaseLog) {
      setValidationError('No purchase log selected for update');
      setShowValidationModal(true);
      return;
    }

    try {
      const token = localStorage.getItem('token');

      if (!token) {
        setValidationError('Authentication required. Please login again.');
        setShowValidationModal(true);
        return;
      }

      // Find the selected supplier and use its company field
      const selectedSupplier = suppliers.find(supplier => supplier.id.toString() === formData.supplier);
      const supplierCompany = selectedSupplier ? (selectedSupplier.company || selectedSupplier.name) : '';

      const submissionData = {
        ...formData,
        supplier: supplierCompany
      };

      const response = await fetch(`http://localhost:8080/api/purchase-logs/${selectedPurchaseLog.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submissionData)
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please login again.');
        } else if (response.status === 400) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Invalid data provided');
        } else if (response.status === 404) {
          throw new Error('Purchase log not found');
        } else {
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
      }

      const data = await response.json();

      if (data.success) {
        clearAllModals();
        resetForm();
        setSelectedPurchaseLog(null);
        setSuccessMessage('Purchase log updated successfully!');
        setShowSuccessModal(true);
        loadPurchaseLogs();
        
        // Auto-close success modal after 3 seconds
        setTimeout(() => {
          setShowSuccessModal(false);
        }, 3000);
      } else {
        throw new Error(data.message || 'Failed to update purchase log');
      }
    } catch (error) {
      console.error('Error updating purchase log:', error);
      setErrorMessage(error.message);
      setShowErrorModal(true);
    }
  };

  // Update purchase log status
  const handleUpdateStatus = async (purchaseLogId, newStatus) => {
    if (!purchaseLogId) {
      setValidationError('Purchase log ID not found');
      setShowValidationModal(true);
      return;
    }

    try {
      const token = localStorage.getItem('token');

      if (!token) {
        setValidationError('Authentication required. Please login again.');
        setShowValidationModal(true);
        return;
      }

      const response = await fetch(`http://localhost:8080/api/purchase-logs/${purchaseLogId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please login again.');
        } else if (response.status === 404) {
          throw new Error('Purchase log not found');
        } else if (response.status === 400) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Invalid status value');
        } else {
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
      }

      const data = await response.json();

      if (data.success) {
        setSuccessMessage('Status updated successfully!');
        setShowSuccessModal(true);
        loadPurchaseLogs();
        
        // Auto-close success modal after 3 seconds
        setTimeout(() => {
          setShowSuccessModal(false);
        }, 3000);
      } else {
        throw new Error(data.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      setErrorMessage(error.message);
      setShowErrorModal(true);
    }
  };

  // Delete purchase log
  const handleDeletePurchaseLog = (purchaseLogId) => {
    if (!purchaseLogId) {
      setValidationError('Purchase log ID not found');
      setShowValidationModal(true);
      return;
    }

    const purchaseLog = purchaseLogs.find(p => p.id === purchaseLogId);
    setPurchaseLogToDelete(purchaseLog);
    setShowDeleteModal(true);
  };

  const confirmDeletePurchaseLog = async () => {
    if (!purchaseLogToDelete) return;

    try {
      const token = localStorage.getItem('token');

      if (!token) {
        setValidationError('Authentication required. Please login again.');
        setShowValidationModal(true);
        return;
      }

      const response = await fetch(`http://localhost:8080/api/purchase-logs/${purchaseLogToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Failed to parse response JSON:', parseError);
        data = {};
      }

      // Check for success based on multiple indicators
      const isSuccess = (
        (response.ok && data.success) ||
        (data.success === true) ||
        (data.message && data.message.toLowerCase().includes('deleted successfully')) ||
        (response.status === 200 && data.message)
      );

      if (isSuccess) {
        clearAllModals();
        const purchaseLogName = purchaseLogToDelete.material?.name || 'Purchase log';
        setPurchaseLogToDelete(null);
        setSuccessMessage(`${purchaseLogName} deleted successfully!`);
        setShowSuccessModal(true);
        loadPurchaseLogs();
        
        // Auto-close success modal after 3 seconds
        setTimeout(() => {
          setShowSuccessModal(false);
        }, 3000);
      } else {
        clearAllModals();
        if (response.status === 401) {
          setErrorMessage('Authentication required. Please login again.');
        } else if (response.status === 404) {
          setErrorMessage('Purchase log not found');
        } else if (response.status === 400 && data.message) {
          setErrorMessage(data.message);
        } else {
          setErrorMessage(data.message || `Server error: ${response.status} ${response.statusText}`);
        }
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Network/Exception error deleting purchase log:', error);
      clearAllModals();
      setErrorMessage(`Network error: ${error.message}`);
      setShowErrorModal(true);
    }
  };

  // View purchase log details
  const handleViewPurchaseLog = async (purchaseLogId) => {
    const details = await loadPurchaseLogDetails(purchaseLogId);
    if (details) {
      setSelectedPurchaseLog(details);
      setShowViewModal(true);
    }
  };

  // Edit purchase log
  const handleEditPurchaseLog = async (purchaseLogId) => {
    const details = await loadPurchaseLogDetails(purchaseLogId);
    if (details) {
      setSelectedPurchaseLog(details);

      // Find the supplier ID based on the company name stored in the purchase log
      const supplierMatch = suppliers.find(supplier =>
        supplier.company === details.supplier || supplier.name === details.supplier
      );

      setFormData({
        purchaseDate: details.purchaseDate ? new Date(details.purchaseDate).toISOString().split('T')[0] : '',
        materialId: details.materialId || '',
        quantity: details.quantity || '',
        unit: details.unit || 'pcs',
        supplier: supplierMatch ? supplierMatch.id.toString() : '',
        pricePerUnit: details.pricePerUnit || '',
        status: details.status || 'PENDING',
        invoiceNumber: details.invoiceNumber || '',
        deliveryDate: details.deliveryDate ? new Date(details.deliveryDate).toISOString().split('T')[0] : '',
        receivedQuantity: details.receivedQuantity || '',
        notes: details.notes || ''
      });
      setShowEditModal(true);
    }
  };

  // Clear all modal states to prevent conflicts
  const clearAllModals = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowViewModal(false);
    setShowDeleteModal(false);
    setShowSuccessModal(false);
    setShowErrorModal(false);
    setShowValidationModal(false);
  };

  // Handle modal close
  const handleCloseModal = () => {
    clearAllModals();
    setSelectedPurchaseLog(null);
    setPurchaseLogToDelete(null);
    setSuccessMessage('');
    setErrorMessage('');
    setValidationError('');
    resetForm();
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      purchaseDate: '',
      materialId: '',
      quantity: '',
      unit: 'pcs',
      supplier: '',
      pricePerUnit: '',
      status: 'PENDING',
      invoiceNumber: '',
      deliveryDate: '',
      receivedQuantity: '',
      notes: ''
    });
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statusConfig = {
      'PENDING': { bg: 'bg-yellow-600', text: 'text-white', label: 'Pending' },
      'RECEIVED': { bg: 'bg-green-600', text: 'text-white', label: 'Received' },
      'CANCELLED': { bg: 'bg-red-600', text: 'text-white', label: 'Cancelled' }
    };

    const config = statusConfig[status] || { bg: 'bg-gray-600', text: 'text-white', label: status };

    return (
      <span className={`px-3 py-2 text-xs font-medium ${config.bg} ${config.text} rounded-full`}>
        {config.label}
      </span>
    );
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  // Handle pagination
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  useEffect(() => {
    loadPurchaseLogs();
  }, [currentPage, filters]);

  useEffect(() => {
    loadMaterials();
  }, []);

  useEffect(() => {
    loadSuppliers();
  }, []);

  if (loading && purchaseLogs.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading purchase logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Purchase Logs</h1>
            <p className="text-gray-600">Track and manage all material purchase transactions</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <FiPlus size={20} />
            Add Purchase
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white p-4 rounded-lg shadow border border-gray-300 hover:scale-105 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center">
              <FiPackage className="text-blue-600 text-2xl mr-3" />
              <div>
                <p className="text-sm text-gray-600">Total Purchases</p>
                <p className="text-xl font-bold">{purchaseLogs.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border border-gray-300 hover:scale-105 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center">
              <FiDollarSign className="text-green-600 text-2xl mr-3" />
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-xl font-bold">
                  {(() => {
                    const total = purchaseLogs.reduce((sum, p) => {
                      const cost = p.totalCost || 0;
                      return sum + Number(cost);
                    }, 0);
                    return formatCurrencyShort(total);
                  })()}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border border-gray-300 hover:scale-105 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center">
              <FiTrendingUp className="text-purple-600 text-2xl mr-3" />
              <div>
                <p className="text-sm text-gray-600">Received</p>
                <p className="text-xl font-bold">
                  {purchaseLogs.filter(p => p.status === 'RECEIVED').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border border-gray-300 hover:scale-105 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center">
              <FiCalendar className="text-orange-600 text-2xl mr-3" />
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-xl font-bold">
                  {purchaseLogs.filter(p => p.status === 'PENDING').length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow border border-gray-300 mb-6 hover:scale-101 hover:shadow-lg transition-all duration-300">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="RECEIVED">Received</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
            <input
              type="text"
              value={filters.supplier}
              onChange={(e) => handleFilterChange('supplier', e.target.value)}
              placeholder="Filter by supplier..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
            <select
              value={filters.materialId}
              onChange={(e) => handleFilterChange('materialId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Materials</option>
              {materials.map(material => (
                <option key={material.id} value={material.id}>
                  {material.name} ({material.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-600 border border-red-700 text-white px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Purchase Logs Table */}
      <div className="bg-white rounded-lg shadow border border-gray-300 overflow-hidden hover:scale-101 hover:shadow-lg transition-all duration-300">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Purchase Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Material
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity & Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Supplier & Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {purchaseLogs.map((purchaseLog) => (
                <tr key={purchaseLog.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {new Date(purchaseLog.purchaseDate).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        ID: {purchaseLog.id}
                      </div>
                      <div className="text-sm text-gray-500">
                        Invoice: {purchaseLog.invoiceNumber || 'N/A'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {purchaseLog.material?.name || 'Unknown Material'}
                        </div>
                        <div className="text-sm text-gray-500">
                          Code: {purchaseLog.material?.code || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div className="font-medium">
                        {purchaseLog.quantity} {purchaseLog.unit}
                      </div>
                      <div className="text-gray-500">
                        @ {formatCurrencyShort(purchaseLog.pricePerUnit || 0)}
                      </div>
                      <div className="font-medium text-green-600">
                        Total: {formatCurrencyShort(purchaseLog.totalCost || 0)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div className="font-medium">
                        {purchaseLog.supplier || 'No supplier'}
                      </div>
                      <div className="text-gray-500">
                        Delivery: {purchaseLog.deliveryDate ? new Date(purchaseLog.deliveryDate).toLocaleDateString() : 'Not set'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {purchaseLog.status === 'PENDING' ? (
                      <div className="relative">
                        <select
                          value={purchaseLog.status}
                          onChange={(e) => handleUpdateStatus(purchaseLog.id, e.target.value)}
                          className="appearance-none bg-yellow-600 text-white px-3 py-2 text-xs font-medium rounded-full border-0 cursor-pointer hover:bg-yellow-700 focus:ring-2 focus:ring-yellow-500 focus:outline-none"
                        >
                          <option value="PENDING">Pending</option>
                          <option value="RECEIVED">Received</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center mr-3 pointer-events-none">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    ) : (
                      getStatusBadge(purchaseLog.status)
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewPurchaseLog(purchaseLog.id)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <FiEye size={16} />
                      </button>
                      <button
                        onClick={() => handleEditPurchaseLog(purchaseLog.id)}
                        className="text-green-600 hover:text-green-900"
                        title="Edit Purchase Log"
                      >
                        <FiEdit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeletePurchaseLog(purchaseLog.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Purchase Log"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <div className="flex space-x-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-2 text-sm rounded-md ${page === currentPage
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
              >
                {page}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-white/95 via-white/90 to-white/95 backdrop-blur-xl rounded-3xl max-w-3xl w-full max-h-screen overflow-y-auto shadow-2xl border border-gray-300 hover:shadow-3xl transition-all duration-300">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl">
                    <FiPlus className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-bold text-base-content">Add New Purchase</h2>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-base-content/60 hover:text-base-content transition-colors p-2 rounded-xl hover:bg-gray-100/50 backdrop-blur-sm"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreatePurchaseLog} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-300 shadow-sm">
                    <label className="text-xs font-semibold text-base-content/70 block mb-2 uppercase tracking-wider">
                      Purchase Date <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.purchaseDate}
                      onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                      className="w-full h-10 px-3 py-2 text-sm bg-white/80 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200"
                      required
                    />
                  </div>

                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-300 shadow-sm">
                    <label className="text-xs font-semibold text-base-content/70 block mb-2 uppercase tracking-wider">
                      Material <span className="text-red-600">*</span>
                    </label>
                    <select
                      value={formData.materialId}
                      onChange={(e) => {
                        const selectedMaterial = materials.find(m => m.id == e.target.value);
                        setFormData({
                          ...formData,
                          materialId: e.target.value,
                          unit: selectedMaterial?.unit || 'pcs'
                        });
                      }}
                      className="w-full h-10 px-3 py-2 text-sm bg-white/80 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200"
                      required
                    >
                      <option value="">Select Material</option>
                      {materials.map(material => (
                        <option key={material.id} value={material.id}>
                          {material.name} ({material.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-300 shadow-sm">
                    <label className="text-xs font-semibold text-base-content/70 block mb-2 uppercase tracking-wider">
                      Quantity <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      className="w-full h-10 px-3 py-2 text-sm bg-white/80 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      required
                    />
                  </div>

                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-300 shadow-sm">
                    <label className="text-xs font-semibold text-base-content/70 block mb-2 uppercase tracking-wider">
                      Price per Unit <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.pricePerUnit}
                      onChange={(e) => setFormData({ ...formData, pricePerUnit: e.target.value })}
                      className="w-full h-10 px-3 py-2 text-sm bg-white/80 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      required
                    />
                  </div>

                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-300 shadow-sm">
                    <label className="text-xs font-semibold text-base-content/70 block mb-2 uppercase tracking-wider">
                      Supplier <span className="text-red-600">*</span>
                    </label>
                    <select
                      value={formData.supplier}
                      onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                      className="w-full h-10 px-3 py-2 text-sm bg-white/80 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200"
                      required
                    >
                      <option value="">Select Supplier</option>
                      {suppliers.map(supplier => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.company && supplier.company !== '-' ? `${supplier.company}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-300 shadow-sm">
                    <label className="text-xs font-semibold text-base-content/70 block mb-2 uppercase tracking-wider">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full h-10 px-3 py-2 text-sm bg-white/80 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="RECEIVED">Received</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>

                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-300 shadow-sm">
                    <label className="text-xs font-semibold text-base-content/70 block mb-2 uppercase tracking-wider">
                      Delivery Date
                    </label>
                    <input
                      type="date"
                      value={formData.deliveryDate}
                      onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                      className="w-full h-10 px-3 py-2 text-sm bg-white/80 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <div className="bg-blue-600 border border-blue-700 rounded-xl p-4 shadow-sm">
                      <p className="text-sm text-white leading-relaxed">
                        <strong>Note:</strong> Invoice number will be automatically generated when the purchase is created.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-300 shadow-sm">
                  <label className="text-xs font-semibold text-base-content/70 block mb-2 uppercase tracking-wider">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows="3"
                    className="w-full px-4 py-3 text-sm bg-white/80 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200 min-h-[100px]"
                  />
                </div>

                <div className="flex justify-end gap-4 pt-6 mt-6 border-t border-gray-300/50">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="px-6 py-2 h-10 text-sm bg-white/80 border border-gray-300 text-base-content/70 hover:text-base-content rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 h-10 text-sm bg-blue-600 text-white border border-blue-700 rounded-xl hover:bg-blue-700 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] font-semibold"
                  >
                    Create Purchase
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal - Similar to Create Modal */}
      {showEditModal && selectedPurchaseLog && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-white/95 via-white/90 to-white/95 backdrop-blur-xl rounded-3xl max-w-3xl w-full max-h-screen overflow-y-auto shadow-2xl border border-gray-300 hover:shadow-3xl transition-all duration-300">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl">
                    <FiEdit2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-bold text-base-content">Edit Purchase Log</h2>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-base-content/60 hover:text-base-content transition-colors p-2 rounded-xl hover:bg-gray-100/50 backdrop-blur-sm"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleUpdatePurchaseLog} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-300 shadow-sm">
                    <label className="text-xs font-semibold text-base-content/70 block mb-2 uppercase tracking-wider">
                      Purchase Date <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.purchaseDate}
                      onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                      className="w-full h-10 px-3 py-2 text-sm bg-white/80 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200"
                      required
                    />
                  </div>

                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-300 shadow-sm">
                    <label className="text-xs font-semibold text-base-content/70 block mb-2 uppercase tracking-wider">
                      Material <span className="text-red-600">*</span>
                    </label>
                    <select
                      value={formData.materialId}
                      onChange={(e) => {
                        const selectedMaterial = materials.find(m => m.id == e.target.value);
                        setFormData({
                          ...formData,
                          materialId: e.target.value,
                          unit: selectedMaterial?.unit || 'pcs'
                        });
                      }}
                      className="w-full h-10 px-3 py-2 text-sm bg-white/80 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200"
                      required
                    >
                      <option value="">Select Material</option>
                      {materials.map(material => (
                        <option key={material.id} value={material.id}>
                          {material.name} ({material.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-300 shadow-sm">
                    <label className="text-xs font-semibold text-base-content/70 block mb-2 uppercase tracking-wider">
                      Quantity <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      className="w-full h-10 px-3 py-2 text-sm bg-white/80 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      required
                    />
                  </div>

                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-300 shadow-sm">
                    <label className="text-xs font-semibold text-base-content/70 block mb-2 uppercase tracking-wider">
                      Price per Unit <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.pricePerUnit}
                      onChange={(e) => setFormData({ ...formData, pricePerUnit: e.target.value })}
                      className="w-full h-10 px-3 py-2 text-sm bg-white/80 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      required
                    />
                  </div>

                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-300 shadow-sm">
                    <label className="text-xs font-semibold text-base-content/70 block mb-2 uppercase tracking-wider">
                      Supplier <span className="text-red-600">*</span>
                    </label>
                    <select
                      value={formData.supplier}
                      onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                      className="w-full h-10 px-3 py-2 text-sm bg-white/80 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200"
                      required
                    >
                      <option value="">Select Supplier</option>
                      {suppliers.map(supplier => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name} {supplier.company && supplier.company !== '-' ? `(${supplier.company})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-300 shadow-sm">
                    <label className="text-xs font-semibold text-base-content/70 block mb-2 uppercase tracking-wider">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full h-10 px-3 py-2 text-sm bg-white/80 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="RECEIVED">Received</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>

                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-300 shadow-sm">
                    <label className="text-xs font-semibold text-base-content/70 block mb-2 uppercase tracking-wider">
                      Delivery Date
                    </label>
                    <input
                      type="date"
                      value={formData.deliveryDate}
                      onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                      className="w-full h-10 px-3 py-2 text-sm bg-white/80 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <div className="bg-blue-600 border border-blue-700 rounded-xl p-4 shadow-sm">
                      <p className="text-sm text-white leading-relaxed">
                        <strong>Note:</strong> Invoice number was auto-generated when this purchase was created. You can update it if needed.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-300 shadow-sm">
                  <label className="text-xs font-semibold text-base-content/70 block mb-2 uppercase tracking-wider">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows="3"
                    className="w-full px-4 py-3 text-sm bg-white/80 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200 min-h-[100px]"
                  />
                </div>

                <div className="flex justify-end gap-4 pt-6 mt-6 border-t border-gray-300/50">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      resetForm();
                    }}
                    className="px-6 py-2 h-10 text-sm bg-white/80 border border-gray-300 text-base-content/70 hover:text-base-content rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 h-10 text-sm bg-blue-600 text-white border border-blue-700 rounded-xl hover:bg-blue-700 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] font-semibold"
                  >
                    Update Purchase
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedPurchaseLog && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-white/95 via-white/90 to-white/95 backdrop-blur-xl rounded-3xl max-w-4xl w-full max-h-screen overflow-y-auto shadow-2xl border border-gray-300 hover:shadow-3xl transition-all duration-300">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl">
                    <FiPackage className="w-6 h-6 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-base-content">Purchase Log Details</h2>
                </div>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-base-content/60 hover:text-base-content transition-colors p-2 rounded-xl hover:bg-gray-100/50 backdrop-blur-sm"
                >
                  <FiX className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Purchase Information */}
                <div className="bg-white/40 backdrop-blur-sm rounded-xl p-6 border border-gray-300 shadow-sm">
                  <h3 className="text-lg font-bold text-base-content mb-4 uppercase tracking-wider flex items-center gap-2">
                    <FiCalendar className="w-5 h-5" />
                    Purchase Information
                  </h3>

                  <div className="space-y-4">
                    <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-gray-200">
                      <label className="text-xs font-semibold text-base-content/70 block mb-1 uppercase tracking-wider">Purchase Date</label>
                      <p className="text-base-content font-semibold">{new Date(selectedPurchaseLog.purchaseDate).toLocaleDateString()}</p>
                    </div>
                    <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-gray-200">
                      <label className="text-xs font-semibold text-base-content/70 block mb-1 uppercase tracking-wider">Material</label>
                      <p className="text-base-content font-semibold">{selectedPurchaseLog.material?.name || 'Unknown'}</p>
                      <p className="text-sm text-base-content/60 mt-1">Code: {selectedPurchaseLog.material?.code || 'N/A'}</p>
                    </div>
                    <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-gray-200">
                      <label className="text-xs font-semibold text-base-content/70 block mb-1 uppercase tracking-wider">Quantity</label>
                      <p className="text-base-content font-bold text-lg">{selectedPurchaseLog.quantity} {selectedPurchaseLog.unit}</p>
                    </div>
                    <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-gray-200">
                      <label className="text-xs font-semibold text-base-content/70 block mb-1 uppercase tracking-wider">Price per Unit</label>
                      <p className="text-base-content font-semibold">{formatCurrencyShort(selectedPurchaseLog.pricePerUnit || 0)}</p>
                    </div>
                    <div className="bg-green-50 backdrop-blur-sm rounded-lg p-4 border border-green-200 shadow-sm">
                      <label className="text-xs font-semibold text-green-700 block mb-1 uppercase tracking-wider">Total Amount</label>
                      <p className="text-green-700 font-bold text-xl">
                        {formatCurrencyShort(selectedPurchaseLog.totalCost || 0)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Supplier & Status Information */}
                <div className="bg-white/40 backdrop-blur-sm rounded-xl p-6 border border-gray-300 shadow-sm">
                  <h3 className="text-lg font-bold text-base-content mb-4 uppercase tracking-wider flex items-center gap-2">
                    <FiDollarSign className="w-5 h-5" />
                    Supplier & Status
                  </h3>

                  <div className="space-y-4">
                    <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-gray-200">
                      <label className="text-xs font-semibold text-base-content/70 block mb-1 uppercase tracking-wider">Supplier</label>
                      <p className="text-base-content font-semibold">{selectedPurchaseLog.supplier || 'No supplier specified'}</p>
                    </div>
                    <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-gray-200">
                      <label className="text-xs font-semibold text-base-content/70 block mb-2 uppercase tracking-wider">Status</label>
                      {getStatusBadge(selectedPurchaseLog.status)}
                    </div>
                    <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-gray-200">
                      <label className="text-xs font-semibold text-base-content/70 block mb-1 uppercase tracking-wider">Invoice Number</label>
                      <p className="text-base-content font-semibold">{selectedPurchaseLog.invoiceNumber || 'Auto-generated'}</p>
                    </div>
                    <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-gray-200">
                      <label className="text-xs font-semibold text-base-content/70 block mb-1 uppercase tracking-wider">Delivery Date</label>
                      <p className="text-base-content font-semibold">
                        {selectedPurchaseLog.deliveryDate
                          ? new Date(selectedPurchaseLog.deliveryDate).toLocaleDateString()
                          : 'Not specified'
                        }
                      </p>
                    </div>
                    {selectedPurchaseLog.receivedQuantity && (
                      <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-gray-200">
                        <label className="text-xs font-semibold text-base-content/70 block mb-1 uppercase tracking-wider">Received Quantity</label>
                        <p className="text-base-content font-semibold">{selectedPurchaseLog.receivedQuantity} {selectedPurchaseLog.unit}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedPurchaseLog.notes && (
                <div className="mt-6">
                  <div className="bg-white/40 backdrop-blur-sm rounded-xl p-6 border border-gray-300 shadow-sm">
                    <h3 className="text-lg font-bold text-base-content mb-4 uppercase tracking-wider flex items-center gap-2">
                      <FiEdit2 className="w-5 h-5" />
                      Notes
                    </h3>
                    <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-gray-200">
                      <p className="text-base-content leading-relaxed whitespace-pre-line">
                        {selectedPurchaseLog.notes}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div className="mt-6">
                <div className="bg-white/40 backdrop-blur-sm rounded-xl p-6 border border-gray-300 shadow-sm">
                  <h3 className="text-lg font-bold text-base-content mb-4 uppercase tracking-wider flex items-center gap-2">
                    <FiTrendingUp className="w-5 h-5" />
                    Timeline
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-gray-200">
                      <label className="text-xs font-semibold text-base-content/70 block mb-1 uppercase tracking-wider">Created</label>
                      <p className="text-base-content font-semibold">{new Date(selectedPurchaseLog.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-gray-200">
                      <label className="text-xs font-semibold text-base-content/70 block mb-1 uppercase tracking-wider">Updated</label>
                      <p className="text-base-content font-semibold">{new Date(selectedPurchaseLog.updatedAt).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-8">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-6 py-2 h-10 text-sm bg-gray-600 text-white border border-gray-300 rounded-xl hover:bg-gray-700 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && purchaseLogToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-white/95 via-white/90 to-white/95 backdrop-blur-xl rounded-3xl border border-gray-300 shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center mb-6">
                <div className="bg-gradient-to-br from-red-100 to-red-200 p-3 rounded-full">
                  <FiTrash2 className="w-8 h-8 text-red-600" />
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 text-center mb-4">
                Delete Purchase Log
              </h3>
              
              <div className="mb-6">
                <p className="text-gray-600 text-center mb-4">
                  Are you sure you want to delete this purchase log? This action cannot be undone.
                </p>
                
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="font-semibold text-red-800">{purchaseLogToDelete.material?.name || 'Purchase Log'}</span>
                  </div>
                  <p className="text-sm text-red-700 ml-6">
                    Quantity: {purchaseLogToDelete.quantity} {purchaseLogToDelete.unit}
                  </p>
                  <p className="text-sm text-red-700 ml-6">
                    Supplier: {purchaseLogToDelete.supplier}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  className="flex-1 px-4 py-2 bg-white/80 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-200 font-medium"
                  onClick={confirmDeletePurchaseLog}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
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

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-white/95 via-white/90 to-white/95 backdrop-blur-xl rounded-3xl border border-gray-300 shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center mb-6">
                <div className="bg-gradient-to-br from-red-100 to-red-200 p-3 rounded-full">
                  <FiX className="w-8 h-8 text-red-600" />
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 text-center mb-4">
                Error
              </h3>
              
              <div className="mb-6">
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-red-800 text-sm text-center">{errorMessage}</p>
                </div>
              </div>
              
              <div className="flex justify-center">
                <button
                  type="button"
                  className="px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-200 font-medium"
                  onClick={() => setShowErrorModal(false)}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Validation Error Modal */}
      {showValidationModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-white/95 via-white/90 to-white/95 backdrop-blur-xl rounded-3xl border border-gray-300 shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center mb-6">
                <div className="bg-gradient-to-br from-orange-100 to-orange-200 p-3 rounded-full">
                  <FiTrash2 className="w-8 h-8 text-orange-600" />
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 text-center mb-4">
                Validation Error
              </h3>
              
              <div className="mb-6">
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                  <p className="text-orange-800 text-sm text-center">{validationError}</p>
                </div>
              </div>
              
              <div className="flex justify-center">
                <button
                  type="button"
                  className="px-6 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-all duration-200 font-medium"
                  onClick={() => setShowValidationModal(false)}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PurchaseLogsPageWrapper() {
  return (
    <AuthWrapper>
      <DashboardLayout>
        <PurchaseLogsPage />
      </DashboardLayout>
    </AuthWrapper>
  );
} 