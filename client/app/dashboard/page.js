'use client';

import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Box,
  ChevronRight,
  Clock,
  Package,
  Plus,
  Target,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis, YAxis
} from 'recharts';

const API_ENDPOINTS = {
  DASHBOARD_SUMMARY: '/api/dashboard/summary',
  MONTHLY_STATS: '/api/dashboard/monthly-stats'
};

// Helper Components
const DataUnavailable = ({ title, message = "No data available" }) => (
  <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center">
    <div className="bg-gradient-to-br from-gray-500/10 to-gray-600/20 p-4 rounded-2xl mb-4">
      <AlertCircle className="w-8 h-8 text-gray-500 opacity-60" />
    </div>
    <h3 className="font-semibold text-base-content mb-2">{title}</h3>
    <p className="text-sm text-base-content/60">{message}</p>
  </div>
);

const StatCard = ({ icon: Icon, label, value, trend, href, loading }) => (
  <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-base-100 via-base-100 to-base-200/30 backdrop-blur-xl border border-gray-300 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 h-full">
    {/* Subtle gradient overlay */}
    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
    
    <div className="card-body p-6 relative z-10 h-full flex flex-col justify-between">
      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-base-300/50 rounded-full w-20"></div>
          <div className="h-8 bg-base-300/50 rounded-full w-16"></div>
        </div>
      ) : (
        <>
          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
                <div className="text-xs font-semibold text-base-content/60 mb-3 tracking-wider uppercase leading-tight">{label}</div>
                <div className="text-3xl font-bold text-base-content mb-3 leading-none">{value}</div>
              </div>
              <div className="bg-gradient-to-br from-primary/10 to-primary/20 p-3 rounded-xl group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </div>
            </div>
            
              {trend && (
              <div className="flex items-center text-sm mb-4">
                <div className="flex items-center bg-success/10 text-success px-3 py-1.5 rounded-full">
                  <TrendingUp className="w-3 h-3 mr-2" />
                  <span className="font-semibold text-xs">+{trend}%</span>
                </div>
                <span className="text-base-content/50 ml-3 text-xs">vs last month</span>
                </div>
              )}
          </div>
          
          {href && (
            <div className="flex justify-end mt-auto pt-4">
            <Link
              href={href}
                className="btn bg-base-200 hover:bg-base-300 border border-gray-300 hover:border-gray-400 rounded-lg px-2 py-1 hover:scale-105 transition-all duration-300 shadow-md hover:shadow-lg text-base-content font-medium text-xs flex items-center gap-1 h-7"
            >
                <span>View Details</span>
                <ChevronRight className="w-3 h-3 flex-shrink-0" />
            </Link>
            </div>
          )}
        </>
      )}
    </div>
  </div>
);

const ChartCard = ({ title, height = 300, children }) => (
  <div className="group rounded-3xl bg-gradient-to-br from-base-100 via-base-100 to-base-200/30 backdrop-blur-xl border border-gray-300 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.01] overflow-hidden">
    {/* Subtle animated background */}
    <div className="absolute inset-0 bg-gradient-to-br from-primary/3 via-transparent to-secondary/3 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
    
    <div className="card-body p-6 relative z-10">
      <h3 className="card-title text-base font-semibold text-base-content mb-4 flex items-center">
        {title}
        <div className="ml-auto w-2 h-2 bg-primary rounded-full animate-pulse"></div>
      </h3>
      <div style={{ height }} className="w-full relative">
        {children}
      </div>
    </div>
  </div>
);

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Authentication token not found');
        console.log("4");
        const response = await fetch(API_ENDPOINTS.DASHBOARD_SUMMARY, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        // if (!response.ok) {
        //   const errorData = await response.json().catch(() => ({}));
        //   throw new Error(errorData.message || 'Failed to fetch dashboard data');
        // }
        console.log("6");

        const data = await response.json();
        setSummaryData(data);

        // Get user data
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (err) {
        console.error('Dashboard data fetch error:', err);
        setError(err.message);
        // Show error for 5 seconds
        setTimeout(() => setError(''), 5000);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const renderOrderTrendChart = () => {
    if (!summaryData?.orderTrend || summaryData.orderTrend.length === 0) {
      return <DataUnavailable title="Order Trend" message="No order data available" />;
    }

    // Transform data for chart
    const chartData = summaryData.orderTrend.map(item => ({
      date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      orders: item.count
    }));

    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--b3))" strokeOpacity={0.3} />
          <XAxis dataKey="date" stroke="hsl(var(--bc))" fontSize={12} />
          <YAxis stroke="hsl(var(--bc))" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--b1))',
              border: '1px solid hsl(var(--b3))',
              borderRadius: '16px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
              backdropFilter: 'blur(20px)'
            }}
          />
          <Line
            type="monotone"
            dataKey="orders"
            stroke="hsl(var(--p))"
            strokeWidth={4}
            dot={{ fill: "hsl(var(--p))", strokeWidth: 2, r: 5 }}
            activeDot={{ r: 8, strokeWidth: 0, filter: 'drop-shadow(0 0 8px hsl(var(--p)))' }}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  const renderProductionTrendChart = () => {
    if (!summaryData?.productionTrend || summaryData.productionTrend.length === 0) {
      return <DataUnavailable title="Production Overview" message="No production data available" />;
    }

    // Transform data for chart
    const chartData = summaryData.productionTrend.map(item => ({
      date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      completionRate: item.completionRate
    }));

    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--b3))" strokeOpacity={0.3} />
          <XAxis dataKey="date" stroke="hsl(var(--bc))" fontSize={12} />
          <YAxis stroke="hsl(var(--bc))" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--b1))',
              border: '1px solid hsl(var(--b3))',
              borderRadius: '16px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
              backdropFilter: 'blur(20px)'
            }}
          />
          <Bar
            dataKey="completionRate"
            fill="url(#primaryGradient)"
            radius={[8, 8, 0, 0]}
          />
          <defs>
            <linearGradient id="primaryGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--p))" />
              <stop offset="100%" stopColor="hsl(var(--p))" stopOpacity={0.6} />
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
    );
  };

  if (loading) {
    return (
      <div className="space-y-8 p-2">
        <div className="animate-pulse space-y-8">
          <div className="h-12 bg-gradient-to-r from-base-300/50 to-base-300/30 rounded-3xl w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {[...Array(4)].map((_, i) => (
              <StatCard key={i} loading={true} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
      <div className="space-y-8 p-2">
      {error && (
          <div className="alert alert-error shadow-2xl rounded-2xl border border-error/20 bg-gradient-to-r from-error/10 to-error/5 backdrop-blur-xl">
            <AlertTriangle className="w-6 h-6" />
            <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Welcome Section */}
      <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-secondary/5 to-primary/5 backdrop-blur-xl border border-gray-300 shadow-2xl hover:drop-shadow-2xl transition-all duration-500 hover:scale-[1.01] hover:-translate-y-1">
        {/* Animated background pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-50 group-hover:opacity-70 transition-opacity duration-500"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-primary/10 to-transparent rounded-full blur-3xl group-hover:from-primary/15 transition-all duration-500"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-secondary/10 to-transparent rounded-full blur-3xl group-hover:from-secondary/15 transition-all duration-500"></div>
        
        <div className="relative z-10 p-8 lg:p-12">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
            {/* Left Content */}
            <div className="flex-1">
              <h1 className="text-xl lg:text-2xl font-bold text-base-content mb-2 leading-tight">
                Welcome back, {user?.name || 'Hijab Store Administrator'}! 👋
          </h1>
              <p className="text-xs lg:text-sm text-base-content/50 leading-relaxed max-w-2xl">
                Here&apos;s what&apos;s happening with your garment today. Monitor your operations and stay on top of your production.
          </p>
        </div>
            
            {/* Right Actions */}
            <div className="flex flex-col gap-3 shrink-0 min-w-[160px] group-hover:translate-x-1 transition-transform duration-500">
              <Link 
                href="/dashboard/materials/add" 
                className="btn bg-base-200 hover:bg-base-300 border border-gray-300 hover:border-gray-400 rounded-xl px-3 py-2 hover:scale-105 transition-all duration-300 shadow-md hover:shadow-lg text-base-content font-medium text-sm flex items-center justify-start gap-2 h-10"
              >
                <Plus className="w-4 h-4 flex-shrink-0" />
                <span>Add Material</span>
              </Link>
              {/* <Link 
                href="/dashboard/reports" 
                className="btn bg-base-200 hover:bg-base-300 border border-gray-300 hover:border-gray-400 rounded-xl px-3 py-2 hover:scale-105 transition-all duration-300 shadow-md hover:shadow-lg text-base-content font-medium text-sm flex items-center justify-start gap-2 h-10"
              >
                <Activity className="w-4 h-4 flex-shrink-0" />
                <span>View Reports</span>
              </Link> */}
            </div>
          </div>
        </div>
      </div>

      {/* Critical Materials Alert */}
      {summaryData?.criticalMaterials?.length > 0 && (
        <div className="alert alert-warning shadow-2xl rounded-2xl border border-warning/20 bg-gradient-to-r from-warning/10 to-warning/5 backdrop-blur-xl">
          <AlertCircle className="w-6 h-6" />
              <div>
            <h3 className="font-bold">Critical Material Stock Alert</h3>
            <div className="text-sm">
                  {summaryData.criticalMaterials.length} materials are below minimum stock levels
            </div>
          </div>
          <div>
            <Link
              href="/dashboard/materials?filter=critical"
              className="btn bg-base-200 hover:bg-base-300 border border-gray-300 hover:border-gray-400 rounded-lg px-3 py-1 hover:scale-105 transition-all duration-300 shadow-md hover:shadow-lg text-base-content font-medium text-xs flex items-center gap-1 h-7"
            >
              <span>View Materials</span>
            </Link>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
        <StatCard
          icon={Package}
          label="Total Fabrics"
          value={summaryData?.materialStats?.total || 8}
          trend={summaryData?.materialStats?.trend}
          href="/dashboard/materials"
        />
        <StatCard
          icon={Target}
          label="Active Orders"
          value={summaryData?.orderStats?.processing || 0}
          href="/dashboard/orders-management"
        />
        <StatCard
          icon={Box}
          label="Out of Stock"
          value={summaryData?.materialStats?.outOfStockCount || 0}
          href="/dashboard/materials?filter=out-of-stock"
        />
        <StatCard
          icon={Clock}
          label="Completion Rate"
          value={`${summaryData?.orderStats?.avgCompletionPercentage || 0}%`}
          href="/dashboard/orders-management"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <ChartCard title={
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/20 p-2 rounded-lg">
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <span>Order Trend</span>
          </div>
        }>
          {renderOrderTrendChart()}
        </ChartCard>

        <ChartCard title={
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/20 p-2 rounded-lg">
              <Package className="w-4 h-4 text-purple-600" />
            </div>
            <span>Production Overview</span>
          </div>
        }>
          {renderProductionTrendChart()}
        </ChartCard>
      </div>

      {/* Recent Activity */}
      <div className="group rounded-3xl bg-gradient-to-br from-base-100 via-base-100 to-base-200/30 backdrop-blur-xl border border-gray-300 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.01] hover:-translate-y-1 overflow-hidden">
        {/* Subtle animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/3 via-transparent to-secondary/3 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
        
        <div className="card-body p-6 relative z-10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="card-title text-base font-semibold text-base-content flex items-center">
              <div className="flex items-center gap-2">
                <div className="bg-gradient-to-br from-green-500/10 to-green-600/20 p-2 rounded-lg">
                  <Clock className="w-4 h-4 text-green-600" />
                </div>
                <span>Recent Activity</span>
              </div>
              <div className="ml-3 w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            </h3>
            <Link
              href="#"
              className="btn bg-base-200 hover:bg-base-300 border border-gray-300 hover:border-gray-400 rounded-lg px-3 py-1 hover:scale-105 transition-all duration-300 shadow-md hover:shadow-lg text-base-content font-medium text-xs flex items-center gap-1 h-7"
            >
              <span>View All</span>
              <ChevronRight className="w-3 h-3 flex-shrink-0" />
            </Link>
          </div>

          {summaryData?.recentActivities && summaryData.recentActivities.length > 0 ? (
            <div className="space-y-4">
              {summaryData.recentActivities.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start gap-5 p-5 rounded-2xl hover:bg-gradient-to-r hover:from-base-200/30 hover:to-base-200/10 transition-all duration-300 border border-gray-300 hover:border-gray-400 hover:shadow-lg group/item group-hover:translate-x-2"
                >
                  <div className="avatar placeholder">
                    <div className="bg-gradient-to-br from-primary/10 to-primary/20 text-primary rounded-2xl w-12 h-12 group-hover/item:scale-110 transition-transform duration-300">
                      <Activity className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-base-content group-hover/item:text-primary transition-colors duration-300">{activity.description}</p>
                    <p className="text-sm text-base-content/60 mt-2">
                      {new Date(activity.timestamp).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <DataUnavailable title="Recent Activity" message="No recent activity to display" />
          )}
        </div>
      </div>
    </div>
  );
}