import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const Header = ({ onMenuClick, user }) => {
  const { logout } = useAuth();

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <div className="header-left">
            <button className="menu-button" onClick={onMenuClick}>
              ☰
            </button>
            <h1>MSP Growth Platform</h1>
          </div>
          
          <div className="header-right">
            <div className="user-info">
              <div className="user-avatar">
                {getInitials(user?.name || 'User')}
              </div>
              <div>
                <div className="user-name">{user?.name}</div>
                <div className="text-muted" style={{ fontSize: '0.875rem' }}>
                  {user?.role} • {user?.department}
                </div>
              </div>
            </div>
            
            <button 
              className="btn btn-outline" 
              onClick={logout}
              style={{ marginLeft: '16px' }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;