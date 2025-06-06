import { getHSNCode, searchHSNCode, validateHSNCode } from 'hsn-code-package';
import { supabase } from '../supabase/config';

/**
 * HSN Code Analyzer Utility
 * Analyzes inventory items and suggests appropriate HSN codes
 */
class HSNCodeAnalyzer {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Analyze a product and suggest HSN codes
   * @param {Object} product - Product object with name, category, description
   * @returns {Promise<Object>} Analysis result with suggested HSN codes
   */
  async analyzeProduct(product) {
    try {
      const { name, category, description = '', subcategory = '' } = product;
      
      // Create search terms from product data
      const searchTerms = this.extractSearchTerms(name, category, description, subcategory);
      
      const suggestions = [];
      
      // Search for HSN codes using different terms
      for (const term of searchTerms) {
        try {
          const results = await searchHSNCode(term);
          if (results && results.length > 0) {
            suggestions.push(...results.map(result => ({
              ...result,
              searchTerm: term,
              confidence: this.calculateConfidence(term, result, product)
            })));
          }
        } catch (error) {
          console.warn(`Failed to search HSN for term: ${term}`, error);
        }
      }
      
      // Remove duplicates and sort by confidence
      const uniqueSuggestions = this.removeDuplicates(suggestions)
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 5); // Top 5 suggestions
      
      return {
        product,
        suggestions: uniqueSuggestions,
        recommendedHSN: uniqueSuggestions[0] || null,
        analysisDate: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error analyzing product:', error);
      return {
        product,
        suggestions: [],
        recommendedHSN: null,
        error: error.message,
        analysisDate: new Date().toISOString()
      };
    }
  }

  /**
   * Analyze all products in inventory
   * @returns {Promise<Array>} Array of analysis results
   */
  async analyzeInventory() {
    try {
      // Fetch all products from inventory
      const { data: products, error } = await supabase
        .from('inventory')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      const results = [];
      const total = products.length;
      
      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        const analysis = await this.analyzeProduct(product);
        results.push(analysis);
        
        // Progress callback if needed
        if (this.onProgress) {
          this.onProgress({
            current: i + 1,
            total,
            percentage: Math.round(((i + 1) / total) * 100),
            currentProduct: product.name
          });
        }
      }
      
      return results;
    } catch (error) {
      console.error('Error analyzing inventory:', error);
      throw error;
    }
  }

  /**
   * Extract search terms from product data
   * @param {string} name - Product name
   * @param {string} category - Product category
   * @param {string} description - Product description
   * @param {string} subcategory - Product subcategory
   * @returns {Array<string>} Array of search terms
   */
  extractSearchTerms(name, category, description, subcategory) {
    const terms = new Set();
    
    // Add category and subcategory
    if (category) terms.add(category.toLowerCase().trim());
    if (subcategory) terms.add(subcategory.toLowerCase().trim());
    
    // Extract meaningful words from product name
    const nameWords = name.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !this.isStopWord(word));
    
    nameWords.forEach(word => terms.add(word));
    
    // Extract from description if available
    if (description) {
      const descWords = description.toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 3 && !this.isStopWord(word));
      
      descWords.slice(0, 3).forEach(word => terms.add(word)); // Limit to first 3 meaningful words
    }
    
    // Add compound terms
    if (category && nameWords.length > 0) {
      terms.add(`${category.toLowerCase()} ${nameWords[0]}`);
    }
    
    return Array.from(terms).slice(0, 8); // Limit to 8 terms to avoid too many API calls
  }

  /**
   * Calculate confidence score for HSN suggestion
   * @param {string} searchTerm - The term used for search
   * @param {Object} hsnResult - HSN search result
   * @param {Object} product - Original product
   * @returns {number} Confidence score (0-100)
   */
  calculateConfidence(searchTerm, hsnResult, product) {
    let confidence = 50; // Base confidence
    
    const { name, category } = product;
    const { description = '', code = '' } = hsnResult;
    
    // Boost confidence if search term matches category
    if (category && searchTerm.toLowerCase().includes(category.toLowerCase())) {
      confidence += 20;
    }
    
    // Boost confidence if HSN description contains product name words
    const productWords = name.toLowerCase().split(/\s+/);
    const hsnWords = description.toLowerCase().split(/\s+/);
    
    const matchingWords = productWords.filter(word => 
      hsnWords.some(hsnWord => hsnWord.includes(word) || word.includes(hsnWord))
    );
    
    confidence += Math.min(matchingWords.length * 10, 30);
    
    // Reduce confidence for very generic terms
    if (['item', 'product', 'goods'].includes(searchTerm.toLowerCase())) {
      confidence -= 15;
    }
    
    return Math.min(Math.max(confidence, 0), 100);
  }

  /**
   * Remove duplicate HSN suggestions
   * @param {Array} suggestions - Array of HSN suggestions
   * @returns {Array} Deduplicated suggestions
   */
  removeDuplicates(suggestions) {
    const seen = new Set();
    return suggestions.filter(suggestion => {
      const key = suggestion.code || suggestion.hsn || suggestion.id;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Check if a word is a stop word
   * @param {string} word - Word to check
   * @returns {boolean} True if stop word
   */
  isStopWord(word) {
    const stopWords = new Set([
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
      'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before',
      'after', 'above', 'below', 'between', 'among', 'is', 'are', 'was',
      'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does',
      'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must',
      'can', 'shall', 'this', 'that', 'these', 'those', 'a', 'an'
    ]);
    return stopWords.has(word.toLowerCase());
  }

  /**
   * Validate an HSN code
   * @param {string} hsnCode - HSN code to validate
   * @returns {Promise<Object>} Validation result
   */
  async validateHSN(hsnCode) {
    try {
      const result = await validateHSNCode(hsnCode);
      return {
        isValid: result.valid || false,
        details: result,
        validatedAt: new Date().toISOString()
      };
    } catch (error) {
      return {
        isValid: false,
        error: error.message,
        validatedAt: new Date().toISOString()
      };
    }
  }

  /**
   * Get detailed information about an HSN code
   * @param {string} hsnCode - HSN code
   * @returns {Promise<Object>} HSN code details
   */
  async getHSNDetails(hsnCode) {
    try {
      const details = await getHSNCode(hsnCode);
      return {
        success: true,
        details,
        retrievedAt: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        retrievedAt: new Date().toISOString()
      };
    }
  }

  /**
   * Generate HSN mapping report
   * @returns {Promise<Object>} Comprehensive mapping report
   */
  async generateMappingReport() {
    try {
      const analyses = await this.analyzeInventory();
      
      const report = {
        summary: {
          totalProducts: analyses.length,
          withSuggestions: analyses.filter(a => a.suggestions.length > 0).length,
          withoutSuggestions: analyses.filter(a => a.suggestions.length === 0).length,
          highConfidence: analyses.filter(a => a.recommendedHSN?.confidence >= 80).length,
          mediumConfidence: analyses.filter(a => a.recommendedHSN?.confidence >= 60 && a.recommendedHSN?.confidence < 80).length,
          lowConfidence: analyses.filter(a => a.recommendedHSN?.confidence < 60 && a.recommendedHSN?.confidence > 0).length
        },
        analyses,
        generatedAt: new Date().toISOString()
      };
      
      return report;
    } catch (error) {
      console.error('Error generating mapping report:', error);
      throw error;
    }
  }

  /**
   * Set progress callback for long-running operations
   * @param {Function} callback - Progress callback function
   */
  setProgressCallback(callback) {
    this.onProgress = callback;
  }
}

export default HSNCodeAnalyzer;
export { HSNCodeAnalyzer };