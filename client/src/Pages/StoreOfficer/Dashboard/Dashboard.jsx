import React from 'react';
import useAuthStore from '../../../store/authStore';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuthStore();
  const name = user?.username || user?.name || 'Officer';

  return (
    <div className="sod-welcome-page">
      <div className="sod-welcome-card">
        <div className="sod-welcome-avatar">{name.charAt(0).toUpperCase()}</div>
        <h1 className="sod-welcome-title">Store Officer Dashboard</h1>
        <p className="sod-welcome-sub">Welcome back, <span className="sod-welcome-name">{name}</span></p>
        <p className="sod-welcome-hint">Use the sidebar to manage inventory, verify indents, track stock and more.</p>
      </div>
    </div>
  );
};

export default Dashboard;