import React, { useState } from 'react';
import { Eye, EyeOff, Package, TrendingUp, Shield, Zap } from 'lucide-react';
import './Login.css';

const Login = ({ onLogin }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    mobile: '',
    password: '',
    role: 'qms'
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Pass the user data including role to parent component
    // Login with just role selection
    if (onLogin) {
      onLogin({ mobile: formData.mobile || 'user', role: formData.role });
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-container">
      {/* Left Side - Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <div className="logo-section">
            <div className="logo">SB</div>
            <div className="company-name">Sri Bhuvaneswari Plastics</div>
          </div>

          <div className="badge">Inventory Management Platform</div>
          
          <h1 className="hero-title">
            Complete visibility.<br/>
            From <span className="hero-gradient-text">raw material</span> to <span className="hero-gradient-text">dispatch</span>.
          </h1>

          <p className="hero-description">
            Centralized inventory management system designed specifically for plastic component manufacturing. 
            Track materials, monitor production, manage quality checks, and streamline operations in real-time.
          </p>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <Package size={20} />
              </div>
              <div className="feature-content">
                <div className="feature-title">End-to-End Tracking</div>
                <div className="feature-description">
                  Monitor every component from raw material intake through moulding, finishing, and final dispatch
                </div>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <TrendingUp size={20} />
              </div>
              <div className="feature-content">
                <div className="feature-title">Real-Time Insights</div>
                <div className="feature-description">
                  Live stock levels, production status, and inventory analytics at your fingertips
                </div>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <Shield size={20} />
              </div>
              <div className="feature-content">
                <div className="feature-title">Quality Assurance</div>
                <div className="feature-description">
                  Integrated QMS workflows ensure every component meets specification standards
                </div>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <Zap size={20} />
              </div>
              <div className="feature-content">
                <div className="feature-title">Streamlined Operations</div>
                <div className="feature-description">
                  Automated workflows reduce manual errors and accelerate order fulfillment cycles
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="hero-footer">
          Powering efficient inventory management for <strong>plastic component manufacturing</strong>
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

          <button className="google-button" type="button">
            <svg className="google-icon" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className="divider">or sign in with mobile</div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select
                className="form-input"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                required
              >
                <option value="qms">QMS (Quality Management System)</option>
                <option value="store">Store Manager</option>
                <option value="admin">Admin</option>
                <option value="procurement">Procurement Manager</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Mobile number</label>
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
                  placeholder="Enter your mobile number (optional)" 
                  value={formData.mobile}
                  onChange={handleInputChange}
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
                  placeholder="Enter your password (optional)" 
                  value={formData.password}
                  onChange={handleInputChange}
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

            <button type="submit" className="sign-in-button">
              Sign in
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