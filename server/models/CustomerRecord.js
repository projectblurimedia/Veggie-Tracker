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
  totalPrice: {
    type: Number,
    default: 0 
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
  }
})

customerRecordSchema.pre('save', function(next) {
  this.totalPrice = this.items.reduce((total, item) => {
    return total + (item.price || 0)
  }, 0)
  next()
})

module.exports = mongoose.model('CustomerRecord', customerRecordSchema)