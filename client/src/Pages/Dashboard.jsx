import './Dashboard.css';

const Dashboard = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p className="page-subtitle">Overview of your procurement activities</p>
      </div>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Purchase Indents</h3>
          <p className="stat-value">24</p>
          <span className="stat-label">This month</span>
        </div>
        <div className="stat-card">
          <h3>Purchase Orders</h3>
          <p className="stat-value">18</p>
          <span className="stat-label">Active</span>
        </div>
        <div className="stat-card">
          <h3>Inventory Items</h3>
          <p className="stat-value">156</p>
          <span className="stat-label">Total stock</span>
        </div>
        <div className="stat-card">
          <h3>Suppliers</h3>
          <p className="stat-value">12</p>
          <span className="stat-label">Active vendors</span>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
