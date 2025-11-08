import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faChevronLeft,
  faPlus,
  faTrash,
  faSearch,
  faRupeeSign,
  faReceipt,
  faTimes
} from '@fortawesome/free-solid-svg-icons'
import './createExpense.scss'

export const CreateExpense = () => {
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(false)
  
  // Mock existing expense items for suggestions
  const [existingExpenseItems] = useState([
    "Vegetables Purchase", "Transportation", "Packaging Material", 
    "Miscellaneous", "Staff Lunch", "Equipment Maintenance", 
    "Marketing Materials", "Cleaning Supplies", "Utility Bills",
    "Rent", "Electricity", "Water Bill", "Internet", "Phone Bill"
  ])

  // Mock existing expenses for today
  const [existingExpenses] = useState([
    {
      date: "2025-11-08",
      items: [
        { name: "Vegetables Purchase", quantity: 50, price: 1250 },
        { name: "Transportation", quantity: 1, price: 800 },
        { name: "Packaging Material", quantity: 200, price: 750 }
      ]
    }
  ])

  // Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    items: [
      { id: 1, name: '', quantity: 1, price: '', total: 0 }
    ]
  })

  const [totalAmount, setTotalAmount] = useState(0)

  // Calculate total amount whenever items change
  useEffect(() => {
    const total = formData.items.reduce((sum, item) => {
      const price = parseFloat(item.price) || 0
      return sum + price
    }, 0)
    setTotalAmount(total)
  }, [formData.items])

  const handleBack = () => {
    navigate(-1)
  }

  // Load existing items when date is selected
  useEffect(() => {
    if (formData.date) {
      const existingExpense = existingExpenses.find(expense => expense.date === formData.date)
      
      if (existingExpense && existingExpense.items.length > 0) {
        // Load existing items for this date
        const itemsWithIds = existingExpense.items.map((item, index) => ({
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
        // Reset to empty items for new expense
        setFormData(prev => ({
          ...prev,
          items: [{ id: 1, name: '', quantity: 1, price: '', total: 0 }]
        }))
      }
    }
  }, [formData.date])

  // Expense item search for item names
  const [showExpenseSuggestions, setShowExpenseSuggestions] = useState({})
  const [expenseSearchTerms, setExpenseSearchTerms] = useState({})

  const handleExpenseSearch = (itemId, searchTerm) => {
    setExpenseSearchTerms(prev => ({
      ...prev,
      [itemId]: searchTerm
    }))
    setShowExpenseSuggestions(prev => ({
      ...prev,
      [itemId]: true
    }))
  }

  const handleExpenseSelect = (itemId, expenseName) => {
    updateItem(itemId, 'name', expenseName)
    setShowExpenseSuggestions(prev => ({
      ...prev,
      [itemId]: false
    }))
    setExpenseSearchTerms(prev => ({
      ...prev,
      [itemId]: ''
    }))
  }

  const filteredExpenseItems = (itemId) => {
    const searchTerm = expenseSearchTerms[itemId] || ''
    return existingExpenseItems.filter(expenseItem =>
      expenseItem.toLowerCase().includes(searchTerm.toLowerCase())
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
    if (formData.items.some(item => !item.name.trim() || !item.price || parseFloat(item.price) <= 0)) {
      alert('Please fill all expense details correctly')
      setLoading(false)
      return
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      console.log('Expense created:', {
        ...formData,
        totalAmount,
        timestamp: new Date().toISOString()
      })
      
      // Show success message and redirect
      alert('Expense created successfully!')
      navigate('/owner')
      
    } catch (error) {
      console.error('Error creating expense:', error)
      alert('Failed to create expense. Please try again.')
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
    <div className="createExpenseContainer">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="left">
            <button className="backButton" onClick={handleBack}>
              <FontAwesomeIcon icon={faChevronLeft} />
            </button>
            <FontAwesomeIcon icon={faReceipt} className="icon" />
            <h1 className="title">Create New Expense</h1>
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
        <form onSubmit={handleSubmit} className="expenseForm">
          {/* Expense Date */}
          <div className="formSection">
            <h3 className="sectionTitle">Expense Details</h3>
            <div className="inputGroup">
              <label className="inputLabel">Expense Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="dateInput"
              />
            </div>
          </div>

          {/* Items Section */}
          {formData.date && (
            <div className="formSection">
              <h3 className="sectionTitle">Expense Items</h3>

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
                        <label className="inputLabel">Expense Name</label>
                        <div className="searchContainer">
                          <div className="searchInputWrapper">
                            <FontAwesomeIcon icon={faSearch} className="searchIcon" />
                            <input
                              type="text"
                              placeholder="Search expense name..."
                              value={item.name}
                              onChange={(e) => {
                                updateItem(item.id, 'name', e.target.value)
                                handleExpenseSearch(item.id, e.target.value)
                              }}
                              onFocus={() => setShowExpenseSuggestions(prev => ({
                                ...prev,
                                [item.id]: true
                              }))}
                              className="searchInput"
                              required
                            />
                          </div>

                          {showExpenseSuggestions[item.id] && item.name && (
                            <div className="suggestionsDropdown">
                              {filteredExpenseItems(item.id).length > 0 ? (
                                filteredExpenseItems(item.id).map((expenseItem, expenseIndex) => (
                                  <div
                                    key={expenseIndex}
                                    className="suggestionItem"
                                    onClick={() => handleExpenseSelect(item.id, expenseItem)}
                                  >
                                    <div className="customerAvatar">
                                      <FontAwesomeIcon icon={faReceipt} />
                                    </div>
                                    <div className="customerInfo">
                                      <span className="customerName">{expenseItem}</span>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="suggestionItem">
                                  <div className="customerInfo">
                                    <span className="customerName">No expenses found</span>
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
                          <label className="inputLabel">Amount (₹)</label>
                          <div className="priceInputWrapper">
                            <FontAwesomeIcon icon={faRupeeSign} className="rupeeIcon" />
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="Enter amount"
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
                  Add Another Expense
                </button>
              </div>
            </div>
          )}

          {/* Total Amount */}
          {formData.date && formData.items.length > 0 && (
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
          {formData.date && formData.items.length > 0 && (
            <div className="submitSection">
              <button 
                type="submit" 
                className="submitButton"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="loadingSpinner"></div>
                    Creating Expense...
                  </>
                ) : (
                  'Create Expense'
                )}
              </button>
            </div>
          )}
        </form>
      </main>
    </div>
  )
}