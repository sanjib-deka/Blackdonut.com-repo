import React, { useState } from 'react';
import '../../styles/auth-shared.css';
import axios from 'axios';
import API_CONFIG from '../../utils/apiConfig';
import { useNavigate } from 'react-router-dom';
import { createNotification } from '../../utils/axiosSetup';
import CustomAlert from '../../components/CustomAlert';

const FoodPartnerLogin = () => {
  const navigate = useNavigate();
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const email = e.target.email.value;
    const password = e.target.password.value;

    try {
      const response = await axios.post(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.FOOD_PARTNER_LOGIN}`, { email, password }, { withCredentials: true });
     // console.log(response.data);
      
      createNotification('Login successful! Redirecting to your dashboard...', 'success');

      setTimeout(() => {
        navigate('/food-partner/profile', { replace: true });
      }, 1500);

    } catch (err) {
      setLoading(false);
      console.error('login error', err);
      const errorMessage = err.response?.data?.message || 'Login failed. Please try again.';
      createNotification(errorMessage, 'error');
    }
  };

  return (
    <div className="auth-page-wrapper">
      {/* Top-left Brand Name */}
      <div
        style={{
          position: 'fixed',
          top: '30px',
          left: '30px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          zIndex: 5
        }}
      >
        <img
          src="/bottombardonot.png"
          alt="Black Donut Logo"
          style={{
            height: '50px',
            width: 'auto',
            objectFit: 'contain'
          }}
        />
        <div
          style={{
            fontSize: '18px',
            fontWeight: '700',
            letterSpacing: '1px',
            color: '#c0bfb8',
            textTransform: 'uppercase'
          }}
        >
          Black Donut
        </div>
      </div>

      {alert && (
        <CustomAlert
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert(null)}
        />
      )}
      <div className="auth-card" role="region" aria-labelledby="partner-login-title">
        <header>
          <h1 id="partner-login-title" className="auth-title">Partner login</h1>
          <p className="auth-subtitle">Access your dashboard and manage orders.</p>
        </header>
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="field-group">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" placeholder="business@example.com" autoComplete="email" required />
          </div>
          <div className="field-group">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" placeholder="Password" autoComplete="current-password" required />
          </div>
          <button className="auth-submit" type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</button>
          <div style={{ textAlign: 'right', marginTop: '12px' }}>
            <a href="/forgot-password" style={{ color: '#0066cc', fontSize: '12px', textDecoration: 'none' }}>Forgot password?</a>
          </div>
        </form>
        <div className="auth-alt-action">
          New partner? <a href="/food-partner/register">Create an account</a>
        </div>
      </div>
    </div>
  );
};

export default FoodPartnerLogin;