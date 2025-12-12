import React, { useEffect, useState } from 'react'
import axios from 'axios'
import API_CONFIG from '../../utils/apiConfig'
import { useNavigate, useParams } from 'react-router-dom'
import FoodPartnerReelFeed from '../../components/FoodPartnerReelFeed'

const FoodPartnerReelfeed = () => {
  const { index } = useParams()
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    // Fetch food partner's videos with authorized token
    fetchVideos()
  }, [])

  const fetchVideos = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await axios.get(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.FOOD_PARTNER.GET_ME}`, { 
        withCredentials: true 
      })
      setVideos(res.data.foodPartner.foodItems || [])
    } catch (err) {
      console.error('Fetch videos error:', err)
      if (err.response && err.response.status === 401) {
        navigate('/food-partner/login', { replace: true })
      } else {
        setError('Failed to load videos')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteVideo = async (id) => {
    try {
      await axios.delete(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.FOOD.DELETE(id)}`, { 
        withCredentials: true 
      })
      setVideos(prev => prev.filter(v => (v._id || v.id) !== id))
    } catch (err) {
      console.error('Delete video error:', err)
      if (err.response && err.response.status === 401) {
        navigate('/food-partner/login', { replace: true })
      } else {
        setError('Failed to delete video')
      }
    }
  }

  if (loading) {
    return (
      <main className="reels-page" style={{ padding: '2rem', textAlign: 'center' }}>
        Loading your videos...
      </main>
    )
  }

  if (error) {
    return (
      <main className="reels-page" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-danger)' }}>
        {error}
      </main>
    )
  }

  return (
    <main>
      <FoodPartnerReelFeed
        items={index !== undefined ? [videos[parseInt(index) || 0]].filter(Boolean) : videos}
        onDelete={handleDeleteVideo}
        emptyMessage="You haven't uploaded any videos yet."
      />
      
      {/* Back button to profile */}
      <button
        onClick={() => navigate('/food-partner/profile')}
        aria-label="Back to profile"
        style={{
          position: 'fixed',
          left: 20,
          top: 20,
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: '#1e6aff',
          color: '#fff',
          border: 'none',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
          fontSize: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 40
        }}
      >
        ←
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
    </main>
  )
}

export default FoodPartnerReelfeed
