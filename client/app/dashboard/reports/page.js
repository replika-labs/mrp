'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/app/components/DashboardLayout';
import AuthWrapper from '@/app/components/AuthWrapper';
import { FiFileText, FiDownload, FiBarChart, FiCalendar, FiSettings, FiCheck, FiX } from 'react-icons/fi';

export default function ReportsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Report options state
  const [reportType, setReportType] = useState('stock');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [format, setFormat] = useState('pdf');
  const [additionalOptions, setAdditionalOptions] = useState({
    includeCompletedOrders: true,
    includeCancelledOrders: false,
    groupByProduct: true,
    includeCharts: true
  });

  // Set default date range to current month
  useEffect(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    setDateRange({
      startDate: firstDay.toISOString().split('T')[0],
      endDate: lastDay.toISOString().split('T')[0]
    });
  }, []);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'reportType') {
      setReportType(value);
    } else if (name === 'format') {
      setFormat(value);
    } else if (name === 'startDate' || name === 'endDate') {
      setDateRange({
        ...dateRange,
        [name]: value
      });
    } else {
      // Handle checkbox options
      setAdditionalOptions({
        ...additionalOptions,
        [name]: checked
      });
    }
  };

  // Generate report
  const handleGenerateReport = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Build query parameters
      const queryParams = new URLSearchParams({
        type: reportType,
        format: format,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        includeCompletedOrders: additionalOptions.includeCompletedOrders,
        includeCancelledOrders: additionalOptions.includeCancelledOrders,
        groupByProduct: additionalOptions.groupByProduct,
        includeCharts: additionalOptions.includeCharts
      });
      
      // Make API request
      const response = await fetch(`/api/reports/generate?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate report');
      }
      
      // Handle success - either open PDF or download Excel file
      const data = await response.json();
      
      if (data.url) {
        // Open report URL in new tab
        window.open(data.url, '_blank');
        setSuccess('Report generated successfully! Opening in new tab.');
      } else {
        setSuccess('Report generated successfully!');
      }
      
    } catch (err) {
      setError(err.message);
      console.error('Error generating report:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthWrapper>
      <DashboardLayout>
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 backdrop-blur-xl rounded-3xl p-8 border border-gray-300 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.01] hover:-translate-y-1">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl flex-shrink-0">
                <FiFileText className="w-8 h-8 text-primary" />
              </div>
              <div className="flex flex-col justify-start -mt-1">
                <h1 className="text-2xl font-bold text-base-content leading-tight">
                  REPORTS
                </h1>
                <p className="text-sm text-base-content/60 leading-tight -mt-1">Generate and export reports for stock, production, and shipments</p>
              </div>
            </div>
          </div>

          {/* Error and Success Messages */}
          {error && (
            <div className="bg-gradient-to-r from-red-50 to-red-100 border border-gray-300 rounded-3xl p-4 shadow-lg backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 bg-red-200 rounded-xl">
                  <FiX className="w-5 h-5 text-red-600" />
                </div>
                <span className="text-red-800 font-medium">{error}</span>
              </div>
            </div>
          )}
          
          {success && (
            <div className="bg-gradient-to-r from-green-50 to-green-100 border border-gray-300 rounded-3xl p-4 shadow-lg backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 bg-green-200 rounded-xl">
                  <FiCheck className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-green-800 font-medium">{success}</span>
              </div>
            </div>
          )}

          {/* Report Options Form */}
          <div className="bg-gradient-to-br from-secondary/5 via-transparent to-primary/5 backdrop-blur-xl rounded-3xl p-8 border border-gray-300 shadow-xl hover:shadow-2xl transition-all duration-500">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-secondary/20 to-primary/20 rounded-xl">
                <FiSettings className="w-5 h-5 text-info" />
              </div>
              <h3 className="text-lg font-semibold text-base-content">Report Configuration</h3>
            </div>
            
              <form onSubmit={handleGenerateReport}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Report Type */}
                <div className="bg-white/50 backdrop-blur-sm rounded-lg p-3 border border-gray-300 shadow-sm hover:shadow-md transition-all duration-300">
                  <label htmlFor="reportType" className="block text-xs font-medium text-base-content/70 mb-2 truncate">
                      Report Type
                    </label>
                    <select
                      id="reportType"
                      name="reportType"
                      value={reportType}
                      onChange={handleInputChange}
                    className="w-full h-8 px-3 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-gray-50 transition-all duration-200"
                    >
                      <option value="stock">Stock Report</option>
                      <option value="production">Production Report</option>
                      <option value="shipment">Shipment Report</option>
                      <option value="comprehensive">Comprehensive Report</option>
                    </select>
                  </div>

                  {/* Export Format */}
                <div className="bg-white/50 backdrop-blur-sm rounded-lg p-3 border border-gray-300 shadow-sm hover:shadow-md transition-all duration-300">
                  <label htmlFor="format" className="block text-xs font-medium text-base-content/70 mb-2 truncate">
                      Format
                    </label>
                    <select
                      id="format"
                      name="format"
                      value={format}
                      onChange={handleInputChange}
                    className="w-full h-8 px-3 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-gray-50 transition-all duration-200"
                    >
                      <option value="pdf">PDF</option>
                      <option value="excel">Excel</option>
                      <option value="csv">CSV</option>
                    </select>
                  </div>

                  {/* Date Range - Start */}
                <div className="bg-white/50 backdrop-blur-sm rounded-lg p-3 border border-gray-300 shadow-sm hover:shadow-md transition-all duration-300">
                  <label htmlFor="startDate" className="block text-xs font-medium text-base-content/70 mb-2 truncate">
                      Start Date
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      id="startDate"
                      value={dateRange.startDate}
                      onChange={handleInputChange}
                    className="w-full h-8 px-3 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-gray-50 transition-all duration-200"
                    />
                  </div>

                  {/* Date Range - End */}
                <div className="bg-white/50 backdrop-blur-sm rounded-lg p-3 border border-gray-300 shadow-sm hover:shadow-md transition-all duration-300">
                  <label htmlFor="endDate" className="block text-xs font-medium text-base-content/70 mb-2 truncate">
                      End Date
                    </label>
                    <input
                      type="date"
                      name="endDate"
                      id="endDate"
                      value={dateRange.endDate}
                      onChange={handleInputChange}
                    className="w-full h-8 px-3 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-gray-50 transition-all duration-200"
                    />
                </div>
                  </div>

                  {/* Additional Options */}
              <div className="bg-white/30 backdrop-blur-sm rounded-xl p-4 border border-gray-300 shadow-sm hover:shadow-md transition-all duration-300 mb-6">
                <h4 className="text-sm font-semibold text-base-content/70 mb-4 uppercase tracking-wider">Additional Options</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start space-x-3 p-3 bg-white/50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors duration-200">
                            <input
                              id="includeCompletedOrders"
                              name="includeCompletedOrders"
                              type="checkbox"
                              checked={additionalOptions.includeCompletedOrders}
                              onChange={handleInputChange}
                      className="focus:ring-primary/20 h-4 w-4 text-primary border-gray-300 rounded mt-1"
                            />
                    <div className="flex-1">
                      <label htmlFor="includeCompletedOrders" className="font-medium text-base-content text-sm">Include Completed Orders</label>
                      <p className="text-base-content/60 text-xs mt-1">Include orders with 'completed' status in the report.</p>
                          </div>
                        </div>
                  
                  <div className="flex items-start space-x-3 p-3 bg-white/50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors duration-200">
                            <input
                              id="includeCancelledOrders"
                              name="includeCancelledOrders"
                              type="checkbox"
                              checked={additionalOptions.includeCancelledOrders}
                              onChange={handleInputChange}
                      className="focus:ring-primary/20 h-4 w-4 text-primary border-gray-300 rounded mt-1"
                            />
                    <div className="flex-1">
                      <label htmlFor="includeCancelledOrders" className="font-medium text-base-content text-sm">Include Cancelled Orders</label>
                      <p className="text-base-content/60 text-xs mt-1">Include orders with 'cancelled' status in the report.</p>
                          </div>
                        </div>
                  
                  <div className="flex items-start space-x-3 p-3 bg-white/50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors duration-200">
                            <input
                              id="groupByProduct"
                              name="groupByProduct"
                              type="checkbox"
                              checked={additionalOptions.groupByProduct}
                              onChange={handleInputChange}
                      className="focus:ring-primary/20 h-4 w-4 text-primary border-gray-300 rounded mt-1"
                            />
                    <div className="flex-1">
                      <label htmlFor="groupByProduct" className="font-medium text-base-content text-sm">Group by Product</label>
                      <p className="text-base-content/60 text-xs mt-1">Group data by product instead of showing individual order items.</p>
                          </div>
                        </div>
                  
                  <div className="flex items-start space-x-3 p-3 bg-white/50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors duration-200">
                            <input
                              id="includeCharts"
                              name="includeCharts"
                              type="checkbox"
                              checked={additionalOptions.includeCharts}
                              onChange={handleInputChange}
                      className="focus:ring-primary/20 h-4 w-4 text-primary border-gray-300 rounded mt-1"
                            />
                    <div className="flex-1">
                      <label htmlFor="includeCharts" className="font-medium text-base-content text-sm">Include Charts</label>
                      <p className="text-base-content/60 text-xs mt-1">Include visual charts and graphs in the report (PDF only).</p>
                      </div>
                  </div>
                  </div>
                </div>

              <div className="flex justify-center">
                  <button
                    type="submit"
                    disabled={loading}
                  className="w-full max-w-md bg-primary text-primary-content border border-gray-300 h-12 px-8 text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 rounded-xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:translate-y-0"
                  >
                    {loading ? (
                      <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-content"></div>
                        Generating Report...
                      </>
                    ) : (
                    <>
                      <FiBarChart className="w-5 h-5" />
                      Generate Report
                    </>
                    )}
                  </button>
                </div>
              </form>
            </div>

          {/* Report Types Information */}
          <div className="bg-gradient-to-br from-accent/5 via-transparent to-primary/5 backdrop-blur-xl rounded-3xl p-8 border border-gray-300 shadow-xl hover:shadow-2xl transition-all duration-500">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-accent/20 to-primary/20 rounded-xl">
                <FiFileText className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-base-content">Report Types</h3>
          </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4 border border-gray-300 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.01]">
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-lg flex-shrink-0 mt-1">
                    <FiFileText className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-base-content text-sm mb-2">Stock Report</h4>
                    <p className="text-base-content/70 text-xs leading-relaxed">
                      Provides an overview of material inventory including current stock levels, materials below safety stock, and material movement history.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4 border border-gray-300 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.01]">
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-success/10 rounded-lg flex-shrink-0 mt-1">
                    <FiBarChart className="w-4 h-4 text-success" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-base-content text-sm mb-2">Production Report</h4>
                    <p className="text-base-content/70 text-xs leading-relaxed">
                      Summarizes production data including completed orders, in-progress orders, production efficiency, and remaining fabric statistics.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4 border border-gray-300 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.01]">
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-info/10 rounded-lg flex-shrink-0 mt-1">
                    <FiDownload className="w-4 h-4 text-info" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-base-content text-sm mb-2">Shipment Report</h4>
                    <p className="text-base-content/70 text-xs leading-relaxed">
                      Details all shipments including tracking information, courier data, delivery status, and order relationships.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4 border border-gray-300 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.01]">
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-warning/10 rounded-lg flex-shrink-0 mt-1">
                    <FiSettings className="w-4 h-4 text-warning" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-base-content text-sm mb-2">Comprehensive Report</h4>
                    <p className="text-base-content/70 text-xs leading-relaxed">
                      Combines all of the above reports into a complete business overview with additional KPIs and trend analysis.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recently Generated Reports */}
          <div className="bg-gradient-to-br from-accent/5 via-transparent to-primary/5 backdrop-blur-xl rounded-3xl p-0 border border-gray-300 shadow-xl hover:shadow-2xl transition-all duration-500">
            <div className="flex items-center justify-between p-6 border-b border-gray-300 bg-gradient-to-r from-gray-100 to-gray-50 rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-accent/20 to-primary/20 rounded-xl">
                  <FiCalendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-base-content">Recently Generated Reports</h3>
                  <p className="text-xs text-base-content/60">Your most recently generated reports</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4 border border-gray-300 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.01]">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-lg">
                        <FiFileText className="w-4 h-4 text-primary" />
                    </div>
                      <div>
                        <p className="font-semibold text-base-content text-sm">Stock Report - April 2023</p>
                        <p className="text-xs text-base-content/60 flex items-center gap-1">
                          <FiCalendar className="w-3 h-3" />
                        Generated on April 30, 2023
                      </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 border border-green-200">
                        PDF
                      </span>
                      <button className="bg-primary/10 hover:bg-primary/20 text-primary p-2 rounded-lg transition-colors duration-200 flex items-center justify-center">
                        <FiDownload className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                    </div>
                
                <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4 border border-gray-300 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.01]">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-success/10 rounded-lg">
                        <FiBarChart className="w-4 h-4 text-success" />
                  </div>
                      <div>
                        <p className="font-semibold text-base-content text-sm">Production Report - Q1 2023</p>
                        <p className="text-xs text-base-content/60 flex items-center gap-1">
                          <FiCalendar className="w-3 h-3" />
                        Generated on March 31, 2023
                      </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                        Excel
                      </span>
                      <button className="bg-primary/10 hover:bg-primary/20 text-primary p-2 rounded-lg transition-colors duration-200 flex items-center justify-center">
                        <FiDownload className="w-4 h-4" />
                      </button>
                    </div>
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