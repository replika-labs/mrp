'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/app/components/DashboardLayout';
import AuthWrapper from '@/app/components/AuthWrapper';
import { FiPackage, FiSearch, FiX, FiCheck, FiBarChart, FiArrowDown, FiArrowUp, FiRefreshCw } from 'react-icons/fi';

export default function MaterialMovementPage() {
  const router = useRouter();
  const [movements, setMovements] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Pagination state
  const [pagination, setPagination] = useState({
    current: 1,
    total: 0,
    pages: 0,
    limit: 10
  });

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingMovement, setEditingMovement] = useState(null);
  const [formData, setFormData] = useState({
    materialId: '',
    quantity: '',
    movementType: 'IN',
    notes: '',
    costPerUnit: '',
    movementDate: ''
  });

  // Filter state
  const [filter, setFilter] = useState({
    movementType: '',
    materialId: '',
    startDate: '',
    endDate: '',
    search: '',
    page: 1,
    limit: 10
  });

  // View state
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch material movements with pagination
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        // Build query params for filter
        const queryParams = new URLSearchParams();
        Object.keys(filter).forEach(key => {
          if (filter[key]) queryParams.append(key, filter[key]);
        });

        // Fetch movements with pagination
        const movementsResponse = await fetch(`/api/material-movements?${queryParams.toString()}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!movementsResponse.ok) {
          throw new Error('Failed to fetch material movements');
        }

        const movementsData = await movementsResponse.json();

        if (movementsData.success) {
          setMovements(movementsData.data.movements || []);
          setPagination(movementsData.data.pagination || {});
        } else {
          throw new Error(movementsData.message || 'Failed to fetch movements');
        }

        // Fetch materials for dropdown
        const materialsResponse = await fetch('/api/materials-management', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!materialsResponse.ok) {
          console.warn('Failed to fetch materials, using empty array');
          setMaterials([]);
        } else {
          const materialsData = await materialsResponse.json();

          if (materialsData.success && materialsData.data && Array.isArray(materialsData.data.materials)) {
            setMaterials(materialsData.data.materials);
          } else if (materialsData.success && Array.isArray(materialsData.data)) {
            setMaterials(materialsData.data);
          } else if (Array.isArray(materialsData)) {
            // Handle case where API returns array directly
            setMaterials(materialsData);
          } else {
            console.warn('Materials data is not in expected format:', materialsData);
            setMaterials([]);
          }
        }

        // Fetch analytics if tab is active
        if (showAnalytics) {
          const analyticsResponse = await fetch(`/api/material-movements/analytics?${queryParams.toString()}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (analyticsResponse.ok) {
            const analyticsData = await analyticsResponse.json();
            if (analyticsData.success) {
              setAnalytics(analyticsData.data);
            }
          }
        }

      } catch (err) {
        setError(err.message);
        setTimeout(() => setError(null), 3000);
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filter, showAnalytics]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type } = e.target;

    if (type === 'number') {
      setFormData({
        ...formData,
        [name]: value === '' ? '' : parseFloat(value) || 0
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter({
      ...filter,
      [name]: value,
      page: 1 // Reset to first page when filtering
    });
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    setFilter({
      ...filter,
      page: newPage
    });
  };

  // Reset filters
  const resetFilters = () => {
    setFilter({
      movementType: '',
      materialId: '',
      startDate: '',
      endDate: '',
      search: '',
      page: 1,
      limit: 10
    });
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      materialId: '',
      quantity: '',
      movementType: 'IN',
      notes: '',
      costPerUnit: '',
      movementDate: ''
    });
    setEditingMovement(null);
    setShowForm(false);
  };

  // Handle edit movement
  const handleEdit = (movement) => {
    if (movement.purchaseLogId) {
      setError('Cannot edit purchase-generated movements');
      setTimeout(() => setError(null), 3000);
      return;
    }

    setFormData({
      materialId: movement.materialId,
      quantity: movement.quantity,
      movementType: movement.movementType,
      notes: movement.notes || '',
      costPerUnit: movement.costPerUnit || '',
      movementDate: movement.movementDate ? new Date(movement.movementDate).toISOString().split('T')[0] : ''
    });
    setEditingMovement(movement);
    setShowForm(true);
  };

  // Handle delete movement
  const handleDelete = async (movement) => {
    if (movement.purchaseLogId) {
      setError('Cannot delete purchase-generated movements');
      setTimeout(() => setError(null), 3000);
      return;
    }

    if (!confirm('Are you sure you want to delete this movement?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/material-movements/${movement.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete movement');
      }

      const result = await response.json();
      if (result.success) {
        setSuccess('Movement deleted successfully');
        setTimeout(() => setSuccess(null), 3000);
        // Refresh data
        setFilter({ ...filter });
      } else {
        throw new Error(result.message || 'Failed to delete movement');
      }

    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(null), 3000);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);
      setError(null);
      setSuccess(null);

      // Validate form data
      if (!formData.materialId || !formData.quantity || !formData.movementType) {
        throw new Error('Material, quantity, and movement type are required');
      }

      if (formData.quantity <= 0) {
        throw new Error('Quantity must be greater than 0');
      }

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Prepare submission data
      const submitData = {
        materialId: parseInt(formData.materialId),
        quantity: parseFloat(formData.quantity),
        movementType: formData.movementType,
        notes: formData.notes,
        costPerUnit: formData.costPerUnit ? parseFloat(formData.costPerUnit) : null,
        movementDate: formData.movementDate ? formData.movementDate : null
      };

      // Submit form data
      const url = editingMovement
        ? `/api/material-movements/${editingMovement.id}`
        : '/api/material-movements';
      const method = editingMovement ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || `Failed to ${editingMovement ? 'update' : 'create'} movement`);
      }

      // Reset form and fetch updated data
      resetForm();
      setSuccess(`Movement ${editingMovement ? 'updated' : 'created'} successfully`);
      setTimeout(() => setSuccess(null), 3000);

      // Refresh data
      setTimeout(() => {
        setFilter({ ...filter });
      }, 500);

    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(null), 3000);
      console.error('Error submitting movement:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  // Get movement type badge
  const getMovementTypeBadge = (movementType) => {
    const badges = {
      IN: 'bg-green-600 text-white',
      OUT: 'bg-red-600 text-white',
      // ADJUST: 'bg-yellow-600 text-white'
    };

    return badges[movementType] || 'bg-gray-600 text-white';
  };

  return (
    <AuthWrapper>
      <DashboardLayout>
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 backdrop-blur-xl rounded-3xl p-8 border border-gray-300 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.01] hover:-translate-y-1">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl flex-shrink-0">
                <FiPackage className="w-8 h-8 text-primary" />
              </div>
              <div className="flex flex-col justify-start -mt-1">
                <h1 className="text-2xl font-bold text-base-content bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent leading-tight">
                  Material Movement
                </h1>
                <p className="text-sm text-base-content/60 leading-tight -mt-5">Monitor inbound and outbound fabric movement with purchase integration</p>
              </div>
            </div>
            {/* <div className="flex space-x-3">
              <button
                onClick={() => setShowAnalytics(!showAnalytics)}
                className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium ${showAnalytics
                  ? 'text-blue-700 bg-blue-100 hover:bg-blue-200'
                  : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
                  }`}
              >
                📊 Analytics
              </button>
              <button
                onClick={() => setShowForm(!showForm)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {showForm ? 'Cancel' : '+ Add Movement'}
              </button>
            </div> */}
          </div>

          {/* Error and Success Messages */}
          {error && (
            <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-300 rounded-3xl p-4 shadow-lg backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-red-200 rounded-xl">
                    <FiX className="w-5 h-5 text-red-600" />
                  </div>
                  <span className="text-red-800 font-medium">{error}</span>
                </div>
              <button
                onClick={() => setError(null)}
                  className="text-red-600 hover:text-red-800 transition-colors duration-200"
              >
                <span className="sr-only">Dismiss</span>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
              </button>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-300 rounded-3xl p-4 shadow-lg backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-green-200 rounded-xl">
                    <FiCheck className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="text-green-800 font-medium">{success}</span>
                </div>
              <button
                onClick={() => setSuccess(null)}
                  className="text-green-600 hover:text-green-800 transition-colors duration-200"
              >
                <span className="sr-only">Dismiss</span>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
              </button>
              </div>
            </div>
          )}

          {/* Analytics Panel */}
          {showAnalytics && analytics && (
            <div className="bg-white shadow sm:rounded-lg mb-6">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Flow Analytics
                </h3>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="bg-white border border-gray-200 overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
                            <FiBarChart className="w-4 h-4 text-white" />
                          </div>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-600 truncate">
                              Total Flows
                            </dt>
                            <dd className="text-lg font-bold text-gray-900">
                              {analytics.totalMovements || 0}
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>

                  {analytics.movementsByType && analytics.movementsByType.map((typeData, index) => (
                    <div key={index} className="bg-white border border-gray-200 overflow-hidden shadow rounded-lg">
                      <div className="p-5">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className={`w-8 h-8 rounded-md flex items-center justify-center ${typeData.movementType === 'IN' ? 'bg-green-600' :
                              typeData.movementType === 'OUT' ? 'bg-red-600' : 'bg-gray-600'
                              }`}>
                              {typeData.movementType === 'IN' ? (
                                <FiArrowDown className="w-4 h-4 text-white" />
                              ) : typeData.movementType === 'OUT' ? (
                                <FiArrowUp className="w-4 h-4 text-white" />
                              ) : (
                                <FiRefreshCw className="w-4 h-4 text-white" />
                              )}
                            </div>
                          </div>
                          <div className="ml-5 w-0 flex-1">
                            <dl>
                              <dt className="text-sm font-medium text-gray-600 truncate">
                                {typeData.movementType} Movements
                              </dt>
                              <dd className="text-lg font-bold text-gray-900">
                                {typeData._count.id || 0}
                              </dd>
                            </dl>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}


          {/* Filters */}
          <div className="bg-gradient-to-br from-secondary/5 via-transparent to-primary/5 backdrop-blur-xl rounded-3xl p-8 border border-gray-300 shadow-xl hover:shadow-2xl transition-all duration-500">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-secondary/20 to-primary/20 rounded-xl">
                <FiSearch className="w-5 h-5 text-info" />
              </div>
              <h3 className="text-lg font-semibold text-base-content">Filters</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
                {/* Movement Type Filter */}
              <div className="bg-gray-100 backdrop-blur-sm rounded-xl p-3 border border-gray-300 shadow-sm hover:shadow-md transition-all duration-300">
                <label htmlFor="typeFilter" className="block text-xs font-medium text-base-content/70 mb-2 truncate">
                    Type
                  </label>
                  <select
                    id="typeFilter"
                    name="movementType"
                    value={filter.movementType}
                    onChange={handleFilterChange}
                  className="w-full h-8 px-3 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-gray-50 transition-all duration-200"
                  >
                    <option value="">All Types</option>
                    <option value="IN">IN</option>
                    <option value="OUT">OUT</option>
                    {/* <option value="ADJUST">ADJUST</option> */}
                  </select>
                </div>

                {/* Material Filter */}
              <div className="md:col-span-2 bg-gray-100 backdrop-blur-sm rounded-xl p-3 border border-gray-300 shadow-sm hover:shadow-md transition-all duration-300">
                <label htmlFor="materialFilter" className="block text-xs font-medium text-base-content/70 mb-2 truncate">
                    Material
                  </label>
                  <select
                    id="materialFilter"
                    name="materialId"
                    value={filter.materialId}
                    onChange={handleFilterChange}
                  className="w-full h-8 px-3 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-gray-50 transition-all duration-200"
                  >
                    <option value="">All Materials</option>
                    {Array.isArray(materials) && materials.map((material) => (
                      <option key={material.id} value={material.id}>
                        {material.name} ({material.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date From */}
              <div className="bg-gray-100 backdrop-blur-sm rounded-xl p-3 border border-gray-300 shadow-sm hover:shadow-md transition-all duration-300">
                <label htmlFor="startDate" className="block text-xs font-medium text-base-content/70 mb-2 truncate">
                    From
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    id="startDate"
                    value={filter.startDate}
                    onChange={handleFilterChange}
                  className="w-full h-8 px-3 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-gray-50 transition-all duration-200"
                  />
                </div>

                {/* Date To */}
              <div className="bg-gray-100 backdrop-blur-sm rounded-xl p-3 border border-gray-300 shadow-sm hover:shadow-md transition-all duration-300">
                <label htmlFor="endDate" className="block text-xs font-medium text-base-content/70 mb-2 truncate">
                    To
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    id="endDate"
                    value={filter.endDate}
                    onChange={handleFilterChange}
                  className="w-full h-8 px-3 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-gray-50 transition-all duration-200"
                  />
                </div>
                </div>

            {/* Search Bar - Full Width */}
            <div className="mb-4">
              <div className="bg-gray-100 backdrop-blur-sm rounded-xl p-3 border border-gray-300 shadow-sm hover:shadow-md transition-all duration-300">
                <label htmlFor="search" className="block text-xs font-medium text-base-content/70 mb-2 truncate">
                    Search
                  </label>
                  <input
                    type="text"
                    name="search"
                    id="search"
                    value={filter.search}
                    onChange={handleFilterChange}
                  className="w-full h-8 px-3 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-gray-50 transition-all duration-200"
                    placeholder="Search by notes, fabric name, or code"
                  />
                </div>
              </div>

            {/* Reset Button - Separate and Right Aligned */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={resetFilters}
                className="px-6 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 flex items-center justify-center gap-2 font-medium shadow-sm hover:shadow-md"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset
              </button>
            </div>
          </div>

          {/* Material Movements Table */}
          <div className="bg-gradient-to-br from-accent/5 via-transparent to-primary/5 backdrop-blur-xl rounded-3xl p-0 border border-gray-300 shadow-xl hover:shadow-2xl transition-all duration-500">
            <div className="flex items-center justify-between p-6 border-b border-gray-300 bg-gradient-to-r from-gray-100 to-gray-50 rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-accent/20 to-primary/20 rounded-xl">
                  <FiPackage className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-base-content">
                Fabric Flow ({pagination.total || 0} total)
              </h3>
              </div>
            </div>
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-12">
                  <div className="flex flex-col items-center justify-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <span className="text-base-content/70 font-medium">Loading material movements...</span>
                  </div>
                </div>
              ) : (
                <>
                  <table className="table w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-gray-200 to-gray-100 border-b border-gray-300">
                        <th className="text-left py-4 px-6 font-semibold text-base-content/80 w-1/8">
                          Date
                        </th>
                        <th className="text-left py-4 px-6 font-semibold text-base-content/80 w-1/8">
                          Type
                        </th>
                        <th className="text-left py-4 px-6 font-semibold text-base-content/80 w-1/4">
                          Fabric
                        </th>
                        <th className="text-left py-4 px-6 font-semibold text-base-content/80 w-1/8">
                          Quantity
                        </th>
                        <th className="text-left py-4 px-6 font-semibold text-base-content/80 w-1/8">
                          Stock After
                        </th>
                        <th className="text-left py-4 px-6 font-semibold text-base-content/80 w-1/8">
                          Cost
                        </th>
                        {/* <th className="text-left py-4 px-6 font-semibold text-base-content/80">
                          User
                        </th> */}
                        <th className="text-left py-4 px-6 font-semibold text-base-content/80 w-1/4">
                          Description
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {movements.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="px-6 py-12 text-center">
                            <div className="text-base-content/40">
                              <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8V4a1 1 0 00-1-1H7a1 1 0 00-1 1v1m8 0V4.5" />
                              </svg>
                              <p className="text-sm font-medium text-base-content">No material movements found</p>
                              <p className="text-sm text-base-content/50">Material movements will appear here when they are created.</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        movements.map((movement) => (
                          <tr key={movement.id} className="border-b border-gray-200 hover:bg-gray-50/50 transition-colors duration-200">
                            <td className="py-5 px-6 align-middle text-sm text-base-content">
                              {formatDate(movement.movementDate)}
                            </td>
                            <td className="py-5 px-6 align-middle">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${
                                movement.movementType === 'IN' ? 'bg-green-100 text-green-800 border-green-200' :
                                movement.movementType === 'OUT' ? 'bg-red-100 text-red-800 border-red-200' :
                                'bg-gray-100 text-gray-600 border-gray-200'
                              }`}>
                                {movement.movementType}
                              </span>
                            </td>
                            <td className="py-5 px-6 align-middle">
                              {movement.material ? (
                                <div>
                                  <div className="text-sm font-medium text-base-content">{movement.material.name}</div>
                                  <div className="text-xs text-base-content/50 mt-1">
                                    Code: {movement.material.code}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-sm text-base-content/40 italic">Unknown Material</span>
                              )}
                            </td>
                            <td className="py-5 px-6 align-middle">
                              <div className="text-sm font-medium text-base-content">{movement.quantity}</div>
                              <div className="text-xs text-base-content/50 mt-1">{movement.unit}</div>
                            </td>
                            <td className="py-5 px-6 align-middle">
                              <div className="text-sm font-medium text-base-content">{movement.qtyAfter}</div>
                              <div className="text-xs text-base-content/50 mt-1">{movement.unit}</div>
                            </td>
                            <td className="py-5 px-6 align-middle text-sm font-medium text-base-content">
                              {formatCurrency(movement.totalCost)}
                            </td>
                            <td className="py-5 px-6 align-middle text-sm text-base-content">
                              {movement.purchaseLog ? (
                                <div>
                                  <div className="font-medium text-blue-600">Purchase</div>
                                  <div className="text-xs text-base-content/50 mt-1">from {movement.purchaseLog.supplier}</div>
                                </div>
                              ) : (
                                <span className="text-base-content/40">-</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>

                  {/* Pagination */}
                  {pagination.pages > 1 && (
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 border-t border-gray-300 bg-gradient-to-r from-gray-50 to-white rounded-b-3xl">
                      <div className="text-sm text-base-content/70">
                        Showing <span className="font-medium">{((pagination.current - 1) * pagination.limit) + 1}</span> to{' '}
                        <span className="font-medium">{Math.min(pagination.current * pagination.limit, pagination.total)}</span> of{' '}
                        <span className="font-medium">{pagination.total}</span> results
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePageChange(pagination.current - 1)}
                          disabled={pagination.current <= 1}
                          className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
                        >
                          « Previous
                        </button>
                        <span className="px-4 py-2 text-sm bg-primary text-primary-content border border-gray-300 rounded-lg font-medium">
                          Page {pagination.current} of {pagination.pages}
                        </span>
                        <button
                          onClick={() => handlePageChange(pagination.current + 1)}
                          disabled={pagination.current >= pagination.pages}
                          className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
                        >
                          Next »
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthWrapper>
  );
} 