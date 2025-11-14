import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faEdit,
  faCheckCircle,
  faClock,
  faReceipt,
  faWeightHanging,
  faBoxes,
  faRupeeSign,
  faChevronDown,
  faChevronUp
} from '@fortawesome/free-solid-svg-icons'
import './record.scss'
import { useState } from 'react'

export const Record = ({ 
  customer, 
  index, 
  onEditClick, 
  onClick,
  totalAmount,
  totalPaid,
  balanceAmount,
  paymentStatus
}) => {
  const [showAllItems, setShowAllItems] = useState(false)

  const getInitials = (name) => {
    if (!name) return 'NA'
    const nameParts = name.split(' ')
    if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase()
    return (nameParts[0].charAt(0) + nameParts[1].charAt(0)).toUpperCase()
  }

  const getStatusColor = (status, balance) => {
    switch (status) {
      case 'paid':
        return '#10b981' // Green
      case 'partial':
        return '#f59e0b' // Amber
      case 'pending':
        return '#ef4444' // Red
      default:
        return balance > 0 ? '#ef4444' : '#10b981'
    }
  }

  const getPaymentIcon = (status) => {
    switch (status) {
      case 'paid':
        return faCheckCircle
      case 'partial':
        return faReceipt
      case 'pending':
        return faClock
      default:
        return faClock
    }
  }

  const getPaymentText = (status, balance) => {
    switch (status) {
      case 'paid':
        return 'Paid'
      case 'partial':
        return `₹${balance.toFixed(0)} Due`
      case 'pending':
        return `₹${balance.toFixed(0)} Due`
      default:
        return balance > 0 ? `₹${balance.toFixed(0)} Due` : 'Paid'
    }
  }

  const getStatusBackgroundColor = (status) => {
    switch (status) {
      case 'paid':
        return '#f0fdf4' // Light green
      case 'partial':
        return '#fffbeb' // Light amber
      case 'pending':
        return '#fef2f2' // Light red
      default:
        return '#f0fdf4'
    }
  }

  const getStatusBorderColor = (status) => {
    switch (status) {
      case 'paid':
        return '#10b981' // Green border
      case 'partial':
        return '#f59e0b' // Amber border
      case 'pending':
        return '#ef4444' // Red border
      default:
        return '#10b981'
    }
  }

  const statusColor = getStatusColor(paymentStatus, balanceAmount)
  const statusBgColor = getStatusBackgroundColor(paymentStatus)
  const statusBorderColor = getStatusBorderColor(paymentStatus)
  const paymentIcon = getPaymentIcon(paymentStatus)
  const paymentText = getPaymentText(paymentStatus, balanceAmount)

  const handleEdit = (e) => {
    e.stopPropagation()
    onEditClick(customer.id, e)
  }

  const toggleShowAllItems = (e) => {
    e.stopPropagation()
    setShowAllItems(!showAllItems)
  }

  // Show only 2 items initially, or all if showAllItems is true
  const itemsToShow = showAllItems ? customer.items : customer.items.slice(0, 2)
  const hasMoreItems = customer.items.length > 2

  return (
    <div className="recordCard" onClick={() => onClick(customer.id)}>
      {/* Card Header */}
      <div className="cardHeader">
        <div className="headerLeft">
          <div 
            className="customerAvatar"
            style={{ backgroundColor: statusColor }}
          >
            {getInitials(customer.name)}
          </div>
          <div className="customerMainInfo">
            <h3 className="customerName">{customer.name}</h3>
            <div className="orderMeta">
              <div className="metaItem itemsCount">
                <FontAwesomeIcon icon={faBoxes} className="metaIcon" />
                <span>{customer.items.length} items</span>
              </div>
              <div 
                className="metaItem paymentStatusHeader"
                style={{
                  backgroundColor: statusBgColor,
                  border: `1.5px solid ${statusBorderColor}`,
                  color: statusColor
                }}
              >
                <FontAwesomeIcon icon={paymentIcon} className="metaIcon" />
                <span>{paymentText}</span>
              </div>
            </div>
          </div>
        </div>
        {/* Right side left empty as requested */}
      </div>

      {/* Items Section */}
      <div className="itemsSection">
        <div className="sectionHeader">
          <h4 className="sectionTitle">Order Items</h4>
          <div className="totalAmountInfo">
            <span className="totalLabel">Total Amount:</span>
            <span className="totalAmount">₹{totalAmount?.toFixed(2) || customer.totalCost.toFixed(2)}</span>
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
                {showAllItems ? 'Show Less' : `+${customer.items.length - 2} more items`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="actionButtons">
        <button 
          className="actionBtn editBtn"
          onClick={handleEdit}
        >
          <FontAwesomeIcon icon={faEdit} />
          Edit Order
        </button>
      </div>
    </div>
  )
}