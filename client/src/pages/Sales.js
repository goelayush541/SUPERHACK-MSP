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

const Sales = () => {
  const [pipelineData, setPipelineData] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pipeline');

  useEffect(() => {
    fetchSalesData();
  }, []);

  const fetchSalesData = async () => {
    try {
      const [pipelineRes, performanceRes, opportunitiesRes] = await Promise.all([
        axios.get('/api/sales/pipeline'),
        axios.get('/api/sales/performance'),
        axios.get('/api/sales/opportunities?limit=20')
      ]);

      setPipelineData(pipelineRes.data);
      setPerformanceData(performanceRes.data);
      setOpportunities(opportunitiesRes.data.opportunities);
    } catch (error) {
      console.error('Error fetching sales data:', error);
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

  const pipelineStages = {
    prospect: { label: 'Prospect', color: 'rgb(156, 163, 175)' },
    qualification: { label: 'Qualification', color: 'rgb(249, 115, 22)' },
    proposal: { label: 'Proposal', color: 'rgb(59, 130, 246)' },
    negotiation: { label: 'Negotiation', color: 'rgb(168, 85, 247)' },
    closed_won: { label: 'Closed Won', color: 'rgb(34, 197, 94)' },
    closed_lost: { label: 'Closed Lost', color: 'rgb(239, 68, 68)' }
  };

  const pipelineChartData = {
    labels: Object.values(pipelineStages).map(stage => stage.label),
    datasets: [
      {
        label: 'Pipeline Value',
        data: Object.keys(pipelineStages).map(stage => {
          const stageData = pipelineData?.pipeline.find(s => s._id === stage);
          return stageData?.totalValue || 0;
        }),
        backgroundColor: Object.values(pipelineStages).map(stage => stage.color),
      }
    ]
  };

  const performanceChartData = {
    labels: performanceData?.repPerformance.map(rep => rep.salesRep) || [],
    datasets: [
      {
        label: 'Won Deals',
        data: performanceData?.repPerformance.map(rep => rep.won) || [],
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
      },
      {
        label: 'Lost Deals',
        data: performanceData?.repPerformance.map(rep => rep.lost) || [],
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
      }
    ]
  };

  const getStageBadge = (stage) => {
    const stageConfig = pipelineStages[stage] || pipelineStages.prospect;
    return (
      <span 
        className="stage-badge"
        style={{ 
          backgroundColor: stageConfig.color,
          color: 'white'
        }}
      >
        {stageConfig.label}
      </span>
    );
  };

  const getProbabilityColor = (probability) => {
    if (probability >= 80) return 'text-success';
    if (probability >= 50) return 'text-warning';
    return 'text-error';
  };

  const salesKPIs = [
    {
      title: 'Total Pipeline',
      value: `$${((pipelineData?.totals.totalValue || 0) / 1000).toFixed(1)}K`,
      description: 'All opportunities'
    },
    {
      title: 'Weighted Pipeline',
      value: `$${((pipelineData?.totals.totalWeightedValue || 0) / 1000).toFixed(1)}K`,
      description: 'Probability adjusted'
    },
    {
      title: 'Avg. Win Rate',
      value: `${Math.round(
        performanceData?.repPerformance.reduce((acc, rep) => acc + (rep.winRate || 0), 0) / 
        (performanceData?.repPerformance.length || 1)
      )}%`,
      description: 'Across sales team'
    },
    {
      title: 'Active Opportunities',
      value: opportunities.filter(opp => !opp.stage.includes('closed')).length,
      description: 'In pipeline'
    }
  ];

  return (
    <div className="sales-page">
      <div className="page-header">
        <h1>Sales Intelligence</h1>
        <p className="text-muted">Manage your sales pipeline and track performance</p>
      </div>

      {/* Sales KPIs */}
      <div className="grid grid-4 mb-4">
        {salesKPIs.map((kpi, index) => (
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
          className={`tab ${activeTab === 'pipeline' ? 'active' : ''}`}
          onClick={() => setActiveTab('pipeline')}
        >
          Pipeline Overview
        </button>
        <button 
          className={`tab ${activeTab === 'performance' ? 'active' : ''}`}
          onClick={() => setActiveTab('performance')}
        >
          Team Performance
        </button>
        <button 
          className={`tab ${activeTab === 'opportunities' ? 'active' : ''}`}
          onClick={() => setActiveTab('opportunities')}
        >
          Opportunities
        </button>
      </div>

      {activeTab === 'pipeline' && (
        <div className="grid grid-2 mb-4">
          <div className="card">
            <h3 className="mb-3">Pipeline by Stage</h3>
            <Bar 
              data={pipelineChartData}
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
            <h3 className="mb-3">Pipeline Breakdown</h3>
            <div className="pipeline-details">
              {pipelineData?.pipeline.map((stage, index) => (
                <div key={index} className="pipeline-stage">
                  <div className="stage-header">
                    <span className="stage-name">
                      {pipelineStages[stage._id]?.label || stage._id}
                    </span>
                    <span className="stage-value">
                      ${stage.totalValue?.toLocaleString()}
                    </span>
                  </div>
                  <div className="stage-metrics">
                    <span className="stage-count">{stage.count} deals</span>
                    <span className="stage-probability">
                      {stage.avgProbability?.toFixed(1)}% avg probability
                    </span>
                  </div>
                  <div className="stage-bar">
                    <div 
                      className="stage-bar-fill"
                      style={{ 
                        width: `${(stage.totalValue / pipelineData.totals.totalValue) * 100}%`,
                        backgroundColor: pipelineStages[stage._id]?.color
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'performance' && (
        <div className="card mb-4">
          <h3 className="mb-3">Sales Team Performance</h3>
          <Bar 
            data={performanceChartData}
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
      )}

      {activeTab === 'opportunities' && (
        <div className="card">
          <div className="table-header">
            <h3>Sales Opportunities</h3>
            <button className="btn btn-primary">
              + Add Opportunity
            </button>
          </div>

          <div className="table-container">
            <table className="opportunities-table">
              <thead>
                <tr>
                  <th>Opportunity</th>
                  <th>Client</th>
                  <th>Stage</th>
                  <th>Value</th>
                  <th>Probability</th>
                  <th>Expected Close</th>
                  <th>Sales Rep</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {opportunities.map((opportunity) => (
                  <tr key={opportunity._id}>
                    <td>
                      <div className="opportunity-info">
                        <div className="opportunity-name">{opportunity.opportunityName}</div>
                        <div className="opportunity-source">{opportunity.source}</div>
                      </div>
                    </td>
                    <td>{opportunity.clientName}</td>
                    <td>{getStageBadge(opportunity.stage)}</td>
                    <td>${opportunity.value?.toLocaleString()}</td>
                    <td>
                      <span className={getProbabilityColor(opportunity.probability)}>
                        {opportunity.probability}%
                      </span>
                    </td>
                    <td>
                      {opportunity.expectedCloseDate 
                        ? new Date(opportunity.expectedCloseDate).toLocaleDateString()
                        : 'N/A'
                      }
                    </td>
                    <td>{opportunity.salesRep}</td>
                    <td>
                      <div className="actions">
                        <button className="btn-icon" title="Edit">
                          ✏️
                        </button>
                        <button className="btn-icon" title="View Details">
                          👁️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;