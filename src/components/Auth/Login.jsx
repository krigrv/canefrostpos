import React, { useState } from 'react'
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  IconButton,
  Grid
} from '@mui/material'
import { Google as GoogleIcon } from '@mui/icons-material'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const { login, loginWithGoogle } = useAuth()

  async function handleSubmit(e) {
    e.preventDefault()

    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }

    try {
      setError('')
      setLoading(true)
      await login(email, password)
      toast.success('Login successful!')
    } catch (error) {
      console.error('Login error:', error)
      setError('Failed to log in. Please check your credentials.')
      toast.error('Login failed')
    }

    setLoading(false)
  }

  // Google login function
  async function handleGoogleLogin() {
    try {
      setError('')
      setGoogleLoading(true)
      await loginWithGoogle()
      toast.success('Google login successful!')
    } catch (error) {
      console.error('Google login error:', error)
      setError('Failed to log in with Google. Please try again.')
      toast.error('Google login failed')
    }
    setGoogleLoading(false)
  }



  return (
    <Box sx={{ minHeight: '100vh', display: 'flex' }}>
      <Grid container sx={{ minHeight: '100vh' }}>
        {/* Left Side - Content */}
        <Grid 
          item 
          xs={false} 
          md={6} 
          sx={{
            backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.6), rgba(255, 255, 255, 0.3)), url("/images/home.jpg")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            display: { xs: 'none', md: 'flex' },
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            color: 'white',
            p: 4
          }}
        >
          <Box sx={{ textAlign: 'center', maxWidth: 500 }}>
            <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
              🥤 Canefrost POS
            </Typography>
            <Typography variant="h5" sx={{ mb: 4, opacity: 0.9 }}>
              Modern Juice Shop Management System
            </Typography>
            <Typography variant="body1" sx={{ mb: 4, opacity: 0.8, lineHeight: 1.6 }}>
              Streamline your juice shop operations with our comprehensive point-of-sale system. 
              Manage inventory, track sales, and serve customers efficiently.
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" sx={{ mb: 1 }}>📊</Typography>
                <Typography variant="body2">Sales Analytics</Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" sx={{ mb: 1 }}>📦</Typography>
                <Typography variant="body2">Inventory Management</Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" sx={{ mb: 1 }}>👥</Typography>
                <Typography variant="body2">Customer Management</Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" sx={{ mb: 1 }}>💳</Typography>
                <Typography variant="body2">Multiple Payment Options</Typography>
              </Box>
            </Box>
          </Box>
        </Grid>

        {/* Right Side - Login Form */}
        <Grid 
          item 
          xs={12} 
          md={6} 
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            background: '#F9FAFB',
            p: 4,
            minHeight: { xs: '100vh', md: 'auto' }
          }}
        >
          <Card sx={{ width: '100%', maxWidth: 400, boxShadow: 3 }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 2 }}>
                  <Typography variant="h4" component="h1" gutterBottom color="primary">
                    🥤 Canefrost POS
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}>
                    Modern Juice Shop Management System
                  </Typography>
                </Box>
                <Typography variant="h4" component="h2" gutterBottom color="primary">
                  Welcome Back
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                  Sign in to your account
                </Typography>
              </Box>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2, py: 1.5 }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Sign In'}
              </Button>

              <Divider sx={{ my: 2 }}>OR</Divider>
              
              <Button
                fullWidth
                variant="outlined"
                onClick={handleGoogleLogin}
                disabled={loading || googleLoading}
                startIcon={googleLoading ? <CircularProgress size={20} /> : <GoogleIcon />}
                sx={{ mb: 2, borderColor: '#111827', color: '#111827', '&:hover': { borderColor: '#374151', backgroundColor: '#F3F4F6' } }}
              >
                {googleLoading ? 'Signing in...' : 'Sign in with Google'}
              </Button>

            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  </Box>
  )
}

export default Login