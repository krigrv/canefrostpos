/*
 * Minimal Test App Component
 * Created to test if basic React rendering works
 * Used for debugging blank screen issue
 */
import React from 'react'
import { Box, Typography } from '@mui/material'

function TestApp() {
  console.log('TestApp component rendering')
  
  return (
    <Box 
      display="flex" 
      flexDirection="column" 
      alignItems="center" 
      justifyContent="center" 
      minHeight="100vh"
      bgcolor="#f5f5f5"
    >
      <Typography variant="h3" color="primary" gutterBottom>
        Test App Loading Successfully
      </Typography>
      <Typography variant="body1" color="textSecondary">
        If you can see this, React is working properly.
      </Typography>
    </Box>
  )
}

export default TestApp