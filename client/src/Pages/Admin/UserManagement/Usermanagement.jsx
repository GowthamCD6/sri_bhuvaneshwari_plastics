import React, { useState, useEffect, useMemo, useRef } from 'react';
import './Usermanagement.css';
import { userService } from '../../../services/apiService';
import RequirePermission from '../../../components/RequirePermission';

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
  ),
  X: () => (
    <svg className="icon-x" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  )
};

const UserManagement = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState('');
  const [showRoleFilterDropdown, setShowRoleFilterDropdown] = useState(false);
  const roleFilterRef = useRef(null);

  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [addUserSubmitting, setAddUserSubmitting] = useState(false);
  const [addUserError, setAddUserError] = useState('');
  const [addUserForm, setAddUserForm] = useState({
    username: '',
    email: '',
    phoneNumber: '',
    password: '',
    roleName: 'StoreOfficer',
  });

  // Edit User Modal States
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editUserSubmitting, setEditUserSubmitting] = useState(false);
  const [editUserError, setEditUserError] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [editUserForm, setEditUserForm] = useState({
    username: '',
    email: '',
    phoneNumber: '',
    roleName: '',
    password: '',
  });

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
        userId: u.user_id,
        name: u.username || u.full_name || 'User',
        email: u.email || '-',
        phoneNumber: u.phone_number || '',
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

  useEffect(() => {
    if (!showRoleFilterDropdown) return;
    const onMouseDown = (e) => {
      if (roleFilterRef.current && !roleFilterRef.current.contains(e.target)) {
        setShowRoleFilterDropdown(false);
      }
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [showRoleFilterDropdown]);

  const roleOptions = useMemo(() => {
    const unique = new Set();
    users.forEach((u) => {
      const r = String(u.role || '').trim();
      if (r) unique.add(r);
    });
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [users]);

  const roleNameOptions = useMemo(() => (
    ['Admin', 'QMS', 'StoreOfficer', 'PurchaseDepartment', 'Accountant']
  ), []);

  const openAddUserModal = () => {
    setAddUserError('');
    setAddUserSubmitting(false);
    setAddUserForm({
      username: '',
      email: '',
      phoneNumber: '',
      password: '',
      roleName: 'StoreOfficer',
    });
    setShowAddUserModal(true);
  };

  const closeAddUserModal = () => {
    if (addUserSubmitting) return;
    setShowAddUserModal(false);
    setAddUserError('');
  };

  const onAddUserFieldChange = (e) => {
    const { name, value } = e.target;
    setAddUserForm((prev) => ({ ...prev, [name]: value }));
    if (addUserError) setAddUserError('');
  };

  const submitAddUser = async (e) => {
    e.preventDefault();
    setAddUserError('');

    const username = addUserForm.username.trim();
    const email = addUserForm.email.trim();
    const phoneNumber = addUserForm.phoneNumber.trim();
    const password = addUserForm.password;
    const roleName = addUserForm.roleName;

    if (!username || !email || !phoneNumber || !password) {
      setAddUserError('Please fill all required fields.');
      return;
    }

    try {
      setAddUserSubmitting(true);
      await userService.createUser({ username, email, phoneNumber, password, roleName });
      setShowAddUserModal(false);
      setSearchQuery('');
      setRoleFilter('');
      setCurrentPage(1);
      await fetchUsers();
    } catch (err) {
      setAddUserError(err?.data?.message || err?.message || 'Failed to create user');
    } finally {
      setAddUserSubmitting(false);
    }
  };

  // Edit User Modal Functions
  const openEditUserModal = (user) => {
    setEditUserError('');
    setEditUserSubmitting(false);
    setSelectedUserId(user.userId);
    setEditUserForm({
      username: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      roleName: user.role,
      password: '', // Leave empty - only fill if user wants to change password
    });
    setShowEditUserModal(true);
  };

  const closeEditUserModal = () => {
    if (editUserSubmitting) return;
    setShowEditUserModal(false);
    setEditUserError('');
    setSelectedUserId(null);
  };

  const onEditUserFieldChange = (e) => {
    const { name, value } = e.target;
    setEditUserForm((prev) => ({ ...prev, [name]: value }));
    if (editUserError) setEditUserError('');
  };

  const submitEditUser = async (e) => {
    e.preventDefault();
    setEditUserError('');

    const username = editUserForm.username.trim();
    const email = editUserForm.email.trim();
    const phoneNumber = editUserForm.phoneNumber.trim();
    const roleName = editUserForm.roleName;
    const password = editUserForm.password.trim();

    if (!username || !email || !phoneNumber || !roleName) {
      setEditUserError('Please fill all required fields.');
      return;
    }

    try {
      setEditUserSubmitting(true);
      const updateData = { username, email, phoneNumber, roleName };
      
      // Only include password if user wants to change it
      if (password) {
        updateData.password = password;
      }

      await userService.updateUser(selectedUserId, updateData);
      setShowEditUserModal(false);
      await fetchUsers();
    } catch (err) {
      setEditUserError(err?.data?.message || err?.message || 'Failed to update user');
    } finally {
      setEditUserSubmitting(false);
    }
  };

  const applyRoleFilter = (role) => {
    setRoleFilter(role);
    setShowRoleFilterDropdown(false);
    setCurrentPage(1);
  };

  const filteredUsers = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    let filtered = users;

    if (roleFilter) {
      const rf = roleFilter.toLowerCase();
      filtered = filtered.filter((u) => String(u.role || '').toLowerCase() === rf);
    }

    if (!term) return filtered;
    return filtered.filter((u) =>
      u.name.toLowerCase().includes(term) ||
      u.role.toLowerCase().includes(term)
    );
  }, [users, searchQuery, roleFilter]);

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
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <div className="um-toolbar-right">
          <div className="um-filter-wrapper" ref={roleFilterRef}>
            <button
              className="um-filter-btn"
              type="button"
              onClick={() => setShowRoleFilterDropdown((v) => !v)}
            >
              <Icons.Filter />
              Filter by Role
            </button>
            {showRoleFilterDropdown && (
              <div className="um-filter-dropdown">
                <button
                  type="button"
                  className={`um-filter-option ${!roleFilter ? 'active' : ''}`}
                  onClick={() => applyRoleFilter('')}
                >
                  All
                </button>
                {roleOptions.map((role) => (
                  <button
                    key={role}
                    type="button"
                    className={`um-filter-option ${roleFilter === role ? 'active' : ''}`}
                    onClick={() => applyRoleFilter(role)}
                  >
                    {role}
                  </button>
                ))}
              </div>
            )}
          </div>
          <RequirePermission permission="users:manage">
            <button className="um-add-user-btn" type="button" onClick={openAddUserModal}>
              <Icons.Plus />
              Add New User
            </button>
          </RequirePermission>
        </div>
      </div>

      {showAddUserModal && (
        <div className="um-modal-overlay" onMouseDown={closeAddUserModal}>
          <div className="um-modal" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Add New User">
            <div className="um-modal-header">
              <h2 className="um-modal-title">Add New User</h2>
              <button type="button" className="um-modal-close" onClick={closeAddUserModal} aria-label="Close">
                <Icons.X />
              </button>
            </div>
            <form className="um-modal-body" onSubmit={submitAddUser}>
              {addUserError && (
                <div className="um-modal-error">
                  {addUserError}
                </div>
              )}

              <div className="um-form-row">
                <div className="um-form-group">
                  <label className="um-form-label">Name</label>
                  <input
                    className="um-form-input"
                    name="username"
                    value={addUserForm.username}
                    onChange={onAddUserFieldChange}
                    placeholder="Enter name"
                    autoComplete="name"
                    required
                  />
                </div>
                <div className="um-form-group">
                  <label className="um-form-label">Email ID</label>
                  <input
                    className="um-form-input"
                    type="email"
                    name="email"
                    value={addUserForm.email}
                    onChange={onAddUserFieldChange}
                    placeholder="Enter email"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="um-form-row">
                <div className="um-form-group">
                  <label className="um-form-label">Phone</label>
                  <input
                    className="um-form-input"
                    type="tel"
                    name="phoneNumber"
                    value={addUserForm.phoneNumber}
                    onChange={onAddUserFieldChange}
                    placeholder="Enter phone number"
                    autoComplete="tel"
                    required
                  />
                </div>
                <div className="um-form-group">
                  <label className="um-form-label">Role</label>
                  <select
                    className="um-form-input"
                    name="roleName"
                    value={addUserForm.roleName}
                    onChange={onAddUserFieldChange}
                    required
                  >
                    {roleNameOptions.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="um-form-group">
                <label className="um-form-label">Password</label>
                <input
                  className="um-form-input"
                  type="password"
                  name="password"
                  value={addUserForm.password}
                  onChange={onAddUserFieldChange}
                  placeholder="Create password"
                  autoComplete="new-password"
                  required
                />
                <div className="um-form-help">User can login using Phone + Password</div>
              </div>

              <div className="um-modal-footer">
                <button type="button" className="um-btn-secondary" onClick={closeAddUserModal} disabled={addUserSubmitting}>
                  Cancel
                </button>
                <button type="submit" className="um-btn-primary" disabled={addUserSubmitting}>
                  {addUserSubmitting ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUserModal && (
        <div className="um-modal-overlay" onMouseDown={closeEditUserModal}>
          <div className="um-modal" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Edit User">
            <div className="um-modal-header">
              <h2 className="um-modal-title">Edit User Profile</h2>
              <button type="button" className="um-modal-close" onClick={closeEditUserModal} aria-label="Close">
                <Icons.X />
              </button>
            </div>
            <form className="um-modal-body" onSubmit={submitEditUser}>
              {editUserError && (
                <div className="um-modal-error">
                  {editUserError}
                </div>
              )}

              <div className="um-form-row">
                <div className="um-form-group">
                  <label className="um-form-label">Name</label>
                  <input
                    className="um-form-input"
                    name="username"
                    value={editUserForm.username}
                    onChange={onEditUserFieldChange}
                    placeholder="Enter name"
                    autoComplete="name"
                    required
                  />
                </div>
                <div className="um-form-group">
                  <label className="um-form-label">Email ID</label>
                  <input
                    className="um-form-input"
                    type="email"
                    name="email"
                    value={editUserForm.email}
                    onChange={onEditUserFieldChange}
                    placeholder="Enter email"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="um-form-row">
                <div className="um-form-group">
                  <label className="um-form-label">Phone</label>
                  <input
                    className="um-form-input"
                    type="tel"
                    name="phoneNumber"
                    value={editUserForm.phoneNumber}
                    onChange={onEditUserFieldChange}
                    placeholder="Enter phone number"
                    autoComplete="tel"
                    required
                  />
                </div>
                <div className="um-form-group">
                  <label className="um-form-label">Role</label>
                  <select
                    className="um-form-input"
                    name="roleName"
                    value={editUserForm.roleName}
                    onChange={onEditUserFieldChange}
                    required
                  >
                    {roleNameOptions.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="um-form-group">
                <label className="um-form-label">New Password (Optional)</label>
                <input
                  className="um-form-input"
                  type="password"
                  name="password"
                  value={editUserForm.password}
                  onChange={onEditUserFieldChange}
                  placeholder="Leave empty to keep current password"
                  autoComplete="new-password"
                />
                <div className="um-form-help">Leave blank if you don't want to change the password</div>
              </div>

              <div className="um-modal-footer">
                <button type="button" className="um-btn-secondary" onClick={closeEditUserModal} disabled={editUserSubmitting}>
                  Cancel
                </button>
                <button type="submit" className="um-btn-primary" disabled={editUserSubmitting}>
                  {editUserSubmitting ? 'Updating...' : 'Update User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                  <RequirePermission permission="users:manage">
                    <button 
                      className="um-manage-btn"
                      onClick={() => openEditUserModal(user)}
                    >
                      Manage
                    </button>
                  </RequirePermission>
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