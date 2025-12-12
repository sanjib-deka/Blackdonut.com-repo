import React, { useEffect, useState } from 'react'
import axios from 'axios'
import API_CONFIG from '../../utils/apiConfig'
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import '../../styles/edit-partner.css'
import '../../styles/logo-responsive.css'

const EditPartner = () => {
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [contactName, setContactName] = useState('')
  const [phone, setPhone] = useState('')
  const [originalName, setOriginalName] = useState('')
  const [originalAddress, setOriginalAddress] = useState('')
  const [originalContactName, setOriginalContactName] = useState('')
  const [originalPhone, setOriginalPhone] = useState('')
  const [customerServed, setCustomerServed] = useState(0)
  const [originalCustomerServed, setOriginalCustomerServed] = useState(0)
  const [editingName, setEditingName] = useState(false)
  const [editingAddress, setEditingAddress] = useState(false)
  const [editingContactName, setEditingContactName] = useState(false)
  const [editingPhone, setEditingPhone] = useState(false)
  const [editingCustomerServed, setEditingCustomerServed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    // Fetch current profile data
    fetchProfileData()
  }, [])

  const fetchProfileData = async () => {
    try {
      setLoading(true)
      const res = await axios.get(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.FOOD_PARTNER.GET_ME}`, {
        withCredentials: true
      })
      const data = res.data.foodPartner
      setName(data.name || '')
      setAddress(data.address || '')
      setContactName(data.contactName || '')
      setPhone(data.phone || '')
      setCustomerServed(data.customerServed || 0)
      setOriginalName(data.name || '')
      setOriginalAddress(data.address || '')
      setOriginalContactName(data.contactName || '')
      setOriginalPhone(data.phone || '')
      setOriginalCustomerServed(data.customerServed || 0)
    } catch (err) {
      // console.error('Fetch profile error:', err)
      if (err.response && err.response.status === 401) {
        navigate('/food-partner/login', { replace: true })
      } else {
        setError('Failed to load profile data')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    // Validate inputs
    if (!name.trim()) {
      setError('Name cannot be empty')
      return
    }
    if (!address.trim()) {
      setError('Address cannot be empty')
      return
    }
    if (!contactName.trim()) {
      setError('Contact name cannot be empty')
      return
    }
    if (!phone.trim()) {
      setError('Phone number cannot be empty')
      return
    }

    setSaving(true)
    const startTime = Date.now()

    try {
      // Update name
      await axios.post(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.FOOD_PARTNER.UPDATE_NAME}`, 
        { name },
        { withCredentials: true }
      )

      // Update address
      await axios.post(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.FOOD_PARTNER.UPDATE_ADDRESS}`,
        { address },
        { withCredentials: true }
      )

      // Update contact name
      await axios.put(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.FOOD_PARTNER.UPDATE_CONTACT_NAME}`,
        { contactName },
        { withCredentials: true }
      )

      // Update phone
      await axios.put(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.FOOD_PARTNER.UPDATE_CONTACT_NUMBER}`,
        { phone },
        { withCredentials: true }
      )

      // Update customer served
      if (customerServed !== originalCustomerServed) {
        await axios.put(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.FOOD_PARTNER.UPDATE_CUSTOMER_SERVED}`,
          { customerServed },
          { withCredentials: true }
        )
      }

      // Ensure minimum 2 second loading time
      const elapsedTime = Date.now() - startTime
      if (elapsedTime < 2000) {
        await new Promise(resolve => setTimeout(resolve, 2000 - elapsedTime))
      }

      setEditingName(false)
      setEditingAddress(false)
      setEditingContactName(false)
      setEditingPhone(false)
      setEditingCustomerServed(false)
      setOriginalName(name)
      setOriginalAddress(address)
      setOriginalContactName(contactName)
      setOriginalPhone(phone)
      setOriginalCustomerServed(customerServed)

      // Navigate back to profile
      setTimeout(() => {
        navigate('/food-partner/profile', { replace: true })
      }, 300)
    } catch (err) {
      // console.error('Save error:', err)
      
      // Ensure minimum 2 second loading time even on error
      const elapsedTime = Date.now() - startTime
      if (elapsedTime < 2000) {
        await new Promise(resolve => setTimeout(resolve, 2000 - elapsedTime))
      }

      if (err.response && err.response.status === 401) {
        navigate('/food-partner/login', { replace: true })
      } else {
        setError('Failed to update profile')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setName(originalName)
    setAddress(originalAddress)
    setContactName(originalContactName)
    setPhone(originalPhone)
    setCustomerServed(originalCustomerServed)
    setEditingName(false)
    setEditingAddress(false)
    setEditingContactName(false)
    setEditingPhone(false)
    setEditingCustomerServed(false)
    navigate('/food-partner/profile', { replace: true })
  }

  if (loading) {
    return (
      <main className="edit-partner-page">
        <div className="edit-partner-loading">Loading profile...</div>
      </main>
    )
  }

  return (
    <main className="edit-partner-page">
      {/* Top-left Logo Only */}
      <div
          style={{
              position: 'fixed',
              top: '30px',
              left: '30px',
              display: 'flex',
              alignItems: 'center',
              zIndex: 10
          }}
          className="desktop-logo"
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
      </div>

      {/* Header with action buttons */}
      <div className="edit-partner-header" style={{ marginTop: '100px' }}>
        <h1 className="edit-partner-title">Edit Profile</h1>
        <div className="edit-partner-actions">
          {/* Edit Profile Picture button */}
          <button
            onClick={() => navigate('/food-partner/edit-picture')}
            className="edit-partner-btn picture-btn"
            disabled={saving}
            aria-label="Edit profile picture"
            title="Edit profile picture"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </button>

          {/* Cancel button */}
          <button
            onClick={handleCancel}
            className="edit-partner-btn cancel-btn"
            disabled={saving}
            aria-label="Cancel"
            title="Cancel"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* Save button */}
          <button
            onClick={handleSave}
            className="edit-partner-btn save-btn"
            disabled={saving || (name === originalName && address === originalAddress && contactName === originalContactName && phone === originalPhone && customerServed === originalCustomerServed)}
            aria-label="Save changes"
            title="Save changes"
          >
            {saving ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="loading-spinner">
                <circle cx="12" cy="12" r="1" fill="currentColor" />
                <circle cx="19" cy="12" r="1" fill="currentColor" />
                <circle cx="5" cy="12" r="1" fill="currentColor" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="edit-partner-error">
          {error}
        </div>
      )}

      {/* Edit sections */}
      <div className="edit-partner-content" style={{ marginTop: '20px' }}>
        {/* Name section */}
        <div className="edit-partner-section">
          <div className="edit-partner-label">
            <span className="edit-partner-label-text">Business Name</span>
            <button
              onClick={() => setEditingName(!editingName)}
              className="edit-partner-pencil"
              disabled={saving}
              aria-label="Edit name"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
              </svg>
            </button>
          </div>
          {editingName ? (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="edit-partner-input"
              placeholder="Enter your business name"
              autoFocus
            />
          ) : (
            <div className="edit-partner-display">
              {name || 'No name set'}
            </div>
          )}
        </div>

        {/* Address section */}
        <div className="edit-partner-section">
          <div className="edit-partner-label">
            <span className="edit-partner-label-text">Address</span>
            <button
              onClick={() => setEditingAddress(!editingAddress)}
              className="edit-partner-pencil"
              disabled={saving}
              aria-label="Edit address"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
              </svg>
            </button>
          </div>
          {editingAddress ? (
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="edit-partner-input edit-partner-textarea"
              placeholder="Enter your business address"
              rows="3"
              autoFocus
            />
          ) : (
            <div className="edit-partner-display">
              {address || 'No address set'}
            </div>
          )}
        </div>

        {/* Contact Name section */}
        <div className="edit-partner-section">
          <div className="edit-partner-label">
            <span className="edit-partner-label-text">Contact Name</span>
            <button
              onClick={() => setEditingContactName(!editingContactName)}
              className="edit-partner-pencil"
              disabled={saving}
              aria-label="Edit contact name"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
              </svg>
            </button>
          </div>
          {editingContactName ? (
            <input
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              className="edit-partner-input"
              placeholder="Enter contact name"
              autoFocus
            />
          ) : (
            <div className="edit-partner-display">
              {contactName || 'No contact name set'}
            </div>
          )}
        </div>

        {/* Phone section */}
        <div className="edit-partner-section">
          <div className="edit-partner-label">
            <span className="edit-partner-label-text">Phone Number</span>
            <button
              onClick={() => setEditingPhone(!editingPhone)}
              className="edit-partner-pencil"
              disabled={saving}
              aria-label="Edit phone number"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
              </svg>
            </button>
          </div>
          {editingPhone ? (
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="edit-partner-input"
              placeholder="Enter phone number"
              autoFocus
            />
          ) : (
            <div className="edit-partner-display">
              {phone || 'No phone number set'}
            </div>
          )}
        </div>

        {/* Customer Served section */}
        <div className="edit-partner-section">
          <div className="edit-partner-label">
            <span className="edit-partner-label-text">Customers Served</span>
            <button
              onClick={() => setEditingCustomerServed(!editingCustomerServed)}
              className="edit-partner-pencil"
              disabled={saving}
              aria-label="Edit customer served count"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
              </svg>
            </button>
          </div>
          {editingCustomerServed ? (
            <input
              type="number"
              value={customerServed}
              onChange={(e) => setCustomerServed(Math.max(0, parseInt(e.target.value) || 0))}
              className="edit-partner-input"
              placeholder="Enter number of customers served"
              min="0"
              autoFocus
            />
          ) : (
            <div className="edit-partner-display">
              {customerServed}
            </div>
          )}
        </div>
      </div>

      {/* Loading overlay */}
      {saving && (
        <div className="edit-partner-overlay">
          <div className="edit-partner-spinner">
            <div className="spinner-dot" />
            <div className="spinner-dot" />
            <div className="spinner-dot" />
          </div>
          <p>Saving changes...</p>
        </div>
      )}
    </main>
  )
}

export default EditPartner
