import React, { useState } from 'react';
import '../../styles/auth-shared.css';
import axios from 'axios';
import API_CONFIG from '../../utils/apiConfig';
import { useNavigate } from 'react-router-dom';
import { createNotification } from '../../utils/axiosSetup';
import CustomAlert from '../../components/CustomAlert';

const UserLogin = () => {

  const navigate = useNavigate();
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isUserMode, setIsUserMode] = useState(true);

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const email = e.target.email.value;
    const password = e.target.password.value;

    try {
      const response = await axios.post(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.USER_LOGIN}`, {
        email,
        password
      }, { withCredentials: true });

      console.log('✅ Login response:', response.data);
      
      createNotification('Login successful! Redirecting...', 'success');

      setTimeout(() => {
        navigate("/home");
      }, 1500);

    } catch (error) {
      setLoading(false);
      console.error('❌ Error logging in:', error);
      console.error('❌ Error response:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'Login failed. Please try again.';
      createNotification(errorMessage, 'error');
    }
  };

  const handleFoodPartnerSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const email = e.target.email.value;
    const password = e.target.password.value;

    try {
      const response = await axios.post(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.FOOD_PARTNER_LOGIN}`, {
        email,
        password
      }, { withCredentials: true });

      console.log('✅ Food Partner Login response:', response.data);
      createNotification('Login successful! Redirecting to dashboard...', 'success');

      setTimeout(() => {
        navigate('/food-partner/profile', { replace: true });
      }, 1500);

    } catch (error) {
      setLoading(false);
      console.error('❌ Error logging in:', error);
      console.error('❌ Error response:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'Login failed. Please try again.';
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
      <div className="auth-card" role="region" aria-labelledby="user-login-title">
        <header>
          <h1 id="user-login-title" className="auth-title">
            {isUserMode ? 'Welcome back' : 'Partner login'}
          </h1>
          <p className="auth-subtitle">
            {isUserMode ? 'Sign in to continue your food journey.' : 'Access your dashboard and manage orders.'}
          </p>
        </header>

        {/* Toggle Button */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <div
            style={{
              display: 'inline-flex',
              background: '#e8e8e8',
              borderRadius: '12px',
              padding: '6px',
              gap: '6px',
              border: '1px solid #d0d0d0'
            }}
          >
            <button
              type="button"
              onClick={() => setIsUserMode(true)}
              style={{
                padding: '10px 24px',
                border: 'none',
                borderRadius: '8px',
                background: isUserMode ? '#2a2a2a' : 'transparent',
                color: isUserMode ? '#fff' : '#666',
                cursor: 'pointer',
                fontWeight: isUserMode ? 600 : 500,
                transition: 'all 0.3s ease',
                fontSize: '13px',
                boxShadow: isUserMode ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
                fontFamily: 'inherit'
              }}
            >
              User
            </button>
            <button
              type="button"
              onClick={() => setIsUserMode(false)}
              style={{
                padding: '10px 24px',
                border: 'none',
                borderRadius: '8px',
                background: !isUserMode ? '#2a2a2a' : 'transparent',
                color: !isUserMode ? '#fff' : '#666',
                cursor: 'pointer',
                fontWeight: !isUserMode ? 600 : 500,
                transition: 'all 0.3s ease',
                fontSize: '13px',
                boxShadow: !isUserMode ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
                fontFamily: 'inherit'
              }}
            >
              Food Partner
            </button>
          </div>
        </div>

        {/* User Login Form */}
        {isUserMode ? (
          <form className="auth-form" onSubmit={handleUserSubmit} noValidate>
            <div className="field-group">
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" placeholder="you@example.com" autoComplete="email" required />
            </div>
            <div className="field-group">
              <label htmlFor="password">Password</label>
              <input id="password" name="password" type="password" placeholder="••••••••" autoComplete="current-password" required />
            </div>
            <button className="auth-submit" type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</button>
            <div style={{ textAlign: 'right', marginTop: '12px' }}>
              <a href="/forgot-password" style={{ color: '#0066cc', fontSize: '12px', textDecoration: 'none' }}>Forgot password?</a>
            </div>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleFoodPartnerSubmit} noValidate>
            <div className="field-group">
              <label htmlFor="partnerEmail">Email</label>
              <input id="partnerEmail" name="email" type="email" placeholder="business@example.com" autoComplete="email" required />
            </div>
            <div className="field-group">
              <label htmlFor="partnerPassword">Password</label>
              <input id="partnerPassword" name="password" type="password" placeholder="••••••••" autoComplete="current-password" required />
            </div>
            <button className="auth-submit" type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</button>
            <div style={{ textAlign: 'right', marginTop: '12px' }}>
              <a href="/forgot-password" style={{ color: '#0066cc', fontSize: '12px', textDecoration: 'none' }}>Forgot password?</a>
            </div>
          </form>
        )}

        <div className="auth-alt-action">
          {isUserMode ? (
            <>New here? <a href="/user/register">Create account</a></>
          ) : (
            <>New partner? <a href="/food-partner/register">Create an account</a></>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserLogin;