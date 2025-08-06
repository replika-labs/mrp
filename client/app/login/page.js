'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      // User is already logged in, redirect to dashboard
      router.push('/dashboard');
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors
    
    try {
      // Show loading state (you could add a loading state if you want)
      const res = await axios.post('/api/auth/login', { email, password });
      
      if (res.data && res.data.token) {
        // Store auth data in localStorage
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        
        // Redirect to dashboard
        router.push('/dashboard');
      } else {
        // Handle unexpected response format
        throw new Error('Invalid server response');
      }
    } catch (err) {
      console.error('Login Error:', err.response ? err.response.data : err.message);
      
      // Display appropriate error message in a more friendly way
      if (err.response?.status === 401) {
        setError('Email atau kata sandi tidak sesuai. Silakan coba lagi.');
      } else if (err.response?.status === 429) {
        setError('Terlalu banyak percobaan login. Silakan tunggu beberapa saat.');
      } else {
        setError(err.response?.data?.message || 'Gagal masuk. Mohon coba lagi nanti.');
      }
      
      // Clear error after some time
      setTimeout(() => setError(''), 5000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 flex items-center justify-center p-6">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="w-full h-full bg-gradient-to-br from-blue-100/20 to-gray-200/20"></div>
      </div>
      
      <div className="relative z-10 w-full max-w-md">
        {/* Main Login Container */}
        <div className="bg-gradient-to-br from-white/95 via-white/90 to-white/95 backdrop-blur-xl rounded-3xl border border-gray-300 shadow-2xl hover:shadow-3xl transition-all duration-500 p-8">
          
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-2xl">
                <div className="text-3xl">🏢</div>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Halo, Selamat Datang!</h1>
            <p className="text-gray-600">Silakan masuk untuk melanjutkan</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-gray-300 rounded-xl p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-300 shadow-sm">
              <label htmlFor="email" className="text-xs font-semibold text-gray-500 block mb-2 uppercase tracking-wider">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-12 px-4 py-3 text-sm bg-white/80 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200"
                placeholder="Masukkan email Anda"
                required
              />
            </div>

            {/* Password Field */}
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-300 shadow-sm">
              <label htmlFor="password" className="text-xs font-semibold text-gray-500 block mb-2 uppercase tracking-wider">
                Kata Sandi
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 px-4 py-3 text-sm bg-white/80 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200"
                placeholder="Masukkan kata sandi Anda"
                required
              />
            </div>

            {/* Login Button */}
              <button
                type="submit"
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
              Masuk
              </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Sistem Produksi dan Inventaris v2.0
            </p>
            <div className="mt-4 flex items-center justify-center space-x-4 text-xs text-gray-400">
              <span>© 2024</span>
              <span>•</span>
              <span>Login Aman</span>
            </div>
          </div>
        </div>

        {/* Additional Info Card */}
        <div className="mt-6 bg-gradient-to-br from-blue-600/95 via-blue-700/90 to-blue-600/95 backdrop-blur-xl rounded-3xl border border-gray-300 shadow-xl p-6 text-white">
          <h3 className="text-lg font-bold mb-3">Fitur Sistem</h3>
          <ul className="text-sm space-y-2 opacity-90">
            <li>• Kelola persediaan barang dengan mudah</li>
            <li>• Pantau status pesanan secara langsung</li>
            <li>• Lacak stok bahan dengan cepat</li>
            <li>• Laporan kemajuan produksi terintegrasi</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 