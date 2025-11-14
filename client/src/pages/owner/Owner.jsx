import { useState, useEffect, useRef } from 'react'
import './owner.scss'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faRupeeSign,
  faCalendarAlt,
  faChevronDown,
  faSearch,
  faXmark,
  faChevronLeft,
  faEdit,
  faPlus,
  faReceipt,
  faSpinner,
  faFileExport,
  faUserCircle,
  faSignOutAlt,
  faTimes,
  faWeightHanging,
  faBoxes,
  faChevronUp
} from '@fortawesome/free-solid-svg-icons'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Toast } from '../../components/toast/Toast'
import * as XLSX from 'xlsx'

export const Owner = ({ setIsAuth, isAdmin, setIsAdmin, username, setUsername, fullname, setFullname }) => {
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(true)
  const [exportLoading, setExportLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState('today')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [customDate, setCustomDate] = useState('')
  const [ownerExpenses, setOwnerExpenses] = useState([])
  const [toasts, setToasts] = useState([])
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  
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

  // Format date for display
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Get relative day text
  const getRelativeDay = (dateString) => {
    const today = new Date().toISOString().split('T')[0]
    const yesterday = getYesterdayDate()
    
    if (dateString === today) return 'Today'
    if (dateString === yesterday) return 'Yesterday'
    
    const date = new Date(dateString)
    const diffTime = Math.abs(new Date() - date)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  }

  useEffect(() => {
    loadOwnerExpenses()
  }, [selectedDate, customDate])

  const loadOwnerExpenses = async () => {
    try {
      setLoading(true)
      let response

      if (selectedDate === 'today') {
        const today = getTodayDate()
        response = await axios.get(`/owner-records/date/${today}`, {
          timeout: 10000
        })
      } else if (selectedDate === 'yesterday') {
        const yesterday = getYesterdayDate()
        response = await axios.get(`/owner-records/date/${yesterday}`, {
          timeout: 10000
        })
      } else if (selectedDate === 'custom' && customDate) {
        response = await axios.get(`/owner-records/date/${customDate}`, {
          timeout: 10000
        })
      } else if (selectedDate === 'all') {
        response = await axios.get('/owner-records', {
          timeout: 10000
        })
      } else {
        // Default to today if no custom date selected
        const today = getTodayDate()
        response = await axios.get(`/owner-records/date/${today}`, {
          timeout: 10000
        })
      }

      // Filter for expense records only
      const expenseRecords = (response.data.data || []).filter(record => 
        record.recordType === 'EXPENSE'
      )
      
      setOwnerExpenses(expenseRecords)
      
    } catch (error) {
      console.error('Error loading owner expenses:', error)
      let errorMessage = 'Failed to load expenses'

      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout. Please try again.'
      } else if (error.response) {
        const { status, data } = error.response
        if (status === 404) {
          errorMessage = 'No expenses found for selected date'
        } else if (status === 500) {
          errorMessage = 'Server error. Please try again later.'
        } else if (data.message) {
          errorMessage = data.message
        }
      } else if (error.request) {
        errorMessage = 'No response from server. Please check your connection.'
      }

      showToast(errorMessage, 'error')
      setOwnerExpenses([])
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      setExportLoading(true)

      // Use filtered expenses if search is active, otherwise all expenses
      const expensesToExport = searchTerm ? filteredExpenses : ownerExpenses
      
      if (expensesToExport.length === 0) {
        showToast('No expense data to export', 'warning')
        return
      }

      // Prepare data for export
      const exportData = expensesToExport.map(expense => {
        return {
          'Date': formatDateForDisplay(expense.date),
          'Total Amount': expense.totalPrice || 0,
          'Number of Items': expense.items?.length || 0,
          'Items Details': expense.items?.map(item => 
            `${item.name} (${item.quantity}) - ₹${item.price}`
          ).join('; ') || 'No items',
          'Description': expense.description || 'N/A',
          'Record Type': expense.recordType || 'EXPENSE'
        }
      })

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(exportData)

      // Set column widths for better formatting
      const colWidths = [
        { wch: 15 }, // Date
        { wch: 15 }, // Total Amount
        { wch: 15 }, // Number of Items
        { wch: 40 }, // Items Details
        { wch: 20 }, // Description
        { wch: 12 }  // Record Type
      ]
      ws['!cols'] = colWidths

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Expenses Data')

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0]
      const fileName = `expenses-${getDateRangeText().toLowerCase().replace(/\s+/g, '-')}-${timestamp}.xlsx`
      
      // Download the file
      XLSX.writeFile(wb, fileName)
      
      showToast(`Exported ${expensesToExport.length} expenses to Excel`, 'success')
      
    } catch (error) {
      console.error('Error exporting to Excel:', error)
      showToast('Failed to export data. Please try again.', 'error')
    } finally {
      setExportLoading(false)
    }
  }

  // Filter expenses based on search term
  const filteredExpenses = ownerExpenses.filter(expense => {
    const searchMatch = !searchTerm || 
      expense.items?.some(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      ) ||
      (expense.description && expense.description.toLowerCase().includes(searchTerm.toLowerCase()))
    return searchMatch
  })

  // Calculate total cost for filtered expenses
  const totalCost = filteredExpenses.reduce((sum, expense) => sum + (expense.totalPrice || 0), 0)

  const getStatusColor = (totalCost) => {
    if (totalCost > 4000) return '#ef4444'
    if (totalCost > 3000) return '#f59e0b'
    if (totalCost > 2000) return '#3b82f6'
    return '#10b981'
  }

  const handleBack = () => {
    navigate(-1)
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

  const handleEditClick = (expenseId, e) => {
    e.stopPropagation()
    navigate(`/owner/create-expense/${expenseId}`)
  }

  const handleExpenseClick = (expenseId) => {
    navigate(`/expense/${expenseId}`)
  }

  const handleSettingsClick = () => {
    setShowSettings(!showSettings)
  }

  const handleCreateExpenseClick = () => {
    navigate('/owner/create-expense')
    setShowSettings(false)
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

  if (loading && ownerExpenses.length === 0) {
    return (
      <div className="ownerContainer">
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
              <FontAwesomeIcon icon={faReceipt} className="spinnerIcon" />
              <div className="spinnerRing"></div>
            </div>
            <h3>Loading Owner Expenses</h3>
            <p>Please wait while we fetch your expense records...</p>
            <div className="loadingProgress">
              <div className="progressBar"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='ownerContainer'>
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
            <FontAwesomeIcon icon={faReceipt} className="icon" />
            <h1 className="title">Owner Expenses</h1>
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
              placeholder="Search by item name or description..."
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
            <h2>Owner Expenses ({filteredExpenses.length})</h2>
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
              disabled={exportLoading || filteredExpenses.length === 0}
            >
              <FontAwesomeIcon icon={exportLoading ? faSpinner : faFileExport} spin={exportLoading} />
              {exportLoading ? 'Exporting...' : 'Export'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loadingExpenses">
            <FontAwesomeIcon icon={faSpinner} spin className="loadingIcon" />
            <span>Loading expenses...</span>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="emptyState">
            <FontAwesomeIcon icon={faReceipt} className="emptyIcon" />
            <h3>No Expenses Found</h3>
            <p>
              {selectedDate === 'custom' && !customDate 
                ? 'Please select a date to view expenses'
                : `No expenses found for ${getDateRangeText().toLowerCase()}`
              }
            </p>
            {selectedDate !== 'all' && (
              <button 
                className="createExpenseBtn"
                onClick={handleCreateExpenseClick}
              >
                <FontAwesomeIcon icon={faPlus} />
                Create First Expense
              </button>
            )}
          </div>
        ) : (
          <div className="expensesGrid">
            {filteredExpenses.map((expense, index) => {
              const statusColor = getStatusColor(expense.totalPrice || 0)
              
              return (
                <ExpenseRecord 
                  key={expense._id || expense.uniqueId}
                  expense={expense}
                  statusColor={statusColor}
                  onEditClick={handleEditClick}
                  onClick={handleExpenseClick}
                  formatDateForDisplay={formatDateForDisplay}
                  getRelativeDay={getRelativeDay}
                />
              )
            })}
          </div>
        )}
      </main>

      {/* Floating Create Button */}
      <div className={`floatingSettings ${showSettings ? 'active' : ''}`}>
        <div className="settingsMenu">
          <div 
            className="menuOption addOption"
            onClick={handleCreateExpenseClick}
          >
            <div className="optionIcon">
              <FontAwesomeIcon icon={faPlus} />
            </div>
            <span className="optionText">Create Expense</span>
          </div>
        </div>
        
        <button 
          className="settingsButton"
          onClick={handleSettingsClick}
        >
          <FontAwesomeIcon icon={showSettings ? faTimes : faPlus} />
        </button>
      </div>
    </div>
  )
}

// Expense Record Component (Similar to Record component)
const ExpenseRecord = ({ 
  expense, 
  statusColor, 
  onEditClick, 
  onClick,
  formatDateForDisplay,
  getRelativeDay
}) => {
  const [showAllItems, setShowAllItems] = useState(false)

  const getInitials = (date) => {
    if (!date) return 'NA'
    const dateObj = new Date(date)
    const day = dateObj.getDate()
    const month = dateObj.toLocaleString('en-US', { month: 'short' })
    return `${day}${month}`
  }

  const toggleShowAllItems = (e) => {
    e.stopPropagation()
    setShowAllItems(!showAllItems)
  }

  // Show only 2 items initially, or all if showAllItems is true
  const itemsToShow = showAllItems ? expense.items : (expense.items?.slice(0, 2) || [])
  const hasMoreItems = expense.items?.length > 2

  const handleEdit = (e) => {
    e.stopPropagation()
    onEditClick(expense._id || expense.uniqueId, e)
  }

  const handleCardClick = () => {
    onClick(expense._id || expense.uniqueId)
  }

  return (
    <div className="recordCard" onClick={handleCardClick}>
      {/* Card Header */}
      <div className="cardHeader">
        <div className="headerLeft">
          <div 
            className="customerAvatar"
            style={{ backgroundColor: statusColor }}
          >
            {getInitials(expense.date)}
          </div>
          <div className="customerMainInfo">
            <h3 className="customerName">{formatDateForDisplay(expense.date)}</h3>
            <div className="orderMeta">
              <div className="metaItem itemsCount">
                <FontAwesomeIcon icon={faBoxes} className="metaIcon" />
                <span>{expense.items?.length || 0} items</span>
              </div>
              <div 
                className="metaItem paymentStatusHeader"
                style={{
                  backgroundColor: `${statusColor}15`,
                  border: `1.5px solid ${statusColor}`,
                  color: statusColor
                }}
              >
                <FontAwesomeIcon icon={faReceipt} className="metaIcon" />
                <span>₹{(expense.totalPrice || 0).toFixed(0)}</span>
              </div>
            </div>
          </div>
        </div>
        {/* Right side with day indicator */}
        <div className="dayIndicator">
          {getRelativeDay(expense.date.split('T')[0])}
        </div>
      </div>

      {/* Items Section */}
      <div className="itemsSection">
        <div className="sectionHeader">
          <h4 className="sectionTitle">Expense Items</h4>
          <div className="totalAmountInfo">
            <span className="totalLabel">Total Amount:</span>
            <span className="totalAmount">₹{(expense.totalPrice || 0).toFixed(2)}</span>
          </div>
        </div>
        
        <div className="itemsList">
          {itemsToShow.map((item, itemIndex) => (
            <div key={itemIndex} className="itemCard">
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
          
          {/* Show More/Less Button */}
          {hasMoreItems && (
            <div className="showMoreButton" onClick={toggleShowAllItems}>
              <FontAwesomeIcon icon={showAllItems ? faChevronUp : faChevronDown} className="showMoreIcon" />
              <span className="showMoreText">
                {showAllItems ? 'Show Less' : `+${expense.items.length - 2} more items`}
              </span>
            </div>
          )}
        </div>

        {/* Description */}
        {expense.description && (
          <div className="expenseDescription">
            {expense.description}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="actionButtons">
        <button 
          className="actionBtn editBtn"
          onClick={handleEdit}
        >
          <FontAwesomeIcon icon={faEdit} />
          Edit Expense
        </button>
      </div>
    </div>
  )
}