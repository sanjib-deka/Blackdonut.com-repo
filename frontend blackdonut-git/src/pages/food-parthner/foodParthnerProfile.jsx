import React, { useEffect, useState, useRef } from 'react'
import '../../styles/profile.css'
import '../../styles/logo-responsive.css'
import axios from 'axios'
import API_CONFIG from '../../utils/apiConfig'
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'

const FoodParthnerProfile = () => {
  const [profile, setProfile] = useState(null)
  const [videos, setVideos] = useState([])
  const [editingName, setEditingName] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showMenu, setShowMenu] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const menuRef = useRef(null)
  const menuButtonRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    // fetch owner profile (requires partner JWT cookie)
    setLoading(true)
    setError('')
    axios.get(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.FOOD_PARTNER.GET_ME}`, { withCredentials: true })
      .then(res => {
        const data = res.data.foodPartner
        setProfile(data)
        setVideos(data.foodItems || [])
        setEditingName(data.name || '')
      })
      .catch(err => {
        // if unauthorized, redirect to partner login
        if (err.response && err.response.status === 401) {
          navigate('/food-partner/login', { replace: true })
        } else {
          setError('Failed to load profile')
          // console.error('Profile fetch error:', err)
        }
      })
      .finally(() => setLoading(false))
  }, [navigate])

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const res = await axios.put(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.FOOD_PARTNER.UPDATE_ME}`, { name: editingName }, { withCredentials: true })
      setProfile(res.data.foodPartner)
    } catch (e) {
      // ignore for now
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    setShowLogoutModal(false)
    try {
      await axios.get(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.FOOD_PARTNER_LOGOUT}`, { withCredentials: true })
      navigate('/food-partner/login', { replace: true })
    } catch (e) {
      // console.error('logout error', e)
      navigate('/food-partner/login', { replace: true })
    }
  }

  const openMenu = () => {
    setShowMenu(true)
    setTimeout(() => {
      if (menuRef.current) {
        gsap.fromTo(menuRef.current, 
          { opacity: 0, y: -10 },
          { opacity: 1, y: 0, duration: 0.2, ease: 'power2.out' }
        )
      }
    }, 0)
  }

  const closeMenu = () => {
    if (menuRef.current) {
      gsap.to(menuRef.current, {
        opacity: 0,
        y: -10,
        duration: 0.15,
        ease: 'power2.in',
        onComplete: () => setShowMenu(false)
      })
    } else {
      setShowMenu(false)
    }
  }

  const toggleMenu = () => {
    if (showMenu) {
      closeMenu()
    } else {
      openMenu()
    }
  }

  const handleMenuClick = (action) => {
    closeMenu()
    if (action === 'edit') {
      navigate('/food-partner/edit')
    } else if (action === 'logout') {
      setShowLogoutModal(true)
    }
  }

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) && 
          menuButtonRef.current && !menuButtonRef.current.contains(e.target)) {
        closeMenu()
      }
    }

    if (showMenu) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showMenu])

  if (loading) {
    return (
      <main className="profile-page">
        <div style={{ padding: '2rem', textAlign: 'center' }}>Loading profile...</div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="profile-page">
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-danger)' }}>{error}</div>
      </main>
    )
  }

  if (!profile) {
    return (
      <main className="profile-page">
        <div style={{ padding: '2rem', textAlign: 'center' }}>No profile data</div>
      </main>
    )
  }

  return (
    <main className="profile-page">
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

      <section className="profile-header" style={{ padding: '16px 20px', gap: '12px' }}>
        {/* Owner dashboard text - positioned on left */}
        <p className="join-note" style={{ color: '#007AFF', position: 'absolute', top: '-8px', left: '20px', fontWeight: 700 }}>Owner Dashboard</p>

        {/* Three-dot menu button - positioned on right */}
        <div className="profile-left-action">
          {/* Three-dot menu button */}
          <button 
            ref={menuButtonRef}
            onClick={toggleMenu}
            style={{
              background: 'transparent',
              color: 'var(--color-text-secondary)',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1.2rem',
              padding: 0,
              marginTop: 4,
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            aria-label="Menu"
          >
            ⋮
          </button>

          {/* Menu popover */}
          {showMenu && (
            <div
              ref={menuRef}
              style={{
                position: 'absolute',
                top: '32px',
                right: '-8px',
                background: '#000',
                border: '1px solid #333',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                zIndex: 100,
                minWidth: '160px',
                overflow: 'hidden'
              }}
            >
              <button
                onClick={() => handleMenuClick('edit')}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '12px 16px',
                  border: 'none',
                  background: 'transparent',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = '#222'}
                onMouseLeave={(e) => e.target.style.background = 'transparent'}
              >
                Edit Profile
              </button>
              <div style={{ height: '1px', background: '#333' }} />
              <button
                onClick={() => handleMenuClick('logout')}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '12px 16px',
                  border: 'none',
                  background: 'transparent',
                  color: '#ff3b30',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = '#222'}
                onMouseLeave={(e) => e.target.style.background = 'transparent'}
              >
                Logout
              </button>
            </div>
          )}
        </div>
        {/* End of three-dot menu section */}

        <div className="profile-meta" style={{ gridTemplateColumns: '80px minmax(0, 1fr)', gap: '12px' }}>
          <img 
            className="profile-avatar"
            style={{ width: '80px', height: '80px' }}
            src={profile.profileImage && String(profile.profileImage).trim() 
              ? (String(profile.profileImage).startsWith('http') 
                  ? profile.profileImage 
                  : `${API_CONFIG.BASE_URL}/${profile.profileImage}`)
              : 'https://cdn.pixabay.com/photo/2016/08/08/09/17/avatar-1577909_1280.png'} 
            alt={profile.name || 'avatar'}
            onError={(e) => e.target.src = 'https://via.placeholder.com/120'}
          />

          <div className="profile-info">
            <div className="profile-business" style={{ 
              fontSize: 'clamp(1rem, 2.2vw, 1.12rem)', 
              color: '#1e6aff',
              fontWeight: 700
            }}>
              {editingName}
            </div>
            <p className="profile-address" style={{ marginBottom: '8px' }}>{profile.address || 'No address set'}</p>
            <p style={{ fontSize: '0.9rem', color: '#999', marginBottom: '4px' }}>
              <span style={{ color: '#666' }}>Owner: </span>
              {profile.contactName || 'No contact name set'}
            </p>
            <p style={{ fontSize: '0.9rem', color: '#999' }}>
              <span style={{ color: '#666' }}>Phone: </span>
              {profile.phone || 'No phone set'}
            </p>
          </div>
        </div>

        <div className="profile-stats" role="list" aria-label="Stats" style={{ gap: '12px' }}>
          <div className="profile-stat" role="listitem">
            <span className="profile-stat-label" style={{ fontSize: '0.8rem' }}>total meals</span>
            <span className="profile-stat-value">{profile.totalMeals || videos.length}</span>
          </div>
          <div className="profile-stat" role="listitem">
            <span className="profile-stat-label" style={{ fontSize: '0.8rem' }}>customer served</span>
            <span className="profile-stat-value">{profile.customerServed ?? 0}</span>
          </div>
        </div>
      </section>

      <section className="profile-grid" aria-label="Your videos">
        {(videos || []).map((v, index) => (
          <div 
            key={v._id || v.id} 
            className="profile-grid-item" 
            style={{ position: 'relative', cursor: 'pointer' }}
            onClick={() => navigate(`/food-partner/reelfeed/${index}`)}
          >
            <video
              className="profile-grid-video"
              style={{ objectFit: 'cover', width: '100%', height: '100%' }}
              src={v.video}
              muted
            />
          </div>
        ))}
      </section>

      {/* center-bottom + button */}
      <button
        onClick={() => navigate('/create-food')}
        aria-label="Create food"
        style={{
          position: 'fixed',
          left: '50%',
          transform: 'translateX(-50%)',
          bottom: 20,
          width: 60,
          height: 60,
          borderRadius: 30,
          background: 'var(--color-accent)',
          color: '#fff',
          border: 'none',
          boxShadow: '0 6px 18px rgba(0,0,0,0.18)',
          fontSize: 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 50
        }}
      >
        +
      </button>

      {/* Copyright Footer - Desktop Only */}
      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          fontSize: '0.75rem',
          color: '#666',
          zIndex: 5
        }}
        className="desktop-only"
      >
        {String.fromCharCode(...[169, 32, 50, 48, 50, 53, 32, 83, 97, 110, 106, 105, 98, 32, 75, 117, 109, 97, 114, 32, 68, 101, 107, 97, 32, 8212, 32, 65, 108, 108, 32, 82, 105, 103, 104, 116, 115, 32, 82, 101, 115, 101, 114, 118, 101, 100])}
      </div>

      {/* Logout confirmation modal */}
      {showLogoutModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200
          }}
          onClick={() => setShowLogoutModal(false)}
        >
          <div
            style={{
              background: '#000',
              borderRadius: '12px',
              padding: '28px 24px',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)',
              maxWidth: '360px',
              width: '90%',
              textAlign: 'center',
              border: '1px solid #333'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{
              fontSize: '1.2rem',
              fontWeight: 700,
              color: '#fff',
              marginBottom: '12px'
            }}>
              Confirm Logout
            </h2>
            <p style={{
              fontSize: '0.95rem',
              color: '#bbb',
              lineHeight: '1.5',
              marginBottom: '24px'
            }}>
              Are you sure you want to log out? Your credentials will be cleared and you will need to log in again.
            </p>
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center'
            }}>
              <button
                onClick={() => setShowLogoutModal(false)}
                style={{
                  padding: '10px 24px',
                  border: '1px solid #555',
                  background: '#111',
                  color: '#fff',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#222'
                  e.target.style.borderColor = '#666'
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#111'
                  e.target.style.borderColor = '#555'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                style={{
                  padding: '10px 24px',
                  border: 'none',
                  background: '#ff3b30',
                  color: '#fff',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#e60f23'
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#ff3b30'
                }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default FoodParthnerProfile
