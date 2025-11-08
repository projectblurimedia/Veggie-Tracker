import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import './login.scss'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser, faEye, faEyeSlash, faCarrot, faSeedling } from '@fortawesome/free-solid-svg-icons'

export const Login = ({ setIsAuth, onLoginSuccess }) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    
    try {
      const response = await axios.post('/auth/login', {
        username,
        password,
      })
      
      const token = response.data.token
      
      if (!token || typeof token !== 'string' || token.split('.').length !== 3) {
        throw new Error('Invalid token received from server')
      }
      
      localStorage.setItem('token', token)
      window.dispatchEvent(new Event('tokenChanged'))
      if (onLoginSuccess) onLoginSuccess()
      
      const storedToken = localStorage.getItem('token')
      if (storedToken !== token) {
        throw new Error('Failed to store authentication token')
      }
      
      if (setIsAuth) {
        setIsAuth(true)
      }
      
      setError('')
      
      navigate('/', { replace: true })
      
    } catch (err) {
      console.error('Login error:', err)
      
      localStorage.removeItem('token')
      if (setIsAuth) {
        setIsAuth(false)
      }
      
      if (err.response?.data?.message) {
        setError(err.response.data.message)
      } else if (err.message) {
        setError(err.message)
      } else {
        setError('Login failed. Please check your credentials and try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <div className="login-container">
      {/* Background Decoration */}
      <div className="vegetable-background">
        <div className="floating-icon icon-1">
          <FontAwesomeIcon icon={faCarrot} />
        </div>
        <div className="floating-icon icon-2">
          <FontAwesomeIcon icon={faSeedling} />
        </div>
        <div className="floating-icon icon-3">
          <FontAwesomeIcon icon={faCarrot} />
        </div>
        <div className="floating-icon icon-4">
          <FontAwesomeIcon icon={faSeedling} />
        </div>
      </div>

      <div className="login-card">
        {/* Header */}
        <div className="login-header">
          <div className="logo">
            <FontAwesomeIcon icon={faCarrot} className="logo-icon" />
            <span className="logo-text">VeggieTrack</span>
          </div>
          <h2 className="login-title">Welcome Back</h2>
          <p className="login-subtitle">Sign in to your VeggieTrack account</p>
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span> 
            <span className="error-text">{error}</span>
          </div>
        )}
        
        {/* Login Form */}
        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <input
              type="text"
              className="form-input"
              placeholder=" "
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              aria-label="Username"
              disabled={isLoading}
            />
            <label className="form-label">Username</label>
            <FontAwesomeIcon icon={faUser} className="form-icon" />
          </div>
          
          <div className="input-group">
            <input
              type={showPassword ? 'text' : 'password'}
              className="form-input"
              placeholder=" "
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-label="Password"
              disabled={isLoading}
            />
            <label className="form-label">Password</label>
            <FontAwesomeIcon
              icon={showPassword ? faEye : faEyeSlash}
              className="form-icon password-icon"
              onClick={togglePasswordVisibility}
              style={{ cursor: 'pointer' }}
            />
          </div>
          
          {/* Login Button */}
          <button
            type="submit"
            className="login-button"
            disabled={!username || !password || isLoading}
          >
            {isLoading ? (
              <div className="button-loading">
                <div className="spinner"></div>
                Signing In...
              </div>
            ) : (
              'Sign In'
            )}
          </button>
        </form>    
      </div>
    </div>
  )
}