/**
 * Basic Test Component
 * Minimal React component without any external dependencies
 * Created to test if basic React rendering works
 */
import React from 'react'

function BasicTest() {
  console.log('BasicTest component rendering...')
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#f0f0f0',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ color: '#333', marginBottom: '20px' }}>
        Basic React Test
      </h1>
      <p style={{ color: '#666', fontSize: '18px' }}>
        If you can see this, React is working!
      </p>
      <div style={{
        marginTop: '20px',
        padding: '10px 20px',
        backgroundColor: '#007bff',
        color: 'white',
        borderRadius: '5px'
      }}>
        Server Status: Running
      </div>
    </div>
  )
}

export default BasicTest