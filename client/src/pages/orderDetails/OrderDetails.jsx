import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faChevronLeft,
  faPhone,
  faCalendar,
  faEdit,
  faCheckCircle,
  faClock,
  faReceipt,
  faRupeeSign,
  faBoxes,
  faWeightHanging
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

  // Get status color based on payment status
  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return '#10b981' // Green
      case 'partial':
        return '#f59e0b' // Amber
      case 'pending':
        return '#ef4444' // Red
      default:
        return '#10b981'
    }
  }

  const getPaymentIcon = (status) => {
    switch (status) {
      case 'paid':
        return faCheckCircle
      case 'partial':
        return faReceipt
      case 'pending':
        return faClock
      default:
        return faClock
    }
  }

  const getPaymentText = (status, balance) => {
    switch (status) {
      case 'paid':
        return 'Paid'
      case 'partial':
        return `₹${balance.toFixed(0)} Due`
      case 'pending':
        return `₹${balance.toFixed(0)} Due`
      default:
        return balance > 0 ? `₹${balance.toFixed(0)} Due` : 'Paid'
    }
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

  const statusColor = getStatusColor(order.paymentStatus)
  const paymentIcon = getPaymentIcon(order.paymentStatus)
  const paymentText = getPaymentText(order.paymentStatus, order.balanceAmount)
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

      {/* Header - Clean design without date */}
      <header className="orderHeader">
        <div className="headerContent">
          <div className="leftSection">
            <button className="backButton" onClick={handleBack}>
              <FontAwesomeIcon icon={faChevronLeft} />
            </button>
            <div className="customerInfo">
              <div className="customerAvatar">
                {initials}
              </div>
              <div className="customerDetails">
                <h1>{order.customerDetails?.fullName || 'Unknown Customer'}</h1>
                <div className="phoneInfo">
                  <FontAwesomeIcon icon={faPhone} />
                  <span>{order.customerDetails?.phone || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="rightSection">
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

      {/* Order Info Cards Below Header */}
      <div className="orderInfoCards">
        <div className="infoCard dateCard">
          <FontAwesomeIcon icon={faCalendar} className="cardIcon" />
          <div className="cardContent">
            <span className="cardLabel">Order Date</span>
            <span className="cardValue">{formatDate(order.date)}</span>
          </div>
        </div>
        
        <div className="infoCard totalAmountCard">
          <FontAwesomeIcon icon={faRupeeSign} className="cardIcon" />
          <div className="cardContent">
            <span className="cardLabel">Total Amount</span>
            <span className="cardValue">₹{order.totalAmount?.toFixed(2) || order.totalPrice?.toFixed(2) || '0.00'}</span>
          </div>
        </div>

        <div className="infoCard paymentStatusCard">
          <FontAwesomeIcon icon={paymentIcon} className="cardIcon" style={{ color: statusColor }} />
          <div className="cardContent">
            <span className="cardLabel">Payment Status</span>
            <span className="cardValue" style={{ color: statusColor }}>{paymentText}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="orderContent">
        {/* Payment Summary */}
        <div className="paymentSummary">
          <div className="summaryCard">
            <h3>Payment Summary</h3>
            <div className="summaryDetails">
              <div className="summaryItem">
                <span className="label">Total Amount:</span>
                <span className="value">₹{order.totalAmount?.toFixed(2) || order.totalPrice?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="summaryItem">
                <span className="label">Amount Paid:</span>
                <span className="value paid">₹{order.totalPaid?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="summaryItem total">
                <span className="label">Balance Due:</span>
                <span className="value due">₹{order.balanceAmount?.toFixed(2) || '0.00'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Items List - Designed like Record component */}
        <div className="itemsSection">
          <div className="sectionHeader">
            <h2 className="sectionTitle">Order Items</h2>
            <div className="itemsCountBadge">
              <FontAwesomeIcon icon={faBoxes} />
              <span>{order.items?.length || 0} items</span>
            </div>
          </div>
          
          <div className="itemsList">
            {order.items?.map((item, index) => (
              <div key={index} className="itemCard">
                <div className="itemContent">
                  <div className="itemMain">
                    <span className="itemName">{item.name}</span>
                    <div className="itemStats">
                      <div className="stat">
                        <FontAwesomeIcon icon={faWeightHanging} className="statIcon" />
                        <span className="statLabel">Quantity:</span>
                        <span className="statValue">{item.quantity}</span>
                      </div>
                      <div className="stat">                      
                        <span className="statLabel">Total:</span>
                        <span className="statValue">{item.price}/-</span>
                      </div>
                    </div>
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