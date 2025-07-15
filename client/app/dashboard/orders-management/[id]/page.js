'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/app/components/DashboardLayout';
import AuthWrapper from '@/app/components/AuthWrapper';
import ordersManagementAPI from '@/app/services/OrdersManagementAPI';

export default function OrderManagementDetail({ params }) {
  const router = useRouter();
  const { id } = use(params);
  const [order, setOrder] = useState(null);
  const [progressReports, setProgressReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Progress Report Form State
  const [progressForm, setProgressForm] = useState({
    pcsFinished: 0,
    note: '',
    photoUrl: '',
    resiPengiriman: '',
    tailorName: '',
    isSubmitting: false,
    error: null,
    success: null,
  });

  // Fetch order details and progress reports
  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use orders-management API for enhanced data
      const orderData = await ordersManagementAPI.getOrderDetails(id);
      setOrder(orderData);

      // Fetch progress reports with enhanced data
      const token = localStorage.getItem('token');
      const progressResponse = await fetch(`/api/progress-reports?orderId=${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        }
      });

      if (progressResponse.ok) {
        const progressData = await progressResponse.json();
        console.log('Enhanced progress reports loaded:', progressData);
        setProgressReports(progressData);
      } else {
        console.warn('Failed to fetch progress reports');
        setProgressReports([]);
      }

      // Pre-fill tailor name if assigned
      if (orderData.Tailor?.name) {
        setProgressForm(prev => ({
          ...prev,
          tailorName: orderData.Tailor.name
        }));
      }

    } catch (err) {
      setError('Error loading order details: ' + err.message);
      console.error('Error fetching order details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  // Handle progress form input changes
  const handleProgressInputChange = (e) => {
    const { name, value } = e.target;
    setProgressForm(prev => ({
      ...prev,
      [name]: value,
      error: null
    }));
  };

  // Handle photo upload
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // For now, we'll just store the file name
      // In a real implementation, you'd upload to a file storage service
      setProgressForm(prev => ({
        ...prev,
        photoUrl: file.name,
        error: null
      }));
    }
  };

  // Calculate remaining pieces
  const getRemainingPcs = () => {
    if (!order) return 0;
    return Math.max(0, order.targetPcs - order.completedPcs);
  };

  // Handle progress form submission
  const handleProgressSubmit = async (e) => {
    e.preventDefault();
    setProgressForm(prev => ({ ...prev, isSubmitting: true, error: null, success: null }));

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Validate form
      if (!progressForm.pcsFinished || progressForm.pcsFinished <= 0) {
        throw new Error('Please enter a valid number of pieces finished');
      }

      if (progressForm.pcsFinished > getRemainingPcs()) {
        throw new Error(`Cannot exceed remaining pieces (${getRemainingPcs()})`);
      }

      if (!progressForm.tailorName.trim()) {
        throw new Error('Tailor name is required');
      }

      const response = await fetch('/api/progress-reports', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: parseInt(id),
          pcsFinished: parseInt(progressForm.pcsFinished),
          note: progressForm.note,
          photoUrl: progressForm.photoUrl,
          resiPengiriman: progressForm.resiPengiriman,
          tailorName: progressForm.tailorName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit progress report');
      }

      setProgressForm(prev => ({
        ...prev,
        success: 'Progress report submitted successfully!',
        pcsFinished: 0,
        note: '',
        photoUrl: '',
        resiPengiriman: ''
      }));

      // Refresh order details and progress reports
      fetchOrderDetails();

    } catch (err) {
      setProgressForm(prev => ({
        ...prev,
        error: err.message
      }));
    } finally {
      setProgressForm(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  // Format date helper
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge color
  const getStatusColor = (status) => {
    const colors = {
      'CREATED': 'bg-blue-600 text-white',
      'CONFIRMED': 'bg-green-600 text-white',
      'PROCESSING': 'bg-yellow-600 text-white',
      'COMPLETED': 'bg-purple-600 text-white',
      'SHIPPED': 'bg-indigo-600 text-white',
      'DELIVERED': 'bg-emerald-600 text-white',
      'CANCELLED': 'bg-red-600 text-white',
      'NEED_MATERIAL': 'bg-orange-600 text-white'
    };
    return colors[status] || 'bg-gray-600 text-white';
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    const colors = {
      'LOW': 'bg-gray-600 text-white',
      'MEDIUM': 'bg-blue-600 text-white',
      'HIGH': 'bg-orange-600 text-white',
      'URGENT': 'bg-red-600 text-white'
    };
    return colors[priority] || 'bg-gray-600 text-white';
  };

  // Calculate progress percentage
  const getProgressPercentage = () => {
    if (!order || order.targetPcs === 0) return 0;
    return Math.round((order.completedPcs / order.targetPcs) * 100);
  };

  if (loading) {
    return (
      <AuthWrapper>
        <DashboardLayout>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </DashboardLayout>
      </AuthWrapper>
    );
  }

  if (error) {
    return (
      <AuthWrapper>
        <DashboardLayout>
          <div className="max-w-6xl mx-auto p-6">
            <div className="bg-red-600 border border-red-700 rounded-lg p-4">
              <p className="text-white">{error}</p>
              <button
                onClick={() => router.push('/dashboard/orders-management')}
                className="mt-2 text-red-100 hover:text-white underline"
              >
                Back to Orders Management
              </button>
            </div>
          </div>
        </DashboardLayout>
      </AuthWrapper>
    );
  }

  return (
    <AuthWrapper>
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-6xl mx-auto p-6 space-y-8">
            {/* Breadcrumb Navigation */}
            <nav className="flex mb-8" aria-label="Breadcrumb">
              <ol className="inline-flex items-center space-x-1 md:space-x-3">
                <li className="inline-flex items-center">
                  <button
                    onClick={() => router.push('/dashboard/orders-management')}
                    className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors duration-200"
                  >
                    Orders Management
                  </button>
                </li>
                <li>
                  <div className="flex items-center">
                    <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">
                      {order?.orderNumber || 'Order Details'}
                    </span>
                  </div>
                </li>
              </ol>
            </nav>

            {/* Header */}
            <div className="bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 backdrop-blur-xl rounded-3xl p-8 border border-gray-300 shadow-xl hover:shadow-2xl transition-all duration-500">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl flex-shrink-0">
                    <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                  </div>
                  <div className="flex flex-col justify-start">
                    <h1 className="text-3xl font-bold text-base-content bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent leading-tight">
                      {order?.orderNumber || 'Order Details'}
                    </h1>
                    <p className="text-base-content/60 leading-tight -mt-8">
                      Detailed order information and progress tracking
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => router.push(`/dashboard/orders-management/${id}/edit`)}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/20 transition-all duration-200 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                    Edit Order
                  </button>
                  <button
                    onClick={() => router.push('/dashboard/orders-management')}
                    className="px-4 py-2 bg-primary text-primary-content rounded-lg shadow-sm text-sm font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/20 transition-all duration-200 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                    </svg>
                    Back to List
                  </button>
                </div>
              </div>
            </div>

            {/* Success/Error Messages */}
            {success && (
              <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-300 rounded-3xl p-4 shadow-lg backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-green-200 rounded-xl">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-green-800 font-medium">{success}</span>
                </div>
              </div>
            )}

            <div className="space-y-8">
              {/* Order Details Card */}
              <div className="bg-gradient-to-br from-white/95 via-white/90 to-white/95 backdrop-blur-xl rounded-3xl border border-gray-300 shadow-xl hover:shadow-2xl transition-all duration-500">
                <div className="p-8">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl">
                      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-base-content">Order Information</h2>
                  </div>

                  <dl className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Order Number */}
                    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-300 shadow-sm hover:shadow-md transition-all duration-300">
                      <dt className="text-sm font-medium text-base-content/70 mb-2">Order Number</dt>
                      <dd className="text-sm text-base-content font-semibold">{order?.orderNumber || 'N/A'}</dd>
                    </div>

                    {/* Status */}
                    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-300 shadow-sm hover:shadow-md transition-all duration-300">
                      <dt className="text-sm font-medium text-base-content/70 mb-2">Status</dt>
                      <dd>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order?.status)}`}>
                          {order?.status || 'N/A'}
                        </span>
                      </dd>
                    </div>

                    {/* Priority */}
                    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-300 shadow-sm hover:shadow-md transition-all duration-300">
                      <dt className="text-sm font-medium text-base-content/70 mb-2">Priority</dt>
                      <dd>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(order?.priority)}`}>
                          {order?.priority || 'N/A'}
                        </span>
                      </dd>
                    </div>

                    {/* Due Date */}
                    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-300 shadow-sm hover:shadow-md transition-all duration-300">
                      <dt className="text-sm font-medium text-base-content/70 mb-2">Due Date</dt>
                      <dd className="text-sm text-base-content">
                        {order?.dueDate ? formatDate(order.dueDate) : 'No due date'}
                      </dd>
                    </div>

                    {/* Created At */}
                    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-300 shadow-sm hover:shadow-md transition-all duration-300">
                      <dt className="text-sm font-medium text-base-content/70 mb-2">Created</dt>
                      <dd className="text-sm text-base-content">
                        {order?.createdAt ? formatDate(order.createdAt) : 'N/A'}
                      </dd>
                    </div>

                    {/* Progress */}
                    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-300 shadow-sm hover:shadow-md transition-all duration-300">
                      <dt className="text-sm font-medium text-base-content/70 mb-2">Progress</dt>
                      <dd>
                        <div className="space-y-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full transition-all duration-300"
                              style={{ width: `${getProgressPercentage()}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-base-content/70">
                            {order?.completedPcs || 0} / {order?.targetPcs || 0} ({getProgressPercentage()}%)
                          </span>
                        </div>
                      </dd>
                    </div>

                    {/* Description */}
                    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-300 shadow-sm hover:shadow-md transition-all duration-300 md:col-span-2 lg:col-span-3">
                      <dt className="text-sm font-medium text-base-content/70 mb-2">Description</dt>
                      <dd className="text-sm text-base-content">
                        {order?.description || 'No description provided'}
                      </dd>
                    </div>

                    {/* Customer Note */}
                    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-300 shadow-sm hover:shadow-md transition-all duration-300 md:col-span-2 lg:col-span-3">
                      <dt className="text-sm font-medium text-base-content/70 mb-2">Customer Note</dt>
                      <dd className="text-sm text-base-content">
                        {order?.customerNote || 'No customer notes'}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Tailor Information Card */}
              {order?.Tailor && (
                <div className="bg-gradient-to-br from-white/95 via-white/90 to-white/95 backdrop-blur-xl rounded-3xl border border-gray-300 shadow-xl hover:shadow-2xl transition-all duration-500">
                  <div className="p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl">
                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                        </svg>
                      </div>
                      <h2 className="text-xl font-semibold text-base-content">Assigned Tailor</h2>
                    </div>

                    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-gray-300 shadow-sm hover:shadow-md transition-all duration-300">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="text-primary font-medium text-lg">
                              {order.Tailor.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-base-content">{order.Tailor.name}</h3>
                          {order.Tailor.email && (
                            <p className="text-sm text-base-content/70">{order.Tailor.email}</p>
                          )}
                          {order.Tailor.whatsappPhone && (
                            <a
                              href={`https://wa.me/${order.Tailor.whatsappPhone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center mt-2 px-3 py-1 bg-green-100 text-green-800 rounded-lg text-sm hover:bg-green-200 transition-colors duration-200"
                            >
                              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                              </svg>
                              WhatsApp
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Products Card */}
              <div className="bg-gradient-to-br from-white/95 via-white/90 to-white/95 backdrop-blur-xl rounded-3xl border border-gray-300 shadow-xl hover:shadow-2xl transition-all duration-500">
                <div className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl">
                      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                      </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-base-content">
                      Products ({order?.Products?.length || 0})
                    </h2>
                  </div>

                  <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-gray-300 shadow-sm overflow-hidden">
                    {order?.Products && order.Products.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50/50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-base-content/70 uppercase tracking-wider">
                                Product Name
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-base-content/70 uppercase tracking-wider">
                                Code
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-base-content/70 uppercase tracking-wider">
                                Category
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-base-content/70 uppercase tracking-wider">
                                Quantity
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-base-content/70 uppercase tracking-wider">
                                Unit
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-base-content/70 uppercase tracking-wider">
                                Price
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white/20 divide-y divide-gray-200">
                            {order.Products.map((product) => (
                              <tr key={product.id} className="hover:bg-white/40 transition-colors duration-200">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-base-content">
                                  {product.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-base-content/70">
                                  {product.code}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-base-content/70">
                                  {product.category || 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-base-content">
                                  {product.OrderProduct?.qty || 0}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-base-content/70">
                                  {product.unit}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-base-content/70">
                                  {product.price ? `IDR ${product.price.toLocaleString('id-ID')}` : 'N/A'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="px-6 py-8 text-center">
                        <p className="text-base-content/50">No products assigned to this order</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Enhanced Progress Reports History Card */}
              <div className="bg-gradient-to-br from-white/95 via-white/90 to-white/95 backdrop-blur-xl rounded-3xl border border-gray-300 shadow-xl hover:shadow-2xl transition-all duration-500">
                <div className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl">
                      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                      </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-base-content">
                      Progress History ({progressReports.length} reports)
                    </h2>
                  </div>

                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-gray-300 shadow-sm">
                    {progressReports.length === 0 ? (
                      <p className="text-base-content/50 text-center py-8">No progress reports yet</p>
                    ) : (
                      <div className="flow-root">
                        <ul className="-mb-8">
                          {progressReports.map((report, index) => {
                            // Extract pieces completed from reportText for backward compatibility
                            const pcsMatch = report.reportText?.match(/Completed (\d+) pieces/);
                            const pcsCompleted = pcsMatch ? pcsMatch[1] : report.percentage || 'Unknown';

                            return (
                              <li key={report.id}>
                                <div className="relative pb-8">
                                  {index !== progressReports.length - 1 && (
                                    <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                                  )}
                                  <div className="relative flex space-x-3">
                                    <div className="flex-shrink-0">
                                      <span className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                                        <svg className="h-5 w-5 text-primary-content" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                      </span>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="text-sm">
                                        <span className="font-medium text-base-content">
                                          {pcsCompleted} pieces completed
                                        </span>
                                        <span className="text-base-content/70 ml-2">
                                          by {report.tailorName || report.user?.name || 'Unknown'}
                                        </span>
                                        {report.totalProductsUpdated > 0 && (
                                          <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                                            {report.totalProductsUpdated} products
                                          </span>
                                        )}
                                      </div>

                                      {report.reportText && (
                                        <p className="mt-1 text-sm text-base-content/70">{report.reportText}</p>
                                      )}

                                      {/* Enhanced Product Summary with Cumulative Progress */}
                                      {report.productSummary && report.productSummary.length > 0 && (
                                        <div className="mt-2 space-y-1">
                                          {report.productSummary.map((product, idx) => (
                                            <div key={idx} className="text-xs bg-white/40 rounded p-2 border border-gray-200">
                                              <div className="flex justify-between items-center">
                                                <span className="font-medium text-base-content">{product.productName}</span>
                                                <div className="flex items-center space-x-2">
                                                  <span className="text-base-content/70">
                                                    {product.itemsCompleted}/{product.itemsTarget} pieces
                                                  </span>
                                                  {product.percentage !== undefined && (
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.percentage === 100
                                                      ? 'bg-green-100 text-green-700'
                                                      : product.percentage >= 50
                                                        ? 'bg-yellow-100 text-yellow-700'
                                                        : 'bg-blue-100 text-blue-700'
                                                      }`}>
                                                      {product.percentage}%
                                                    </span>
                                                  )}
                                                </div>
                                              </div>

                                              {/* Show progress in this specific report */}
                                              {product.itemsCompletedThisReport && product.itemsCompletedThisReport > 0 && (
                                                <p className="text-primary mt-1">
                                                  +{product.itemsCompletedThisReport} pieces completed in this update
                                                </p>
                                              )}

                                              {product.notes && (
                                                <p className="text-base-content/70 mt-1">{product.notes}</p>
                                              )}

                                              {product.status === 'completed' && product.completionDate && (
                                                <p className="text-success mt-1 font-medium">
                                                  ✅ Product completed at this point: {formatDate(product.completionDate)}
                                                </p>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      )}

                                      {/* Enhanced Photo Display */}
                                      {report.photos && report.photos.length > 0 && (
                                        <div className="mt-3">
                                          <div className="text-xs text-primary mb-2">
                                            📷 {report.photos.length} photo{report.photos.length > 1 ? 's' : ''} attached
                                          </div>
                                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                            {report.photos.slice(0, 6).map((photo, photoIdx) => (
                                              <div key={photoIdx} className="relative group">
                                                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border">
                                                  {photo.url ? (
                                                    <img
                                                      src={photo.thumbnailUrl || photo.url}
                                                      alt={photo.description || `Progress photo ${photoIdx + 1}`}
                                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                                      onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        e.target.nextSibling.style.display = 'flex';
                                                      }}
                                                    />
                                                  ) : null}
                                                  <div className="w-full h-full flex items-center justify-center text-gray-400 hidden">
                                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                  </div>
                                                </div>
                                                {photo.description && (
                                                  <p className="text-xs text-base-content/50 mt-1 truncate" title={photo.description}>
                                                    {photo.description}
                                                  </p>
                                                )}
                                                {photo.source === 'product_progress' && (
                                                  <span className="absolute top-1 right-1 bg-success text-success-content text-xs px-1 rounded">
                                                    Product
                                                  </span>
                                                )}
                                              </div>
                                            ))}
                                            {report.photos.length > 6 && (
                                              <div className="aspect-square bg-gray-100 rounded-lg border flex items-center justify-center">
                                                <span className="text-sm text-base-content/50">
                                                  +{report.photos.length - 6} more
                                                </span>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )}

                                      <div className="mt-2 flex items-center justify-between">
                                        <p className="text-xs text-base-content/50">
                                          {formatDate(report.reportedAt || report.createdAt)}
                                        </p>
                                        {report.percentage && (
                                          <span className="text-xs bg-success/20 text-success px-2 py-1 rounded-full">
                                            {report.percentage}% progress
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthWrapper>
  );
} 