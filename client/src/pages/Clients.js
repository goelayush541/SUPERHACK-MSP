import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './Clients.css';

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    status: '',
    sortBy: 'name'
  });

  useEffect(() => {
    fetchClients();
  }, [currentPage, filters]);

  const fetchClients = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...filters
      });

      const response = await axios.get(`/api/clients?${params}`);
      setClients(response.data.clients);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (clientId, newStatus) => {
    // In a real app, you'd make an API call here
    setClients(clients.map(client => 
      client._id === clientId 
        ? { ...client, status: newStatus }
        : client
    ));
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { class: 'status-active', label: 'Active' },
      inactive: { class: 'status-inactive', label: 'Inactive' },
      pending: { class: 'status-pending', label: 'Pending' }
    };
    
    const config = statusConfig[status] || statusConfig.active;
    return <span className={`status-badge ${config.class}`}>{config.label}</span>;
  };

  const getHealthScoreClass = (score) => {
    if (score >= 80) return 'health-excellent';
    if (score >= 60) return 'health-good';
    return 'health-poor';
  };

  if (loading) {
    return (
      <div className="container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="clients-page">
      <div className="page-header">
        <div className="header-content">
          <h1>Client Management</h1>
          <Link to="/clients/analytics" className="btn btn-primary">
            View Analytics
          </Link>
        </div>
        <p className="text-muted">Manage and monitor all your MSP clients</p>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="filters">
          <div className="filter-group">
            <label>Status</label>
            <select 
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Sort By</label>
            <select 
              value={filters.sortBy}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
            >
              <option value="name">Name</option>
              <option value="healthScore">Health Score</option>
              <option value="monthlyRevenue">Revenue</option>
              <option value="createdAt">Date Added</option>
            </select>
          </div>

          <button 
            className="btn btn-outline"
            onClick={() => setFilters({ status: '', sortBy: 'name' })}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Clients Table */}
      <div className="card">
        <div className="table-header">
          <h3>All Clients ({clients.length})</h3>
          <button className="btn btn-primary">
            + Add New Client
          </button>
        </div>

        <div className="table-container">
          <table className="clients-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Status</th>
                <th>Health Score</th>
                <th>SLA Compliance</th>
                <th>Monthly Revenue</th>
                <th>Profitability</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client._id}>
                  <td>
                    <div className="client-info">
                      <div className="client-avatar">
                        {client.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </div>
                      <div className="client-details">
                        <div className="client-name">{client.name}</div>
                        <div className="client-industry">{client.industry}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    {getStatusBadge(client.status)}
                  </td>
                  <td>
                    <div className="health-score">
                      <div className={`health-indicator ${getHealthScoreClass(client.healthScore)}`} />
                      <span>{client.healthScore}%</span>
                    </div>
                  </td>
                  <td>
                    <div className="sla-compliance">
                      {client.slaCompliance}%
                    </div>
                  </td>
                  <td>
                    <div className="revenue">
                      ${client.monthlyRevenue?.toLocaleString()}
                    </div>
                  </td>
                  <td>
                    <div className="profitability">
                      ${(client.monthlyRevenue - (client.costToServe || 0)).toLocaleString()}
                    </div>
                  </td>
                  <td>
                    <div className="actions">
                      <button className="btn-icon" title="Edit">
                        ✏️
                      </button>
                      <button className="btn-icon" title="View Details">
                        👁️
                      </button>
                      <select 
                        value={client.status}
                        onChange={(e) => handleStatusChange(client._id, e.target.value)}
                        className="status-select"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="pending">Pending</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="pagination">
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
            className="btn btn-outline"
          >
            Previous
          </button>
          
          <span className="page-info">
            Page {currentPage} of {totalPages}
          </span>
          
          <button 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
            className="btn btn-outline"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default Clients;