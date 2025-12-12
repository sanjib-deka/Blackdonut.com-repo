import React, { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import ShinyText from '../../components/ShinyText'
import gsap from 'gsap'
import '../../styles/tagline-shiny.css'

const IntroDekstop = () => {
  const buttonRef = useRef(null)
  const rippleContainerRef = useRef(null)
  const navigate = useNavigate()

  const handleButtonClick = () => {
    if (!rippleContainerRef.current) return

    // Create 3 ripples with staggered timing
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        const ripple = document.createElement('div')
        ripple.style.position = 'absolute'
        ripple.style.borderRadius = '50%'
        ripple.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'
        ripple.style.pointerEvents = 'none'
        ripple.style.top = '50%'
        ripple.style.left = '50%'
        ripple.style.width = '0px'
        ripple.style.height = '0px'
        ripple.style.transform = 'translate(-50%, -50%)'
        ripple.style.filter = 'blur(2px)'

        rippleContainerRef.current.appendChild(ripple)

        gsap.to(ripple, {
          width: '300px',
          height: '300px',
          opacity: 0,
          filter: 'blur(20px)',
          duration: 1.2,
          ease: 'power2.out',
          onComplete: () => {
            ripple.remove()
          }
        })
      }, i * 250)
    }

    // Navigate after ripple effect starts
    setTimeout(() => {
      navigate('/home')
    }, 800)
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100dvh',
        backgroundImage: 'url(/BG-Dekstop.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        backgroundColor: '#000',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        
        {/* Radial gradient overlay for center darkening */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '900px',
            height: '900px',
            background: 'radial-gradient(ellipse at center, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.15) 40%, rgba(0, 0, 0, 0) 100%)',
            pointerEvents: 'none',
            zIndex: 1
          }}
        />

        {/* Top-left Brand Name */}
        <div
          style={{
            position: 'absolute',
            top: '30px',
            left: '30px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            zIndex: 5,
            color: '#ffffff'
          }}
        >
          <img
            src="/bottombardonot.png"
            alt="Black Donut Logo"
            style={{
              height: '65px',
              width: 'auto',
              objectFit: 'contain'
            }}
          />
          <ShinyText
            text="Black Donut"
            speed={3}
            className="brand-name-shiny"
          />
        </div>

        <div
          ref={rippleContainerRef}
          style={{
            position: 'absolute',
            top: '55%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '300px',
            height: '300px',
            pointerEvents: 'none',
            zIndex: 5
          }}
        />

        {/* Center Content Container */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 8
          }}
        >
          {/* Tagline */}
          <div
            style={{
              marginBottom: '40px',
              pointerEvents: 'none',
              fontSize: 'clamp(14px, 5vw, 24px)',
              fontWeight: '700',
              textAlign: 'center',
              maxWidth: '90vw',
              width: '500px',
              lineHeight: '1.6',
              letterSpacing: '0.5px',
              color: '#ffffff'
            }}
          >
            Discover culinary excellence and hidden food gems
          </div>

          {/* Square Button with Rounded Corners */}
          <button
            ref={buttonRef}
            onClick={handleButtonClick}
            style={{
              position: 'relative',
              padding: '18px 50px',
              fontSize: '16px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              color: '#000000',
              backgroundColor: '#e8e7e0',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              boxShadow: `
                0 0 25px rgba(192, 191, 184, 0.3),
                0 0 50px rgba(192, 191, 184, 0.1),
                0 10px 30px rgba(0, 0, 0, 0.3)
              `,
              transition: 'all 0.3s ease',
              zIndex: 10,
              outline: 'none',
              pointerEvents: 'auto'
            }}
            onMouseEnter={e => {
              gsap.to(e.target, {
                backgroundColor: '#000000',
                color: '#ffffff',
                boxShadow: `
                  0 0 35px rgba(0, 0, 0, 0.6),
                  0 0 70px rgba(0, 0, 0, 0.4),
                  0 15px 40px rgba(0, 0, 0, 0.5)
                `,
                y: -4,
                duration: 0.3
              })
            }}
            onMouseLeave={e => {
              gsap.to(e.target, {
                backgroundColor: '#c0bfb8',
                color: '#000000',
                boxShadow: `
                  0 0 25px rgba(192, 191, 184, 0.3),
                  0 0 50px rgba(192, 191, 184, 0.1),
                  0 10px 30px rgba(0, 0, 0, 0.3)
                `,
                y: 0,
                duration: 0.3
              })
            }}
          >
            Get Started
          </button>
        </div>

        {/* Copyright Footer - Desktop Only */}
        <div
          style={{
            position: 'absolute',
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
      </div>
    </div>
  )
}

export default IntroDekstop
