import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

// Configure axios with better error handling
axios.defaults.baseURL = API_URL;
axios.defaults.timeout = 10000;

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

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    // Check if backend is running
    const checkBackend = async () => {
      try {
        // First, check if backend is accessible
        await axios.get('/api/auth/health').catch(() => {
          throw new Error('Backend not reachable');
        });
        
        setBackendOnline(true);
        
        // If we have a token and backend is online, verify user
        if (token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          try {
            const response = await axios.get('/api/auth/me');
            setUser(response.data);
          } catch (error) {
            console.error('Token verification failed:', error);
            // Token is invalid, clear it
            localStorage.removeItem('token');
            delete axios.defaults.headers.common['Authorization'];
          }
        }
      } catch (error) {
        console.log('Backend not available, running in demo mode');
        setBackendOnline(false);
        
        // Set demo user for presentation if we have a token
        if (token) {
          setUser({
            _id: 'demo-user',
            name: 'Demo User',
            email: 'demo@msp.com',
            role: 'admin',
            department: 'Management'
          });
        }
      } finally {
        setLoading(false);
      }
    };

    checkBackend();
  }, []);

  const login = async (email, password) => {
    try {
      if (!backendOnline) {
        // Demo mode login
        const demoUser = {
          _id: 'demo-user',
          name: 'Demo User',
          email: email,
          role: 'admin',
          department: 'Management',
          token: 'demo-token'
        };
        
        localStorage.setItem('token', 'demo-token');
        setUser(demoUser);
        return demoUser;
      }

      const response = await axios.post('/api/auth/login', { email, password });
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        setUser(response.data);
        return response.data;
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Provide user-friendly error messages
      if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
        throw new Error('Backend server is not running. Please start the server or use demo mode.');
      } else if (error.response?.status === 401) {
        throw new Error('Invalid email or password');
      } else if (error.response?.status === 400) {
        throw new Error('Please check your input and try again');
      } else {
        throw new Error('Login failed. Please try again.');
      }
    }
  };

  const register = async (userData) => {
    try {
      if (!backendOnline) {
        // Demo mode registration
        const demoUser = {
          _id: 'demo-user',
          name: userData.name,
          email: userData.email,
          role: userData.role || 'it_team',
          department: userData.department || 'IT Operations',
          token: 'demo-token'
        };
        
        localStorage.setItem('token', 'demo-token');
        setUser(demoUser);
        return demoUser;
      }

      const response = await axios.post('/api/auth/register', userData);
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        setUser(response.data);
        return response.data;
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      // Provide user-friendly error messages
      if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
        throw new Error('Backend server is not running. Please start the server or use demo mode.');
      } else if (error.response?.status === 400) {
        const errorMessage = error.response.data?.message || 'Registration failed';
        throw new Error(errorMessage);
      } else if (error.response?.status === 409) {
        throw new Error('User already exists with this email');
      } else {
        throw new Error('Registration failed. Please try again.');
      }
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setBackendOnline(false);
  };

  // Function to manually set backend status (useful for testing)
  const setBackendStatus = (status) => {
    setBackendOnline(status);
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    backendOnline,
    setBackendStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};