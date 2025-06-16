'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  AlertTriangle,
  Clock,
  TrendingUp,
  Package,
  Users,
  Target,
  ExternalLink,
  Calendar,
  Activity,
  Plus,
  ChevronRight,
  Box,
  AlertCircle
} from 'lucide-react';

const API_ENDPOINTS = {
  DASHBOARD_SUMMARY: '/api/dashboard/summary',
  MONTHLY_STATS: '/api/dashboard/monthly-stats'
};

// Helper Components
const DataUnavailable = ({ title, message = "No data available" }) => (
  <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center">
    <div className="text-base-content/30 mb-3 text-2xl">📊</div>
    <h3 className="font-medium text-base-content/70 mb-1">{title}</h3>
    <p className="text-sm text-base-content/50">{message}</p>
  </div>
);

const StatCard = ({ icon: Icon, label, value, trend, href, loading }) => (
  <div className="card bg-base-100 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl border border-base-200">
    <div className="card-body p-6">
      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-base-300 rounded-lg w-24"></div>
          <div className="h-8 bg-base-300 rounded-lg w-16"></div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="text-sm font-medium text-base-content/70 mb-2">{label}</div>
              <div className="text-2xl font-semibold tracking-tight">{value}</div>
              {trend && (
                <div className="mt-2 flex items-center text-xs">
                  <TrendingUp className="w-3 h-3 mr-1 text-success" />
                  <span className="text-success">+{trend}%</span>
                  <span className="text-base-content/50 ml-1">vs last month</span>
                </div>
              )}
            </div>
            <div className="rounded-xl bg-primary/10 p-3">
              <Icon className="w-5 h-5 text-primary" />
            </div>
          </div>
          {href && (
            <Link
              href={href}
              className="inline-flex items-center mt-4 text-xs font-medium text-primary hover:text-primary/70 transition-colors"
            >
              View Details
              <ChevronRight className="w-3 h-3 ml-1" />
            </Link>
          )}
        </>
      )}
    </div>
  </div>
);

const ChartCard = ({ title, height = 300, children }) => (
  <div className="card bg-base-100 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl border border-base-200">
    <div className="card-body p-6">
      <h3 className="card-title text-base font-medium text-base-content/80 mb-6">{title}</h3>
      <div style={{ height }} className="w-full">
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

        const response = await fetch(API_ENDPOINTS.DASHBOARD_SUMMARY, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to fetch dashboard data');
        }

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
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" stroke="#888" fontSize={12} />
          <YAxis stroke="#888" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #f0f0f0',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}
          />
          <Line
            type="monotone"
            dataKey="orders"
            stroke="hsl(var(--p))"
            strokeWidth={2}
            dot={{ fill: "hsl(var(--p))", strokeWidth: 2 }}
            activeDot={{ r: 6, strokeWidth: 0 }}
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
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" stroke="#888" fontSize={12} />
          <YAxis stroke="#888" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #f0f0f0',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}
          />
          <Bar
            dataKey="completionRate"
            fill="hsl(var(--p))"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  if (loading) {
    return (
      <div className="p-8 space-y-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-base-300 rounded-xl w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <StatCard key={i} loading={true} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {error && (
        <div className="alert alert-error shadow-lg rounded-2xl">
          <AlertTriangle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Welcome Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome back, {user?.companyName || 'Administrator'}! 👋
          </h1>
          <p className="text-base-content/70 mt-2">
            Here&apos;s what&apos;s happening with your warehouse today.
          </p>
        </div>
        <div className="flex gap-4">
          <Link href="/dashboard/materials/add"
            className="btn btn-primary btn-sm shadow-sm hover:shadow-md transition-all rounded-xl px-6">
            <Plus className="w-4 h-4 mr-1.5" />
            Add Material
          </Link>
          <Link href="/dashboard/reports"
            className="btn btn-ghost btn-sm hover:bg-base-200 rounded-xl px-6">
            <Activity className="w-4 h-4 mr-1.5" />
            View Reports
          </Link>
        </div>
      </div>

      {/* Critical Materials Alert */}
      {summaryData?.criticalMaterials?.length > 0 && (
        <div className="alert alert-warning shadow-sm rounded-2xl px-8 py-5">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="mt-0.5">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-medium text-base">Critical Material Stock Alert</h3>
                <p className="text-sm opacity-90 mt-1.5">
                  {summaryData.criticalMaterials.length} materials are below minimum stock levels
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/materials?filter=critical"
              className="btn btn-warning btn-sm font-medium shadow-md hover:shadow-lg transition-all duration-200 rounded-xl px-8"
            >
              View Materials
            </Link>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Package}
          label="Total Materials"
          value={summaryData?.materialStats?.total || 0}
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Order Trend">
          {renderOrderTrendChart()}
        </ChartCard>

        <ChartCard title="Production Overview">
          {renderProductionTrendChart()}
        </ChartCard>
      </div>

      {/* Recent Activity */}
      <div className="card bg-base-100 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl border border-base-200">
        <div className="card-body p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="card-title text-base font-medium text-base-content/80">Recent Activity</h3>
            <Link
              href="/dashboard/activity"
              className="text-xs font-medium text-primary hover:text-primary/70 transition-colors inline-flex items-center"
            >
              View All
              <ChevronRight className="w-3 h-3 ml-1" />
            </Link>
          </div>

          {summaryData?.recentActivities && summaryData.recentActivities.length > 0 ? (
            <div className="space-y-4">
              {summaryData.recentActivities.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 p-4 rounded-xl hover:bg-base-200/50 transition-all duration-200"
                >
                  <div className="rounded-xl bg-primary/10 p-2.5">
                    <Activity className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-base-content/80">{activity.description}</p>
                    <p className="text-xs text-base-content/60 mt-1">
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