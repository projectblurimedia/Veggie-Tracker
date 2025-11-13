import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faChevronLeft,
  faPhone,
  faCalendar,
  faEdit
} from '@fortawesome/free-solid-svg-icons'
import axios from 'axios'
import { Toast } from '../../components/toast/Toast'
import './orderDetails.scss'

export const OrderDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toasts, setToasts] = useState([])

  // Toast management
  const showToast = (message, type = 'error') => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message, type }])
    
    setTimeout(() => {
      removeToast(id)
    }, 5000)
  }

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  // Get initials from name
  const getInitials = (name) => {
    if (!name) return 'NA'
    const nameParts = name.split(' ')
    if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase()
    return (nameParts[0].charAt(0) + nameParts[1].charAt(0)).toUpperCase()
  }

  // Get status color based on total cost
  const getStatusColor = (totalCost) => {
    if (totalCost > 1500) return '#ef4444'
    if (totalCost > 1000) return '#f59e0b'
    if (totalCost > 500) return '#3b82f6'
    return '#10b981'
  }

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true)
        const response = await axios.get(`/orders/${id}`)
        setOrder(response.data.data)
      } catch (error) {
        console.error('Error fetching order details:', error)
        showToast('Failed to load order details', 'error')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchOrderDetails()
    }
  }, [id])

  const handleBack = () => {
    navigate(-1)
  }

  const handleEdit = () => {
    navigate(`/create-order/${id}`)
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="orderDetailsContainer">
        <div className="loadingState">
          <div className="loadingContent">
            <div className="loadingSpinner"></div>
            <h3>Loading Order Details</h3>
            <p>Please wait while we fetch the order information...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="orderDetailsContainer">
        <div className="errorState">
          <h3>Order Not Found</h3>
          <p>The requested order could not be found.</p>
          <button className="backButton" onClick={handleBack}>
            <FontAwesomeIcon icon={faChevronLeft} />
            Go Back
          </button>
        </div>
      </div>
    )
  }

  const statusColor = getStatusColor(order.totalPrice)
  const initials = getInitials(order.customerDetails?.fullName)

  return (
    <div className="orderDetailsContainer">
      {/* Toast Notifications */}
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
          position="top-right"
        />
      ))}

      {/* Header - Updated with green background and column layout */}
      <header className="orderHeader">
        <div className="left">
          <button className="backButton" onClick={handleBack}>
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
          <div className="customerHeaderInfo">
            <div className="avatarWithStatus">
              <div 
                className="customerAvatar"
                style={{ backgroundColor: statusColor }}
              >
                {initials}
              </div>
            </div>
            <div className="customerTextInfo">
              <h2>{order.customerDetails?.fullName || 'Unknown Customer'}</h2>
              <div className="customerMeta">
                <div className="metaItem">
                  <FontAwesomeIcon icon={faPhone} />
                  <span>{order.customerDetails?.phone || 'N/A'}</span>
                </div>
                <div className="metaItem">
                  <FontAwesomeIcon icon={faCalendar} />
                  <span>{formatDate(order.date)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="right">
          <div className="navIcons">  
            <button 
              className="iconBtn editBtn"
              onClick={handleEdit}
              aria-label="Edit Order"
            >
              <FontAwesomeIcon icon={faEdit} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="orderContent">
        {/* Order Summary */}
        <div className="orderSummary">
          <div className="summaryCard">
            <h3>Order Summary</h3>
            <div className="summaryDetails">
              <div className="summaryItem">
                <span className="label">Total Items:</span>
                <span className="value">{order.items?.length || 0}</span>
              </div>
              <div className="summaryItem">
                <span className="label">Total Quantity:</span>
                <span className="value">
                  {order.items?.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0).toFixed(2)} Kg
                </span>
              </div>
              <div className="summaryItem total">
                <span className="label">Total Amount:</span>
                <span className="value" style={{ color: statusColor }}>
                  ₹{order.totalPrice?.toFixed(2) || '0.00'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Items List */}
        <div className="itemsSection">
          <h2>Order Items ({order.items?.length || 0})</h2>
          <div className="itemsList">
            {order.items?.map((item, index) => (
              <div key={index} className="itemCard">
                <div className="itemHeader">
                  <h4 className="itemName">{item.name}</h4>
                  <div className="itemPrice">₹{item.price}</div>
                </div>
                <div className="itemDetails">
                  <div className="quantity">
                    <span className="label">Quantity:</span>
                    <span className="value">{item.quantity} Kg</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}