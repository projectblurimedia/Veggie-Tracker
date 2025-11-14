const mongoose = require('mongoose')

const ownerItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  }
})

const ownerRecordSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: [true, 'Record date is required'],
    default: Date.now
  },
  items: [ownerItemSchema],
  totalPrice: {
    type: Number,
    default: 0,
  },
  uniqueId: {
    type: String,
    unique: true,
    default: function() {
      return 'OWNER' + Date.now().toString() + Math.random().toString(36).substr(2, 5).toUpperCase()
    }
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  recordType: {
    type: String,
    enum: ['SALE', 'PURCHASE', 'EXPENSE', 'INCOME'],
    default: 'SALE'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
})

// Calculate total price before saving
ownerRecordSchema.pre('save', function(next) {
  this.totalPrice = this.items.reduce((total, item) => {
    return total + (item.price || 0)
  }, 0)
  
  // Update the updatedAt field
  this.updatedAt = Date.now()
  next()
})

// Also trigger total price calculation when items are modified via findOneAndUpdate
ownerRecordSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate()
  
  // If items are being updated, recalculate totalPrice
  if (update.$set && update.$set.items) {
    const totalPrice = update.$set.items.reduce((total, item) => {
      return total + (item.price || 0)
    }, 0)
    update.$set.totalPrice = totalPrice
  } else if (update.items) {
    const totalPrice = update.items.reduce((total, item) => {
      return total + (item.price || 0)
    }, 0)
    update.totalPrice = totalPrice
  }
  
  // Update the updatedAt field
  if (update.$set) {
    update.$set.updatedAt = Date.now()
  } else {
    update.updatedAt = Date.now()
  }
  
  next()
})

// Static method to get records by date range
ownerRecordSchema.statics.getByDateRange = function(startDate, endDate) {
  return this.find({
    date: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  }).sort({ date: -1 })
}

// Static method to get records by type
ownerRecordSchema.statics.getByType = function(recordType) {
  return this.find({ recordType }).sort({ date: -1 })
}

// Instance method to recalculate total (useful for manual updates)
ownerRecordSchema.methods.recalculateTotal = function() {
  this.totalPrice = this.items.reduce((total, item) => {
    return total + (item.price || 0)
  }, 0)
  return this.totalPrice
}

module.exports = mongoose.model('OwnerRecord', ownerRecordSchema)