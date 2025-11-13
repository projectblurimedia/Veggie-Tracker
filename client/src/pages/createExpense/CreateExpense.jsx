import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faChevronLeft,
  faPlus,
  faTrash,
  faSearch,
  faRupeeSign,
  faReceipt,
  faTimes,
  faSpinner,
  faHistory,
  faEdit
} from '@fortawesome/free-solid-svg-icons'
import axios from 'axios'
import { Toast } from '../../components/toast/Toast'
import './createExpense.scss'

// Debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])
  return debouncedValue
}

export const CreateExpense = () => {
  const navigate = useNavigate()
  const { expenseId } = useParams() // Get expense ID from URL if editing
  
  const [isEditMode, setIsEditMode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false) // New state to track if data is loaded

  // Form state - initialize with empty state
  const [formData, setFormData] = useState({
    date: '',
    items: []
  })
  
  const [totalAmount, setTotalAmount] = useState(0)
  const [searchLoading, setSearchLoading] = useState(false)
  
  // Existing items state
  const [existingItems, setExistingItems] = useState([])
  const [loadingExistingItems, setLoadingExistingItems] = useState(false)
  const [hasExistingItems, setHasExistingItems] = useState(false)
  
  // Reload trigger for date changes
  const [reloadTrigger, setReloadTrigger] = useState(0)
  
  // Toast state
  const [toasts, setToasts] = useState([])
  
  // Validation state
  const [showValidation, setShowValidation] = useState(false)
  
  // Expense items from API
  const [allItems, setAllItems] = useState([])

  // Expense item search for item names
  const [showExpenseSuggestions, setShowExpenseSuggestions] = useState({})
  const [expenseSearchTerms, setExpenseSearchTerms] = useState({})

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

  // Calculate total amount whenever items change
  useEffect(() => {
    const total = formData.items.reduce((sum, item) => {
      const price = parseFloat(item.price) || 0
      return sum + price
    }, 0)
    setTotalAmount(total)
  }, [formData.items])

  // Load initial items
  useEffect(() => {
    loadInitialData()
  }, [])

  // Load expense data if in edit mode - run immediately on component mount
  useEffect(() => {
    if (expenseId) {
      loadExpenseData()
    } else {
      // If not edit mode, initialize with today's date and empty item
      setFormData({
        date: new Date().toISOString().split('T')[0],
        items: [{ id: 1, name: '', quantity: '', price: '', total: 0 }]
      })
      setDataLoaded(true)
    }
  }, [expenseId])

  // Load existing items when date changes and auto-fill form (only in create mode)
  useEffect(() => {
    if (formData.date && !isEditMode && dataLoaded) {
      loadExistingItems()
    }
  }, [formData.date, isEditMode, reloadTrigger, dataLoaded])

  const handleBack = () => {
    navigate(-1)
  }

  // Load initial data
  const loadInitialData = async () => {
    try {
      setSearchLoading(true)
      const itemsResponse = await axios.get('/items')
      setAllItems(itemsResponse.data.data || [])
    } catch (error) {
      console.error('Error loading initial data:', error)
      showToast('Failed to load items. Please check if server is running.', 'error')
    } finally {
      setSearchLoading(false)
    }
  }

  // Load expense data for edit mode
  const loadExpenseData = async () => {
    try {
      setInitialLoading(true)
      setDataLoaded(false) // Reset data loaded state
      
      const response = await axios.get(`/owner-records/${expenseId}`)
      const expense = response.data.data
      
      if (expense) {
        setIsEditMode(true)
        
        // Set form data with the actual expense data
        setFormData({
          date: expense.date.split('T')[0], // Extract date part only
          items: expense.items.map((item, index) => ({
            id: Date.now() + index, // Use unique IDs
            name: item.name,
            quantity: item.quantity.toString(),
            price: item.price.toString(),
            total: item.price
          }))
        })
        
        // Set existing items for the display
        setExistingItems(expense.items)
        setHasExistingItems(true)
        
        setDataLoaded(true) // Mark data as loaded
      }
    } catch (error) {
      console.error('Error loading expense data:', error)
      showToast('Failed to load expense data', 'error')
      navigate('/owner')
    } finally {
      setInitialLoading(false)
    }
  }

  // Load existing items for the selected date and auto-fill form
  const loadExistingItems = async () => {
    if (!formData.date) return
   
    try {
      setLoadingExistingItems(true)
      const response = await axios.get(`/owner-records/date/${formData.date}?recordType=EXPENSE`)
      const existingExpenses = response.data.data || []
     
      // Extract all items from existing expenses
      const allExistingItems = existingExpenses.flatMap(expense =>
        expense.items.map(item => ({
          ...item,
          expenseId: expense._id
        }))
      )
     
      setExistingItems(allExistingItems)
     
      // Auto-fill form with existing items if found
      if (allExistingItems.length > 0) {
        setHasExistingItems(true)
       
        const newItems = allExistingItems.map((item, index) => ({
          id: Date.now() + index,
          name: item.name,
          quantity: item.quantity.toString(),
          price: item.price.toString(),
          total: item.price
        }))
       
        setFormData(prev => ({
          ...prev,
          items: newItems
        }))
       
      } else {
        setHasExistingItems(false)
        // Only reset to empty items if we're not already showing empty items
        if (formData.items.some(item => item.name || item.quantity || item.price)) {
          setFormData(prev => ({
            ...prev,
            items: [{ id: 1, name: '', quantity: '', price: '', total: 0 }]
          }))
        }
      }
     
    } catch (error) {
      console.error('Error loading existing items:', error)
      // Don't show error toast for this as it's not critical
    } finally {
      setLoadingExistingItems(false)
    }
  }

  // Handle date change - reset items and check for existing items for new date
  const handleDateChange = (newDate) => {
    // Update the date and reset items immediately
    setFormData(prev => ({
      ...prev,
      date: newDate,
      items: [{ id: 1, name: '', quantity: '', price: '', total: 0 }]
    }))
   
    // Reset existing items state
    setHasExistingItems(false)
    setExistingItems([])
   
    // Trigger reload after state updates
    setTimeout(() => {
      setReloadTrigger(prev => prev + 1)
    }, 50)
  }

  // Expense item search functionality
  const handleExpenseSearch = useCallback((itemId, searchTerm) => {
    setExpenseSearchTerms(prev => ({
      ...prev,
      [itemId]: searchTerm
    }))
    setShowExpenseSuggestions(prev => ({
      ...prev,
      [itemId]: true
    }))
  }, [])

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

  // Filter expense items with priority - items starting with search term first
  const filteredExpenseItems = (itemId) => {
    const searchTerm = expenseSearchTerms[itemId] || ''
    if (!searchTerm.trim()) return []
    const searchTermLower = searchTerm.toLowerCase()
   
    // Separate items that start with search term and items that contain search term
    const startsWithItems = allItems.filter(item =>
      item.name.toLowerCase().startsWith(searchTermLower)
    )
   
    const containsItems = allItems.filter(item =>
      item.name.toLowerCase().includes(searchTermLower) &&
      !item.name.toLowerCase().startsWith(searchTermLower)
    )
   
    // Combine with priority given to items starting with search term
    return [...startsWithItems, ...containsItems]
  }

  // Item management
  const addItem = () => {
    const newItem = {
      id: Date.now(),
      name: '',
      quantity: '',
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
      showToast('Item removed', 'info')
    } else {
      showToast('At least one item is required', 'warning')
    }
  }

  const updateItem = (itemId, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, [field]: value }
          // Update total to be the same as price (since price is total for the quantity)
          if (field === 'price') {
            updatedItem.total = parseFloat(value) || 0
          }
          return updatedItem
        }
        return item
      })
    }))
  }

  // Create expense item if not exists
  const createExpenseItemIfNotExists = async (itemName) => {
    try {
      if (!itemName.trim()) return null

      // Check if item already exists in local state
      const existingItem = allItems.find(item => 
        item.name.toLowerCase() === itemName.toLowerCase()
      )
      
      if (!existingItem) {
        // Create new item
        const response = await axios.post('/items', { name: itemName })
        const newItem = response.data.data
        
        // Add new item to local state
        setAllItems(prev => [newItem, ...prev])
        console.log(`Created new item: ${itemName}`)
        return newItem
      }
      return existingItem
    } catch (error) {
      console.error('Error creating item:', error)
      showToast(`Failed to create item "${itemName}". Please try again.`, 'error')
      return null
    }
  }

  // Validate form before submission
  const validateForm = () => {
    setShowValidation(true)
    
    // Check if date is valid
    if (!formData.date) {
      showToast('Please select an expense date', 'error')
      return false
    }
    
    // Check if items are valid
    if (formData.items.length === 0) {
      showToast('Please add at least one expense item', 'error')
      return false
    }
    
    // Validate each item
    for (let i = 0; i < formData.items.length; i++) {
      const item = formData.items[i]
     
      if (!item.name.trim()) {
        showToast(`Item ${i + 1}: Please enter expense name`, 'error')
        return false
      }

      if (!item.quantity || parseFloat(item.quantity) <= 0) {
        showToast(`Item ${i + 1}: Please enter a valid quantity (greater than 0)`, 'error')
        return false
      }

      if (!item.price || parseFloat(item.price) <= 0) {
        showToast(`Item ${i + 1}: Please enter a valid amount (greater than 0)`, 'error')
        return false
      }
    }
    
    return true
  }

  // Check if item is invalid (only when validation is shown)
  const isItemInvalid = (item) => {
    if (!showValidation) return false
   
    return !item.name.trim() || 
           !item.quantity || 
           parseFloat(item.quantity) <= 0 || 
           !item.price || 
           parseFloat(item.price) <= 0
  }

  // Form submission for CREATE
  const handleCreateExpense = async () => {
    try {
      // Create expense items that don't exist
      const itemCreationPromises = formData.items.map(item =>
        createExpenseItemIfNotExists(item.name)
      )
     
      await Promise.all(itemCreationPromises)

      const expenseData = {
        date: formData.date,
        items: formData.items.map(item => ({
          name: item.name,
          quantity: parseFloat(item.quantity) || 0,
          price: parseFloat(item.price) || 0
        })),
        totalPrice: totalAmount,
        recordType: 'EXPENSE'
      }

      await axios.post('/owner-records', expenseData)
     
      showToast('Expense created successfully!', 'success')
     
      // Navigate after a short delay to show success message
      setTimeout(() => {
        navigate('/owner')
      }, 500)
     
    } catch (error) {
      console.error('Error creating expense:', error)
      if (error.response?.data?.message) {
        showToast(error.response.data.message, 'error')
      } else {
        showToast('Failed to create expense. Please try again.', 'error')
      }
    }
  }

  // Form submission for UPDATE
  const handleUpdateExpense = async () => {
    try {
      // Create expense items that don't exist
      const itemCreationPromises = formData.items.map(item =>
        createExpenseItemIfNotExists(item.name)
      )
     
      await Promise.all(itemCreationPromises)

      const expenseData = {
        date: formData.date,
        items: formData.items.map(item => ({
          name: item.name,
          quantity: parseFloat(item.quantity) || 0,
          price: parseFloat(item.price) || 0
        })),
        totalPrice: totalAmount,
        recordType: 'EXPENSE'
      }

      if (isEditMode) {
        // Regular edit mode - use expenseId from URL
        await axios.put(`/owner-records/${expenseId}`, expenseData)
        showToast('Expense updated successfully!', 'success')
      } else if (hasExistingItems && existingItems.length > 0) {
        // Create mode but expense exists for this date - update existing
        const expenseIdToUpdate = existingItems[0].expenseId
        await axios.put(`/owner-records/${expenseIdToUpdate}`, expenseData)
        showToast('Expense updated successfully!', 'success')
      }
     
      // Navigate after a short delay to show success message
      setTimeout(() => {
        navigate('/owner')
      }, 500)
     
    } catch (error) {
      console.error('Error updating expense:', error)
      if (error.response?.data?.message) {
        showToast(error.response.data.message, 'error')
      } else {
        showToast('Failed to update expense. Please try again.', 'error')
      }
    }
  }

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault()
   
    // Validate form before submission
    if (!validateForm()) {
      return
    }
    
    setLoading(true)
    try {
      if (isEditMode || hasExistingItems) {
        await handleUpdateExpense()
      } else {
        await handleCreateExpense()
      }
    } catch (error) {
      console.error('Error in form submission:', error)
      showToast('An unexpected error occurred. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Show loading state until data is properly loaded
  if (initialLoading || !dataLoaded) {
    return (
      <div className="createExpenseContainer">
        <div className="loadingState">
          <div className="loadingContent">
            <div className="loadingSpinner">
              <FontAwesomeIcon icon={faReceipt} className="spinnerIcon" />
              <div className="spinnerRing"></div>
            </div>
            <h3>Loading Expense...</h3>
            <p>Please wait while we fetch the expense details...</p>
            <div className="loadingProgress">
              <div className="progressBar"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="createExpenseContainer">
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
            <FontAwesomeIcon icon={isEditMode ? faEdit : faReceipt} className="icon" />
            <h1 className="title">{isEditMode ? 'Edit Expense' : 'Create New Expense'}</h1>
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
                onChange={(e) => handleDateChange(e.target.value)}
                className="dateInput"
                disabled={loading || isEditMode} // Disable date change in edit mode
                max={new Date().toISOString().split('T')[0]} // Cannot select future dates
              />
            </div>
            
            {/* Existing Items Notification */}
            {!isEditMode && hasExistingItems && (
              <div className="existingItemsNotification">
                <div className="notificationContent">
                  <FontAwesomeIcon icon={faHistory} className="notificationIcon" />
                  <div className="notificationText">
                    <strong>Auto-filled {existingItems.length} items</strong> from existing expense on {formData.date}
                  </div>
                </div>
              </div>
            )}
            
            {!isEditMode && loadingExistingItems && (
              <div className="loadingExistingItems">
                <FontAwesomeIcon icon={faSpinner} spin />
                <span>Checking for existing expenses...</span>
              </div>
            )}
          </div>

          {/* Items Section */}
          {formData.date && (
            <div className="formSection">
              <div className="sectionHeader">
                <h3 className="sectionTitle">Expense Items</h3>
                {(hasExistingItems || isEditMode) && (
                  <div className="existingItemsBadge">
                    <FontAwesomeIcon icon={faHistory} />
                    <span>
                      {isEditMode ? 'Editing Expense' : `Auto-filled from ${formData.date}`}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="itemsContainer">
                {formData.items.map((item, index) => (
                  <div key={item.id} className={`itemCard ${isItemInvalid(item) ? 'invalid' : ''}`}>
                    <div className="itemHeader">
                      <span className="itemNumber">Item {index + 1}</span>
                      {formData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="removeItemButton"
                          disabled={loading}
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
                              onBlur={() => {
                                // Delay hiding suggestions to allow click
                                setTimeout(() => {
                                  setShowExpenseSuggestions(prev => ({
                                    ...prev,
                                    [item.id]: false
                                  }))
                                }, 200)
                              }}
                              className={`searchInput ${showValidation && !item.name.trim() ? 'invalid' : ''}`}
                              disabled={loading}
                            />
                          </div>
                          
                          {showExpenseSuggestions[item.id] && expenseSearchTerms[item.id] && (
                            <div className="suggestionsDropdown">
                              {filteredExpenseItems(item.id).length > 0 ? (
                                filteredExpenseItems(item.id).map((itemObj) => (
                                  <div
                                    key={itemObj._id}
                                    className="suggestionItem"
                                    onMouseDown={(e) => {
                                      e.preventDefault() // Prevent input blur
                                      handleExpenseSelect(item.id, itemObj.name)
                                    }}
                                  >
                                    <div className="customerAvatar">
                                      <FontAwesomeIcon icon={faSearch} />
                                    </div>
                                    <div className="customerInfo">
                                      <span className="customerName">{itemObj.name}</span>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="suggestionItem">
                                  <div className="customerInfo">
                                    <span className="customerName">No items found</span>
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
                            min="0.01"
                            step="0.01"
                            placeholder="0.00"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                            className={`quantityInput ${showValidation && (!item.quantity || parseFloat(item.quantity) <= 0) ? 'invalid' : ''}`}
                            disabled={loading}
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
                              placeholder="0.00"
                              value={item.price}
                              onChange={(e) => updateItem(item.id, 'price', e.target.value)}
                              className={`priceInput ${showValidation && (!item.price || parseFloat(item.price) <= 0) ? 'invalid' : ''}`}
                              disabled={loading}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Add Item Button */}
              <div className="addItemSection">
                <button
                  type="button"
                  onClick={addItem}
                  className="addItemButton"
                  disabled={loading}
                >
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
                className={`submitButton ${hasExistingItems || isEditMode ? 'updateButton' : ''}`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="loadingSpinner"></div>
                    {hasExistingItems || isEditMode ? 'Updating Expense...' : 'Creating Expense...'}
                  </>
                ) : (
                  hasExistingItems || isEditMode ? 'Update Expense' : 'Create Expense'
                )}
              </button>
            </div>
          )}
        </form>
      </main>
    </div>
  )
}