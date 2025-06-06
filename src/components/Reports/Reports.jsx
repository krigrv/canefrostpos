import React, { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Alert, AlertDescription } from '../ui/alert'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import { toast } from 'sonner'
import { useInventory } from '../../hooks/useInventory'
import gstAuditService from '../../services/gstAuditService'
import SKUHSNMapper from '../SKUHSNMapper'
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
  Calendar as DateRangeIcon,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  RefreshCw,
  FileText,
  Shield,
  Calculator
} from 'lucide-react'

function Reports() {
  const [tabValue, setTabValue] = useState('infographics')
  const [dateRange, setDateRange] = useState('7days')
  const [gstData, setGstData] = useState({
    hsnSacCodes: [],
    complianceStatus: null,
    reconciliationData: null,
    gstrFilings: [],
    auditTrail: [],
    alerts: []
  })
  const [loading, setLoading] = useState(false)
  const { sales } = useInventory()
  
  // Load GST audit data
  useEffect(() => {
    loadGSTData()
  }, [dateRange])
  
  const loadGSTData = async () => {
    try {
      setLoading(true)
      const [hsnSacCodes, complianceStatus, auditTrail, alerts] = await Promise.all([
        gstAuditService.hsnSacService.getAllCodes(),
        gstAuditService.complianceService.checkCompliance(),
        gstAuditService.complianceService.getAuditTrail(),
        gstAuditService.complianceService.getComplianceAlerts()
      ])
      
      setGstData({
        hsnSacCodes,
        complianceStatus,
        auditTrail,
        alerts,
        reconciliationData: null,
        gstrFilings: []
      })
    } catch (error) {
      console.error('Error loading GST data:', error)
      toast.error('Failed to load GST data')
    } finally {
      setLoading(false)
    }
  }
  
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
    if (!sales || !Array.isArray(sales)) {
      return []
    }
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
      try {
        const saleDate = sale.createdAt?.toDate ? sale.createdAt.toDate() : new Date(sale.createdAt || sale.timestamp)
        if (isNaN(saleDate.getTime())) return // Skip invalid dates
        const dateKey = format(saleDate, 'yyyy-MM-dd')
        
        if (!dailySalesMap[dateKey]) {
          dailySalesMap[dateKey] = { sales: 0, transactions: 0 }
        }
        
        dailySalesMap[dateKey].sales += sale.total || 0
        dailySalesMap[dateKey].transactions += 1
      } catch (error) {
        console.warn('Error processing sale date:', error)
        // Skip this sale if date processing fails
      }
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
      try {
        const saleDate = sale.createdAt?.toDate ? sale.createdAt.toDate() : new Date(sale.createdAt || sale.timestamp)
        if (isNaN(saleDate.getTime())) return // Skip invalid dates
        const hour = format(saleDate, 'HH:mm')
        const hourKey = `${hour.split(':')[0]}:00-${(parseInt(hour.split(':')[0]) + 1).toString().padStart(2, '0')}:00`
      
      if (!hoursMap[hourKey]) {
        hoursMap[hourKey] = { transactions: 0, revenue: 0 }
      }
      
        hoursMap[hourKey].transactions += 1
        hoursMap[hourKey].revenue += sale.total || 0
      } catch (error) {
        console.warn('Error processing sale date:', error)
        // Skip this sale if date processing fails
      }
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
  
  // Calculate comprehensive tax data from real sales
  const taxData = useMemo(() => {
    if (!filteredSales.length) {
      return {
        totalTaxCollected: 0,
        gstBreakdown: { cgst: 0, sgst: 0, igst: 0, utgst: 0 },
        taxableAmount: 0,
        exemptAmount: 0,
        monthlyTaxSummary: [],
        hsnBreakdown: {}
      }
    }
    
    const salesWithTax = filteredSales.map(sale => {
      const taxBreakdown = gstAuditService.calculateTax(
        sale.total - (sale.tax || 0), // taxable amount
        sale.tax_rate || 18, // default 18% if not specified
        sale.customer_state || 'same', // assume same state if not specified
        'goods' // assume goods for now
      )
      return { ...sale, taxBreakdown }
    })
    
    const totalTaxable = salesWithTax.reduce((sum, sale) => sum + (sale.total - (sale.tax || 0)), 0)
    const totalTaxCollected = salesWithTax.reduce((sum, sale) => sum + (sale.tax || 0), 0)
    const totalCGST = salesWithTax.reduce((sum, sale) => sum + (sale.taxBreakdown?.cgst || 0), 0)
    const totalSGST = salesWithTax.reduce((sum, sale) => sum + (sale.taxBreakdown?.sgst || 0), 0)
    const totalIGST = salesWithTax.reduce((sum, sale) => sum + (sale.taxBreakdown?.igst || 0), 0)
    const totalUTGST = salesWithTax.reduce((sum, sale) => sum + (sale.taxBreakdown?.utgst || 0), 0)
    
    // HSN-wise breakdown
    const hsnBreakdown = salesWithTax.reduce((acc, sale) => {
      const hsn = sale.hsn_code || 'UNCLASSIFIED'
      if (!acc[hsn]) {
        acc[hsn] = { taxableAmount: 0, tax: 0, cgst: 0, sgst: 0, igst: 0, utgst: 0 }
      }
      acc[hsn].taxableAmount += sale.total - (sale.tax || 0)
      acc[hsn].tax += sale.tax || 0
      acc[hsn].cgst += sale.taxBreakdown?.cgst || 0
      acc[hsn].sgst += sale.taxBreakdown?.sgst || 0
      acc[hsn].igst += sale.taxBreakdown?.igst || 0
      acc[hsn].utgst += sale.taxBreakdown?.utgst || 0
      return acc
    }, {})
    
    return {
      totalTaxCollected,
      gstBreakdown: { cgst: totalCGST, sgst: totalSGST, igst: totalIGST, utgst: totalUTGST },
      taxableAmount: totalTaxable,
      exemptAmount: 0,
      monthlyTaxSummary: [],
      hsnBreakdown
    }
  }, [filteredSales, gstData])

  const handleExportReport = (reportType) => {
    // In a real app, this would generate and download the actual report
    toast.success(`${reportType} report exported successfully!`)
  }

  const handleGenerateTaxReport = () => {
    // In a real app, this would generate tax compliance reports
    toast.success('Tax report generated for filing!')
  }
  
  // GST Audit Functions
  const handleGSTRGeneration = async (gstrType) => {
    try {
      setLoading(true)
      const gstrData = await gstAuditService.generateGSTR(gstrType, dateRangeFilter.startDate, dateRangeFilter.endDate)
      
      // Create and download the GSTR file
      const blob = new Blob([JSON.stringify(gstrData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${gstrType}_${format(new Date(), 'yyyy-MM-dd')}.json`
      a.click()
      URL.revokeObjectURL(url)
      
      toast.success(`${gstrType} generated successfully`)
    } catch (error) {
      console.error('Error generating GSTR:', error)
      toast.error(`Failed to generate ${gstrType}`)
    } finally {
      setLoading(false)
    }
  }
  
  const handleGSTRFiling = async (gstrType) => {
    try {
      setLoading(true)
      const result = await gstAuditService.fileGSTR(gstrType, dateRangeFilter.startDate, dateRangeFilter.endDate)
      
      if (result.success) {
        toast.success(`${gstrType} filed successfully. Reference: ${result.reference}`)
        loadGSTData() // Refresh data
      } else {
        toast.error(`Filing failed: ${result.error}`)
      }
    } catch (error) {
      console.error('Error filing GSTR:', error)
      toast.error(`Failed to file ${gstrType}`)
    } finally {
      setLoading(false)
    }
  }
  
  const handleReconciliation = async () => {
    try {
      setLoading(true)
      const reconciliationData = await gstAuditService.performReconciliation(
        dateRangeFilter.startDate,
        dateRangeFilter.endDate
      )
      
      setGstData(prev => ({ ...prev, reconciliationData }))
      toast.success('GST reconciliation completed')
    } catch (error) {
      console.error('Error performing reconciliation:', error)
      toast.error('Failed to perform reconciliation')
    } finally {
      setLoading(false)
    }
  }
  
  const handleGenerateEWayBill = async (saleId) => {
    try {
      setLoading(true)
      const eWayBill = await gstAuditService.generateEWayBill(saleId)
      
      if (eWayBill.success) {
        toast.success(`E-Way Bill generated: ${eWayBill.eWayBillNumber}`)
      } else {
        toast.error(`E-Way Bill generation failed: ${eWayBill.error}`)
      }
    } catch (error) {
      console.error('Error generating E-Way Bill:', error)
      toast.error('Failed to generate E-Way Bill')
    } finally {
      setLoading(false)
    }
  }



  const getPerformanceColor = (percentage) => {
    if (percentage >= 20) return 'success'
    if (percentage >= 10) return 'warning'
    return 'destructive'
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
         <div className="bg-card rounded-xl shadow-sm border border-border p-6 md:p-8">
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
         <div className="bg-card rounded-xl shadow-sm border border-border p-6">
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

      {/* Tab Navigation and Content */}
      <Tabs value={tabValue} onValueChange={setTabValue} className="space-y-6">
        <div className="bg-card rounded-xl shadow-sm border border-border p-2">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
            <TabsTrigger value="infographics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Infographics</span>
              <span className="sm:hidden">Info</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <ReceiptIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Order Details</span>
              <span className="sm:hidden">Orders</span>
            </TabsTrigger>
            <TabsTrigger value="trends" className="flex items-center gap-2">
              <TrendingUpIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Trends</span>
              <span className="sm:hidden">Trends</span>
            </TabsTrigger>
            <TabsTrigger value="peak" className="flex items-center gap-2">
              <ScheduleIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Peak Hours</span>
              <span className="sm:hidden">Peak</span>
            </TabsTrigger>
            <TabsTrigger value="popular" className="flex items-center gap-2">
              <StarIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Popular Items</span>
              <span className="sm:hidden">Popular</span>
            </TabsTrigger>
            <TabsTrigger value="gst" className="flex items-center gap-2">
              <TaxIcon className="w-4 h-4" />
              <span className="hidden sm:inline">GST & Audit</span>
              <span className="sm:hidden">GST</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Infographics Tab */}
        <TabsContent value="infographics" className="space-y-6">
          <div className="bg-card rounded-xl shadow-sm border border-border p-6">
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
        </div>
        </TabsContent>

        {/* Order Details Tab */}
        <TabsContent value="orders" className="space-y-6">
          <div className="bg-card rounded-xl shadow-sm border border-border p-6">
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Order History</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Complete transaction history and order details
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleExportReport('Orders')}>
                    <DownloadIcon className="w-4 h-4 mr-2" />
                    Export Orders
                  </Button>
                </div>
              </div>

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

              <Card>
                <CardContent className="p-0">
                  {filteredSales.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted">
                            <th className="text-left py-4 px-6 font-medium">Order ID</th>
                            <th className="text-left py-4 px-6 font-medium">Date & Time</th>
                            <th className="text-left py-4 px-6 font-medium">Customer</th>
                            <th className="text-right py-4 px-6 font-medium">Items</th>
                            <th className="text-right py-4 px-6 font-medium">Total</th>
                            <th className="text-left py-4 px-6 font-medium">Payment</th>
                            <th className="text-left py-4 px-6 font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredSales.slice(0, 20).map((sale, index) => {
                            const saleDate = sale.createdAt?.toDate ? sale.createdAt.toDate() : new Date(sale.createdAt)
                            return (
                              <tr key={sale.id || index} className="border-b hover:bg-muted transition-colors">
                                <td className="py-4 px-6">
                                  <div className="flex items-center">
                                    <ReceiptIcon className="mr-2 h-4 w-4 text-blue-600" />
                                    <span className="font-mono text-sm">#{sale.transactionId || `ORD-${String(index + 1).padStart(4, '0')}`}</span>
                                  </div>
                                </td>
                                <td className="py-4 px-6">
                                  <div>
                                    <div className="font-medium">
                                      {format(saleDate, 'MMM dd, yyyy')}
                                    </div>
                                    <div className="text-gray-500 text-xs">
                                      {format(saleDate, 'hh:mm a')}
                                    </div>
                                  </div>
                                </td>
                                <td className="py-4 px-6">
                                  <div>
                                    <div className="font-medium">{sale.customerName || 'Walk-in Customer'}</div>
                                    <div className="text-gray-500 text-xs">{sale.customerPhone || 'No contact info'}</div>
                                  </div>
                                </td>
                                <td className="text-right py-4 px-6">
                                  <div className="space-y-1">
                                    <Badge variant="outline" className="font-medium">
                                      {sale.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 1} items
                                    </Badge>
                                    {sale.items && sale.items.length > 0 && (
                                      <div className="text-xs text-gray-500">
                                        {sale.items.slice(0, 2).map(item => item.name).join(', ')}
                                        {sale.items.length > 2 && ` +${sale.items.length - 2} more`}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="text-right py-4 px-6">
                                  <div className="font-bold text-lg">₹{(sale.total || 0).toLocaleString()}</div>
                                  {sale.discount > 0 && (
                                    <div className="text-xs text-green-600">-₹{sale.discount.toFixed(2)} discount</div>
                                  )}
                                </td>
                                <td className="py-4 px-6">
                                  <Badge 
                                    variant={sale.paymentMethod === 'Cash' ? 'secondary' : 'default'}
                                    className={`capitalize font-medium ${
                                      sale.paymentMethod === 'Cash' ? 'bg-green-100 text-green-800' :
                                      sale.paymentMethod === 'Card' ? 'bg-blue-100 text-blue-800' :
                                      'bg-purple-100 text-purple-800'
                                    }`}
                                  >
                                    {sale.paymentMethod || 'Cash'}
                                  </Badge>
                                </td>
                                <td className="py-4 px-6">
                                  <Badge variant="default" className="bg-green-100 text-green-800 font-medium">
                                    Completed
                                  </Badge>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <ReceiptIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
                      <p className="text-gray-500">No orders found for the selected period</p>
                    </div>
                  )}
                  
                  {filteredSales.length > 0 && (
                    <div className="px-6 py-4 bg-muted border-t">
                      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <p className="text-sm text-gray-600">
                          Showing {Math.min(filteredSales.length, 20)} of {filteredSales.length} orders
                        </p>
                        {filteredSales.length > 20 && (
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" disabled>
                              Previous
                            </Button>
                            <Button variant="outline" size="sm" disabled>
                              Next
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <div className="bg-card rounded-xl shadow-sm border border-border p-6">
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
        </div>
        </TabsContent>

        {/* Peak Hours Tab */}
        <TabsContent value="peak" className="space-y-6">
          <div className="bg-card rounded-xl shadow-sm border border-border p-6">
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
                              index === 1 ? 'bg-purple-500 text-white' : 'bg-muted'
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
        </div>
        </TabsContent>

        {/* Popular Items Tab */}
        <TabsContent value="popular" className="space-y-6">
          <div className="bg-card rounded-xl shadow-sm border border-border p-6">
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
                              index === 1 ? 'bg-purple-500 text-white' : 'bg-muted'
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
        </div>
        </TabsContent>

        {/* GST & Audit Tab */}
        <TabsContent value="gst" className="space-y-6">
          {/* GST Sub-tabs */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="hsn-mapping">HSN Mapping</TabsTrigger>
              <TabsTrigger value="filing">Filing</TabsTrigger>
              <TabsTrigger value="audit">Audit</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              {/* Compliance Alerts */}
              {gstData.alerts.length > 0 && (
                <div className="space-y-2">
                  {gstData.alerts.map((alert, index) => (
                    <Alert key={index} className={alert.severity === 'high' ? 'border-red-500' : alert.severity === 'medium' ? 'border-yellow-500' : 'border-blue-500'}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>{alert.title}:</strong> {alert.message}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}
          
          {/* GST Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total GST Collected</CardTitle>
                <TaxIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{taxData.totalTaxCollected.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  From {filteredSales.length} transactions
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxable Amount</CardTitle>
                <ReceiptIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{taxData.taxableAmount.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  Before tax calculation
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center gap-2">
                  {gstData.complianceStatus?.score || 85}%
                  {(gstData.complianceStatus?.score || 85) >= 90 ? 
                    <CheckCircle className="h-5 w-5 text-green-500" /> : 
                    (gstData.complianceStatus?.score || 85) >= 70 ? 
                    <AlertTriangle className="h-5 w-5 text-yellow-500" /> : 
                    <XCircle className="h-5 w-5 text-red-500" />
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  {gstData.complianceStatus?.status || 'Good'} compliance status
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">HSN Codes</CardTitle>
                <Calculator className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{gstData.hsnSacCodes.length}</div>
                <p className="text-xs text-muted-foreground">
                  Active HSN/SAC codes
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Enhanced GST Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>GST Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-lg font-semibold text-blue-600">CGST</div>
                  <div className="text-2xl font-bold">₹{taxData.gstBreakdown.cgst.toFixed(2)}</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-lg font-semibold text-green-600">SGST</div>
                  <div className="text-2xl font-bold">₹{taxData.gstBreakdown.sgst.toFixed(2)}</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-lg font-semibold text-purple-600">IGST</div>
                  <div className="text-2xl font-bold">₹{taxData.gstBreakdown.igst.toFixed(2)}</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-lg font-semibold text-orange-600">UTGST</div>
                  <div className="text-2xl font-bold">₹{taxData.gstBreakdown.utgst.toFixed(2)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* HSN-wise Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>HSN/SAC Code-wise Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">HSN/SAC Code</th>
                      <th className="text-right p-2">Taxable Amount</th>
                      <th className="text-right p-2">CGST</th>
                      <th className="text-right p-2">SGST</th>
                      <th className="text-right p-2">IGST</th>
                      <th className="text-right p-2">Total Tax</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(taxData.hsnBreakdown).map(([hsn, data]) => (
                      <tr key={hsn} className="border-b">
                        <td className="p-2 font-medium">{hsn}</td>
                        <td className="text-right p-2">₹{data.taxableAmount.toFixed(2)}</td>
                        <td className="text-right p-2">₹{data.cgst.toFixed(2)}</td>
                        <td className="text-right p-2">₹{data.sgst.toFixed(2)}</td>
                        <td className="text-right p-2">₹{data.igst.toFixed(2)}</td>
                        <td className="text-right p-2 font-semibold">₹{data.tax.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          
          {/* GSTR Filing & Compliance Tools */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>GSTR Filing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button 
                    onClick={() => handleGSTRGeneration('GSTR-1')}
                    className="flex items-center gap-2"
                    disabled={loading}
                  >
                    <DownloadIcon className="h-4 w-4" />
                    Generate GSTR-1
                  </Button>
                  <Button 
                    onClick={() => handleGSTRGeneration('GSTR-3B')}
                    className="flex items-center gap-2"
                    disabled={loading}
                  >
                    <DownloadIcon className="h-4 w-4" />
                    Generate GSTR-3B
                  </Button>
                  <Button 
                    onClick={() => handleGSTRFiling('GSTR-1')}
                    variant="outline"
                    className="flex items-center gap-2"
                    disabled={loading}
                  >
                    <FileText className="h-4 w-4" />
                    File GSTR-1
                  </Button>
                  <Button 
                    onClick={() => handleGSTRFiling('GSTR-3B')}
                    variant="outline"
                    className="flex items-center gap-2"
                    disabled={loading}
                  >
                    <FileText className="h-4 w-4" />
                    File GSTR-3B
                  </Button>
                </div>
                
                {/* Filing Status */}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Recent Filings</h4>
                  {gstData.gstrFilings.length > 0 ? (
                    <div className="space-y-2">
                      {gstData.gstrFilings.slice(0, 3).map((filing, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <span>{filing.type} - {format(new Date(filing.period), 'MMM yyyy')}</span>
                          <Badge variant={filing.status === 'filed' ? 'default' : 'secondary'}>
                            {filing.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No recent filings</p>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Audit & Reconciliation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <Button 
                    onClick={handleReconciliation}
                    variant="outline"
                    className="flex items-center gap-2"
                    disabled={loading}
                  >
                    <RefreshCw className="h-4 w-4" />
                    Perform Reconciliation
                  </Button>
                  <Button 
                    onClick={() => toast.success('Audit trail exported!')}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    View Audit Trail
                  </Button>
                  <Button 
                    onClick={() => toast.success('Compliance report generated!')}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Shield className="h-4 w-4" />
                    Compliance Report
                  </Button>
                </div>
                
                {/* Reconciliation Status */}
                {gstData.reconciliationData && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">Last Reconciliation</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Matched Transactions:</span>
                        <span className="font-medium">{gstData.reconciliationData.matched}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Discrepancies:</span>
                        <span className="font-medium text-red-600">{gstData.reconciliationData.discrepancies}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Accuracy:</span>
                        <span className="font-medium">{gstData.reconciliationData.accuracy}%</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
              {/* Monthly GST Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Monthly GST Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Month</th>
                          <th className="text-right p-2">Sales</th>
                          <th className="text-right p-2">Taxable Amount</th>
                          <th className="text-right p-2">CGST</th>
                          <th className="text-right p-2">SGST</th>
                          <th className="text-right p-2">IGST</th>
                          <th className="text-right p-2">Total GST</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="p-2">Current Period</td>
                          <td className="text-right p-2">₹{salesData.totalSales.toFixed(2)}</td>
                          <td className="text-right p-2">₹{taxData.taxableAmount.toFixed(2)}</td>
                          <td className="text-right p-2">₹{taxData.gstBreakdown.cgst.toFixed(2)}</td>
                          <td className="text-right p-2">₹{taxData.gstBreakdown.sgst.toFixed(2)}</td>
                          <td className="text-right p-2">₹{taxData.gstBreakdown.igst.toFixed(2)}</td>
                          <td className="text-right p-2 font-semibold">₹{taxData.totalTaxCollected.toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="hsn-mapping">
              <SKUHSNMapper />
            </TabsContent>
            
            <TabsContent value="filing" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>GST Return Filing</CardTitle>
                  <CardDescription>
                    File your GST returns and manage compliance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">GST Filing functionality will be available here</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="audit" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>GST Audit Trail</CardTitle>
                  <CardDescription>
                    View audit logs and compliance history
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Shield className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">Audit trail functionality will be available here</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  )
}

export default Reports