import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Clients.css'; // Reuse the same CSS

const AddClient = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    industry: '',
    contractValue: '',
    startDate: new Date().toISOString().split('T')[0],
    healthScore: 75,
    slaCompliance: 95,
    satisfactionScore: 80,
    monthlyRevenue: '',
    costToServe: '',
    status: 'active'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const industries = [
    'Technology',
    'Healthcare', 
    'Finance',
    'Retail',
    'Manufacturing',
    'Education',
    'Government',
    'Non-Profit'
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Prepare the data for API
      const clientData = {
        ...formData,
        contractValue: Number(formData.contractValue) || 0,
        monthlyRevenue: Number(formData.monthlyRevenue) || 0,
        costToServe: Number(formData.costToServe) || 0,
        healthScore: Number(formData.healthScore),
        slaCompliance: Number(formData.slaCompliance),
        satisfactionScore: Number(formData.satisfactionScore),
        startDate: formData.startDate ? new Date(formData.startDate) : new Date()
      };

      console.log('Sending client data:', clientData);

      const response = await axios.post('/api/clients', clientData);
      
      console.log('Client added successfully:', response.data);
      alert('Client added successfully!');
      navigate('/clients');
    } catch (error) {
      console.error('Error adding client:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred';
      setError('Error adding client: ' + errorMessage);
      alert('Error adding client: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <div className="header-content">
          <h1>Add New Client</h1>
          <button 
            className="btn btn-outline"
            onClick={() => navigate('/clients')}
          >
            ← Back to Clients
          </button>
        </div>
        <p className="text-muted">Register a new client to the MSP Growth Platform</p>
      </div>

      {error && (
        <div className="alert alert-error mb-4">
          {error}
        </div>
      )}

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-2">
            {/* Client Basic Information */}
            <div className="form-group">
              <label htmlFor="name">Client Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter client company name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="client@company.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div className="form-group">
              <label htmlFor="industry">Industry</label>
              <select
                id="industry"
                name="industry"
                value={formData.industry}
                onChange={handleChange}
              >
                <option value="">Select Industry</option>
                {industries.map(industry => (
                  <option key={industry} value={industry}>{industry}</option>
                ))}
              </select>
            </div>

            {/* Financial Information */}
            <div className="form-group">
              <label htmlFor="contractValue">Contract Value ($) *</label>
              <input
                type="number"
                id="contractValue"
                name="contractValue"
                value={formData.contractValue}
                onChange={handleChange}
                required
                placeholder="5000"
                min="0"
                step="100"
              />
            </div>

            <div className="form-group">
              <label htmlFor="monthlyRevenue">Monthly Revenue ($)</label>
              <input
                type="number"
                id="monthlyRevenue"
                name="monthlyRevenue"
                value={formData.monthlyRevenue}
                onChange={handleChange}
                placeholder="2500"
                min="0"
                step="100"
              />
            </div>

            <div className="form-group">
              <label htmlFor="costToServe">Cost to Serve ($)</label>
              <input
                type="number"
                id="costToServe"
                name="costToServe"
                value={formData.costToServe}
                onChange={handleChange}
                placeholder="1500"
                min="0"
                step="100"
              />
            </div>

            <div className="form-group">
              <label htmlFor="startDate">Start Date</label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
              />
            </div>

            {/* Performance Metrics */}
            <div className="form-group">
              <label htmlFor="healthScore">
                Health Score: {formData.healthScore}%
              </label>
              <input
                type="range"
                id="healthScore"
                name="healthScore"
                min="0"
                max="100"
                value={formData.healthScore}
                onChange={handleChange}
                className="slider"
              />
            </div>

            <div className="form-group">
              <label htmlFor="slaCompliance">
                SLA Compliance: {formData.slaCompliance}%
              </label>
              <input
                type="range"
                id="slaCompliance"
                name="slaCompliance"
                min="0"
                max="100"
                value={formData.slaCompliance}
                onChange={handleChange}
                className="slider"
              />
            </div>

            <div className="form-group">
              <label htmlFor="satisfactionScore">
                Satisfaction Score: {formData.satisfactionScore}%
              </label>
              <input
                type="range"
                id="satisfactionScore"
                name="satisfactionScore"
                min="0"
                max="100"
                value={formData.satisfactionScore}
                onChange={handleChange}
                className="slider"
              />
            </div>

            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          <div className="form-actions" style={{ 
            display: 'flex', 
            gap: '12px', 
            justifyContent: 'flex-end',
            marginTop: '24px',
            paddingTop: '24px',
            borderTop: '1px solid var(--border-color)'
          }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => navigate('/clients')}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Adding Client...' : 'Add Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddClient;