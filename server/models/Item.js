const mongoose = require('mongoose')

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Item name is required'],
    unique: true,
    trim: true,
    set: function(name) {
      return name.toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    },
  },
  uniqueId: {
    type: String,
    unique: true,
    default: function() {
      return 'ITEM' + Date.now().toString() + Math.random().toString(36).substr(2, 5).toUpperCase()
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

module.exports = mongoose.model('Item', itemSchema)