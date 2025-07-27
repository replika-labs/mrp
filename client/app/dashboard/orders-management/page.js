'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/app/components/DashboardLayout';
import AuthWrapper from '@/app/components/AuthWrapper';
import ProductSelector from '@/app/components/ProductSelector';
import ordersManagementAPI from '@/app/services/OrdersManagementAPI';
import { FiClipboard, FiClock, FiCheck, FiAlertTriangle, FiPlus, FiX, FiSearch, FiDownload } from 'react-icons/fi';

export default function OrdersManagement() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [tailors, setTailors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0, orderId: null });

  // Optimized pagination state
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 0,
    current: 1,
    limit: 10
  });

  // Filter counts for UI
  const [filterCounts, setFilterCounts] = useState({
    statusCounts: {},
    priorityCounts: {}
  });

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  // Dropdown states
  const [openDropdown, setOpenDropdown] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    customerNote: '',
    dueDate: '',
    description: '',
    priority: 'MEDIUM',
    status: 'CREATED',
    workerContactId: '',
    products: []
  });

  // Filter states
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    search: '',
    dateFrom: '',
    dateTo: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // Performance optimization states
  const [updating, setUpdating] = useState(new Set()); // Track which orders are being updated
  const [refreshingTailors, setRefreshingTailors] = useState(false);

  // Optimized fetch orders using new API
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      // Prepare parameters for optimized API
      const params = {
        page: pagination.current,
        limit: pagination.limit,
        status: filters.status,
        priority: filters.priority,
        search: filters.search,
        startDate: filters.dateFrom,
        endDate: filters.dateTo,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      };

      // Use optimized API with server-side processing
      const data = await ordersManagementAPI.getOrdersList(params);

      setOrders(data.orders);
      setPagination(data.pagination);
      setFilterCounts(data.filters);

      // Preload next page for better UX
      ordersManagementAPI.preloadNextPage(params);

    } catch (err) {
      setError('Error loading orders: ' + err.message);
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.current, pagination.limit]);

  // Optimized fetch tailors using cached API
  const fetchTailors = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No authentication token for loading tailors');
        setTailors([]);
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
          setTailors([]);
        }
      } else {
        console.error('Tailors API error:', response.status, response.statusText);
        setTailors([]);
      }
    } catch (err) {
      console.error('Error loading tailors:', err.message);
      // Fallback to empty array on error
      setTailors([]);
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
          setSuccess('Tailors list refreshed successfully!');
          setTimeout(() => setSuccess(''), 3000);
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

  // Split into two separate useEffect hooks
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    fetchTailors();
  }, []);

  // Add Escape key listener for closing modal
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        setShowViewModal(false);
      }
    };

    if (showViewModal) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => {
        document.removeEventListener('keydown', handleEscapeKey);
      };
    }
  }, [showViewModal]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdown && !event.target.closest('.dropdown')) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [openDropdown]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Optimized status change with optimistic updates
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      // Add to updating set for UI feedback
      setUpdating(prev => new Set(prev).add(orderId));

      // Optimistic update - update UI immediately
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId
            ? { ...order, status: newStatus, updatedAt: new Date().toISOString() }
            : order
        )
      );

      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/orders-management/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        // Revert optimistic update on failure
        setOrders(prevOrders =>
          prevOrders.map(order =>
            order.id === orderId
              ? { ...order, status: order.status } // This will revert to previous status
              : order
          )
        );
        throw new Error('Failed to update status');
      }

      setSuccess('Order status updated successfully!');
      setTimeout(() => setSuccess(''), 3000);

    } catch (err) {
      setError('Failed to update status: ' + err.message);
      setTimeout(() => setError(''), 5000);
    } finally {
      // Remove from updating set
      setUpdating(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  const handleOrderLink = async (orderId, { open = false } = {}) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/orders-management/${orderId}/generate-link`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.orderLink) {
          const orderToken = data.orderLink.token;
          const orderLink = `${window.location.origin}/order-link/${orderToken}`;
          if (open) {
            window.open(orderLink, '_blank');
          } else {
            navigator.clipboard.writeText(orderLink).then(() => {
              setSuccess(`Order link copied to clipboard: ${orderLink}`);
              setTimeout(() => setSuccess(''), 5000);
            }).catch(() => {
              // Fallback: show the link in alert
              alert(`Order Link: ${orderLink}`);
            });
          }
        } else {
          throw new Error(data.message || 'Failed to generate order link');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate order link');
      }
    } catch (err) {
      setError('Failed to generate order link: ' + err.message);
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleDownloadReport = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token required');
      }

      // Send current filters to API
      const params = {
        status: filters.status,
        priority: filters.priority,
        search: filters.search,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      };

      const response = await fetch('http://localhost:8080/api/orders-management/download-report', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to download report');
      }

      // Handle PDF download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orders-report-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccess('Report downloaded successfully!');
      setTimeout(() => setSuccess(''), 3000);

    } catch (err) {
      setError('Failed to download report: ' + err.message);
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  // Handle product selection
  const handleProductChange = (productId, quantity) => {
    setFormData(prev => {
      const existingProductIndex = prev.products.findIndex(p => p.productId === productId);
      
      if (quantity === 0) {
        // Remove product if quantity is 0
        return {
          ...prev,
          products: prev.products.filter(p => p.productId !== productId)
        };
      }
      
      if (existingProductIndex >= 0) {
        // Update existing product quantity
        const updatedProducts = [...prev.products];
        updatedProducts[existingProductIndex] = { ...updatedProducts[existingProductIndex], quantity };
        return { ...prev, products: updatedProducts };
      } else {
        // Add new product
        return {
          ...prev,
          products: [...prev.products, { productId, quantity }]
        };
      }
    });
  };

  const handleCreate = async (e) => {
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

      const result = await ordersManagementAPI.createOrder(formData);

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

      // Center modals for create/update actions
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 3000);
      setShowCreateModal(false);
      resetForm();
      fetchOrders();

    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
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

      const result = await ordersManagementAPI.updateOrder(selectedOrder.id, formData);

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

      // Center modals for create/update actions
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 3000);
      setShowEditModal(false);
      resetForm();
      fetchOrders();

    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (orderId, event) => {
    setOrderToDelete(orderId);
    setShowDeleteModal(true);
  };

  const handleDropdownToggle = (orderId, event) => {
    event.stopPropagation();
    
    if (openDropdown === orderId) {
      setOpenDropdown(null);
      setDropdownPosition({ x: 0, y: 0, orderId: null });
    } else {
      // Simple positioning - dropdown appears right below the button
      const rect = event.currentTarget.getBoundingClientRect();
      const dropdownWidth = 192; // w-48 = 192px
      
      // Simple positioning: below and to the left of button
      let x = rect.left;
      let y = rect.bottom + 8;
      
      // If dropdown would go off the right edge, align it to the right of the button
      if (x + dropdownWidth > window.innerWidth) {
        x = rect.right - dropdownWidth;
      }
      
      // If dropdown would go off the bottom, show it above the button
      if (y + 200 > window.innerHeight) {
        y = rect.top - 200 - 8;
      }
      
      // Ensure it doesn't go off the left edge
      if (x < 8) {
        x = 8;
      }
      
      
      
      setDropdownPosition({ x, y, orderId });
      setOpenDropdown(orderId);
    }
  };

  const confirmDelete = async () => {
    if (!orderToDelete) return;

    try {
      // First, optimistically update the UI by removing the order from local state
      setOrders(prevOrders => prevOrders.filter(order => order.id !== orderToDelete));
      
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/orders-management/${orderToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Close delete modal first
        setShowDeleteModal(false);
        
        // Show success modal at center (no position needed)
        setSuccessMessage('Order deleted successfully!');
        setShowSuccessModal(true);
        
        // Update pagination if needed
        setPagination(prev => ({
          ...prev,
          total: Math.max(0, prev.total - 1)
        }));
        
        setTimeout(() => setShowSuccessModal(false), 3000);
      } else {
        // If delete failed, restore the order by refetching
        fetchOrders();
        throw new Error('Failed to delete order');
      }
    } catch (err) {
      // If there was an error, refetch to restore the correct state
      fetchOrders();
      setError('Failed to delete order: ' + err.message);
      setTimeout(() => setError(''), 5000);
    } finally {
      setShowDeleteModal(false);
      setOrderToDelete(null);
    }
  };

  const resetForm = () => {
    setFormData({
      customerNote: '',
      dueDate: '',
      description: '',
      priority: 'MEDIUM',
      status: 'CREATED',
      workerContactId: '',
      products: []
    });
    setSelectedOrder(null);
  };

  const openEditModal = async (order) => {
    try {
      // Fetch full order details including products
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/orders-management/${order.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const fullOrder = data.order;
        
        setSelectedOrder(fullOrder);
      setFormData({
          customerNote: fullOrder.customerNote || '',
          dueDate: fullOrder.dueDate ? fullOrder.dueDate.split('T')[0] : '',
          description: fullOrder.description || '',
          priority: fullOrder.priority || 'MEDIUM',
          status: fullOrder.status || 'CREATED',
          workerContactId: fullOrder.workerContactId || '',
          products: fullOrder.Products ? fullOrder.Products.map(p => ({
          productId: p.id,
          quantity: p.OrderProduct.qty
          })) : []
      });
      setShowEditModal(true);
      }
    } catch (err) {
      setError('Failed to load order details: ' + err.message);
      setTimeout(() => setError(''), 5000);
    }
  };

  const openViewModal = async (order) => {
    try {
      // Fetch full order details
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/orders-management/${order.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedOrder(data.order);
      setShowViewModal(true);
        setOpenDropdown(null); // Close dropdown when modal opens
      }
    } catch (err) {
      setError('Failed to load order details: ' + err.message);
      setTimeout(() => setError(''), 5000);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'CREATED': 'bg-blue-100 text-blue-800',
      'CONFIRMED': 'bg-purple-100 text-purple-800',
      'PROCESSING': 'bg-yellow-100 text-yellow-800',
      'COMPLETED': 'bg-green-100 text-green-800',
      'SHIPPED': 'bg-indigo-100 text-indigo-800',
      'DELIVERED': 'bg-green-100 text-green-800',
      'CANCELLED': 'bg-red-100 text-red-800',
      'NEED_MATERIAL': 'bg-orange-100 text-orange-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'LOW': 'bg-gray-100 text-gray-800',
      'MEDIUM': 'bg-blue-100 text-blue-800',
      'HIGH': 'bg-orange-100 text-orange-800',
      'URGENT': 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const formatProductsList = (products) => {
    if (!products || products.length === 0) return 'No products';
    if (products.length <= 2) {
      return products.map(p => `${p.name} (${p.OrderProduct.qty})`).join(', ');
    }
    const first = products[0];
    return `${first.name} (${first.OrderProduct.qty}) +${products.length - 1} more`;
  };

  const formatProductsDisplay = (products) => {
    if (!products || products.length === 0) return { displayText: 'No products', detailText: '' };

    const maxDisplay = 3;
    const displayProducts = products.slice(0, maxDisplay);
    const displayText = displayProducts.map(p => `${p.name}: ${p.OrderProduct.qty}pcs`).join(' | ');
    const moreText = products.length > maxDisplay ? ` +${products.length - maxDisplay} more` : '';

    return {
      displayText: displayText + moreText,
      detailText: products.map(p => `${p.name}: ${p.OrderProduct.qty}pcs`).join(' | ')
    };
  };

  // Server-side pagination - orders array already contains the correct page
  const paginatedOrders = orders;

  // Handle escape key for modals and dropdown
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        setShowSuccessModal(false);
        setShowDeleteModal(false);
        setOpenDropdown(null);
        setDropdownPosition({ x: 0, y: 0, orderId: null });
      }
    };

    if (showSuccessModal || showDeleteModal || openDropdown) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => document.removeEventListener('keydown', handleEscapeKey);
    }
  }, [showSuccessModal, showDeleteModal, openDropdown]);

  // Handle click outside modal and dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close modals if clicked on backdrop
      if ((showSuccessModal || showDeleteModal) && event.target.classList.contains('modal-backdrop')) {
        setShowSuccessModal(false);
        setShowDeleteModal(false);
      }
      
      // Close dropdown if clicked outside
      if (openDropdown && !event.target.closest('.dropdown')) {
        setOpenDropdown(null);
        setDropdownPosition({ x: 0, y: 0, orderId: null });
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showSuccessModal, showDeleteModal, openDropdown]);

  return (
    <AuthWrapper>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 backdrop-blur-xl rounded-3xl p-8 border border-gray-300 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.01] hover:-translate-y-1">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl flex-shrink-0">
                <FiClipboard className="w-8 h-8 text-primary" />
              </div>
              <div className="flex flex-col justify-start -mt-1">
                <h1 className="text-2xl font-bold text-base-content bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent leading-tight">
                  Orders Management
                </h1>
                <p className="text-sm text-base-content/60 leading-tight -mt-5">Advanced order management with multiple products support</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleDownloadReport}
                disabled={loading}
                className="btn bg-secondary text-secondary-content border border-gray-300 h-10 px-4 text-sm shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiDownload className="w-4 h-4" />
                <span className="normal-case">Download Report</span>
              </button>
                <button
                  onClick={() => router.push('/dashboard/orders-management/create')}
                className="btn bg-primary text-primary-content border border-gray-300 h-10 px-4 text-sm shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 rounded-lg flex items-center justify-center gap-2"
              >
                <FiPlus className="w-4 h-4" />
                <span className="normal-case">Create New Order</span>
                </button>
              </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-primary/10 via-transparent to-primary/5 backdrop-blur-xl rounded-3xl p-6 border border-gray-300 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 group relative">
              {/* Logo di kanan atas */}
              <div className="absolute top-4 right-4">
                <div className="p-3 bg-primary/20 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <FiClipboard className="w-6 h-6 text-primary" />
                </div>
              </div>
              
              {/* Judul dan deskripsi di kiri atas */}
              <div className="mb-8">
                <div className="text-xs text-base-content/60 uppercase tracking-wider font-medium">Total Orders</div>
                <div className="text-xs text-base-content/40 mt-1">All time</div>
              </div>
              
              {/* Jumlah di kiri bawah */}
              <div className="text-3xl font-bold text-primary">{pagination.total}</div>
            </div>
            
            <div className="bg-gradient-to-br from-warning/10 via-transparent to-warning/5 backdrop-blur-xl rounded-3xl p-6 border border-gray-300 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 group relative">
              {/* Logo di kanan atas */}
              <div className="absolute top-4 right-4">
                <div className="p-3 bg-warning/20 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <FiClock className="w-6 h-6 text-warning" />
                </div>
              </div>
              
              {/* Judul dan deskripsi di kiri atas */}
              <div className="mb-8">
                <div className="text-xs text-base-content/60 uppercase tracking-wider font-medium">Processing</div>
                <div className="text-xs text-base-content/40 mt-1">In progress</div>
              </div>
              
              {/* Jumlah di kiri bawah */}
              <div className="text-3xl font-bold text-warning">{filterCounts.statusCounts?.PROCESSING || 0}</div>
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
                <div className="text-xs text-base-content/60 uppercase tracking-wider font-medium">Completed</div>
                <div className="text-xs text-base-content/40 mt-1">Finished orders</div>
              </div>
              
              {/* Jumlah di kiri bawah */}
              <div className="text-3xl font-bold text-success">{filterCounts.statusCounts?.COMPLETED || 0}</div>
            </div>

            <div className="bg-gradient-to-br from-error/10 via-transparent to-error/5 backdrop-blur-xl rounded-3xl p-6 border border-gray-300 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 group relative">
              {/* Logo di kanan atas */}
              <div className="absolute top-4 right-4">
                <div className="p-3 bg-error/20 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <FiAlertTriangle className="w-6 h-6 text-error" />
                </div>
              </div>
              
              {/* Judul dan deskripsi di kiri atas */}
              <div className="mb-8">
                <div className="text-xs text-base-content/60 uppercase tracking-wider font-medium">Urgent</div>
                <div className="text-xs text-base-content/40 mt-1">High priority</div>
              </div>
              
              {/* Jumlah di kiri bawah */}
              <div className="text-3xl font-bold text-error">{filterCounts.priorityCounts?.URGENT || 0}</div>
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-300 rounded-3xl p-4 shadow-lg backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 bg-red-200 rounded-xl">
                  <FiX className="w-5 h-5 text-red-600" />
                </div>
                <span className="text-red-800 font-medium">{error}</span>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-300 rounded-3xl p-4 shadow-lg backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 bg-green-200 rounded-xl">
                  <FiCheck className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-green-800 font-medium">{success}</span>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-gradient-to-br from-secondary/5 via-transparent to-primary/5 backdrop-blur-xl rounded-3xl p-8 border border-gray-300 shadow-xl hover:shadow-2xl transition-all duration-500">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-secondary/20 to-primary/20 rounded-xl">
                <FiSearch className="w-5 h-5 text-info" />
              </div>
              <h3 className="text-lg font-semibold text-base-content">Filters & Search</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              <div className="bg-gray-100 backdrop-blur-sm rounded-xl p-3 border border-gray-300 shadow-sm hover:shadow-md transition-all duration-300">
                <label className="block text-xs font-medium text-base-content/70 mb-2 truncate">
                  Search
                </label>
                <input
                  type="text"
                  placeholder="Order number, customer note..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full h-8 px-3 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-gray-50 transition-all duration-200"
                />
              </div>
              
              <div className="bg-gray-100 backdrop-blur-sm rounded-xl p-3 border border-gray-300 shadow-sm hover:shadow-md transition-all duration-300">
                <label className="block text-xs font-medium text-base-content/70 mb-2 truncate">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full h-8 px-3 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-gray-50 transition-all duration-200"
                >
                  <option value="">All Status</option>
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
              
              <div className="bg-gray-100 backdrop-blur-sm rounded-xl p-3 border border-gray-300 shadow-sm hover:shadow-md transition-all duration-300">
                <label className="block text-xs font-medium text-base-content/70 mb-2 truncate">
                  Priority
                </label>
                <select
                  value={filters.priority}
                  onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full h-8 px-3 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-gray-50 transition-all duration-200"
                >
                  <option value="">All Priority</option>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
              
              <div className="bg-gray-100 backdrop-blur-sm rounded-xl p-3 border border-gray-300 shadow-sm hover:shadow-md transition-all duration-300">
                <label className="block text-xs font-medium text-base-content/70 mb-2 truncate">
                  Date From
                </label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                  className="w-full h-8 px-3 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-gray-50 transition-all duration-200"
                />
              </div>
              
              <div className="bg-gray-100 backdrop-blur-sm rounded-xl p-3 border border-gray-300 shadow-sm hover:shadow-md transition-all duration-300">
                <label className="block text-xs font-medium text-base-content/70 mb-2 truncate">
                  Date To
                </label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                  className="w-full h-8 px-3 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-gray-50 transition-all duration-200"
                />
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 backdrop-blur-xl rounded-3xl p-12 border border-gray-300 shadow-xl">
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <span className="text-base-content/70 font-medium">Loading orders...</span>
              </div>
            </div>
          ) : (
            /* Orders Table */
            <div className="bg-gradient-to-br from-accent/5 via-transparent to-primary/5 backdrop-blur-xl rounded-3xl p-0 border border-gray-300 shadow-xl hover:shadow-2xl transition-all duration-500">
              <div className="flex items-center justify-between p-6 border-b border-gray-300 bg-gradient-to-r from-gray-100 to-gray-50 rounded-t-3xl">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-accent/20 to-primary/20 rounded-xl">
                    <FiClipboard className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-base-content">
                  Orders ({pagination.total} total)
                </h3>
                </div>
                <div className="text-sm text-base-content/70">
                  Page {pagination.current} of {pagination.pages}
                  {pagination.total > 0 && (
                    <span className="ml-2">
                      ({((pagination.current - 1) * pagination.limit) + 1}-{Math.min(pagination.current * pagination.limit, pagination.total)})
                    </span>
                  )}
              </div>
            </div>

              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-200 to-gray-100 border-b border-gray-300">
                      <th className="text-left py-4 px-6 font-semibold text-base-content/80 w-1/6">Order Details</th>
                      <th className="text-left py-4 px-6 font-semibold text-base-content/80 w-1/6">Products & Quantities</th>
                      <th className="text-left py-4 px-6 font-semibold text-base-content/80 w-1/6">Status & Priority</th>
                      <th className="text-left py-4 px-6 font-semibold text-base-content/80 w-1/6">Progress</th>
                      <th className="text-left py-4 px-6 font-semibold text-base-content/80 w-1/6">Tailor</th>
                      <th className="text-left py-4 px-6 font-semibold text-base-content/80 w-1/8">Due Date</th>
                      <th className="text-center py-4 px-6 font-semibold text-base-content/80 w-20">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedOrders.map((order) => (
                      <tr key={order.id} className="border-b border-gray-200 hover:bg-gray-50/50 transition-colors duration-200">
                        <td className="py-5 px-6 align-middle">
                          <div>
                            <div className="font-bold text-sm text-base-content">{order.orderNumber}</div>
                            <div className="text-sm text-base-content/70 max-w-xs truncate mt-1">
                              {order.description || 'No description'}
                            </div>
                            {order.customerNote && (
                              <div className="text-xs text-primary max-w-xs truncate mt-1">
                                Note: {order.customerNote}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-5 px-6 align-middle">
                          <div className="text-sm">
                            <span className="font-medium text-base-content">
                              {order.productCount || 0} products
                            </span>
                            <div className="text-xs text-base-content/60 mt-1">
                              Total: {order.targetPcs} pcs
                            </div>
                            {order.productCount > 0 && (
                              <div className="text-xs text-base-content/50 mt-1">
                                {order.productCount} items selected
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-5 px-6 align-middle">
                          <div className="space-y-2">
                            <select
                              value={order.status}
                              onChange={(e) => handleStatusChange(order.id, e.target.value)}
                              className="w-full h-8 px-3 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                              disabled={updating.has(order.id)}
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
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${
                              order.priority === 'URGENT' ? 'bg-red-100 text-red-800 border-red-200' :
                              order.priority === 'HIGH' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                              order.priority === 'MEDIUM' ? 'bg-blue-100 text-blue-800 border-blue-200' : 
                              'bg-gray-100 text-gray-600 border-gray-200'
                            }`}>
                              {order.priority}
                            </span>
                          </div>
                        </td>
                        <td className="py-5 px-6 align-middle">
                          <div className="w-full">
                            <div className="flex justify-between text-xs mb-2 text-base-content/70">
                              <span>{order.completedPcs} / {order.targetPcs}</span>
                              <span>{order.targetPcs > 0 ? Math.round((order.completedPcs / order.targetPcs) * 100) : 0}%</span>
                          </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full transition-all duration-300" 
                                style={{width: `${order.targetPcs > 0 ? (order.completedPcs / order.targetPcs) * 100 : 0}%`}}
                            ></div>
                          </div>
                          </div>
                        </td>
                        <td className="py-5 px-6 align-middle">
                          <div className="text-sm">
                            {order.tailor ? (
                              <div>
                                <div className="font-medium text-base-content">{order.tailor.name}</div>
                                {order.tailor.whatsappPhone && (
                                  <a
                                    href={`https://wa.me/${order.tailor.whatsappPhone.replace(/\D/g, '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center px-2 py-1 mt-1 text-xs bg-green-100 text-green-800 border border-green-200 rounded-lg hover:bg-green-200 transition-colors duration-200"
                                  >
                                    WhatsApp
                                  </a>
                                )}
                              </div>
                            ) : (
                              <span className="text-base-content/50 text-xs">No tailor assigned</span>
                            )}
                          </div>
                        </td>
                        <td className="py-5 px-6 align-middle text-sm">
                          {order.dueDate ? new Date(order.dueDate).toLocaleDateString() : 'No due date'}
                        </td>
                        <td className="py-5 px-6 align-middle">
                          <div className="flex items-center justify-center w-full">
                            <div className="dropdown dropdown-end relative">
                              <div 
                                role="button" 
                                className="btn btn-ghost btn-circle btn-sm hover:bg-gray-100 transition-colors duration-200"
                                onClick={(e) => handleDropdownToggle(order.id, e)}
                              >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/>
                                </svg>
                              </div>

                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

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
                    onClick={() => setPagination(prev => ({ ...prev, current: Math.max(prev.current - 1, 1) }))}
                    disabled={pagination.current === 1}
                        className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
                  >
                        « Previous
                  </button>
                      <span className="px-4 py-2 text-sm bg-primary text-primary-content border border-gray-300 rounded-lg font-medium">
                        Page {pagination.current} of {pagination.pages}
                      </span>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, current: Math.min(prev.current + 1, prev.pages) }))}
                    disabled={pagination.current === pagination.pages}
                        className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
                  >
                        Next »
                  </button>
                </div>
              </div>
            )}
          </div>
            )}

          {/* View Modal */}
          {showViewModal && selectedOrder && (
            <div className="modal modal-open" onClick={() => setShowViewModal(false)}>
              <div 
                className="modal-box w-11/12 max-w-4xl bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 backdrop-blur-xl border border-gray-300 shadow-2xl rounded-3xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl">
                      <FiClipboard className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-bold text-lg text-base-content">Order Details: {selectedOrder.orderNumber}</h3>
                  </div>
                    <button
                      onClick={() => setShowViewModal(false)}
                    className="btn btn-ghost btn-circle btn-sm hover:bg-gray-100 transition-colors duration-200"
                    >
                    <FiX className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-6">
                    {/* Order Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                        <label className="label-text font-medium">Order Number</label>
                        <p className="text-base-content">{selectedOrder.orderNumber}</p>
                        </div>
                        <div>
                        <label className="label-text font-medium">Status</label>
                        <div className={`badge ${
                          selectedOrder.status === 'COMPLETED' ? 'badge-success' :
                          selectedOrder.status === 'PROCESSING' ? 'badge-warning' :
                          selectedOrder.status === 'CANCELLED' ? 'badge-error' : 'badge-primary'
                        }`}>
                            {selectedOrder.status}
                        </div>
                        </div>
                        <div>
                        <label className="label-text font-medium">Priority</label>
                        <div className={`badge ${
                          selectedOrder.priority === 'URGENT' ? 'badge-error' :
                          selectedOrder.priority === 'HIGH' ? 'badge-warning' :
                          selectedOrder.priority === 'MEDIUM' ? 'badge-info' : 'badge-ghost'
                        }`}>
                            {selectedOrder.priority}
                        </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                        <label className="label-text font-medium">Due Date</label>
                        <p className="text-base-content">
                            {selectedOrder.dueDate ? new Date(selectedOrder.dueDate).toLocaleDateString() : 'No due date'}
                          </p>
                        </div>
                        <div>
                        <label className="label-text font-medium">Progress</label>
                        <div className="flex items-center gap-3">
                          <progress 
                            className="progress progress-primary flex-1" 
                            value={selectedOrder.targetPcs > 0 ? (selectedOrder.completedPcs / selectedOrder.targetPcs) * 100 : 0} 
                            max="100"
                          ></progress>
                          <span className="text-sm font-medium">
                                {selectedOrder.completedPcs} / {selectedOrder.targetPcs}
                              </span>
                          </div>
                        </div>
                        <div>
                        <label className="label-text font-medium">Created</label>
                        <p className="text-base-content">
                            {new Date(selectedOrder.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Products */}
                    <div>
                    <label className="label-text font-medium mb-3 block">Products ({selectedOrder.Products?.length || 0})</label>
                      {selectedOrder.Products && selectedOrder.Products.length > 0 ? (
                      <div className="grid grid-cols-1 gap-3">
                            {selectedOrder.Products.map((product, index) => (
                          <div key={product.id} className="card bg-base-200 shadow-sm">
                            <div className="card-body p-4">
                              <div className="flex justify-between items-center">
                                <div>
                                  <h4 className="font-medium">{product.name}</h4>
                                  <p className="text-sm text-base-content/70">Code: {product.code}</p>
                                  {product.category && (
                                    <p className="text-sm text-primary">Category: {product.category}</p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p className="font-bold">
                                    {product.OrderProduct.qty} {product.unit}
                                  </p>
                                  {product.price && (
                                    <p className="text-sm text-base-content/70">
                                      IDR {product.price.toLocaleString('id-ID')}
                                    </p>
                                  )}
                                </div>
                              </div>
                          </div>
                            </div>
                        ))}
                        <div className="divider"></div>
                        <div className="flex justify-between items-center font-bold">
                          <span>Total Quantity:</span>
                          <span>{selectedOrder.targetPcs} pcs</span>
                          </div>
                        </div>
                      ) : (
                      <p className="text-base-content/60 italic">No products assigned to this order</p>
                      )}
                    </div>

                    {/* Description & Notes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                      <label className="label-text font-medium">Description</label>
                      <p className="text-base-content">
                          {selectedOrder.description || 'No description provided'}
                        </p>
                      </div>
                      <div>
                      <label className="label-text font-medium">Customer Note</label>
                      <p className="text-base-content">
                          {selectedOrder.customerNote || 'No customer notes'}
                        </p>
                    </div>
                      </div>
                    </div>

                <div className="modal-action">
                      <button
                        onClick={() => setShowViewModal(false)}
                    className="px-6 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 flex items-center justify-center gap-2 font-medium"
                      >
                        Close
                      </button>
                </div>
              </div>
            </div>
          )}

          {/* Success Modal - Centered */}
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

          {/* Delete Confirmation Modal - Centered */}
          {showDeleteModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 modal-backdrop">
              <div className="bg-gradient-to-br from-white/95 via-white/90 to-white/95 backdrop-blur-xl rounded-3xl border border-gray-300 shadow-2xl max-w-md w-full">
                <div className="p-6">
                  <div className="flex items-center justify-center mb-6">
                    <div className="bg-gradient-to-br from-red-100 to-red-200 p-3 rounded-full">
                      <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 text-center mb-4">
                    Delete Order
                  </h3>
                  
                  <div className="mb-6">
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <p className="text-red-800 text-sm text-center">Are you sure you want to delete this order? This action cannot be undone.</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-center space-x-4">
                    <button
                      type="button"
                      className="px-6 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all duration-200 font-medium"
                      onClick={() => setShowDeleteModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-200 font-medium"
                      onClick={confirmDelete}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Dropdown Menu - Positioned */}
          {openDropdown && dropdownPosition.orderId && (
            <ul 
              className="dropdown-content z-50 menu p-2 shadow-xl bg-white rounded-xl border border-gray-200 w-48"
              style={{
                position: 'fixed',
                left: `${dropdownPosition.x}px`,
                top: `${dropdownPosition.y}px`,
                zIndex: 1001
              }}
            >
              <li>
                <button
                  onClick={() => {
                    setOpenDropdown(null);
                    router.push(`/dashboard/orders-management/${dropdownPosition.orderId}`)
                  }}
                  className="flex items-center gap-3 px-3 py-2 text-sm text-blue-700 hover:bg-gray-50 transition-colors duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                  </svg>
                  View Details
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setOpenDropdown(null);
                    router.push(`/dashboard/orders-management/${dropdownPosition.orderId}/edit`);
                  }}
                  className="flex items-center gap-3 px-3 py-2 text-sm text-green-700 hover:bg-gray-50 transition-colors duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                  Edit
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setOpenDropdown(null);
                    handleOrderLink(dropdownPosition.orderId);
                  }}
                  className="flex items-center gap-3 px-3 py-2 text-sm text-purple-700 hover:bg-gray-50 transition-colors duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
                  </svg>
                  OrderLink
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setOpenDropdown(null);
                    handleOrderLink(dropdownPosition.orderId, { open: true });
                  }}
                  className="flex items-center gap-3 px-3 py-2 text-sm text-indigo-700 hover:bg-gray-50 transition-colors duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
                  </svg>
                  Lihat OrderLink
                </button>
              </li>
              <div className="divider my-1"></div>
              <li>
                <button
                  onClick={() => {
                    setOpenDropdown(null);
                    setDropdownPosition({ x: 0, y: 0, orderId: null });
                    handleDelete(dropdownPosition.orderId);
                  }}
                  className="flex items-center gap-3 px-3 py-2 text-sm text-red-700 hover:bg-gray-50 transition-colors duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                  Delete
                </button>
              </li>
            </ul>
          )}
        </div>
      </DashboardLayout>
    </AuthWrapper>
  );
} 