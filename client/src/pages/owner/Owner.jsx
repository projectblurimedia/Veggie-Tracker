import { useState, useEffect } from 'react'
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
} from '@fortawesome/free-solid-svg-icons'
import { useNavigate } from 'react-router-dom'

export const Owner = () => {
  const navigate = useNavigate()
  const [owner] = useState({
    firstName: "Manikanta",
    lastName: "Yerraguntla"
  })

  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState('today')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Mock owner expenses data - daily wise expenses
  const [ownerExpenses] = useState([
    {
      id: 1,
      date: "2024-01-15",
      day: "Today",
      totalCost: 3250.75,
      items: [
        { name: "Vegetables Purchase", quantity: 50, cost: 1250 },
        { name: "Transportation", quantity: 1, cost: 800 },
        { name: "Packaging Material", quantity: 200, cost: 750 },
        { name: "Miscellaneous", quantity: 1, cost: 450.75 }
      ]
    },
    {
      id: 2,
      date: "2024-01-14",
      day: "Yesterday",
      totalCost: 2890.50,
      items: [
        { name: "Vegetables Purchase", quantity: 45, cost: 1100 },
        { name: "Transportation", quantity: 1, cost: 750 },
        { name: "Packaging Material", quantity: 180, cost: 680 },
        { name: "Staff Lunch", quantity: 1, cost: 360.50 }
      ]
    },
    {
      id: 3,
      date: "2024-01-13",
      day: "2 Days Ago",
      totalCost: 4150.25,
      items: [
        { name: "Vegetables Purchase", quantity: 65, cost: 1850 },
        { name: "Transportation", quantity: 2, cost: 1200 },
        { name: "Packaging Material", quantity: 250, cost: 850 },
        { name: "Equipment Maintenance", quantity: 1, cost: 250.25 }
      ]
    },
    {
      id: 4,
      date: "2024-01-12",
      day: "3 Days Ago",
      totalCost: 2745.00,
      items: [
        { name: "Vegetables Purchase", quantity: 40, cost: 950 },
        { name: "Transportation", quantity: 1, cost: 650 },
        { name: "Packaging Material", quantity: 150, cost: 600 },
        { name: "Marketing Materials", quantity: 1, cost: 345 },
        { name: "Cleaning Supplies", quantity: 1, cost: 200 }
      ]
    },
    {
      id: 5,
      date: "2024-01-11",
      day: "4 Days Ago",
      totalCost: 3320.00,
      items: [
        { name: "Vegetables Purchase", quantity: 55, cost: 1450 },
        { name: "Transportation", quantity: 1, cost: 900 },
        { name: "Packaging Material", quantity: 220, cost: 770 },
        { name: "Utility Bills", quantity: 1, cost: 200 }
      ]
    }
  ])

  useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1500)
    
    return () => clearTimeout(timer)
  }, [])

  const getInitials = (name) => {
    if (!name) return 'NA'
    const nameParts = name.split(' ')
    if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase()
    return (nameParts[0].charAt(0) + nameParts[1].charAt(0)).toUpperCase()
  }

  const getStatusColor = (totalCost) => {
    if (totalCost > 4000) return '#ef4444'
    if (totalCost > 3000) return '#f59e0b'
    if (totalCost > 2000) return '#3b82f6'
    return '#10b981'
  }

  const getStatusBackground = (totalCost) => {
    if (totalCost > 4000) return 'linear-gradient(135deg, #ef444415, #ef444408)'
    if (totalCost > 3000) return 'linear-gradient(135deg, #f59e0b15, #f59e0b08)'
    if (totalCost > 2000) return 'linear-gradient(135deg, #3b82f615, #3b82f608)'
    return 'linear-gradient(135deg, #10b98115, #10b98108)'
  }

  // Filter expenses based on selected date and search
  const filteredExpenses = ownerExpenses.filter(expense => {
    // Date filter
    let dateMatch = true
    if (selectedDate === 'today') {
      dateMatch = expense.date === "2024-01-15"
    } else if (selectedDate === 'yesterday') {
      dateMatch = expense.date === "2024-01-14"
    } else if (selectedDate === 'custom') {
      dateMatch = expense.date === "2024-01-15" // For demo, show today's for custom
    }

    // Search filter
    const searchMatch = !searchTerm || 
      expense.items.some(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      )

    return dateMatch && searchMatch
  })

  // Calculate total cost for filtered expenses
  const totalCost = filteredExpenses.reduce((sum, expense) => sum + expense.totalCost, 0)

  const handleBack = () => {
    navigate(-1) // Go back to previous page
  }

  const handleDateSelect = (date) => {
    setSelectedDate(date)
    setShowDatePicker(false)
  }

  const handleCustomDateClick = () => {
    setShowDatePicker(true)
    // In real app, you would show a date picker here
    setTimeout(() => {
      handleDateSelect('custom')
    }, 500)
  }

  const handleEditClick = (expenseId, e) => {
    e.stopPropagation()
    console.log("Edit expense:", expenseId)
    // Navigate to edit expense page or show edit modal
  }

  const handleAddExpenseClick = (expenseId, e) => {
    e.stopPropagation()
    console.log("Add item to expense:", expenseId)
    // Show add item modal
  }

  if (loading) {
    return (
      <div className="ownerContainer">
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
            <div className="owner-avatar">
              {getInitials(`${owner.firstName} ${owner.lastName}`)}
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
              placeholder="Search by item name..."
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
                  {selectedDate === 'today' && 'Today'}
                  {selectedDate === 'yesterday' && 'Yesterday'}
                  {selectedDate === 'custom' && 'Custom Date'}
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
                      className={`dateOption ${selectedDate === 'custom' ? 'active' : ''}`}
                      onClick={handleCustomDateClick}
                    >
                      Custom Date
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
              <span className="totalAmount">{totalCost.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="expensesGrid">
          {filteredExpenses.map((expense, index) => {
            const statusColor = getStatusColor(expense.totalCost)
            const statusBackground = getStatusBackground(expense.totalCost)
            
            return (
              <div key={expense.id} className="expenseCard">
                {/* Card Header */}
                <div className="cardHeader">
                  <div className="headerLeft">
                    <div 
                      className="dayIndicator"
                      style={{ backgroundColor: statusColor }}
                    >
                      {expense.day}
                    </div>
                    <div className="expenseMainInfo">
                      <h3 className="expenseDate">{expense.date}</h3>
                      <div className="expenseMeta">
                        <span className="itemCount">
                          {expense.items.length} items
                        </span>
                        <span className="separator">•</span>
                        <span 
                          className="totalAmount"
                          style={{ color: statusColor }}
                        >
                          ₹{expense.totalCost.toFixed(0)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="headerRight">
                    <div 
                      className="expenseAvatar"
                      style={{ backgroundColor: statusColor }}
                    >
                      <FontAwesomeIcon icon={faReceipt} />
                    </div>
                  </div>
                </div>

                {/* Items Section */}
                <div className="itemsSection">
                  <div className="itemsList">
                    {expense.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="itemRow">
                        <div className="itemInfo">
                          <span className="itemName">
                            {item.name}
                          </span>
                          {item.quantity > 1 && (
                            <span className="quantityBadge">
                              {item.quantity}
                            </span>
                          )}
                        </div>
                        <div className="itemDetails">
                          <span className="cost">₹{item.cost.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="actionButtons">
                  <button 
                    className="actionBtn editBtn"
                    onClick={(e) => handleEditClick(expense.id, e)}
                  >
                    <FontAwesomeIcon icon={faEdit} />
                    Edit
                  </button>
                  <button 
                    className="actionBtn addItemBtn"
                    onClick={(e) => handleAddExpenseClick(expense.id, e)}
                  >
                    <FontAwesomeIcon icon={faPlus} />
                    Add Item
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}