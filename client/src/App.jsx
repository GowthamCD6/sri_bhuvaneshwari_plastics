import { BrowserRouter as Router } from 'react-router-dom';
import Sidebar from './Components/Sidebar/Sidebar';
import AppNavigator from './Navigation/appnavigator';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Sidebar />
        <main className="main-content">
          <AppNavigator />
        </main>
      </div>
    </Router>
  );
}

export default App;