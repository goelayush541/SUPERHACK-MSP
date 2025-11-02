import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  const navigation = [
    { name: 'Dashboard', path: '/', icon: '📊' },
    { name: 'Clients', path: '/clients', icon: '👥' },
    { name: 'Client Analytics', path: '/clients/analytics', icon: '📈' },
    { name: 'Financial', path: '/financial', icon: '💰' },
    { name: 'Software', path: '/software', icon: '🖥️' },
    { name: 'Sales', path: '/sales', icon: '🎯' },
    { name: 'AI Insights', path: '/ai-insights', icon: '🤖' },
    { name: 'Reports', path: '/reports', icon: '📋' },
  ];

  // Filter navigation based on user role
  const filteredNavigation = navigation.filter(item => {
    if (user?.role === 'sales_agent') {
      return ['Dashboard', 'Clients', 'Client Analytics', 'Sales'].includes(item.name);
    }
    if (user?.role === 'it_team') {
      return ['Dashboard', 'Clients', 'Software'].includes(item.name);
    }
    return true;
  });

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} />
      
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>Navigation</h2>
        </div>
        
        <nav className="sidebar-nav">
          {filteredNavigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) => 
                `nav-item ${isActive ? 'active' : ''}`
              }
              onClick={onClose}
            >
              <span>{item.icon}</span>
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;