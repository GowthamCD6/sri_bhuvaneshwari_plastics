import { BrowserRouter as Router } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from './Components/Sidebar/Sidebar';
import AppNavigator from './Navigation/Appnavigator';
import './App.css';

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <Router>
      <div className="app-container">
        <Sidebar onToggle={setSidebarCollapsed} />
        <main className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          <AppNavigator />
        </main>
      </div>
    </Router>
  );
}

export default App;