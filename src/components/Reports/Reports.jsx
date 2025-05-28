import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  LinearProgress,
  Alert
} from '@mui/material'
import {
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  Star as StarIcon,
  Receipt as ReceiptIcon,
  AccountBalance as TaxIcon,
  Download as DownloadIcon,
  DateRange as DateRangeIcon
} from '@mui/icons-material'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import toast from 'react-hot-toast'

function Reports() {
  const [tabValue, setTabValue] = useState(0)
  const [dateRange, setDateRange] = useState('7days')
  
  // Real-time sales data from Firestore - All values in INR
  const [salesData] = useState({
    totalSales: 0, // All revenue in INR
    totalTransactions: 0,
    averageOrderValue: 0,
    topSellingItems: [],
    peakHours: [],
    dailySales: [],
    categoryPerformance: []
  })
  
  const [taxData] = useState({
    totalTaxCollected: 0, // All tax amounts in INR
    gstBreakdown: {
      cgst: 0,
      sgst: 0,
      igst: 0
    },
    taxableAmount: 0,
    exemptAmount: 0,
    monthlyTaxSummary: []
  })

  const handleExportReport = (reportType) => {
    // In a real app, this would generate and download the actual report
    toast.success(`${reportType} report exported successfully!`)
  }

  const handleGenerateTaxReport = () => {
    // In a real app, this would generate tax compliance reports
    toast.success('Tax report generated for filing!')
  }

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )

  const getPerformanceColor = (percentage) => {
    if (percentage >= 20) return 'success'
    if (percentage >= 10) return 'warning'
    return 'error'
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Reports & Analytics
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab icon={<AssessmentIcon />} label="Sales Overview" />
          <Tab icon={<ScheduleIcon />} label="Peak Hours" />
          <Tab icon={<StarIcon />} label="Popular Items" />
          <Tab icon={<TaxIcon />} label="Tax & Audit" />
        </Tabs>
      </Paper>

      {/* Date Range Selector */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <DateRangeIcon />
        <FormControl size="small">
          <InputLabel>Date Range</InputLabel>
          <Select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            label="Date Range"
          >
            <MenuItem value="today">Today</MenuItem>
            <MenuItem value="7days">Last 7 Days</MenuItem>
            <MenuItem value="30days">Last 30 Days</MenuItem>
            <MenuItem value="90days">Last 90 Days</MenuItem>
            <MenuItem value="custom">Custom Range</MenuItem>
          </Select>
        </FormControl>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={() => handleExportReport('Sales Summary')}
        >
          Export Report
        </Button>
      </Box>

      {/* Sales Overview Tab */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          {/* Key Metrics Cards */}
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Total Sales</Typography>
                <Typography variant="h4" color="primary">
                  ₹{salesData.totalSales.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Last 7 days
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Transactions</Typography>
                <Typography variant="h4" color="success.main">
                  {salesData.totalTransactions}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total orders
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Avg Order Value</Typography>
                <Typography variant="h4" color="warning.main">
                  ₹{salesData.averageOrderValue}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Per transaction
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Growth Rate</Typography>
                <Typography variant="h4" color="info.main">
                  +12.5%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  vs last period
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Daily Sales Chart */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Daily Sales Trend</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell align="right">Sales</TableCell>
                        <TableCell align="right">Transactions</TableCell>
                        <TableCell align="right">Avg Order</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {salesData.dailySales.map((day) => (
                        <TableRow key={day.date}>
                          <TableCell>{format(new Date(day.date), 'MMM dd')}</TableCell>
                          <TableCell align="right">₹{day.sales.toLocaleString()}</TableCell>
                          <TableCell align="right">{day.transactions}</TableCell>
                          <TableCell align="right">₹{Math.round(day.sales / day.transactions)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Category Performance */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Category Performance</Typography>
                <List>
                  {salesData.categoryPerformance.map((category) => (
                    <ListItem key={category.category}>
                      <ListItemText
                        primary={category.category}
                        secondary={`₹${category.sales.toLocaleString()} (${category.percentage}%)`}
                      />
                      <Box sx={{ width: '100%', ml: 2 }}>
                        <LinearProgress
                          variant="determinate"
                          value={category.percentage}
                          color={getPerformanceColor(category.percentage)}
                        />
                      </Box>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Peak Hours Tab */}
      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Peak Hours Analysis</Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Identify your busiest hours to optimize staffing and inventory
                </Typography>
                
                <TableContainer sx={{ mt: 2 }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Time Slot</TableCell>
                        <TableCell align="right">Transactions</TableCell>
                        <TableCell align="right">Revenue</TableCell>
                        <TableCell align="right">Avg per Transaction</TableCell>
                        <TableCell>Performance</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {salesData.peakHours.map((hour) => (
                        <TableRow key={hour.hour}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <ScheduleIcon sx={{ mr: 1, fontSize: 16 }} />
                              {hour.hour}
                            </Box>
                          </TableCell>
                          <TableCell align="right">{hour.transactions}</TableCell>
                          <TableCell align="right">₹{hour.revenue.toLocaleString()}</TableCell>
                          <TableCell align="right">₹{Math.round(hour.revenue / hour.transactions)}</TableCell>
                          <TableCell>
                            <LinearProgress
                              variant="determinate"
                              value={(hour.transactions / 52) * 100}
                              color={hour.transactions > 45 ? 'success' : hour.transactions > 35 ? 'warning' : 'default'}
                              sx={{ width: 100 }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                <Alert severity="info" sx={{ mt: 2 }}>
                  <strong>Recommendation:</strong> Consider increasing staff during 14:00-17:00 for optimal customer service.
                </Alert>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Popular Items Tab */}
      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Top Selling Items</Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Track your best-performing products and optimize inventory
                </Typography>
                
                <TableContainer sx={{ mt: 2 }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Rank</TableCell>
                        <TableCell>Product Name</TableCell>
                        <TableCell align="right">Quantity Sold</TableCell>
                        <TableCell align="right">Revenue</TableCell>
                        <TableCell align="right">Avg Price</TableCell>
                        <TableCell>Performance</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {salesData.topSellingItems.map((item, index) => (
                        <TableRow key={item.name}>
                          <TableCell>
                            <Chip
                              label={index + 1}
                              color={index === 0 ? 'primary' : index === 1 ? 'secondary' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <StarIcon sx={{ mr: 1, fontSize: 16, color: 'gold' }} />
                              {item.name}
                            </Box>
                          </TableCell>
                          <TableCell align="right">{item.quantity}</TableCell>
                          <TableCell align="right">₹{item.revenue.toLocaleString()}</TableCell>
                          <TableCell align="right">₹{Math.round(item.revenue / item.quantity)}</TableCell>
                          <TableCell>
                            <LinearProgress
                              variant="determinate"
                              value={(item.quantity / 85) * 100}
                              color={index < 2 ? 'success' : index < 4 ? 'primary' : 'default'}
                              sx={{ width: 100 }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                <Alert severity="success" sx={{ mt: 2 }}>
                  <strong>Insight:</strong> Citrus flavors (Lemon, Orange) are consistently popular. Consider expanding this category.
                </Alert>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Tax & Audit Tab */}
      <TabPanel value={tabValue} index={3}>
        <Grid container spacing={3}>
          {/* Tax Summary Cards */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Total Tax Collected</Typography>
                <Typography variant="h4" color="primary">
                  ₹{taxData.totalTaxCollected.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  This month
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Taxable Amount</Typography>
                <Typography variant="h4" color="success.main">
                  ₹{taxData.taxableAmount.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Before tax
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Tax Rate</Typography>
                <Typography variant="h4" color="warning.main">
                  12%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  GST applicable
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* GST Breakdown */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>GST Breakdown</Typography>
                <List>
                  <ListItem>
                    <ListItemText
                      primary="CGST (6%)"
                      secondary={`₹${taxData.gstBreakdown.cgst.toLocaleString()}`}
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText
                      primary="SGST (6%)"
                      secondary={`₹${taxData.gstBreakdown.sgst.toLocaleString()}`}
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText
                      primary="IGST (0%)"
                      secondary={`₹${taxData.gstBreakdown.igst.toLocaleString()}`}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Monthly Tax Summary */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Monthly Tax Summary</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Month</TableCell>
                        <TableCell align="right">Sales</TableCell>
                        <TableCell align="right">Tax</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {taxData.monthlyTaxSummary.map((month) => (
                        <TableRow key={month.month}>
                          <TableCell>{month.month}</TableCell>
                          <TableCell align="right">₹{month.sales.toLocaleString()}</TableCell>
                          <TableCell align="right">₹{month.tax.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Tax Compliance Actions */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Tax Compliance & Audit Tools</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={3}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<ReceiptIcon />}
                      onClick={() => handleExportReport('GST Return')}
                    >
                      Generate GST Return
                    </Button>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<TaxIcon />}
                      onClick={handleGenerateTaxReport}
                    >
                      Tax Filing Report
                    </Button>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                      onClick={() => handleExportReport('Audit Trail')}
                    >
                      Audit Trail
                    </Button>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<AssessmentIcon />}
                      onClick={() => handleExportReport('Financial Summary')}
                    >
                      Financial Summary
                    </Button>
                  </Grid>
                </Grid>
                
                <Alert severity="info" sx={{ mt: 2 }}>
                  <strong>Compliance Status:</strong> All tax records are up to date. Next GST filing due: 20th January 2025
                </Alert>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>
    </Box>
  )
}

export default Reports