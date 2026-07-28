const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const ENDPOINT = '/formula-calculators';

/**
 * Get JWT token from storage
 */
const getToken = () => {
  return localStorage.getItem('jwt_token');
};

/**
 * Fetch wrapper with JWT support
 */
const fetchWithAuth = async (url, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'API request failed');
  }

  return response.json();
};

export const formulaCalculatorService = {
  // Get all calculators
  getAllCalculators: async () => {
    try {
      const response = await fetchWithAuth(ENDPOINT);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Get default calculator
  getDefaultCalculator: async () => {
    try {
      const response = await fetchWithAuth(`${ENDPOINT}/default`);
      return response;
    } catch (error) {
      // Keep UI usable even if default endpoint is not ready.
      return {
        calculator_id: null,
        calculator_name: 'Default Calculator',
        rows: []
      };
    }
  },

  // Get calculator by ID
  getCalculatorById: async (id) => {
    try {
      const response = await fetchWithAuth(`${ENDPOINT}/${id}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Create new calculator
  createCalculator: async (data) => {
    try {
      const response = await fetchWithAuth(ENDPOINT, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Update calculator
  updateCalculator: async (id, data) => {
    try {
      const response = await fetchWithAuth(`${ENDPOINT}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Delete calculator
  deleteCalculator: async (id) => {
    try {
      const response = await fetchWithAuth(`${ENDPOINT}/${id}`, {
        method: 'DELETE',
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Create row in calculator
  createCalculatorRow: async (calculatorId, data) => {
    try {
      const response = await fetchWithAuth(`${ENDPOINT}/${calculatorId}/rows`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Update row in calculator
  updateCalculatorRow: async (calculatorId, rowId, data) => {
    try {
      const response = await fetchWithAuth(`${ENDPOINT}/${calculatorId}/rows/${rowId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Delete row from calculator
  deleteCalculatorRow: async (calculatorId, rowId) => {
    try {
      const response = await fetchWithAuth(`${ENDPOINT}/${calculatorId}/rows/${rowId}`, {
        method: 'DELETE',
      });
      return response;
    } catch (error) {
      throw error;
    }
  }
};

export default formulaCalculatorService;
