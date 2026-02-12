import React, { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { authService } from '../../../services/apiService';
import './Login.css';

const Login = ({ onLogin }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    mobile: '',
    password: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user types
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Call login API
      const response = await authService.login(formData.mobile, formData.password);
      
      console.log('Login successful:', response);
      
      // Call parent onLogin handler with user data
      if (onLogin) {
        onLogin({
          user: response.user,
          token: response.token,
          permissions: response.permissions
        });
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Google Sign-In callback
  const handleGoogleCallback = async (response) => {
    setLoading(true);
    setError('');

    try {
      const result = await authService.googleLogin(response.credential);
      
      console.log('Google login successful:', result);
      
      // Call parent onLogin handler with user data
      if (onLogin) {
        onLogin({
          user: result.user,
          token: result.token,
          permissions: result.permissions
        });
      }
    } catch (err) {
      console.error('Google login error:', err);
      setError(err.message || 'Google login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Initialize Google Sign-In
  useEffect(() => {
    // Suppress Google OAuth console errors
    const originalConsoleError = console.error;
    console.error = (...args) => {
      // Filter out Google OAuth origin errors
      if (args[0]?.includes?.('GSI_LOGGER') || args[0]?.includes?.('origin is not allowed')) {
        return; // Suppress these errors
      }
      originalConsoleError.apply(console, args);
    };

    // Wait for Google Identity Services to load
    const initializeGoogleSignIn = () => {
      if (window.google && window.google.accounts) {
        try {
          window.google.accounts.id.initialize({
            client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
            callback: handleGoogleCallback,
            auto_select: false
          });
          
          // Render the Google Sign-In button
          const buttonDiv = document.getElementById('google-signin-button');
          if (buttonDiv) {
            window.google.accounts.id.renderButton(
              buttonDiv,
              {
                theme: 'outline',
                size: 'large',
                width: buttonDiv.offsetWidth,
                text: 'continue_with',
                shape: 'rectangular'
              }
            );
          }
        } catch (error) {
          // Silently handle Google Sign-In initialization errors
          console.log('Google Sign-In not configured for this origin');
        }
      } else {
        // Retry after a delay if Google hasn't loaded yet
        setTimeout(initializeGoogleSignIn, 100);
      }
    };

    // Small delay to ensure DOM is ready
    setTimeout(initializeGoogleSignIn, 100);

    // Cleanup
    return () => {
      console.error = originalConsoleError;
    };
  }, []);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-container">
      {/* Left Side - Hero Section with Industrial Image */}
      <div className="hero-section">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <div className="logo-section">
            <div className="logo">SB</div>  
            <div className="company-name">Sri Bhuvaneswari Plastics</div>
          </div>
          <div className="hero-tagline">WorkFlow Management Platform</div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="login-section">
        <div className="login-box">
          <div className="login-header">
            <h2 className="login-title">Sign in to Inventory Suite</h2>
            <p className="login-subtitle">
              Use your company email to login to the respected roles as assigned
            </p>
          </div>

          <div id="google-signin-button" style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: '20px' }}></div>

          <div className="divider">or sign in with mobile</div>

          {error && (
            <div style={{
              padding: '12px',
              marginBottom: '16px',
              backgroundColor: '#fee',
              border: '1px solid #fcc',
              borderRadius: '6px',
              color: '#c33',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <div className="phone-input">
                <input 
                  type="text" 
                  className="country-code" 
                  value="+91" 
                  readOnly 
                />
                <input 
                  type="tel" 
                  className="form-input" 
                  name="mobile"
                  placeholder="Enter your mobile number" 
                  value={formData.mobile}
                  onChange={handleInputChange}
                  autoComplete="tel"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-wrapper">
                <input 
                  type={showPassword ? "text" : "password"}
                  className="form-input" 
                  name="password"
                  placeholder="Enter your password" 
                  value={formData.password}
                  onChange={handleInputChange}
                  autoComplete="current-password"
                  required
                />
                <button 
                  type="button" 
                  className="password-toggle"
                  onClick={togglePasswordVisibility}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button type="submit" className="sign-in-button" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="footer-text">
            New employee? <a href="#" className="footer-link">Contact system admin</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;