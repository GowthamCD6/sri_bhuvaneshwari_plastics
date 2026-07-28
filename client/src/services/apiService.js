/**
 * API Service Layer
 * Central service for all API calls with JWT token management
 * Tokens are stored in cookies and will be automatically sent with requests
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Get JWT from localStorage as backup (for legacy support or specific scenarios)
 */
const getTokenFromStorage = () => {
  return null; // Disabled for HttpOnly cookies
};

/**
 * Remove JWT from localStorage
 */
const removeTokenFromStorage = () => {
  localStorage.removeItem('jwt_token');
};

/**
 * Store refresh token in localStorage
 */
const setRefreshTokenInStorage = (token) => {
  // Disabled
};

/**
 * Get refresh token from localStorage
 */
const getRefreshTokenFromStorage = () => {
  return null;
};

/**
 * Remove refresh token from localStorage
 */
const removeRefreshTokenFromStorage = () => {
  localStorage.removeItem('refresh_token');
};

/**
 * Clear all authentication data including Zustand persisted state
 */
const clearAllAuth = () => {
  removeTokenFromStorage();
  removeRefreshTokenFromStorage();
  removeUserData();
  localStorage.removeItem('auth-storage');
  // Instruct backend to clear HttpOnly cookie
  fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST', credentials: 'include' }).catch(()=>console.log('Logout API failed'));
};

/**
 * Attempt to refresh the access token via HttpOnly cookies.
 * Returns true on success, false otherwise.
 */
const _attemptTokenRefresh = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Sends refresh_token cookie automatically
    });
    
    if (response.ok) {
      // Backend automatically sets the new HttpOnly jwt_token cookie
      return true;
    }
    return false;
  } catch {
    return false;
  }
};

/**
 * Store user data in localStorage
 */
const setUserData = (userData) => {
  localStorage.setItem('user_data', JSON.stringify(userData));
};

/**
 * Get user data from localStorage
 */
const getUserData = () => {
  const data = localStorage.getItem('user_data');
  return data ? JSON.parse(data) : null;
};

/**
 * Remove user data from localStorage
 */
const removeUserData = () => {
  localStorage.removeItem('user_data');
};

/**
 * Base fetch wrapper with JWT support (ready for future integration)
 */
const fetchWithAuth = async (url, options = {}) => {
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
    credentials: 'include', // Important for cookies
  };

  const timeoutMs = options.timeoutMs ?? 15000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  // Allow caller to pass a signal, but still enforce timeout
  config.signal = controller.signal;

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, config);
    
    // Handle token expiration with automatic refresh
    if (response.status === 401 && !options._isRetry) {
      const refreshed = await _attemptTokenRefresh();
      if (refreshed) {
        return fetchWithAuth(url, { ...options, _isRetry: true });
      }
      clearAllAuth();
      window.location.href = '/';
      const sessionErr = new Error('Session expired. Please log in again.');
      sessionErr.status = 401;
      throw sessionErr;
    }

    // Handle global 403 Forbidden (RBAC/PBAC rejection)
    if (response.status === 403) {
      window.location.href = '/access-denied';
      const err = new Error('Access Denied. Insufficient permissions.');
      err.status = 403;
      throw err;
    }

    const data = await response.json();

    if (!response.ok) {
      const err = new Error(data.message || `HTTP ${response.status}: Something went wrong`);
      err.data = data;
      err.status = response.status;
      throw err;
    }

    return data;
  } catch (error) {
    if (error?.name === 'AbortError') {
      const err = new Error('Request timed out. Please check server connection and try again.');
      err.status = 0;
      throw err;
    }
    console.error('API Error:', error);
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

// ========================
// AUTH SERVICES
// ========================

export const authService = {
  /**
   * Login with phone number and password
   */
  login: async (mobile, password) => {
    const response = await fetchWithAuth('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ mobile, password }),
    });

    if (response.success && response.user) {
      setUserData(response.user);
    }

    return response;
  },

  /**
   * Login with Google
   */
  googleLogin: async (googleToken) => {
    const response = await fetchWithAuth('/auth/google-login', {
      method: 'POST',
      body: JSON.stringify({ token: googleToken }),
    });

    if (response.success && response.user) {
      setUserData(response.user);
    }

    return response;
  },

  /**
   * Logout user
   */
  logout: async () => {
    try {
      await fetchWithAuth('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAllAuth();
    }
  },

  /**
   * Get current user profile
   */
  getProfile: async () => {
    return await fetchWithAuth('/auth/profile');
  },

  /**
   * Refresh token
   */
  refreshToken: async () => {
    const response = await fetchWithAuth('/auth/refresh', { method: 'POST' });
    if (response.token) {
      setTokenInCookie(response.token);
      setTokenInStorage(response.token);
    }
    return response;
  },
};

// ========================
// USER SERVICES
// ========================

export const userService = {
  /**
   * Get all users (Admin only)
   */
  getAllUsers: async () => {
    return await fetchWithAuth('/users');
  },

  /**
   * Get user by ID
   */
  getUserById: async (userId) => {
    return await fetchWithAuth(`/users/${userId}`);
  },

  /**
   * Create new user (Admin only)
   */
  createUser: async (userData) => {
    return await fetchWithAuth('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  /**
   * Update user
   */
  updateUser: async (userId, userData) => {
    return await fetchWithAuth(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  /**
   * Delete user (Admin only)
   */
  deleteUser: async (userId) => {
    return await fetchWithAuth(`/users/${userId}`, {
      method: 'DELETE',
    });
  },
};

// ========================
// MATERIAL SERVICES
// ========================

export const materialService = {
  /**
   * Get all materials
   */
  getAllMaterials: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    return await fetchWithAuth(`/materials${queryParams ? '?' + queryParams : ''}`);
  },

  /**
   * Get material by ID
   */
  getMaterialById: async (materialId) => {
    return await fetchWithAuth(`/materials/${materialId}`);
  },

  /**
   * Create new material
   */
  createMaterial: async (materialData) => {
    return await fetchWithAuth('/materials', {
      method: 'POST',
      body: JSON.stringify(materialData),
    });
  },

  /**
   * Update material
   */
  updateMaterial: async (materialId, materialData) => {
    return await fetchWithAuth(`/materials/${materialId}`, {
      method: 'PUT',
      body: JSON.stringify(materialData),
    });
  },

  /**
   * Delete material
   */
  deleteMaterial: async (materialId) => {
    return await fetchWithAuth(`/materials/${materialId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Get low stock materials
   */
  getLowStockMaterials: async () => {
    return await fetchWithAuth('/materials/low-stock');
  },
};

// ========================
// INVENTORY SERVICES
// ========================

export const inventoryService = {
  /**
   * Get all inventory items
   */
  getAllInventory: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    return await fetchWithAuth(`/inventory${queryParams ? '?' + queryParams : ''}`);
  },

  /**
   * Get inventory by ID
   */
  getInventoryById: async (inventoryId) => {
    return await fetchWithAuth(`/inventory/${inventoryId}`);
  },

  /**
   * Update inventory stock
   */
  updateInventoryStock: async (inventoryId, stockData) => {
    return await fetchWithAuth(`/inventory/${inventoryId}/stock`, {
      method: 'PUT',
      body: JSON.stringify(stockData),
    });
  },

  /**
   * Get inventory history
   */
  getInventoryHistory: async (inventoryId) => {
    return await fetchWithAuth(`/inventory/${inventoryId}/history`);
  },
};

// ========================
// PURCHASE INDENT SERVICES
// ========================

export const purchaseIndentService = {
  /**
   * Get all purchase indents
   */
  getAllIndents: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    return await fetchWithAuth(`/purchase-indents${queryParams ? '?' + queryParams : ''}`);
  },

  /**
   * Get Purchase Department indents
   */
  getPurchaseDeptIndents: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    return await fetchWithAuth(`/purchase-indents/purchase-dept${queryParams ? '?' + queryParams : ''}`);
  },

  /**
   * Create Purchase Department indent (Purchase Dept → QMS → Admin workflow)
   */
  createPurchaseDeptIndent: async (indentData) => {
    return await fetchWithAuth('/purchase-indents/purchase-dept', {
      method: 'POST',
      body: JSON.stringify(indentData),
    });
  },

  /**
   * Get indent by ID
   */
  getIndentById: async (indentId) => {
    return await fetchWithAuth(`/purchase-indents/${indentId}`);
  },

  /**
   * Create new purchase indent
   */
  createIndent: async (indentData) => {
    return await fetchWithAuth('/purchase-indents', {
      method: 'POST',
      body: JSON.stringify(indentData),
    });
  },

  /**
   * Update purchase indent
   */
  updateIndent: async (indentId, indentData) => {
    return await fetchWithAuth(`/purchase-indents/${indentId}`, {
      method: 'PUT',
      body: JSON.stringify(indentData),
    });
  },

  /**
   * Approve/Reject indent (QMS)
   */
  updateIndentStatus: async (indentId, statusData) => {
    return await fetchWithAuth(`/purchase-indents/${indentId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(statusData),
    });
  },

  /**
   * Send indent to next workflow stage
   */
  sendToNextStage: async (indentId, data = {}) => {
    return await fetchWithAuth(`/purchase-indents/${indentId}/send-next`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Upload PO file for indent
   */
  uploadPOFile: async (indentId, file) => {
    const formData = new FormData();
    formData.append('poFile', file);

    return await fetchWithAuth(`/purchase-indents/${indentId}/upload-po`, {
      method: 'POST',
      body: formData,
      headers: {}
    });
  },

  /**
   * Complete indent (Accountant final stage)
   */
  completeIndent: async (indentId, data = {}) => {
    return await fetchWithAuth(`/purchase-indents/${indentId}/complete`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete purchase indent
   */
  deleteIndent: async (indentId) => {
    return await fetchWithAuth(`/purchase-indents/${indentId}`, {
      method: 'DELETE',
    });
  },
};

// ========================
// SUPPLIER SERVICES
// ========================

export const supplierService = {
  /**
   * Get all suppliers
   */
  getAllSuppliers: async () => {
    return await fetchWithAuth('/suppliers');
  },

  /**
   * Get supplier by ID
   */
  getSupplierById: async (supplierId) => {
    return await fetchWithAuth(`/suppliers/${supplierId}`);
  },

  /**
   * Create new supplier
   */
  createSupplier: async (supplierData) => {
    return await fetchWithAuth('/suppliers', {
      method: 'POST',
      body: JSON.stringify(supplierData),
    });
  },

  /**
   * Update supplier
   */
  updateSupplier: async (supplierId, supplierData) => {
    return await fetchWithAuth(`/suppliers/${supplierId}`, {
      method: 'PUT',
      body: JSON.stringify(supplierData),
    });
  },

  /**
   * Delete supplier
   */
  deleteSupplier: async (supplierId) => {
    return await fetchWithAuth(`/suppliers/${supplierId}`, {
      method: 'DELETE',
    });
  },
};

// ========================
// CUSTOMER ORDER SERVICES
// ========================

export const customerOrderService = {
  /**
   * Get all customer orders
   */
  getAllOrders: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    return await fetchWithAuth(`/customer-orders${queryParams ? '?' + queryParams : ''}`);
  },

  /**
   * Get order by ID
   */
  getOrderById: async (orderId) => {
    return await fetchWithAuth(`/customer-orders/${orderId}`);
  },

  /**
   * Create new customer order
   */
  createOrder: async (orderData) => {
    return await fetchWithAuth('/customer-orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  /**
   * Update customer order
   */
  updateOrder: async (orderId, orderData) => {
    return await fetchWithAuth(`/customer-orders/${orderId}`, {
      method: 'PUT',
      body: JSON.stringify(orderData),
    });
  },

  /**
   * Update order status
   */
  updateOrderStatus: async (orderId, statusData) => {
    return await fetchWithAuth(`/customer-orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(statusData),
    });
  },

  /**
   * Delete customer order
   */
  deleteOrder: async (orderId) => {
    return await fetchWithAuth(`/customer-orders/${orderId}`, {
      method: 'DELETE',
    });
  },
};

// ========================
// STORE REQUEST SERVICES
// ========================

export const storeRequestService = {
  /**
   * Get all store requests
   */
  getAllRequests: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    return await fetchWithAuth(`/store-requests${queryParams ? '?' + queryParams : ''}`);
  },

  /**
   * Get request by ID
   */
  getRequestById: async (requestId) => {
    return await fetchWithAuth(`/store-requests/${requestId}`);
  },

  /**
   * Create new store request
   */
  createRequest: async (requestData) => {
    return await fetchWithAuth('/store-requests', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
  },

  /**
   * Update store request
   */
  updateRequest: async (requestId, requestData) => {
    return await fetchWithAuth(`/store-requests/${requestId}`, {
      method: 'PUT',
      body: JSON.stringify(requestData),
    });
  },

  /**
   * Verify/Approve store request
   */
  verifyRequest: async (requestId, status, remarks = '') => {
    return await fetchWithAuth(`/store-requests/${requestId}/verify`, {
      method: 'PATCH',
      body: JSON.stringify({ status, remarks }),
    });
  },

  /**
   * Delete store request
   */
  deleteRequest: async (requestId) => {
    return await fetchWithAuth(`/store-requests/${requestId}`, {
      method: 'DELETE',
    });
  },
};

// ========================
// QMS SERVICES
// ========================

export const qmsService = {
  /**
   * Get all QMS approvals
   */
  getAllApprovals: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    return await fetchWithAuth(`/qms/approvals${queryParams ? '?' + queryParams : ''}`);
  },

  /**
   * Approve item
   */
  approveItem: async (itemId, itemType, remarks = '') => {
    return await fetchWithAuth('/qms/approve', {
      method: 'POST',
      body: JSON.stringify({ itemId, itemType, remarks }),
    });
  },

  /**
   * Reject item
   */
  rejectItem: async (itemId, itemType, remarks) => {
    return await fetchWithAuth('/qms/reject', {
      method: 'POST',
      body: JSON.stringify({ itemId, itemType, remarks }),
    });
  },

  /**
   * Get QMS dashboard stats
   */
  getDashboardStats: async () => {
    return await fetchWithAuth('/qms/dashboard');
  },
};

// ========================
// STOCK ADJUSTMENT SERVICES
// ========================

export const stockAdjustmentService = {
  /**
   * Get all stock adjustments
   */
  getAllAdjustments: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    return await fetchWithAuth(`/stock-adjustments${queryParams ? '?' + queryParams : ''}`);
  },

  /**
   * Create stock adjustment
   */
  createAdjustment: async (adjustmentData) => {
    return await fetchWithAuth('/stock-adjustments', {
      method: 'POST',
      body: JSON.stringify(adjustmentData),
    });
  },

  /**
   * Get adjustment by ID
   */
  getAdjustmentById: async (adjustmentId) => {
    return await fetchWithAuth(`/stock-adjustments/${adjustmentId}`);
  },
};

// ========================
// DASHBOARD SERVICES
// ========================

export const dashboardService = {
  /**
   * Get admin dashboard data
   */
  getAdminDashboard: async () => {
    return await fetchWithAuth('/dashboard/admin');
  },

  /**
   * Get store officer dashboard data
   */
  getStoreDashboard: async () => {
    return await fetchWithAuth('/dashboard/store');
  },

  /**
   * Get purchase department dashboard data
   */
  getPurchaseDashboard: async () => {
    return await fetchWithAuth('/dashboard/purchase');
  },

  /**
   * Get QMS dashboard data
   */
  getQMSDashboard: async () => {
    return await fetchWithAuth('/dashboard/qms');
  },
};

// ========================
// CATEGORY SERVICES
// ========================

export const categoryService = {
  /**
   * Get all categories with counts
   */
  getAllCategories: async () => {
    return await fetchWithAuth('/categories');
  },

  /**
   * Create new category
   */
  createCategory: async (categoryData) => {
    return await fetchWithAuth('/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  },

  /**
   * Rename category
   */
  updateCategory: async (oldName, newName) => {
    return await fetchWithAuth(`/categories/${encodeURIComponent(oldName)}`, {
      method: 'PUT',
      body: JSON.stringify({ name: newName }),
    });
  },

  /**
   * Delete category
   */
  deleteCategory: async (categoryName) => {
    return await fetchWithAuth(`/categories/${encodeURIComponent(categoryName)}`, {
      method: 'DELETE',
    });
  },
};

// ========================
// ROLE SERVICES
// ========================

export const roleService = {
  /**
   * Get all roles
   */
  getAllRoles: async () => {
    return await fetchWithAuth('/roles');
  },

  /**
   * Get all permissions
   */
  getAllPermissions: async () => {
    return await fetchWithAuth('/roles/permissions');
  },

  /**
   * Get permissions for a specific role
   */
  getRolePermissions: async (roleId) => {
    return await fetchWithAuth(`/roles/${roleId}/permissions`);
  },

  /**
   * Update permissions for a specific role
   */
  updateRolePermissions: async (roleId, permissionIds) => {
    return await fetchWithAuth(`/roles/${roleId}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({ permissionIds }),
    });
  },
};

export const tokenUtils = {
  getUserData,
  setUserData,
  removeUserData,
};

export default {
  authService,
  userService,
  materialService,
  inventoryService,
  purchaseIndentService,
  supplierService,
  customerOrderService,
  storeRequestService,
  qmsService,
  stockAdjustmentService,
  dashboardService,
  categoryService,
  roleService,
  tokenUtils,
};
