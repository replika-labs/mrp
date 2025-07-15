'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AuthWrapper from '../../../components/AuthWrapper';
import DashboardLayout from '../../../components/DashboardLayout.js';
import Link from 'next/link';

export default function ProductDetailPage() {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const router = useRouter();
  const params = useParams();
  const productId = params.id;

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

  // Fetch product details
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        const response = await fetch(`http://localhost:8080/api/products/${productId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch product details');
        }

        const data = await response.json();
        if (data.success && data.product) {
          setProduct(data.product);
        } else {
          setProduct(data);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        setError('Failed to load product details');
      } finally {
        setLoading(false);
      }
    };

    if (user && productId) {
      fetchProduct();
    }
  }, [user, productId]);

  // Handle product deletion
  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        router.push('/dashboard/products');
      } else {
        throw new Error('Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      setError('Failed to delete product');
    }
  };

  // Handle status toggle
  const handleStatusToggle = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !product.isActive
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const updatedProduct = data.success && data.product ? data.product : data;
        setProduct(updatedProduct);
      } else {
        throw new Error('Failed to update product status');
      }
    } catch (error) {
      console.error('Error updating product status:', error);
      setError('Failed to update product status');
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <AuthWrapper>
        <DashboardLayout user={user}>
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </DashboardLayout>
      </AuthWrapper>
    );
  }

  if (error || !product) {
    return (
      <AuthWrapper>
        <DashboardLayout user={user}>
          <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-4xl mx-auto space-y-6">
              <div className="bg-red-600 border border-gray-300 text-white px-4 py-3 rounded-xl">
              {error || 'Product not found'}
            </div>
            <Link
              href="/dashboard/products"
                className="inline-block px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 border border-gray-300"
            >
              ← Back to Products
            </Link>
            </div>
          </div>
        </DashboardLayout>
      </AuthWrapper>
    );
  }

  return (
    <AuthWrapper>
      <DashboardLayout user={user}>
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-6xl mx-auto">
          {/* Header */}
            <div className="mb-8">
              <Link
                href="/dashboard/products"
                className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block"
              >
                ← Back to Products
              </Link>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
              <p className="text-gray-600">Product Code: {product.code}</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleStatusToggle}
                    className={`px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition-all duration-300 hover:scale-105 shadow-lg ${product.isActive
                  ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                  : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
              >
                {product.isActive ? 'Deactivate' : 'Activate'}
              </button>
              {user?.role === 'admin' && (
                <Link
                  href={`/dashboard/products/${product.id}/stock`}
                      className="px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all duration-300 hover:scale-105 shadow-lg"
                >
                  Manage Stock
                </Link>
              )}
              <Link
                href={`/dashboard/products/${product.id}/edit`}
                    className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all duration-300 hover:scale-105 shadow-lg"
              >
                Edit Product
              </Link>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                    className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 cursor-pointer transition-all duration-300 hover:scale-105 shadow-lg"
              >
                Delete
              </button>
                </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
              <div className="bg-red-600 border border-gray-300 text-white px-4 py-3 rounded-xl mb-6">
              {error}
            </div>
          )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Photo Gallery */}
              <div className="bg-gradient-to-br from-white/95 via-white/90 to-white/95 backdrop-blur-xl rounded-3xl border border-gray-300 shadow-xl hover:shadow-2xl transition-all duration-300 p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Photos</h2>

              {product.photos && product.photos.length > 0 ? (
                <div className="space-y-6">
                  {/* Main Photo */}
                  <div className="aspect-square bg-gray-100/50 rounded-2xl overflow-hidden shadow-lg border border-gray-300">
                    <img
                      src={`http://localhost:8080${product.photos[currentPhotoIndex]?.photoPath}`}
                      alt={product.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Thumbnail Navigation */}
                  {product.photos.length > 1 && (
                    <div className="grid grid-cols-6 gap-3">
                      {product.photos.map((photo, index) => (
                        <button
                          key={photo.id}
                          onClick={() => setCurrentPhotoIndex(index)}
                          className={`aspect-square bg-gray-100/50 rounded-xl overflow-hidden border-2 transition-all duration-300 hover:scale-105 ${index === currentPhotoIndex ? 'border-blue-500 shadow-lg' : 'border-gray-300'
                            }`}
                        >
                          <img
                            src={`http://localhost:8080${photo.thumbnailPath || photo.photoPath}`}
                            alt={`${product.name} ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-square bg-gray-100/50 rounded-2xl flex items-center justify-center border border-gray-300 shadow-lg">
                  <div className="text-center text-gray-400">
                    <div className="text-4xl mb-2">📷</div>
                    <p>No photos available</p>
                  </div>
                </div>
              )}
            </div>

            {/* Product Information */}
            <div className="space-y-6">
              {/* Basic Info */}
                <div className="bg-gradient-to-br from-white/95 via-white/90 to-white/95 backdrop-blur-xl rounded-3xl border border-gray-300 shadow-xl hover:shadow-2xl transition-all duration-300 p-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Basic Information</h2>

                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-300 shadow-sm">
                        <label className="text-xs font-semibold text-gray-500 block mb-2 uppercase tracking-wider">Product Name</label>
                        <p className="text-gray-900 font-semibold">{product.name}</p>
                    </div>
                      <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-300 shadow-sm">
                        <label className="text-xs font-semibold text-gray-500 block mb-2 uppercase tracking-wider">Product Code</label>
                        <p className="text-gray-900 font-mono font-semibold">{product.code}</p>
                    </div>
                  </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-300 shadow-sm">
                        <label className="text-xs font-semibold text-gray-500 block mb-2 uppercase tracking-wider">Category</label>
                        <p className="text-gray-900 font-semibold">{product.category || '-'}</p>
                    </div>
                      <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-300 shadow-sm">
                        <label className="text-xs font-semibold text-gray-500 block mb-2 uppercase tracking-wider">Status</label>
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${product.isActive
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-600 text-white'
                        }`}>
                        {product.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  {product.baseMaterial && (
                      <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-300 shadow-sm">
                        <label className="text-xs font-semibold text-gray-500 block mb-2 uppercase tracking-wider">Base Material</label>
                        <p className="text-gray-900 font-semibold">{product.baseMaterial.name} ({product.baseMaterial.code})</p>
                    </div>
                  )}

                  {product.description && (
                      <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-300 shadow-sm">
                        <label className="text-xs font-semibold text-gray-500 block mb-2 uppercase tracking-wider">Description</label>
                        <p className="text-gray-900 leading-relaxed">{product.description}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Pricing & Inventory */}
                <div className="bg-gradient-to-br from-white/95 via-white/90 to-white/95 backdrop-blur-xl rounded-3xl border border-gray-300 shadow-xl hover:shadow-2xl transition-all duration-300 p-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Pricing & Inventory</h2>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-300 shadow-sm">
                      <label className="text-xs font-semibold text-gray-500 block mb-2 uppercase tracking-wider">Base Price</label>
                      <p className="text-lg font-bold text-gray-900">
                      {product.price ? `Rp ${Number(product.price).toLocaleString('id-ID')}` : '-'}
                    </p>
                  </div>
                    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-300 shadow-sm">
                      <label className="text-xs font-semibold text-gray-500 block mb-2 uppercase tracking-wider">Final Price</label>
                    <p className="text-2xl font-bold text-blue-600">
                      {product.finalPrice ? `Rp ${Number(product.finalPrice).toLocaleString('id-ID')}` : '-'}
                    </p>
                    {product.productVariation?.priceAdjustment && (
                        <p className="text-sm text-green-600 font-medium mt-1">
                        +Rp {Number(product.productVariation.priceAdjustment).toLocaleString('id-ID')} variation
                      </p>
                    )}
                  </div>
                </div>

                  <div className="mt-6 grid grid-cols-2 gap-6">
                    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-300 shadow-sm">
                      <label className="text-xs font-semibold text-gray-500 block mb-2 uppercase tracking-wider">Current Stock</label>
                    <p className="text-2xl font-bold text-gray-900">
                      {product.qtyOnHand} {product.unit}
                    </p>
                </div>

                {/* Stock Level Indicator */}
                    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-300 shadow-sm">
                      <label className="text-xs font-semibold text-gray-500 block mb-2 uppercase tracking-wider">Stock Level</label>
                      <div className={`px-3 py-2 rounded-xl text-sm font-semibold ${product.qtyOnHand === 0
                    ? 'bg-red-600 text-white'
                    : product.qtyOnHand < 10
                      ? 'bg-yellow-600 text-white'
                      : 'bg-green-600 text-white'
                    }`}>
                    {product.qtyOnHand === 0
                      ? 'Out of Stock'
                      : product.qtyOnHand < 10
                        ? 'Low Stock'
                        : 'In Stock'
                    }
                      </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Sections */}
          <div className="space-y-12 mt-16">
          {/* Product Variation */}
          {product.productVariation && (
                <div className="bg-gradient-to-br from-white/95 via-white/90 to-white/95 backdrop-blur-xl rounded-3xl border border-gray-300 shadow-xl hover:shadow-2xl transition-all duration-300 p-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Product Variation</h2>

                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-gray-300 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                        <h3 className="font-semibold text-gray-900 text-lg">{product.productVariation.variationType}: {product.productVariation.variationValue}</h3>
                    {product.productVariation.priceAdjustment && (
                          <p className="text-sm text-gray-500 mt-2">
                        Price Adjustment: {product.productVariation.priceAdjustment > 0 ? '+' : ''}
                        Rp {Number(product.productVariation.priceAdjustment).toLocaleString('id-ID')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Product Color */}
          {product.productColor && (
                <div className="bg-gradient-to-br from-white/95 via-white/90 to-white/95 backdrop-blur-xl rounded-3xl border border-gray-300 shadow-xl hover:shadow-2xl transition-all duration-300 p-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Product Color</h2>

                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-gray-300 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                        <h3 className="font-semibold text-gray-900 text-lg">{product.productColor.colorName}</h3>
                    {product.productColor.colorCode && (
                          <p className="text-sm text-gray-500 mt-2">Code: {product.productColor.colorCode}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

              {/* Record Information */}
              <div className="bg-gradient-to-br from-white/95 via-white/90 to-white/95 backdrop-blur-xl rounded-3xl border border-gray-300 shadow-xl hover:shadow-2xl transition-all duration-300 p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Record Information</h2>

                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-300 shadow-sm">
                    <label className="text-xs font-semibold text-gray-500 block mb-2 uppercase tracking-wider">Created At</label>
                    <p className="text-gray-900 font-semibold">
                  {new Date(product.createdAt).toLocaleString('id-ID')}
                </p>
              </div>
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-300 shadow-sm">
                    <label className="text-xs font-semibold text-gray-500 block mb-2 uppercase tracking-wider">Last Updated</label>
                    <p className="text-gray-900 font-semibold">
                  {new Date(product.updatedAt).toLocaleString('id-ID')}
                </p>
                  </div>
              </div>
            </div>
          </div>

          {/* Delete Confirmation Modal */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
              <div className="flex min-h-screen items-center justify-center p-4 md:p-6">
                <div className="bg-gradient-to-br from-white/95 via-white/90 to-white/95 backdrop-blur-xl rounded-3xl max-w-md w-full shadow-2xl border border-gray-300 hover:shadow-3xl transition-all duration-300">
                  <div className="p-8">
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-red-100 to-red-200 rounded-xl">
                          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </div>
                        <h3 className="text-xl font-bold text-base-content">Delete Product</h3>
                      </div>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="text-base-content/60 hover:text-base-content transition-colors p-2 rounded-xl hover:bg-gray-100/50 backdrop-blur-sm"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-gray-300 shadow-sm mb-6">
                      <p className="text-base-content leading-relaxed">
                        Are you sure you want to delete <span className="font-semibold">&quot;{product.name}&quot;</span>?
                      </p>
                      <p className="text-red-600 font-medium mt-3 text-sm">
                        This action cannot be undone.
                </p>
                    </div>

                    <div className="flex justify-end gap-4 pt-6 mt-6 border-t border-gray-300/50">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                        className="px-6 py-2 h-10 text-sm bg-white/80 border border-gray-300 text-base-content/70 hover:text-base-content rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
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
          </div>
        </div>
      </DashboardLayout>
    </AuthWrapper>
  );
} 