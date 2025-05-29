/*
 * Minimal Test App Component
 * Created to test if basic React rendering works
 * Used for debugging blank screen issue
 */
import React from 'react'

function TestApp() {
  console.log('TestApp component rendering')
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-4xl font-bold text-primary mb-4">
        Test App Loading Successfully
      </h1>
      <p className="text-lg text-muted-foreground">
        If you can see this, React is working properly.
      </p>
    </div>
  )
}

export default TestApp