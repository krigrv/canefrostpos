import React from 'react'
import { useInventory } from '../hooks/useInventory'

const DebugProducts = () => {
  const { products } = useInventory()
  
  // Check for duplicates by ID
  const idCounts = {}
  const nameCounts = {}
  const duplicateIds = []
  const duplicateNames = []
  
  products.forEach(product => {
    // Count by ID
    idCounts[product.id] = (idCounts[product.id] || 0) + 1
    if (idCounts[product.id] > 1 && !duplicateIds.includes(product.id)) {
      duplicateIds.push(product.id)
    }
    
    // Count by name
    const name = product.name.toLowerCase().trim()
    nameCounts[name] = (nameCounts[name] || 0) + 1
    if (nameCounts[name] > 1 && !duplicateNames.includes(name)) {
      duplicateNames.push(name)
    }
  })
  
  const uniqueIds = new Set(products.map(p => p.id)).size
  const uniqueNames = new Set(products.map(p => p.name.toLowerCase().trim())).size
  
  return (
    <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg">
      <h3 className="font-bold text-sm mb-2 text-gray-800">🔍 Product Debug Info</h3>
      <div className="text-xs space-y-1">
        <div>Total Products: <span className="font-mono font-semibold">{products.length}</span></div>
        <div>Unique IDs: <span className="font-mono font-semibold">{uniqueIds}</span></div>
        <div>Unique Names: <span className="font-mono font-semibold">{uniqueNames}</span></div>
        
        {duplicateIds.length > 0 && (
          <div className="text-red-600">
            <div className="font-semibold">⚠️ Duplicate IDs:</div>
            {duplicateIds.slice(0, 3).map(id => (
              <div key={id} className="font-mono text-xs">
                {id} (×{idCounts[id]})
              </div>
            ))}
            {duplicateIds.length > 3 && (
              <div className="text-xs">...and {duplicateIds.length - 3} more</div>
            )}
          </div>
        )}
        
        {duplicateNames.length > 0 && (
          <div className="text-orange-600">
            <div className="font-semibold">⚠️ Duplicate Names:</div>
            {duplicateNames.slice(0, 3).map(name => (
              <div key={name} className="font-mono text-xs">
                {name} (×{nameCounts[name]})
              </div>
            ))}
            {duplicateNames.length > 3 && (
              <div className="text-xs">...and {duplicateNames.length - 3} more</div>
            )}
          </div>
        )}
        
        {duplicateIds.length === 0 && duplicateNames.length === 0 && (
          <div className="text-green-600">✅ No duplicates found</div>
        )}
      </div>
    </div>
  )
}

export default DebugProducts