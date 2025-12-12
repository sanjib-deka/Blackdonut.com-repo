import React, { useState, useEffect } from 'react'
import axios from 'axios'
import API_CONFIG from '../utils/apiConfig'

const EngagementDashboard = ({ foodId, foodName, onClose }) => {
  const [stats, setStats] = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedComment, setSelectedComment] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchEngagementData()
  }, [foodId])

  const fetchEngagementData = async () => {
    try {
      setLoading(true)
      
      // Fetch stats
      const statsRes = await axios.get(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.COMMENTS.ENGAGEMENT(foodId)}`, {
        withCredentials: true
      })
      setStats(statsRes.data.stats)

      // Fetch comments
      const commentsRes = await axios.get(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.COMMENTS.GET(foodId)}`, {
        withCredentials: true
      })
      setComments(commentsRes.data.comments || [])
    } catch (err) {
      console.error('Fetch engagement error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handlePinComment = async (commentId) => {
    try {
      const res = await axios.put(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.COMMENTS.PIN(commentId)}`,
        {},
        { withCredentials: true }
      )
      setComments(comments.map(c => c._id === commentId ? res.data.comment : c))
    } catch (err) {
      console.error('Pin error:', err)
      alert('Failed to pin comment')
    }
  }

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return

    try {
      await axios.delete(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.COMMENTS.ENGAGEMENT(commentId)}`, {
        withCredentials: true
      })
      setComments(comments.filter(c => c._id !== commentId))
    } catch (err) {
      console.error('Delete error:', err)
      alert('Failed to delete comment')
    }
  }

  const handleReply = async (commentId) => {
    if (!replyText.trim()) return

    setSubmitting(true)
    try {
      const res = await axios.post(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.COMMENTS.REPLY(commentId)}`,
        { text: replyText },
        { withCredentials: true }
      )
      setComments(comments.map(c => c._id === commentId ? res.data.comment : c))
      setReplyText('')
      setSelectedComment(null)
    } catch (err) {
      console.error('Reply error:', err)
      alert('Failed to add reply')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      zIndex: 300,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }} onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div style={{
        background: '#000',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '700px',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid #333'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #333',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ margin: '0 0 4px 0', color: '#fff' }}>Engagement</h2>
            <p style={{ margin: 0, color: '#999', fontSize: '0.9rem' }}>{foodName}</p>
          </div>
          <button
            onClick={() => onClose?.()}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#999',
              fontSize: '24px',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        {/* Stats Section */}
        {stats && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
            padding: '20px',
            borderBottom: '1px solid #333'
          }}>
            <div style={{
              background: '#111',
              padding: '16px',
              borderRadius: '8px',
              textAlign: 'center',
              border: '1px solid #333'
            }}>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#1e6aff' }}>
                {stats.likes || 0}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#999', marginTop: '4px' }}>Likes</div>
            </div>
            <div style={{
              background: '#111',
              padding: '16px',
              borderRadius: '8px',
              textAlign: 'center',
              border: '1px solid #333'
            }}>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#1e6aff' }}>
                {stats.comments || 0}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#999', marginTop: '4px' }}>Comments</div>
            </div>
            <div style={{
              background: '#111',
              padding: '16px',
              borderRadius: '8px',
              textAlign: 'center',
              border: '1px solid #333'
            }}>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#1e6aff' }}>
                {stats.saves || 0}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#999', marginTop: '4px' }}>Saves</div>
            </div>
          </div>
        )}

        {/* Comments List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px'
        }}>
          {loading ? (
            <div style={{ color: '#999', textAlign: 'center', padding: '20px' }}>Loading...</div>
          ) : comments.length === 0 ? (
            <div style={{ color: '#999', textAlign: 'center', padding: '20px' }}>
              No comments yet
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {comments.map((comment) => (
                <div key={comment._id} style={{
                  background: '#111',
                  borderRadius: '8px',
                  padding: '12px',
                  border: comment.isPinned ? '1px solid #1e6aff' : '1px solid #333'
                }}>
                  {/* Pinned Badge */}
                  {comment.isPinned && (
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#1e6aff',
                      marginBottom: '8px',
                      fontWeight: 600
                    }}>
                      📌 PINNED
                    </div>
                  )}

                  {/* User Info */}
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'flex-start',
                    marginBottom: '8px'
                  }}>
                    {comment.user?.profileImage && (
                      <img
                        src={comment.user.profileImage}
                        alt={comment.user.name}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          objectFit: 'cover'
                        }}
                      />
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff' }}>
                        {comment.user?.name || 'User'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#999' }}>
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Comment Text */}
                  <p style={{
                    margin: '0 0 12px 0',
                    color: '#ddd',
                    fontSize: '0.95rem',
                    lineHeight: '1.4'
                  }}>
                    {comment.text}
                  </p>

                  {/* Reply from Owner */}
                  {comment.reply && (
                    <div style={{
                      background: '#222',
                      borderLeft: '3px solid #1e6aff',
                      padding: '10px 12px',
                      borderRadius: '4px',
                      margin: '8px 0',
                      fontSize: '0.9rem'
                    }}>
                      <div style={{ fontWeight: 600, color: '#1e6aff', marginBottom: '4px' }}>
                        You (Owner)
                      </div>
                      <div style={{ color: '#ddd' }}>
                        {comment.reply.text}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    flexWrap: 'wrap'
                  }}>
                    <button
                      onClick={() => handlePinComment(comment._id)}
                      style={{
                        padding: '6px 12px',
                        background: comment.isPinned ? '#1e6aff' : '#222',
                        border: '1px solid #333',
                        borderRadius: '4px',
                        color: comment.isPinned ? '#fff' : '#999',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = comment.isPinned ? '#1a5acc' : '#333'
                        e.target.style.borderColor = '#555'
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = comment.isPinned ? '#1e6aff' : '#222'
                        e.target.style.borderColor = '#333'
                      }}
                    >
                      {comment.isPinned ? '📌 Unpin' : '📌 Pin'}
                    </button>
                    {!comment.reply && (
                      <button
                        onClick={() => setSelectedComment(selectedComment === comment._id ? null : comment._id)}
                        style={{
                          padding: '6px 12px',
                          background: selectedComment === comment._id ? '#1e6aff' : '#222',
                          border: '1px solid #333',
                          borderRadius: '4px',
                          color: '#fff',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = selectedComment === comment._id ? '#1a5acc' : '#333'
                          e.target.style.borderColor = '#555'
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = selectedComment === comment._id ? '#1e6aff' : '#222'
                          e.target.style.borderColor = '#333'
                        }}
                      >
                        Reply
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteComment(comment._id)}
                      style={{
                        padding: '6px 12px',
                        background: '#222',
                        border: '1px solid #333',
                        borderRadius: '4px',
                        color: '#ff3b30',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = '#3a0a0a'
                        e.target.style.borderColor = '#ff3b30'
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = '#222'
                        e.target.style.borderColor = '#333'
                      }}
                    >
                      Delete
                    </button>
                  </div>

                  {/* Reply Input */}
                  {selectedComment === comment._id && (
                    <div style={{
                      marginTop: '12px',
                      paddingTop: '12px',
                      borderTop: '1px solid #333',
                      display: 'flex',
                      gap: '8px'
                    }}>
                      <input
                        type="text"
                        placeholder="Write a reply..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        disabled={submitting}
                        style={{
                          flex: 1,
                          padding: '8px 10px',
                          background: '#000',
                          border: '1px solid #333',
                          color: '#fff',
                          borderRadius: '4px',
                          fontSize: '0.85rem'
                        }}
                      />
                      <button
                        onClick={() => handleReply(comment._id)}
                        disabled={submitting || !replyText.trim()}
                        style={{
                          padding: '8px 12px',
                          background: replyText.trim() ? '#1e6aff' : '#666',
                          border: 'none',
                          color: '#fff',
                          borderRadius: '4px',
                          cursor: replyText.trim() ? 'pointer' : 'not-allowed',
                          fontSize: '0.85rem'
                        }}
                      >
                        {submitting ? '...' : 'Send'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default EngagementDashboard
