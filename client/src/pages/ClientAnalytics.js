import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const ClientAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [timeRange, setTimeRange] = useState('6months');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get('/api/clients/analytics/performance');
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
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

  // Mock data for demonstration
  const revenueByIndustry = {
    labels: ['Technology', 'Healthcare', 'Finance', 'Retail', 'Manufacturing'],
    datasets: [
      {
        label: 'Monthly Revenue',
        data: [45000, 38000, 52000, 29000, 41000],
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
      }
    ]
  };

  const clientGrowthData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'New Clients',
        data: [5, 7, 3, 8, 6, 9, 12, 8, 10, 7, 9, 11],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Churned Clients',
        data: [2, 1, 3, 2, 1, 2, 1, 3, 2, 1, 2, 1],
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
      }
    ]
  };

  const satisfactionData = {
    labels: ['Very Satisfied', 'Satisfied', 'Neutral', 'Unsatisfied', 'Very Unsatisfied'],
    datasets: [
      {
        data: [35, 45, 12, 5, 3],
        backgroundColor: [
          'rgb(34, 197, 94)',
          'rgb(134, 239, 172)',
          'rgb(253, 224, 71)',
          'rgb(251, 191, 36)',
          'rgb(239, 68, 68)'
        ],
        borderWidth: 2,
        borderColor: '#fff'
      }
    ]
  };

  const kpiCards = [
    {
      title: 'Average Health Score',
      value: '82%',
      change: '+3%',
      trend: 'up',
      description: 'Overall client health'
    },
    {
      title: 'SLA Compliance',
      value: '96.5%',
      change: '+1.2%',
      trend: 'up',
      description: 'Service level adherence'
    },
    {
      title: 'Client Retention',
      value: '94%',
      change: '+2%',
      trend: 'up',
      description: 'Quarterly retention rate'
    },
    {
      title: 'Avg. Response Time',
      value: '2.3h',
      change: '-0.5h',
      trend: 'down',
      description: 'Ticket response time'
    }
  ];

  return (
    <div className="analytics-page">
      <div className="page-header">
        <div className="header-content">
          <h1>Client Analytics</h1>
          <div className="time-filter">
            <select 
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="time-select"
            >
              <option value="3months">Last 3 Months</option>
              <option value="6months">Last 6 Months</option>
              <option value="1year">Last Year</option>
              <option value="ytd">Year to Date</option>
            </select>
          </div>
        </div>
        <p className="text-muted">Deep insights into client performance and behavior</p>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-4 mb-4">
        {kpiCards.map((card, index) => (
          <div key={index} className="card">
            <div className="kpi-card">
              <h3 className="kpi-value">{card.value}</h3>
              <p className="kpi-title">{card.title}</p>
              <div className={`kpi-change ${card.trend}`}>
                {card.change}
              </div>
              <p className="kpi-description">{card.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-2 mb-4">
        <div className="card">
          <h3 className="mb-3">Revenue by Industry</h3>
          <Bar 
            data={revenueByIndustry}
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

        <div className="card">
          <h3 className="mb-3">Client Satisfaction</h3>
          <Doughnut 
            data={satisfactionData}
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

      {/* Client Growth Chart */}
      <div className="card mb-4">
        <h3 className="mb-3">Client Growth & Churn</h3>
        <Line 
          data={clientGrowthData}
          options={{
            responsive: true,
            plugins: {
              legend: {
                position: 'top'
              }
            },
            scales: {
              y: {
                beginAtZero: true
              }
            }
          }}
        />
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-2">
        <div className="card">
          <h3 className="mb-3">Top Performers</h3>
          <div className="performance-list">
            {[
              { name: 'TechCorp Inc.', score: 95, revenue: 12500 },
              { name: 'MediHealth Systems', score: 92, revenue: 9800 },
              { name: 'FinancePlus LLC', score: 90, revenue: 15200 },
              { name: 'RetailGlobal', score: 88, revenue: 8700 },
              { name: 'ManufacturePro', score: 87, revenue: 11300 }
            ].map((client, index) => (
              <div key={index} className="performance-item">
                <div className="client-rank">#{index + 1}</div>
                <div className="client-info">
                  <div className="client-name">{client.name}</div>
                  <div className="client-revenue">${client.revenue.toLocaleString()}/mo</div>
                </div>
                <div className="performance-score">
                  <span className="score-value">{client.score}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="mb-3">Attention Required</h3>
          <div className="attention-list">
            {[
              { name: 'StartupXYZ', score: 45, issues: ['SLA Violations', 'Payment Delays'] },
              { name: 'Local Retail Co.', score: 52, issues: ['Low Satisfaction', 'High Support Tickets'] },
              { name: 'ServiceProvider LLC', score: 58, issues: ['Contract Ending', 'Low Utilization'] }
            ].map((client, index) => (
              <div key={index} className="attention-item">
                <div className="client-info">
                  <div className="client-name">{client.name}</div>
                  <div className="client-issues">
                    {client.issues.map((issue, i) => (
                      <span key={i} className="issue-tag">{issue}</span>
                    ))}
                  </div>
                </div>
                <div className="health-score poor">
                  {client.score}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientAnalytics;