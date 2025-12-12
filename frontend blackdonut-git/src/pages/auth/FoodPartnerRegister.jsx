import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import '../../styles/auth-shared.css';
import axios from 'axios';
import API_CONFIG from '../../utils/apiConfig';
import { useNavigate } from 'react-router-dom';
import { createNotification } from '../../utils/axiosSetup';

const FoodPartnerRegister = () => {
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [profileImage, setProfileImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  
  const handleSubmit = async (e) => { 
    e.preventDefault();

    const formData = new FormData();
    formData.append('name', e.target.businessName.value);
    formData.append('contactName', e.target.contactName.value);
    formData.append('phone', e.target.phone.value);
    formData.append('email', e.target.email.value);
    formData.append('password', e.target.password.value);
    formData.append('address', e.target.address.value);
    
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
     // console.log(response.data);
      createNotification('Account created successfully!', 'success');
      navigate("/create-food"); // Redirect to create food page after successful registration
    } catch (error) {
      console.error("Registration error:", error);
      const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
      createNotification(errorMessage, 'error');
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setProfileImage(file);
    setPreviewImage(URL.createObjectURL(file));
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card" role="region" aria-labelledby="partner-register-title">
        <header>
          <h1 id="partner-register-title" className="auth-title">Partner sign up</h1>
          <p className="auth-subtitle">Grow your business with our platform.</p>
        </header>
        
        {/* Add this section for profile image */}
        <div className="profile-upload" style={{ textAlign: 'center', marginBottom: '20px' }}>
          <input 
            type="file"
            ref={fileRef}
            onChange={handleImageChange}
            accept="image/*"
            style={{ display: 'none' }}
          />
          <div 
            onClick={() => fileRef.current.click()}
            style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              border: '2px dashed #ccc',
              margin: '0 auto',
              cursor: 'pointer',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
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
              <span style={{ color: '#666' }}>Add Photo</span>
            )}
          </div>
        </div>

        <nav className="auth-alt-action" style={{marginTop: '-4px'}}>
          <strong style={{fontWeight:600}}>Switch:</strong> <Link to="/user/register">User</Link> • <Link to="/food-partner/register">Food partner</Link>
        </nav>
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="field-group">
            <label htmlFor="businessName">Business Name</label>
            <input id="businessName" name="businessName" placeholder="Tasty Bites" autoComplete="organization" />
          </div>
          <div className="two-col">
            <div className="field-group">
              <label htmlFor="contactName">Contact Name</label>
              <input id="contactName" name="contactName" placeholder="Jane Doe" autoComplete="name" />
            </div>
            <div className="field-group">
              <label htmlFor="phone">Phone</label>
              <input id="phone" name="phone" placeholder="+1 555 123 4567" autoComplete="tel" />
            </div>
          </div>
            <div className="field-group">
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" placeholder="business@example.com" autoComplete="email" />
            </div>
          <div className="field-group">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" placeholder="Create password" autoComplete="new-password" />
          </div>
          <div className="field-group">
            <label htmlFor="address">Address</label>
            <input id="address" name="address" placeholder="123 Market Street" autoComplete="street-address" />
            <p className="small-note">Full address helps customers find you faster.</p>
          </div>
          <button className="auth-submit" type="submit">Create Partner Account</button>
        </form>
        <div className="auth-alt-action">
          Already a partner? <Link to="/food-partner/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default FoodPartnerRegister;