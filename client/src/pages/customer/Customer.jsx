import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faChevronLeft,
  faCalendarAlt,
  faChevronDown,
  faRupeeSign,
  faShoppingBag,
  faChevronUp,
  faSpinner,
  faUser,
  faPhone,
  faPlus
} from '@fortawesome/free-solid-svg-icons'
import axios from 'axios'
import { Toast } from '../../components/toast/Toast'
import './customer.scss'

export const Customer = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  
  const [loading, setLoading] = useState(true)
  const [customer, setCustomer] = useState(null)
  const [orders, setOrders] = useState([])
  const [selectedDate, setSelectedDate] = useState('all')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [expandedOrders, setExpandedOrders] = useState({})
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

  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        setLoading(true)
        
        // Fetch customer details
        const customerResponse = await axios.get(`/customers/${id}`, {
          timeout: 10000
        })

        if (customerResponse.data.success) {
          setCustomer(customerResponse.data.data)
        } else {
          throw new Error(customerResponse.data.message || 'Failed to load customer details')
        }

        // Fetch customer orders using the correct endpoint
        const ordersResponse = await axios.get(`/orders/customer/${customerResponse.data.data.uniqueId}`, {
          timeout: 10000
        })

        if (ordersResponse.data.success) {
          setOrders(ordersResponse.data.data || [])
        } else {
          // If no orders found, set empty array
          setOrders([])
        }

      } catch (error) {
        console.error('Error fetching customer data:', error)
        let errorMessage = 'Failed to load customer details'

        if (error.code === 'ECONNABORTED') {
          errorMessage = 'Request timeout. Please try again.'
        } else if (error.response) {
          const { status, data } = error.response
          if (status === 404) {
            errorMessage = 'Customer not found'
          } else if (status === 500) {
            errorMessage = 'Server error. Please try again later.'
          } else if (data.message) {
            errorMessage = data.message
          }
        } else if (error.request) {
          errorMessage = 'No response from server. Please check your connection.'
        } else {
          errorMessage = error.message
        }

        showToast(errorMessage, 'error')
        setCustomer(null)
        setOrders([])
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchCustomerData()
    }
  }, [id])

  const handleBack = () => {
    navigate(-1)
  }

  const handleCreateOrder = () => {
    if (customer) {
      navigate('/create-order', { 
        state: { 
          customer: {
            id: customer._id,
            fullName: customer.fullName,
            phone: customer.phone,
            uniqueId: customer.uniqueId
          }
        }
      })
    }
  }

  const getInitials = (name) => {
    if (!name) return 'NA'
    const nameParts = name.split(' ')
    if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase()
    return (nameParts[0].charAt(0) + nameParts[1].charAt(0)).toUpperCase()
  }

  const handleDateSelect = (date) => {
    setSelectedDate(date)
    setShowDatePicker(false)
  }

  const toggleOrderExpansion = (orderId) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }))
  }

  // Format date from ISO to readable format
  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const day = date.getDate()
    const month = date.toLocaleString('en-US', { month: 'short' })
    const year = date.getFullYear()
    return `${day} ${month}, ${year}`
  }

  // Get relative time for orders
  const getRelativeTime = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return 'Yesterday'
    if (diffDays === 0) return 'Today'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return `${Math.floor(diffDays / 30)} months ago`
  }

  // Filter orders based on selected date
  const filteredOrders = orders.filter(order => {
    const orderDate = new Date(order.date)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const lastWeek = new Date(today)
    lastWeek.setDate(lastWeek.getDate() - 7)

    switch (selectedDate) {
      case 'today':
        return orderDate.toDateString() === today.toDateString()
      case 'yesterday':
        return orderDate.toDateString() === yesterday.toDateString()
      case 'last-week':
        return orderDate >= lastWeek && orderDate <= today
      default:
        return true // All dates
    }
  })

  const totalOrdersCost = filteredOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0)
  const totalQuantity = filteredOrders.reduce((sum, order) => {
    return sum + (order.items?.reduce((itemSum, item) => itemSum + (parseFloat(item.quantity) || 0), 0) || 0)
  }, 0)

  if (loading) {
    return (
      <div className="customerDetailsContainer">
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
        
        <div className="loadingState">
          <div className="loadingContent">
            <div className="loadingSpinner">
              <FontAwesomeIcon icon={faUser} className="spinnerIcon" />
              <div className="spinnerRing"></div>
            </div>
            <h3>Loading Customer Details</h3>
            <p>Please wait while we fetch customer information...</p>
            <div className="loadingProgress">
              <div className="progressBar"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="customerDetailsContainer">
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
        
        <div className="errorState">
          <FontAwesomeIcon icon={faUser} className="errorIcon" />
          <h3>Customer Not Found</h3>
          <p>The requested customer could not be found or may have been deleted.</p>
          <button className="backButton" onClick={handleBack}>
            <FontAwesomeIcon icon={faChevronLeft} />
            Go Back to Customers
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="customerDetailsContainer">
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

      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="left">
            <button className="backButton" onClick={handleBack}>
              <FontAwesomeIcon icon={faChevronLeft} />
            </button>
            <div className="customerHeaderInfo">
              <div className="customerAvatar">
                {getInitials(customer.fullName)}
              </div>
              <div className="customerHeaderDetails">
                <h1 className="customerName">{customer.fullName}</h1>
                <div className="customerMeta">
                  <div className="metaItem">
                    <FontAwesomeIcon icon={faPhone} className="metaIcon" />
                    <span className="metaText">{customer.phone}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="header-actions">
            {/* Empty space as requested */}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* Customer Stats */}
        <div className="customerStats">
          <div className="statsRow">
            <div className="statCard">
              <div className="statContent">
                <div className="statIconWrapper">
                  <FontAwesomeIcon icon={faShoppingBag} className="statIcon" />
                </div>
                <div className="statInfo">
                  <span className="statNumber">{customer.totalOrders || 0}</span>
                  <span className="statLabel">Total Orders</span>
                </div>
              </div>
            </div>
            
            <div className="statCard">
              <div className="statContent">
                <div className="statIconWrapper">
                  <FontAwesomeIcon icon={faRupeeSign} className="statIcon" />
                </div>
                <div className="statInfo">
                  <span className="statNumber">₹{(customer.totalRevenue || 0).toLocaleString('en-IN')}</span>
                  <span className="statLabel">Total Spent</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="ordersHeader">
          <div className="headerTop">
            <h2>Order History ({filteredOrders.length})</h2>
            <div className="dateFilter">
              <div className="filterDropdown">
                <button 
                  className="filterTrigger"
                  onClick={() => setShowDatePicker(!showDatePicker)}
                >
                  <FontAwesomeIcon icon={faCalendarAlt} />
                  {selectedDate === 'today' && 'Today'}
                  {selectedDate === 'yesterday' && 'Yesterday'}
                  {selectedDate === 'last-week' && 'Last Week'}
                  {selectedDate === 'all' && 'All Dates'}
                  <FontAwesomeIcon icon={faChevronDown} className="chevron" />
                </button>
                
                {showDatePicker && (
                  <div className="datePickerDropdown">
                    <button 
                      className={`dateOption ${selectedDate === 'today' ? 'active' : ''}`}
                      onClick={() => handleDateSelect('today')}
                    >
                      Today
                    </button>
                    <button 
                      className={`dateOption ${selectedDate === 'yesterday' ? 'active' : ''}`}
                      onClick={() => handleDateSelect('yesterday')}
                    >
                      Yesterday
                    </button>
                    <button 
                      className={`dateOption ${selectedDate === 'last-week' ? 'active' : ''}`}
                      onClick={() => handleDateSelect('last-week')}
                    >
                      Last Week
                    </button>
                    <button 
                      className={`dateOption ${selectedDate === 'all' ? 'active' : ''}`}
                      onClick={() => handleDateSelect('all')}
                    >
                      All Dates
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="totalCostRow">
            <div className="totalCostDisplay">
              <span className="totalLabel">Total</span>
              <FontAwesomeIcon icon={faRupeeSign} className="rupeeIcon" />
              <span className="totalAmount">{totalOrdersCost.toFixed(2)}</span>
              <span className="totalQuantity">({totalQuantity.toFixed(2)} Kg)</span>
            </div>
          </div>
        </div>

        <div className="ordersList">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => (
              <div key={order._id} className="orderCard">
                <div 
                  className="orderHeader"
                  onClick={() => toggleOrderExpansion(order._id)}
                >
                  <div className="orderHeaderLeft">
                    <div className="orderDateInfo">
                      <h3 className="orderDate">{formatDate(order.date)}</h3>
                      <span className="orderTime">{getRelativeTime(order.date)}</span>
                    </div>
                    <div className="orderTotal">
                      <FontAwesomeIcon icon={faRupeeSign} className="rupeeIcon" />
                      <span className="totalAmount">{order.totalPrice?.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>
                  <button className="expandButton">
                    <FontAwesomeIcon 
                      icon={expandedOrders[order._id] ? faChevronUp : faChevronDown} 
                      className="expandIcon" 
                    />
                  </button>
                </div>
                
                {expandedOrders[order._id] && (
                  <div className="orderItems">
                    {order.items && order.items.length > 0 ? (
                      order.items.map((item, itemIndex) => (
                        <div key={itemIndex} className="orderItem">
                          <div className="itemInfo">
                            <span className="itemName">{item.name}</span>
                            <span className="itemQuantity">Qty: {item.quantity} Kg</span>
                          </div>
                          <div className="itemCost">
                            <FontAwesomeIcon icon={faRupeeSign} className="rupeeIcon" />
                            <span className="costAmount">{item.price}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="noItems">No items in this order</div>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="emptyState">
              <FontAwesomeIcon icon={faShoppingBag} className="emptyIcon" />
              <h3>No Orders Found</h3>
              <p>
                {selectedDate !== 'all' 
                  ? `No orders found for the selected date range.`
                  : "This customer hasn't placed any orders yet."
                }
              </p>
              {selectedDate === 'all' && (
                <button 
                  className="createOrderBtn"
                  onClick={handleCreateOrder}
                >
                  <FontAwesomeIcon icon={faPlus} />
                  Create First Order
                </button>
              )}
              {selectedDate === 'today' && (
                <button 
                  className="createOrderBtn"
                  onClick={handleCreateOrder}
                >
                  <FontAwesomeIcon icon={faPlus} />
                  Create Order Today
                </button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}