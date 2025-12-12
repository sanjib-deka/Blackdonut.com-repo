import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import BottomNav from './BottomNav'

const PartnerReelView = ({ items = [], onLike, onSave, emptyMessage = 'No videos yet.', initialIndex = 0 }) => {
  const videoRefs = useRef(new Map())
  const feedRef = useRef(null)
  const [isMuted, setIsMuted] = useState(true)
  const [centerOverlay, setCenterOverlay] = useState({ id: null, visible: false, type: '' })
  const overlayTimeoutRef = useRef(null)
  const currentVisibleRef = useRef(null)
  const initialScrollDone = useRef(false)
  const likedItems = useRef(new Set())
  const likeButtonRefs = useRef(new Map())
  const [openPopupId, setOpenPopupId] = useState(null)
  const popupRefs = useRef(new Map())

  // Observer for video playback
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target
          if (!(video instanceof HTMLVideoElement)) return
          const id = video.dataset && video.dataset.reelId
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            currentVisibleRef.current = id || currentVisibleRef.current
            video.play().catch(() => {})
          } else {
            if (currentVisibleRef.current === id) currentVisibleRef.current = null
            video.pause()
          }
        })
      },
      { threshold: [0, 0.25, 0.6, 0.9, 1] }
    )

    videoRefs.current.forEach((vid) => observer.observe(vid))
    return () => observer.disconnect()
  }, [items])

  // Scroll to initial index on mount
  useEffect(() => {
    if (!feedRef.current || !items || !items.length) return
    if (!initialScrollDone.current) {
      setTimeout(() => {
        try {
          const targetIndex = Math.min(initialIndex, items.length - 1)
          const targetReel = items[targetIndex]
          if (!targetReel) return
          const targetVid = videoRefs.current.get(targetReel._id)
          if (targetVid) {
            targetVid.scrollIntoView({ block: 'center', behavior: 'auto' })
            targetVid.play().catch(() => {})
          }
        } catch (e) {}
      }, 100)
      initialScrollDone.current = true
    }
  }, [items, initialIndex])

  const setVideoRef = (id) => (el) => {
    if (!el) { videoRefs.current.delete(id); return }
    el.dataset && (el.dataset.reelId = id)
    videoRefs.current.set(id, el)
  }

  const handleMuteToggle = () => {
    const newMutedState = !isMuted
    setIsMuted(newMutedState)
    videoRefs.current.forEach((video) => {
      video.muted = newMutedState
    })
  }

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

      if (overlayTimeoutRef.current) {
        clearTimeout(overlayTimeoutRef.current)
      }
      overlayTimeoutRef.current = setTimeout(() => {
        setCenterOverlay({ id: null, visible: false, type: '' })
        overlayTimeoutRef.current = null
      }, 700)
    } catch (e) {}
  }

  const handleLikeClick = (item) => {
    if (onLike) {
      const wasLiked = item.isLiked || likedItems.current.has(item._id)
      if (wasLiked) {
        likedItems.current.delete(item._id)
      } else {
        likedItems.current.add(item._id)
      }
      animateHeart(item._id, !wasLiked)
      onLike(item)
    }
  }

  const handleSaveClick = (item) => {
    if (onSave) {
      onSave(item)
    }
  }

  const animateHeart = async (id, isLike) => {
    const btn = likeButtonRefs.current.get(id)
    if (!btn) return
    try {
      const mod = await import('gsap')
      const gsap = mod?.default || mod
      const svg = btn.querySelector('svg')
      if (svg) {
        gsap.killTweensOf(svg)
        gsap.fromTo(svg, { scale: 1 }, { scale: 1.3, duration: 0.12, ease: 'power2.out' })
        gsap.to(svg, { scale: 1, duration: 0.12, delay: 0.12, ease: 'back.out' })
      }
    } catch (e) {}
  }

  const openPopup = async (id) => {
    setOpenPopupId(id)
    try {
      const mod = await import('gsap')
      const gsap = mod?.default || mod
      const el = popupRefs.current.get(id)
      if (el) {
        gsap.killTweensOf(el)
        el.style.display = 'block'
        gsap.fromTo(el, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.24, ease: 'power2.out' })
      }
    } catch (e) {}
  }

  const closePopup = async (id) => {
    try {
      const mod = await import('gsap')
      const gsap = mod?.default || mod
      const el = popupRefs.current.get(id)
      if (el) {
        await gsap.to(el, { y: 12, opacity: 0, duration: 0.16, ease: 'power2.in' })
        el.style.display = 'none'
      }
    } catch (e) {}
    setOpenPopupId((cur) => (cur === id ? null : cur))
  }

  if (!items || items.length === 0) {
    return (
      <div className="reels-page">
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          {emptyMessage}
        </div>
      </div>
    )
  }

  return (
    <div className="reels-page">
      <div className="reels-feed" role="list" ref={feedRef}>
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
                    onClick={() => handleLikeClick(item)}
                    className="reel-action"
                    aria-label="Like"
                  >
                    {item.isLiked || likedItems.current.has(item._id) ? (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="#ff3b30" stroke="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 22l7.8-8.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
                      </svg>
                    ) : (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 22l7.8-8.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
                      </svg>
                    )}
                  </button>
                  <div className="reel-action__count">{item.likeCount ?? item.likesCount ?? item.likes ?? 0}</div>
                </div>

                <div className="reel-action-group">
                  <button
                    className="reel-action"
                    onClick={() => handleSaveClick(item)}
                    aria-label="Bookmark"
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" />
                    </svg>
                  </button>
                  <div className="reel-action__count">{item.savesCount ?? item.bookmarks ?? item.saves ?? 0}</div>
                </div>

                <div className="reel-action-group">
                  <button className="reel-action" aria-label="Comments">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
                    </svg>
                  </button>
                  <div className="reel-action__count">{item.commentsCount ?? (Array.isArray(item.comments) ? item.comments.length : 0)}</div>
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
                    onClick={() => {
                      const vid = videoRefs.current.get(item._id)
                      const time = vid ? vid.currentTime : 0
                    }}
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

      <BottomNav />
    </div>
  )
}

export default PartnerReelView
