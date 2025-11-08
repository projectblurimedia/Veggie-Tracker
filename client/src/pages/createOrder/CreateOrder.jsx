import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faChevronLeft,
  faPlus,
  faTrash,
  faSearch,
  faRupeeSign,
  faUser,
  faReceipt,
  faTimes
} from '@fortawesome/free-solid-svg-icons'
import './createOrder.scss'

export const CreateOrder = () => {
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  
  // Mock existing customers and their orders
  const [existingCustomers] = useState([
    { 
      id: 1, 
      name: "John Doe", 
      phone: "+91 9876543210",
      orders: [
        {
          date: "2025-11-08",
          items: [
            { name: "Tomatoes", quantity: 5, price: 50 },
            { name: "Potatoes", quantity: 10, price: 30 },
            { name: "Onions", quantity: 8, price: 50 }
          ]
        }
      ]
    },
    { 
      id: 2, 
      name: "Jane Smith", 
      phone: "+91 9876543211",
      orders: [
        {
          date: "2024-01-15",
          items: [
            { name: "Bell Peppers", quantity: 4, price: 50 },
            { name: "Cucumbers", quantity: 6, price: 30 }
          ]
        }
      ]
    },
    { 
      id: 3, 
      name: "Mike Johnson", 
      phone: "+91 9876543212",
      orders: []
    }
  ])

  // Mock existing vegetables for suggestions
  const [existingVegetables] = useState([
    "Tomatoes", "Potatoes", "Onions", "Bell Peppers", "Cucumbers",
    "Carrots", "Spinach", "Broccoli", "Cauliflower", "Cabbage",
    "Lettuce", "Beans", "Peas", "Corn", "Garlic", "Ginger"
  ])

  // Form state
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    date: new Date().toISOString().split('T')[0],
    items: [
      { id: 1, name: '', quantity: 1, price: '', total: 0 }
    ]
  })

  const [totalAmount, setTotalAmount] = useState(0)

  // Calculate total amount whenever items change
  useEffect(() => {
    const total = formData.items.reduce((sum, item) => {
      // const quantity = parseInt(item.quantity) || 0
      const price = parseFloat(item.price) || 0
      return sum +  price
    }, 0)
    setTotalAmount(total)
  }, [formData.items])

  const handleBack = () => {
    navigate(-1)
  }

  // Customer search and selection
  const filteredCustomers = existingCustomers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  )

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer)
    setFormData(prev => ({
      ...prev,
      customerName: customer.name,
      customerPhone: customer.phone,
      date: new Date().toISOString().split('T')[0] // Set to today's date
    }))
    setSearchTerm('')
    setShowSuggestions(false)
  }

  const handleClearCustomer = () => {
    setSelectedCustomer(null)
    setFormData(prev => ({
      ...prev,
      customerName: '',
      customerPhone: '',
      date: new Date().toISOString().split('T')[0]
    }))
    setSearchTerm('')
  }

  const handleNewCustomer = () => {
    const newCustomer = {
      id: Date.now(),
      name: searchTerm,
      phone: '',
      orders: []
    }
    setSelectedCustomer(newCustomer)
    setFormData(prev => ({
      ...prev,
      customerName: searchTerm,
      customerPhone: '',
      date: new Date().toISOString().split('T')[0] // Set to today's date
    }))
    setSearchTerm('')
    setShowSuggestions(false)
  }

  // Load existing items when customer and date are selected
  useEffect(() => {
    if (selectedCustomer && formData.date) {
      const existingOrder = selectedCustomer.orders.find(order => order.date === formData.date)
      
      if (existingOrder && existingOrder.items.length > 0) {
        // Load existing items for this date
        const itemsWithIds = existingOrder.items.map((item, index) => ({
          id: index + 1,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.quantity * item.price
        }))
        
        setFormData(prev => ({
          ...prev,
          items: itemsWithIds
        }))
      } else {
        // Reset to empty items for new order
        setFormData(prev => ({
          ...prev,
          items: [{ id: 1, name: '', quantity: 1, price: '', total: 0 }]
        }))
      }
    }
  }, [selectedCustomer, formData.date])

  // Vegetable search for item names
  const [showVegetableSuggestions, setShowVegetableSuggestions] = useState({})
  const [vegetableSearchTerms, setVegetableSearchTerms] = useState({})

  const handleVegetableSearch = (itemId, searchTerm) => {
    setVegetableSearchTerms(prev => ({
      ...prev,
      [itemId]: searchTerm
    }))
    setShowVegetableSuggestions(prev => ({
      ...prev,
      [itemId]: true
    }))
  }

  const handleVegetableSelect = (itemId, vegetableName) => {
    updateItem(itemId, 'name', vegetableName)
    setShowVegetableSuggestions(prev => ({
      ...prev,
      [itemId]: false
    }))
    setVegetableSearchTerms(prev => ({
      ...prev,
      [itemId]: ''
    }))
  }

  const filteredVegetables = (itemId) => {
    const searchTerm = vegetableSearchTerms[itemId] || ''
    return existingVegetables.filter(vegetable =>
      vegetable.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  // Item management
  const addItem = () => {
    const newItem = {
      id: Date.now(),
      name: '',
      quantity: 1,
      price: '',
      total: 0
    }
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }))
  }

  const removeItem = (itemId) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter(item => item.id !== itemId)
      }))
    }
  }

  const updateItem = (itemId, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, [field]: value }
          if (field === 'quantity' || field === 'price') {
            const quantity = parseInt(updatedItem.quantity) || 0
            const price = parseFloat(updatedItem.price) || 0
            updatedItem.total = quantity * price
          }
          return updatedItem
        }
        return item
      })
    }))
  }

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    // Validate form
    if (!formData.customerName.trim()) {
      alert('Please enter customer name')
      setLoading(false)
      return
    }

    if (formData.items.some(item => !item.name.trim() || !item.price || parseFloat(item.price) <= 0)) {
      alert('Please fill all item details correctly')
      setLoading(false)
      return
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      console.log('Order created:', {
        ...formData,
        totalAmount,
        timestamp: new Date().toISOString()
      })
      
      // Show success message and redirect
      alert('Order created successfully!')
      navigate('/')
      
    } catch (error) {
      console.error('Error creating order:', error)
      alert('Failed to create order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getInitials = (name) => {
    if (!name) return 'NA'
    const nameParts = name.split(' ')
    if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase()
    return (nameParts[0].charAt(0) + nameParts[1].charAt(0)).toUpperCase()
  }

  return (
    <div className="createOrderContainer">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="left">
            <button className="backButton" onClick={handleBack}>
              <FontAwesomeIcon icon={faChevronLeft} />
            </button>
            <FontAwesomeIcon icon={faReceipt} className="icon" />
            <h1 className="title">Create New Order</h1>
          </div>
          <div className="header-actions">
            <div className="owner-avatar">
              {getInitials("Admin User")}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        <form onSubmit={handleSubmit} className="orderForm">
          {/* Customer Search Section */}
          <div className="formSection">
            <h3 className="sectionTitle">Customer Information</h3>
            
            {!selectedCustomer ? (
              <div className="searchContainer">
                <div className="searchInputWrapper">
                  <FontAwesomeIcon icon={faSearch} className="searchIcon" />
                  <input
                    type="text"
                    placeholder="Search existing customer or enter new name..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value)
                      setShowSuggestions(true)
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    className="searchInput"
                  />
                </div>

                {showSuggestions && searchTerm && (
                  <div className="suggestionsDropdown">
                    {filteredCustomers.length > 0 ? (
                      <>
                        {filteredCustomers.map(customer => (
                          <div
                            key={customer.id}
                            className="suggestionItem"
                            onClick={() => handleCustomerSelect(customer)}
                          >
                            <div className="customerAvatar">
                              {getInitials(customer.name)}
                            </div>
                            <div className="customerInfo">
                              <span className="customerName">{customer.name}</span>
                              <span className="customerPhone">{customer.phone}</span>
                            </div>
                          </div>
                        ))}
                        <div
                          className="suggestionItem newCustomer"
                          onClick={handleNewCustomer}
                        >
                          <FontAwesomeIcon icon={faUser} className="newCustomerIcon" />
                          <div className="customerInfo">
                            <span className="customerName">Create new: "{searchTerm}"</span>
                            <span className="customerPhone">Add as new customer</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div
                        className="suggestionItem newCustomer"
                        onClick={handleNewCustomer}
                      >
                        <FontAwesomeIcon icon={faUser} className="newCustomerIcon" />
                        <div className="customerInfo">
                          <span className="customerName">Create new: "{searchTerm}"</span>
                          <span className="customerPhone">Add as new customer</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="selectedCustomer">
                <div className="customerDetails">
                  <div className="customerInfo">
                    <div className="customerAvatar large">
                      {getInitials(selectedCustomer.name)}
                    </div>
                    <div className="customerTextInfo">
                      <span className="customerName">{selectedCustomer.name}</span>
                      {selectedCustomer.phone && (
                        <span className="customerPhone">{selectedCustomer.phone}</span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearCustomer}
                    className="clearCustomerButton"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order Date */}
          {selectedCustomer && (
            <div className="formSection">
              <h3 className="sectionTitle">Order Details</h3>
              <div className="inputGroup">
                <label className="inputLabel">Order Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="dateInput"
                />
              </div>
            </div>
          )}

          {/* Items Section */}
          {selectedCustomer && formData.date && (
            <div className="formSection">
              <h3 className="sectionTitle">Order Items</h3>

              <div className="itemsContainer">
                {formData.items.map((item, index) => (
                  <div key={item.id} className="itemCard">
                    <div className="itemHeader">
                      <span className="itemNumber">Item {index + 1}</span>
                      {formData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="removeItemButton"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      )}
                    </div>

                    <div className="itemFields">
                      <div className="inputGroup">
                        <label className="inputLabel">Item Name</label>
                        <div className="searchContainer">
                          <div className="searchInputWrapper">
                            <FontAwesomeIcon icon={faSearch} className="searchIcon" />
                            <input
                              type="text"
                              placeholder="Search vegetable name..."
                              value={item.name}
                              onChange={(e) => {
                                updateItem(item.id, 'name', e.target.value)
                                handleVegetableSearch(item.id, e.target.value)
                              }}
                              onFocus={() => setShowVegetableSuggestions(prev => ({
                                ...prev,
                                [item.id]: true
                              }))}
                              className="searchInput"
                              required
                            />
                          </div>

                          {showVegetableSuggestions[item.id] && item.name && (
                            <div className="suggestionsDropdown">
                              {filteredVegetables(item.id).length > 0 ? (
                                filteredVegetables(item.id).map((vegetable, vegIndex) => (
                                  <div
                                    key={vegIndex}
                                    className="suggestionItem"
                                    onClick={() => handleVegetableSelect(item.id, vegetable)}
                                  >
                                    <div className="customerAvatar">
                                      <FontAwesomeIcon icon={faSearch} />
                                    </div>
                                    <div className="customerInfo">
                                      <span className="customerName">{vegetable}</span>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="suggestionItem">
                                  <div className="customerInfo">
                                    <span className="customerName">No vegetables found</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="quantityPriceRow">
                        <div className="inputGroup quantityGroup">
                          <label className="inputLabel">Quantity</label>
                          <input
                            type="number"
                            min="1"
                            placeholder="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                            className="quantityInput"
                            required
                          />
                        </div>

                        <div className="inputGroup priceGroup">
                          <label className="inputLabel">Price (₹)</label>
                          <div className="priceInputWrapper">
                            <FontAwesomeIcon icon={faRupeeSign} className="rupeeIcon" />
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="Enter price"
                              value={item.price}
                              onChange={(e) => updateItem(item.id, 'price', e.target.value)}
                              className="priceInput"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Item Button - Moved below items */}
              <div className="addItemSection">
                <button type="button" onClick={addItem} className="addItemButton">
                  <FontAwesomeIcon icon={faPlus} />
                  Add Another Item
                </button>
              </div>
            </div>
          )}

          {/* Total Amount */}
          {selectedCustomer && formData.date && formData.items.length > 0 && (
            <div className="totalSection">
              <div className="totalDisplay">
                <span className="totalLabel">Grand Total:</span>
                <span className="grandTotal">
                  <FontAwesomeIcon icon={faRupeeSign} />
                  {totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          {selectedCustomer && formData.date && formData.items.length > 0 && (
            <div className="submitSection">
              <button 
                type="submit" 
                className="submitButton"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="loadingSpinner"></div>
                    Creating Order...
                  </>
                ) : (
                  'Create Order'
                )}
              </button>
            </div>
          )}
        </form>
      </main>
    </div>
  )
}