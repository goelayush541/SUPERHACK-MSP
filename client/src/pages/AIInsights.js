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
import './AIInsights.css';
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

const AIInsights = () => {
  const [insights, setInsights] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAIInsights();
  }, []);

  const fetchAIInsights = async () => {
    try {
      const [insightsRes, recommendationsRes] = await Promise.all([
        axios.get('/api/ai-insights/business'),
        axios.get('/api/ai-insights/recommendations')
      ]);

      setInsights(insightsRes.data);
      setRecommendations(recommendationsRes.data);
    } catch (error) {
      console.error('Error fetching AI insights:', error);
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

  const costOptimizationData = {
    labels: insights?.costOptimization.opportunities.map(opp => opp.software) || [],
    datasets: [
      {
        label: 'Current Cost',
        data: insights?.costOptimization.opportunities.map(opp => opp.monthlyCost) || [],
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
      },
      {
        label: 'Potential Savings',
        data: insights?.costOptimization.opportunities.map(opp => opp.potentialSavings) || [],
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
      }
    ]
  };

  const growthOpportunitiesData = {
    labels: insights?.growthOpportunities.map(client => client.name) || [],
    datasets: [
      {
        label: 'Upsell Potential',
        data: insights?.growthOpportunities.map(client => client.upsellPotential) || [],
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
      }
    ]
  };

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      HIGH: { class: 'priority-high', label: 'High Priority' },
      MEDIUM: { class: 'priority-medium', label: 'Medium Priority' },
      LOW: { class: 'priority-low', label: 'Low Priority' }
    };
    
    const config = priorityConfig[priority] || priorityConfig.MEDIUM;
    return <span className={`priority-badge ${config.class}`}>{config.label}</span>;
  };

  const getTypeIcon = (type) => {
    const icons = {
      CLIENT_RETENTION: '👥',
      COST_SAVING: '💰',
      REVENUE_GROWTH: '📈',
      OPERATIONAL_EFFICIENCY: '⚙️'
    };
    return icons[type] || '💡';
  };

  const insightsKPIs = [
    {
      title: 'Potential Monthly Savings',
      value: `$${Math.round(insights?.costOptimization.totalWaste || 0)}`,
      description: 'From license optimization'
    },
    {
      title: 'At-Risk Clients',
      value: insights?.clientHealth.riskFactors?.length || 0,
      description: 'Requiring attention'
    },
    {
      title: 'Upsell Potential',
      value: `$${Math.round(
        insights?.growthOpportunities.reduce((sum, client) => sum + client.upsellPotential, 0) || 0
      )}`,
      description: 'Across top clients'
    },
    {
      title: 'Predicted Revenue Growth',
      value: `${((insights?.predictiveAnalytics.revenueTrend || 0) * 100).toFixed(1)}%`,
      description: 'Next quarter forecast'
    }
  ];

  return (
    <div className="ai-insights-page">
      <div className="page-header">
        <h1>AI-Powered Insights</h1>
        <p className="text-muted">Intelligent recommendations and predictive analytics</p>
      </div>

      {/* Insights KPIs */}
      <div className="grid grid-4 mb-4">
        {insightsKPIs.map((kpi, index) => (
          <div key={index} className="card">
            <div className="kpi-card">
              <h3 className="kpi-value">{kpi.value}</h3>
              <p className="kpi-title">{kpi.title}</p>
              <p className="kpi-description">{kpi.description}</p>
            </div>
          </div>
        ))}
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
          className={`tab ${activeTab === 'recommendations' ? 'active' : ''}`}
          onClick={() => setActiveTab('recommendations')}
        >
          Smart Recommendations
        </button>
        <button 
          className={`tab ${activeTab === 'optimization' ? 'active' : ''}`}
          onClick={() => setActiveTab('optimization')}
        >
          Cost Optimization
        </button>
        <button 
          className={`tab ${activeTab === 'growth' ? 'active' : ''}`}
          onClick={() => setActiveTab('growth')}
        >
          Growth Opportunities
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-2 mb-4">
          <div className="card">
            <h3 className="mb-3">Cost Optimization Opportunities</h3>
            <Bar 
              data={costOptimizationData}
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

          <div className="card">
            <h3 className="mb-3">Growth Opportunities</h3>
            <Bar 
              data={growthOpportunitiesData}
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
        </div>
      )}

      {activeTab === 'recommendations' && (
        <div className="card">
          <h3 className="mb-3">Smart Recommendations</h3>
          <div className="recommendations-grid">
            {recommendations.map((rec, index) => (
              <div key={index} className="recommendation-card">
                <div className="recommendation-header">
                  <div className="recommendation-type">
                    <span className="type-icon">{getTypeIcon(rec.type)}</span>
                    <span className="type-label">{rec.type.replace('_', ' ')}</span>
                  </div>
                  {getPriorityBadge(rec.priority)}
                </div>
                
                <h4 className="recommendation-title">{rec.title}</h4>
                <p className="recommendation-description">{rec.description}</p>
                
                <div className="recommendation-details">
                  <div className="detail">
                    <strong>Action:</strong> {rec.action}
                  </div>
                  <div className="detail">
                    <strong>Impact:</strong> 
                    <span className={`impact-${rec.impact.toLowerCase()}`}>
                      {rec.impact}
                    </span>
                  </div>
                  {rec.estimatedValue && (
                    <div className="detail">
                      <strong>Value:</strong>
                      <span className={
                        rec.estimatedValue > 0 ? 'text-success' : 'text-error'
                      }>
                        {rec.estimatedValue > 0 ? '+' : ''}${Math.abs(rec.estimatedValue)}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="recommendation-actions">
                  <button className="btn btn-primary btn-sm">
                    Implement
                  </button>
                  <button className="btn btn-outline btn-sm">
                    Schedule
                  </button>
                  <button className="btn btn-outline btn-sm">
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'optimization' && (
        <div className="card">
          <h3 className="mb-3">Cost Optimization Analysis</h3>
          <div className="optimization-list">
            {insights?.costOptimization.opportunities.map((opportunity, index) => (
              <div key={index} className="optimization-item">
                <div className="optimization-header">
                  <h4>{opportunity.software}</h4>
                  <div className="savings-potential">
                    Save ${Math.round(opportunity.potentialSavings)}/month
                  </div>
                </div>
                <div className="optimization-details">
                  <div className="detail">
                    <span className="label">Current Utilization:</span>
                    <span className="value">{opportunity.currentUtilization}%</span>
                  </div>
                  <div className="detail">
                    <span className="label">Monthly Cost:</span>
                    <span className="value">${opportunity.monthlyCost}</span>
                  </div>
                  <div className="detail">
                    <span className="label">Recommendation:</span>
                    <span className="value">{opportunity.recommendation}</span>
                  </div>
                </div>
                <div className="utilization-bar">
                  <div 
                    className="utilization-fill"
                    style={{ width: `${opportunity.currentUtilization}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'growth' && (
        <div className="card">
          <h3 className="mb-3">Growth Opportunities</h3>
          <div className="growth-opportunities">
            {insights?.growthOpportunities.map((client, index) => (
              <div key={index} className="growth-item">
                <div className="growth-header">
                  <div className="client-info">
                    <h4>{client.name}</h4>
                    <div className="client-metrics">
                      <span className="health-score">Health: {client.healthScore}%</span>
                      <span className="current-revenue">
                        Current: ${client.monthlyRevenue?.toLocaleString()}/mo
                      </span>
                    </div>
                  </div>
                  <div className="upsell-potential">
                    <div className="potential-value">
                      +${Math.round(client.upsellPotential)}/mo
                    </div>
                    <div className="potential-label">Upsell Potential</div>
                  </div>
                </div>
                <div className="growth-score">
                  <div className="score-label">Growth Score</div>
                  <div className="score-value">{client.growthScore.toFixed(1)}</div>
                </div>
                <div className="growth-actions">
                  <button className="btn btn-primary btn-sm">
                    Contact Client
                  </button>
                  <button className="btn btn-outline btn-sm">
                    Create Proposal
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIInsights;