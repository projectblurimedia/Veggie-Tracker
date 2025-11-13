import React, { useEffect, useState } from 'react'
import './toast.scss'

export const Toast = ({ 
  message, 
  type = 'info', 
  onClose, 
  duration = 5000,
  position = 'top-right'
}) => {
  const [progress, setProgress] = useState(100)
  const [isPaused, setIsPaused] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    if (isPaused || isExiting) return

    const interval = 50
    const totalSteps = duration / interval
    const decrement = 100 / totalSteps

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev <= 0) {
          clearInterval(timer)
          handleClose()
          return 0
        }
        return prev - decrement
      })
    }, interval)

    return () => clearInterval(timer)
  }, [duration, isPaused, isExiting])

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => {
      onClose()
    }, 300)
  }

  const handleMouseEnter = () => setIsPaused(true)
  const handleMouseLeave = () => setIsPaused(false)

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <div className="toast-icon-wrapper">
            <div className="toast-icon-circle success">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path 
                  d="M20 6L9 17L4 12" 
                  stroke="currentColor" 
                  strokeWidth="3" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="icon-pulse"></div>
          </div>
        )
      case 'error':
        return (
          <div className="toast-icon-wrapper">
            <div className="toast-icon-circle error">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path 
                  d="M12 8V12M12 16H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="icon-pulse"></div>
          </div>
        )
      case 'warning':
        return (
          <div className="toast-icon-wrapper">
            <div className="toast-icon-circle warning">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path 
                  d="M12 9V12M12 15H12.01M5.07183 19H18.9282C20.4678 19 21.4301 17.3333 20.6603 16L13.7321 4C12.9623 2.66667 11.0377 2.66667 10.2679 4L3.33975 16C2.56995 17.3333 3.53223 19 5.07183 19Z" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="icon-pulse"></div>
          </div>
        )
      default:
        return (
          <div className="toast-icon-wrapper">
            <div className="toast-icon-circle info">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path 
                  d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="icon-pulse"></div>
          </div>
        )
    }
  }

  return (
    <div 
      className={`toast toast-${type} toast-${position} ${isExiting ? 'toast-exit' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="toast-background-glow"></div>
      
      <div className="toast-content">
        <div className="toast-main">
          {getIcon()}
          <div className="toast-body">
            <span className="toast-message">{message}</span>
          </div>
          <button 
            className="toast-close" 
            onClick={handleClose}
            aria-label="Close notification"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path 
                d="M18 6L6 18M6 6L18 18" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
        
        <div className="toast-progress-container">
          <div 
            className="toast-progress-bar" 
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}