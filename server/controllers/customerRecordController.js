const CustomerRecord = require('../models/CustomerRecord')

// Create new customer record (order)
const createCustomerRecord = async (req, res) => {
  try {
    const { customerDetails, date, items } = req.body

    const customerRecord = new CustomerRecord({
      customerDetails,
      date: date || new Date(),
      items
    })

    await customerRecord.save()

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: customerRecord
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating order',
      error: error.message
    })
  }
}

// Get all customer records
const getAllCustomerRecords = async (req, res) => {
  try {
    const records = await CustomerRecord.find()
      .sort({ date: -1, createdAt: -1 })
    
    res.status(200).json({
      success: true,
      data: records
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message
    })
  }
}

// Get customer records by customer ID
const getRecordsByCustomer = async (req, res) => {
  try {
    const { customerId } = req.params
    
    const records = await CustomerRecord.find({
      'customerDetails.uniqueId': customerId
    }).sort({ date: -1 })

    res.status(200).json({
      success: true,
      data: records
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching customer orders',
      error: error.message
    })
  }
}

// Get customer record by ID
const getRecordById = async (req, res) => {
  try {
    const record = await CustomerRecord.findById(req.params.id)
    
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      })
    }

    res.status(200).json({
      success: true,
      data: record
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching order',
      error: error.message
    })
  }
}

// Get records by date range
const getRecordsByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      })
    }

    const records = await CustomerRecord.find({
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }).sort({ date: -1 })

    res.status(200).json({
      success: true,
      data: records
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching orders by date range',
      error: error.message
    })
  }
}

// Update customer record
const updateCustomerRecord = async (req, res) => {
  try {
    const { customerDetails, date, items } = req.body
    
    const record = await CustomerRecord.findByIdAndUpdate(
      req.params.id,
      { customerDetails, date, items },
      { new: true, runValidators: true }
    )

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      })
    }

    res.status(200).json({
      success: true,
      message: 'Order updated successfully',
      data: record
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating order',
      error: error.message
    })
  }
}

// Delete customer record
const deleteCustomerRecord = async (req, res) => {
  try {
    const record = await CustomerRecord.findByIdAndDelete(req.params.id)
    
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      })
    }

    res.status(200).json({
      success: true,
      message: 'Order deleted successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting order',
      error: error.message
    })
  }
}

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    const totalOrders = await CustomerRecord.countDocuments()
    
    const totalRevenue = await CustomerRecord.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: '$totalPrice' }
        }
      }
    ])

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todayOrders = await CustomerRecord.countDocuments({
      date: { $gte: today, $lt: tomorrow }
    })

    const todayRevenue = await CustomerRecord.aggregate([
      {
        $match: {
          date: { $gte: today, $lt: tomorrow }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalPrice' }
        }
      }
    ])

    res.status(200).json({
      success: true,
      data: {
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        todayOrders,
        todayRevenue: todayRevenue[0]?.total || 0
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard stats',
      error: error.message
    })
  }
}

// Get orders by customer ID and date
const getOrderByCustormerAndDate = async (req, res) => {
  try {
    const { customerId, date } = req.params
    
    // Convert date to start and end of day
    const startDate = new Date(date)
    const endDate = new Date(date)
    endDate.setDate(endDate.getDate() + 1)
    
    const orders = await CustomerRecord.find({
      'customerDetails._id': customerId,
      date: {
        $gte: startDate,
        $lt: endDate
      }
    }).sort({ createdAt: -1 })
    
    res.json({
      success: true,
      data: orders,
      message: 'Orders fetched successfully'
    })
  } catch (error) {
    console.error('Error fetching orders by customer and date:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message
    })
  }
}

module.exports = {
  createCustomerRecord,
  getAllCustomerRecords,
  getRecordsByCustomer,
  getRecordById,
  getRecordsByDateRange,
  updateCustomerRecord,
  deleteCustomerRecord,
  getDashboardStats,
  getOrderByCustormerAndDate,
}