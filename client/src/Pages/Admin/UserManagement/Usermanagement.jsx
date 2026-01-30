import React, { useState } from 'react';
import './UserManagement.css';

// SVG Icons
const Icons = {
  Bell: () => (
    <svg className="icon-bell" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
    </svg>
  ),
  Search: () => (
    <svg className="icon-search" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  ),
  Filter: () => (
    <svg className="icon-filter" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
    </svg>
  ),
  Plus: () => (
    <svg className="icon-plus" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  ),
  ChevronDown: () => (
    <svg className="icon-chevron-down" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  )
};

const UserManagement = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // User data
  const users = [
    {
      name: 'Robert Fox',
      email: 'admin@company.com',
      avatar: 'https://i.pravatar.cc/150?img=12',
      role: 'Administrator',
      roleClass: 'admin',
      status: 'Active',
      statusClass: 'active',
      lastActive: 'Just now'
    },
    {
      name: 'Sarah Chen',
      email: 'sarah.c@company.com',
      avatar: 'https://i.pravatar.cc/150?img=5',
      role: 'QMS Officer',
      roleClass: 'qms',
      status: 'Active',
      statusClass: 'active',
      lastActive: '2 hours ago'
    },
    {
      name: 'Michael Brown',
      email: 'm.brown@company.com',
      avatar: 'https://i.pravatar.cc/150?img=13',
      role: 'Store Officer',
      roleClass: 'store',
      status: 'Active',
      statusClass: 'active',
      lastActive: '5 hours ago'
    },
    {
      name: 'Emily Davis',
      email: 'e.davis@company.com',
      avatar: 'https://i.pravatar.cc/150?img=9',
      role: 'Purchase Dept',
      roleClass: 'purchase',
      status: 'Active',
      statusClass: 'active',
      lastActive: 'Yesterday'
    },
    {
      name: 'Rahul Patel',
      email: 'r.patel@company.com',
      avatar: 'https://i.pravatar.cc/150?img=8',
      role: 'Store Officer',
      roleClass: 'store',
      status: 'Inactive',
      statusClass: 'inactive',
      lastActive: '3 days ago'
    },
    {
      name: 'Maria Garcia',
      email: 'm.garcia@company.com',
      avatar: 'https://i.pravatar.cc/150?img=10',
      role: 'Purchase Dept',
      roleClass: 'purchase',
      status: 'Active',
      statusClass: 'active',
      lastActive: '1 week ago'
    }
  ];

  const totalUsers = 12;
  const usersPerPage = 6;
  const displayedUsers = users.slice(0, usersPerPage);

  return (
    <div className="um-container">
      {/* Header */}
      <div className="um-header">
        <h1 className="um-title">User Management</h1>
        <div className="um-header-right">
          <button className="um-notification-bell">
            <Icons.Bell />
            <span className="um-notification-badge">3</span>
          </button>
          <span className="um-last-login">Last login: Today, 09:41 AM</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="um-toolbar">
        <div className="um-search-wrapper">
          <div className="um-search-icon">
            <Icons.Search />
          </div>
          <input
            type="text"
            className="um-search-input"
            placeholder="Search users by name or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="um-toolbar-right">
          <button className="um-filter-btn">
            <Icons.Filter />
            Filter Role
            <Icons.ChevronDown />
          </button>
          <button className="um-add-user-btn">
            <Icons.Plus />
            Add New User
          </button>
        </div>
      </div>

      {/* User Table */}
      <div className="um-table-card">
        <table className="um-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Status</th>
              <th>Last Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayedUsers.map((user, idx) => (
              <tr key={idx}>
                <td>
                  <div className="um-user-cell">
                    <img 
                      src={user.avatar} 
                      alt={user.name}
                      className="um-user-avatar"
                    />
                    <div className="um-user-info">
                      <p className="um-user-name">{user.name}</p>
                      <p className="um-user-email">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`um-role-badge ${user.roleClass}`}>
                    {user.role}
                  </span>
                </td>
                <td>
                  <span className={`um-status-badge ${user.statusClass}`}>
                    <span className="um-status-dot"></span>
                    {user.status}
                  </span>
                </td>
                <td>
                  <span className="um-last-active">{user.lastActive}</span>
                </td>
                <td>
                  <button className="um-manage-btn">Manage</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer */}
        <div className="um-table-footer">
          <span className="um-showing-text">
            Showing {usersPerPage} of {totalUsers} registered users
          </span>
          <div className="um-pagination">
            <button 
              className="um-page-btn" 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            >
              Previous
            </button>
            <button 
              className="um-page-btn active"
              onClick={() => setCurrentPage(1)}
            >
              1
            </button>
            <button 
              className="um-page-btn"
              onClick={() => setCurrentPage(2)}
            >
              2
            </button>
            <button 
              className="um-page-btn"
              disabled={currentPage === 2}
              onClick={() => setCurrentPage(prev => Math.min(2, prev + 1))}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;