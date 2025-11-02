import React from 'react';

const QuickActions = () => {
  const actions = [
    {
      icon: '👥',
      title: 'Add Client',
      description: 'Register new client',
      action: '/clients/new',
      color: 'blue'
    },
    {
      icon: '💰',
      title: 'Record Payment',
      description: 'Process client payment',
      action: '/financial/payments',
      color: 'green'
    },
    {
      icon: '📊',
      title: 'Generate Report',
      description: 'Create custom report',
      action: '/reports/new',
      color: 'purple'
    },
    {
      icon: '🔄',
      title: 'Sync Data',
      description: 'Update from integrations',
      action: '/integrations/sync',
      color: 'orange'
    }
  ];

  const getColorClass = (color) => {
    const colorMap = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      purple: 'bg-purple-100 text-purple-600',
      orange: 'bg-orange-100 text-orange-600'
    };
    return colorMap[color] || colorMap.blue;
  };

  return (
    <div className="card">
      <h3 className="mb-4">Quick Actions</h3>
      <div className="grid grid-2">
        {actions.map((action, index) => (
          <button
            key={index}
            className="quick-action-btn"
            onClick={() => console.log('Navigate to:', action.action)}
          >
            <div className={`quick-action-icon ${getColorClass(action.color)}`}>
              {action.icon}
            </div>
            <div className="quick-action-content">
              <div className="quick-action-title">{action.title}</div>
              <div className="quick-action-description">{action.description}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;