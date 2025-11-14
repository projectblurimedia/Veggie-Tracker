const mongoose = require('mongoose')

const customerSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Customer full name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  uniqueId: {
    type: String,
    required: true,
    unique: true,
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

// Virtual for total orders count
customerSchema.virtual('totalOrders', {
  ref: 'CustomerRecord',
  localField: 'uniqueId',
  foreignField: 'customerDetails.uniqueId',
  count: true
})

// Virtual for total revenue (total amount of all orders)
customerSchema.virtual('totalRevenue', {
  ref: 'CustomerRecord',
  localField: 'uniqueId',
  foreignField: 'customerDetails.uniqueId',
  justOne: false
})

// Virtual for total paid amount
customerSchema.virtual('totalPaid', {
  ref: 'CustomerRecord',
  localField: 'uniqueId',
  foreignField: 'customerDetails.uniqueId',
  justOne: false
})

// Virtual for outstanding balance (ALLOWING NEGATIVE VALUES FOR EXTRA PAYMENTS)
customerSchema.virtual('outstandingBalance', {
  ref: 'CustomerRecord',
  localField: 'uniqueId',
  foreignField: 'customerDetails.uniqueId',
  justOne: false
})

// Virtual for payment status summary - UPDATED LOGIC
customerSchema.virtual('paymentSummary').get(function() {
  if (this.totalRevenue === 0) return 'no-orders'
  if (this.outstandingBalance <= 0) return 'paid' // Negative or zero balance means paid
  if (this.outstandingBalance === this.totalRevenue) return 'pending'
  return 'partial'
})

// Pre-save middleware
customerSchema.pre('save', function(next) {
  this.updatedAt = Date.now()
  next()
})

// Static method to get customers with payment summary - UPDATED LOGIC
customerSchema.statics.getCustomersWithPaymentSummary = async function() {
  const customers = await this.aggregate([
    {
      $lookup: {
        from: 'customerrecords',
        localField: 'uniqueId',
        foreignField: 'customerDetails.uniqueId',
        as: 'orders'
      }
    },
    {
      $addFields: {
        totalOrders: { $size: '$orders' },
        totalRevenue: { 
          $sum: '$orders.totalAmount' 
        },
        totalPaid: { 
          $sum: '$orders.totalPaid' 
        },
        // Calculate balance amount (can be negative for extra payments)
        outstandingBalance: {
          $sum: '$orders.balanceAmount'
        }
      }
    },
    {
      $project: {
        fullName: 1,
        phone: 1,
        uniqueId: 1,
        createdAt: 1,
        updatedAt: 1,
        totalOrders: 1,
        totalRevenue: { $ifNull: ['$totalRevenue', 0] },
        totalPaid: { $ifNull: ['$totalPaid', 0] },
        // Allow negative values for outstanding balance (extra payments)
        outstandingBalance: { $ifNull: ['$outstandingBalance', 0] },
        paymentSummary: {
          $cond: {
            if: { $eq: ['$totalRevenue', 0] },
            then: 'no-orders',
            else: {
              $cond: {
                if: { 
                  $lte: ['$outstandingBalance', 0] 
                },
                then: 'paid', // Negative or zero balance means paid
                else: {
                  $cond: {
                    if: { 
                      $eq: ['$outstandingBalance', '$totalRevenue'] 
                    },
                    then: 'pending',
                    else: 'partial'
                  }
                }
              }
            }
          }
        }
      }
    },
    {
      $sort: { createdAt: -1 }
    }
  ])
  
  return customers
}

// Instance method to calculate payment summary - UPDATED LOGIC
customerSchema.methods.getPaymentSummary = async function() {
  const CustomerRecord = mongoose.model('CustomerRecord')
  const records = await CustomerRecord.find({ 
    'customerDetails.uniqueId': this.uniqueId 
  })
  
  const totalRevenue = records.reduce((total, record) => total + (record.totalAmount || 0), 0)
  const totalPaid = records.reduce((total, record) => total + (record.totalPaid || 0), 0)
  const outstandingBalance = records.reduce((total, record) => total + (record.balanceAmount || 0), 0)
  
  let paymentSummary = 'no-orders'
  if (totalRevenue > 0) {
    if (outstandingBalance <= 0) {
      paymentSummary = 'paid' // Negative or zero balance means paid
    } else if (outstandingBalance === totalRevenue) {
      paymentSummary = 'pending'
    } else {
      paymentSummary = 'partial'
    }
  }
  
  return {
    totalOrders: records.length,
    totalRevenue,
    totalPaid,
    outstandingBalance, 
    paymentSummary
  }
}

module.exports = mongoose.model('Customer', customerSchema)