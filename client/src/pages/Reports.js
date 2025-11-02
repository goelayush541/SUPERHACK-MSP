import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { saveAs } from 'file-saver';

const Reports = () => {
  const [savedReports, setSavedReports] = useState([]);
  const [generatedReport, setGeneratedReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('financial');
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    departments: [],
    metrics: ['revenue', 'costs', 'profit']
  });

  useEffect(() => {
    fetchSavedReports();
  }, []);

  const fetchSavedReports = async () => {
    try {
      const response = await axios.get('/api/reports');
      setSavedReports(response.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      let response;
      switch (reportType) {
        case 'financial':
          response = await axios.post('/api/reports/financial', filters);
          break;
        case 'clients':
          response = await axios.post('/api/reports/clients', filters);
          break;
        default:
          throw new Error('Unsupported report type');
      }
      setGeneratedReport(response.data);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating report: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!generatedReport) return;

    let csvContent = '';
    
    if (reportType === 'financial' && generatedReport.reportData) {
      // Create CSV header
      csvContent = 'Period,Department,Revenue,Costs,Profit,Margin\n';
      
      // Add data rows
      generatedReport.reportData.forEach(row => {
        const period = row.period ? new Date(row.period).toLocaleDateString() : 'N/A';
        csvContent += `"${period}","${row.department}",${row.revenue},${row.totalCosts},${row.profit},${row.margin}\n`;
      });
    } else if (reportType === 'clients' && generatedReport.clients) {
      csvContent = 'Client,Industry,Status,Health Score,SLA Compliance,Monthly Revenue,Profitability,Margin\n';
      
      generatedReport.clients.forEach(client => {
        csvContent += `"${client.name}","${client.industry}","${client.status}",${client.healthScore},${client.slaCompliance},${client.monthlyRevenue},${client.profitability},${client.margin}\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const exportToPDF = () => {
    // In a real application, you would generate a PDF on the server
    // This is a simplified client-side implementation
    window.print();
  };

  const saveReport = async () => {
    if (!generatedReport) return;

    try {
      const reportData = {
        title: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`,
        description: `Generated on ${new Date().toLocaleDateString()}`,
        type: reportType,
        filters: filters,
        data: generatedReport
      };

      await axios.post('/api/reports', reportData);
      alert('Report saved successfully!');
      fetchSavedReports();
    } catch (error) {
      console.error('Error saving report:', error);
      alert('Error saving report: ' + error.message);
    }
  };

  return (
    <div className="reports-page">
      <div className="page-header">
        <h1>Reporting & Analytics</h1>
        <p className="text-muted">Generate and export comprehensive business reports</p>
      </div>

      <div className="grid grid-2 mb-4">
        {/* Report Configuration */}
        <div className="card">
          <h3 className="mb-3">Generate Report</h3>
          
          <div className="form-group">
            <label>Report Type</label>
            <select 
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              <option value="financial">Financial Report</option>
              <option value="clients">Client Performance Report</option>
              <option value="sales">Sales Pipeline Report</option>
              <option value="operational">Operational Efficiency Report</option>
            </select>
          </div>

          <div className="form-group">
            <label>Date Range</label>
            <div className="date-range">
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                placeholder="Start Date"
              />
              <span>to</span>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                placeholder="End Date"
              />
            </div>
          </div>

          {reportType === 'financial' && (
            <div className="form-group">
              <label>Departments</label>
              <div className="checkbox-group">
                {['IT Operations', 'Sales', 'Management', 'Support'].map(dept => (
                  <label key={dept} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={filters.departments.includes(dept)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFilters({
                            ...filters,
                            departments: [...filters.departments, dept]
                          });
                        } else {
                          setFilters({
                            ...filters,
                            departments: filters.departments.filter(d => d !== dept)
                          });
                        }
                      }}
                    />
                    {dept}
                  </label>
                ))}
              </div>
            </div>
          )}

          <button 
            className="btn btn-primary"
            onClick={generateReport}
            disabled={loading}
          >
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
        </div>

        {/* Report Actions */}
        {generatedReport && (
          <div className="card">
            <h3 className="mb-3">Report Actions</h3>
            
            <div className="report-summary mb-4">
              <h4>Report Summary</h4>
              {reportType === 'financial' && (
                <div className="summary-stats">
                  <div className="stat">
                    <span className="label">Total Revenue:</span>
                    <span className="value">
                      ${generatedReport.summary.totalRevenue?.toLocaleString()}
                    </span>
                  </div>
                  <div className="stat">
                    <span className="label">Total Profit:</span>
                    <span className="value">
                      ${(generatedReport.summary.totalRevenue - generatedReport.summary.totalCosts)?.toLocaleString()}
                    </span>
                  </div>
                  <div className="stat">
                    <span className="label">Average Margin:</span>
                    <span className="value">
                      {generatedReport.summary.avgMargin?.toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}
              {reportType === 'clients' && (
                <div className="summary-stats">
                  <div className="stat">
                    <span className="label">Total Clients:</span>
                    <span className="value">{generatedReport.summary.totalClients}</span>
                  </div>
                  <div className="stat">
                    <span className="label">Average Health Score:</span>
                    <span className="value">
                      {generatedReport.summary.avgHealthScore?.toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="export-actions">
              <button className="btn btn-outline" onClick={exportToCSV}>
                Export CSV
              </button>
              <button className="btn btn-outline" onClick={exportToPDF}>
                Export PDF
              </button>
              <button className="btn btn-primary" onClick={saveReport}>
                Save Report
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Generated Report Preview */}
      {generatedReport && (
        <div className="card mb-4">
          <h3 className="mb-3">Report Preview</h3>
          <div className="report-preview">
            {reportType === 'financial' && (
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Period</th>
                    <th>Department</th>
                    <th>Revenue</th>
                    <th>Costs</th>
                    <th>Profit</th>
                    <th>Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {generatedReport.reportData.slice(0, 10).map((row, index) => (
                    <tr key={index}>
                      <td>{new Date(row.period).toLocaleDateString()}</td>
                      <td>{row.department}</td>
                      <td>${row.revenue?.toLocaleString()}</td>
                      <td>${row.totalCosts?.toLocaleString()}</td>
                      <td>${row.profit?.toLocaleString()}</td>
                      <td>{row.margin?.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            
            {reportType === 'clients' && (
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Industry</th>
                    <th>Status</th>
                    <th>Health Score</th>
                    <th>Monthly Revenue</th>
                    <th>Profitability</th>
                  </tr>
                </thead>
                <tbody>
                  {generatedReport.clients.slice(0, 10).map((client, index) => (
                    <tr key={index}>
                      <td>{client.name}</td>
                      <td>{client.industry}</td>
                      <td>
                        <span className={`status-badge status-${client.status}`}>
                          {client.status}
                        </span>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Saved Reports */}
      <div className="card">
        <h3 className="mb-3">Saved Reports</h3>
        <div className="saved-reports">
          {savedReports.length === 0 ? (
            <p className="text-muted text-center py-4">No saved reports yet</p>
          ) : (
            <div className="reports-grid">
              {savedReports.map((report) => (
                <div key={report._id} className="saved-report-card">
                  <div className="report-header">
                    <h4>{report.title}</h4>
                    <span className="report-type">{report.type}</span>
                  </div>
                  <p className="report-description">{report.description}</p>
                  <div className="report-meta">
                    <span>Created by: {report.createdBy?.name}</span>
                    <span>
                      {new Date(report.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="report-actions">
                    <button className="btn btn-outline btn-sm">
                      View
                    </button>
                    <button className="btn btn-outline btn-sm">
                      Export
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;