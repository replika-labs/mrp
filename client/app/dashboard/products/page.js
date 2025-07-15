'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthWrapper from '../../components/AuthWrapper';
import DashboardLayout from '../../components/DashboardLayout.js';
import Link from 'next/link';
import Image from 'next/image';
import { FiPackage, FiCheck, FiAlertTriangle, FiX, FiRefreshCw, FiPlus, FiSearch, FiShoppingBag, FiTrash2, FiCamera } from 'react-icons/fi';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const router = useRouter();

  // Filter and Search states
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    material: '',
    priceMin: '',
    priceMax: '',
    stockLevel: 'all', // all, inStock, lowStock, outOfStock
    status: 'all', // all, active, inactive
  });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalProducts, setTotalProducts] = useState(0);

  // View toggle state
  const [viewMode, setViewMode] = useState('table'); // table, grid

  // Sorting state
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('DESC');

  // Bulk operations state
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [bulkAction, setBulkAction] = useState('');

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, productId: null, productName: '' });

  // Dropdown state
  const [openDropdown, setOpenDropdown] = useState(null);

  // Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!token || !storedUser) {
      router.push('/login');
      return;
    }

    try {
      setUser(JSON.parse(storedUser));
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/login');
      return;
    }
  }, [router]);

  // Manual refresh function with cache busting to get latest stock
  const refreshProducts = async () => {
    const timestamp = Date.now();
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        sortBy,
        sortOrder,
        _t: timestamp.toString(), // Cache busting parameter
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value && value !== 'all')
        )
      });

      const response = await fetch(`http://localhost:8080/api/products?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();

      if (data.success) {
        setProducts(data.products || []);
        setTotalProducts(data.pagination?.total || 0);
      } else {
        setProducts(data.products || data || []);
        setTotalProducts(data.total || data.length || 0);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Fetch products with filters and pagination
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        sortBy,
        sortOrder,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value && value !== 'all')
        )
      });

      const response = await fetch(`http://localhost:8080/api/products?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();

      if (data.success) {
        setProducts(data.products || []);
        setTotalProducts(data.pagination?.total || 0);
      } else {
        setProducts(data.products || data || []);
        setTotalProducts(data.total || data.length || 0);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Fetch materials for filter dropdown
  const fetchMaterials = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/materials-management?limit=100', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.materials) {
          setMaterials(data.data.materials);
        } else {
          setMaterials(data.materials || data || []);
        }
      }
    } catch (error) {
      console.error('Error fetching materials:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProducts();
      fetchMaterials();
    }
  }, [user, currentPage, pageSize, sortBy, sortOrder, filters]);

  // Filter handlers
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      material: '',
      priceMin: '',
      priceMax: '',
      stockLevel: 'all',
      status: 'all',
    });
    setCurrentPage(1);
  };

  // Selection handlers
  const handleSelectProduct = (productId) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    setSelectedProducts(
      selectedProducts.length === products.length ? [] : products.map(p => p.id)
    );
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedProducts.length === 0) return;

    if (window.confirm(`Are you sure you want to ${bulkAction} ${selectedProducts.length} products?`)) {
      await performBulkAction();
    }
  };

  const performBulkAction = async () => {
      try {
        const token = localStorage.getItem('token');
      
      for (const productId of selectedProducts) {
        if (bulkAction === 'delete') {
          await fetch(`http://localhost:8080/api/products/${productId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
          });
        } else if (bulkAction === 'activate' || bulkAction === 'deactivate') {
          await fetch(`http://localhost:8080/api/products/${productId}`, {
            method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
            body: JSON.stringify({ isActive: bulkAction === 'activate' }),
      });
        }
      }
      
        setSelectedProducts([]);
        setBulkAction('');
      fetchProducts();
    } catch (error) {
      console.error('Bulk action failed:', error);
      setError('Failed to perform bulk action');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDeleteProduct = async (productId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setDeleteConfirm({ show: false, productId: null, productName: '' });
        // Remove product from UI immediately
        setProducts(prev => prev.filter(p => p.id !== productId));
        setTotalProducts(prev => Math.max(0, prev - 1));
        setShowSuccessModal(true);
        setSuccessMessage('Product deleted successfully!');
        setTimeout(() => setShowSuccessModal(false), 3000);
      } else {
        const data = await response.json();
          setError(data.message || 'Failed to delete product');
          setTimeout(() => setError(''), 3000);
      }
    } catch (error) {
      console.error('Delete failed:', error);
      setError('Failed to delete product');
      setTimeout(() => setError(''), 3000);
    }
  };

  const checkProductDeletable = async (productId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/products/${productId}/check-delete`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.canDelete) {
        // If product can be deleted, show confirmation modal
        const product = products.find(p => p.id === productId);
        setDeleteConfirm({
          show: true,
          productId: productId,
          productName: product?.name || 'this product'
        });
      } else {
        // If product cannot be deleted, show error message directly
        setError('This product cannot be deleted because it is already used in existing orders. Only products that have never been ordered can be deleted.');
        setTimeout(() => setError(''), 3000);
      }
    } catch (error) {
      console.error('Check delete failed:', error);
      setError('Failed to check if product can be deleted');
      setTimeout(() => setError(''), 3000);
    }
    // Close dropdown after action
    setOpenDropdown(null);
  };

  // Toggle dropdown
  const toggleDropdown = (productId, event) => {
    event.stopPropagation();
    setOpenDropdown(openDropdown === productId ? null : productId);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-container')) {
        setOpenDropdown(null);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Handle ESC and click outside for modal
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
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSuccessModal && event.target.classList.contains('modal-backdrop')) {
        setShowSuccessModal(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showSuccessModal]);

  // Get unique categories for filter
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

  if (!user) return null;

  return (
    <AuthWrapper>
      <DashboardLayout user={user}>
        <style jsx>{`
          .dropdown-container {
            position: relative;
          }
          .dropdown-menu {
            position: absolute;
            top: 100%;
            right: 0;
            z-index: 1000;
            min-width: 200px;
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            opacity: 0;
            visibility: hidden;
            transform: translateY(-10px);
            transition: all 0.2s ease;
          }
          .dropdown-menu.open {
            opacity: 1;
            visibility: visible;
            transform: translateY(0);
          }
          .dropdown-menu ul {
            list-style: none;
            margin: 0;
            padding: 8px;
          }
          .dropdown-menu li {
            margin: 0;
          }
        `}</style>
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 backdrop-blur-xl rounded-3xl p-8 border border-gray-300 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.01] hover:-translate-y-1">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl flex-shrink-0">
                <FiShoppingBag className="w-8 h-8 text-primary" />
            </div>
              <div className="flex flex-col justify-start -mt-1">
                <h1 className="text-2xl font-bold text-base-content bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent leading-tight">
                  Products
                </h1>
                <p className="text-sm text-base-content/60 leading-tight -mt-5">Manage your product catalog efficiently</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={refreshProducts}
                disabled={loading}
                className="btn bg-base-200 border border-gray-300 h-10 px-4 text-sm shadow-md hover:shadow-lg transition-all duration-300 rounded-lg flex items-center justify-center gap-2"
              >
                <FiRefreshCw className="w-4 h-4" />
                <span className="normal-case">{loading ? 'Refreshing...' : 'Refresh'}</span>
              </button>
              <Link
                href="/dashboard/products/create"
                className="btn bg-primary text-primary-content border border-gray-300 h-10 px-4 text-sm shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 rounded-lg flex items-center justify-center gap-2"
              >
                <FiPlus className="w-4 h-4" />
                <span className="normal-case">Add Product</span>
              </Link>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-primary/10 via-transparent to-primary/5 backdrop-blur-xl rounded-3xl p-6 border border-gray-300 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 group relative">
              {/* Logo di kanan atas */}
              <div className="absolute top-4 right-4">
                <div className="p-3 bg-primary/20 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <FiPackage className="w-6 h-6 text-primary" />
                </div>
              </div>
              
              {/* Judul dan deskripsi di kiri atas */}
              <div className="mb-8">
                <div className="text-xs text-base-content/60 uppercase tracking-wider font-medium">Total Products</div>
                <div className="text-xs text-base-content/40 mt-1">All time</div>
              </div>
              
              {/* Jumlah di kiri bawah */}
              <div className="text-3xl font-bold text-primary">{totalProducts}</div>
            </div>
            
            <div className="bg-gradient-to-br from-success/10 via-transparent to-success/5 backdrop-blur-xl rounded-3xl p-6 border border-gray-300 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 group relative">
              {/* Logo di kanan atas */}
              <div className="absolute top-4 right-4">
                <div className="p-3 bg-success/20 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <FiCheck className="w-6 h-6 text-success" />
                </div>
              </div>
              
              {/* Judul dan deskripsi di kiri atas */}
              <div className="mb-8">
                <div className="text-xs text-base-content/60 uppercase tracking-wider font-medium">In Stock</div>
                <div className="text-xs text-base-content/40 mt-1">Ready to sell</div>
              </div>
              
              {/* Jumlah di kiri bawah */}
              <div className="text-3xl font-bold text-success">{products.filter(p => p.qtyOnHand > 0).length}</div>
            </div>

            <div className="bg-gradient-to-br from-warning/10 via-transparent to-warning/5 backdrop-blur-xl rounded-3xl p-6 border border-gray-300 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 group relative">
              {/* Logo di kanan atas */}
              <div className="absolute top-4 right-4">
                <div className="p-3 bg-warning/20 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <FiAlertTriangle className="w-6 h-6 text-warning" />
                </div>
              </div>
              
              {/* Judul dan deskripsi di kiri atas */}
              <div className="mb-8">
                <div className="text-xs text-base-content/60 uppercase tracking-wider font-medium">Low Stock</div>
                <div className="text-xs text-base-content/40 mt-1">Need attention</div>
              </div>
              
              {/* Jumlah di kiri bawah */}
              <div className="text-3xl font-bold text-warning">{products.filter(p => p.qtyOnHand > 0 && p.qtyOnHand < 10).length}</div>
            </div>

            <div className="bg-gradient-to-br from-error/10 via-transparent to-error/5 backdrop-blur-xl rounded-3xl p-6 border border-gray-300 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 group relative">
              {/* Logo di kanan atas */}
              <div className="absolute top-4 right-4">
                <div className="p-3 bg-error/20 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <FiX className="w-6 h-6 text-error" />
                </div>
              </div>
              
              {/* Judul dan deskripsi di kiri atas */}
              <div className="mb-8">
                <div className="text-xs text-base-content/60 uppercase tracking-wider font-medium">Out of Stock</div>
                <div className="text-xs text-base-content/40 mt-1">Need restock</div>
              </div>
              
              {/* Jumlah di kiri bawah */}
              <div className="text-3xl font-bold text-error">{products.filter(p => p.qtyOnHand === 0).length}</div>
            </div>
          </div>

          {/* Filters Panel */}
          <div className="bg-gradient-to-br from-base-100/80 via-transparent to-base-100/60 backdrop-blur-xl rounded-3xl p-8 border border-gray-300 shadow-xl hover:shadow-2xl transition-all duration-500">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-info/20 to-primary/20 rounded-xl">
                <FiSearch className="w-5 h-5 text-info" />
              </div>
              <h3 className="text-lg font-semibold text-base-content">Filters & Search</h3>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {/* Search */}
                <div className="form-control bg-white/50 backdrop-blur-sm rounded-lg p-3 border border-gray-200 shadow-sm min-w-0">
                  <label className="label pb-1">
                    <span className="label-text text-xs font-medium text-base-content/70 truncate">Search</span>
                </label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Search products..."
                    className="input input-bordered h-9 text-sm bg-gray-100 border-gray-300 focus:border-primary/50 focus:bg-gray-50 transition-all duration-300 rounded-lg w-full"
                />
              </div>

              {/* Category Filter */}
                <div className="form-control bg-white/50 backdrop-blur-sm rounded-lg p-3 border border-gray-200 shadow-sm min-w-0">
                  <label className="label pb-1">
                    <span className="label-text text-xs font-medium text-base-content/70 truncate">Category</span>
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="select select-bordered h-9 text-sm bg-gray-100 border-gray-300 focus:border-primary/50 focus:bg-gray-50 transition-all duration-300 rounded-lg w-full"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Material Filter */}
                <div className="form-control bg-white/50 backdrop-blur-sm rounded-lg p-3 border border-gray-200 shadow-sm min-w-0">
                  <label className="label pb-1">
                    <span className="label-text text-xs font-medium text-base-content/70 truncate">Material</span>
                </label>
                <select
                  value={filters.material}
                  onChange={(e) => handleFilterChange('material', e.target.value)}
                    className="select select-bordered h-9 text-sm bg-gray-100 border-gray-300 focus:border-primary/50 focus:bg-gray-50 transition-all duration-300 rounded-lg w-full"
                >
                  <option value="">All Materials</option>
                  {materials.map(material => (
                    <option key={material.id} value={material.id}>{material.name}</option>
                  ))}
                </select>
              </div>

              {/* Stock Level Filter */}
                <div className="form-control bg-white/50 backdrop-blur-sm rounded-lg p-3 border border-gray-200 shadow-sm min-w-0">
                  <label className="label pb-1">
                    <span className="label-text text-xs font-medium text-base-content/70 truncate">Stock Level</span>
                </label>
                <select
                  value={filters.stockLevel}
                  onChange={(e) => handleFilterChange('stockLevel', e.target.value)}
                    className="select select-bordered h-9 text-sm bg-gray-100 border-gray-300 focus:border-primary/50 focus:bg-gray-50 transition-all duration-300 rounded-lg w-full"
                >
                  <option value="all">All Stock</option>
                  <option value="inStock">In Stock</option>
                  <option value="lowStock">Low Stock</option>
                  <option value="outOfStock">Out of Stock</option>
                </select>
              </div>

              {/* Status Filter */}
                <div className="form-control bg-white/50 backdrop-blur-sm rounded-lg p-3 border border-gray-200 shadow-sm min-w-0">
                  <label className="label pb-1">
                    <span className="label-text text-xs font-medium text-base-content/70 truncate">Status</span>
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="select select-bordered h-9 text-sm bg-gray-100 border-gray-300 focus:border-primary/50 focus:bg-gray-50 transition-all duration-300 rounded-lg w-full"
                >
                    <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                </div>
              </div>

              {/* Clear All Button - Separate */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="btn bg-base-200 border border-gray-300 h-10 px-6 text-sm shadow-md hover:shadow-lg transition-all duration-300 rounded-lg flex items-center justify-center"
                >
                  <span className="normal-case">Clear All Filters</span>
                </button>
              </div>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="alert alert-error shadow-lg rounded-2xl border-0 bg-gradient-to-r from-error/10 to-error/5 backdrop-blur-xl">
              <FiX className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-16">
              <div className="bg-gradient-to-br from-primary/10 via-transparent to-primary/5 backdrop-blur-xl rounded-3xl p-8 border border-gray-300 shadow-xl">
                <span className="loading loading-spinner loading-lg text-primary"></span>
              </div>
            </div>
          )}

          {/* Products Content */}
          {!loading && (
            <div className="bg-gradient-to-br from-base-100/80 via-transparent to-base-100/60 backdrop-blur-xl rounded-3xl border border-gray-300 shadow-xl hover:shadow-2xl transition-all duration-500">
              {/* Table Header with Actions */}
              {products.length > 0 && (
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-8 border-b border-base-200/50">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-base-content/60">
                      {selectedProducts.length > 0 && `${selectedProducts.length} selected`}
                    </span>
                    {selectedProducts.length > 0 && (
                      <div className="flex items-center gap-3">
                        <select
                          value={bulkAction}
                          onChange={(e) => setBulkAction(e.target.value)}
                          className="select select-bordered h-9 text-sm bg-gray-100 border-gray-300 backdrop-blur-sm rounded-lg"
                        >
                          <option value="">Select Action</option>
                          <option value="activate">Activate</option>
                          <option value="deactivate">Deactivate</option>
                          <option value="delete">Delete</option>
                        </select>
                        <button
                          onClick={handleBulkAction}
                          disabled={!bulkAction}
                          className="btn bg-base-200 border border-gray-300 h-9 px-4 text-xs shadow-md hover:shadow-lg transition-all duration-300 rounded-lg flex items-center justify-center"
                        >
                          <span className="normal-case">Apply</span>
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-1 border border-gray-300 shadow-lg">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setViewMode('table')}
                          className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 min-w-[90px] ${
                            viewMode === 'table' 
                              ? 'bg-white text-blue-700 shadow-md border border-blue-200' 
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                          }`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 6h18m-9 8h9m-9 4h9m-9-8H3m0 4h6m-6 4h6" />
                          </svg>
                          <span>Table</span>
                        </button>
                        <button
                          onClick={() => setViewMode('grid')}
                          className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 min-w-[90px] ${
                            viewMode === 'grid' 
                              ? 'bg-white text-blue-700 shadow-md border border-blue-200' 
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                          }`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                          </svg>
                          <span>Grid</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Table View */}
              {viewMode === 'table' && products.length > 0 ? (
                  <div className="overflow-x-auto">
                  <table className="table w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b-2 border-gray-200">
                        <th className="bg-transparent w-12 pl-6 py-4">
                            <input
                              type="checkbox"
                              checked={selectedProducts.length === products.length && products.length > 0}
                              onChange={handleSelectAll}
                            className="checkbox checkbox-sm checkbox-primary"
                            />
                          </th>
                        <th className="bg-transparent text-sm font-semibold text-gray-700 py-4 text-left">Photo</th>
                        <th className="bg-transparent text-sm font-semibold text-gray-700 py-4 text-left">Product</th>
                        <th className="bg-transparent text-sm font-semibold text-gray-700 py-4 text-left">Category</th>
                        <th className="bg-transparent text-sm font-semibold text-gray-700 py-4 text-left">Price</th>
                        <th className="bg-transparent text-sm font-semibold text-gray-700 py-4 text-left">Stock</th>
                        <th className="bg-transparent text-sm font-semibold text-gray-700 py-4 text-left">Status</th>
                        <th className="bg-transparent text-sm font-semibold text-gray-700 py-4 text-center pr-6">Actions</th>
                        </tr>
                      </thead>
                    <tbody>
                        {products.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100">
                          <td className="pl-6 py-5 align-middle">
                              <input
                                type="checkbox"
                                checked={selectedProducts.includes(product.id)}
                                onChange={() => handleSelectProduct(product.id)}
                              className="checkbox checkbox-sm checkbox-primary"
                              />
                            </td>
                          <td className="py-5 pr-4 align-middle">
                            <div className="flex-shrink-0">
                              <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shadow-sm">
                                {product.photos && product.photos.length > 0 ? (
                                  <Image
                                    src={`http://localhost:8080${product.photos.find(p => p.isPrimary)?.photoPath || product.photos[0]?.photoPath}`}
                                    alt={product.name}
                                    width={48}
                                    height={48}
                                    className="object-cover w-full h-full"
                                    unoptimized
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                                    <FiCamera className="w-6 h-6" />
                                  </div>
                                )}
                              </div>
                              </div>
                            </td>
                          <td className="py-5 pr-4 align-middle">
                            <div className="max-w-xs">
                              <div className="font-semibold text-gray-900 text-sm truncate">{product.name}</div>
                              <div className="text-xs text-gray-500 font-mono mt-1">{product.code}</div>
                              </div>
                            </td>
                          <td className="py-5 pr-4 align-middle">
                            <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap">
                              {product.category || '-'}
                            </span>
                            </td>
                          <td className="py-5 pr-4 align-middle font-mono text-sm font-medium text-gray-900 whitespace-nowrap">
                              {product.price ? `Rp ${Number(product.price).toLocaleString('id-ID')}` : '-'}
                            </td>
                          <td className="py-5 pr-4 align-middle">
                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                              product.qtyOnHand === 0 
                                ? 'bg-red-50 text-red-700 border border-red-200' :
                              product.qtyOnHand < 10 
                                ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' 
                                : 'bg-green-50 text-green-700 border border-green-200'
                                }`}>
                                {product.qtyOnHand} {product.unit}
                              </span>
                            </td>
                          <td className="py-5 pr-4 align-middle">
                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                              product.isActive 
                                ? 'bg-green-50 text-green-700 border border-green-200' 
                                : 'bg-red-50 text-red-700 border border-red-200'
                                }`}>
                                {product.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                          <td className="py-5 pr-6 align-middle">
                            <div className="flex items-center justify-center w-full">
                              <div className="dropdown-container">
                                <button 
                                  className="btn btn-ghost btn-sm w-8 h-8 min-h-8 p-0 rounded-lg hover:bg-gray-100 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 mx-auto"
                                  onClick={(e) => toggleDropdown(product.id, e)}
                                >
                                  <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                  </svg>
                                </button>
                              <div className={`dropdown-menu ${openDropdown === product.id ? 'open' : ''}`}>
                                <ul>
                                  <li>
                              <Link
                                href={`/dashboard/products/${product.id}`}
                                      className="text-sm py-2.5 px-3 hover:bg-gray-50 rounded-lg flex items-center gap-3 transition-colors block w-full"
                                      onClick={() => setOpenDropdown(null)}
                                    >
                                      <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                      </svg>
                                      <span>View Details</span>
                              </Link>
                                  </li>
                                  <li>
                              <Link
                                href={`/dashboard/products/${product.id}/edit`}
                                      className="text-sm py-2.5 px-3 hover:bg-gray-50 rounded-lg flex items-center gap-3 transition-colors block w-full"
                                      onClick={() => setOpenDropdown(null)}
                              >
                                      <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                      <span>Edit</span>
                              </Link>
                                  </li>
                              {user?.role === 'admin' && (
                                    <li>
                                <Link
                                  href={`/dashboard/products/${product.id}/stock`}
                                        className="text-sm py-2.5 px-3 hover:bg-gray-50 rounded-lg flex items-center gap-3 transition-colors block w-full"
                                        onClick={() => setOpenDropdown(null)}
                                >
                                        <svg className="w-4 h-4 text-purple-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
                                        </svg>
                                        <span>Manage Stock</span>
                                </Link>
                                    </li>
                              )}
                                  <li>
                                    <hr className="my-1 border-gray-200" />
                                  </li>
                                  <li>
                              <button
                                onClick={() => checkProductDeletable(product.id)}
                                      className="text-sm py-2.5 px-3 hover:bg-red-50 text-red-600 rounded-lg flex items-center gap-3 w-full text-left transition-colors"
                              >
                                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                      <span>Delete</span>
                              </button>
                                  </li>
                                </ul>
                              </div>
                            </div>
                            </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
              ) : viewMode === 'grid' && products.length > 0 ? (
                /* Grid View */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-8">
                  {products.map((product) => (
                    <div key={product.id} className="bg-gradient-to-br from-base-100/60 via-transparent to-base-100/40 backdrop-blur-xl rounded-2xl border border-gray-300 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 group">
                      <figure className="px-4 pt-4">
                        <div className="relative w-full h-48 rounded-xl overflow-hidden bg-base-200">
                          <input
                            type="checkbox"
                            checked={selectedProducts.includes(product.id)}
                            onChange={() => handleSelectProduct(product.id)}
                            className="checkbox checkbox-sm checkbox-primary absolute top-2 right-2 z-10 bg-base-100/80 backdrop-blur-sm"
                          />
                        {product.photos && product.photos.length > 0 ? (
                          <Image
                            src={`http://localhost:8080${product.photos.find(p => p.isPrimary)?.photoPath || product.photos[0]?.photoPath}`}
                            alt={product.name}
                            fill
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            unoptimized
                          />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-base-content/30">
                              <FiCamera className="w-12 h-12" />
                          </div>
                        )}
                        </div>
                      </figure>
                      <div className="card-body p-6">
                        <h2 className="card-title text-sm items-start gap-2">
                          <span className="flex-1">{product.name}</span>
                          <div className={`badge badge-xs ${product.isActive ? 'badge-success' : 'badge-error'}`}>
                            {product.isActive ? 'Active' : 'Inactive'}
                      </div>
                        </h2>
                        <p className="text-xs text-base-content/60">{product.code}</p>
                        <div className="flex justify-between items-center mt-3">
                          <span className="text-sm font-bold">
                            {product.price ? `Rp ${Number(product.price).toLocaleString('id-ID')}` : '-'}
                          </span>
                          <div className={`badge badge-sm ${
                            product.qtyOnHand === 0 ? 'badge-error' :
                            product.qtyOnHand < 10 ? 'badge-warning' : 'badge-success'
                            }`}>
                            {product.qtyOnHand} {product.unit}
                        </div>
                        </div>
                        <div className="card-actions justify-end mt-4 gap-2">
                          <Link
                            href={`/dashboard/products/${product.id}`}
                            className="btn btn-primary border-gray-300 btn-xs h-7 px-3 text-xs rounded-lg flex items-center justify-center"
                          >
                            <span className="normal-case">View</span>
                          </Link>
                          <Link
                            href={`/dashboard/products/${product.id}/edit`}
                            className="btn bg-base-200 border-gray-300 btn-xs h-7 px-3 text-xs shadow-md hover:shadow-lg transition-all duration-300 rounded-lg flex items-center justify-center"
                          >
                            <span className="normal-case">Edit</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Empty State */
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="mb-6 opacity-50">
                    <FiPackage className="w-16 h-16 text-base-content/30" />
                  </div>
                  <h3 className="text-xl font-semibold text-base-content mb-2">No Products Found</h3>
                  <p className="text-base-content/60 text-center mb-8 max-w-md">
                    {Object.values(filters).some(v => v && v !== 'all') 
                      ? 'No products match your current filters. Try adjusting your search criteria.'
                      : 'Get started by adding your first product to the catalog.'
                    }
                  </p>
                  <Link href="/dashboard/products/create" className="btn btn-primary border-gray-300 h-10 px-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 rounded-lg flex items-center justify-center gap-2">
                    <FiPlus className="w-4 h-4" />
                    <span className="normal-case">Add First Product</span>
                  </Link>
                </div>
              )}

              {/* Pagination */}
              {totalProducts > pageSize && (
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-8 border-t border-base-200/50">
                  <div className="text-sm text-base-content/60">
                    Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalProducts)} of {totalProducts} products
                  </div>
                  <div className="join shadow-lg">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="join-item btn btn-sm bg-base-100 border-gray-300 hover:bg-base-200 rounded-l-lg flex items-center justify-center"
                    >
                      « Previous
                    </button>
                    <button className="join-item btn btn-sm btn-active bg-primary text-primary-content border-gray-300 flex items-center justify-center">
                      Page {currentPage} of {Math.ceil(totalProducts / pageSize)}
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(totalProducts / pageSize)))}
                      disabled={currentPage >= Math.ceil(totalProducts / pageSize)}
                      className="join-item btn btn-sm bg-base-100 border-gray-300 hover:bg-base-200 rounded-r-lg flex items-center justify-center"
                    >
                      Next »
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="flex min-h-screen items-center justify-center p-4 md:p-6">
            <div className="bg-gradient-to-br from-white/95 via-white/90 to-white/95 backdrop-blur-xl rounded-3xl max-w-md w-full shadow-2xl border border-gray-300 hover:shadow-3xl transition-all duration-300">
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-red-100 to-red-200 rounded-xl">
                      <FiTrash2 className="w-6 h-6 text-red-600" />
                    </div>
                    <h3 className="text-xl font-bold text-base-content">Delete Product</h3>
                  </div>
                  <button
                    onClick={() => setDeleteConfirm({ show: false, productId: null, productName: '' })}
                    className="text-base-content/60 hover:text-base-content transition-colors p-2 rounded-xl hover:bg-gray-100/50 backdrop-blur-sm"
                  >
                    <FiX className="h-5 w-5" />
                  </button>
                </div>

                <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-gray-300 shadow-sm mb-6">
                  <p className="text-base-content leading-relaxed">
                    Are you sure you want to delete <span className="font-semibold">&quot;{deleteConfirm.productName}&quot;</span>?
                  </p>
                  <p className="text-red-600 font-medium mt-3 text-sm">
                    This action cannot be undone.
            </p>
                </div>

                <div className="flex justify-end gap-4 pt-6 mt-6 border-t border-gray-300/50">
              <button
                onClick={() => setDeleteConfirm({ show: false, productId: null, productName: '' })}
                    className="px-6 py-2 h-10 text-sm bg-white/80 border border-gray-300 text-base-content/70 hover:text-base-content rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteProduct(deleteConfirm.productId)}
                    className="px-6 py-2 h-10 text-sm bg-red-600 text-white border border-red-700 rounded-xl hover:bg-red-700 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] font-semibold"
              >
                Delete
              </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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