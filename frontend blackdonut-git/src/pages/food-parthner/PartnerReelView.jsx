import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import API_CONFIG from '../../utils/apiConfig'
import ReelFeed from '../../components/ReelFeed'

const PartnerReelView = () => {
  const { id, index } = useParams()
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    fetchPartnerVideos()
  }, [id])

  const fetchPartnerVideos = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await axios.get(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.FOOD_PARTNER.GET_BY_ID(id)}`, { 
        withCredentials: true 
      })
      setVideos(res.data.foodPartner.foodItems || [])
    } catch (err) {
      // console.error('Fetch partner videos error:', err)
      setError('Failed to load videos')
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async (item) => {
    try {
      const response = await axios.post(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.FOOD.LIKE}`, 
        { foodId: item._id }, 
        { withCredentials: true }
      )
      if (response.data.like) {
        setVideos((prev) => prev.map((v) => {
          if (v._id !== item._id) return v
          const current = (v.likeCount ?? v.likesCount ?? v.likes ?? 0)
          const next = current + 1
          return { ...v, likeCount: next, likesCount: next, isLiked: true }
        }))
      } else {
        setVideos((prev) => prev.map((v) => {
          if (v._id !== item._id) return v
          const current = (v.likeCount ?? v.likesCount ?? v.likes ?? 0)
          const next = Math.max(0, current - 1)
          return { ...v, likeCount: next, likesCount: next, isLiked: false }
        }))
      }
    } catch (err) {
      // console.error('Like error:', err)
    }
  }

  const handleSave = async (item) => {
    try {
      const response = await axios.post(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.FOOD.SAVE}`, 
        { foodId: item._id }, 
        { withCredentials: true }
      )
      if (response.data.save) {
        setVideos((prev) => prev.map((v) => {
          if (v._id !== item._id) return v
          const current = (v.savesCount ?? v.bookmarks ?? v.saves ?? 0)
          const next = current + 1
          return { ...v, savesCount: next, bookmarks: next, saves: next, isSaved: true }
        }))
      } else {
        setVideos((prev) => prev.map((v) => {
          if (v._id !== item._id) return v
          const current = (v.savesCount ?? v.bookmarks ?? v.saves ?? 0)
          const next = Math.max(0, current - 1)
          return { ...v, savesCount: next, bookmarks: next, saves: next, isSaved: false }
        }))
      }
    } catch (err) {
      // console.error('Save error:', err)
    }
  }

  if (loading) {
    return (
      <main className="reels-page" style={{ padding: '2rem', textAlign: 'center' }}>
        Loading videos...
      </main>
    )
  }

  if (error) {
    return (
      <main className="reels-page" style={{ padding: '2rem', textAlign: 'center', color: '#ff3b30' }}>
        {error}
      </main>
    )
  }

  if (!videos || videos.length === 0) {
    return (
      <main className="reels-page" style={{ padding: '2rem', textAlign: 'center' }}>
        No videos available
      </main>
    )
  }

  return (
    <main>
      <ReelFeed
        items={videos}
        initialIndex={parseInt(index) || 0}
        noShuffle={true}
        onLike={handleLike}
        onSave={handleSave}
        emptyMessage="No videos from this partner."
      />
      
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

export default PartnerReelView
