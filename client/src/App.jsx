import { BrowserRouter as Router, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Components/Sidebar/Sidebar';
import AppNavigator from './Navigation/appnavigator';
import Login from './Pages/Fronter/LoginPage/Login';
import useAuthStore, { normalizeRole } from './store/authStore';
import { useEffect } from 'react';
import './App.css';

function AppContent() {
  const { isAuthenticated, user, login, logout, checkTokenExpiration } = useAuthStore();
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

  // Get user role for sidebar (normalized to match roleMenus)
  const userRole = normalizeRole(user?.roleName);

  return (
    <>
      {!isAuthenticated ? (
        <Login onLogin={handleLogin} />
      ) : (
        <div className="app-container">
          <Sidebar 
            userRole={userRole} 
            userData={user}
            onLogout={handleLogout}
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