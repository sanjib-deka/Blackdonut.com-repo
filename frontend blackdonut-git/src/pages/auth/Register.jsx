import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_CONFIG from '../../utils/apiConfig';
import { createNotification } from '../../utils/axiosSetup';
import '../../styles/auth-shared.css';

const Register = () => {
  const navigate = useNavigate();
  const [isUserMode, setIsUserMode] = useState(true);
  const [foodPartnerStep, setFoodPartnerStep] = useState(1); // 1 or 2
  const fileRef = useRef(null);
  const [profileImage, setProfileImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const formContainerRef = useRef(null);

  // Food Partner form state
  const [fpFormData, setFpFormData] = useState({
    businessName: '',
    contactName: '',
    phone: '',
    email: '',
    password: '',
    address: ''
  });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setProfileImage(file);
    setPreviewImage(URL.createObjectURL(file));
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    const firstName = e.target.firstName.value;
    const lastName = e.target.lastName.value;
    const email = e.target.email.value;
    const password = e.target.password.value;

    try {
      const response = await axios.post(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.USER_REGISTER}`,
        {
          fullName: firstName + ' ' + lastName,
          email,
          password
        },
        { withCredentials: true }
      );
      console.log(response.data);
      createNotification('Account created successfully!', 'success');
      navigate('/');
    } catch (error) {
      console.error('Error registering user:', error);
      const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
      createNotification(errorMessage, 'error');
    }
  };

  const handleFoodPartnerChange = (e) => {
    const { name, value } = e.target;
    setFpFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    // Validate step 1 fields
    if (!fpFormData.businessName.trim() || !fpFormData.contactName.trim() || !fpFormData.phone.trim()) {
      alert('Please fill in all fields');
      return;
    }
    setFoodPartnerStep(2);
  };

  const handlePrevStep = (e) => {
    e.preventDefault();
    setFoodPartnerStep(1);
  };

  const handleFoodPartnerSubmit = async (e) => {
    e.preventDefault();
    
    // Validate step 2 fields
    if (!fpFormData.email.trim() || !fpFormData.password.trim() || !fpFormData.address.trim()) {
      createNotification('Please fill in all fields', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('name', fpFormData.businessName);
    formData.append('contactName', fpFormData.contactName);
    formData.append('phone', fpFormData.phone);
    formData.append('email', fpFormData.email);
    formData.append('password', fpFormData.password);
    formData.append('address', fpFormData.address);

    if (profileImage) {
      formData.append('profileImage', profileImage);
    }

    try {
      const response = await axios.post(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.FOOD_PARTNER_REGISTER}`,
        formData,
        {
          withCredentials: true,
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );
      console.log(response.data);
      createNotification('Account created successfully!', 'success');
      navigate('/create-food');
    } catch (error) {
      console.error('Error registering food partner:', error);
      const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
      createNotification(errorMessage, 'error');
    }
  };

  // GSAP animation on mode change
  useEffect(() => {
    try {
      const mod = require('gsap');
      const gsap = mod?.default || mod;
      if (formContainerRef.current) {
        gsap.fromTo(
          formContainerRef.current,
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }
        );
      }
    } catch (e) {
      // fallback: no animation
    }
  }, [isUserMode, foodPartnerStep]);

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

      <div className="auth-card" role="region" aria-labelledby="register-title">
        <header>
          <h1 id="register-title" className="auth-title">
            {isUserMode ? 'Create your account' : 'Partner sign up'}
          </h1>
          <p className="auth-subtitle">
            {isUserMode
              ? 'Join to explore and enjoy delicious meals.'
              : 'Grow your business with our platform.'}
          </p>
        </header>

        {/* Toggle Button with GSAP Animation */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <div
            ref={(el) => {
              if (el) {
                try {
                  const mod = require('gsap');
                  const gsap = mod?.default || mod;
                  gsap.fromTo(
                    el.querySelectorAll('button'),
                    { scale: 1 },
                    { scale: 1, duration: 0.4, ease: 'elastic.out(1, 0.5)' }
                  );
                } catch (e) {}
              }
            }}
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

        {/* Form Container with Animation */}
        <div ref={formContainerRef}>
          {/* User Registration Form */}
          {isUserMode ? (
            <form className="auth-form" onSubmit={handleUserSubmit} noValidate>
              <div className="two-col">
                <div className="field-group">
                  <label htmlFor="firstName">First Name</label>
                  <input
                    id="firstName"
                    name="firstName"
                    placeholder="Jane"
                    autoComplete="given-name"
                    required
                  />
                </div>
                <div className="field-group">
                  <label htmlFor="lastName">Last Name</label>
                  <input
                    id="lastName"
                    name="lastName"
                    placeholder="Doe"
                    autoComplete="family-name"
                    required
                  />
                </div>
              </div>
              <div className="field-group">
                <label htmlFor="userEmail">Email</label>
                <input
                  id="userEmail"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </div>
              <div className="field-group">
                <label htmlFor="userPassword">Password</label>
                <input
                  id="userPassword"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                />
              </div>
              <button className="auth-submit" type="submit">
                Sign Up
              </button>
            </form>
          ) : (
            // Food Partner Registration Form - Multi-Step
            <form className="auth-form" onSubmit={foodPartnerStep === 2 ? handleFoodPartnerSubmit : handleNextStep} noValidate>
              {/* Step Indicator */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '8px',
                marginBottom: '24px',
                fontSize: '12px',
                color: '#999'
              }}>
                <span style={{ color: foodPartnerStep === 1 ? '#c0bfb8' : '#ccc', fontWeight: foodPartnerStep === 1 ? 600 : 400 }}>●</span>
                <span style={{ color: foodPartnerStep === 2 ? '#c0bfb8' : '#ccc', fontWeight: foodPartnerStep === 2 ? 600 : 400 }}>●</span>
              </div>

              {/* Step 1: Profile & Business Info */}
              {foodPartnerStep === 1 && (
                <>
                  {/* Profile Image Upload - Minimalistic */}
                  <div style={{ textAlign: 'center', marginBottom: '20px', position: 'relative', display: 'inline-block', width: '100%' }}>
                    <input
                      type="file"
                      ref={fileRef}
                      onChange={handleImageChange}
                      accept="image/*"
                      style={{ display: 'none' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <div
                        style={{
                          position: 'relative',
                          width: '80px',
                          height: '80px'
                        }}
                      >
                        <div
                          onClick={() => !previewImage && fileRef.current.click()}
                          style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            border: '2px solid #ddd',
                            cursor: previewImage ? 'default' : 'pointer',
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: '#fafafa',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {previewImage ? (
                            <img
                              src={previewImage}
                              alt="Profile preview"
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                              }}
                            />
                          ) : (
                            <span style={{ color: '#999', fontSize: '12px' }}>Photo</span>
                          )}
                        </div>

                        {/* Add/Delete Button at bottom-right */}
                        {previewImage ? (
                          <button
                            type="button"
                            onClick={() => {
                              setProfileImage(null);
                              setPreviewImage(null);
                              fileRef.current.value = '';
                            }}
                            style={{
                              position: 'absolute',
                              bottom: '0',
                              right: '0',
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              backgroundColor: '#ef4444',
                              border: '2px solid #fff',
                              color: '#fff',
                              fontSize: '16px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '0',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#dc2626'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = '#ef4444'}
                            title="Remove image"
                          >
                            ×
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => fileRef.current.click()}
                            style={{
                              position: 'absolute',
                              bottom: '0',
                              right: '0',
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              backgroundColor: '#10b981',
                              border: '2px solid #fff',
                              color: '#fff',
                              fontSize: '18px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '0',
                              transition: 'all 0.2s ease',
                              fontWeight: 'bold'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = '#10b981'}
                            title="Add image"
                          >
                            +
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="field-group">
                    <label htmlFor="businessName">Business Name</label>
                    <input
                      id="businessName"
                      name="businessName"
                      value={fpFormData.businessName}
                      onChange={handleFoodPartnerChange}
                      placeholder="e.g., Tasty Bites"
                      autoComplete="organization"
                      required
                    />
                  </div>
                  <div className="field-group">
                    <label htmlFor="contactName">Contact Name</label>
                    <input
                      id="contactName"
                      name="contactName"
                      value={fpFormData.contactName}
                      onChange={handleFoodPartnerChange}
                      placeholder="e.g., Jane Doe"
                      autoComplete="name"
                      required
                    />
                  </div>
                  <div className="field-group">
                    <label htmlFor="phone">Phone</label>
                    <input
                      id="phone"
                      name="phone"
                      value={fpFormData.phone}
                      onChange={handleFoodPartnerChange}
                      placeholder="+1 555 123 4567"
                      autoComplete="tel"
                      required
                    />
                  </div>

                  <button className="auth-submit" type="submit">
                    Next
                  </button>
                </>
              )}

              {/* Step 2: Account Info */}
              {foodPartnerStep === 2 && (
                <>
                  <div className="field-group">
                    <label htmlFor="partnerEmail">Email</label>
                    <input
                      id="partnerEmail"
                      name="email"
                      type="email"
                      value={fpFormData.email}
                      onChange={handleFoodPartnerChange}
                      placeholder="business@example.com"
                      autoComplete="email"
                      required
                    />
                  </div>
                  <div className="field-group">
                    <label htmlFor="partnerPassword">Password</label>
                    <input
                      id="partnerPassword"
                      name="password"
                      type="password"
                      value={fpFormData.password}
                      onChange={handleFoodPartnerChange}
                      placeholder="Create password"
                      autoComplete="new-password"
                      required
                    />
                  </div>
                  <div className="field-group">
                    <label htmlFor="address">Address</label>
                    <input
                      id="address"
                      name="address"
                      value={fpFormData.address}
                      onChange={handleFoodPartnerChange}
                      placeholder="e.g., 123 Market Street"
                      autoComplete="street-address"
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                      className="auth-submit" 
                      type="button"
                      onClick={handlePrevStep}
                      style={{
                        flex: 1,
                        background: '#f5f5f5',
                        color: '#333'
                      }}
                    >
                      Back
                    </button>
                    <button className="auth-submit" type="submit" style={{ flex: 1 }}>
                      Create Account
                    </button>
                  </div>
                </>
              )}
            </form>
          )}
        </div>

        <div className="auth-alt-action">
          {isUserMode ? (
            <>Already have an account? <a href="/user/login" style={{ color: '#007AFF', textDecoration: 'none' }}>Sign in</a></>
          ) : (
            <>Already a partner? <a href="/food-partner/login" style={{ color: '#007AFF', textDecoration: 'none' }}>Sign in</a></>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;
