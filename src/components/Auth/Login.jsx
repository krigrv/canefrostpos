import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Separator } from '../ui/separator'
import { AlertCircle, Loader2 } from 'lucide-react'
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
    <div className="min-h-screen flex">
      <div className="grid grid-cols-1 md:grid-cols-2 min-h-screen w-full">
        {/* Left Side - Content */}
        <div 
          className="hidden md:flex flex-col justify-center items-center text-white p-8"
          style={{
            backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.6), rgba(255, 255, 255, 0.3)), url("/images/home.jpg")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          <div className="text-center max-w-lg">
            <h1 className="text-5xl font-bold mb-6">
              🥤 Canefrost POS
            </h1>
            <h2 className="text-2xl mb-8 opacity-90">
              Modern Juice Shop Management System
            </h2>
            <p className="text-lg mb-8 opacity-80 leading-relaxed">
              Streamline your juice shop operations with our comprehensive point-of-sale system. 
              Manage inventory, track sales, and serve customers efficiently.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <div className="text-center">
                <div className="text-2xl mb-2">📊</div>
                <div className="text-sm">Sales Analytics</div>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">📦</div>
                <div className="text-sm">Inventory Management</div>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">👥</div>
                <div className="text-sm">Customer Management</div>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">💳</div>
                <div className="text-sm">Multiple Payment Options</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex flex-col justify-center items-center bg-gray-50 p-8 min-h-screen md:min-h-auto">
          <Card className="w-full max-w-md shadow-lg">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <div className="block md:hidden mb-4">
                  <h1 className="text-3xl font-bold text-primary mb-2">
                    🥤 Canefrost POS
                  </h1>
                  <p className="text-muted-foreground mb-4">
                    Modern Juice Shop Management System
                  </p>
                </div>
                <h2 className="text-3xl font-bold text-primary mb-2">
                  Welcome Back
                </h2>
                <p className="text-muted-foreground">
                  Sign in to your account
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 mb-4 text-red-800 bg-red-100 border border-red-200 rounded-md">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                    autoFocus
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
                
                <Button
                  type="submit"
                  className="w-full mt-6 py-3"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>

                <div className="relative my-4">
                  <Separator />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="bg-white px-2 text-xs text-muted-foreground">OR</span>
                  </div>
                </div>
                
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleGoogleLogin}
                  disabled={loading || googleLoading}
                >
                  {googleLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Sign in with Google
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Login