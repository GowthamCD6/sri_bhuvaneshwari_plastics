import React, { useState, useEffect, useMemo } from 'react';
import './UserManagement.css';
import { userService } from '../../../services/apiService';

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

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const usersPerPage = 6;

  const roleToClass = (role) => {
    const normalized = String(role || '').toLowerCase();
    if (normalized.includes('admin')) return 'admin';
    if (normalized.includes('qms')) return 'qms';
    if (normalized.includes('store')) return 'store';
    if (normalized.includes('purchase')) return 'purchase';
    return 'admin';
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await userService.getAllUsers();
      const data = response.data || response.users || [];
      const mapped = data.map((u) => ({
        name: u.username || u.full_name || 'User',
        email: u.email || '-',
        avatar: u.profile_image || 'https://i.pravatar.cc/150?img=12',
        role: u.role_name || u.role || 'User',
        roleClass: roleToClass(u.role_name || u.role),
        status: u.is_active ? 'Active' : 'Inactive',
        statusClass: u.is_active ? 'active' : 'inactive',
        lastActive: u.last_login ? new Date(u.last_login).toLocaleString() : '—'
      }));
      setUsers(mapped);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return users;
    return users.filter((u) =>
      u.name.toLowerCase().includes(term) ||
      u.role.toLowerCase().includes(term)
    );
  }, [users, searchQuery]);

  const totalUsers = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalUsers / usersPerPage));
  const displayedUsers = filteredUsers.slice((currentPage - 1) * usersPerPage, currentPage * usersPerPage);

  return (
    <div className="um-container">
      {error && (
        <div style={{ padding: '12px 16px', marginBottom: '16px', background: '#fee', border: '1px solid #fcc', borderRadius: '8px', color: '#c33' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading && (
        <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
          Loading users...
        </div>
      )}

      {/* Header */}
      <div className="um-header">
        <h1 className="um-title">User Management</h1>
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
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button 
                key={page}
                className={`um-page-btn ${currentPage === page ? 'active' : ''}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}
            <button 
              className="um-page-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
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