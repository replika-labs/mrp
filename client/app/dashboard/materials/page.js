'use client';

import AuthWrapper from '@/app/components/AuthWrapper';
import { formatCurrencyShort } from '@/utils/formatNominal';
import { useEffect, useState } from 'react';
import { FiAlertTriangle, FiEdit2, FiEye, FiPackage, FiPlus, FiRefreshCw, FiSearch, FiTrash2, FiTrendingUp, FiX } from 'react-icons/fi';
import Image from 'next/image';

function MaterialsManagementPage() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    lowStock: false,
    sortBy: 'name',
    sortOrder: 'ASC'
  });

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [validationError, setValidationError] = useState('');
  const [materialToDelete, setMaterialToDelete] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    unit: 'pcs',
    qtyOnHand: 0,
    minStock: 0,
    maxStock: 0,
    reorderPoint: 0,
    reorderQty: 0,
    location: '',
    attributeType: '',
    attributeValue: ''
  });

  // Load materials
  const loadMaterials = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: 20,
        _timestamp: Date.now(), // Cache busting parameter
        _bust: Math.random(), // Additional cache busting
        ...filters
      });

      const token = localStorage.getItem('token');

      // Try the API first
      try {
        const response = await fetch(`http://localhost:8080/api/materials-management?${queryParams}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();

          if (data.success) {
            // Handle API data properly
            const apiMaterials = data.data.materials || [];

            console.log('API materials loaded:', apiMaterials.length);
            // Add debugging for material IDs
            apiMaterials.forEach((material, index) => {
              if (!material.id) {
                console.warn(`Material at index ${index} has no ID:`, material);
              }
            });
            setMaterials(apiMaterials);
            setTotalPages(data.data.pagination?.totalPages || 1);
            setError(''); // Clear any previous errors
            setLastUpdated(new Date()); // Update timestamp
            return;
          } else {
            throw new Error(data.message || 'Failed to load materials');
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
        setMaterials([]);
        setTotalPages(1);
        return;
      }

      // Removed demo data fallback - show actual API errors instead

    } catch (error) {
      console.error('Error loading materials:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Test API call function for debugging
  const testMaterialDetailsAPI = async (materialId) => {
    console.log('=== Testing Material Details API ===');
    console.log('Material ID:', materialId);
    console.log('API URL:', `http://localhost:8080/api/materials-management/${materialId}`);

    const token = localStorage.getItem('token');
    console.log('Token exists:', !!token);
    console.log('Token value (first 20 chars):', token?.substring(0, 20) + '...');

    try {
      const response = await fetch(`http://localhost:8080/api/materials-management/${materialId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);
      console.log('Response OK:', response.ok);
      console.log('Response headers:', [...response.headers.entries()]);

      const responseText = await response.text();
      console.log('Raw response text:', responseText);

      try {
        const data = JSON.parse(responseText);
        console.log('Parsed response data:', data);
        return data;
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        return { error: 'Invalid JSON response', rawResponse: responseText };
      }
    } catch (fetchError) {
      console.error('Fetch error:', fetchError);
      return { error: 'Network/fetch error', details: fetchError.message };
    }
  };

  // Load material details for view/edit
  const loadMaterialDetails = async (materialId) => {
    console.log('Loading material details for ID:', materialId);

    if (!materialId) {
      console.error('Material ID is missing or invalid:', materialId);
      setValidationError('Material ID not found');
      setShowValidationModal(true);
      return null;
    }

    try {
      const token = localStorage.getItem('token');

      if (!token) {
        console.error('No authentication token found');
        setValidationError('Authentication required. Please login again.');
        setShowValidationModal(true);
        return null;
      }

      console.log('Making API request to:', `http://localhost:8080/api/materials-management/${materialId}`);

      const response = await fetch(`http://localhost:8080/api/materials-management/${materialId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('API response status:', response.status);
      console.log('API response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);

        if (response.status === 401) {
          throw new Error('Authentication required. Please login again.');
        } else if (response.status === 404) {
          throw new Error('Material not found');
        } else {
          throw new Error(`Server error: ${response.status} ${response.statusText}. Response: ${errorText}`);
        }
      }

      const data = await response.json();
      console.log('API response data:', data);

      if (data.success) {
        console.log('Material details loaded successfully:', data.data);
        return data.data;
      } else {
        console.error('API returned success: false with message:', data.message);
        throw new Error(data.message || 'Failed to load material details');
      }
    } catch (error) {
      console.error('Error loading material details:', error);

      // More specific error handling
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setError('Network error: Unable to connect to server. Please check if the backend is running.');
        setValidationError('Network error: Unable to connect to server. Please check if the backend is running.');
        setShowValidationModal(true);
      } else if (error.message.includes('SyntaxError') || error.message.includes('JSON')) {
        setError('Server response error: Invalid JSON response from server.');
        setValidationError('Server response error: Invalid JSON response from server.');
        setShowValidationModal(true);
      } else {
        setError(error.message);
        setValidationError(`Error loading material details: ${error.message}`);
        setShowValidationModal(true);
      }

      return null;
    }
  };
  // Create material
  const handleCreateMaterial = async (e) => {
    e.preventDefault();
    console.log('Creating material with data:', formData);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required. Please login again.');
      }

      // Data validation
      if (!formData.name?.trim()) {
        throw new Error('Material name is required');
      }
      if (!formData.unit?.trim()) {
        throw new Error('Unit is required');
      }
      if (formData.qtyOnHand < 0) {
        throw new Error('Current stock cannot be negative');
      }
      if (formData.minStock < 0) {
        throw new Error('Minimum stock cannot be negative');
      }
      if (formData.maxStock < formData.minStock) {
        throw new Error('Maximum stock must be greater than minimum stock');
      }

      const response = await fetch('http://localhost:8080/api/materials-management', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          qtyOnHand: Number(formData.qtyOnHand),
          minStock: Number(formData.minStock),
          maxStock: Number(formData.maxStock),
          reorderPoint: Number(formData.reorderPoint),
          reorderQty: Number(formData.reorderQty)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Server error: ${response.status}`);
      }

      if (!data.success) {
        throw new Error(data.message || 'Failed to create material');
      }

      // Success handling
      handleCloseModal();
      loadMaterials();
      setSuccessMessage('Material created successfully!');
      setShowSuccessModal(true);
      
      // Auto-close success modal after 3 seconds
      setTimeout(() => {
        setShowSuccessModal(false);
      }, 3000);

    } catch (error) {
      console.error('Error creating material:', error);
      setValidationError(error.message);
      setShowValidationModal(true);
    }
  };

  // Update material
  const handleUpdateMaterial = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!formData.name) {
      setValidationError('Please fill in required fields: Name');
      setShowValidationModal(true);
      return;
    }

    if (!selectedMaterial) {
      setValidationError('No material selected for update');
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

      const materialId = selectedMaterial.id || selectedMaterial.material?.id;

      if (!materialId) {
        setValidationError('Material ID not found');
        setShowValidationModal(true);
        return;
      }

      const response = await fetch(`http://localhost:8080/api/materials-management/${materialId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please login again.');
        } else if (response.status === 400) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Invalid data provided');
        } else if (response.status === 404) {
          throw new Error('Material not found');
        } else {
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
      }

      const data = await response.json();

      if (data.success) {
        setSuccessMessage('Material updated successfully!');
        setShowSuccessModal(true);
        setShowEditModal(false);
        resetForm();
        setSelectedMaterial(null);
        loadMaterials();
        
        // Auto-close success modal after 3 seconds
        setTimeout(() => {
          setShowSuccessModal(false);
        }, 3000);
      } else {
        throw new Error(data.message || 'Failed to update material');
      }
    } catch (error) {
      console.error('Error updating material:', error);
      setValidationError(error.message);
      setShowValidationModal(true);
    }
  };

  // Delete material
  const handleDeleteMaterial = (materialId) => {
    if (!materialId) {
      setDeleteError('Material ID not found');
      setShowErrorModal(true);
      return;
    }

    const material = materials.find(m => m.id === materialId);
    setMaterialToDelete(material);
    setShowDeleteModal(true);
  };

  const confirmDeleteMaterial = async () => {
    if (!materialToDelete) return;

    try {
      const token = localStorage.getItem('token');

      if (!token) {
        setDeleteError('Authentication required. Please login again.');
        setShowErrorModal(true);
        return;
      }

      const response = await fetch(`http://localhost:8080/api/materials-management/${materialToDelete.id}`, {
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
      // This handles cases where server returns error status but operation actually succeeded
      const isSuccess = (
        (response.ok && data.success) ||
        (data.success === true) ||
        (data.message && data.message.toLowerCase().includes('deleted successfully')) ||
        (data.message && data.message.toLowerCase().includes('material deleted successfully')) ||
        (response.status === 200 && data.message)
      );

      if (isSuccess) {
        // Clear all modals first to prevent conflicts
        clearAllModals();
        
        // Clear all error states
        setDeleteError('');
        setValidationError('');
        setError('');
        
        // Set success state
        const materialName = materialToDelete.name;
        setMaterialToDelete(null);
        setSuccessMessage(`Material "${materialName}" has been successfully deleted.`);
        setShowSuccessModal(true);
        loadMaterials();
        
        // Auto-close success modal after 3 seconds
        setTimeout(() => {
          setShowSuccessModal(false);
        }, 3000);
      } else {
        // Clear all modals first to prevent conflicts
        clearAllModals();
        
        // Handle different error cases
        if (response.status === 401) {
          setDeleteError('Authentication required. Please login again.');
        } else if (response.status === 404) {
          setDeleteError('Material not found');
        } else if (response.status === 400 && data.message) {
          setDeleteError(data.message);
        } else {
          setDeleteError(data.message || `Server error: ${response.status} ${response.statusText}`);
        }
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Network/Exception error deleting material:', error);
      // Clear all modals first to prevent conflicts
      clearAllModals();
      
      setDeleteError(`Network error: ${error.message}`);
      setShowErrorModal(true);
    }
  };

  // View material details
  const handleViewMaterial = async (materialId) => {
    const details = await loadMaterialDetails(materialId);
    if (details) {
      setSelectedMaterial(details);
      setShowViewModal(true);
    } else {
      // Fallback: use data from the materials list
      const fallbackMaterial = materials.find(m => m.id === materialId);
      if (fallbackMaterial) {
        console.log('Using fallback material data:', fallbackMaterial);
        setSelectedMaterial(fallbackMaterial);
        setShowViewModal(true);
      } else {
        console.error('Material not found in local data either');
        setValidationError('Material not found. Please refresh the page and try again.');
        setShowValidationModal(true);
      }
    }
  };

  // Edit material
  const handleEditMaterial = async (materialId) => {
    const details = await loadMaterialDetails(materialId);
    if (details) {
      setSelectedMaterial(details);
      setFormData({
        name: details.name || '',
        description: details.description || '',
        unit: details.unit || 'pcs',
        qtyOnHand: details.qtyOnHand || 0,
        minStock: details.minStock || 0,
        maxStock: 10000,
        reorderPoint: details.reorderPoint || 0,
        reorderQty: details.reorderQty || 0,
        location: details.location || '',
        attributeType: details.attributeType || '',
        attributeValue: details.attributeValue || ''
      });
      setShowEditModal(true);
    } else {
      // Fallback: use data from the materials list
      const fallbackMaterial = materials.find(m => m.id === materialId);
      if (fallbackMaterial) {
        console.log('Using fallback material data for edit:', fallbackMaterial);
        setSelectedMaterial(fallbackMaterial);
        setFormData({
          name: fallbackMaterial.name || '',
          description: fallbackMaterial.description || '',
          unit: fallbackMaterial.unit || 'pcs',
          qtyOnHand: fallbackMaterial.qtyOnHand || 0,
          minStock: fallbackMaterial.minStock || 0,
          maxStock: fallbackMaterial.maxStock || 0,
          reorderPoint: fallbackMaterial.reorderPoint || 0,
          reorderQty: fallbackMaterial.reorderQty || 0,
          location: fallbackMaterial.location || '',
          attributeType: fallbackMaterial.attributeType || '',
          attributeValue: fallbackMaterial.attributeValue || ''
        });
        setShowEditModal(true);
      } else {
        console.error('Material not found in local data either');
        setValidationError('Material not found. Please refresh the page and try again.');
        setShowValidationModal(true);
      }
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      unit: 'pcs',
      qtyOnHand: 0,
      minStock: 0,
      maxStock: 0,
      reorderPoint: 0,
      reorderQty: 0,
      location: '',
      attributeType: '',
      attributeValue: ''
    });
  };
  // Get stock status badge
  const getStockStatusBadge = (material) => {
    const currentStock = material.qtyOnHand || 0;
    const minStock = material.minStock || 0;
    const maxStock = material.maxStock || minStock * 2;
    const stockPercent = minStock > 0 ? (currentStock / minStock) * 100 : currentStock > 0 ? 100 : 0;

    if (currentStock === 0) {
      return (
        <div className="flex flex-col gap-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-red-100 border border-red-200">
            <FiAlertTriangle className="w-4 h-4 text-red-600" />
            <span className="text-xs font-medium text-red-700">Out of Stock</span>
          </div>
        </div>
      );
    } else if (currentStock <= minStock) {
      return (
        <div className="flex flex-col gap-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-yellow-100 border border-yellow-200">
            <FiAlertTriangle className="w-4 h-4 text-yellow-600" />
            <span className="text-xs font-medium text-yellow-700">
              Low Stock
            </span>
          </div>
        </div>
      );
    } else {
      // Calculate percentage relative to max stock for adequate status
      const adequatePercent = maxStock > 0 ? (currentStock / maxStock) * 100 : 100;
      return (
        <div className="flex flex-col gap-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-green-100 border border-green-200">
            <FiPackage className="w-4 h-4 text-green-600" />
            <span className="text-xs font-medium text-green-700">
              Adequate
            </span>
          </div>
        </div>
      );
    }
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

  // Manual refresh function
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMaterials();
    setRefreshing(false);
  };

  // Auto-refresh every 10 seconds when page is active
  useEffect(() => {
    const interval = setInterval(() => {
      if (!document.hidden) {
        console.log('🔄 Auto-refreshing materials...');
        loadMaterials();
      }
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [currentPage, filters]);

  useEffect(() => {
    loadMaterials();
  }, [currentPage, filters]);

  // Clear all modal states to prevent conflicts
  const clearAllModals = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowViewModal(false);
    setShowDeleteModal(false);
    setShowErrorModal(false);
    setShowSuccessModal(false);
    setShowValidationModal(false);
  };

  // Handle modal close
  const handleCloseModal = () => {
    clearAllModals();
    setSelectedMaterial(null);
    setMaterialToDelete(null);
    setDeleteError('');
    setValidationError('');
    setSuccessMessage('');
    resetForm();
  };

  // Add material click handler
  const handleAddMaterialClick = () => {
    resetForm();
    setShowCreateModal(true);
  };

  if (loading && materials.length === 0) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="text-base-content/70">Loading materials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">Fabric Inventory</h1>
            <p className="mt-1 text-gray-600">Track and manage your fabric stock with detailed attributes and automated updates.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 shadow-sm"
            >
              <FiRefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 shadow-sm"
            >
              <FiPlus className="w-4 h-4 mr-2" />
              Add Material
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-300 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FiPackage className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-sm text-gray-600">Total Fabrics</div>
                <div className="text-xl font-semibold mt-0.5">{materials.length}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-300 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-error/10">
                <FiAlertTriangle className="w-5 h-5 text-error" />
              </div>
              <div>
                <div className="text-sm text-gray-600">Low Stock</div>
                <div className="text-xl font-semibold mt-0.5">
                  {materials.filter(m => m.qtyOnHand <= m.minStock).length}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-300 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <FiTrendingUp className="w-5 h-5 text-success" />
              </div>
              <div>
                <div className="text-sm text-gray-600">Total Value</div>
                <div className="text-xl font-semibold mt-0.5">
                  Rp {formatCurrencyShort(materials.reduce((sum, m) => sum + (m.totalValue || 0), 0))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-300 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary/10">
                <FiPackage className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <div className="text-sm text-gray-600">Categories</div>
                <div className="text-xl font-semibold mt-0.5">
                  {new Set(materials.map(m => m.attributeType).filter(Boolean)).size}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-300 rounded-xl p-4 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.01] hover:-translate-y-1">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-3">
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Search</label>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Search fabrics..."
                className="w-full h-10 pl-9 pr-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="col-span-3">
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Attribute Type</label>
            <input
              type="text"
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              placeholder="Filter by attribute type..."
              className="w-full h-10 px-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>

          <div className="col-span-4">
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Sort By</label>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="w-full h-10 px-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="name">Name</option>
              <option value="code">Code</option>
              <option value="qtyOnHand">Stock</option>
              <option value="minStock">Min Stock</option>
              <option value="pricePerUnit">Price</option>
              <option value="createdAt">Created Date</option>
            </select>
          </div>

          <div className="col-span-2 flex items-end">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={filters.lowStock}
                onChange={(e) => handleFilterChange('lowStock', e.target.checked)}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="ml-2 text-sm text-gray-700">Low Stock Only</span>
            </label>
          </div>
        </div>
      </div>

      {/* Info Note */}
      <div className="flex items-center bg-sky-50 border border-sky-200 text-sky-700 rounded-lg px-4 py-3 text-sm">
        <FiPackage className="w-5 h-5 mr-2 flex-shrink-0" />
        <div className="flex justify-between items-center w-full">
          <span>
            <strong>Note:</strong> Stock levels are automatically updated when purchases are marked as &quot;RECEIVED&quot;.
            Page auto-refreshes every 10 seconds.
          </span>
          <span className="text-xs opacity-70">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Materials Table */}
      <div className="bg-white border border-gray-300 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.01] hover:-translate-y-1">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-300 bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fabrics Info</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inventory</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {materials.map((material, index) => (
                <tr key={material.id || `material-${index}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {material.image && (
                        <div className="flex-shrink-0 h-10 w-10">
                          <Image
                            src={material.image}
                            alt={material.name}
                            width={40}
                            height={40}
                            className="rounded-lg object-cover"
                          />
                        </div>
                      )}
                      <div className={material.image ? "ml-4" : ""}>
                        <div className="text-sm font-medium text-gray-900">
                          {material.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          Code: {material.code || 'N/A'} • {material.attributeType || 'No category'}: {material.attributeValue || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      {getStockStatusBadge(material)}
                      {material.qtyOnHand <= material.minStock && (
                        <div className="flex items-center text-error text-xs mt-2 ml-2">
                          <FiAlertTriangle className="w-3 h-3 mr-1" />
                          Needs Restock
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1.5">
                      <div className="text-sm font-medium text-gray-900">
                        Current: {material.qtyOnHand || 0} {material.unit}
                      </div>
                      <div className="text-sm text-gray-500">
                        Min Stock: {material.minStock || 0} {material.unit}
                      </div>
                      <div className="text-xs text-gray-400 flex items-center gap-1">
                        <span>Supplier: {material.supplier || 'N/A'}</span>
                        <span>•</span>
                        <span>Location: {material.location || 'N/A'}</span>
                      </div>
                      {material.latestPurchase && (
                        <div className="text-xs text-primary">
                          Last purchase: {new Date(material.latestPurchase.date).toLocaleDateString()}
                          from {material.latestPurchase.supplier}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1.5">
                      <div className="text-sm font-medium text-gray-900">
                        Avg Price: {formatCurrencyShort(material.avgPrice || 0)}
                      </div>
                      <div className="text-sm text-gray-500">
                        Reorder: {material.reorderPoint || 0} / {material.reorderQty || 0}
                      </div>
                      <div className="text-xs text-gray-400">
                        Value: {formatCurrencyShort(material.totalValue || 0)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <div className="flex justify-end items-center gap-2">
                      <button
                        onClick={() => handleViewMaterial(material.id)}
                        className="p-1 text-black hover:text-gray-700 rounded-lg hover:bg-gray-100"
                      >
                        <FiEye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditMaterial(material.id)}
                        className="p-1 text-black hover:text-gray-700 rounded-lg hover:bg-gray-100"
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteMaterial(material.id)}
                        className="p-1 text-black hover:text-gray-700 rounded-lg hover:bg-gray-100"
                      >
                        <FiTrash2 className="w-4 h-4" />
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
        <div className="flex justify-center mt-4">
          <div className="join">
            <button
              className="join-item btn btn-sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              «
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                className={`join-item btn btn-sm ${currentPage === page ? 'btn-active' : ''}`}
                onClick={() => handlePageChange(page)}
              >
                {page}
              </button>
            ))}
            <button
              className="join-item btn btn-sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              »
            </button>
          </div>
        </div>
      )}      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/20 backdrop-blur-sm">
          <div className="flex min-h-screen items-center justify-center p-4 md:p-6">
            <div className="relative w-full max-w-2xl bg-gradient-to-br from-white/95 via-white/90 to-white/95 backdrop-blur-xl rounded-3xl shadow-2xl transform transition-all border border-gray-300 hover:shadow-3xl">
              <div className="px-8 py-6 border-b border-gray-300 rounded-t-3xl bg-gradient-to-r from-primary/5 via-transparent to-secondary/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl">
                      <FiPackage className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-base-content">
                      {showCreateModal ? 'Add New Material' : 'Edit Material'}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="text-base-content/60 hover:text-base-content transition-colors p-2 rounded-xl hover:bg-gray-100/50 backdrop-blur-sm"
                  >
                    <FiX className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <form onSubmit={showCreateModal ? handleCreateMaterial : handleUpdateMaterial} className="p-8">
                <div className="space-y-6">
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-300 shadow-sm">
                    <label className="text-xs font-semibold text-base-content/70 block mb-2 uppercase tracking-wider">Name <span className="text-red-600">*</span></label> 
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full h-10 px-4 text-sm bg-white/80 border border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all duration-200"
                      placeholder="Enter material name"
                      required
                    />
                  </div>

                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-300 shadow-sm">
                    <label className="text-xs font-semibold text-base-content/70 block mb-2 uppercase tracking-wider">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-3 text-sm bg-white/80 border border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all duration-200 min-h-[100px]"
                      placeholder="Enter material description"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-300 shadow-sm">
                      <label className="text-xs font-semibold text-base-content/70 block mb-2 uppercase tracking-wider">Unit</label>
                      <input
                        type="text"
                        value={formData.unit}
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                        className="w-full h-10 px-4 text-sm bg-white/80 border border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all duration-200"
                        placeholder="pcs, kg, m, etc."
                        required
                      />
                    </div>

                    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-300 shadow-sm">
                      <label className="text-xs font-semibold text-base-content/70 block mb-2 uppercase tracking-wider">Current Stock</label>
                      <input
                        type="number"
                        value={formData.qtyOnHand}
                        onChange={(e) => setFormData({ ...formData, qtyOnHand: parseInt(e.target.value) || 0 })}
                        className="w-full h-10 px-4 text-sm bg-white/80 border border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all duration-200"
                        min="0"
                        placeholder="0"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-300 shadow-sm">
                      <label className="text-xs font-semibold text-base-content/70 block mb-2 uppercase tracking-wider">Min Stock</label>
                      <input
                        type="number"
                        value={formData.minStock}
                        onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) || 0 })}
                        className="w-full h-10 px-4 text-sm bg-white/80 border border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all duration-200"
                        min="0"
                        placeholder="0"
                        required
                      />
                    </div>

                    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-300 shadow-sm">
                      <label className="text-xs font-semibold text-base-content/70 block mb-2 uppercase tracking-wider">Max Stock</label>
                      <input
                        type="number"
                        value={formData.maxStock}
                        onChange={(e) => setFormData({ ...formData, maxStock: parseInt(e.target.value) || 0 })}
                        className="w-full h-10 px-4 text-sm bg-white/80 border border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all duration-200"
                        min="0"
                        placeholder="0"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-300 shadow-sm">
                      <label className="text-xs font-semibold text-base-content/70 block mb-2 uppercase tracking-wider">Location</label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="w-full h-10 px-4 text-sm bg-white/80 border border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all duration-200"
                        placeholder="e.g., Warehouse A, Shelf B3"
                      />
                    </div>

                    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-300 shadow-sm">
                      <label className="text-xs font-semibold text-base-content/70 block mb-2 uppercase tracking-wider">Attribute Type</label>
                      <input
                        type="text"
                        value={formData.attributeType}
                        onChange={(e) => setFormData({ ...formData, attributeType: e.target.value })}
                        className="w-full h-10 px-4 text-sm bg-white/80 border border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all duration-200"
                        placeholder="e.g., Category, Material Type"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-4 pt-6 mt-6 border-t border-gray-300/50">
                  <button
                    type="button"
                    className="px-6 py-2 h-10 text-sm bg-white/80 border border-gray-300 text-base-content/70 hover:text-base-content rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
                    onClick={handleCloseModal}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 h-10 text-sm bg-primary text-primary-content border border-gray-300 rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-[1.02] font-semibold"
                  >
                    {showCreateModal ? 'Create Material' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedMaterial && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/20 backdrop-blur-sm">
          <div className="flex min-h-screen items-center justify-center p-4 md:p-6">
            <div className="relative w-full max-w-2xl bg-gradient-to-br from-white/95 via-white/90 to-white/95 backdrop-blur-xl rounded-3xl shadow-2xl transform transition-all border border-gray-300 hover:shadow-3xl">
              <div className="px-8 py-6 border-b border-gray-300 rounded-t-3xl bg-gradient-to-r from-info/5 via-transparent to-primary/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-info/20 to-primary/20 rounded-xl">
                      <FiEye className="w-5 h-5 text-info" />
                    </div>
                    <h3 className="text-xl font-bold text-base-content">{selectedMaterial.name}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowViewModal(false);
                      setSelectedMaterial(null);
                    }}
                    className="text-base-content/60 hover:text-base-content transition-colors p-2 rounded-xl hover:bg-gray-100/50 backdrop-blur-sm"
                  >
                    <FiX className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="p-8">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-300 shadow-sm">
                      <label className="text-xs font-semibold text-base-content/70 block mb-2 uppercase tracking-wider">Code</label>
                      <p className="text-base-content font-medium">{selectedMaterial.code || 'N/A'}</p>
                    </div>
                    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-300 shadow-sm">
                      <label className="text-xs font-semibold text-base-content/70 block mb-2 uppercase tracking-wider">Category</label>
                      <p className="text-base-content font-medium">{selectedMaterial.attributeType || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-300 shadow-sm">
                    <label className="text-xs font-semibold text-base-content/70 block mb-2 uppercase tracking-wider">Description</label>
                    <p className="text-base-content whitespace-pre-line leading-relaxed">{selectedMaterial.description || 'No description available.'}</p>
                  </div>

                  <div className="bg-white/40 backdrop-blur-sm rounded-xl p-6 border border-gray-300 shadow-sm">
                    <h4 className="text-sm font-bold text-base-content mb-4 uppercase tracking-wider flex items-center gap-2">
                      <FiTrendingUp className="w-4 h-4" />
                      Stock Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-gray-200">
                        <label className="text-xs font-semibold text-base-content/70 block mb-1 uppercase tracking-wider">Current Stock</label>
                        <p className="text-base-content font-bold text-lg">{selectedMaterial.qtyOnHand || 0} {selectedMaterial.unit}</p>
                      </div>
                      <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-gray-200">
                        <label className="text-xs font-semibold text-base-content/70 block mb-1 uppercase tracking-wider">Min Stock</label>
                        <p className="text-base-content font-bold text-lg">{selectedMaterial.minStock || 0} {selectedMaterial.unit}</p>
                      </div>
                      <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-gray-200">
                        <label className="text-xs font-semibold text-base-content/70 block mb-1 uppercase tracking-wider">Location</label>
                        <p className="text-base-content font-medium">{selectedMaterial.location || 'N/A'}</p>
                      </div>
                      <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-gray-200">
                        <label className="text-xs font-semibold text-base-content/70 block mb-1 uppercase tracking-wider">Status</label>
                        <div className="mt-1">{getStockStatusBadge(selectedMaterial)}</div>
                      </div>
                    </div>
                  </div>

                  {selectedMaterial.latestPurchase && (
                    <div className="bg-white/40 backdrop-blur-sm rounded-xl p-6 border border-gray-300 shadow-sm">
                      <h4 className="text-sm font-bold text-base-content mb-4 uppercase tracking-wider flex items-center gap-2">
                        <FiPackage className="w-4 h-4" />
                        Latest Purchase
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-gray-200">
                          <label className="text-xs font-semibold text-base-content/70 block mb-1 uppercase tracking-wider">Date</label>
                          <p className="text-base-content font-medium">{new Date(selectedMaterial.latestPurchase.date).toLocaleDateString()}</p>
                        </div>
                        <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-gray-200">
                          <label className="text-xs font-semibold text-base-content/70 block mb-1 uppercase tracking-wider">Supplier</label>
                          <p className="text-base-content font-medium">{selectedMaterial.latestPurchase.supplier}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-4 pt-6 mt-6 border-t border-gray-300/50">
                  <button
                    type="button"
                    className="px-6 py-2 h-10 text-sm bg-white/80 border border-gray-300 text-base-content/70 hover:text-base-content rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
                    onClick={() => {
                      setShowViewModal(false);
                      setSelectedMaterial(null);
                    }}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    className="px-6 py-2 h-10 text-sm bg-primary text-primary-content border border-gray-300 rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-[1.02] font-semibold"
                    onClick={() => {
                      setShowViewModal(false);
                      handleEditMaterial(selectedMaterial.id);
                    }}
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && materialToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-white/95 via-white/90 to-white/95 backdrop-blur-xl rounded-3xl border border-gray-300 shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center mb-6">
                <div className="bg-gradient-to-br from-red-100 to-red-200 p-3 rounded-full">
                  <FiAlertTriangle className="w-8 h-8 text-red-600" />
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 text-center mb-4">
                Delete Material
              </h3>
              
              <div className="mb-6">
                <p className="text-gray-600 text-center mb-4">
                  Are you sure you want to delete this material? This action cannot be undone.
                </p>
                
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="font-semibold text-red-800">{materialToDelete.name}</span>
                  </div>
                  <p className="text-sm text-red-700 ml-6">
                    Current Stock: {materialToDelete.qtyOnHand} {materialToDelete.unit}
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
                  onClick={confirmDeleteMaterial}
                >
                  Delete
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
                Cannot Delete Material
              </h3>
              
                             <div className="mb-6">
                 <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                   <p className="text-red-800 text-sm font-medium mb-2">Why can&apos;t this material be deleted?</p>
                   <p className="text-red-700 text-sm">
                     {deleteError.includes('existing movements') ? 
                       'This material has transaction history (movements) in the system.' :
                       deleteError.includes('remaining material records') ?
                       'This material has associated records that must be removed first.' :
                       deleteError
                     }
                   </p>
                 </div>
                
                                 {(deleteError.includes('existing movements') || deleteError.includes('remaining material records')) && (
                   <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
                     <p className="text-blue-800 text-sm font-medium mb-2">💡 Suggestions to resolve this issue:</p>
                     <div className="text-blue-700 text-sm space-y-2">
                       <div className="flex items-start gap-2">
                         <span className="text-blue-600 font-bold">1.</span>
                         <span>Archive this material instead of deleting it to preserve data integrity</span>
                       </div>
                       <div className="flex items-start gap-2">
                         <span className="text-blue-600 font-bold">2.</span>
                         <span>Contact administrator to safely remove all movement history and associated records</span>
                       </div>
                       <div className="flex items-start gap-2">
                         <span className="text-blue-600 font-bold">3.</span>
                         <span>Manually clear all material movements from the system first, then try deleting again</span>
                       </div>
                     </div>
                   </div>
                 )}
              </div>
              
                             <div className="flex gap-3 justify-center">
                 <button
                   type="button"
                   className="px-4 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all duration-200 font-medium"
                   onClick={() => setShowErrorModal(false)}
                 >
                   OK
                 </button>
                 {(deleteError.includes('existing movements') || deleteError.includes('remaining material records')) && (
                   <button
                     type="button"
                     className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 font-medium"
                     onClick={() => {
                       setShowErrorModal(false);
                       // Navigate to material movements page
                       window.location.href = '/dashboard/material-movement';
                     }}
                   >
                     View Movements
                   </button>
                 )}
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

      {/* Validation Error Modal */}
      {showValidationModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-white/95 via-white/90 to-white/95 backdrop-blur-xl rounded-3xl border border-gray-300 shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center mb-6">
                <div className="bg-gradient-to-br from-orange-100 to-orange-200 p-3 rounded-full">
                  <FiAlertTriangle className="w-8 h-8 text-orange-600" />
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

export default function Page() {
  return (
    <AuthWrapper>
      <MaterialsManagementPage />
    </AuthWrapper>
  );
}