import React, { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import gsap from 'gsap'
import API_CONFIG from '../utils/apiConfig'
import ShinyText from './ShinyText'

// Add spin animation styles
const spinStyles = `
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`

// Inject styles
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = spinStyles
  document.head.appendChild(style)
}

// Lightweight persistence using sessionStorage to avoid re-renders
const SESSION_KEY = 'foodPartnerReelState'
const readSavedReel = () => {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : { id: null, time: 0 }
  } catch (e) {
    return { id: null, time: 0 }
  }
}
const writeSavedReel = (id, time) => {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ id, time }))
  } catch (e) {}
}

const FoodPartnerReelFeed = ({ items = [], onDelete, onShowEngagement, emptyMessage = 'No videos yet.', initialIndex = 0 }) => {
  const videoRefs = useRef(new Map())
  const feedRef = useRef(null)
  const [isMuted, setIsMuted] = useState(true)
  const [centerOverlay, setCenterOverlay] = useState({ id: null, visible: false, type: '' })
  const overlayTimeoutRef = useRef(null)
  const currentVisibleRef = useRef(null)
  const [openMenuId, setOpenMenuId] = useState(null)
  const menuRefs = useRef(new Map())
  const [deleteWarningId, setDeleteWarningId] = useState(null)
  const [openPopupId, setOpenPopupId] = useState(null)
  const popupRefs = useRef(new Map())
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editSaving, setEditSaving] = useState(false)

  // Comment engagement state
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [activeCommentsFoodId, setActiveCommentsFoodId] = useState(null)
  const [comments, setComments] = useState([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [engagementStats, setEngagementStats] = useState({ likes: 0, comments: 0, saves: 0 })
  const [replyingToId, setReplyingToId] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [submittingReply, setSubmittingReply] = useState(false)
  const [pinnedCommentId, setPinnedCommentId] = useState(null)
  const [partnerCommentText, setPartnerCommentText] = useState('')
  const [submittingPartnerComment, setSubmittingPartnerComment] = useState(false)

  useEffect(() => {
    // observe the currently rendered list
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
            currentVisibleRef.current = entry.target.dataset.reelId
            entry.target.play().catch(() => {})
          } else {
            entry.target.pause()
          }
        })
      },
      { threshold: [0, 0.25, 0.6, 0.9, 1] }
    )

    videoRefs.current.forEach((vid) => observer.observe(vid))
    return () => observer.disconnect()
  }, [items])

  // Restore scroll position and playback time when items mount
  useEffect(() => {
    if (!feedRef.current) return
    if (!items || !items.length) return

    const saved = readSavedReel()
    if (!saved || !saved.id) return

    const vid = videoRefs.current.get(saved.id)
    if (vid) {
      setTimeout(() => {
        vid.scrollIntoView({ behavior: 'auto', block: 'center' })
        vid.currentTime = saved.time || 0
        vid.play().catch(() => {})
      }, 100)
    }
  }, [items])

  useEffect(() => {
    if (initialIndex > 0 && items && items[initialIndex]) {
      const vidAtIndex = Array.from(videoRefs.current.values())[initialIndex]
      if (vidAtIndex) {
        setTimeout(() => {
          vidAtIndex.scrollIntoView({ behavior: 'auto', block: 'center' })
          vidAtIndex.play().catch(() => {})
        }, 100)
      }
    }
  }, [initialIndex, items])

  const setVideoRef = (id) => (el) => {
    if (!el) return
    el.dataset && (el.dataset.reelId = id)
    videoRefs.current.set(id, el)
  }

  const handleMuteToggle = () => {
    const newMutedState = !isMuted
    setIsMuted(newMutedState)

    // Apply mute state to all videos
    videoRefs.current.forEach((video) => {
      video.muted = newMutedState
    })
  }

  // Toggle play/pause for a specific video by id
  const handleCenterToggle = (id) => {
    const vid = videoRefs.current.get(id)
    if (!vid) return
    try {
      if (vid.paused) {
        vid.play().catch(() => {})
        setCenterOverlay({ id, visible: true, type: 'play' })
      } else {
        vid.pause()
        setCenterOverlay({ id, visible: true, type: 'pause' })
      }

      // Hide overlay after 0.6s
      if (overlayTimeoutRef.current) clearTimeout(overlayTimeoutRef.current)
      overlayTimeoutRef.current = setTimeout(() => {
        setCenterOverlay({ id: null, visible: false, type: '' })
      }, 600)
    } catch (e) {
      // console.error('Toggle play/pause error:', e)
    }
  }

  // Determine which reel is currently centered in the feed and save its id/time
  const saveCurrentVisibleReel = () => {
    try {
      if (currentVisibleRef.current) {
        const vid = videoRefs.current.get(currentVisibleRef.current)
        if (vid) writeSavedReel(currentVisibleRef.current, vid.currentTime || 0)
      }
    } catch (e) {
      // console.error('Save reel error:', e)
    }
  }

  const toggleMenu = (id) => {
    if (openMenuId === id) {
      closeMenu()
    } else {
      setOpenMenuId(id)
      setTimeout(() => {
        const menuEl = menuRefs.current.get(id)
        if (menuEl) {
          gsap.fromTo(
            menuEl,
            { opacity: 0, y: -10 },
            { opacity: 1, y: 0, duration: 0.2, ease: 'power2.out' }
          )
        }
      }, 0)
    }
  }

  const closeMenu = () => {
    if (openMenuId && menuRefs.current.get(openMenuId)) {
      gsap.to(menuRefs.current.get(openMenuId), {
        opacity: 0,
        y: -10,
        duration: 0.15,
        ease: 'power2.in',
        onComplete: () => setOpenMenuId(null)
      })
    } else {
      setOpenMenuId(null)
    }
  }

  const handleDeleteClick = (id) => {
    closeMenu()
    setDeleteWarningId(id)
  }

  const confirmDelete = async (id) => {
    setDeleteWarningId(null)
    if (onDelete) {
      await onDelete(id)
    }
  }

  const handleEditClick = (item) => {
    setOpenMenuId(null)
    setEditingId(item._id)
    setEditName(item.name || '')
    setEditDescription(item.description || '')
  }

  const handleEditSave = async () => {
    if (!editingId) return
    setEditSaving(true)
    try {
      // console.log('Editing food ID:', editingId)
      // console.log('New name:', editName)
      // console.log('New description:', editDescription)
      
      // Update name
      if (editName.trim()) {
        const nameRes = await axios.put(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.FOOD.UPDATE_NAME(editingId)}`, 
          { name: editName.trim() },
          { withCredentials: true }
        )
        // console.log('Name update response:', nameRes.data)
      }
      // Update description
      const descRes = await axios.put(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.FOOD.UPDATE_DESCRIPTION(editingId)}`,
        { description: editDescription },
        { withCredentials: true }
      )
      // console.log('Description update response:', descRes.data)
      
      setEditingId(null)
      setEditName('')
      setEditDescription('')
      // Reload or update UI
      window.location.reload()
    } catch (err) {
      // console.error('Edit save error:', err)
      // console.error('Error response:', err.response?.data)
      alert('Failed to save changes: ' + (err.response?.data?.message || err.message))
    } finally {
      setEditSaving(false)
    }
  }

  const openPopup = async (id) => {
    setOpenPopupId(id)
    try {
      setTimeout(() => {
        const popupEl = popupRefs.current.get(id)
        if (popupEl) {
          gsap.fromTo(
            popupEl,
            { opacity: 0, y: 10, scale: 0.95 },
            { opacity: 1, y: 0, scale: 1, duration: 0.2, ease: 'power2.out' }
          )
        }
      }, 0)
    } catch (e) {
      // console.error('Open popup error:', e)
    }
  }

  const closePopup = async (id) => {
    try {
      const popupEl = popupRefs.current.get(id)
      if (popupEl) {
        gsap.to(popupEl, {
          opacity: 0,
          y: 10,
          scale: 0.95,
          duration: 0.15,
          ease: 'power2.in',
          onComplete: () => setOpenPopupId(null)
        })
      }
    } catch (e) {
      // console.error('Close popup error:', e)
    }
    setOpenPopupId((cur) => (cur === id ? null : cur))
  }

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (openMenuId) {
        const menuEl = menuRefs.current.get(openMenuId)
        const allMenuButtons = document.querySelectorAll('.reel-action')
        
        // Check if click is on menu or any menu button
        let clickedOnMenu = menuEl && menuEl.contains(e.target)
        let clickedOnButton = Array.from(allMenuButtons).some(btn => btn.contains(e.target))
        
        // Only close if clicked outside menu AND not on any menu button
        if (!clickedOnMenu && !clickedOnButton) {
          closeMenu()
        }
      }
    }

    if (openMenuId) {
      setTimeout(() => {
        document.addEventListener('click', handleClickOutside)
      }, 0)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [openMenuId])

  // ============== COMMENT ENGAGEMENT FUNCTIONS ==============

  // Open comments and fetch engagement stats + actual comments
  const openComments = async (foodId) => {
    // console.log('========== COMMENT BUTTON CLICKED ==========')
    // console.log('🔵 openComments called with foodId:', foodId)
    
    setActiveCommentsFoodId(foodId)
    setCommentsOpen(true)
    setLoadingComments(true)
    setReplyText('')
    setReplyingToId(null)
    
    try {
      // Fetch engagement stats
      const engagementEndpoint = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.COMMENTS.ENGAGEMENT(foodId)}`
      // console.log('🔵 Fetching engagement stats from:', engagementEndpoint)
      
      const engagementResponse = await axios.get(engagementEndpoint, { withCredentials: true })
      // console.log('✅ Engagement stats from API:', engagementResponse.data)
      
      // Fetch actual comments
      const commentsEndpoint = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.COMMENTS.GET(foodId)}`
      // console.log('🔵 Fetching comments from:', commentsEndpoint)
      
      const commentsResponse = await axios.get(commentsEndpoint, { withCredentials: true })
      const fetchedComments = commentsResponse.data.comments || []
      // console.log('✅ Comments loaded:', fetchedComments.length)
      setComments(fetchedComments)
      
      // Use actual comment count from fetched comments array
      const actualStats = {
        likes: engagementResponse.data.stats?.likes || 0,
        comments: fetchedComments.length,  // Use real count from array
        saves: engagementResponse.data.stats?.saves || 0
      }
      
      // console.log('📊 Final stats being displayed:', actualStats)
      setEngagementStats(actualStats)
    } catch (err) {
      // console.error('🔴 Error fetching data:', err)
      // console.error('   Error details:', err.response?.data || err.message)
      setEngagementStats({ likes: 0, comments: 0, saves: 0 })
      setComments([])
    } finally {
      setLoadingComments(false)
      console.log('========== OPENCOMMENTS COMPLETE ==========')
    }
  }

  // Refresh engagement stats
  const refreshEngagementStats = async () => {
    if (!activeCommentsFoodId) return
    
    console.log('🔄 Refreshing engagement stats for foodId:', activeCommentsFoodId)
    setLoadingComments(true)
    
    try {
      // Fetch fresh engagement stats
      const engagementEndpoint = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.COMMENTS.ENGAGEMENT(activeCommentsFoodId)}`
      const engagementResponse = await axios.get(engagementEndpoint, { withCredentials: true })
      
      // Fetch fresh comments
      const commentsEndpoint = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.COMMENTS.GET(activeCommentsFoodId)}`
      const commentsResponse = await axios.get(commentsEndpoint, { withCredentials: true })
      const fetchedComments = commentsResponse.data.comments || []
      
      setComments(fetchedComments)
      
      const refreshedStats = {
        likes: engagementResponse.data.stats?.likes || 0,
        comments: fetchedComments.length,
        saves: engagementResponse.data.stats?.saves || 0
      }
      
      console.log('✅ Stats refreshed:', refreshedStats)
      setEngagementStats(refreshedStats)
    } catch (err) {
      console.error('🔴 Error refreshing stats:', err)
    } finally {
      setLoadingComments(false)
    }
  }

  // Close comments
  const closeComments = () => {
    setCommentsOpen(false)
    setActiveCommentsFoodId(null)
    setComments([])
    setReplyText('')
    setReplyingToId(null)
    setEngagementStats({ likes: 0, comments: 0, saves: 0 })
  }

  // Pin/Unpin a comment
  const togglePinComment = async (commentId) => {
    if (!activeCommentsFoodId) return
    
    try {
      const endpoint = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.COMMENTS.PIN(commentId)}`
      console.log('📌 Pinning comment:', commentId)
      
      const response = await axios.put(endpoint, {}, { withCredentials: true })
      console.log('✅ Comment pinned/unpinned:', response.data)
      
      if (response.data.comment?.isPinned) {
        setPinnedCommentId(commentId)
      } else {
        setPinnedCommentId(null)
      }
    } catch (err) {
      console.error('🔴 Error toggling pin:', err)
      alert('Failed to pin comment')
    }
  }

  // Reply to a comment
  const submitReply = async () => {
    if (!replyText.trim() || !replyingToId) return
    
    setSubmittingReply(true)
    try {
      const endpoint = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.COMMENTS.REPLY(replyingToId)}`
      console.log('💬 Replying to comment:', replyingToId)
      
      const response = await axios.post(
        endpoint,
        { text: replyText },
        { withCredentials: true }
      )
      
      console.log('✅ Reply submitted:', response.data)
      
      // Update the comment with the reply
      setComments((prev) =>
        prev.map((c) =>
          c._id === replyingToId
            ? { ...c, reply: response.data.comment?.reply }
            : c
        )
      )
      
      setReplyText('')
      setReplyingToId(null)
    } catch (err) {
      console.error('🔴 Error submitting reply:', err)
      alert('Failed to submit reply')
    } finally {
      setSubmittingReply(false)
    }
  }

  // Delete a comment
  const deleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return
    
    try {
      const endpoint = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.COMMENTS.DELETE(commentId)}`
      console.log('🗑️ Deleting comment:', commentId)
      
      await axios.delete(endpoint, { withCredentials: true })
      console.log('✅ Comment deleted')
      
      setComments((prev) => prev.filter((c) => c._id !== commentId))
    } catch (err) {
      console.error('🔴 Error deleting comment:', err)
      alert('Failed to delete comment')
    }
  }

  // Partner: Submit a comment to a food item
  const submitPartnerComment = async () => {
    if (!partnerCommentText.trim() || !activeCommentsFoodId) return
    
    setSubmittingPartnerComment(true)
    try {
      const endpoint = `${API_CONFIG.BASE_URL}/api/comments/add-by-partner`
      console.log('💬 Partner submitting comment to food:', activeCommentsFoodId)
      
      const response = await axios.post(
        endpoint,
        { foodId: activeCommentsFoodId, text: partnerCommentText },
        { withCredentials: true }
      )
      
      console.log('✅ Partner comment submitted:', response.data)
      
      // Add the new comment to the list
      setComments((prev) => [...prev, response.data.comment])
      
      // Update engagement stats
      setEngagementStats((prev) => ({
        ...prev,
        comments: prev.comments + 1
      }))
      
      setPartnerCommentText('')
    } catch (err) {
      console.error('🔴 Error submitting partner comment:', err)
      alert('Failed to submit comment')
    } finally {
      setSubmittingPartnerComment(false)
    }
  }

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (openMenuId) {
        const menuEl = menuRefs.current.get(openMenuId)
        const allMenuButtons = document.querySelectorAll('.reel-action')
        
        // Check if click is on menu or any menu button
        let clickedOnMenu = menuEl && menuEl.contains(e.target)
        let clickedOnButton = Array.from(allMenuButtons).some(btn => btn.contains(e.target))
        
        // Only close if clicked outside menu AND not on any menu button
        if (!clickedOnMenu && !clickedOnButton) {
          closeMenu()
        }
      }
    }

    if (openMenuId) {
      setTimeout(() => {
        document.addEventListener('click', handleClickOutside)
      }, 0)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [openMenuId])

  return (
    <div className="reels-page">
      <div className="reels-feed" role="list" ref={feedRef}>
        {items.length === 0 && (
          <div className="empty-state">
            <ShinyText text={emptyMessage} speed={5} className="empty-message-shiny" />
          </div>
        )}

        {items.map((item) => (
          <section key={item._id} className="reel" role="listitem" style={{ position: 'relative' }}>
            <video
              ref={setVideoRef(item._id)}
              className="reel-video"
              src={item.video}
              muted={isMuted}
              playsInline
              loop
              preload="metadata"
            />

            <div className="reel-overlay">
              <div className="reel-overlay-gradient" aria-hidden="true" />

              {/* Invisible center tap area: tapping this region toggles play/pause */}
              <div
                onClick={() => handleCenterToggle(item._id)}
                role="button"
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  left: '20%',
                  right: '20%',
                  top: '20%',
                  bottom: '40%',
                  pointerEvents: 'auto',
                  background: 'transparent',
                  zIndex: 1,
                }}
              />

              {/* Transient centered overlay icon (non-interactive) */}
              {centerOverlay.visible && centerOverlay.id === item._id && (
                <div
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 2,
                    pointerEvents: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 72,
                    height: 72,
                    borderRadius: 36,
                    background: 'rgba(0,0,0,0.45)',
                    color: '#fff'
                  }}
                >
                  {centerOverlay.type === 'pause' ? (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="6" y="5" width="4" height="14" rx="1" />
                      <rect x="14" y="5" width="4" height="14" rx="1" />
                    </svg>
                  ) : (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  )}
                </div>
              )}

              {/* Action buttons - Mute and 3-dot menu */}
              <div className="reel-actions">
                <div className="reel-action-group" style={{ order: '-1' }}>
                  <button
                    onClick={handleMuteToggle}
                    className="reel-action mute-toggle"
                    aria-label={isMuted ? 'Unmute sound' : 'Mute sound'}
                  >
                    {isMuted ? (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                        <line x1="23" y1="9" x2="17" y2="15" />
                        <line x1="17" y1="9" x2="23" y2="15" />
                      </svg>
                    ) : (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                      </svg>
                    )}
                  </button>
                </div>

                {/* Engagement button */}
                <div className="reel-action-group">
                  <button 
                    className="reel-action" 
                    aria-label="Engagement"
                    style={{
                      position: 'relative',
                      zIndex: 10,
                      pointerEvents: 'auto',
                      touchAction: 'manipulation',
                      background: 'transparent',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer'
                    }}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      console.log('📊 ENGAGEMENT BUTTON CLICKED! Item ID:', item._id)
                      openComments(item._id)
                    }}
                    onTouchEnd={(e) => {
                      if (window.innerWidth <= 768) {
                        console.log('📱 MOBILE TOUCH END on engagement button')
                        e.preventDefault()
                        e.stopPropagation()
                        openComments(item._id)
                      }
                    }}
                  >
                    <img 
                      src="/user-engagement.png" 
                      alt="Engagement"
                      style={{
                        width: '22px',
                        height: '22px',
                        objectFit: 'contain'
                      }}
                    />
                  </button>
                </div>

                {/* 3-dot menu button */}
                <div className="reel-action-group" style={{ position: 'relative' }}>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      console.log('🔘 MENU BUTTON CLICKED on item:', item._id)
                      toggleMenu(item._id)
                    }}
                    onTouchEnd={(e) => {
                      if (window.innerWidth <= 768) {
                        console.log('📱 MOBILE TOUCH END on menu button')
                        e.preventDefault()
                        e.stopPropagation()
                        toggleMenu(item._id)
                      }
                    }}
                    className="reel-action"
                    aria-label="Menu"
                    style={{
                      position: 'relative',
                      zIndex: 10,
                      pointerEvents: 'auto',
                      touchAction: 'manipulation'
                    }}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ pointerEvents: 'none' }}>
                      <circle cx="12" cy="5" r="1" />
                      <circle cx="12" cy="12" r="1" />
                      <circle cx="12" cy="19" r="1" />
                    </svg>
                  </button>

                  {/* Menu popover */}
                  {openMenuId === item._id && (
                    <div
                      ref={(el) => {
                        if (el) menuRefs.current.set(item._id, el)
                        else menuRefs.current.delete(item._id)
                      }}
                      style={{
                        position: 'absolute',
                        bottom: '56px',
                        right: '8px',
                        background: '#000',
                        border: '1px solid #333',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                        zIndex: 40,
                        minWidth: '140px',
                        overflow: 'hidden'
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditClick(item)
                        }}
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
                        Edit
                      </button>
                      <div style={{ height: '1px', background: '#333' }} />
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          handleDeleteClick(item._id)
                        }}
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
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Video name */}
              <div
                className="reel-content"
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6, width: '100%' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
                  <div className="reel-name" style={{ fontWeight: 600 }}>
                    {item.name ?? item.title ?? 'Untitled'}
                  </div>

                  <div style={{ marginLeft: 8 }}>
                    <button
                      aria-label="More"
                      title="More"
                      onClick={(e) => {
                        e.stopPropagation()
                        openPopup(item._id)
                      }}
                      style={{
                        width: 34,
                        height: 28,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#000',
                        border: 'none',
                        color: '#fff',
                        cursor: 'pointer',
                        padding: 0,
                        borderRadius: 8,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.4)'
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="5" r="1.4" />
                        <circle cx="12" cy="12" r="1.4" />
                        <circle cx="12" cy="19" r="1.4" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Description popup */}
                {openPopupId === item._id && (
                  <div
                    ref={(el) => {
                      if (el) popupRefs.current.set(item._id, el)
                      else popupRefs.current.delete(item._id)
                    }}
                    style={{
                      position: 'absolute',
                      left: 16,
                      right: 16,
                      bottom: 56,
                      padding: '14px 16px',
                      background: '#000',
                      color: '#fff',
                      borderRadius: 8,
                      boxShadow: '0 12px 30px rgba(0,0,0,0.6)',
                      transformOrigin: 'center bottom',
                      zIndex: 40,
                      display: 'block'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div style={{ marginBottom: 8, fontSize: 14, lineHeight: '1.2', fontWeight: 700 }}>
                      {`Description of ${item.name ?? item.title ?? 'food'}`}
                    </div>
                    <div style={{ fontSize: 13, lineHeight: '1.4', color: '#eee', maxHeight: '160px', overflowY: 'auto' }}>
                      {item.description ?? 'No description'}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          closePopup(item._id)
                        }}
                        style={{
                          background: 'transparent',
                          color: '#fff',
                          border: '1px solid rgba(255,255,255,0.08)',
                          padding: '6px 10px',
                          borderRadius: 6,
                          cursor: 'pointer'
                        }}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* COMMENTS SECTION - DESKTOP */}
      {commentsOpen && window.innerWidth > 768 && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.4)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'flex-end',
            overflow: 'hidden'
          }}
          onClick={closeComments}
        >
          <div
            style={{
              background: '#000',
              width: '600px',
              height: '70vh',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.3)',
              animation: 'slideUp 0.3s ease-out',
              margin: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with engagement stats */}
            <div
              style={{
                padding: '16px 16px 12px',
                borderBottom: '1px solid #333',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <h3 style={{ margin: '0 0 8px 0', color: '#fff', fontSize: '18px', fontWeight: '600' }}>
                  Engagement
                </h3>
                <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#999' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#ff4757" stroke="none">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                    <span>{engagementStats.likes || 0}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
                    </svg>
                    <span>{engagementStats.comments || 0}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" />
                    </svg>
                    <span>{engagementStats.saves || 0}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  onClick={refreshEngagementStats}
                  disabled={loadingComments}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: loadingComments ? '#666' : '#999',
                    fontSize: '18px',
                    cursor: loadingComments ? 'not-allowed' : 'pointer',
                    padding: '4px 8px',
                    transition: 'all 0.3s',
                    opacity: loadingComments ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Refresh stats"
                >
                  <svg 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    style={{
                      animation: loadingComments ? 'spin 1s linear infinite' : 'none'
                    }}
                  >
                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                    <path d="M21 3v5h-5" />
                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                    <path d="M3 21v-5h5" />
                  </svg>
                </button>
                <button
                  onClick={closeComments}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#999',
                    fontSize: '24px',
                    cursor: 'pointer',
                    padding: '4px 8px'
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Comments List */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                overflowX: 'hidden',
                padding: '8px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                minHeight: 0
              }}
            >
              {loadingComments ? (
                <div style={{ color: '#999', textAlign: 'center', padding: '20px' }}>
                  Loading engagement data...
                </div>
              ) : comments.length === 0 ? (
                <div style={{ color: '#999', textAlign: 'center', padding: '20px' }}>
                  No comments yet. Manage engagement here!
                </div>
              ) : (
                comments.map((comment) => (
                  <div
                    key={comment._id}
                    style={{
                      background: pinnedCommentId === comment._id ? '#1a2a4a' : '#111',
                      padding: '8px',
                      borderRadius: '6px',
                      border: pinnedCommentId === comment._id ? '1px solid #1e6aff' : '1px solid #333'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        gap: '6px',
                        alignItems: 'flex-start',
                        marginBottom: '4px'
                      }}
                    >
                      {comment.user?.profileImage && (
                        <img
                          src={comment.user.profileImage}
                          alt={comment.user.fullName}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            flexShrink: 0
                          }}
                        />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#fff',
                            marginBottom: '2px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>
                              {comment.user?.isPartner 
                                ? (comment.user?.businessName || comment.user?.fullName || comment.user?.name || 'Partner')
                                : (comment.user?.fullName || comment.user?.name || 'User')
                              }
                            </span>
                            {comment.user?.isPartner && (
                              <span style={{ color: '#1e6aff', fontSize: '10px', background: '#1a2a4a', padding: '2px 5px', borderRadius: '2px', fontWeight: '600', whiteSpace: 'nowrap' }}>Food Partner</span>
                            )}
                          </div>
                        </div>
                        <div
                          style={{
                            fontSize: '13px',
                            color: '#ddd',
                            lineHeight: '1.4',
                            wordBreak: 'break-word'
                          }}
                        >
                          {comment.text}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <button
                        onClick={() => togglePinComment(comment._id)}
                        style={{
                          padding: '6px 12px',
                          background: pinnedCommentId === comment._id ? '#1e6aff' : '#222',
                          border: 'none',
                          color: '#fff',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px'
                        }}
                        title="Pin/Unpin comment"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
                        </svg>
                        {pinnedCommentId === comment._id ? 'Pinned' : 'Pin'}
                      </button>
                      <button
                        onClick={() => setReplyingToId(replyingToId === comment._id ? null : comment._id)}
                        style={{
                          padding: '6px 12px',
                          background: replyingToId === comment._id ? '#1e6aff' : '#222',
                          border: 'none',
                          color: '#fff',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px'
                        }}
                        title="Reply to comment"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
                        </svg>
                        Reply
                      </button>
                      <button
                        onClick={() => deleteComment(comment._id)}
                        style={{
                          padding: '6px 12px',
                          background: '#333',
                          border: 'none',
                          color: '#ff6b6b',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          transition: 'background 0.2s'
                        }}
                        title="Delete comment"
                        onMouseEnter={(e) => e.target.style.background = '#444'}
                        onMouseLeave={(e) => e.target.style.background = '#333'}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          <line x1="10" y1="11" x2="10" y2="17"></line>
                          <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                        Delete
                      </button>
                    </div>

                    {/* Reply input */}
                    {replyingToId === comment._id && (
                      <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px solid #333' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <input
                            type="text"
                            placeholder="Write a reply..."
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                submitReply()
                              }
                            }}
                            disabled={submittingReply}
                            style={{
                              flex: 1,
                              padding: '6px 8px',
                              background: '#111',
                              border: '1px solid #333',
                              color: '#fff',
                              borderRadius: '3px',
                              fontSize: '11px',
                              outline: 'none'
                            }}
                          />
                          <button
                            onClick={submitReply}
                            disabled={!replyText.trim() || submittingReply}
                            style={{
                              padding: '6px 10px',
                              background: replyText.trim() ? '#1e6aff' : '#666',
                              border: 'none',
                              color: '#fff',
                              borderRadius: '3px',
                              cursor: replyText.trim() ? 'pointer' : 'not-allowed',
                              fontSize: '11px',
                              fontWeight: '500',
                              flexShrink: 0
                            }}
                          >
                            {submittingReply ? '...' : 'Send'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Partner Reply */}
                    {comment.reply && (
                      <div
                        style={{
                          background: '#1a2a4a',
                          borderLeft: '3px solid #1e6aff',
                          padding: '8px',
                          borderRadius: '4px',
                          marginTop: '6px',
                          fontSize: '11px',
                          border: '1px solid #1e6aff',
                          position: 'relative'
                        }}
                      >
                        <div style={{ position: 'absolute', top: '4px', right: '6px', fontSize: '9px', background: '#1e6aff', color: '#fff', padding: '2px 6px', borderRadius: '2px', fontWeight: '600' }}>
                          🍽️ Partner
                        </div>
                        <div style={{ fontWeight: '600', color: '#1e6aff', marginBottom: '2px', marginRight: '50px', fontSize: '11px' }}>
                          {comment.reply.author?.businessName || comment.reply.author?.fullName || comment.reply.author?.name || 'Store'}
                        </div>
                        <div style={{ color: '#ddd', lineHeight: '1.3', fontSize: '11px' }}>{comment.reply.text}</div>
                        {comment.reply.createdAt && (
                          <div style={{ fontSize: '9px', color: '#999', marginTop: '4px' }}>
                            {new Date(comment.reply.createdAt).toLocaleDateString()} {new Date(comment.reply.createdAt).toLocaleTimeString()}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Partner Comment Input */}
            <div style={{ borderTop: '1px solid #333', padding: '8px 12px', background: '#0a0a0a' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="text"
                  placeholder="Add a comment..."
                  value={partnerCommentText}
                  onChange={(e) => setPartnerCommentText(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      submitPartnerComment()
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: '6px 8px',
                    background: '#111',
                    border: '1px solid #333',
                    borderRadius: '3px',
                    color: '#fff',
                    fontSize: '11px',
                    fontFamily: 'inherit'
                  }}
                />
                <button
                  onClick={submitPartnerComment}
                  disabled={!partnerCommentText.trim() || submittingPartnerComment}
                  style={{
                    padding: '6px 12px',
                    background: !partnerCommentText.trim() ? '#333' : '#1e6aff',
                    border: 'none',
                    color: '#fff',
                    borderRadius: '3px',
                    fontSize: '11px',
                    cursor: !partnerCommentText.trim() ? 'not-allowed' : 'pointer',
                    fontWeight: '500',
                    opacity: !partnerCommentText.trim() ? 0.5 : 1
                  }}
                >
                  {submittingPartnerComment ? '...' : 'Send'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* COMMENTS SECTION - MOBILE */}
      {commentsOpen && window.innerWidth <= 768 && (
        <>
          {/* Backdrop */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.6)',
              zIndex: 99,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={closeComments}
          />
          
          {/* Pop-up comment section */}
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: '#000',
              borderRadius: '12px',
              border: '1px solid #333',
              zIndex: 100,
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '70vh',
              width: '90%',
              maxWidth: '420px',
              animation: 'slideUp 0.3s ease-out',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.8)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid #333',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexShrink: 0
              }}
            >
              <div>
                <h3 style={{ margin: '0 0 6px 0', color: '#fff', fontSize: '16px', fontWeight: '600' }}>
                  Engagement
                </h3>
                <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: '#999' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#ff4757" stroke="none">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                    <span>{engagementStats.likes || 0}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
                    </svg>
                    <span>{engagementStats.comments || 0}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" />
                    </svg>
                    <span>{engagementStats.saves || 0}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={refreshEngagementStats}
                  disabled={loadingComments}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: loadingComments ? '#666' : '#999',
                    cursor: loadingComments ? 'not-allowed' : 'pointer',
                    padding: '4px 6px',
                    opacity: loadingComments ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Refresh"
                >
                  <svg 
                    width="14" 
                    height="14" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    style={{
                      animation: loadingComments ? 'spin 1s linear infinite' : 'none'
                    }}
                  >
                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                    <path d="M21 3v5h-5" />
                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                    <path d="M3 21v-5h5" />
                  </svg>
                </button>
                <button
                  onClick={closeComments}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#999',
                    fontSize: '20px',
                    cursor: 'pointer',
                    padding: '4px 8px'
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Comments List - Compact */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                overflowX: 'hidden',
                padding: '8px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                minHeight: 0
              }}
            >
              {loadingComments ? (
                <div style={{ color: '#999', textAlign: 'center', padding: '15px' }}>
                  Loading...
                </div>
              ) : comments.length === 0 ? (
                <div style={{ color: '#999', textAlign: 'center', padding: '15px', fontSize: '12px' }}>
                  No comments yet
                </div>
              ) : (
                comments.map((comment) => (
                  <div
                    key={comment._id}
                    style={{
                      background: pinnedCommentId === comment._id ? '#1a2a4a' : '#111',
                      padding: '8px',
                      borderRadius: '6px',
                      border: pinnedCommentId === comment._id ? '1px solid #1e6aff' : '1px solid #333'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        gap: '6px',
                        alignItems: 'flex-start'
                      }}
                    >
                      {comment.user?.profileImage && (
                        <img
                          src={comment.user.profileImage}
                          alt={comment.user.fullName}
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            flexShrink: 0
                          }}
                        />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#fff',
                            marginBottom: '1px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <span>
                              {comment.user?.isPartner 
                                ? (comment.user?.businessName || comment.user?.fullName || comment.user?.name || 'Partner')
                                : (comment.user?.fullName || comment.user?.name || 'User')
                              }
                            </span>
                            {comment.user?.isPartner && (
                              <span style={{ color: '#1e6aff', fontSize: '8px', background: '#1a2a4a', padding: '1px 3px', borderRadius: '2px', fontWeight: '600', whiteSpace: 'nowrap' }}>Partner</span>
                            )}
                          </div>
                        </div>
                        <div
                          style={{
                            fontSize: '11px',
                            color: '#ddd',
                            lineHeight: '1.3',
                            wordBreak: 'break-word'
                          }}
                        >
                          {comment.text}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons - Compact */}
                    <div style={{ display: 'flex', gap: '6px', marginTop: '6px', fontSize: '10px' }}>
                      <button
                        onClick={() => togglePinComment(comment._id)}
                        style={{
                          padding: '4px 8px',
                          background: pinnedCommentId === comment._id ? '#1e6aff' : '#222',
                          border: 'none',
                          color: '#fff',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title={pinnedCommentId === comment._id ? 'Unpin' : 'Pin'}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setReplyingToId(replyingToId === comment._id ? null : comment._id)}
                        style={{
                          padding: '4px 8px',
                          background: replyingToId === comment._id ? '#1e6aff' : '#222',
                          border: 'none',
                          color: '#fff',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Reply"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => deleteComment(comment._id)}
                        style={{
                          padding: '4px 8px',
                          background: '#333',
                          border: 'none',
                          color: '#ff6b6b',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'background 0.2s'
                        }}
                        title="Delete"
                        onMouseEnter={(e) => e.target.style.background = '#444'}
                        onMouseLeave={(e) => e.target.style.background = '#333'}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          <line x1="10" y1="11" x2="10" y2="17"></line>
                          <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                      </button>
                    </div>

                    {/* Reply input - Compact */}
                    {replyingToId === comment._id && (
                      <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px solid #333' }}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <input
                            type="text"
                            placeholder="Reply..."
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                submitReply()
                              }
                            }}
                            disabled={submittingReply}
                            style={{
                              flex: 1,
                              padding: '6px 8px',
                              background: '#111',
                              border: '1px solid #333',
                              color: '#fff',
                              borderRadius: '3px',
                              fontSize: '11px',
                              outline: 'none'
                            }}
                          />
                          <button
                            onClick={submitReply}
                            disabled={!replyText.trim() || submittingReply}
                            style={{
                              padding: '6px 8px',
                              background: replyText.trim() ? '#1e6aff' : '#666',
                              border: 'none',
                              color: '#fff',
                              borderRadius: '3px',
                              cursor: replyText.trim() ? 'pointer' : 'not-allowed',
                              fontSize: '10px',
                              fontWeight: '500',
                              flexShrink: 0
                            }}
                          >
                            ✓
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Partner Reply - Mobile */}
                    {comment.reply && (
                      <div
                        style={{
                          background: '#1a2a4a',
                          borderLeft: '2px solid #1e6aff',
                          padding: '6px 8px',
                          borderRadius: '3px',
                          marginTop: '6px',
                          fontSize: '9px',
                          border: '1px solid #1e6aff'
                        }}
                      >
                        <div style={{ fontWeight: '700', color: '#1e6aff', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          🍽️ {comment.reply.author?.businessName || comment.reply.author?.fullName || comment.reply.author?.name || 'Store'}
                          <span style={{ fontSize: '7px', background: '#1e6aff', color: '#fff', padding: '1px 3px', borderRadius: '2px' }}>P</span>
                        </div>
                        <div style={{ color: '#ddd', fontSize: '10px' }}>{comment.reply.text}</div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Partner Comment Input - Mobile */}
            <div style={{ borderTop: '1px solid #333', padding: '8px 12px', background: '#0a0a0a' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="text"
                  placeholder="Comment..."
                  value={partnerCommentText}
                  onChange={(e) => setPartnerCommentText(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      submitPartnerComment()
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: '6px 8px',
                    background: '#111',
                    border: '1px solid #333',
                    borderRadius: '3px',
                    color: '#fff',
                    fontSize: '11px',
                    fontFamily: 'inherit'
                  }}
                />
                <button
                  onClick={submitPartnerComment}
                  disabled={!partnerCommentText.trim() || submittingPartnerComment}
                  style={{
                    padding: '6px 8px',
                    background: !partnerCommentText.trim() ? '#333' : '#1e6aff',
                    border: 'none',
                    color: '#fff',
                    borderRadius: '3px',
                    fontSize: '10px',
                    cursor: !partnerCommentText.trim() ? 'not-allowed' : 'pointer',
                    fontWeight: '500',
                    opacity: !partnerCommentText.trim() ? 0.5 : 1
                  }}
                >
                  {submittingPartnerComment ? '...' : '✓'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete confirmation modal */}
      {deleteWarningId && (
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
          onClick={() => setDeleteWarningId(null)}
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
            <h2
              style={{
                fontSize: '1.2rem',
                fontWeight: 700,
                color: '#fff',
                marginBottom: '12px'
              }}
            >
              Delete Video
            </h2>
            <p
              style={{
                fontSize: '0.95rem',
                color: '#bbb',
                lineHeight: '1.5',
                marginBottom: '24px'
              }}
            >
              This video will be permanently deleted and cannot be recovered. Are you sure?
            </p>
            <div
              style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'center'
              }}
            >
              <button
                onClick={() => setDeleteWarningId(null)}
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
                onClick={() => confirmDelete(deleteWarningId)}
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
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingId && (
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
          onClick={() => setEditingId(null)}
        >
          <div
            style={{
              background: '#000',
              borderRadius: '12px',
              padding: '28px 24px',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)',
              maxWidth: '450px',
              width: '90%',
              textAlign: 'left',
              border: '1px solid #333'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{
              fontSize: '1.2rem',
              fontWeight: 700,
              color: '#fff',
              marginBottom: '20px'
            }}>
              Edit Food Details
            </h2>

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                fontSize: '0.9rem',
                color: '#999',
                marginBottom: '8px',
                display: 'block',
                textTransform: 'uppercase',
                fontWeight: 600
              }}>
                Food Name
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter food name"
                disabled={editSaving}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#111',
                  border: '1px solid #333',
                  color: '#fff',
                  borderRadius: '6px',
                  fontSize: '0.95rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                fontSize: '0.9rem',
                color: '#999',
                marginBottom: '8px',
                display: 'block',
                textTransform: 'uppercase',
                fontWeight: 600
              }}>
                Description
              </label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Enter food description"
                disabled={editSaving}
                rows={4}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#111',
                  border: '1px solid #333',
                  color: '#fff',
                  borderRadius: '6px',
                  fontSize: '0.95rem',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setEditingId(null)}
                disabled={editSaving}
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
                onMouseEnter={(e) => !editSaving && (e.target.style.background = '#222', e.target.style.borderColor = '#666')}
                onMouseLeave={(e) => !editSaving && (e.target.style.background = '#111', e.target.style.borderColor = '#555')}
              >
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                disabled={editSaving || !editName.trim()}
                style={{
                  padding: '10px 24px',
                  border: 'none',
                  background: editSaving || !editName.trim() ? '#666' : '#1e6aff',
                  color: '#fff',
                  borderRadius: '6px',
                  cursor: editSaving || !editName.trim() ? 'not-allowed' : 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => !editSaving && editName.trim() && (e.target.style.background = '#1a5acc')}
                onMouseLeave={(e) => !editSaving && editName.trim() && (e.target.style.background = '#1e6aff')}
              >
                {editSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FoodPartnerReelFeed
