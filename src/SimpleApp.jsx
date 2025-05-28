/*
 * Simplified App Component for debugging
 * Tests basic functionality without complex routing and contexts
 * Created to isolate blank screen issue
 */
import React from 'react'
import { Box, Typography, CircularProgress } from '@mui/material'

function SimpleApp() {
  console.log('SimpleApp rendering...')
  
  return (
    <Box 
      display="flex" 
      flexDirection="column" 
      alignItems="center" 
      justifyContent="center" 
      minHeight="100vh"
      bgcolor="#f0f0f0"
      p={3}
    >
      <Typography variant="h2" color="primary" gutterBottom>
        Canefrost POS
      </Typography>
      <Typography variant="h5" color="textSecondary" gutterBottom>
        System Loading...
      </Typography>
      <Box mt={3}>
        <CircularProgress size={60} />
      </Box>
      <Box mt={2}>
        <Typography variant="body2" color="textSecondary">
          If you can see this, the basic React setup is working.
        </Typography>
      </Box>
    </Box>
  )
}

export default SimpleApp