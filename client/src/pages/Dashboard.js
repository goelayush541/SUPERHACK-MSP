import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import QuickActions from '../components/QuickActions';
import AlertNotifications from '../components/AlertNotifications';
import './Dashboard.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Dashboard = () => {
  const [overview, setOverview] = useState(null);
  const [profitability, setProfitability] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [overviewRes, profitabilityRes, analyticsRes] = await Promise.all([
        axios.get('/api/dashboard/overview'),
        axios.get('/api/dashboard/profitability'),
        axios.get('/api/analytics/business')
      ]);

      setOverview(overviewRes.data);
      setProfitability(profitabilityRes.data);
      setAnalytics(analyticsRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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

  const revenueTrendData = {
    labels: profitability?.trend.map(item => 
      `${item._id.month}/${item._id.year}`
    ) || [],
    datasets: [
      {
        label: 'Revenue',
        data: profitability?.trend.map(item => item.revenue) || [],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Profit',
        data: profitability?.trend.map(item => item.profit) || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      }
    ]
  };

  const clientHealthData = {
    labels: ['Excellent (90-100)', 'Good (80-89)', 'Fair (60-79)', 'Poor (<60)'],
    datasets: [
      {
        data: [25, 35, 30, 10],
        backgroundColor: [
          'rgb(34, 197, 94)',
          'rgb(134, 239, 172)',
          'rgb(253, 224, 71)',
          'rgb(239, 68, 68)'
        ],
        borderWidth: 2,
        borderColor: '#fff'
      }
    ]
  };

  const kpiCards = [
    {
      title: 'Total Clients',
      value: overview?.clients.total || 0,
      change: '+12%',
      trend: 'up',
      icon: '👥'
    },
    {
      title: 'Monthly Revenue',
      value: `$${((overview?.financial.totalRevenue || 0) / 1000).toFixed(1)}K`,
      change: '+8%',
      trend: 'up',
      icon: '💰'
    },
    {
      title: 'Avg. Client Health',
      value: `${Math.round(overview?.clients.health.avgHealthScore || 0)}%`,
      change: '+2%',
      trend: 'up',
      icon: '❤️'
    },
    {
      title: 'Software Costs',
      value: `$${Math.round(overview?.software.totalCost || 0)}`,
      change: '-5%',
      trend: 'down',
      icon: '🖥️'
    }
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-header mb-4">
        <h1>Dashboard Overview</h1>
        <p className="text-muted">Real-time insights into your MSP business performance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-4 mb-4">
        {kpiCards.map((card, index) => (
          <div key={index} className="card">
            <div className="kpi-card">
              <div className="kpi-icon">{card.icon}</div>
              <div className="kpi-content">
                <h3 className="kpi-value">{card.value}</h3>
                <p className="kpi-title">{card.title}</p>
                <div className={`kpi-change ${card.trend}`}>
                  {card.change} from last month
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-3 mb-4">
        {/* Charts */}
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <h3 className="mb-3">Revenue & Profit Trend</h3>
          <Line 
            data={revenueTrendData}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'top',
                }
              }
            }}
          />
        </div>

        {/* Quick Actions */}
        <QuickActions />
      </div>

      <div className="grid grid-3 mb-4">
        {/* Client Health */}
        <div className="card">
          <h3 className="mb-3">Client Health Distribution</h3>
          <Doughnut 
            data={clientHealthData}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'bottom',
                }
              }
            }}
          />
        </div>

        {/* Alerts */}
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <AlertNotifications />
        </div>
      </div>

      {/* Top Clients */}
      <div className="card">
        <h3 className="mb-3">Top Performing Clients</h3>
        <div className="clients-table">
          <table>
            <thead>
              <tr>
                <th>Client Name</th>
                <th>Health Score</th>
                <th>Monthly Revenue</th>
                <th>Profitability</th>
                <th>Margin</th>
              </tr>
            </thead>
            <tbody>
              {profitability?.topClients.map((client, index) => (
                <tr key={index}>
                  <td>
                    <div className="client-info">
                      <div className="client-name">{client.name}</div>
                    </div>
                  </td>
                  <td>
                    <div className="health-score">
                      <div 
                        className={`health-indicator ${
                          client.healthScore >= 80 ? 'excellent' :
                          client.healthScore >= 60 ? 'good' : 'poor'
                        }`}
                      />
                      {client.healthScore}%
                    </div>
                  </td>
                  <td>${client.monthlyRevenue?.toLocaleString()}</td>
                  <td>${client.profitability?.toLocaleString()}</td>
                  <td>
                    <span className={
                      client.margin >= 30 ? 'text-success' :
                      client.margin >= 15 ? 'text-warning' : 'text-error'
                    }>
                      {client.margin?.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;