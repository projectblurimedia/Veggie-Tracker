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
    unique: true,
    trim: true
  },
  uniqueId: {
    type: String,
    unique: true,
    default: function() {
      return 'CUST' + Date.now().toString() + Math.random().toString(36).substr(2, 5).toUpperCase()
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

// Virtual for total orders count
customerSchema.virtual('totalOrders', {
  ref: 'CustomerRecord',
  localField: 'uniqueId',
  foreignField: 'customerDetails.uniqueId',
  count: true
})

// Virtual for total revenue
customerSchema.virtual('totalRevenue', {
  ref: 'CustomerRecord',
  localField: 'uniqueId',
  foreignField: 'customerDetails.uniqueId',
  justOne: false,
  options: { 
    match: { /* you can add any additional filters here if needed */ } 
  }
})

// Pre-save middleware
customerSchema.pre('save', function(next) {
  this.updatedAt = Date.now()
  next()
})

// Instance method to calculate revenue (alternative approach)
customerSchema.methods.calculateTotalRevenue = async function() {
  const CustomerRecord = mongoose.model('CustomerRecord')
  const records = await CustomerRecord.find({ 
    'customerDetails.uniqueId': this.uniqueId 
  })
  
  return records.reduce((total, record) => total + (record.totalPrice || 0), 0)
}

// Instance method to get orders count (alternative approach)
customerSchema.methods.getTotalOrders = async function() {
  const CustomerRecord = mongoose.model('CustomerRecord')
  return await CustomerRecord.countDocuments({ 
    'customerDetails.uniqueId': this.uniqueId 
  })
}

module.exports = mongoose.model('Customer', customerSchema)