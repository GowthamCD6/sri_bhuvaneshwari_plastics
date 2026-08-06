import React from 'react';
import useAuthStore from '../store/authStore';

/**
 * A wrapper component to conditionally render children based on user permissions.
 * @param {string | string[]} permission - A single permission string or an array of permission strings.
 * @param {React.ReactNode} children - The content to render if the user has the permission.
 * @param {React.ReactNode} fallback - The content to render if the user does NOT have the permission. Defaults to null.
 */
const RequirePermission = ({ permission, children, fallback = null }) => {
  const { user } = useAuthStore();
  
  // If no user, deny access
  if (!user) {
    return fallback;
  }

  // Admin bypass
  if (user.roleName === 'Admin' || user.role === 'Admin') {
    return <>{children}</>;
  }

  // If no permissions loaded for non-admin, deny access
  if (!user.permissions) {
    return fallback;
  }
  
  // If permission is an array, check if user has ANY of the permissions (OR logic)
  if (Array.isArray(permission)) {
    const hasAnyPermission = permission.some(p => user.permissions.includes(p));
    return hasAnyPermission ? <>{children}</> : fallback;
  }

  // If permission is a single string, check if user has exactly that permission
  if (user.permissions.includes(permission)) {
    return <>{children}</>;
  }

  return fallback;
};

export default RequirePermission;
