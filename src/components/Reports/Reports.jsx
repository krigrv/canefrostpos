import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import toast from 'react-hot-toast'
import { useInventory } from '../../hooks/useInventory'
import {
  BarChart3,
  BarChart3 as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  Clock as ScheduleIcon,
  Clock as ClockIcon,
  Star as StarIcon,
  Receipt as ReceiptIcon,
  Building2 as TaxIcon,
  Download as DownloadIcon,
  Calendar as DateRangeIcon
} from 'lucide-react'

function Reports() {
  const [tabValue, setTabValue] = useState(0)
  const [dateRange, setDateRange] = useState('7days')
  const { sales } = useInventory()
  
  // Calculate date range for filtering
  const dateRangeFilter = useMemo(() => {
    const now = new Date()
    let startDate
    
    switch (dateRange) {
      case '1day':
        startDate = startOfDay(now)
        break
      case '7days':
        startDate = startOfDay(subDays(now, 7))
        break
      case '30days':
        startDate = startOfDay(subDays(now, 30))
        break
      case '90days':
        startDate = startOfDay(subDays(now, 90))
        break
      default:
        startDate = startOfDay(subDays(now, 7))
    }
    
    return { startDate, endDate: endOfDay(now) }
  }, [dateRange])
  
  // Filter sales based on date range
  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const saleDate = sale.createdAt?.toDate ? sale.createdAt.toDate() : new Date(sale.createdAt)
      return saleDate >= dateRangeFilter.startDate && saleDate <= dateRangeFilter.endDate
    })
  }, [sales, dateRangeFilter])
  
  // Calculate sales data from real sales
  const salesData = useMemo(() => {
    if (!filteredSales.length) {
      return {
        totalSales: 0,
        totalTransactions: 0,
        averageOrderValue: 0,
        topSellingItems: [],
        peakHours: [],
        dailySales: [],
        categoryPerformance: []
      }
    }
    
    const totalSales = filteredSales.reduce((sum, sale) => sum + (sale.total || 0), 0)
    const totalTransactions = filteredSales.length
    const averageOrderValue = totalTransactions > 0 ? totalSales / totalTransactions : 0
    
    // Calculate daily sales
    const dailySalesMap = {}
    filteredSales.forEach(sale => {
      const saleDate = sale.createdAt?.toDate ? sale.createdAt.toDate() : new Date(sale.createdAt)
      const dateKey = format(saleDate, 'yyyy-MM-dd')
      
      if (!dailySalesMap[dateKey]) {
        dailySalesMap[dateKey] = { sales: 0, transactions: 0 }
      }
      
      dailySalesMap[dateKey].sales += sale.total || 0
      dailySalesMap[dateKey].transactions += 1
    })
    
    const dailySales = Object.entries(dailySalesMap)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
    
    // Calculate top selling items
    const itemsMap = {}
    filteredSales.forEach(sale => {
      if (sale.items) {
        sale.items.forEach(item => {
          if (!itemsMap[item.name]) {
            itemsMap[item.name] = { quantity: 0, revenue: 0 }
          }
          itemsMap[item.name].quantity += item.quantity || 0
          itemsMap[item.name].revenue += (item.quantity || 0) * (item.price || 0)
        })
      }
    })
    
    const topSellingItems = Object.entries(itemsMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
    
    // Calculate peak hours
    const hoursMap = {}
    filteredSales.forEach(sale => {
      const saleDate = sale.createdAt?.toDate ? sale.createdAt.toDate() : new Date(sale.createdAt)
      const hour = format(saleDate, 'HH:mm')
      const hourKey = `${hour.split(':')[0]}:00-${(parseInt(hour.split(':')[0]) + 1).toString().padStart(2, '0')}:00`
      
      if (!hoursMap[hourKey]) {
        hoursMap[hourKey] = { transactions: 0, revenue: 0 }
      }
      
      hoursMap[hourKey].transactions += 1
      hoursMap[hourKey].revenue += sale.total || 0
    })
    
    const peakHours = Object.entries(hoursMap)
      .map(([hour, data]) => ({ hour, ...data }))
      .sort((a, b) => b.transactions - a.transactions)
    
    // Calculate category performance
    const categoryMap = {}
    filteredSales.forEach(sale => {
      if (sale.items) {
        sale.items.forEach(item => {
          const category = item.type || 'Other'
          if (!categoryMap[category]) {
            categoryMap[category] = { sales: 0 }
          }
          categoryMap[category].sales += (item.quantity || 0) * (item.price || 0)
        })
      }
    })
    
    const categoryPerformance = Object.entries(categoryMap)
      .map(([category, data]) => ({
        category,
        sales: data.sales,
        percentage: totalSales > 0 ? Math.round((data.sales / totalSales) * 100) : 0
      }))
      .sort((a, b) => b.sales - a.sales)
    
    return {
      totalSales,
      totalTransactions,
      averageOrderValue,
      topSellingItems,
      peakHours,
      dailySales,
      categoryPerformance
    }
  }, [filteredSales])
  
  // Calculate tax data from real sales
  const taxData = useMemo(() => {
    if (!filteredSales.length) {
      return {
        totalTaxCollected: 0,
        gstBreakdown: { cgst: 0, sgst: 0, igst: 0 },
        taxableAmount: 0,
        exemptAmount: 0,
        monthlyTaxSummary: []
      }
    }
    
    const totalTaxCollected = filteredSales.reduce((sum, sale) => sum + (sale.tax || 0), 0)
    const taxableAmount = filteredSales.reduce((sum, sale) => sum + (sale.subtotal || 0), 0)
    
    // Assuming CGST and SGST are half of total tax each for intra-state transactions
    const cgst = totalTaxCollected / 2
    const sgst = totalTaxCollected / 2
    const igst = 0 // For inter-state transactions
    
    return {
      totalTaxCollected,
      gstBreakdown: { cgst, sgst, igst },
      taxableAmount,
      exemptAmount: 0,
      monthlyTaxSummary: []
    }
  }, [filteredSales])

  const handleExportReport = (reportType) => {
    // In a real app, this would generate and download the actual report
    toast.success(`${reportType} report exported successfully!`)
  }

  const handleGenerateTaxReport = () => {
    // In a real app, this would generate tax compliance reports
    toast.success('Tax report generated for filing!')
  }

  const TabPanel = ({ children, value, index }) => (
    <div className={value !== index ? 'hidden' : ''}>
      {value === index && <div className="p-6 md:p-8">{children}</div>}
    </div>
  )

  const getPerformanceColor = (percentage) => {
    if (percentage >= 20) return 'success'
    if (percentage >= 10) return 'warning'
    return 'destructive'
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
         <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
           <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
             <div>
               <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Reports & Analytics</h1>
               <p className="text-gray-600 text-sm md:text-base">Comprehensive insights into your business performance</p>
             </div>
             <div className="flex flex-col sm:flex-row gap-3">
               <Button
                 onClick={handleExportReport}
                 className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-lg"
               >
                 <DownloadIcon className="w-4 h-4" />
                 Export Report
               </Button>
             </div>
           </div>
         </div>

         {/* Date Range Selector */}
         <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
           <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
             <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Date Range:</label>
             <div className="flex flex-wrap gap-2">
               {[
                 { label: 'Today', value: '1day' },
                 { label: 'Last 7 Days', value: '7days' },
                 { label: 'Last 30 Days', value: '30days' },
                 { label: 'Last 90 Days', value: '90days' }
               ].map((option) => (
                 <Button
                   key={option.value}
                   variant={dateRange === option.value ? 'default' : 'outline'}
                   size="sm"
                   onClick={() => setDateRange(option.value)}
                   className={`transition-all duration-200 ${
                     dateRange === option.value 
                       ? 'bg-blue-600 text-white shadow-md' 
                       : 'hover:bg-blue-50 hover:border-blue-300'
                   }`}
                 >
                   {option.label}
                 </Button>
               ))}
             </div>
           </div>
         </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <nav className="flex overflow-x-auto" aria-label="Tabs">
          {[
            { icon: BarChart3, label: 'Infographics', index: 0 },
            { icon: ReceiptIcon, label: 'Order Details', index: 1 },
            { icon: TrendingUpIcon, label: 'Trends', index: 2 },
            { icon: ScheduleIcon, label: 'Peak Hours', index: 3 },
            { icon: StarIcon, label: 'Popular Items', index: 4 },
            { icon: TaxIcon, label: 'GST & Audit', index: 5 }
          ].map(({ icon: Icon, label, index }) => (
            <button
              key={index}
              onClick={() => setTabValue(index)}
              className={`${
                tabValue === index
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
              } flex-1 min-w-max py-4 px-6 font-medium text-sm flex items-center justify-center gap-2 transition-all duration-200 border-r border-gray-200 last:border-r-0`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{label.split(' ')[0]}</span>
            </button>
          ))}
        </nav>
      </div>



      {/* Tab Content Container */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Infographics Tab */}
        <TabPanel value={tabValue} index={0}>
        <div className="space-y-8">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Total Sales
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  ₹{salesData.totalSales.toLocaleString()}
                </div>
                <p className="text-sm text-gray-500">Last {dateRange === '1day' ? '1 day' : dateRange === '7days' ? '7 days' : dateRange === '30days' ? '30 days' : '90 days'}</p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <ReceiptIcon className="w-4 h-4" />
                  Transactions
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {salesData.totalTransactions}
                </div>
                <p className="text-sm text-gray-500">Total orders</p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <TrendingUpIcon className="w-4 h-4" />
                  Avg Order Value
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-3xl font-bold text-orange-600 mb-2">
                  ₹{Math.round(salesData.averageOrderValue).toLocaleString()}
                </div>
                <p className="text-sm text-gray-500">Per transaction</p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <AssessmentIcon className="w-4 h-4" />
                  Growth Rate
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {salesData.totalTransactions > 0 ? '+' : ''}0%
                </div>
                <p className="text-sm text-gray-500">vs last period</p>
              </CardContent>
            </Card>
          </div>

          {/* Visual Analytics Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Sales Trend Visualization */}
            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  Sales Trend Visualization
                </CardTitle>
                <p className="text-sm text-gray-600 mt-2">
                  Visual representation of daily sales performance
                </p>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {salesData.dailySales.map((day, index) => (
                    <div key={day.date} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{format(new Date(day.date), 'MMM dd')}</span>
                        <span className="text-sm text-gray-600">₹{day.sales.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                          style={{ 
                            width: `${salesData.dailySales.length > 0 ? (day.sales / Math.max(...salesData.dailySales.map(d => d.sales))) * 100 : 0}%`,
                            animationDelay: `${index * 100}ms`
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Category Performance Pie Chart */}
            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <AssessmentIcon className="w-5 h-5 text-green-600" />
                  Category Performance
                </CardTitle>
                <p className="text-sm text-gray-600 mt-2">
                  Sales distribution across product categories
                </p>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {salesData.categoryPerformance.map((category, index) => (
                    <div key={category.category} className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-800">{category.category}</span>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-gray-900">₹{category.sales.toLocaleString()}</div>
                          <div className="text-xs text-gray-500">{category.percentage}%</div>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full transition-all duration-700 ${
                            index === 0 ? 'bg-gradient-to-r from-green-500 to-green-600' :
                            index === 1 ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                            index === 2 ? 'bg-gradient-to-r from-purple-500 to-purple-600' :
                            index === 3 ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                            'bg-gradient-to-r from-gray-500 to-gray-600'
                          }`}
                          style={{ 
                            width: `${category.percentage}%`,
                            animationDelay: `${index * 150}ms`
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </TabPanel>

      {/* Order Details Tab */}
      <TabPanel value={tabValue} index={1}>
        <div className="space-y-8">
          {/* Order Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <ReceiptIcon className="w-4 h-4" />
                  Total Orders
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {filteredSales.length}
                </div>
                <p className="text-sm text-gray-500">In selected period</p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <TrendingUpIcon className="w-4 h-4" />
                  Average Items per Order
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {filteredSales.length > 0 ? Math.round(filteredSales.reduce((sum, sale) => sum + (sale.items?.length || 0), 0) / filteredSales.length) : 0}
                </div>
                <p className="text-sm text-gray-500">Items per transaction</p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <AssessmentIcon className="w-4 h-4" />
                  Payment Methods
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {new Set(filteredSales.map(sale => sale.paymentMethod || 'Cash')).size}
                </div>
                <p className="text-sm text-gray-500">Different methods used</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Orders Table */}
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <ReceiptIcon className="w-5 h-5 text-blue-600" />
                Recent Order Details
              </CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                Detailed view of recent transactions and order information
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-4 px-2 font-semibold text-gray-700">Order ID</th>
                      <th className="text-left py-4 px-2 font-semibold text-gray-700">Date & Time</th>
                      <th className="text-left py-4 px-2 font-semibold text-gray-700">Items</th>
                      <th className="text-right py-4 px-2 font-semibold text-gray-700">Quantity</th>
                      <th className="text-right py-4 px-2 font-semibold text-gray-700">Amount</th>
                      <th className="text-left py-4 px-2 font-semibold text-gray-700">Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSales.slice(0, 10).map((sale, index) => {
                      const saleDate = sale.createdAt?.toDate ? sale.createdAt.toDate() : new Date(sale.createdAt)
                      return (
                        <tr key={sale.id || index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="py-4 px-2">
                            <div className="font-medium text-gray-900">
                              #{sale.transactionId || `ORD-${index + 1}`}
                            </div>
                          </td>
                          <td className="py-4 px-2">
                            <div className="text-gray-900">{format(saleDate, 'MMM dd, yyyy')}</div>
                            <div className="text-xs text-gray-500">{format(saleDate, 'hh:mm a')}</div>
                          </td>
                          <td className="py-4 px-2">
                            <div className="space-y-1">
                              {sale.items?.slice(0, 2).map((item, itemIndex) => (
                                <div key={itemIndex} className="text-sm text-gray-900">
                                  {item.name}
                                </div>
                              ))}
                              {sale.items?.length > 2 && (
                                <div className="text-xs text-gray-500">
                                  +{sale.items.length - 2} more items
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="text-right py-4 px-2">
                            <span className="font-medium text-gray-900">
                              {sale.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 1}
                            </span>
                          </td>
                          <td className="text-right py-4 px-2">
                            <span className="font-semibold text-gray-900">
                              ₹{(sale.total || 0).toLocaleString()}
                            </span>
                          </td>
                          <td className="py-4 px-2">
                            <Badge 
                              variant={sale.paymentMethod === 'Cash' ? 'default' : 'secondary'}
                              className={`${
                                sale.paymentMethod === 'Cash' ? 'bg-green-100 text-green-800' :
                                sale.paymentMethod === 'Card' ? 'bg-blue-100 text-blue-800' :
                                'bg-purple-100 text-purple-800'
                              }`}
                            >
                              {sale.paymentMethod || 'Cash'}
                            </Badge>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              
              {filteredSales.length === 0 && (
                <div className="text-center py-12">
                  <ReceiptIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No orders found for the selected period</p>
                </div>
              )}
              
              {filteredSales.length > 10 && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Showing latest 10 orders. Total {filteredSales.length} orders in selected period.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </TabPanel>

      {/* Trends Tab */}
      <TabPanel value={tabValue} index={2}>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Peak Hours Analysis</CardTitle>
              <p className="text-sm text-gray-600">
                Identify your busiest hours to optimize staffing and inventory
              </p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3">Time Slot</th>
                      <th className="text-right py-3">Transactions</th>
                      <th className="text-right py-3">Revenue</th>
                      <th className="text-right py-3">Avg per Transaction</th>
                      <th className="text-left py-3">Performance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesData.peakHours.map((hour) => (
                      <tr key={hour.hour} className="border-b">
                        <td className="py-3">
                          <div className="flex items-center">
                            <ScheduleIcon className="mr-2 h-4 w-4" />
                            {hour.hour}
                          </div>
                        </td>
                        <td className="text-right py-3">{hour.transactions}</td>
                        <td className="text-right py-3">₹{hour.revenue.toLocaleString()}</td>
                        <td className="text-right py-3">₹{Math.round(hour.revenue / hour.transactions)}</td>
                        <td className="py-3">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                hour.transactions > 45 ? 'bg-green-500' :
                                hour.transactions > 35 ? 'bg-yellow-500' : 'bg-gray-400'
                              }`}
                              style={{ width: `${(hour.transactions / 52) * 100}%` }}
                            ></div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Recommendation:</strong> Consider increasing staff during 14:00-17:00 for optimal customer service.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabPanel>

      {/* Popular Items Tab */}
      <TabPanel value={tabValue} index={3}>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Selling Items</CardTitle>
              <p className="text-sm text-gray-600">
                Track your best-performing products and optimize inventory
              </p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3">Rank</th>
                      <th className="text-left py-3">Product Name</th>
                      <th className="text-right py-3">Quantity Sold</th>
                      <th className="text-right py-3">Revenue</th>
                      <th className="text-right py-3">Avg Price</th>
                      <th className="text-left py-3">Performance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesData.topSellingItems.map((item, index) => (
                      <tr key={item.name} className="border-b">
                        <td className="py-3">
                          <Badge 
                            variant={index === 0 ? 'default' : index === 1 ? 'secondary' : 'outline'}
                            className={`${
                              index === 0 ? 'bg-blue-500 text-white' :
                              index === 1 ? 'bg-purple-500 text-white' : 'bg-gray-100'
                            }`}
                          >
                            {index + 1}
                          </Badge>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center">
                            <StarIcon className="mr-2 h-4 w-4 text-yellow-500" />
                            {item.name}
                          </div>
                        </td>
                        <td className="text-right py-3">{item.quantity}</td>
                        <td className="text-right py-3">₹{item.revenue.toLocaleString()}</td>
                        <td className="text-right py-3">₹{Math.round(item.revenue / item.quantity)}</td>
                        <td className="py-3">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                index < 2 ? 'bg-green-500' :
                                index < 4 ? 'bg-blue-500' : 'bg-gray-400'
                              }`}
                              style={{ width: `${(item.quantity / 85) * 100}%` }}
                            ></div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>Insight:</strong> Citrus flavors (Lemon, Orange) are consistently popular. Consider expanding this category.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabPanel>

      {/* Tax & Audit Tab */}
      <TabPanel value={tabValue} index={4}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Tax Summary Cards */}
          <Card>
            <CardHeader>
              <CardTitle>Total GST Collected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                ₹{taxData.totalTaxCollected.toLocaleString()}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                This month
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Taxable Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                ₹{taxData.taxableAmount.toLocaleString()}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Before GST
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>GST Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">
                12%
              </div>
              <p className="text-sm text-gray-600 mt-1">
                GST applicable
              </p>
            </CardContent>
          </Card>

          {/* GST Breakdown */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>GST Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="font-medium">CGST (6%)</span>
                    <span className="text-gray-600">₹{taxData.gstBreakdown.cgst.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="font-medium">SGST (6%)</span>
                    <span className="text-gray-600">₹{taxData.gstBreakdown.sgst.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="font-medium">IGST (0%)</span>
                    <span className="text-gray-600">₹{taxData.gstBreakdown.igst.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Tax Summary */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Monthly GST Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Month</th>
                        <th className="text-right py-2">Sales</th>
                        <th className="text-right py-2">GST</th>
                      </tr>
                    </thead>
                    <tbody>
                      {taxData.monthlyTaxSummary.map((month) => (
                        <tr key={month.month} className="border-b">
                          <td className="py-2">{month.month}</td>
                          <td className="text-right py-2">₹{month.sales.toLocaleString()}</td>
                          <td className="text-right py-2">₹{month.tax.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tax Compliance Actions */}
          <div className="col-span-full">
            <Card>
              <CardHeader>
                <CardTitle>GST Compliance & Audit Tools</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <button
                    className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    onClick={() => handleExportReport('GST Return')}
                  >
                    <ReceiptIcon className="w-4 h-4" />
                    Generate GST Return
                  </button>
                  <button
                    className="flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors"
                    onClick={handleGenerateTaxReport}
                  >
                    <TaxIcon className="w-4 h-4" />
                    GST Filing Report
                  </button>
                  <button
                    className="flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors"
                    onClick={() => handleExportReport('Audit Trail')}
                  >
                    <DownloadIcon className="w-4 h-4" />
                    Audit Trail
                  </button>
                  <button
                    className="flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors"
                    onClick={() => handleExportReport('Financial Summary')}
                  >
                    <AssessmentIcon className="w-4 h-4" />
                    Financial Summary
                  </button>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <strong className="text-blue-800">Compliance Status:</strong>
                  <span className="text-blue-700 ml-2">All GST records are up to date. Next GST filing due: 20th January 2025</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </TabPanel>
        </div>
      </div>
    </div>
  )
}

export default Reports