import React, { useState, useEffect } from 'react'
import '../styles/custom-alert.css'

const CustomAlert = ({ message, type = 'error', onClose, duration = 4000 }) => {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      onClose?.()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const handleClose = () => {
    setIsVisible(false)
    onClose?.()
  }

  return (
    <>
      {isVisible && (
        <div className={`custom-alert custom-alert-${type}`}>
          <div className="alert-content">
            <div className="alert-icon">
              {type === 'error' && '⚠️'}
              {type === 'success' && '✓'}
              {type === 'warning' && '⚡'}
              {type === 'info' && 'ℹ️'}
            </div>
            <div className="alert-message">
              <div className="alert-title">
                {type === 'error' && 'Black Donut'}
                {type === 'success' && 'Black Donut'}
                {type === 'warning' && 'Black Donut'}
                {type === 'info' && 'Black Donut'}
              </div>
              <div className="alert-text">{message}</div>
            </div>
            <button className="alert-close" onClick={handleClose}>
              ×
            </button>
          </div>
          <div className="alert-progress"></div>
        </div>
      )}
    </>
  )
}

export default CustomAlert
