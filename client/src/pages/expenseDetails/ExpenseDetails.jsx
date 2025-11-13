import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faChevronLeft,
  faCalendar,
  faEdit,
  faReceipt
} from '@fortawesome/free-solid-svg-icons'
import axios from 'axios'
import { Toast } from '../../components/toast/Toast'
import './expenseDetails.scss'

export const ExpenseDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [expense, setExpense] = useState(null)
  const [loading, setLoading] = useState(true)
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

  // Get status color based on total cost
  const getStatusColor = (totalCost) => {
    if (totalCost > 1500) return '#ef4444'
    if (totalCost > 1000) return '#f59e0b'
    if (totalCost > 500) return '#8b5cf6'
    return '#3b82f6'
  }

  useEffect(() => {
    const fetchExpenseDetails = async () => {
      try {
        setLoading(true)
        const response = await axios.get(`/owner-records/${id}`)
        setExpense(response.data.data)
      } catch (error) {
        console.error('Error fetching expense details:', error)
        showToast('Failed to load expense details', 'error')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchExpenseDetails()
    }
  }, [id])

  const handleBack = () => {
    navigate(-1)
  }

  const handleEdit = () => {
    navigate(`/owner/create-expense/${id}`)
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="expenseDetailsContainer">
        <div className="loadingState">
          <div className="loadingContent">
            <div className="loadingSpinner"></div>
            <h3>Loading Expense Details</h3>
            <p>Please wait while we fetch the expense information...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!expense) {
    return (
      <div className="expenseDetailsContainer">
        <div className="errorState">
          <h3>Expense Not Found</h3>
          <p>The requested expense could not be found.</p>
          <button className="backButton" onClick={handleBack}>
            <FontAwesomeIcon icon={faChevronLeft} />
            Go Back
          </button>
        </div>
      </div>
    )
  }

  const statusColor = getStatusColor(expense.totalPrice)

  return (
    <div className="expenseDetailsContainer">
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

      {/* Header - Purple background for expenses */}
      <header className="expenseHeader">
        <div className="left">
          <button className="backButton" onClick={handleBack}>
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
          <div className="expenseHeaderInfo">
            <div className="avatarWithStatus">
              <div 
                className="expenseAvatar"
                style={{ backgroundColor: statusColor }}
              >
                <FontAwesomeIcon icon={faReceipt} />
              </div>
            </div>
            <div className="expenseTextInfo">
              <h2>Expense Record</h2>
              <div className="expenseMeta">
                <div className="metaItem">
                  <FontAwesomeIcon icon={faCalendar} />
                  <span>{formatDate(expense.date)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="right">
          <div className="navIcons">  
            <button 
              className="iconBtn editBtn"
              onClick={handleEdit}
              aria-label="Edit Expense"
            >
              <FontAwesomeIcon icon={faEdit} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="expenseContent">
        {/* Expense Summary */}
        <div className="expenseSummary">
          <div className="summaryCard">
            <h3>Expense Summary</h3>
            <div className="summaryDetails">
              <div className="summaryItem">
                <span className="label">Total Items:</span>
                <span className="value">{expense.items?.length || 0}</span>
              </div>
              <div className="summaryItem">
                <span className="label">Total Quantity:</span>
                <span className="value">
                  {expense.items?.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0).toFixed(2)}
                </span>
              </div>
              <div className="summaryItem total">
                <span className="label">Total Amount:</span>
                <span className="value" style={{ color: statusColor }}>
                  ₹{expense.totalPrice?.toFixed(2) || '0.00'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Items List */}
        <div className="itemsSection">
          <h2>Expense Items ({expense.items?.length || 0})</h2>
          <div className="itemsList">
            {expense.items?.map((item, index) => (
              <div key={index} className="itemCard">
                <div className="itemHeader">
                  <h4 className="itemName">{item.name}</h4>
                  <div className="itemPrice">₹{item.price}</div>
                </div>
                <div className="itemDetails">
                  <div className="quantity">
                    <span className="label">Quantity:</span>
                    <span className="value">{item.quantity}</span>
                  </div>
                  <div className="unitPrice">
                    <span className="label">Unit Price:</span>
                    <span className="value">
                      ₹{(parseFloat(item.price) / parseFloat(item.quantity)).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}