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
    default: 0
  },
  totalPaid: {
    type: Number,
    default: 0,
    min: [0, 'Total paid cannot be negative']
  },
  balanceAmount: {
    type: Number,
    default: 0
    // Removed min:0 constraint to allow negative balances (overpayment/credit)
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'overpaid'],
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

  // Calculate balance amount - ALLOW NEGATIVE VALUES (overpayment/credit)
  this.balanceAmount = this.totalAmount - this.totalPaid

  // Update payment status based on amounts
  if (this.balanceAmount < 0) {
    this.paymentStatus = 'overpaid' // New status for overpayment
  } else if (this.balanceAmount === 0) {
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
  return `₹${Math.abs(this.balanceAmount).toFixed(2)}`
})

// Virtual to check if balance is negative (credit/overpaid)
customerRecordSchema.virtual('isOverpaid').get(function() {
  return this.balanceAmount < 0
})

// Instance method to add payment (allows overpayment creating negative balance)
customerRecordSchema.methods.addPayment = function(amount) {
  if (amount <= 0) {
    throw new Error('Payment amount must be positive')
  }
  
  this.totalPaid += amount
  this.balanceAmount = this.totalAmount - this.totalPaid
  
  // Update payment status (now allows overpaid status)
  if (this.balanceAmount < 0) {
    this.paymentStatus = 'overpaid'
  } else if (this.balanceAmount === 0) {
    this.paymentStatus = 'paid'
  } else if (this.totalPaid > 0) {
    this.paymentStatus = 'partial'
  } else {
    this.paymentStatus = 'pending'
  }
  
  return this.save()
}

// Instance method to update payment (set specific amount) - allows overpayment
customerRecordSchema.methods.updatePayment = function(newTotalPaid) {
  if (newTotalPaid < 0) {
    throw new Error('Payment amount cannot be negative')
  }
  
  this.totalPaid = newTotalPaid
  this.balanceAmount = this.totalAmount - this.totalPaid
  
  // Update payment status (now allows overpaid status)
  if (this.balanceAmount < 0) {
    this.paymentStatus = 'overpaid'
  } else if (this.balanceAmount === 0) {
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

// Static method to get total outstanding balance for a customer (only positive balances)
customerRecordSchema.statics.getCustomerOutstandingBalance = function(customerId) {
  return this.aggregate([
    {
      $match: {
        'customerDetails._id': new mongoose.Types.ObjectId(customerId),
        'balanceAmount': { $gt: 0 } // Only positive balances (amounts owed)
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

// Static method to get customer credit (negative balances)
customerRecordSchema.statics.getCustomerCredit = function(customerId) {
  return this.aggregate([
    {
      $match: {
        'customerDetails._id': new mongoose.Types.ObjectId(customerId),
        'balanceAmount': { $lt: 0 } // Only negative balances (credit)
      }
    },
    {
      $group: {
        _id: '$customerDetails._id',
        totalCredit: { $sum: '$balanceAmount' },
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