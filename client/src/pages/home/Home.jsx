import React, { useState, useEffect } from 'react'
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
  faTimes
} from '@fortawesome/free-solid-svg-icons'
import { Record } from '../../components/record/Record'
import { useNavigate } from 'react-router-dom'

export const Home = () => {
  const navigate = useNavigate()
  
  const [owner] = useState({
    firstName: "Manikanta",
    lastName: "Yerraguntla"
  })

  const [loading, setLoading] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [selectedDate, setSelectedDate] = useState('today')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  
  const [customers] = useState([
    {
      id: 1,
      name: "John Doe",
      totalCost: 1250.75,
      items: [
        { name: "Tomatoes", quantity: 5, cost: 250 },
        { name: "Potatoes", quantity: 10, cost: 300 },
        { name: "Onions", quantity: 8, cost: 400 },
        { name: "Carrots", quantity: 3, cost: 150 },
        { name: "Spinach", quantity: 2, cost: 150.75 }
      ],
      date: "2024-01-15"
    },
    {
      id: 2,
      name: "Jane Smith",
      totalCost: 890.50,
      items: [
        { name: "Bell Peppers", quantity: 4, cost: 200 },
        { name: "Cucumbers", quantity: 6, cost: 180 },
        { name: "Broccoli", quantity: 3, cost: 210.50 },
        { name: "Cauliflower", quantity: 2, cost: 300 }
      ],
      date: "2024-01-15"
    },
    {
      id: 3,
      name: "Mike Johnson",
      totalCost: 1567.25,
      items: [
        { name: "Apples", quantity: 12, cost: 600 },
        { name: "Oranges", quantity: 8, cost: 400 },
        { name: "Bananas", quantity: 15, cost: 225.25 },
        { name: "Grapes", quantity: 5, cost: 342 }
      ],
      date: "2024-01-14"
    },
    {
      id: 4,
      name: "Sarah Wilson",
      totalCost: 745.00,
      items: [
        { name: "Lettuce", quantity: 3, cost: 150 },
        { name: "Cabbage", quantity: 2, cost: 100 },
        { name: "Beans", quantity: 4, cost: 200 },
        { name: "Peas", quantity: 3, cost: 195 },
        { name: "Corn", quantity: 2, cost: 100 }
      ],
      date: "2024-01-15"
    },
    {
      id: 5,
      name: "Robert Brown",
      totalCost: 1120.00,
      items: [
        { name: "Tomatoes", quantity: 8, cost: 400 },
        { name: "Onions", quantity: 5, cost: 250 },
        { name: "Garlic", quantity: 10, cost: 200 },
        { name: "Ginger", quantity: 3, cost: 270 }
      ],
      date: "2024-01-14"
    }
  ])

  useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => {
      setLoading(false)
    }, 2000)
    
    return () => clearTimeout(timer)
  }, [])

  const getInitials = (name) => {
    if (!name) return 'NA'
    const nameParts = name.split(' ')
    if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase()
    return (nameParts[0].charAt(0) + nameParts[1].charAt(0)).toUpperCase()
  }

  // Filter customers based on selected date and search
  const filteredCustomers = customers.filter(customer => {
    // Date filter
    let dateMatch = true
    if (selectedDate === 'today') {
      dateMatch = customer.date === "2024-01-15"
    } else if (selectedDate === 'yesterday') {
      dateMatch = customer.date === "2024-01-14"
    } else if (selectedDate === 'custom') {
      dateMatch = customer.date === "2024-01-15" // For demo, show today's for custom
    }

    // Search filter
    const searchMatch = !searchTerm || 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase())

    return dateMatch && searchMatch
  })

  // Calculate total cost for filtered customers
  const totalCost = filteredCustomers.reduce((sum, customer) => sum + customer.totalCost, 0)

  const handleSettingsClick = () => {
    setShowSettings(!showSettings)
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

  const handleEditClick = (customerId, e) => {
    e.stopPropagation()
    console.log("Edit customer:", customerId)
  }

  const handleAddItemsClick = (customerId, e) => {
    e.stopPropagation()
    console.log("Add items to customer:", customerId)
  }

  const handleWheelOptionClick = (option) => {
    if (option === 'add') {
      navigate('/create')
    }

    if (option === 'owner') {
      navigate('/owner')
    }

    if (option === 'customers') {
      navigate('/customers')
    }

    setShowSettings(false)
  }

  if (loading) {
    return (
      <div className="homeContainer">
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

        <div className="customersGrid">
          {filteredCustomers.map((customer, index) => (
            <Record
              key={customer.id}
              customer={customer}
              index={index}
              onEditClick={handleEditClick}
              onAddItemsClick={handleAddItemsClick}
            />
          ))}
        </div>
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
          <div 
            className="menuOption ownerOption"
            onClick={() => handleWheelOptionClick('owner')}
          >
            <div className="optionIcon">
              <FontAwesomeIcon icon={faUser} />
            </div>
            <span className="optionText">Owner</span>
          </div>
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