import React, { useState, useEffect, useRef } from 'react'
import './home.scss'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faCarrot,
  faUser,
  faRupeeSign,
  faCalendarAlt,
  faChevronDown,
  faSearch,
  faXmark,
  faCog,
  faPlus,
  faUsers,
  faTimes,
  faSpinner,
  faFileExport,
  faUserCircle,
  faSignOutAlt
} from '@fortawesome/free-solid-svg-icons'
import { Record } from '../../components/record/Record'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Toast } from '../../components/toast/Toast'
import * as XLSX from 'xlsx'

export const Home = ({ setIsAuth, isAdmin, setIsAdmin, username, setUsername, fullname, setFullname }) => {
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(true)
  const [exportLoading, setExportLoading] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [selectedDate, setSelectedDate] = useState('today')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [customers, setCustomers] = useState([])
  const [customDate, setCustomDate] = useState('')
  const [toasts, setToasts] = useState([])
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [error, setError] = useState('')
  const dropdownRef = useRef(null)
  const profileRef = useRef(null)

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

  // Get initials from fullname
  const getInitials = (name) => {
    if (!name) return 'NA'
    const nameParts = name.split(' ')
    if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase()
    return (nameParts[0].charAt(0) + nameParts[1].charAt(0)).toUpperCase()
  }

  const initials = getInitials(fullname)

  // Handle logout
  const handleLogout = () => {
    try {
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      setIsAuth(false) 
      setIsAdmin(false)
      setUsername('')
      setFullname('')
      setIsDropdownOpen(false)
      navigate("/login", { replace: true })
    } catch (err) {
      console.error("Error during logout:", err)
      setError("Failed to logout. Please try again.")
      showToast("Failed to logout. Please try again.", "error")
    }
  }

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          profileRef.current && !profileRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0]
  }

  // Get yesterday's date in YYYY-MM-DD format
  const getYesterdayDate = () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    return yesterday.toISOString().split('T')[0]
  }

  useEffect(() => {
    loadOrders()
  }, [selectedDate, customDate])

  const loadOrders = async () => {
    try {
      setLoading(true)
      let response

      if (selectedDate === 'today') {
        const today = getTodayDate()
        response = await axios.get(`/orders/date-range?startDate=${today}&endDate=${today}`, {
          timeout: 10000
        })
      } else if (selectedDate === 'yesterday') {
        const yesterday = getYesterdayDate()
        response = await axios.get(`/orders/date-range?startDate=${yesterday}&endDate=${yesterday}`, {
          timeout: 10000
        })
      } else if (selectedDate === 'custom' && customDate) {
        response = await axios.get(`/orders/date-range?startDate=${customDate}&endDate=${customDate}`, {
          timeout: 10000
        })
      } else if (selectedDate === 'all') {
        response = await axios.get('/orders', {
          timeout: 10000
        })
      } else {
        // Default to today if no custom date selected
        const today = getTodayDate()
        response = await axios.get(`/orders/date-range?startDate=${today}&endDate=${today}`, {
          timeout: 10000
        })
      }

      setCustomers(response.data.data || [])
      
    } catch (error) {
      console.error('Error loading orders:', error)
      let errorMessage = 'Failed to load orders'

      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout. Please try again.'
      } else if (error.response) {
        const { status, data } = error.response
        if (status === 404) {
          errorMessage = 'No orders found for selected date'
        } else if (status === 500) {
          errorMessage = 'Server error. Please try again later.'
        } else if (data.message) {
          errorMessage = data.message
        }
      } else if (error.request) {
        errorMessage = 'No response from server. Please check your connection.'
      }

      showToast(errorMessage, 'error')
      setCustomers([])
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      setExportLoading(true)

      // Use filtered customers if search is active, otherwise all customers
      const customersToExport = searchTerm ? filteredCustomers : customers
      
      if (customersToExport.length === 0) {
        showToast('No orders data to export', 'warning')
        return
      }

      // Prepare data for export
      const exportData = customersToExport.map(customer => {
        return {
          'Customer Name': customer.customerDetails?.fullName || 'Unknown Customer',
          'Phone Number': customer.customerDetails?.phone || 'N/A',
          'Total Amount': customer.totalPrice || 0,
          'Order Date': formatDateForDisplay(customer.date),
          'Number of Items': customer.items?.length || 0,
          'Items Details': customer.items?.map(item => 
            `${item.name} (${item.quantity} Kg) - ₹${item.price}`
          ).join('; ') || 'No items',
        }
      })

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(exportData)

      // Set column widths for better formatting
      const colWidths = [
        { wch: 20 }, // Order ID
        { wch: 25 }, // Customer Name
        { wch: 15 }, // Phone Number
        { wch: 15 }, // Total Amount
        { wch: 12 }, // Order Date
        { wch: 15 }, // Number of Items
        { wch: 40 }, // Items Details
        { wch: 12 }, // Status
        { wch: 12 }, // Created At
        { wch: 12 }  // Updated At
      ]
      ws['!cols'] = colWidths

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Orders Data')

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0]
      const fileName = `orders-${getDateRangeText().toLowerCase().replace(/\s+/g, '-')}-${timestamp}.xlsx`
      
      // Download the file
      XLSX.writeFile(wb, fileName)
      
      showToast(`Exported ${customersToExport.length} orders to Excel`, 'success')
      
    } catch (error) {
      console.error('Error exporting to Excel:', error)
      showToast('Failed to export data. Please try again.', 'error')
    } finally {
      setExportLoading(false)
    }
  }

  // Filter customers based on search term
  const filteredCustomers = customers.filter(customer => {
    const searchMatch = !searchTerm || 
      customer.customerDetails.fullName.toLowerCase().includes(searchTerm.toLowerCase())
    return searchMatch
  })

  // Calculate total cost for filtered customers
  const totalCost = filteredCustomers.reduce((sum, customer) => sum + customer.totalPrice, 0)

  const handleSettingsClick = () => {
    setShowSettings(!showSettings)
  }

  const handleDateSelect = (date) => {
    setSelectedDate(date)
    setShowDatePicker(false)
    
    // Reset custom date when switching to non-custom option
    if (date !== 'custom') {
      setCustomDate('')
    }
  }

  const handleCustomDateChange = (date) => {
    setCustomDate(date)
    setSelectedDate('custom')
    setShowDatePicker(false)
  }

  const handleEditClick = (customerId, e) => {
    e.stopPropagation()
    navigate(`/create-order/${customerId}`)
  }

  const handleAddItemsClick = (customerId, e) => {
    e.stopPropagation()
    navigate(`/add-items/${customerId}`)
  }

  const handleWheelOptionClick = (option) => {
    if (option === 'add') {
      navigate('/create-order')
    }

    if (option === 'owner') {
      navigate('/owner')
    }

    if (option === 'customers') {
      navigate('/customers')
    }

    setShowSettings(false)
  }

  const handleCustomerClick = (customerId) => {
    navigate(`/order/${customerId}`)
  }

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getDateRangeText = () => {
    switch (selectedDate) {
      case 'today':
        return 'Today'
      case 'yesterday':
        return 'Yesterday'
      case 'custom':
        return customDate ? formatDateForDisplay(customDate) : 'Pick a Date'
      case 'all':
        return 'All Dates'
      default:
        return 'Today'
    }
  }

  if (loading && customers.length === 0) {
    return (
      <div className="homeContainer">
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
              <FontAwesomeIcon icon={faCarrot} className="spinnerIcon" />
              <div className="spinnerRing"></div>
            </div>
            <h3>Loading Vegetable Tracker</h3>
            <p>Please wait while we fetch the latest orders...</p>
            <div className="loadingProgress">
              <div className="progressBar"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='homeContainer'>
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
            <FontAwesomeIcon icon={faCarrot} className="icon" />
            <h1 className="title">Veggie Tracker</h1>
          </div>
          <div className="header-actions">
            <button 
              className={`iconBtn searchBtn ${showSearch ? 'active' : ''}`}
              onClick={() => setShowSearch(!showSearch)}
            >
              <FontAwesomeIcon icon={faSearch} />
            </button>
            
            {/* Profile Dropdown */}
            <div className="profile" ref={profileRef}>
              <div 
                className={`initials ${isDropdownOpen ? 'active' : ''}`}
                onClick={toggleDropdown}
              >
                {initials}
              </div>
              {isDropdownOpen && (
                <div className="profileDropdown" ref={dropdownRef}>
                  <div className="profileInfo">
                    <FontAwesomeIcon icon={faUserCircle} className="profileIcon" />
                    <div className="profileDetails">
                      <div className="profileName">{fullname || 'User'}</div>
                      <div className="profileRole">{isAdmin ? 'Owner' : 'Worker'}</div>
                    </div>
                  </div>
                  <div className="dropdownMenu">
                    <button className="menuItem logout" onClick={handleLogout}>
                      <FontAwesomeIcon icon={faSignOutAlt} />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
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
              placeholder="Search by customer name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                className="clearSearch"
                onClick={() => setSearchTerm('')}
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="main-content">
        <div className="containerHeader">
          <div className="headerTop">
            <h2>Customer Orders ({filteredCustomers.length})</h2>
            <div className="dateFilter">
              <div className="filterDropdown">
                <button 
                  className="filterTrigger"
                  onClick={() => setShowDatePicker(!showDatePicker)}
                >
                  <FontAwesomeIcon icon={faCalendarAlt} />
                  {getDateRangeText()}
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
                      className={`dateOption ${selectedDate === 'all' ? 'active' : ''}`}
                      onClick={() => handleDateSelect('all')}
                    >
                      All Dates
                    </button>
                    
                    {/* Custom Date Option */}
                    <div className="customDateSection">
                      <label className="customDateLabel">Custom Date</label>
                      <input
                        type="date"
                        value={customDate}
                        onChange={(e) => handleCustomDateChange(e.target.value)}
                        className="customDateInput"
                        max={getTodayDate()}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="totalCostRow">
            <div className="totalCostDisplay">
              <span className="totalLabel">Total</span>
              <FontAwesomeIcon icon={faRupeeSign} className="rupeeIcon" />
              <span className="totalAmount">{totalCost.toFixed(2)}</span>
            </div>
            <button 
              className={`exportBtn ${exportLoading ? 'loading' : ''}`}
              onClick={handleExport}
              disabled={exportLoading || filteredCustomers.length === 0}
            >
              <FontAwesomeIcon icon={exportLoading ? faSpinner : faFileExport} spin={exportLoading} />
              {exportLoading ? 'Exporting...' : 'Export'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loadingCustomers">
            <FontAwesomeIcon icon={faSpinner} spin className="loadingIcon" />
            <span>Loading orders...</span>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="emptyState">
            <FontAwesomeIcon icon={faUser} className="emptyIcon" />
            <h3>No Orders Found</h3>
            <p>
              {selectedDate === 'custom' && !customDate 
                ? 'Please select a date to view orders'
                : `No orders found for ${getDateRangeText().toLowerCase()}`
              }
            </p>
            {selectedDate !== 'all' && (
              <button 
                className="createOrderBtn"
                onClick={() => navigate('/create-order')}
              >
                <FontAwesomeIcon icon={faPlus} />
                Create First Order
              </button>
            )}
          </div>
        ) : (
          <div className="customersGrid">
            {filteredCustomers.map((customer, index) => (
              <Record
                key={customer._id || customer.uniqueId}
                customer={{
                  id: customer._id || customer.uniqueId,
                  name: customer.customerDetails?.fullName || 'Unknown Customer',
                  totalCost: customer.totalPrice || 0,
                  items: customer.items || [],
                  date: customer.date,
                  phone: customer.customerDetails?.phone
                }}
                index={index}
                onEditClick={handleEditClick}
                onAddItemsClick={handleAddItemsClick}
                onClick={handleCustomerClick}
              />
            ))}
          </div>
        )}
      </main>

      {/* Floating Settings */}
      <div className={`floatingSettings ${showSettings ? 'active' : ''}`}>
        {/* Settings Menu - Straight Layout */}
        <div className="settingsMenu">
          <div 
            className="menuOption addOption"
            onClick={() => handleWheelOptionClick('add')}
          >
            <div className="optionIcon">
              <FontAwesomeIcon icon={faPlus} />
            </div>
            <span className="optionText">Add Order</span>
          </div>
          {
            isAdmin && 
            <div 
              className="menuOption ownerOption"
              onClick={() => handleWheelOptionClick('owner')}
            >
              <div className="optionIcon">
                <FontAwesomeIcon icon={faUser} />
              </div>
              <span className="optionText">Owner</span>
            </div>
          }
          <div 
            className="menuOption customersOption"
            onClick={() => handleWheelOptionClick('customers')}
          >
            <div className="optionIcon">
              <FontAwesomeIcon icon={faUsers} />
            </div>
            <span className="optionText">Customers</span>
          </div>
        </div>
        
        {/* Settings Button */}
        <button 
          className="settingsButton"
          onClick={handleSettingsClick}
        >
          <FontAwesomeIcon icon={showSettings ? faTimes : faCog} />
        </button>
      </div>
    </div>
  )
}