import React, { useState, useEffect } from 'react';
import { roleService } from '../../../services/apiService';
import './RoleManagement.css';

const RoleManagement = () => {
  const [roles, setRoles] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [rolePermissions, setRolePermissions] = useState([]); // IDs of selected permissions
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [rolesRes, permsRes] = await Promise.all([
        roleService.getAllRoles(),
        roleService.getAllPermissions()
      ]);
      
      if (rolesRes.success && rolesRes.data) {
        setRoles(rolesRes.data);
        if (rolesRes.data.length > 0) {
          handleRoleSelect(rolesRes.data[0]);
        }
      }
      
      if (permsRes.success && permsRes.data) {
        setAllPermissions(permsRes.data);
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
      showMessage('Failed to load roles and permissions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelect = async (role) => {
    setSelectedRole(role);
    try {
      setLoading(true);
      const res = await roleService.getRolePermissions(role.id);
      if (res.success && res.data) {
        setRolePermissions(res.data.map(p => p.id));
      }
    } catch (error) {
      console.error('Error fetching role permissions:', error);
      showMessage('Failed to load permissions for this role', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePermission = (permissionId) => {
    setRolePermissions(prev => {
      if (prev.includes(permissionId)) {
        return prev.filter(id => id !== permissionId);
      } else {
        return [...prev, permissionId];
      }
    });
  };

  const handleSave = async () => {
    if (!selectedRole) return;
    
    try {
      setSaving(true);
      const res = await roleService.updateRolePermissions(selectedRole.id, rolePermissions);
      if (res.success) {
        showMessage('Permissions updated successfully!', 'success');
      } else {
        showMessage(res.message || 'Failed to update permissions', 'error');
      }
    } catch (error) {
      console.error('Error saving permissions:', error);
      showMessage('An error occurred while saving', 'error');
    } finally {
      setSaving(false);
    }
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  // Helper to map technical permission names to friendly English
  const getFriendlyName = (technicalName) => {
    const parts = technicalName.split(':');
    if (parts.length !== 2) return technicalName;
    
    const [resource, action] = parts;
    const actionMap = {
      'read': 'View',
      'write': 'Create & Edit',
      'create': 'Create New',
      'update': 'Edit Existing',
      'delete': 'Delete',
      'manage': 'Full Management of',
      'process': 'Process/Approve',
      'admin': 'Admin Dashboard',
      'store': 'Store Dashboard',
      'purchase': 'Purchase Dashboard',
      'qms': 'QMS Dashboard',
    };
    
    let friendlyAction = actionMap[action] || action;
    let friendlyResource = resource.charAt(0).toUpperCase() + resource.slice(1);
    
    if (action === 'admin' || action === 'store' || action === 'purchase' || action === 'qms') {
      return friendlyAction;
    }
    
    return `${friendlyAction} ${friendlyResource}`;
  };

  // Group permissions by prefix (e.g. 'inventory:read' -> 'Inventory')
  const groupedPermissions = allPermissions.reduce((acc, perm) => {
    let group = perm.name.split(':')[0] || 'other';
    // Friendly group names
    const groupNames = {
      'users': 'User Management',
      'dashboard': 'Dashboards',
      'suppliers': 'Suppliers',
      'inventory': 'Inventory',
      'categories': 'Categories',
      'formulas': 'Formula Calculators',
      'indents': 'Purchase Indents',
      'requests': 'Store Requests',
      'orders': 'Customer Orders',
      'materials': 'Materials'
    };
    group = groupNames[group] || (group.charAt(0).toUpperCase() + group.slice(1));
    
    if (!acc[group]) acc[group] = [];
    acc[group].push(perm);
    return acc;
  }, {});

  if (loading && roles.length === 0) {
    return <div className="role-mgmt-loading">Loading configuration...</div>;
  }

  return (
    <div className="role-mgmt-container">
      <div className="role-mgmt-header">
        <h1>Enterprise Role Management</h1>
        <p>Configure Permission-Based Access Control (PBAC) across all user roles dynamically.</p>
      </div>

      {message.text && (
        <div className={`role-mgmt-alert role-mgmt-alert-${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="role-mgmt-content">
        <div className="role-sidebar">
          <h3>User Roles</h3>
          <ul className="role-list">
            {roles.map(role => (
              <li 
                key={role.id} 
                className={`role-item ${selectedRole?.id === role.id ? 'active' : ''}`}
                onClick={() => handleRoleSelect(role)}
              >
                {role.name}
              </li>
            ))}
          </ul>
        </div>

        <div className="role-main">
          <div className="role-main-header">
            <h3>Permissions for: <span className="highlight-role">{selectedRole?.name}</span></h3>
            <button 
              className="save-btn" 
              onClick={handleSave} 
              disabled={saving || loading}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          {loading ? (
            <div className="role-mgmt-loading">Fetching permissions...</div>
          ) : (
            <div className="permissions-grid">
              {Object.entries(groupedPermissions).map(([group, perms]) => (
                <div key={group} className="permission-group-card">
                  <h4 className="group-title">{group}</h4>
                  <div className="permission-list">
                    {perms.map(perm => (
                      <label key={perm.id} className="permission-toggle">
                        <div className="toggle-switch">
                          <input 
                            type="checkbox" 
                            checked={rolePermissions.includes(perm.id)}
                            onChange={() => handleTogglePermission(perm.id)}
                          />
                          <span className="slider round"></span>
                        </div>
                        <div className="perm-info">
                          <span className="perm-name">{getFriendlyName(perm.name)}</span>
                          {perm.description && <span className="perm-desc">{perm.description}</span>}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoleManagement;
