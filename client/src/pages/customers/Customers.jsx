import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faChevronLeft,
  faSearch,
  faUser,
  faPhone,
  faShoppingBag,
  faRupeeSign,
  faTimes,
  faSpinner,
  faCheckCircle,
  faClock,
  faExclamationTriangle,
  faFileInvoiceDollar,
  faFilter
} from '@fortawesome/free-solid-svg-icons'
import axios from 'axios'
import { Toast } from '../../components/toast/Toast'
import './customers.scss'

export const Customers = () => {
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(true)
  const [showSearch, setShowSearch] = useState(false)
  const [showFilter, setShowFilter] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [customers, setCustomers] = useState([])
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalOutstanding: 0,
    totalPaid: 0
  })
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
    loadCustomers()
  }, [])

  const loadCustomers = async (status = 'all') => {
    try {
      setLoading(true)
      let url = '/customers'
      if (status !== 'all') {
        url = `/customers/status/${status}`
      }

      const response = await axios.get(url, {
        timeout: 10000
      })

      if (response.data.success) {
        setCustomers(response.data.data || [])
        setStats(response.data.stats || {
          totalCustomers: 0,
          totalOrders: 0,
          totalRevenue: 0,
          totalOutstanding: 0,
          totalPaid: 0
        })
      } else {
        throw new Error(response.data.message || 'Failed to load customers')
      }
    } catch (error) {
      console.error('Error loading customers:', error)
      let errorMessage = 'Failed to load customers'

      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout. Please try again.'
      } else if (error.response) {
        const { status, data } = error.response
        if (status === 404) {
          errorMessage = 'No customers found'
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
      setCustomers([])
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    navigate(-1)
  }

  const getInitials = (name) => {
    if (!name) return 'NA'
    const nameParts = name.split(' ')
    if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase()
    return (nameParts[0].charAt(0) + nameParts[1].charAt(0)).toUpperCase()
  }

  const getPaymentStatusInfo = (customer) => {
    if (customer.paymentSummary === 'paid') {
      return { 
        icon: faCheckCircle, 
        color: '#10b981', 
        label: 'Paid',
        amount: null
      }
    } else if (customer.paymentSummary === 'partial') {
      return { 
        icon: faClock, 
        color: '#f59e0b', 
        label: `₹${customer.outstandingBalance.toLocaleString('en-IN')} Due`,
        amount: customer.outstandingBalance
      }
    } else if (customer.paymentSummary === 'pending') {
      return { 
        icon: faExclamationTriangle, 
        color: '#ef4444', 
        label: `₹${customer.outstandingBalance.toLocaleString('en-IN')} Due`,
        amount: customer.outstandingBalance
      }
    } else {
      return { 
        icon: faFileInvoiceDollar, 
        color: '#6b7280', 
        label: 'No Orders',
        amount: null
      }
    }
  }

  const handleCustomerClick = (customerId) => {
    navigate(`/customers/${customerId}`)
  }

  const handleClearSearch = () => {
    setSearchTerm('')
  }

  const handleFilterChange = (status) => {
    setFilterStatus(status)
    setShowFilter(false)
    loadCustomers(status)
  }

  const handleClearFilter = () => {
    setFilterStatus('all')
    loadCustomers('all')
  }

  // Filter customers based on search term
  const filteredCustomers = customers.filter(customer =>
    !searchTerm ||
    customer.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  )

  const paymentStatusOptions = [
    { value: 'all', label: 'All Customers', icon: faUser, color: '#3b82f6' },
    { value: 'paid', label: 'Paid', icon: faCheckCircle, color: '#10b981' },
    { value: 'partial', label: 'Partial', icon: faClock, color: '#f59e0b' },
    { value: 'pending', label: 'Pending', icon: faExclamationTriangle, color: '#ef4444' },
    { value: 'no-orders', label: 'No Orders', icon: faFileInvoiceDollar, color: '#6b7280' }
  ]

  if (loading) {
    return (
      <div className="customersContainer">
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
            <h3>Loading Customers</h3>
            <p>Please wait while we fetch customer data...</p>
            <div className="loadingProgress">
              <div className="progressBar"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="customersContainer">
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
            <FontAwesomeIcon icon={faUser} className="icon" />
            <h1 className="title">Customers</h1>
          </div>
          <div className="header-actions">
            <div className="filterWrapper">
              <button 
                className={`iconBtn filterBtn ${showFilter ? 'active' : ''}`}
                onClick={() => setShowFilter(!showFilter)}
              >
                <FontAwesomeIcon icon={faFilter} />
              </button>
              
              {/* Filter Dropdown */}
              {showFilter && (
                <div className="filterDropdown">
                  <div className="filterContainer">
                    <div className="filterHeader">
                      <h3>Filter by Payment Status</h3>
                      <button 
                        className="closeFilter"
                        onClick={() => setShowFilter(false)}
                      >
                        <FontAwesomeIcon icon={faTimes} />
                      </button>
                    </div>
                    <div className="filterOptions">
                      {paymentStatusOptions.map(option => (
                        <button
                          key={option.value}
                          className={`filterOption ${filterStatus === option.value ? 'active' : ''}`}
                          onClick={() => handleFilterChange(option.value)}
                        >
                          <FontAwesomeIcon 
                            icon={option.icon} 
                            className="filterIcon"
                            style={{ color: option.color }}
                          />
                          <span className="filterLabel">{option.label}</span>
                          {filterStatus === option.value && (
                            <div className="activeIndicator" style={{ backgroundColor: option.color }} />
                          )}
                        </button>
                      ))}
                    </div>
                    {filterStatus !== 'all' && (
                      <button 
                        className="clearFilterBtn"
                        onClick={handleClearFilter}
                      >
                        Clear Filter
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <button 
              className={`iconBtn searchBtn ${showSearch ? 'active' : ''}`}
              onClick={() => setShowSearch(!showSearch)}
            >
              <FontAwesomeIcon icon={faSearch} />
            </button>
          </div>
        </div>
      </header>

      {/* Search Section */}
      {showSearch && (
        <div className="searchSection">
          <div className="searchContainer">
            <FontAwesomeIcon icon={faSearch} className="searchIcon" />
            <input
              type="text"
              placeholder="Search by name or phone number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="searchInput"
            />
            {searchTerm && (
              <button 
                className="clearSearch"
                onClick={handleClearSearch}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="main-content">
        <div className="customersHeader">          
          {/* Stats Row */}
          <div className="statsRow">
            <div className="statCard">
              <div className="statContent">
                <div className="statIconWrapper customers">
                  <FontAwesomeIcon icon={faUser} className="statIcon" />
                </div>
                <div className="statInfo">
                  <span className="statNumber">{stats.totalCustomers}</span>
                  <span className="statLabel">Total Customers</span>
                </div>
              </div>
            </div>
            
            <div className="statCard">
              <div className="statContent">
                <div className="statIconWrapper orders">
                  <FontAwesomeIcon icon={faShoppingBag} className="statIcon" />
                </div>
                <div className="statInfo">
                  <span className="statNumber">{stats.totalOrders}</span>
                  <span className="statLabel">Total Orders</span>
                </div>
              </div>
            </div>

            <div className="statCard">
              <div className="statContent">
                <div className="statIconWrapper revenue">
                  <FontAwesomeIcon icon={faRupeeSign} className="statIcon" />
                </div>
                <div className="statInfo">
                  <span className="statNumber">₹{stats.totalRevenue.toLocaleString('en-IN')}</span>
                  <span className="statLabel">Total Revenue</span>
                </div>
              </div>
            </div>

            <div className="statCard">
              <div className="statContent">
                <div className="statIconWrapper outstanding">
                  <FontAwesomeIcon icon={faFileInvoiceDollar} className="statIcon" />
                </div>
                <div className="statInfo">
                  <span className="statNumber">₹{stats.totalOutstanding.toLocaleString('en-IN')}</span>
                  <span className="statLabel">Balance</span>
                </div>
              </div>
            </div>
          </div>

          <div className="headerTop">
            <h2>
              {filterStatus !== 'all' ? (
                `${paymentStatusOptions.find(opt => opt.value === filterStatus)?.label}`
              ) : searchTerm ? (
                `Search Results`
              ) : (
                `All Customers`
              )} 
              ({filteredCustomers.length})
            </h2>
            {filterStatus !== 'all' && (
              <button 
                className="clearFilterBadge"
                onClick={handleClearFilter}
              >
                {paymentStatusOptions.find(opt => opt.value === filterStatus)?.label}
                <FontAwesomeIcon icon={faTimes} />
              </button>
            )}
          </div>
        </div>

        <div className="customersList">
          {filteredCustomers.length > 0 ? (
            filteredCustomers.map((customer) => {
              const paymentStatus = getPaymentStatusInfo(customer)
              
              return (
                <div 
                  key={customer._id || customer.id} 
                  className="customerCard"
                  onClick={() => handleCustomerClick(customer._id || customer.id)}
                >
                  <div className="customerDesktopLayout">
                    <div className="customerBasicInfo">
                      <div className="customerAvatar">
                        {getInitials(customer.fullName)}
                      </div>
                      <div className="customerDetails">
                        <h3 className="customerName">{customer.fullName}</h3>
                        <div className="customerContact">
                          <FontAwesomeIcon icon={faPhone} className="contactIcon" />
                          <span className="contactText">{customer.phone}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="customerStatsDesktop">
                      <div className="statItem">
                        <FontAwesomeIcon icon={faShoppingBag} className="statIcon" />
                        <div className="statContent">
                          <span className="statValue">{customer.totalOrders || 0}</span>
                          <span className="statLabel">Orders</span>
                        </div>
                      </div>
                      <div className="statItem">
                        <FontAwesomeIcon icon={faRupeeSign} className="statIcon" />
                        <div className="statContent">
                          <span className="statValue">₹{(customer.totalRevenue || 0).toLocaleString('en-IN')}</span>
                          <span className="statLabel">Total Amount</span>
                        </div>
                      </div>
                      <div className="statItem payment-status">
                        <FontAwesomeIcon 
                          icon={paymentStatus.icon} 
                          className="statIcon" 
                          style={{ color: paymentStatus.color }} 
                        />
                        <div className="statContent">
                          <span 
                            className="statValue" 
                            style={{ color: paymentStatus.color }}
                          >
                            {paymentStatus.label}
                          </span>
                          <span className="statLabel">Status</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Layout */}
                  <div className="customerMobileLayout">
                    <div className="customerBasicInfoMobile">
                      <div className="customerAvatar">
                        {getInitials(customer.fullName)}
                      </div>
                      <div className="customerDetails">
                        <h3 className="customerName">{customer.fullName}</h3>
                        <div className="customerContact">
                          <FontAwesomeIcon icon={faPhone} className="contactIcon" />
                          <span className="contactText">{customer.phone}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="customerStatsMobile">
                      <div className="statItemMobile">
                        <FontAwesomeIcon icon={faShoppingBag} className="statIcon" />
                        <span className="statText">{customer.totalOrders || 0} orders</span>
                      </div>
                      <div className="statItemMobile">
                        <FontAwesomeIcon icon={faRupeeSign} className="statIcon" />
                        <span className="statText">₹{(customer.totalRevenue || 0).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="statItemMobile payment-status">
                        <FontAwesomeIcon 
                          icon={paymentStatus.icon} 
                          className="statIcon" 
                          style={{ color: paymentStatus.color }} 
                        />
                        <span 
                          className="statText" 
                          style={{ color: paymentStatus.color }}
                        >
                          {paymentStatus.label}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="emptyState">
              <FontAwesomeIcon icon={faUser} className="emptyIcon" />
              <h3>No Customers Found</h3>
              <p>
                {searchTerm 
                  ? `No customers match "${searchTerm}"`
                  : filterStatus !== 'all'
                  ? `No customers with ${paymentStatusOptions.find(opt => opt.value === filterStatus)?.label.toLowerCase()} status`
                  : "No customers available. Create your first customer to get started."
                }
              </p>
              {!searchTerm && filterStatus === 'all' && (
                <button 
                  className="createCustomerBtn"
                  onClick={() => navigate('/create-customer')}
                >
                  <FontAwesomeIcon icon={faUser} />
                  Create First Customer
                </button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}