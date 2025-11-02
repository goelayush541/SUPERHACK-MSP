import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Software = () => {
  const [licenses, setLicenses] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchSoftwareData();
  }, []);

  const fetchSoftwareData = async () => {
    try {
      const [licensesRes, analyticsRes, recommendationsRes] = await Promise.all([
        axios.get('/api/software'),
        axios.get('/api/software/analytics'),
        axios.get('/api/software/recommendations')
      ]);

      setLicenses(licensesRes.data.licenses);
      setAnalytics(analyticsRes.data);
      setRecommendations(recommendationsRes.data);
    } catch (error) {
      console.error('Error fetching software data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="spinner"></div>
      </div>
    );
  }

  const costByDepartmentData = {
    labels: analytics?.costByDepartment.map(item => item._id) || [],
    datasets: [
      {
        label: 'Monthly Cost',
        data: analytics?.costByDepartment.map(item => item.totalCost) || [],
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
      }
    ]
  };

  const utilizationDistributionData = {
    labels: ['0-25%', '25-50%', '50-75%', '75-100%'],
    datasets: [
      {
        data: analytics?.utilizationDistribution.map(item => item.count) || [0, 0, 0, 0],
        backgroundColor: [
          'rgb(239, 68, 68)',
          'rgb(251, 191, 36)',
          'rgb(34, 197, 94)',
          'rgb(21, 128, 61)'
        ],
        borderWidth: 2,
        borderColor: '#fff'
      }
    ]
  };

  const softwareKPIs = [
    {
      title: 'Total Monthly Cost',
      value: `$${Math.round(analytics?.overview.totalCost || 0).toLocaleString()}`,
      description: 'All software licenses'
    },
    {
      title: 'Avg. Utilization',
      value: `${Math.round(analytics?.overview.avgUtilization || 0)}%`,
      description: 'Across all licenses'
    },
    {
      title: 'Underutilized',
      value: analytics?.overview.underutilizedCount || 0,
      description: 'Licenses below 50% usage'
    },
    {
      title: 'Expiring Soon',
      value: analytics?.overview.expiringSoonCount || 0,
      description: 'Within 30 days'
    }
  ];

  const getUtilizationClass = (utilization) => {
    if (utilization >= 75) return 'utilization-high';
    if (utilization >= 50) return 'utilization-medium';
    return 'utilization-low';
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { class: 'status-active', label: 'Active' },
      expired: { class: 'status-inactive', label: 'Expired' },
      pending_renewal: { class: 'status-pending', label: 'Renewal Due' }
    };
    
    const config = statusConfig[status] || statusConfig.active;
    return <span className={`status-badge ${config.class}`}>{config.label}</span>;
  };

  const getSeverityBadge = (severity) => {
    const severityConfig = {
      HIGH: { class: 'severity-high', label: 'High' },
      MEDIUM: { class: 'severity-medium', label: 'Medium' },
      LOW: { class: 'severity-low', label: 'Low' }
    };
    
    const config = severityConfig[severity] || severityConfig.MEDIUM;
    return <span className={`severity-badge ${config.class}`}>{config.label}</span>;
  };

  return (
    <div className="software-page">
      <div className="page-header">
        <h1>Software License Management</h1>
        <p className="text-muted">Track and optimize your software investments</p>
      </div>

      {/* Tab Navigation */}
      <div className="tabs mb-4">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab ${activeTab === 'licenses' ? 'active' : ''}`}
          onClick={() => setActiveTab('licenses')}
        >
          All Licenses
        </button>
        <button 
          className={`tab ${activeTab === 'recommendations' ? 'active' : ''}`}
          onClick={() => setActiveTab('recommendations')}
        >
          Recommendations
        </button>
      </div>

      {activeTab === 'overview' && (
        <>
          {/* Software KPIs */}
          <div className="grid grid-4 mb-4">
            {softwareKPIs.map((kpi, index) => (
              <div key={index} className="card">
                <div className="kpi-card">
                  <h3 className="kpi-value">{kpi.value}</h3>
                  <p className="kpi-title">{kpi.title}</p>
                  <p className="kpi-description">{kpi.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-2 mb-4">
            {/* Cost by Department */}
            <div className="card">
              <h3 className="mb-3">Cost by Department</h3>
              <Bar 
                data={costByDepartmentData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      display: false
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: function(value) {
                          return '$' + value.toLocaleString();
                        }
                      }
                    }
                  }
                }}
              />
            </div>

            {/* Utilization Distribution */}
            <div className="card">
              <h3 className="mb-3">Utilization Distribution</h3>
              <Doughnut 
                data={utilizationDistributionData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'bottom'
                    }
                  }
                }}
              />
            </div>
          </div>
        </>
      )}

      {activeTab === 'licenses' && (
        <div className="card">
          <div className="table-header">
            <h3>Software Licenses</h3>
            <button className="btn btn-primary">
              + Add License
            </button>
          </div>

          <div className="table-container">
            <table className="software-table">
              <thead>
                <tr>
                  <th>Software</th>
                  <th>Vendor</th>
                  <th>Department</th>
                  <th>Monthly Cost</th>
                  <th>Utilization</th>
                  <th>Users</th>
                  <th>Renewal Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {licenses.map((license) => (
                  <tr key={license._id}>
                    <td>
                      <div className="software-info">
                        <div className="software-name">{license.name}</div>
                        <div className="software-category">{license.category}</div>
                      </div>
                    </td>
                    <td>{license.vendor}</td>
                    <td>{license.department}</td>
                    <td>${license.cost?.toLocaleString()}</td>
                    <td>
                      <div className="utilization">
                        <div className="utilization-bar">
                          <div 
                            className={`utilization-fill ${getUtilizationClass(license.utilization)}`}
                            style={{ width: `${license.utilization}%` }}
                          />
                        </div>
                        <span>{license.utilization}%</span>
                      </div>
                    </td>
                    <td>{license.users}</td>
                    <td>
                      {license.renewalDate 
                        ? new Date(license.renewalDate).toLocaleDateString()
                        : 'N/A'
                      }
                    </td>
                    <td>
                      {getStatusBadge(license.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'recommendations' && (
        <div className="card">
          <h3 className="mb-3">Cost Optimization Recommendations</h3>
          <div className="recommendations-list">
            {recommendations.map((rec, index) => (
              <div key={index} className="recommendation-item">
                <div className="recommendation-header">
                  <div className="recommendation-title">
                    {getSeverityBadge(rec.severity)}
                    <h4>{rec.title}</h4>
                  </div>
                  {rec.potentialSavings && (
                    <div className="potential-savings">
                      Save ${rec.potentialSavings}/month
                    </div>
                  )}
                </div>
                <p className="recommendation-description">{rec.description}</p>
                <p className="recommendation-suggestion">
                  <strong>Suggestion:</strong> {rec.suggestion}
                </p>
                <div className="recommendation-actions">
                  <button className="btn btn-outline">View Details</button>
                  <button className="btn btn-primary">Take Action</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Software;