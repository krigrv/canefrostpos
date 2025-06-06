import { supabase } from '../supabase/config'
import toast from 'react-hot-toast'

// HSN/SAC Code Management
export const hsnSacService = {
  // Validate HSN/SAC code format
  validateCode: (code, type = 'HSN') => {
    if (type === 'HSN') {
      // HSN codes are 4, 6, or 8 digits
      return /^\d{4}(\d{2})?(\d{2})?$/.test(code)
    } else {
      // SAC codes are 6 digits
      return /^\d{6}$/.test(code)
    }
  },

  // Get tax rate for HSN/SAC code
  getTaxRate: async (code) => {
    try {
      const { data, error } = await supabase
        .from('hsn_sac_codes')
        .select('tax_rate, description, type')
        .eq('code', code)
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching tax rate:', error)
      return null
    }
  },

  // Add new HSN/SAC code
  addCode: async (codeData) => {
    try {
      const { data, error } = await supabase
        .from('hsn_sac_codes')
        .insert([
          {
            code: codeData.code,
            description: codeData.description,
            tax_rate: codeData.taxRate,
            type: codeData.type,
            created_at: new Date().toISOString()
          }
        ])
        .select()
      
      if (error) throw error
      return data[0]
    } catch (error) {
      console.error('Error adding HSN/SAC code:', error)
      throw error
    }
  },

  // Get all HSN/SAC codes
  getAllCodes: async () => {
    try {
      const { data, error } = await supabase
        .from('hsn_sac_codes')
        .select('*')
        .order('code')
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching HSN/SAC codes:', error)
      return []
    }
  }
}

// GSTIN Validation Service
export const gstinService = {
  // Validate GSTIN format
  validateFormat: (gstin) => {
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
    return gstinRegex.test(gstin)
  },

  // Extract state code from GSTIN
  getStateCode: (gstin) => {
    if (!gstin || gstin.length < 2) return null
    return gstin.substring(0, 2)
  },

  // Check if transaction is inter-state
  isInterState: (sellerGstin, buyerGstin) => {
    if (!sellerGstin || !buyerGstin) return false
    return gstinService.getStateCode(sellerGstin) !== gstinService.getStateCode(buyerGstin)
  },

  // Validate GSTIN with government API (mock implementation)
  validateWithAPI: async (gstin) => {
    try {
      // In real implementation, this would call GST API
      // For now, we'll simulate validation
      if (!gstinService.validateFormat(gstin)) {
        return { valid: false, error: 'Invalid GSTIN format' }
      }
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      return {
        valid: true,
        businessName: 'Sample Business Name',
        address: 'Sample Address',
        status: 'Active'
      }
    } catch (error) {
      return { valid: false, error: 'API validation failed' }
    }
  }
}

// Tax Calculation Service
export const taxCalculationService = {
  // Calculate GST based on amount and rate
  calculateGST: (amount, rate, isInterState = false) => {
    const gstAmount = (amount * rate) / 100
    
    if (isInterState) {
      return {
        igst: gstAmount,
        cgst: 0,
        sgst: 0,
        total: gstAmount
      }
    } else {
      return {
        igst: 0,
        cgst: gstAmount / 2,
        sgst: gstAmount / 2,
        total: gstAmount
      }
    }
  },

  // Calculate reverse charge
  calculateReverseCharge: (amount, rate) => {
    return {
      taxableValue: amount,
      gstAmount: (amount * rate) / 100,
      totalAmount: amount + (amount * rate) / 100
    }
  },

  // Calculate Input Tax Credit
  calculateITC: (purchases) => {
    return purchases.reduce((total, purchase) => {
      if (purchase.itcEligible) {
        return total + (purchase.gstAmount || 0)
      }
      return total
    }, 0)
  }
}

// GSTR Filing Service
export const gstrFilingService = {
  // Generate GSTR-1 data
  generateGSTR1: async (month, year) => {
    try {
      const startDate = new Date(year, month - 1, 1)
      const endDate = new Date(year, month, 0)
      
      const { data: sales, error } = await supabase
        .from('sales')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
      
      if (error) throw error
      
      // Process sales data for GSTR-1 format
      const gstr1Data = {
        gstin: '', // Get from settings
        period: `${month.toString().padStart(2, '0')}${year}`,
        b2b: [], // B2B supplies
        b2cl: [], // B2C Large supplies
        b2cs: [], // B2C Small supplies
        exp: [], // Exports
        nil: [], // Nil rated supplies
        hsn: [] // HSN summary
      }
      
      // Process each sale
      sales.forEach(sale => {
        if (sale.customerGstin) {
          // B2B transaction
          gstr1Data.b2b.push({
            ctin: sale.customerGstin,
            inv: [{
              inum: sale.invoiceNumber,
              idt: sale.invoiceDate,
              val: sale.total,
              pos: sale.placeOfSupply,
              rchrg: sale.reverseCharge || 'N',
              itms: sale.items.map(item => ({
                num: item.serialNumber,
                itm_det: {
                  hsn_sc: item.hsnCode,
                  txval: item.taxableValue,
                  irt: item.taxRate,
                  iamt: item.igst || 0,
                  camt: item.cgst || 0,
                  samt: item.sgst || 0
                }
              }))
            }]
          })
        } else {
          // B2C transaction
          if (sale.total > 250000) {
            gstr1Data.b2cl.push({
              pos: sale.placeOfSupply,
              inv: [{
                inum: sale.invoiceNumber,
                idt: sale.invoiceDate,
                val: sale.total,
                itms: sale.items.map(item => ({
                  num: item.serialNumber,
                  itm_det: {
                    hsn_sc: item.hsnCode,
                    txval: item.taxableValue,
                    irt: item.taxRate,
                    iamt: item.igst || 0,
                    camt: item.cgst || 0,
                    samt: item.sgst || 0
                  }
                }))
              }]
            })
          } else {
            // B2C Small - aggregate by rate and place of supply
            const key = `${sale.placeOfSupply}_${sale.taxRate}`
            if (!gstr1Data.b2cs[key]) {
              gstr1Data.b2cs[key] = {
                pos: sale.placeOfSupply,
                rt: sale.taxRate,
                typ: 'OE', // Other than exempted
                txval: 0,
                iamt: 0,
                camt: 0,
                samt: 0
              }
            }
            gstr1Data.b2cs[key].txval += sale.taxableValue
            gstr1Data.b2cs[key].iamt += sale.igst || 0
            gstr1Data.b2cs[key].camt += sale.cgst || 0
            gstr1Data.b2cs[key].samt += sale.sgst || 0
          }
        }
      })
      
      return gstr1Data
    } catch (error) {
      console.error('Error generating GSTR-1:', error)
      throw error
    }
  },

  // Generate GSTR-3B data
  generateGSTR3B: async (month, year) => {
    try {
      const startDate = new Date(year, month - 1, 1)
      const endDate = new Date(year, month, 0)
      
      // Get sales data
      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
      
      if (salesError) throw salesError
      
      // Get purchase data
      const { data: purchases, error: purchaseError } = await supabase
        .from('purchases')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
      
      if (purchaseError) throw purchaseError
      
      // Calculate outward supplies
      const outwardSupplies = sales.reduce((acc, sale) => {
        acc.taxableValue += sale.taxableValue || 0
        acc.igst += sale.igst || 0
        acc.cgst += sale.cgst || 0
        acc.sgst += sale.sgst || 0
        return acc
      }, { taxableValue: 0, igst: 0, cgst: 0, sgst: 0 })
      
      // Calculate inward supplies and ITC
      const inwardSupplies = purchases.reduce((acc, purchase) => {
        acc.taxableValue += purchase.taxableValue || 0
        acc.igst += purchase.igst || 0
        acc.cgst += purchase.cgst || 0
        acc.sgst += purchase.sgst || 0
        
        if (purchase.itcEligible) {
          acc.itcAvailed.igst += purchase.igst || 0
          acc.itcAvailed.cgst += purchase.cgst || 0
          acc.itcAvailed.sgst += purchase.sgst || 0
        }
        
        return acc
      }, { 
        taxableValue: 0, 
        igst: 0, 
        cgst: 0, 
        sgst: 0,
        itcAvailed: { igst: 0, cgst: 0, sgst: 0 }
      })
      
      const gstr3bData = {
        gstin: '', // Get from settings
        period: `${month.toString().padStart(2, '0')}${year}`,
        outwardSupplies,
        inwardSupplies,
        itcAvailed: inwardSupplies.itcAvailed,
        taxLiability: {
          igst: Math.max(0, outwardSupplies.igst - inwardSupplies.itcAvailed.igst),
          cgst: Math.max(0, outwardSupplies.cgst - inwardSupplies.itcAvailed.cgst),
          sgst: Math.max(0, outwardSupplies.sgst - inwardSupplies.itcAvailed.sgst)
        }
      }
      
      return gstr3bData
    } catch (error) {
      console.error('Error generating GSTR-3B:', error)
      throw error
    }
  },

  // File GSTR return (mock implementation)
  fileGSTR: async (gstrType, data) => {
    try {
      // In real implementation, this would call GST portal API
      // For now, we'll simulate filing
      
      // Save filing record
      const { data: filing, error } = await supabase
        .from('gstr_filings')
        .insert([
          {
            gstr_type: gstrType,
            period: data.period,
            gstin: data.gstin,
            filing_data: data,
            status: 'Filed',
            filed_at: new Date().toISOString()
          }
        ])
        .select()
      
      if (error) throw error
      
      toast.success(`${gstrType} filed successfully!`)
      return filing[0]
    } catch (error) {
      console.error('Error filing GSTR:', error)
      toast.error('Failed to file GSTR')
      throw error
    }
  }
}

// Compliance and Audit Service
export const complianceService = {
  // Check compliance status
  checkCompliance: async () => {
    try {
      const currentDate = new Date()
      const currentMonth = currentDate.getMonth() + 1
      const currentYear = currentDate.getFullYear()
      
      // Check if GSTR-1 is filed for last month
      const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1
      const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear
      
      const { data: gstr1Filing, error } = await supabase
        .from('gstr_filings')
        .select('*')
        .eq('gstr_type', 'GSTR-1')
        .eq('period', `${lastMonth.toString().padStart(2, '0')}${lastMonthYear}`)
        .single()
      
      const compliance = {
        gstr1Filed: !!gstr1Filing,
        gstr3bFiled: false, // Check similarly
        nextDueDate: new Date(currentYear, currentMonth - 1, 20), // 20th of current month
        penalties: [],
        recommendations: []
      }
      
      if (!compliance.gstr1Filed) {
        compliance.recommendations.push('File GSTR-1 for last month')
      }
      
      return compliance
    } catch (error) {
      console.error('Error checking compliance:', error)
      return {
        gstr1Filed: false,
        gstr3bFiled: false,
        nextDueDate: new Date(),
        penalties: [],
        recommendations: ['Unable to check compliance status']
      }
    }
  },

  // Generate audit trail
  generateAuditTrail: async (startDate, endDate) => {
    try {
      const { data: transactions, error } = await supabase
        .from('audit_trail')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      return transactions.map(transaction => ({
        id: transaction.id,
        timestamp: transaction.created_at,
        type: transaction.transaction_type,
        description: transaction.description,
        amount: transaction.amount,
        taxAmount: transaction.tax_amount,
        user: transaction.user_id,
        reference: transaction.reference_number
      }))
    } catch (error) {
      console.error('Error generating audit trail:', error)
      return []
    }
  },

  // Reconcile GST data
  reconcileGST: async (month, year) => {
    try {
      const gstr1Data = await gstrFilingService.generateGSTR1(month, year)
      const gstr3bData = await gstrFilingService.generateGSTR3B(month, year)
      
      const reconciliation = {
        period: `${month.toString().padStart(2, '0')}${year}`,
        outwardSupplies: gstr1Data.b2b.length + gstr1Data.b2cl.length + Object.keys(gstr1Data.b2cs).length,
        totalTaxCollected: gstr3bData.outwardSupplies.igst + gstr3bData.outwardSupplies.cgst + gstr3bData.outwardSupplies.sgst,
        totalITCAvailed: gstr3bData.itcAvailed.igst + gstr3bData.itcAvailed.cgst + gstr3bData.itcAvailed.sgst,
        netTaxLiability: gstr3bData.taxLiability.igst + gstr3bData.taxLiability.cgst + gstr3bData.taxLiability.sgst,
        discrepancies: [],
        recommendations: []
      }
      
      // Add reconciliation logic here
      if (reconciliation.totalTaxCollected === 0) {
        reconciliation.discrepancies.push('No tax collected in the period')
      }
      
      return reconciliation
    } catch (error) {
      console.error('Error reconciling GST:', error)
      throw error
    }
  }
}

// E-way Bill Service
export const ewayBillService = {
  // Generate e-way bill
  generateEwayBill: async (invoiceData) => {
    try {
      // Validate if e-way bill is required
      if (invoiceData.total < 50000) {
        return { required: false, message: 'E-way bill not required for amounts below ₹50,000' }
      }
      
      const ewayBillData = {
        supplyType: invoiceData.supplyType || 'O', // Outward
        subSupplyType: invoiceData.subSupplyType || '1', // Supply
        docType: 'INV', // Invoice
        docNo: invoiceData.invoiceNumber,
        docDate: invoiceData.invoiceDate,
        fromGstin: invoiceData.sellerGstin,
        fromTrdName: invoiceData.sellerName,
        fromAddr1: invoiceData.sellerAddress,
        fromPlace: invoiceData.sellerPlace,
        fromPincode: invoiceData.sellerPincode,
        fromStateCode: gstinService.getStateCode(invoiceData.sellerGstin),
        toGstin: invoiceData.buyerGstin,
        toTrdName: invoiceData.buyerName,
        toAddr1: invoiceData.buyerAddress,
        toPlace: invoiceData.buyerPlace,
        toPincode: invoiceData.buyerPincode,
        toStateCode: gstinService.getStateCode(invoiceData.buyerGstin),
        totalValue: invoiceData.total,
        cgstValue: invoiceData.cgst || 0,
        sgstValue: invoiceData.sgst || 0,
        igstValue: invoiceData.igst || 0,
        cessValue: invoiceData.cess || 0,
        transporterId: invoiceData.transporterId,
        transporterName: invoiceData.transporterName,
        transDocNo: invoiceData.transportDocNumber,
        transMode: invoiceData.transportMode || '1', // Road
        distance: invoiceData.distance || 0,
        vehicleNo: invoiceData.vehicleNumber
      }
      
      // In real implementation, this would call e-way bill API
      // For now, we'll simulate generation
      const ewayBillNumber = `EWB${Date.now()}`
      
      // Save e-way bill record
      const { data, error } = await supabase
        .from('eway_bills')
        .insert([
          {
            eway_bill_number: ewayBillNumber,
            invoice_number: invoiceData.invoiceNumber,
            eway_bill_data: ewayBillData,
            status: 'Generated',
            generated_at: new Date().toISOString()
          }
        ])
        .select()
      
      if (error) throw error
      
      return {
        required: true,
        ewayBillNumber,
        validUpto: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        data: ewayBillData
      }
    } catch (error) {
      console.error('Error generating e-way bill:', error)
      throw error
    }
  },

  // Cancel e-way bill
  cancelEwayBill: async (ewayBillNumber, reason) => {
    try {
      const { data, error } = await supabase
        .from('eway_bills')
        .update({
          status: 'Cancelled',
          cancellation_reason: reason,
          cancelled_at: new Date().toISOString()
        })
        .eq('eway_bill_number', ewayBillNumber)
        .select()
      
      if (error) throw error
      
      toast.success('E-way bill cancelled successfully')
      return data[0]
    } catch (error) {
      console.error('Error cancelling e-way bill:', error)
      toast.error('Failed to cancel e-way bill')
      throw error
    }
  }
}

export default {
  hsnSacService,
  gstinService,
  taxCalculationService,
  gstrFilingService,
  complianceService,
  ewayBillService
}