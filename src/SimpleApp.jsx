/*
 * Simplified App Component for debugging
 * Tests basic functionality without complex routing and contexts
 * Created to isolate blank screen issue
 */
import React from 'react'
import { Loader2 } from 'lucide-react'

function SimpleApp() {
  console.log('SimpleApp rendering...')
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      <h1 className="text-5xl font-bold text-primary mb-4">
        Canefrost POS
      </h1>
      <h2 className="text-2xl text-muted-foreground mb-6">
        System Loading...
      </h2>
      <div className="mb-4">
        <Loader2 className="h-15 w-15 animate-spin text-primary" size={60} />
      </div>
      <p className="text-sm text-muted-foreground text-center">
        If you can see this, the basic React setup is working.
      </p>
    </div>
  )
}

export default SimpleApp