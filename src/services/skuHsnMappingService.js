import { supabase } from '../supabase/config';
import { toast } from 'sonner';

// SKU to HSN Mapping Service
export const skuHsnMappingService = {
  // Default HSN mappings for different product categories
  getDefaultHsnMappings: () => {
    return {
      // Fruit Juices and Beverages
      'fruit_juice': { hsn: '2009', rate: 12, description: 'Fruit juices and vegetable juices' },
      'flavored_drinks': { hsn: '2202', rate: 18, description: 'Waters, including mineral and aerated waters' },
      'natural_drinks': { hsn: '2009', rate: 12, description: 'Natural fruit and vegetable juices' },
      
      // Category-based mappings for CaneFrost products
      'tropical': { hsn: '2009', rate: 12, description: 'Tropical fruit juices' },
      'citrus': { hsn: '2009', rate: 12, description: 'Citrus fruit juices' },
      'berries': { hsn: '2009', rate: 12, description: 'Berry fruit juices' },
      'spiced_herbal': { hsn: '2202', rate: 18, description: 'Flavored and spiced beverages' },
      
      // Specific product mappings
      'cane_juice': { hsn: '2009', rate: 12, description: 'Sugar cane juice' },
      'plain_cane': { hsn: '2009', rate: 5, description: 'Plain sugar cane juice (essential commodity)' },
      'flavored_cane': { hsn: '2009', rate: 12, description: 'Flavored sugar cane juice' },
      'herbal_drinks': { hsn: '2202', rate: 18, description: 'Herbal and medicinal drinks' }
    };
  },

  // Map product category to HSN code
  mapCategoryToHsn: (category, productName = '', type = '') => {
    const mappings = skuHsnMappingService.getDefaultHsnMappings();
    const lowerCategory = category?.toLowerCase() || '';
    const lowerName = productName?.toLowerCase() || '';
    const lowerType = type?.toLowerCase() || '';

    // Special cases for CaneFrost products
    if (lowerName.includes('justcane') && lowerName.includes('plain')) {
      return mappings['plain_cane'];
    }
    
    if (lowerName.includes('cane') || lowerCategory.includes('cane')) {
      if (lowerName.includes('plain') || lowerType.includes('plain')) {
        return mappings['plain_cane'];
      }
      return mappings['flavored_cane'];
    }

    // Category-based mapping
    switch (lowerType) {
      case 'tropical':
        return mappings['tropical'];
      case 'citrus':
        return mappings['citrus'];
      case 'berries':
        return mappings['berries'];
      case 'spiced/herbal/others':
        if (lowerName.includes('jaljeera') || lowerName.includes('ginger') || 
            lowerName.includes('mint') || lowerName.includes('herbal')) {
          return mappings['herbal_drinks'];
        }
        return mappings['spiced_herbal'];
      default:
        return mappings['fruit_juice'];
    }
  },

  // Get all products without HSN codes
  getProductsWithoutHsn: async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .or('hsn_sac_code.is.null,hsn_sac_code.eq.')
        .order('name');
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching products without HSN:', error);
      return [];
    }
  },

  // Auto-map HSN codes for existing products
  autoMapHsnCodes: async () => {
    try {
      const productsWithoutHsn = await skuHsnMappingService.getProductsWithoutHsn();
      
      if (productsWithoutHsn.length === 0) {
        toast.info('All products already have HSN codes assigned');
        return { success: true, mapped: 0, errors: [] };
      }

      const mappingResults = {
        success: true,
        mapped: 0,
        errors: [],
        details: []
      };

      // First, ensure HSN codes exist in the database
      await skuHsnMappingService.ensureHsnCodesExist();

      for (const product of productsWithoutHsn) {
        try {
          const hsnMapping = skuHsnMappingService.mapCategoryToHsn(
            product.category,
            product.name,
            product.type
          );

          // Update product with HSN code and tax rate
          const { error: updateError } = await supabase
            .from('products')
            .update({
              hsn_sac_code: hsnMapping.hsn,
              tax_rate: hsnMapping.rate,
              updated_at: new Date().toISOString()
            })
            .eq('id', product.id);

          if (updateError) {
            mappingResults.errors.push({
              product: product.name,
              error: updateError.message
            });
          } else {
            mappingResults.mapped++;
            mappingResults.details.push({
              product: product.name,
              sku: product.barcode,
              hsn: hsnMapping.hsn,
              rate: hsnMapping.rate,
              description: hsnMapping.description
            });
          }
        } catch (error) {
          mappingResults.errors.push({
            product: product.name,
            error: error.message
          });
        }
      }

      if (mappingResults.errors.length > 0) {
        mappingResults.success = false;
      }

      return mappingResults;
    } catch (error) {
      console.error('Error in auto-mapping HSN codes:', error);
      return {
        success: false,
        mapped: 0,
        errors: [{ general: error.message }]
      };
    }
  },

  // Ensure required HSN codes exist in the database
  ensureHsnCodesExist: async () => {
    const mappings = skuHsnMappingService.getDefaultHsnMappings();
    const uniqueHsnCodes = [...new Set(Object.values(mappings).map(m => m.hsn))];

    for (const hsnCode of uniqueHsnCodes) {
      const mapping = Object.values(mappings).find(m => m.hsn === hsnCode);
      
      try {
        // Check if HSN code already exists
        const { data: existing } = await supabase
          .from('hsn_sac_codes')
          .select('code')
          .eq('code', hsnCode)
          .single();

        if (!existing) {
          // Insert new HSN code
          const { error } = await supabase
            .from('hsn_sac_codes')
            .insert({
              code: hsnCode,
              description: mapping.description,
              tax_rate: mapping.rate,
              type: 'HSN',
              category: 'Beverages',
              created_at: new Date().toISOString()
            });

          if (error && !error.message.includes('duplicate')) {
            console.error(`Error inserting HSN code ${hsnCode}:`, error);
          }
        }
      } catch (error) {
        // Ignore duplicate key errors
        if (!error.message.includes('duplicate')) {
          console.error(`Error ensuring HSN code ${hsnCode}:`, error);
        }
      }
    }
  },

  // Get HSN mapping statistics
  getMappingStats: async () => {
    try {
      const { data: totalProducts, error: totalError } = await supabase
        .from('products')
        .select('id', { count: 'exact' });

      const { data: mappedProducts, error: mappedError } = await supabase
        .from('products')
        .select('id', { count: 'exact' })
        .not('hsn_sac_code', 'is', null)
        .neq('hsn_sac_code', '');

      if (totalError || mappedError) {
        throw totalError || mappedError;
      }

      const total = totalProducts?.length || 0;
      const mapped = mappedProducts?.length || 0;
      const unmapped = total - mapped;
      const percentage = total > 0 ? Math.round((mapped / total) * 100) : 0;

      return {
        total,
        mapped,
        unmapped,
        percentage
      };
    } catch (error) {
      console.error('Error getting mapping stats:', error);
      return {
        total: 0,
        mapped: 0,
        unmapped: 0,
        percentage: 0
      };
    }
  },

  // Update HSN code for a specific product
  updateProductHsn: async (productId, hsnCode, taxRate) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({
          hsn_sac_code: hsnCode,
          tax_rate: taxRate,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error updating product HSN:', error);
      return { success: false, error: error.message };
    }
  },

  // Bulk update HSN codes
  bulkUpdateHsn: async (updates) => {
    try {
      const results = {
        success: true,
        updated: 0,
        errors: []
      };

      for (const update of updates) {
        const result = await skuHsnMappingService.updateProductHsn(
          update.productId,
          update.hsnCode,
          update.taxRate
        );

        if (result.success) {
          results.updated++;
        } else {
          results.errors.push({
            productId: update.productId,
            error: result.error
          });
        }
      }

      if (results.errors.length > 0) {
        results.success = false;
      }

      return results;
    } catch (error) {
      console.error('Error in bulk HSN update:', error);
      return {
        success: false,
        updated: 0,
        errors: [{ general: error.message }]
      };
    }
  },

  // Generate HSN mapping report
  generateMappingReport: async () => {
    try {
      const { data: products, error } = await supabase
        .from('products')
        .select('id, name, barcode, category, type, hsn_sac_code, tax_rate')
        .order('name');

      if (error) throw error;

      const report = {
        timestamp: new Date().toISOString(),
        products: products.map(product => ({
          id: product.id,
          name: product.name,
          sku: product.barcode,
          category: product.category,
          type: product.type,
          hsnCode: product.hsn_sac_code,
          taxRate: product.tax_rate,
          status: product.hsn_sac_code ? 'Mapped' : 'Unmapped'
        }))
      };

      return report;
    } catch (error) {
      console.error('Error generating mapping report:', error);
      return {
        timestamp: new Date().toISOString(),
        products: [],
        error: error.message
      };
    }
  },

  // Export mapping report as CSV
  exportMappingReport: async () => {
    try {
      const report = await skuHsnMappingService.generateMappingReport();
      
      const csvHeaders = [
        'Product Name',
        'SKU/Barcode',
        'Category',
        'Type',
        'HSN Code',
        'Tax Rate (%)',
        'Status'
      ];

      const csvRows = report.products.map(product => [
        product.name,
        product.sku || '',
        product.category || '',
        product.type || '',
        product.hsnCode || '',
        product.taxRate || '',
        product.status
      ]);

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(field => `"${field}"`).join(','))
      ].join('\n');

      // Create and download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `hsn-mapping-report-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      return { success: true };
    } catch (error) {
      console.error('Error exporting mapping report:', error);
      return { success: false, error: error.message };
    }
  }
};

export default skuHsnMappingService;