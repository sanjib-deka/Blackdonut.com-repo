import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import gsap from 'gsap'
import API_CONFIG from '../utils/apiConfig'

const CommentsSection = ({ foodId, currentUser, isOwner = false, onClose }) => {
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const modalRef = useRef(null)

  useEffect(() => {
    fetchComments()
  }, [foodId])

  const fetchComments = async () => {
    try {
      setLoading(true)
      const res = await axios.get(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.COMMENTS.GET(foodId)}`, {
        withCredentials: true
      })
      setComments(res.data.comments || [])
    } catch (err) {
      // console.error('Fetch comments error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return

    setSubmitting(true)
    try {
      const res = await axios.post(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.COMMENTS.CREATE}`, 
        { foodId, text: newComment },
        { withCredentials: true }
      )
      setComments([res.data.comment, ...comments])
      setNewComment('')
    } catch (err) {
      // console.error('Add comment error:', err)
      alert('Failed to add comment')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return

    try {
      await axios.delete(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.COMMENTS.DELETE(commentId)}`, {
        withCredentials: true
      })
      setComments(comments.filter(c => c._id !== commentId))
    } catch (err) {
      // console.error('Delete comment error:', err)
      alert('Failed to delete comment')
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
      // console.error('Pin comment error:', err)
      alert('Failed to pin comment')
    }
  }

  const handleDeleteAsOwner = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return

    try {
      await axios.delete(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.COMMENTS.ENGAGEMENT(commentId)}`, {
        withCredentials: true
      })
      setComments(comments.filter(c => c._id !== commentId))
    } catch (err) {
      // console.error('Delete comment error:', err)
      alert('Failed to delete comment')
    }
  }

  const handleReply = async (commentId, replyText) => {
    try {
      const res = await axios.post(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.COMMENTS.REPLY(commentId)}`,
        { text: replyText },
        { withCredentials: true }
      )
      setComments(comments.map(c => c._id === commentId ? res.data.comment : c))
    } catch (err) {
      // console.error('Reply error:', err)
      alert('Failed to add reply')
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
      alignItems: 'flex-end'
    }} onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div
        ref={modalRef}
        style={{
          background: '#000',
          borderRadius: '12px 12px 0 0',
          width: '100%',
          maxWidth: '600px',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          margin: '0 auto'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px',
          borderBottom: '1px solid #333',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ margin: 0, color: '#fff' }}>Comments ({comments.length})</h3>
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

        {/* Comments List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {loading ? (
            <div style={{ color: '#999', textAlign: 'center', padding: '20px' }}>Loading...</div>
          ) : comments.length === 0 ? (
            <div style={{ color: '#999', textAlign: 'center', padding: '20px' }}>
              No comments yet. Be the first!
            </div>
          ) : (
            comments.map((comment) => (
              <CommentItem
                key={comment._id}
                comment={comment}
                currentUser={currentUser}
                isOwner={isOwner}
                onDelete={() => handleDeleteComment(comment._id)}
                onDeleteAsOwner={() => handleDeleteAsOwner(comment._id)}
                onPin={() => handlePinComment(comment._id)}
                onReply={(text) => handleReply(comment._id, text)}
              />
            ))
          )}
        </div>

        {/* Add Comment Form */}
        {currentUser && (
          <form onSubmit={handleAddComment} style={{
            padding: '12px',
            borderTop: '1px solid #333',
            display: 'flex',
            gap: '8px'
          }}>
            <input
              type="text"
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              disabled={submitting}
              style={{
                flex: 1,
                padding: '10px 12px',
                background: '#111',
                border: '1px solid #333',
                color: '#fff',
                borderRadius: '6px',
                fontSize: '0.9rem'
              }}
            />
            <button
              type="submit"
              disabled={submitting || !newComment.trim()}
              style={{
                padding: '10px 16px',
                background: newComment.trim() ? '#1e6aff' : '#666',
                border: 'none',
                color: '#fff',
                borderRadius: '6px',
                cursor: newComment.trim() ? 'pointer' : 'not-allowed',
                fontSize: '0.9rem'
              }}
            >
              {submitting ? '...' : 'Post'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

const CommentItem = ({ comment, currentUser, isOwner, onDelete, onDeleteAsOwner, onPin, onReply }) => {
  const [showReplyInput, setShowReplyInput] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmitReply = async () => {
    if (!replyText.trim()) return
    setSubmitting(true)
    try {
      await onReply(replyText)
      setReplyText('')
      setShowReplyInput(false)
    } finally {
      setSubmitting(false)
    }
  }

  const isCommentOwner = currentUser && String(comment.user._id) === String(currentUser._id)

  return (
    <div style={{
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

      {/* Comment Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '8px'
      }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff' }}>
              {comment.user?.name || 'User'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#999' }}>
              {new Date(comment.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {isOwner && (
            <>
              <button
                onClick={() => onPin()}
                title={comment.isPinned ? 'Unpin' : 'Pin'}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: comment.isPinned ? '#1e6aff' : '#999',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                📌
              </button>
              <button
                onClick={() => onDeleteAsOwner()}
                title="Delete"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ff3b30',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                🗑️
              </button>
            </>
          )}
          {isCommentOwner && !isOwner && (
            <button
              onClick={() => onDelete()}
              title="Delete"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ff3b30',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              🗑️
            </button>
          )}
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
            {comment.reply.author?.name || 'Owner'} (Owner)
          </div>
          <div style={{ color: '#ddd' }}>
            {comment.reply.text}
          </div>
        </div>
      )}

      {/* Reply Button (only for owner) */}
      {isOwner && !comment.reply && (
        <button
          onClick={() => setShowReplyInput(!showReplyInput)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#1e6aff',
            cursor: 'pointer',
            fontSize: '0.85rem',
            padding: 0
          }}
        >
          Reply
        </button>
      )}

      {/* Reply Input */}
      {showReplyInput && (
        <div style={{
          marginTop: '8px',
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
            onClick={handleSubmitReply}
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
            {submitting ? '...' : 'Reply'}
          </button>
        </div>
      )}
    </div>
  )
}

export default CommentsSection
