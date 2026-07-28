import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { authService } from '../../../services/apiService';
import './Login.css';
import logo from '../../../assets/SBP_logo.png';

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
      
      
      // Call parent onLogin handler with user data
      if (onLogin) {
        onLogin({
          user: response.user,
          token: response.token,
          permissions: response.permissions
        });
      }
    } catch (err) {
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
      
      
      // Call parent onLogin handler with user data
      if (onLogin) {
        onLogin({
          user: result.user,
          token: result.token,
          permissions: result.permissions
        });
      }
    } catch (err) {
      setError(err.message || 'Google login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };



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
            <div className="logo"><img src={logo} alt="Sri Bhuvaneswari Plastics Logo" /></div>
          </div>
          <div className="company-name">Sri Bhuvaneshwari Plastics</div>
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

          <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <GoogleLogin
              onSuccess={handleGoogleCallback}
              onError={() => {
                setError('Google login failed. Please try again.');
              }}
              useOneTap
              shape="rectangular"
              size="large"
              width="100%"
            />
          </div>

          <div className="divider"><span>or sign in with mobile</span></div>

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

export default Login