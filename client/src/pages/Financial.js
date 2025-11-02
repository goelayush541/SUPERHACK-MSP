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

const Financial = () => {
  const [financialData, setFinancialData] = useState(null);
  const [budgetData, setBudgetData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    try {
      const [overviewRes, budgetRes] = await Promise.all([
        axios.get('/api/financial/overview'),
        axios.get('/api/financial/budget')
      ]);

      setFinancialData(overviewRes.data);
      setBudgetData(budgetRes.data);
    } catch (error) {
      console.error('Error fetching financial data:', error);
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

  const profitTrendData = {
    labels: financialData?.monthlyTrend.map(item => 
      `${item._id.month}/${item._id.year}`
    ) || [],
    datasets: [
      {
        label: 'Revenue',
        data: financialData?.monthlyTrend.map(item => item.revenue) || [],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Costs',
        data: financialData?.monthlyTrend.map(item => item.costs) || [],
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Profit',
        data: financialData?.monthlyTrend.map(item => item.profit) || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      }
    ]
  };

  const costBreakdownData = {
    labels: ['Software', 'Personnel', 'Infrastructure', 'Operational'],
    datasets: [
      {
        data: [
          financialData?.costBreakdown.software || 0,
          financialData?.costBreakdown.personnel || 0,
          financialData?.costBreakdown.infrastructure || 0,
          financialData?.costBreakdown.operational || 0
        ],
        backgroundColor: [
          'rgb(59, 130, 246)',
          'rgb(168, 85, 247)',
          'rgb(14, 165, 233)',
          'rgb(99, 102, 241)'
        ],
        borderWidth: 2,
        borderColor: '#fff'
      }
    ]
  };

  const budgetUtilizationData = {
    labels: budgetData.map(item => item._id),
    datasets: [
      {
        label: 'Budget',
        data: budgetData.map(item => item.totalBudget),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
      },
      {
        label: 'Actual Spend',
        data: budgetData.map(item => item.totalSpend),
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
      }
    ]
  };

  const financialKPIs = [
    {
      title: 'Total Revenue',
      value: `$${((financialData?.overview.totalRevenue || 0) / 1000).toFixed(1)}K`,
      change: '+12.5%',
      trend: 'up',
      description: 'Last 6 months'
    },
    {
      title: 'Total Profit',
      value: `$${(((financialData?.overview.totalRevenue || 0) - (financialData?.overview.totalCosts || 0)) / 1000).toFixed(1)}K`,
      change: '+8.2%',
      trend: 'up',
      description: 'Last 6 months'
    },
    {
      title: 'Avg. Monthly Revenue',
      value: `$${Math.round(financialData?.overview.avgMonthlyRevenue || 0).toLocaleString()}`,
      change: '+5.1%',
      trend: 'up',
      description: 'Monthly average'
    },
    {
      title: 'Profit Margin',
      value: `${(((financialData?.overview.totalRevenue || 0) - (financialData?.overview.totalCosts || 0)) / (financialData?.overview.totalRevenue || 1) * 100).toFixed(1)}%`,
      change: '+2.3%',
      trend: 'up',
      description: 'Overall margin'
    }
  ];

  return (
    <div className="financial-page">
      <div className="page-header">
        <h1>Financial Analytics</h1>
        <p className="text-muted">Comprehensive financial insights and performance metrics</p>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-4 mb-4">
        {financialKPIs.map((kpi, index) => (
          <div key={index} className="card">
            <div className="kpi-card">
              <h3 className="kpi-value">{kpi.value}</h3>
              <p className="kpi-title">{kpi.title}</p>
              <div className={`kpi-change ${kpi.trend}`}>
                {kpi.change}
              </div>
              <p className="kpi-description">{kpi.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue & Profit Trend */}
      <div className="card mb-4">
        <h3 className="mb-3">Revenue, Costs & Profit Trend</h3>
        <Line 
          data={profitTrendData}
          options={{
            responsive: true,
            plugins: {
              legend: {
                position: 'top'
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

      <div className="grid grid-2 mb-4">
        {/* Cost Breakdown */}
        <div className="card">
          <h3 className="mb-3">Cost Breakdown</h3>
          <Doughnut 
            data={costBreakdownData}
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

        {/* Budget Utilization */}
        <div className="card">
          <h3 className="mb-3">Budget vs Actual Spend</h3>
          <Bar 
            data={budgetUtilizationData}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'top'
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
      </div>

      {/* Budget Utilization Table */}
      <div className="card">
        <h3 className="mb-3">Department Budget Utilization</h3>
        <div className="table-container">
          <table className="budget-table">
            <thead>
              <tr>
                <th>Department</th>
                <th>Budget</th>
                <th>Actual Spend</th>
                <th>Utilization</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {budgetData.map((dept, index) => (
                <tr key={index}>
                  <td>
                    <div className="dept-name">{dept._id}</div>
                  </td>
                  <td>${dept.totalBudget?.toLocaleString()}</td>
                  <td>${dept.totalSpend?.toLocaleString()}</td>
                  <td>
                    <div className="utilization">
                      <div className="utilization-bar">
                        <div 
                          className={`utilization-fill ${
                            dept.utilization <= 80 ? 'under' :
                            dept.utilization <= 95 ? 'healthy' : 'over'
                          }`}
                          style={{ width: `${Math.min(dept.utilization, 100)}%` }}
                        />
                      </div>
                      <span>{dept.utilization?.toFixed(1)}%</span>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${
                      dept.utilization <= 80 ? 'status-active' :
                      dept.utilization <= 95 ? 'status-pending' : 'status-inactive'
                    }`}>
                      {dept.utilization <= 80 ? 'Under Budget' :
                       dept.utilization <= 95 ? 'On Track' : 'Over Budget'}
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

export default Financial;