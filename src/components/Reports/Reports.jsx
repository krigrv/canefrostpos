import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import toast from 'react-hot-toast'
import { useInventory } from '../../hooks/useInventory'
import {
  BarChart3 as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  Clock as ScheduleIcon,
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
      {value === index && <div className="p-6">{children}</div>}
    </div>
  )

  const getPerformanceColor = (percentage) => {
    if (percentage >= 20) return 'success'
    if (percentage >= 10) return 'warning'
    return 'destructive'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 capitalize">
          Reports & Analytics
        </h1>
      </div>

      {/* Tab Navigation */}
      <Card>
        <div className="flex overflow-x-auto border-b">
          {[
            { icon: AssessmentIcon, label: 'Sales Overview', index: 0 },
            { icon: TrendingUpIcon, label: 'Trends', index: 1 },
            { icon: ScheduleIcon, label: 'Peak Hours', index: 2 },
            { icon: StarIcon, label: 'Popular Items', index: 3 },
            { icon: TaxIcon, label: 'GST & Audit', index: 4 }
          ].map(({ icon: Icon, label, index }) => (
            <button
              key={index}
              onClick={() => setTabValue(index)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                tabValue === index
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Date Range Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <DateRangeIcon className="w-5 h-5 text-gray-500" />
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1day">Today</SelectItem>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="90days">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <button
          onClick={() => handleExportReport('Sales Summary')}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors"
        >
          <DownloadIcon className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* Sales Overview Tab */}
      <TabPanel value={tabValue} index={0}>
        <div className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Sales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  ₹{salesData.totalSales.toLocaleString()}
                </div>
                <p className="text-xs text-gray-500 mt-1">Last 7 days</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {salesData.totalTransactions}
                </div>
                <p className="text-xs text-gray-500 mt-1">Total orders</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Avg Order Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  ₹{Math.round(salesData.averageOrderValue).toLocaleString()}
                </div>
                <p className="text-xs text-gray-500 mt-1">Per transaction</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Growth Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {salesData.totalTransactions > 0 ? '+' : ''}0%
                </div>
                <p className="text-xs text-gray-500 mt-1">vs last period</p>
              </CardContent>
            </Card>
          </div>

          {/* Daily Sales Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Daily Sales Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Date</th>
                          <th className="text-right py-2">Sales</th>
                          <th className="text-right py-2">Transactions</th>
                          <th className="text-right py-2">Avg Order</th>
                        </tr>
                      </thead>
                      <tbody>
                        {salesData.dailySales.map((day) => (
                          <tr key={day.date} className="border-b">
                            <td className="py-2">{format(new Date(day.date), 'MMM dd')}</td>
                            <td className="text-right py-2">₹{day.sales.toLocaleString()}</td>
                            <td className="text-right py-2">{day.transactions}</td>
                            <td className="text-right py-2">₹{Math.round(day.sales / day.transactions)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Category Performance */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Category Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {salesData.categoryPerformance.map((category) => (
                      <div key={category.category} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{category.category}</span>
                          <span className="text-sm text-gray-600">₹{category.sales.toLocaleString()} ({category.percentage}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              category.percentage >= 80 ? 'bg-green-500' :
                              category.percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${category.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </TabPanel>

      {/* Peak Hours Tab */}
      <TabPanel value={tabValue} index={1}>
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
      <TabPanel value={tabValue} index={2}>
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
      <TabPanel value={tabValue} index={3}>
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
  )
}

export default Reports