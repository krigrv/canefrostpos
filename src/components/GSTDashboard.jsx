import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner';
import gstAuditService from '../services/gstAuditService';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Shield,
  Download,
  RefreshCw,
  Eye,
  Settings,
  Users,
  Database
} from 'lucide-react';
import { format, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';

const GSTDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    overview: {},
    compliance: {},
    filings: [],
    recentActivity: [],
    alerts: [],
    trends: {}
  });
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('current_month');
  const [refreshing, setRefreshing] = useState(false);

  const periods = [
    { value: 'current_month', label: 'Current Month' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'quarter', label: 'Current Quarter' },
    { value: 'year', label: 'Current Year' }
  ];

  useEffect(() => {
    loadDashboardData();
  }, [selectedPeriod]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const period = getPeriodDates(selectedPeriod);
      const data = await gstAuditService.getDashboardData(period);
      setDashboardData(data || {
        overview: {},
        compliance: {},
        filings: [],
        recentActivity: [],
        alerts: [],
        trends: {}
      });
    } catch (error) {
      toast.error('Failed to load dashboard data');
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshDashboard = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
    toast.success('Dashboard refreshed');
  };

  const getPeriodDates = (period) => {
    const now = new Date();
    switch (period) {
      case 'current_month':
        return { from: startOfMonth(now), to: endOfMonth(now) };
      case 'last_month':
        const lastMonth = subMonths(now, 1);
        return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
      case 'quarter':
        const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        const quarterEnd = new Date(quarterStart.getFullYear(), quarterStart.getMonth() + 3, 0);
        return { from: quarterStart, to: quarterEnd };
      case 'year':
        return { from: new Date(now.getFullYear(), 0, 1), to: new Date(now.getFullYear(), 11, 31) };
      default:
        return { from: startOfMonth(now), to: endOfMonth(now) };
    }
  };

  const getComplianceColor = (score) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getFilingStatusBadge = (status) => {
    const statusConfig = {
      'FILED': { variant: 'default', color: 'bg-green-500' },
      'PENDING': { variant: 'secondary', color: 'bg-yellow-500' },
      'OVERDUE': { variant: 'destructive', color: 'bg-red-500' },
      'DRAFT': { variant: 'outline', color: 'bg-gray-500' }
    };
    
    const config = statusConfig[status] || { variant: 'outline', color: 'bg-gray-500' };
    
    return (
      <Badge variant={config.variant}>
        {status}
      </Badge>
    );
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'ERROR':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'WARNING':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'INFO':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatPercentage = (value) => {
    return `${(value || 0).toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8" />
            GST Dashboard
          </h1>
          <p className="text-muted-foreground">Comprehensive overview of your GST compliance and activities</p>
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            {periods.map(period => (
              <option key={period.value} value={period.value}>
                {period.label}
              </option>
            ))}
          </select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={refreshDashboard}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {dashboardData.alerts && dashboardData.alerts.length > 0 && (
        <div className="space-y-2">
          {dashboardData.alerts.slice(0, 3).map((alert, index) => (
            <Alert key={index} className={alert.type === 'ERROR' ? 'border-red-200' : alert.type === 'WARNING' ? 'border-yellow-200' : 'border-blue-200'}>
              {getAlertIcon(alert.type)}
              <AlertDescription className="ml-2">
                {alert.message}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Sales</p>
                <div className="text-2xl font-bold">
                  {formatCurrency(dashboardData.overview?.totalSales)}
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  {dashboardData.trends?.salesGrowth >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                  )}
                  {formatPercentage(Math.abs(dashboardData.trends?.salesGrowth))} from last period
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">GST Collected</p>
                <div className="text-2xl font-bold">
                  {formatCurrency(dashboardData.overview?.totalGST)}
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  {dashboardData.trends?.gstGrowth >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                  )}
                  {formatPercentage(Math.abs(dashboardData.trends?.gstGrowth))} from last period
                </div>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Compliance Score</p>
                <div className={`text-2xl font-bold ${getComplianceColor(dashboardData.compliance?.score)}`}>
                  {dashboardData.compliance?.score || 0}%
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${dashboardData.compliance?.score || 0}%` }}
                  ></div>
                </div>
              </div>
              <Shield className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Filings</p>
                <div className="text-2xl font-bold">
                  {dashboardData.overview?.pendingFilings || 0}
                </div>
                <div className="text-xs text-muted-foreground">
                  {dashboardData.overview?.overdueFilings || 0} overdue
                </div>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="filings">Filings</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* GST Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  GST Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">CGST</span>
                    <span className="font-bold">{formatCurrency(dashboardData.overview?.cgst)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">SGST</span>
                    <span className="font-bold">{formatCurrency(dashboardData.overview?.sgst)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">IGST</span>
                    <span className="font-bold">{formatCurrency(dashboardData.overview?.igst)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">UTGST</span>
                    <span className="font-bold">{formatCurrency(dashboardData.overview?.utgst)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Compliance Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Compliance Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">GSTR-1 Filing</span>
                    <Badge variant={dashboardData.compliance?.gstr1Status === 'FILED' ? 'default' : 'destructive'}>
                      {dashboardData.compliance?.gstr1Status || 'PENDING'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">GSTR-3B Filing</span>
                    <Badge variant={dashboardData.compliance?.gstr3bStatus === 'FILED' ? 'default' : 'destructive'}>
                      {dashboardData.compliance?.gstr3bStatus || 'PENDING'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">E-way Bills</span>
                    <span className="text-sm">
                      {dashboardData.overview?.activeEwayBills || 0} active
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">HSN Codes</span>
                    <span className="text-sm">
                      {dashboardData.overview?.hsnCodesCount || 0} configured
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="filings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Filings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.filings && dashboardData.filings.length > 0 ? (
                  dashboardData.filings.map((filing, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-blue-500" />
                        <div>
                          <div className="font-medium">{filing.type}</div>
                          <div className="text-sm text-muted-foreground">
                            Period: {filing.period}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {formatCurrency(filing.taxAmount)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(filing.dueDate), 'dd/MM/yyyy')}
                          </div>
                        </div>
                        {getFilingStatusBadge(filing.status)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No recent filings found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.recentActivity && dashboardData.recentActivity.length > 0 ? (
                  dashboardData.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 border-l-2 border-blue-200">
                      <div className="flex-shrink-0 mt-1">
                        {activity.type === 'FILING' && <FileText className="h-4 w-4 text-blue-500" />}
                        {activity.type === 'SALE' && <DollarSign className="h-4 w-4 text-green-500" />}
                        {activity.type === 'CONFIG' && <Settings className="h-4 w-4 text-gray-500" />}
                        {activity.type === 'AUDIT' && <Shield className="h-4 w-4 text-purple-500" />}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{activity.description}</div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(activity.timestamp), 'dd/MM/yyyy HH:mm')}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No recent activity found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Sales Growth</span>
                    <span className={`font-bold ${dashboardData.trends?.salesGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {formatPercentage(dashboardData.trends?.salesGrowth)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">GST Collection Growth</span>
                    <span className={`font-bold ${dashboardData.trends?.gstGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {formatPercentage(dashboardData.trends?.gstGrowth)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Compliance Score Change</span>
                    <span className={`font-bold ${dashboardData.trends?.complianceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {formatPercentage(dashboardData.trends?.complianceChange)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Key Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Average Transaction Value</span>
                    <span className="font-bold">
                      {formatCurrency(dashboardData.overview?.avgTransactionValue)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Transactions</span>
                    <span className="font-bold">
                      {dashboardData.overview?.totalTransactions || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Effective Tax Rate</span>
                    <span className="font-bold">
                      {formatPercentage(dashboardData.overview?.effectiveTaxRate)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GSTDashboard;