import { BrowserRouter as Router, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Components/Sidebar/Sidebar';
import AppNavigator, { getDefaultRouteForRole } from './Navigation/appnavigator';
import Login from './Pages/Fronter/LoginPage/Login';
import useAuthStore, { normalizeRole } from './store/authStore';
import { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import './App.css';

function AppContent() {
  const { isAuthenticated, user, login, logout, checkTokenExpiration } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
    const userRole = normalizeRole(userData?.roleName);
    const dashboardRoute = getDefaultRouteForRole(userRole);
    navigate(dashboardRoute, { replace: true });
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Redirect to dashboard after login to trigger role-based routing if they hit root
  useEffect(() => {
    if (isAuthenticated && location.pathname === '/') {
      const role = normalizeRole(user?.roleName);
      navigate(getDefaultRouteForRole(role), { replace: true });
    }
  }, [isAuthenticated, location.pathname, navigate, user?.roleName]);

  // Get user role for sidebar
  const userRole = user?.roleName?.toLowerCase() || '';

  return (
    <>
      {!isAuthenticated ? (
        <Login onLogin={handleLogin} />
      ) : (
        <div className="app-container">
          <div className="mobile-header">
            <button className="mobile-menu-btn" onClick={() => setIsSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            <div className="mobile-brand">
              <span className="mobile-brand-name">SBP QMS</span>
            </div>
            <div style={{ width: 24 }}></div> {/* spacer */}
          </div>
          <Sidebar 
            userRole={userRole} 
            userData={user}
            onLogout={handleLogout}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
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