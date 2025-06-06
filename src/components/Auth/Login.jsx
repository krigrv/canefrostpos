import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Separator } from '../ui/separator'
import { AlertCircle, Loader2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContextSupabase'
import toast from 'react-hot-toast'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mobileNumber, setMobileNumber] = useState('')
  const [accessCode, setAccessCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [isStaffLogin, setIsStaffLogin] = useState(false)
  const { login, loginWithGoogle, loginStaff } = useAuth()

  async function handleSubmit(e) {
    e.preventDefault()

    if (isStaffLogin) {
      if (!mobileNumber || !accessCode) {
        setError('Please fill in all fields')
        return
      }
    } else {
      if (!email || !password) {
        setError('Please fill in all fields')
        return
      }
    }

    try {
      setError('')
      setLoading(true)
      
      if (isStaffLogin) {
        await loginStaff(mobileNumber, accessCode)
        toast.success('Staff login successful!')
      } else {
        await login(email, password)
        toast.success('Login successful!')
      }
    } catch (error) {
      console.error('Login error:', error)
      setError(isStaffLogin ? 'Invalid mobile number or access code.' : 'Failed to log in. Please check your credentials.')
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <div className="min-h-screen flex flex-col lg:flex-row">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
          <div 
            className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-800"
            style={{
              backgroundImage: 'linear-gradient(rgba(21, 189, 113, 0.53), rgba(0, 0, 0, 0.51)), url("/static/home.jpg")',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          />
          <div className="relative z-10 flex flex-col justify-center items-center text-white p-16 xl:p-24">
            <div className="text-center max-w-2xl">
              <div className="mb-8">
                <h1 className="text-6xl xl:text-7xl font-bold mb-6 tracking-tight">
                  Canefrost
                </h1>
                <div className="text-3xl xl:text-4xl font-light mb-8 opacity-90">
                  Billing Made Easy
                </div>
              </div>
              

              
              <div className="grid grid-cols-2 gap-8 xl:gap-12">
                <div className="text-center group">
                  <div className="text-4xl xl:text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">📊</div>
                  <div className="text-lg xl:text-xl font-medium">Analytics</div>
                  <div className="text-sm xl:text-base opacity-70 mt-2">Real-time insights</div>
                </div>
                <div className="text-center group">
                  <div className="text-4xl xl:text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">📦</div>
                  <div className="text-lg xl:text-xl font-medium">Inventory</div>
                  <div className="text-sm xl:text-base opacity-70 mt-2">Smart management</div>
                </div>
                <div className="text-center group">
                  <div className="text-4xl xl:text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">👥</div>
                  <div className="text-lg xl:text-xl font-medium">Customers</div>
                  <div className="text-sm xl:text-base opacity-70 mt-2">Relationship tools</div>
                </div>
                <div className="text-center group">
                  <div className="text-4xl xl:text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">💳</div>
                  <div className="text-lg xl:text-xl font-medium">Payments</div>
                  <div className="text-sm xl:text-base opacity-70 mt-2">Multiple options</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-sm lg:max-w-md">
            {/* Mobile Header */}
            <div className="lg:hidden text-center mb-12">
              <h1 className="text-4xl font-bold text-blue-600 mb-4">
                🥤 Canefrost Billing
              </h1>
            
            </div>

            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
              <CardContent className="p-6 lg:p-8">
                <div className="text-center mb-8">
                  <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                    Welcome Back
                  </h2>
                  <p className="text-gray-600 text-base">
                    Sign in to your account
                  </p>
                  
                  {/* Login Type Toggle */}
                  <div className="flex bg-gray-100 rounded-lg p-1 mt-4">
                    <button
                      type="button"
                      onClick={() => setIsStaffLogin(false)}
                      className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                        !isStaffLogin
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Admin Login
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsStaffLogin(true)}
                      className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                        isStaffLogin
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Staff Login
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-3 p-4 mb-8 text-red-800 bg-red-50 border border-red-200 rounded-xl">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <span className="text-sm font-medium">{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    {isStaffLogin ? (
                      // Staff Login Fields
                      <>
                        <div>
                          <Label htmlFor="mobileNumber" className="text-sm font-medium text-gray-700 mb-2 block">
                            Mobile Number
                          </Label>
                          <Input
                            id="mobileNumber"
                            type="tel"
                            value={mobileNumber}
                            onChange={(e) => setMobileNumber(e.target.value)}
                            className="h-12 text-base px-3 border border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg transition-all duration-200"
                            placeholder="Enter your mobile number"
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor="accessCode" className="text-sm font-medium text-gray-700 mb-2 block">
                            Access Code
                          </Label>
                          <Input
                            id="accessCode"
                            type="text"
                            value={accessCode}
                            onChange={(e) => setAccessCode(e.target.value)}
                            className="h-12 text-base px-3 border border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg transition-all duration-200"
                            placeholder="Enter your access code"
                            required
                          />
                        </div>
                      </>
                    ) : (
                      // Admin Login Fields
                      <>
                        <div>
                          <Label htmlFor="email" className="text-sm font-medium text-gray-700 mb-2 block">
                            Email Address
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="h-12 text-base px-3 border border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg transition-all duration-200"
                            placeholder="Enter your email address"
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor="password" className="text-sm font-medium text-gray-700 mb-2 block">
                            Password
                          </Label>
                          <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="h-12 text-base px-3 border border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg transition-all duration-200"
                            placeholder="Enter your password"
                            required
                          />
                        </div>
                      </>
                    )}
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      isStaffLogin ? 'Staff Sign In' : 'Sign In'
                    )}
                  </Button>

                  {!isStaffLogin && (
                    <>
                      <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-gray-300" />
                        </div>
                        <div className="relative flex justify-center text-sm uppercase">
                          <span className="bg-white px-4 text-gray-500 font-medium">
                            Or continue with
                          </span>
                        </div>
                      </div>
                      
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-12 text-base font-medium border border-gray-300 hover:border-gray-400 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                        onClick={handleGoogleLogin}
                        disabled={loading || googleLoading}
                      >
                        {googleLoading ? (
                          <>
                            <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                            Signing in...
                          </>
                        ) : (
                          <>
                            <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                              <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                              />
                              <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                              />
                              <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                              />
                              <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                              />
                            </svg>
                            Sign in with Google
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login