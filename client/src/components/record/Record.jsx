import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faEdit,
  faPlus,
  faRupeeSign
} from '@fortawesome/free-solid-svg-icons'
import './record.scss'

export const Record = ({ 
  customer, 
  index, 
  onEditClick, 
  onAddItemsClick 
}) => {
  const getInitials = (name) => {
    if (!name) return 'NA'
    const nameParts = name.split(' ')
    if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase()
    return (nameParts[0].charAt(0) + nameParts[1].charAt(0)).toUpperCase()
  }

  const getStatusColor = (totalCost) => {
    if (totalCost > 1500) return '#ef4444'
    if (totalCost > 1000) return '#f59e0b'
    if (totalCost > 500) return '#3b82f6'
    return '#10b981'
  }

  const statusColor = getStatusColor(customer.totalCost)

  return (
    <div className="recordCard">
      {/* Card Header */}
      <div className="cardHeader">
        <div className="headerLeft">
          <div 
            className="orderIndicator"
            style={{ backgroundColor: statusColor }}
          >
            # {index + 1}
          </div>
          <div className="customerMainInfo">
            <h3 className="customerName">{customer.name}</h3>
            <div className="orderMeta">
              <span className="itemCount">
                {customer.items.length} items
              </span>
              <span className="separator">•</span>
              <span 
                className="totalAmount"
                style={{ color: statusColor }}
              >
                ₹{customer.totalCost.toFixed(0)}
              </span>
            </div>
          </div>
        </div>
        <div className="headerRight">
          <div 
            className="customerAvatar"
            style={{ backgroundColor: statusColor }}
          >
            {getInitials(customer.name)}
          </div>
        </div>
      </div>

      {/* Items Section */}
      <div className="itemsSection">
        <div className="itemsList">
          {customer.items.slice(0, 4).map((item, itemIndex) => (
            <div key={itemIndex} className="itemRow">
              <span className="itemName">
                {item.name}
              </span>
              <div className="itemDetails">
                <span className="quantity">{item.quantity}</span>
                <span className="separator">~</span>
                <span className="cost">₹{item.cost}</span>
              </div>
            </div>
          ))}
          {customer.items.length > 4 && (
            <div className="moreItems">
              +{customer.items.length - 4} more items
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="actionButtons">
        <button 
          className="actionBtn editBtn"
          onClick={(e) => onEditClick(customer.id, e)}
        >
          <FontAwesomeIcon icon={faEdit} />
          Edit
        </button>
        <button 
          className="actionBtn addItemsBtn"
          onClick={(e) => onAddItemsClick(customer.id, e)}
        >
          <FontAwesomeIcon icon={faPlus} />
          Add Items
        </button>
      </div>
    </div>
  )
}