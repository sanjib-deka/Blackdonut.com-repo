import React, { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import API_CONFIG from '../../utils/apiConfig'
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import '../../styles/edit-partner.css'
import '../../styles/logo-responsive.css'

const EditProfilePicture = () => {
  const [profileImage, setProfileImage] = useState('')
  const [previewImage, setPreviewImage] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [showAdjustment, setShowAdjustment] = useState(false)
  const [imageOffset, setImageOffset] = useState({ x: 0, y: 0 })
  const [imageScale, setImageScale] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const fileInputRef = useRef(null)
  const adjustmentCanvasRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchProfileData()
  }, [])

  const fetchProfileData = async () => {
    try {
      setLoading(true)
      const res = await axios.get(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.FOOD_PARTNER.GET_ME}`, {
        withCredentials: true
      })
      const data = res.data.foodPartner
      setProfileImage(data.profileImage || '')
      setPreviewImage(data.profileImage || '')
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

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB')
      return
    }

    setError('')
    setSuccessMessage('')
    setSelectedFile(file)
    setImageOffset({ x: 0, y: 0 })
    setImageScale(1)

    // Create preview
    const reader = new FileReader()
    reader.onload = (event) => {
      setPreviewImage(event.target?.result || '')
      setShowAdjustment(true)
    }
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select an image to upload')
      return
    }

    try {
      setSaving(true)
      const startTime = Date.now()

      const formData = new FormData()
      formData.append('profileImage', selectedFile)

      const res = await axios.post(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.FOOD_PARTNER.UPDATE_PROFILE_PICTURE}`,
        formData,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      )

      // Ensure minimum 2-second loading time
      const elapsedTime = Date.now() - startTime
      if (elapsedTime < 2000) {
        await new Promise(resolve => setTimeout(resolve, 2000 - elapsedTime))
      }

      setError('')
      setProfileImage(res.data.foodPartner.profileImage)
      setSelectedFile(null)
      setPreviewImage(res.data.foodPartner.profileImage)
      setSuccessMessage('Profile picture updated successfully!')
      setShowAdjustment(false)

      // Clear success message after 2 seconds
      setTimeout(() => setSuccessMessage(''), 2000)
    } catch (err) {
      // console.error('Upload error:', err)
      setError(err.response?.data?.message || 'Failed to upload image')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setSelectedFile(null)
    setPreviewImage(profileImage)
    setError('')
    setShowAdjustment(false)
    setImageOffset({ x: 0, y: 0 })
    setImageScale(1)
  }

  const handleMouseDown = (e) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - imageOffset.x, y: e.clientY - imageOffset.y })
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return
    setImageOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleWheel = (e) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    const newScale = Math.max(0.8, Math.min(3, imageScale * delta))
    setImageScale(newScale)
  }

  const handleResetPosition = () => {
    setImageOffset({ x: 0, y: 0 })
    setImageScale(1)
  }

  const handleAdjustmentComplete = () => {
    setShowAdjustment(false)
  }

  const handleGoBack = () => {
    navigate('/food-partner/edit', { replace: true })
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  if (loading) {
    return (
      <main className="edit-partner-page">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          color: '#fff'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '50px',
              height: '50px',
              border: '3px solid #333',
              borderTop: '3px solid #007AFF',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem'
            }} />
            <p>Loading profile...</p>
          </div>
        </div>
      </main>
    )
  }

  const hasChanges = selectedFile !== null

  return (
    <main className="edit-partner-page" style={{ padding: '0', background: '#000', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
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

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Compact Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '1px solid #222',
        background: '#000',
        marginTop: '100px'
      }}>
        <h1 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#007AFF', margin: 0 }}>
          Profile Picture
        </h1>
        <button
          onClick={handleGoBack}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#ff3b30',
            cursor: 'pointer',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Go back"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div style={{
          padding: '8px 16px',
          background: '#ff3b30',
          color: '#fff',
          fontSize: '0.8rem',
          animation: 'slideDown 0.3s ease'
        }}>
          {error}
        </div>
      )}

      {successMessage && (
        <div style={{
          padding: '8px 16px',
          background: '#34C759',
          color: '#fff',
          fontSize: '0.8rem',
          animation: 'slideDown 0.3s ease'
        }}>
          {successMessage}
        </div>
      )}

      {/* Main Content - Scrollable but compact */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '16px',
        gap: '12px',
        overflowY: 'auto'
      }}>
        {/* Current Picture Section */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.7rem', color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Current Picture
          </span>
          {profileImage ? (
            <img
              src={profileImage}
              alt="Current profile"
              style={{
                width: '100px',
                height: '100px',
                borderRadius: '50px',
                objectFit: 'cover',
                border: '2px solid #007AFF',
                boxShadow: '0 2px 8px rgba(0, 122, 255, 0.3)'
              }}
            />
          ) : (
            <div style={{
              width: '100px',
              height: '100px',
              borderRadius: '50px',
              background: '#111',
              border: '2px solid #333',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#666'
            }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
          )}
        </div>

        {/* Best Fit Info - Compact */}
        <div style={{
          background: '#1a1a1a',
          border: '1px solid #007AFF',
          borderRadius: '6px',
          padding: '8px 12px',
          fontSize: '0.75rem'
        }}>
          <div style={{ color: '#007AFF', fontWeight: 600, marginBottom: '4px' }}>
            📐 Best Size
          </div>
          <div style={{ color: '#ccc', lineHeight: '1.4', fontSize: '0.7rem' }}>
            <div>✓ <strong>400px × 400px</strong> (Square)</div>
            <div>✓ <strong>Display:</strong> 160px circular</div>
            <div style={{ color: '#999', marginTop: '4px' }}>Max 5MB • JPG, PNG, GIF</div>
          </div>
        </div>

        {/* Upload Button */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          disabled={saving}
        />

        <button
          onClick={triggerFileInput}
          disabled={saving}
          style={{
            width: '100%',
            padding: '10px 12px',
            background: '#111',
            border: '2px dashed #007AFF',
            borderRadius: '6px',
            color: '#007AFF',
            cursor: saving ? 'not-allowed' : 'pointer',
            fontSize: '0.85rem',
            fontWeight: 500,
            transition: 'all 0.2s ease',
            opacity: saving ? 0.6 : 1
          }}
          onMouseEnter={(e) => !saving && (e.target.style.background = '#1a1a1a')}
          onMouseLeave={(e) => !saving && (e.target.style.background = '#111')}
        >
          Choose Image
        </button>

        {/* Preview Section - Only when file selected */}
        {previewImage && previewImage !== profileImage && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.7rem', color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Preview
            </span>
            <div style={{
              padding: '8px',
              background: '#111',
              borderRadius: '6px',
              border: '2px dashed #007AFF'
            }}>
              <img
                src={previewImage}
                alt="Preview"
                style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50px',
                  objectFit: 'cover',
                  border: '2px solid #007AFF',
                  boxShadow: '0 2px 8px rgba(0, 122, 255, 0.3)'
                }}
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {hasChanges && (
          <div style={{
            display: 'flex',
            gap: '8px',
            marginTop: '8px'
          }}>
            <button
              onClick={handleCancel}
              disabled={saving}
              style={{
                flex: 1,
                padding: '10px 12px',
                border: '1px solid #555',
                background: '#111',
                color: '#fff',
                borderRadius: '6px',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontSize: '0.85rem',
                fontWeight: 500,
                transition: 'all 0.2s ease',
                opacity: saving ? 0.6 : 1
              }}
              onMouseEnter={(e) => !saving && (e.target.style.background = '#222')}
              onMouseLeave={(e) => !saving && (e.target.style.background = '#111')}
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={saving}
              style={{
                flex: 1,
                padding: '10px 12px',
                border: 'none',
                background: '#007AFF',
                color: '#fff',
                borderRadius: '6px',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontSize: '0.85rem',
                fontWeight: 500,
                transition: 'all 0.2s ease',
                opacity: saving ? 0.7 : 1
              }}
              onMouseEnter={(e) => !saving && (e.target.style.background = '#0052CC')}
              onMouseLeave={(e) => !saving && (e.target.style.background = '#007AFF')}
            >
              {saving ? 'Uploading...' : 'Save'}
            </button>
          </div>
        )}
      </div>

      {/* Loading overlay */}
      {saving && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 200,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            textAlign: 'center',
            color: '#fff'
          }}>
            <div style={{
              width: '50px',
              height: '50px',
              border: '3px solid #333',
              borderTop: '3px solid #007AFF',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem'
            }} />
            <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>Uploading...</p>
          </div>
        </div>
      )}
    </main>
  )
}

export default EditProfilePicture
