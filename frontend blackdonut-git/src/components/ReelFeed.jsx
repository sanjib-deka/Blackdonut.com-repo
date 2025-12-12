import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import BottomNav from './BottomNav'
import ShinyText from './ShinyText'
import axios from 'axios'
import API_CONFIG from '../utils/apiConfig'

const ReelFeed = ({ items = [], onLike, onSave, emptyMessage = 'No videos yet.', onLogin, initialIndex = 0 }) => {
  const videoRefs = useRef(new Map())
  const feedRef = useRef(null)
  const [isMuted, setIsMuted] = useState(true)
  const [shuffledItems, setShuffledItems] = useState([])
  const [centerOverlay, setCenterOverlay] = useState({ id: null, visible: false, type: '' })
  const [showNewMealsPopup, setShowNewMealsPopup] = useState(false)
  const [newMeals, setNewMeals] = useState([])
  const overlayTimeoutRef = useRef(null)
  const currentVisibleRef = useRef(null)
  const likedItems = useRef(new Set())
  const savedItems = useRef(new Set())
  const likeButtonRefs = useRef(new Map())
  const appendingRef = useRef(false)
  const [itemsWithUpdatedStats, setItemsWithUpdatedStats] = useState({})

  const shuffleArray = (arr) => {
    const a = arr.slice()
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const temp = a[i]
      a[i] = a[j]
      a[j] = temp
    }
    return a
  }

  // Intersection observer to play/pause and append on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const reelId = entry.target.dataset.reelId
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            const vid = videoRefs.current.get(reelId)
            currentVisibleRef.current = reelId

            // Pause all other videos
            videoRefs.current.forEach((video, id) => {
              if (id !== reelId && !video.paused) {
                video.pause()
              }
            })

            // Play current visible video
            if (vid && vid.paused) {
              vid.play().catch(() => {})
            }

            // Check if this is the last reel and append new shuffle
            if (shuffledItems.length > 0) {
              const currentIndex = shuffledItems.findIndex(item => item._id === reelId)
              const isLastReel = currentIndex === shuffledItems.length - 1

              if (isLastReel && !appendingRef.current && items && items.length) {
                appendingRef.current = true
                const newShuffle = shuffleArray(items)
                setNewMeals(newShuffle)
                setShowNewMealsPopup(true)
                
                // Auto append after 3 seconds
                setTimeout(() => {
                  setShuffledItems((prev) => [...prev, ...newShuffle])
                  setShowNewMealsPopup(false)
                  appendingRef.current = false
                }, 3000)
              }
            }
          } else {
            const vid = videoRefs.current.get(reelId)
            if (vid && !vid.paused) {
              vid.pause()
            }
          }
        })
      },
      { threshold: [0, 0.25, 0.6, 0.9, 1] }
    )

    if (feedRef.current) {
      Array.from(feedRef.current.querySelectorAll('[data-reel-id]')).forEach((el) => {
        observer.observe(el)
      })
    }

    return () => observer.disconnect()
  }, [shuffledItems, items])

  // Initialize shuffle on first load
  useEffect(() => {
    if (shuffledItems.length === 0 && items.length > 0) {
      const shuffled = shuffleArray(items)
      setShuffledItems(shuffled)
    }
  }, [items])

  // Initialize saved/liked state from items
  useEffect(() => {
    items.forEach(item => {
      if (item.isLiked) likedItems.current.add(item._id)
      if (item.isSaved) savedItems.current.add(item._id)
    })
    // Also initialize stats state with saved/liked flags
    const newStats = {}
    items.forEach(item => {
      if (item.isSaved || item.isLiked) {
        newStats[`${item._id}-stats`] = {
          isSaved: item.isSaved || false,
          isLiked: item.isLiked || false
        }
      }
    })
    if (Object.keys(newStats).length > 0) {
      setItemsWithUpdatedStats(prev => ({ ...prev, ...newStats }))
    }
  }, [items])

  const setVideoRef = (id) => (el) => {
    if (!el) {
      videoRefs.current.delete(id)
      return
    }
    if (el.dataset) el.dataset.reelId = id
    videoRefs.current.set(id, el)
  }

  const handleCenterToggle = (id) => {
    const vid = videoRefs.current.get(id)
    if (!vid) return
    if (vid.paused) {
      setCenterOverlay({ id, visible: true, type: 'play' })
      vid.play().catch(() => {})
    } else {
      setCenterOverlay({ id, visible: true, type: 'pause' })
      vid.pause()
    }
    if (overlayTimeoutRef.current) clearTimeout(overlayTimeoutRef.current)
    overlayTimeoutRef.current = setTimeout(() => {
      setCenterOverlay({ id: null, visible: false, type: '' })
    }, 700)
  }

  const handleMuteToggle = () => {
    setIsMuted(!isMuted)
    videoRefs.current.forEach((video) => {
      video.muted = !isMuted
    })
  }

  // Get current item with updated stats
  const getItemWithStats = (item) => {
    const key = `${item._id}-stats`
    const updatedStats = itemsWithUpdatedStats[key]
    if (updatedStats) {
      return { ...item, ...updatedStats }
    }
    return item
  }

  const [openPopupId, setOpenPopupId] = useState(null)
  const popupRefs = useRef(new Map())

  // Comment state
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [activeCommentsFoodId, setActiveCommentsFoodId] = useState(null)
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')
  const [loadingComments, setLoadingComments] = useState(false)
  const [submittingComment, setSubmittingComment] = useState(false)

  const openPopup = async (id) => {
    setOpenPopupId(id)
    try {
      const mod = await import('gsap')
      const gsap = mod?.default || mod
      const el = popupRefs.current.get(id)
      if (el) {
        gsap.fromTo(el, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.3 })
      }
    } catch (e) {
    }
  }

  const closePopup = async (id) => {
    try {
      const mod = await import('gsap')
      const gsap = mod?.default || mod
      const el = popupRefs.current.get(id)
      if (el) {
        gsap.to(el, { opacity: 0, y: 10, duration: 0.2 })
      }
    } catch (e) {
    }
    setOpenPopupId((cur) => (cur === id ? null : cur))
  }

  const animateHeart = async (id, isLike) => {
    const btn = likeButtonRefs.current.get(id)
    if (!btn) return
    try {
      const mod = await import('gsap')
      const gsap = mod?.default || mod
      const svg = btn.querySelector('svg')
      if (svg) {
        gsap.fromTo(svg, { scale: 1 }, { scale: 1.3, duration: 0.2, yoyo: true, repeat: 1 })
      }
    } catch (e) {
    }
  }

  // Open comments for a food item
  const openComments = async (foodId) => {
    console.log('========== COMMENT BUTTON CLICKED ==========')
    console.log('🔵 openComments called with foodId:', foodId)
    console.log('🔵 Current screen width:', window.innerWidth)
    console.log('🔵 Is mobile? (≤768px):', window.innerWidth <= 768)
    
    setActiveCommentsFoodId(foodId)
    setCommentsOpen(true)
    console.log('🔵 State updated: commentsOpen = true')
    
    setLoadingComments(true)
    setCommentText('')
    
    try {
      const endpoint = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.COMMENTS.GET(foodId)}`
      console.log('🔵 Fetching comments from:', endpoint)
      console.log('🔵 Full URL:', endpoint)
      
      const response = await axios.get(endpoint, { withCredentials: true })
      console.log('✅ SUCCESS! Comments response received:', response)
      console.log('✅ Comments data:', response.data.comments)
      console.log('✅ Number of comments:', response.data.comments?.length || 0)
      
      // Backend already populates user data with fullName and profileImage
      setComments(response.data.comments || [])
      console.log('🔵 Comments set in state')
    } catch (err) {
      console.log('========== ERROR FETCHING COMMENTS ==========')
      console.error('🔴 Full error object:', err)
      console.error('🔴 Error message:', err.message)
      console.error('🔴 Error status:', err.response?.status)
      console.error('🔴 Error status text:', err.response?.statusText)
      console.error('🔴 Error data:', err.response?.data)
      console.error('🔴 Error config URL:', err.config?.url)
      console.error('🔴 Error config method:', err.config?.method)
      
      // Don't logout on error, just show empty comments
      setComments([])
      console.log('🔵 Empty comments array set')
      
      // Only alert if it's not a 401/403/404
      if (err.response?.status !== 401 && err.response?.status !== 403 && err.response?.status !== 404) {
        console.log('⚠️ Failed to load comments (non-auth error)')
      } else {
        console.log('⚠️ Auth-related error, not showing alert')
      }
    } finally {
      setLoadingComments(false)
      console.log('🔵 Loading state set to false')
      console.log('========== OPENCOMMENTS COMPLETE ==========')
    }
  }

  // Close comments
  const closeComments = () => {
    setCommentsOpen(false)
    setActiveCommentsFoodId(null)
    setComments([])
    setCommentText('')
  }

  // Submit new comment
  const submitComment = async () => {
    if (!commentText.trim() || !activeCommentsFoodId) return
    
    setSubmittingComment(true)
    try {
      const response = await axios.post(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.COMMENTS.ADD}`,
        { foodId: activeCommentsFoodId, text: commentText },
        { withCredentials: true }
      )
      
      // Add new comment to list
      setComments([response.data.comment, ...comments])
      setCommentText('')
      
      // Update comment count in shuffled items
      setShuffledItems((prev) =>
        prev.map((item) =>
          item._id === activeCommentsFoodId
            ? { ...item, commentCount: (item.commentCount || 0) + 1 }
            : item
        )
      )
    } catch (err) {
      console.error('Error posting comment:', err)
      // Only alert if not a 401/403
      if (err.response?.status !== 401 && err.response?.status !== 403) {
        alert('Failed to post comment')
      }
    } finally {
      setSubmittingComment(false)
    }
  }

  // Delete own comment
  const deleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return
    
    try {
      await axios.delete(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.COMMENTS.DELETE(commentId)}`,
        { withCredentials: true }
      )
      setComments(comments.filter(c => c._id !== commentId))
      
      // Update comment count in shuffled items
      setShuffledItems((prev) =>
        prev.map((item) =>
          item._id === activeCommentsFoodId
            ? { ...item, commentCount: Math.max(0, (item.commentCount || 1) - 1) }
            : item
        )
      )
    } catch (err) {
      console.error('Error deleting comment:', err)
      // Only alert if not a 401/403
      if (err.response?.status !== 401 && err.response?.status !== 403) {
        alert('Failed to delete comment')
      }
    }
  }

  return (
    <div className="reels-page">
      <div className="reels-feed" role="list" ref={feedRef}>
        {items.length === 0 && (
          <div className="empty-state">
            <ShinyText text={emptyMessage} speed={5} className="empty-message-shiny" />
            {onLogin && (
              <button
                onClick={onLogin}
                style={{
                  marginTop: '1rem',
                  padding: '0.5rem 1.5rem',
                  border: 'none',
                  borderRadius: '999px',
                  background: '#222',
                  color: '#fff',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  transition: 'background 0.2s'
                }}
              >
                Sign In to Explore
              </button>
            )}
          </div>
        )}

        {(shuffledItems && shuffledItems.length ? shuffledItems : items).map((item, index) => (
          <section key={`${item._id}-${index}`} className="reel" role="listitem" style={{ position: 'relative' }}>
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

                <div className="reel-action-group">
                  <button
                    ref={(el) => {
                      if (el) likeButtonRefs.current.set(item._id, el)
                      else likeButtonRefs.current.delete(item._id)
                    }}
                    onClick={onLike ? () => {
                      const itemWithStats = getItemWithStats(item)
                      const wasLiked = itemWithStats.isLiked || likedItems.current.has(item._id)
                      const newLikeState = !wasLiked
                      
                      if (newLikeState) {
                        likedItems.current.add(item._id)
                      } else {
                        likedItems.current.delete(item._id)
                      }
                      
                      // Update stats in state
                      const currentLikes = itemWithStats.likeCount ?? itemWithStats.likesCount ?? itemWithStats.likes ?? 0
                      const newLikes = newLikeState ? currentLikes + 1 : Math.max(0, currentLikes - 1)
                      setItemsWithUpdatedStats(prev => ({
                        ...prev,
                        [`${item._id}-stats`]: {
                          ...itemWithStats,
                          likeCount: newLikes,
                          isLiked: newLikeState
                        }
                      }))
                      
                      animateHeart(item._id, newLikeState)
                      onLike(item)
                    } : undefined}
                    className="reel-action"
                    aria-label="Like"
                  >
                    {(() => {
                      const itemWithStats = getItemWithStats(item)
                      return itemWithStats.isLiked || likedItems.current.has(item._id)
                    })() ? (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="#ff3b30" stroke="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 22l7.8-8.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
                      </svg>
                    ) : (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 22l7.8-8.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
                      </svg>
                    )}
                  </button>
                  <div className="reel-action__count">{(() => {
                    const itemWithStats = getItemWithStats(item)
                    return itemWithStats.likeCount ?? itemWithStats.likesCount ?? itemWithStats.likes ?? 0
                  })()}</div>
                </div>

                <div className="reel-action-group">
                  <button
                    className="reel-action"
                    onClick={onSave ? () => {
                      const itemWithStats = getItemWithStats(item)
                      const wasSaved = itemWithStats.isSaved || savedItems.current.has(item._id)
                      const newSaveState = !wasSaved
                      
                      if (newSaveState) {
                        savedItems.current.add(item._id)
                      } else {
                        savedItems.current.delete(item._id)
                      }
                      
                      // Update stats in state
                      const currentSaves = itemWithStats.savesCount ?? itemWithStats.bookmarks ?? itemWithStats.saves ?? 0
                      const newSaves = newSaveState ? currentSaves + 1 : Math.max(0, currentSaves - 1)
                      setItemsWithUpdatedStats(prev => ({
                        ...prev,
                        [`${item._id}-stats`]: {
                          ...(prev[`${item._id}-stats`] || itemWithStats),
                          savesCount: newSaves,
                          isSaved: newSaveState
                        }
                      }))
                      
                      onSave(item)
                    } : undefined}
                    aria-label="Bookmark"
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill={(() => {
                      const itemWithStats = getItemWithStats(item)
                      return (itemWithStats.isSaved || savedItems.current.has(item._id)) ? "currentColor" : "none"
                    })()}  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" />
                    </svg>
                  </button>
                  <div className="reel-action__count">{(() => {
                    const itemWithStats = getItemWithStats(item)
                    return itemWithStats.savesCount ?? itemWithStats.bookmarks ?? itemWithStats.saves ?? 0
                  })()}</div>
                </div>

                <div className="reel-action-group">
                  <button 
                    className="reel-action" 
                    aria-label="Comments"
                    style={{
                      position: 'relative',
                      zIndex: 10,
                      pointerEvents: 'auto',
                      touchAction: 'manipulation'
                    }}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      console.log('🔘 COMMENT BUTTON CLICKED! Item ID:', item._id)
                      console.log('🔘 Event type:', e.type)
                      console.log('🔘 Is mobile:', window.innerWidth <= 768)
                      openComments(item._id)
                    }}
                    onTouchEnd={(e) => {
                      // Extra handler for touch devices
                      if (window.innerWidth <= 768) {
                        console.log('📱 MOBILE TOUCH END on comment button')
                        e.preventDefault()
                        e.stopPropagation()
                        openComments(item._id)
                      }
                    }}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
                    </svg>
                  </button>
                  <div className="reel-action__count">{item.commentCount ?? item.commentsCount ?? (Array.isArray(item.comments) ? item.comments.length : 0)}</div>
                </div>
              </div>

              <div
                className="reel-content"
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6, width: '100%' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
                  <div className="reel-name" style={{ fontWeight: 600 }}>{item.name ?? item.title ?? 'Untitled'}</div>

                  <div style={{ marginLeft: 8 }}>
                    <button
                      aria-label="More"
                      title="More"
                      onClick={(e) => { e.stopPropagation(); if (openPopupId === item._id) closePopup(item._id); else openPopup(item._id) }}
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

                {item.foodPartner && (
                  <Link
                    className="reel-btn"
                    to={"/food-partner/" + item.foodPartner}
                    aria-label="Visit store"
                    style={{ marginTop: 2, alignSelf: 'flex-start' }}
                  >
                    Visit store
                  </Link>
                )}

                {/* Popover rendered inline; visibility controlled by openPopupId */}
                  <div
                    ref={(el) => { if (el) popupRefs.current.set(item._id, el); else popupRefs.current.delete(item._id) }}
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
                      display: openPopupId === item._id ? 'block' : 'none'
                    }}
                  >
                    <div style={{ marginBottom: 8, fontSize: 14, lineHeight: '1.2', fontWeight: 700 }}>
                      {`Description of ${item.name ?? item.title ?? 'food'}`}
                    </div>
                    <div style={{ fontSize: 13, lineHeight: '1.4', color: '#eee', maxHeight: '160px', overflowY: 'auto' }}>{item.description ?? 'No description'}</div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); closePopup(item._id) }}
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
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* NEW MEALS POPUP - RIGHT SIDE */}
      {showNewMealsPopup && (
        <div
          style={{
            position: 'fixed',
            right: 20,
            bottom: 100,
            background: '#000',
            border: '2px solid #1e6aff',
            borderRadius: '12px',
            padding: '16px',
            zIndex: 98,
            width: '280px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
            animation: 'slideInRight 0.4s ease-out'
          }}
        >
          <h3 style={{ margin: '0 0 12px 0', color: '#1e6aff', fontSize: '16px', fontWeight: '700' }}>
            🍽️ New Meals Loading...
          </h3>
          <p style={{ margin: '0 0 12px 0', color: '#999', fontSize: '12px' }}>
            Swipe up to explore {newMeals.length} new delicious meals!
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => {
                setShuffledItems((prev) => [...prev, ...newMeals])
                setShowNewMealsPopup(false)
              }}
              style={{
                flex: 1,
                padding: '8px 12px',
                background: '#1e6aff',
                border: 'none',
                color: '#fff',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '600'
              }}
            >
              Load Now
            </button>
            <button
              onClick={() => setShowNewMealsPopup(false)}
              style={{
                flex: 1,
                padding: '8px 12px',
                background: 'transparent',
                border: '1px solid #333',
                color: '#999',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Later
            </button>
          </div>
        </div>
      )}

      {/* COMMENTS BOTTOM SHEET - DESKTOP */}
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
            {/* Header */}
            <div
              style={{
                padding: '16px 16px 12px',
                borderBottom: '1px solid #333',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <h3 style={{ margin: 0, color: '#fff', fontSize: '18px', fontWeight: '600' }}>
                Comments ({comments.length})
              </h3>
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

            {/* Comments List */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                overflowX: 'hidden',
                padding: '12px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                minHeight: 0
              }}
            >
              {loadingComments ? (
                <div style={{ color: '#999', textAlign: 'center', padding: '20px' }}>
                  Loading comments...
                </div>
              ) : comments.length === 0 ? (
                <div style={{ color: '#999', textAlign: 'center', padding: '20px' }}>
                  No comments yet. Be the first to comment!
                </div>
              ) : (
                comments.map((comment) => (
                  <div
                    key={comment._id}
                    style={{
                      background: '#111',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #333'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'flex-start',
                        marginBottom: '8px'
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
                            marginBottom: '2px'
                          }}
                        >
                          {comment.user?.fullName || comment.user?.name || 'User'}
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
                      <button
                        onClick={() => deleteComment(comment._id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#999',
                          cursor: 'pointer',
                          fontSize: '18px',
                          padding: '4px 8px',
                          flexShrink: 0
                        }}
                        title="Delete"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Partner Reply */}
                    {comment.reply && (
                      <div
                        style={{
                          background: '#222',
                          borderLeft: '3px solid #1e6aff',
                          padding: '10px 12px',
                          borderRadius: '4px',
                          marginTop: '8px',
                          fontSize: '13px'
                        }}
                      >
                        <div style={{ fontWeight: '600', color: '#1e6aff', marginBottom: '4px' }}>
                          {comment.reply.author?.fullName || comment.reply.author?.name || 'Store'}
                        </div>
                        <div style={{ color: '#ddd' }}>{comment.reply.text}</div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Comment Input */}
            <div
              style={{
                padding: '12px 16px',
                borderTop: '1px solid #333',
                display: 'flex',
                gap: '8px',
                background: '#000'
              }}
            >
              <input
                type="text"
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    submitComment()
                  }
                }}
                disabled={submittingComment}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  background: '#111',
                  border: '1px solid #333',
                  color: '#fff',
                  borderRadius: '20px',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
              <button
                onClick={submitComment}
                disabled={!commentText.trim() || submittingComment}
                style={{
                  padding: '10px 16px',
                  background: commentText.trim() ? '#1e6aff' : '#666',
                  border: 'none',
                  color: '#fff',
                  borderRadius: '20px',
                  cursor: commentText.trim() ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'background 0.2s',
                  flexShrink: 0
                }}
              >
                {submittingComment ? '...' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMMENTS BOTTOM SHEET - MOBILE COMPACT */}
      {commentsOpen && window.innerWidth <= 768 && (
        <>
          {console.log('🟢 RENDERING MOBILE COMMENT SECTION')}
          {console.log('   - commentsOpen:', commentsOpen)}
          {console.log('   - window.innerWidth:', window.innerWidth)}
          {console.log('   - Should show mobile:', window.innerWidth <= 768)}
          {console.log('   - Comments count:', comments.length)}
          {console.log('   - Loading:', loadingComments)}
          {/* Backdrop overlay - click to close */}
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
              maxHeight: '60vh',
              width: '90%',
              maxWidth: '400px',
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
              <h3 style={{ margin: 0, color: '#fff', fontSize: '16px', fontWeight: '600' }}>
                Comments ({comments.length})
              </h3>
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
                      background: '#111',
                      padding: '8px',
                      borderRadius: '6px',
                      border: '1px solid #333'
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
                            marginBottom: '1px'
                          }}
                        >
                          {comment.user?.fullName || comment.user?.name || 'User'}
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
                      <button
                        onClick={() => deleteComment(comment._id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#999',
                          cursor: 'pointer',
                          fontSize: '14px',
                          padding: '2px 4px',
                          flexShrink: 0
                        }}
                        title="Delete"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Comment Input - Compact */}
            <div
              style={{
                padding: '8px 12px',
                borderTop: '1px solid #333',
                display: 'flex',
                gap: '6px',
                background: '#000',
                flexShrink: 0
              }}
            >
              <input
                type="text"
                placeholder="Comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    submitComment()
                  }
                }}
                disabled={submittingComment}
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  background: '#111',
                  border: '1px solid #333',
                  color: '#fff',
                  borderRadius: '16px',
                  fontSize: '12px',
                  outline: 'none'
                }}
              />
              <button
                onClick={submitComment}
                disabled={!commentText.trim() || submittingComment}
                style={{
                  padding: '8px 12px',
                  background: commentText.trim() ? '#1e6aff' : '#666',
                  border: 'none',
                  color: '#fff',
                  borderRadius: '16px',
                  cursor: commentText.trim() ? 'pointer' : 'not-allowed',
                  fontSize: '12px',
                  fontWeight: '500',
                  transition: 'background 0.2s',
                  flexShrink: 0
                }}
              >
                {submittingComment ? '...' : 'Post'}
              </button>
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        @keyframes slideInRight {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}

export default ReelFeed
