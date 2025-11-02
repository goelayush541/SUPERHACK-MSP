import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AlertNotifications = () => {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      // Mock alerts - in real app, this would come from an API
      const mockAlerts = [
        {
          id: 1,
          type: 'warning',
          title: 'Budget Overage',
          message: 'IT Operations department is 15% over budget this month',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          actionRequired: true
        },
        {
          id: 2,
          type: 'error',
          title: 'License Expiring',
          message: 'Microsoft 365 license expires in 7 days',
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
          actionRequired: true
        },
        {
          id: 3,
          type: 'info',
          title: 'New Client Opportunity',
          message: 'High-value prospect added to pipeline',
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
          actionRequired: false
        }
      ];
      setAlerts(mockAlerts);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  const getAlertIcon = (type) => {
    const icons = {
      warning: '⚠️',
      error: '🚨',
      info: 'ℹ️',
      success: '✅'
    };
    return icons[type] || icons.info;
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const diffInHours = Math.floor((now - timestamp) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const dismissAlert = (alertId) => {
    setAlerts(alerts.filter(alert => alert.id !== alertId));
  };

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h3>Recent Alerts</h3>
        <span className="badge">{alerts.length}</span>
      </div>
      
      <div className="alerts-list">
        {alerts.map((alert) => (
          <div key={alert.id} className="alert-item">
            <div className="alert-icon">
              {getAlertIcon(alert.type)}
            </div>
            <div className="alert-content">
              <div className="alert-header">
                <h4 className="alert-title">{alert.title}</h4>
                <span className="alert-time">
                  {getTimeAgo(alert.timestamp)}
                </span>
              </div>
              <p className="alert-message">{alert.message}</p>
              {alert.actionRequired && (
                <div className="alert-actions">
                  <button className="btn btn-sm btn-primary">
                    Take Action
                  </button>
                  <button 
                    className="btn btn-sm btn-outline"
                    onClick={() => dismissAlert(alert.id)}
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {alerts.length === 0 && (
          <div className="text-center text-muted py-4">
            No new alerts
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertNotifications;