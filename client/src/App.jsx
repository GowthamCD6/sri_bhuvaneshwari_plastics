import { BrowserRouter as Router } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from './Components/Sidebar/Sidebar';
import AppNavigator from './Navigation/Appnavigator';
import Login from './Pages/Fronter/LoginPage/Login';
import './App.css';

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);

  const handleLogin = (userData) => {
    setIsAuthenticated(true);
    setUserRole(userData.role);
  };

  return (
    <Router>
      {!isAuthenticated ? (
        <Login onLogin={handleLogin} />
      ) : (
        <div className="app-container">
          <Sidebar onToggle={setSidebarCollapsed} userRole={userRole} />
          <main className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
            <AppNavigator />
          </main>
        </div>
      )}
    </Router>
  );
}

export default App;