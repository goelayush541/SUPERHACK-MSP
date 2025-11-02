import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AddClient = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    industry: '',
    contractValue: '',
    startDate: '',
    healthScore: 75,
    slaCompliance: 95,
    satisfactionScore: 80,
    monthlyRevenue: '',
    costToServe: '',
    status: 'active'
  });
  const [loading, setLoading] = useState(false);
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
    
    try {
      await axios.post('/api/clients', {
        ...formData,
        contractValue: Number(formData.contractValue),
        monthlyRevenue: Number(formData.monthlyRevenue),
        costToServe: Number(formData.costToServe),
        startDate: new Date(formData.startDate)
      });
      
      alert('Client added successfully!');
      navigate('/clients');
    } catch (error) {
      console.error('Error adding client:', error);
      alert('Error adding client: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1>Add New Client</h1>
        <p className="text-muted">Register a new client to the MSP Growth Platform</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-2">
            <div className="form-group">
              <label>Client Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter client company name"
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="client@company.com"
              />
            </div>

            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div className="form-group">
              <label>Industry</label>
              <select
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

            <div className="form-group">
              <label>Contract Value ($) *</label>
              <input
                type="number"
                name="contractValue"
                value={formData.contractValue}
                onChange={handleChange}
                required
                placeholder="5000"
              />
            </div>

            <div className="form-group">
              <label>Monthly Revenue ($)</label>
              <input
                type="number"
                name="monthlyRevenue"
                value={formData.monthlyRevenue}
                onChange={handleChange}
                placeholder="2500"
              />
            </div>

            <div className="form-group">
              <label>Cost to Serve ($)</label>
              <input
                type="number"
                name="costToServe"
                value={formData.costToServe}
                onChange={handleChange}
                placeholder="1500"
              />
            </div>

            <div className="form-group">
              <label>Start Date</label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Health Score</label>
              <input
                type="range"
                name="healthScore"
                min="0"
                max="100"
                value={formData.healthScore}
                onChange={handleChange}
              />
              <span>{formData.healthScore}%</span>
            </div>

            <div className="form-group">
              <label>SLA Compliance</label>
              <input
                type="range"
                name="slaCompliance"
                min="0"
                max="100"
                value={formData.slaCompliance}
                onChange={handleChange}
              />
              <span>{formData.slaCompliance}%</span>
            </div>

            <div className="form-group">
              <label>Status</label>
              <select
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

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => navigate('/clients')}
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