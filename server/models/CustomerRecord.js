const mongoose = require('mongoose')

const orderItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0.01, 'Quantity must be at least 0.01'] 
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  total: {
    type: Number,
    default: 0
  }
})

const customerRecordSchema = new mongoose.Schema({
  customerDetails: {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true
    },
    uniqueId: {
      type: String,
      required: [true, 'Customer uniqueId is required'],
      ref: 'Customer'
    },
    fullName: {
      type: String,
      required: [true, 'Customer name is required']
    },
    phone: {
      type: String,
      required: [true, 'Customer phone is required']
    }
  },
  date: {
    type: Date,
    required: [true, 'Order date is required'],
    default: Date.now
  },
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    default: 0,
    min: [0, 'Total amount cannot be negative']
  },
  totalPaid: {
    type: Number,
    default: 0,
    min: [0, 'Total paid cannot be negative']
  },
  balanceAmount: {
    type: Number,
    default: 0,
    min: [0, 'Balance amount cannot be negative'] // Ensures balance is never negative
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid'],
    default: 'pending'
  },
  uniqueId: {
    type: String,
    unique: true,
    default: function() {
      return 'ORDER' + Date.now().toString() + Math.random().toString(36).substr(2, 5).toUpperCase()
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// Calculate item totals and order totals before saving
customerRecordSchema.pre('save', function(next) {
  // For each item, total is the same as price (since price is already total for quantity)
  this.items.forEach(item => {
    item.total = item.price || 0  // Just use the price directly
  })

  // Calculate total amount for the order (sum of all item prices)
  this.totalAmount = this.items.reduce((total, item) => {
    return total + (item.price || 0)  // Sum the prices directly
  }, 0)

  // Ensure totalPaid doesn't exceed totalAmount and balance is never negative
  if (this.totalPaid > this.totalAmount) {
    this.totalPaid = this.totalAmount
  }

  // Calculate balance amount - ensure it's never negative
  this.balanceAmount = Math.max(this.totalAmount - this.totalPaid, 0)

  // Update payment status based on amounts
  if (this.balanceAmount <= 0) {
    this.paymentStatus = 'paid'
  } else if (this.totalPaid > 0) {
    this.paymentStatus = 'partial'
  } else {
    this.paymentStatus = 'pending'
  }

  this.updatedAt = Date.now()
  next()
})

// Virtual for formatted amounts
customerRecordSchema.virtual('formattedTotalAmount').get(function() {
  return `₹${this.totalAmount.toFixed(2)}`
})

customerRecordSchema.virtual('formattedTotalPaid').get(function() {
  return `₹${this.totalPaid.toFixed(2)}`
})

customerRecordSchema.virtual('formattedBalanceAmount').get(function() {
  return `₹${this.balanceAmount.toFixed(2)}`
})

// Instance method to add payment (ensures balance never becomes negative)
customerRecordSchema.methods.addPayment = function(amount) {
  if (amount <= 0) {
    throw new Error('Payment amount must be positive')
  }
  
  const newTotalPaid = this.totalPaid + amount
  
  // Prevent overpayment - cap at totalAmount
  if (newTotalPaid > this.totalAmount) {
    throw new Error(`Payment amount exceeds outstanding balance. Maximum payment allowed: ₹${(this.totalAmount - this.totalPaid).toFixed(2)}`)
  }
  
  this.totalPaid = newTotalPaid
  this.balanceAmount = Math.max(this.totalAmount - this.totalPaid, 0)
  
  // Update payment status
  if (this.balanceAmount <= 0) {
    this.paymentStatus = 'paid'
  } else if (this.totalPaid > 0) {
    this.paymentStatus = 'partial'
  }
  
  return this.save()
}

// Instance method to update payment (set specific amount)
customerRecordSchema.methods.updatePayment = function(newTotalPaid) {
  if (newTotalPaid < 0) {
    throw new Error('Payment amount cannot be negative')
  }
  
  // Prevent overpayment - cap at totalAmount
  if (newTotalPaid > this.totalAmount) {
    throw new Error(`Payment amount exceeds total order amount. Maximum payment allowed: ₹${this.totalAmount.toFixed(2)}`)
  }
  
  this.totalPaid = newTotalPaid
  this.balanceAmount = Math.max(this.totalAmount - this.totalPaid, 0)
  
  // Update payment status
  if (this.balanceAmount <= 0) {
    this.paymentStatus = 'paid'
  } else if (this.totalPaid > 0) {
    this.paymentStatus = 'partial'
  } else {
    this.paymentStatus = 'pending'
  }
  
  return this.save()
}

// Static method to find records by payment status
customerRecordSchema.statics.findByPaymentStatus = function(status) {
  return this.find({ paymentStatus: status })
}

// Static method to get total outstanding balance for a customer
customerRecordSchema.statics.getCustomerOutstandingBalance = function(customerId) {
  return this.aggregate([
    {
      $match: {
        'customerDetails._id': new mongoose.Types.ObjectId(customerId),
        'balanceAmount': { $gt: 0 }
      }
    },
    {
      $group: {
        _id: '$customerDetails._id',
        totalOutstanding: { $sum: '$balanceAmount' },
        customerName: { $first: '$customerDetails.fullName' },
        recordCount: { $sum: 1 }
      }
    }
  ])
}

// Static method to get all records for a customer with payment summary
customerRecordSchema.statics.getCustomerRecords = function(customerUniqueId) {
  return this.find({ 'customerDetails.uniqueId': customerUniqueId })
    .sort({ date: -1 })
    .populate('customerDetails._id')
}

module.exports = mongoose.model('CustomerRecord', customerRecordSchema)