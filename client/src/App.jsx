import { BrowserRouter as Router, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Components/Sidebar/Sidebar';
import AppNavigator from './Navigation/appnavigator';
import Login from './Pages/Fronter/LoginPage/Login';
import useAuthStore from './store/authStore';
import { useEffect } from 'react';
import './App.css';

function AppContent() {
  const { isAuthenticated, user, login, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = (loginData) => {
    const userData = loginData.user;
    const token = loginData.token;
    login(userData, token);
    console.log('User logged in with role:', userData?.roleName);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Redirect to home after login to trigger role-based routing
  useEffect(() => {
    if (isAuthenticated && location.pathname === '/') {
      // The AppNavigator will handle redirecting to the correct default route
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, location.pathname, navigate]);

  // Get user role for sidebar
  const userRole = user?.roleName?.toLowerCase() || 'qms';

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