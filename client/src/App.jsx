import { BrowserRouter as Router, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Components/Sidebar/Sidebar';
import AppNavigator from './Navigation/appnavigator';
import Login from './Pages/Fronter/LoginPage/Login';
import useAuthStore from './store/authStore';
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import logo from './assets/SBP_logo.png';

function AppContent() {
  const { isAuthenticated, user, login, logout } = useAuthStore();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Enforce 8-hour session token check on mount and periodically
  useEffect(() => {
    if (!isAuthenticated) return;

    // Initial check on mount/rehydration
    if (checkTokenExpiration()) {
      navigate('/', { replace: true });
      return;
    }

    // Interval check every 10 seconds
    const interval = setInterval(() => {
      if (checkTokenExpiration()) {
        navigate('/', { replace: true });
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [isAuthenticated, checkTokenExpiration, navigate]);

  const handleLogin = (loginData) => {
    const userData = loginData.user;
    const token = loginData.token;
    login(userData, token);
    navigate('/', { replace: true });
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

<<<<<<< HEAD
  // Redirect to home after login to trigger role-based routing
  useEffect(() => {
    if (isAuthenticated && location.pathname === '/') {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, location.pathname, navigate]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  // Get user role for sidebar
  const userRole = user?.roleName?.toLowerCase() || '';
=======
  // Get user role for sidebar (normalized to match roleMenus)
  const userRole = normalizeRole(user?.roleName);
>>>>>>> 0e47c38a32efe4fee86d3358d1ba6822fd52d1b3

  return (
    <>
      {!isAuthenticated ? (
        <Login onLogin={handleLogin} />
      ) : (
        <div className="app-container">
          {/* Mobile Top Header */}
          <header className="mobile-header">
            <button 
              className="mobile-menu-btn"
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              aria-label="Toggle Navigation Menu"
            >
              {mobileSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className="mobile-brand">
              <img src={logo} alt="SBP Logo" className="mobile-logo-img" />
              <span className="mobile-brand-name">Sri Bhuvaneshwari Plastics</span>
            </div>
          </header>

          <Sidebar 
            userRole={userRole} 
            userData={user}
            onLogout={handleLogout}
            isOpen={mobileSidebarOpen}
            onClose={() => setMobileSidebarOpen(false)}
          />
          <main className="main-content">
            <AppNavigator />
          </main>
        </div>
      )}
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;