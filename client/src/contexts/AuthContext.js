import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

// Configure axios with better error handling and dynamic API URL
const getApiUrl = () => {
  // Check for environment variable first
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  // Default to localhost for development
  return 'http://localhost:5000';
};

const API_URL = getApiUrl();
axios.defaults.baseURL = API_URL;
axios.defaults.timeout = 10000;

// Add request interceptor for better error handling
axios.interceptors.request.use(
  (config) => {
    console.log(`Making API call to: ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
axios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [backendOnline, setBackendOnline] = useState(false);
  const [apiUrl, setApiUrl] = useState(API_URL);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    const checkBackend = async () => {
      try {
        console.log(`Checking backend connectivity at: ${apiUrl}`);
        await axios.get('/api/auth/health');
        setBackendOnline(true);
        console.log('Backend is online');
        
        if (token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          try {
            const response = await axios.get('/api/auth/me');
            setUser(response.data);
            console.log('User authenticated successfully');
          } catch (authError) {
            console.log('Token invalid, clearing storage');
            localStorage.removeItem('token');
            delete axios.defaults.headers.common['Authorization'];
          }
        }
      } catch (error) {
        console.log('Backend not available, running in demo mode');
        console.log('Error details:', error.message);
        setBackendOnline(false);
        
        // Set demo user for presentation
        setUser({
          _id: 'demo-user',
          name: 'Demo User',
          email: 'demo@msp.com',
          role: 'admin',
          department: 'Management'
        });
      } finally {
        setLoading(false);
      }
    };

    checkBackend();
  }, [apiUrl]);

  const login = async (email, password) => {
    try {
      if (!backendOnline) {
        console.log('Using demo mode login');
        // Demo mode login
        const demoUser = {
          _id: 'demo-user',
          name: 'Demo User',
          email: email,
          role: 'admin',
          department: 'Management',
          token: 'demo-token'
        };
        setUser(demoUser);
        return demoUser;
      }

      console.log('Attempting login with backend');
      const response = await axios.post('/api/auth/login', { email, password });
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        setUser(response.data);
        console.log('Login successful');
        return response.data;
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
        const errorMsg = `Cannot connect to backend server at ${apiUrl}. Please ensure the server is running on port 5000.`;
        console.error(errorMsg);
        throw new Error(errorMsg);
      }
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      if (!backendOnline) {
        console.log('Using demo mode registration');
        // Demo mode registration
        const demoUser = {
          _id: 'demo-user',
          name: userData.name,
          email: userData.email,
          role: userData.role,
          department: userData.department,
          token: 'demo-token'
        };
        setUser(demoUser);
        return demoUser;
      }

      console.log('Attempting registration with backend');
      const response = await axios.post('/api/auth/register', userData);
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        setUser(response.data);
        console.log('Registration successful');
        return response.data;
      }
    } catch (error) {
      console.error('Registration error:', error);
      if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
        const errorMsg = `Cannot connect to backend server at ${apiUrl}. Please ensure the server is running on port 5000.`;
        console.error(errorMsg);
        throw new Error(errorMsg);
      }
      throw error;
    }
  };

  const logout = () => {
    console.log('Logging out user');
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const checkBackendStatus = async () => {
    try {
      await axios.get('/api/auth/health');
      setBackendOnline(true);
      return true;
    } catch (error) {
      setBackendOnline(false);
      return false;
    }
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    backendOnline,
    apiUrl,
    checkBackendStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};