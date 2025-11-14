import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faChevronLeft,
  faPlus,
  faTrash,
  faSearch,
  faRupeeSign,
  faUser,
  faReceipt,
  faTimes,
  faPhone,
  faSpinner,
  faExclamationTriangle,
  faEdit,
  faCarrot,
  faHistory,
  faCopy,
  faCreditCard,
  faMoneyBillWave,
  faWallet,
  faCheckCircle,
  faClock
} from '@fortawesome/free-solid-svg-icons'
import axios from 'axios'
import { Toast } from '../../components/toast/Toast'
import './createOrder.scss'

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

export const CreateOrder = () => {
  const navigate = useNavigate()
  const { orderId } = useParams() // Get order ID from URL if editing
  
  const [isEditMode, setIsEditMode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false)
  const [newCustomerPhone, setNewCustomerPhone] = useState('')
  
  // Dynamic states
  const [allCustomers, setAllCustomers] = useState([])
  const [allItems, setAllItems] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)

  // Toast state
  const [toasts, setToasts] = useState([])

  // Validation state
  const [showValidation, setShowValidation] = useState(false)

  // Existing items state
  const [existingItems, setExistingItems] = useState([])
  const [loadingExistingItems, setLoadingExistingItems] = useState(false)
  const [hasExistingItems, setHasExistingItems] = useState(false)

  // Reload trigger for date changes
  const [reloadTrigger, setRelloadTrigger] = useState(0)

  // Payment states
  const [totalPaid, setTotalPaid] = useState(0)
  const [paymentAmount, setPaymentAmount] = useState('')

  // Form state
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    date: new Date().toISOString().split('T')[0],
    items: [
      { id: 1, name: '', quantity: '', price: '', total: 0 }
    ]
  })

  const [totalAmount, setTotalAmount] = useState(0)
  const [balanceAmount, setBalanceAmount] = useState(0)

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

  // Debounced search term for local filtering
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  // Calculate total amount and balance whenever items or totalPaid changes
  useEffect(() => {
    const total = formData.items.reduce((sum, item) => {
      const price = parseFloat(item.price) || 0
      return sum + price
    }, 0)
    setTotalAmount(total)
    setBalanceAmount(total - totalPaid)
  }, [formData.items, totalPaid])

  // Check if customer name already exists (with trim fix)
  const customerExists = allCustomers.some(customer => 
    customer.fullName.toLowerCase().trim() === searchTerm.toLowerCase().trim()
  )

  // Filter customers locally based on search term (with trim fix)
  const filteredCustomers = allCustomers.filter(customer =>
    customer.fullName.toLowerCase().includes(debouncedSearchTerm.toLowerCase().trim()) ||
    customer.phone.includes(debouncedSearchTerm.trim())
  )

  // Load initial customers and items
  useEffect(() => {
    loadInitialData()
  }, [])

  // Load order data if in edit mode
  useEffect(() => {
    if (orderId) {
      loadOrderData()
    }
  }, [orderId])

  // Load existing items when customer or date changes and auto-fill form
  useEffect(() => {
    if (selectedCustomer && formData.date && !isEditMode) {
      loadExistingItems()
    }
  }, [selectedCustomer, formData.date, isEditMode, reloadTrigger])

  const loadInitialData = async () => {
    try {
      setSearchLoading(true)
      const [customersResponse, itemsResponse] = await Promise.all([
        axios.get('/customers'),
        axios.get('/items')
      ])
      setAllCustomers(customersResponse.data.data || [])
      setAllItems(itemsResponse.data.data || [])
    } catch (error) {
      console.error('Error loading initial data:', error)
      showToast('Failed to load initial data. Please check if server is running.', 'error')
    } finally {
      setSearchLoading(false)
    }
  }

  const loadOrderData = async () => {
    try {
      setInitialLoading(true)
      const response = await axios.get(`/orders/${orderId}`)
      const order = response.data.data
      
      if (order) {
        setIsEditMode(true)
        
        // Set customer data
        const customer = {
          _id: order.customerDetails._id,
          uniqueId: order.customerDetails.uniqueId,
          fullName: order.customerDetails.fullName,
          phone: order.customerDetails.phone
        }
        
        setSelectedCustomer(customer)
        setFormData(prev => ({
          ...prev,
          customerName: customer.fullName,
          customerPhone: customer.phone,
          date: order.date.split('T')[0] // Extract date part only
        }))
        
        // Set items data
        const itemsWithIds = order.items.map((item, index) => ({
          id: index + 1,
          name: item.name,
          quantity: item.quantity.toString(),
          price: item.price.toString(),
          total: item.price
        }))
        
        setFormData(prev => ({
          ...prev,
          items: itemsWithIds
        }))

        // Set payment data
        setTotalPaid(order.totalPaid || 0)
        
      }
    } catch (error) {
      console.error('Error loading order data:', error)
      showToast('Failed to load order data', 'error')
      navigate('/')
    } finally {
      setInitialLoading(false)
    }
  }

  // Load existing items for customer and date and auto-fill form
  const loadExistingItems = async () => {
    if (!selectedCustomer || !formData.date) return
    
    try {
      setLoadingExistingItems(true)
      const response = await axios.get(`/orders/customer/${selectedCustomer._id}/date/${formData.date}`)
      const existingOrders = response.data.data || []
      
      // Extract all items from existing orders
      const allExistingItems = existingOrders.flatMap(order => 
        order.items.map(item => ({
          ...item,
          orderId: order._id
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

        // Set payment data from existing order
        if (existingOrders[0]) {
          setTotalPaid(existingOrders[0].totalPaid || 0)
        }
        
      } else {
        setHasExistingItems(false)
        // Only reset to empty items if we're not already showing empty items
        if (formData.items.some(item => item.name || item.quantity || item.price)) {
          setFormData(prev => ({
            ...prev,
            items: [{ id: 1, name: '', quantity: '', price: '', total: 0 }]
          }))
        }
        setTotalPaid(0)
      }
      
    } catch (error) {
      console.error('Error loading existing items:', error)
      // Don't show error toast for this as it's not critical
    } finally {
      setLoadingExistingItems(false)
    }
  }

  // Handle date change - only for new orders, not for edit mode
  const handleDateChange = (newDate) => {
    if (isEditMode) {
      // Don't allow date change in edit mode
      showToast('Cannot change date in edit mode', 'warning')
      return
    }
    
    // Update the date and reset items immediately
    setFormData(prev => ({ 
      ...prev, 
      date: newDate,
      items: [{ id: 1, name: '', quantity: '', price: '', total: 0 }]
    }))
    
    // Reset existing items state
    setHasExistingItems(false)
    setExistingItems([])
    setTotalPaid(0)
    setPaymentAmount('')
    
    // Trigger reload after state updates
    setTimeout(() => {
      setRelloadTrigger(prev => prev + 1)
    }, 50)
  }

  const handleBack = () => {
    navigate(-1)
  }

  // Customer search and selection
  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer)
    setFormData(prev => ({
      ...prev,
      customerName: customer.fullName,
      customerPhone: customer.phone,
      date: new Date().toISOString().split('T')[0],
      items: [{ id: 1, name: '', quantity: '', price: '', total: 0 }]
    }))
    setSearchTerm('')
    setShowSuggestions(false)
    setHasExistingItems(false)
    setExistingItems([])
    setTotalPaid(0)
    setPaymentAmount('')
    
    // Trigger reload after state updates
    setTimeout(() => {
      setRelloadTrigger(prev => prev + 1)
    }, 50)
    
    showToast(`Selected customer: ${customer.fullName}`, 'success')
  }

  const handleClearCustomer = () => {
    setSelectedCustomer(null)
    setFormData(prev => ({
      ...prev,
      customerName: '',
      customerPhone: '',
      date: new Date().toISOString().split('T')[0],
      items: [{ id: 1, name: '', quantity: '', price: '', total: 0 }]
    }))
    setSearchTerm('')
    setExistingItems([])
    setHasExistingItems(false)
    setTotalPaid(0)
    setPaymentAmount('')
  }

  const handleNewCustomerOption = () => {
    if (!searchTerm.trim()) {
      showToast('Please enter a customer name', 'warning')
      return
    }
    setShowNewCustomerModal(true)
  }

  const generateUniqueId = () => {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substr(2, 5);
    return `CUST_${timestamp}_${randomStr}`.toUpperCase();
  }

  const generateOrderUniqueId = () => {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substr(2, 5);
    return `ORD_${timestamp}_${randomStr}`.toUpperCase();
  }

  const handleCreateNewCustomer = async () => {
    try {
      if (!searchTerm.trim()) {
        showToast('Customer name is required', 'error')
        return
      }

      // Validate phone number if provided
      if (newCustomerPhone && !/^\d{10}$/.test(newCustomerPhone.trim())) {
        showToast('Please enter a valid 10-digit phone number', 'error')
        return
      }

      setSearchLoading(true)

      const uniqueId = generateUniqueId()
      const newCustomer = {
        fullName: searchTerm.trim(),
        phone: newCustomerPhone.trim() || 'Not Provided',
        uniqueId: uniqueId
      }
      
      const response = await axios.post('/customers', newCustomer)
      const createdCustomer = response.data.data
      
      // Add new customer to local state
      setAllCustomers(prev => [createdCustomer, ...prev])
      setSelectedCustomer(createdCustomer)
      setFormData(prev => ({
        ...prev,
        customerName: createdCustomer.fullName,
        customerPhone: createdCustomer.phone,
        date: new Date().toISOString().split('T')[0],
        items: [{ id: 1, name: '', quantity: '', price: '', total: 0 }]
      }))
      setSearchTerm('')
      setNewCustomerPhone('')
      setShowNewCustomerModal(false)
      setShowSuggestions(false)
      setHasExistingItems(false)
      setExistingItems([])
      setTotalPaid(0)
      setPaymentAmount('')
      
      // Trigger reload after state updates
      setTimeout(() => {
        setRelloadTrigger(prev => prev + 1)
      }, 50)
      
      showToast(`Customer "${createdCustomer.fullName}" created successfully!`, 'success')
      
    } catch (error) {
      console.error('Error creating customer:', error)
      if (error.response?.data?.message) {
        showToast(error.response.data.message, 'error')
      } else {
        showToast('Failed to create customer. Please try again.', 'error')
      }
    } finally {
      setSearchLoading(false)
    }
  }

  const handleCancelNewCustomer = () => {
    setShowNewCustomerModal(false)
    setNewCustomerPhone('')
  }

  // Item search for item names
  const [showItemSuggestions, setShowItemSuggestions] = useState({})
  const [itemSearchTerms, setItemSearchTerms] = useState({})

  const handleItemSearch = useCallback((itemId, searchTerm) => {
    setItemSearchTerms(prev => ({
      ...prev,
      [itemId]: searchTerm
    }))
    setShowItemSuggestions(prev => ({
      ...prev,
      [itemId]: true
    }))
  }, [])

  const handleItemSelect = (itemId, itemName) => {
    updateItem(itemId, 'name', itemName)
    setShowItemSuggestions(prev => ({
      ...prev,
      [itemId]: false
    }))
    setItemSearchTerms(prev => ({
      ...prev,
      [itemId]: ''
    }))
  }

  // Filter items with priority - items starting with search term first
  const filteredItems = (itemId) => {
    const searchTerm = itemSearchTerms[itemId] || ''
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

  // Create item if not exists
  const createItemIfNotExists = async (itemName) => {
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

  // Payment handling - FIXED: Properly update payment before form submission
  const handlePaymentAmountChange = (amount) => {
    setPaymentAmount(amount)
  }

  // Update total paid - COMPLETELY REWRITTEN: Use the dedicated payment endpoint
  const updatePayment = async (orderIdToUpdate, payment) => {
    try {
      if (!payment || isNaN(payment) || payment < 0) {
        showToast('Please enter a valid payment amount', 'error')
        return false
      }

      if (payment > totalAmount) {
        showToast('Payment amount cannot exceed total amount', 'error')
        return false
      }

      // Use the dedicated payment endpoint - this is the key fix
      const response = await axios.post(`/orders/${orderIdToUpdate}/payment`, {
        amount: payment
      })
      
      if (response.data.success) {
        const updatedOrder = response.data.data
        
        // Update local state with the calculated values from database
        setTotalPaid(updatedOrder.totalPaid)
        setPaymentAmount('')
        
        showToast(`Payment updated to ₹${updatedOrder.totalPaid.toFixed(2)}`, 'success')
        return true
      }
      
    } catch (error) {
      console.error('Error updating payment:', error)
      if (error.response?.data?.message) {
        showToast(error.response.data.message, 'error')
      } else {
        showToast('Failed to update payment. Please try again.', 'error')
      }
      return false
    }
    return false
  }

  // Validate form before submission
  const validateForm = () => {
    setShowValidation(true)

    // Check if customer is selected
    if (!selectedCustomer) {
      showToast('Please select or create a customer', 'error')
      return false
    }

    // Check if date is valid
    if (!formData.date) {
      showToast('Please select an order date', 'error')
      return false
    }

    // Check if items are valid
    if (formData.items.length === 0) {
      showToast('Please add at least one item', 'error')
      return false
    }

    // Validate each item
    for (let i = 0; i < formData.items.length; i++) {
      const item = formData.items[i]
      
      if (!item.name.trim()) {
        showToast(`Item ${i + 1}: Please enter item name`, 'error')
        return false
      }

      if (!item.quantity || parseFloat(item.quantity) <= 0) {
        showToast(`Item ${i + 1}: Please enter a valid quantity (greater than 0)`, 'error')
        return false
      }

      if (!item.price || parseFloat(item.price) <= 0) {
        showToast(`Item ${i + 1}: Please enter a valid price (greater than 0)`, 'error')
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
  const handleCreateOrder = async () => {
    try {
      // Create items that don't exist
      const itemCreationPromises = formData.items.map(item => 
        createItemIfNotExists(item.name)
      )
      
      await Promise.all(itemCreationPromises)

      // Calculate total price (sum of all item prices)
      const calculatedTotal = formData.items.reduce((sum, item) => {
        return sum + (parseFloat(item.price) || 0)
      }, 0)

      // Generate unique order ID
      const orderUniqueId = generateOrderUniqueId()

      const orderData = {
        uniqueId: orderUniqueId,
        customerDetails: {
          _id: selectedCustomer._id,
          uniqueId: selectedCustomer.uniqueId,
          fullName: selectedCustomer.fullName,
          phone: selectedCustomer.phone
        },
        date: formData.date,
        items: formData.items.map(item => ({
          name: item.name,
          quantity: parseFloat(item.quantity) || 0,
          price: parseFloat(item.price) || 0
        })),
        totalAmount: calculatedTotal,
        totalPaid: totalPaid, // Use current state value
        balanceAmount: calculatedTotal - totalPaid
      }

      const response = await axios.post('/orders', orderData)
      const createdOrder = response.data.data
      
      // If payment amount is entered for new order, update payment after creation
      if (paymentAmount && paymentAmount !== '0' && parseFloat(paymentAmount) > 0) {
        await updatePayment(createdOrder._id, parseFloat(paymentAmount))
      }
      
      showToast('Order created successfully!', 'success')
      
      // Navigate after a short delay to show success message
      setTimeout(() => {
        navigate('/')
      }, 500)
      
    } catch (error) {
      console.error('Error creating order:', error)
      if (error.response?.data?.message) {
        showToast(error.response.data.message, 'error')
      } else {
        showToast('Failed to create order. Please try again.', 'error')
      }
    }
  }

  // Form submission for UPDATE
  const handleUpdateOrder = async () => {
    try {
      // Create items that don't exist
      const itemCreationPromises = formData.items.map(item => 
        createItemIfNotExists(item.name)
      )
      
      await Promise.all(itemCreationPromises)

      // Calculate total price (sum of all item prices)
      const calculatedTotal = formData.items.reduce((sum, item) => {
        return sum + (parseFloat(item.price) || 0)
      }, 0)

      const orderData = {
        customerDetails: {
          _id: selectedCustomer._id,
          uniqueId: selectedCustomer.uniqueId,
          fullName: selectedCustomer.fullName,
          phone: selectedCustomer.phone
        },
        date: formData.date,
        items: formData.items.map(item => ({
          name: item.name,
          quantity: parseFloat(item.quantity) || 0,
          price: parseFloat(item.price) || 0
        })),
        totalAmount: calculatedTotal,
        totalPaid: totalPaid, // Use current state value
        balanceAmount: calculatedTotal - totalPaid
      }

      let orderIdToUpdate;
      
      // If we have existing items but not in edit mode, we need to find the order ID
      if (hasExistingItems && !isEditMode && existingItems.length > 0) {
        // Use the first existing order's ID to update
        orderIdToUpdate = existingItems[0].orderId
        await axios.put(`/orders/${orderIdToUpdate}`, orderData)
        showToast('Order updated successfully!', 'success')
      } else if (isEditMode) {
        // Regular edit mode
        orderIdToUpdate = orderId
        await axios.put(`/orders/${orderId}`, orderData)
        showToast('Order updated successfully!', 'success')
      }

      // If payment amount is entered, update payment after order update
      if (paymentAmount && paymentAmount !== '0' && parseFloat(paymentAmount) > 0 && orderIdToUpdate) {
        await updatePayment(orderIdToUpdate, parseFloat(paymentAmount))
      }
      
      // Navigate after a short delay to show success message
      setTimeout(() => {
        navigate('/')
      }, 500)
      
    } catch (error) {
      console.error('Error updating order:', error)
      if (error.response?.data?.message) {
        showToast(error.response.data.message, 'error')
      } else {
        showToast('Failed to update order. Please try again.', 'error')
      }
    }
  }

  // Form submission handler - FIXED: Simplified approach
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate form before submission
    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      // For existing orders, we need to update the order with new items
      if (isEditMode || hasExistingItems) {
        await handleUpdateOrder()
      } else {
        await handleCreateOrder()
      }
    } catch (error) {
      console.error('Error in form submission:', error)
      showToast('An unexpected error occurred. Please try again.', 'error')
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

  if (initialLoading) {
    return (
      <div className="createOrderContainer">
        <div className="loadingState">
          <div className="loadingContent">
            <div className="loadingSpinner">
              <FontAwesomeIcon icon={faCarrot} className="spinnerIcon" />
              <div className="spinnerRing"></div>
            </div>
            <h3>Loading....</h3>
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
    <div className="createOrderContainer">
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
            <h1 className="title">{isEditMode ? 'Edit Order' : 'Create New Order'}</h1>
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
                    placeholder="Search Customer Name"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value)
                      setShowSuggestions(true)
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    className="searchInput"
                    disabled={loading || isEditMode}
                  />
                  {searchLoading && (
                    <FontAwesomeIcon 
                      icon={faSpinner} 
                      className="searchLoadingSpinner" 
                      spin 
                    />
                  )}
                </div>

                {showSuggestions && searchTerm && (
                  <div className="suggestionsDropdown">
                    {searchLoading ? (
                      <div className="loadingSuggestion">
                        <div className="loadingSpinnerSmall"></div>
                        <span>Loading customers...</span>
                      </div>
                    ) : filteredCustomers.length > 0 ? (
                      <>
                        {filteredCustomers.map(customer => (
                          <div
                            key={customer._id}
                            className="suggestionItem"
                            onClick={() => handleCustomerSelect(customer)}
                          >
                            <div className="customerAvatar">
                              {getInitials(customer.fullName)}
                            </div>
                            <div className="customerInfo">
                              <span className="customerName">{customer.fullName}</span>
                              <span className="customerPhone">{customer.phone}</span>
                            </div>
                          </div>
                        ))}
                        {!customerExists && (
                          <div
                            className="suggestionItem newCustomer"
                            onClick={handleNewCustomerOption}
                          >
                            <FontAwesomeIcon icon={faUser} className="newCustomerIcon" />
                            <div className="customerInfo">
                              <span className="customerName">Create new: "{searchTerm}"</span>
                              <span className="customerPhone">Add as new customer</span>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div
                        className="suggestionItem newCustomer"
                        onClick={handleNewCustomerOption}
                      >
                        <FontAwesomeIcon icon={faUser} className="newCustomerIcon" />
                        <div className="customerInfo">
                          <span className="customerName">Create new: "{searchTerm}"</span>
                          <span className="customerPhone">Add as new customer</span>
                        </div>
                      </div>
                    )}

                    {/* Show warning if customer already exists */}
                    {customerExists && searchTerm.trim() && (
                      <div className="customerExistsWarning">
                        <FontAwesomeIcon icon={faExclamationTriangle} />
                        <span>Customer "{searchTerm}" already exists. Please select from above.</span>
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
                      {getInitials(selectedCustomer.fullName)}
                    </div>
                    <div className="customerTextInfo">
                      <span className="customerName">{selectedCustomer.fullName}</span>
                      {selectedCustomer.phone && selectedCustomer.phone !== 'Not Provided' && (
                        <span className="customerPhone">{selectedCustomer.phone}</span>
                      )}
                    </div>
                  </div>
                  {!isEditMode && (
                    <button
                      type="button"
                      onClick={handleClearCustomer}
                      className="clearCustomerButton"
                      disabled={loading}
                    >
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* New Customer Modal */}
          {showNewCustomerModal && (
            <div className="modalOverlay">
              <div className="modalContent">
                <div className="modalHeader">
                  <h3>Create New Customer</h3>
                  <button 
                    type="button" 
                    onClick={handleCancelNewCustomer}
                    className="closeButton"
                    disabled={searchLoading}
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
                <div className="modalBody">
                  <div className="inputGroup">
                    <label className="inputLabel">Customer Name</label>
                    <input
                      type="text"
                      value={searchTerm}
                      readOnly
                      className="textInput"
                    />
                  </div>
                  <div className="inputGroup">
                    <label className="inputLabel">Phone Number (Optional)</label>
                    <div className="phoneInputWrapper">
                      <FontAwesomeIcon icon={faPhone} className="phoneIcon" />
                      <input
                        type="tel"
                        placeholder="Enter 10-digit phone number..."
                        value={newCustomerPhone}
                        onChange={(e) => setNewCustomerPhone(e.target.value)}
                        className="phoneInput"
                        disabled={searchLoading}
                        maxLength="10"
                      />
                    </div>
                    {newCustomerPhone && !/^\d{10}$/.test(newCustomerPhone.trim()) && (
                      <div className="validationError">
                        Please enter a valid 10-digit phone number
                      </div>
                    )}
                  </div>
                </div>
                <div className="modalActions">
                  <button
                    type="button"
                    onClick={handleCancelNewCustomer}
                    className="cancelButton"
                    disabled={searchLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateNewCustomer}
                    className="createButton"
                    disabled={searchLoading || (newCustomerPhone && !/^\d{10}$/.test(newCustomerPhone.trim()))}
                  >
                    {searchLoading ? (
                      <>
                        <FontAwesomeIcon icon={faSpinner} spin />
                        Creating...
                      </>
                    ) : (
                      'Create Customer'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Order Date */}
          {selectedCustomer && (
            <div className="formSection">
              <h3 className="sectionTitle">Order Details</h3>
              <div className="inputGroup">
                <label className="inputLabel">Order Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="dateInput"
                  disabled={loading || isEditMode} // Disable date change in edit mode
                  max={new Date().toISOString().split('T')[0]} // Cannot select future dates
                />
                {isEditMode && (
                  <div className="dateLockInfo">
                    <FontAwesomeIcon icon={faClock} />
                    <span>Date cannot be changed in edit mode</span>
                  </div>
                )}
              </div>

              {/* Existing Items Notification */}
              {!isEditMode && hasExistingItems && (
                <div className="existingItemsNotification">
                  <div className="notificationContent">
                    <FontAwesomeIcon icon={faHistory} className="notificationIcon" />
                    <div className="notificationText">
                      <strong>Auto-filled {existingItems.length} items</strong> from existing order on {formData.date}
                    </div>
                  </div>
                </div>
              )}

              {!isEditMode && loadingExistingItems && (
                <div className="loadingExistingItems">
                  <FontAwesomeIcon icon={faSpinner} spin />
                  <span>Checking for existing items...</span>
                </div>
              )}
            </div>
          )}

          {/* Items Section */}
          {selectedCustomer && (
            <div className="formSection">
              <div className="sectionHeader">
                <h3 className="sectionTitle">Order Items</h3>
                {hasExistingItems && (
                  <div className="existingItemsBadge">
                    <FontAwesomeIcon icon={faHistory} />
                    <span>Auto-filled from {formData.date}</span>
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
                        <label className="inputLabel">Item Name</label>
                        <div className="searchContainer">
                          <div className="searchInputWrapper">
                            <FontAwesomeIcon icon={faSearch} className="searchIcon" />
                            <input
                              type="text"
                              placeholder="Search item name..."
                              value={item.name}
                              onChange={(e) => {
                                updateItem(item.id, 'name', e.target.value)
                                handleItemSearch(item.id, e.target.value)
                              }}
                              onFocus={() => setShowItemSuggestions(prev => ({
                                ...prev,
                                [item.id]: true
                              }))}
                              onBlur={() => {
                                // Delay hiding suggestions to allow click
                                setTimeout(() => {
                                  setShowItemSuggestions(prev => ({
                                    ...prev,
                                    [item.id]: false
                                  }))
                                }, 200)
                              }}
                              className={`searchInput ${showValidation && !item.name.trim() ? 'invalid' : ''}`}
                              disabled={loading}
                            />
                          </div>

                          {showItemSuggestions[item.id] && itemSearchTerms[item.id] && (
                            <div className="suggestionsDropdown">
                              {filteredItems(item.id).length > 0 ? (
                                filteredItems(item.id).map((itemObj) => (
                                  <div
                                    key={itemObj._id}
                                    className="suggestionItem"
                                    onMouseDown={(e) => {
                                      e.preventDefault() // Prevent input blur
                                      handleItemSelect(item.id, itemObj.name)
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
                          <label className="inputLabel">Total Price (₹)</label>
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
                  Add Another Item
                </button>
              </div>
            </div>
          )}

          {/* Total Amount */}
          {selectedCustomer && formData.items.length > 0 && (
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

          {/* Beautiful Payment Section */}
          {selectedCustomer && formData.items.length > 0 && (
            <div className="formSection">
              <h3 className="sectionTitle">Payment</h3>
              
              {/* Minimal Payment Overview */}
              <div className="paymentOverview">
                <div className="paymentStats">
                  <div className="paymentStat">
                    <div className="statLabel">Total</div>
                    <div className="statAmount total">₹{totalAmount.toFixed(2)}</div>
                  </div>
                  <div className="paymentStat">
                    <div className="statLabel">Paid</div>
                    <div className="statAmount paid">₹{totalPaid.toFixed(2)}</div>
                  </div>
                  <div className="paymentStat">
                    <div className="statLabel">Balance</div>
                    <div className={`statAmount ${balanceAmount > 0 ? 'pending' : 'paid'}`}>
                      ₹{Math.abs(balanceAmount).toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Payment Progress */}
                <div className="paymentProgress">
                  <div className="progressBar">
                    <div 
                      className="progressFill"
                      style={{ width: `${Math.min(100, (totalPaid / totalAmount) * 100)}%` }}
                    ></div>
                  </div>
                  <div className="progressText">
                    {((totalPaid / totalAmount) * 100).toFixed(1)}% Paid
                  </div>
                </div>

                {/* Payment Input - Only show if balance is positive */}
                {balanceAmount > 0 && (
                  <div className="paymentInputCompact">
                    <div className="inputGroup">
                      <label className="inputLabel">Enter Payment</label>
                      <div className="paymentInputWrapper">
                        <FontAwesomeIcon icon={faRupeeSign} className="rupeeIcon" />
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          max={totalAmount}
                          placeholder="0.00"
                          value={paymentAmount}
                          onChange={(e) => handlePaymentAmountChange(e.target.value)}
                          className="paymentInput"
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Submit Button */}
          {selectedCustomer && formData.items.length > 0 && (
            <div className="submitSection">
              <button 
                type="submit" 
                className={`submitButton ${hasExistingItems || isEditMode ? 'updateButton' : ''}`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="loadingSpinner"></div>
                    {hasExistingItems || isEditMode ? 'Updating Order...' : 'Creating Order...'}
                  </>
                ) : (
                  hasExistingItems || isEditMode ? 'Update Order' : 'Create Order'
                )}
              </button>
            </div>
          )}
        </form>
      </main>
    </div>
  )
}