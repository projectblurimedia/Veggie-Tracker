const CustomerRecord = require('../models/CustomerRecord')

// Helper function to calculate order totals (ALLOWS NEGATIVE BALANCES)
const calculateOrderTotals = (record) => {
  // Calculate item totals - price already includes quantity, so just set total equal to price
  if (record.items && record.items.length > 0) {
    record.items.forEach(item => {
      item.total = item.price || 0
    })
  }

  // Calculate totalAmount from items
  record.totalAmount = record.items.reduce((total, item) => {
    return total + (item.total || 0)
  }, 0)

  // Calculate balance amount - ALLOW NEGATIVE VALUES
  record.balanceAmount = (record.totalAmount || 0) - (record.totalPaid || 0)

  // Update payment status based on amounts (INCLUDES OVERPAID STATUS)
  if (record.balanceAmount < 0) {
    record.paymentStatus = 'overpaid'
  } else if (record.balanceAmount === 0) {
    record.paymentStatus = 'paid'
  } else if (record.totalPaid > 0) {
    record.paymentStatus = 'partial'
  } else {
    record.paymentStatus = 'pending'
  }

  return record
}

// Create new customer record (order)
const createCustomerRecord = async (req, res) => {
  try {
    const { customerDetails, date, items, totalPaid } = req.body

    const customerRecord = new CustomerRecord({
      customerDetails,
      date: date || new Date(),
      items,
      totalPaid: totalPaid || 0
    })

    // Calculate totals before saving
    calculateOrderTotals(customerRecord)

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

// Get all customer records - FIXED: Sort by latest first
const getAllCustomerRecords = async (req, res) => {
  try {
    const records = await CustomerRecord.find()
      .sort({ date: -1, createdAt: -1 }) // Sort by date descending, then by creation time
    
    // Ensure all records have calculated totals
    const recordsWithTotals = records.map(record => {
      const recordObj = record.toObject()
      return calculateOrderTotals(recordObj)
    })
    
    res.status(200).json({
      success: true,
      data: recordsWithTotals
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
      'customerDetails._id': customerId
    }).sort({ date: -1, createdAt: -1 }) // Sort by latest first

    // Ensure all records have calculated totals
    const recordsWithTotals = records.map(record => {
      const recordObj = record.toObject()
      return calculateOrderTotals(recordObj)
    })

    res.status(200).json({
      success: true,
      data: recordsWithTotals
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

    // Ensure record has calculated totals
    const recordWithTotals = calculateOrderTotals(record.toObject())

    res.status(200).json({
      success: true,
      data: recordWithTotals
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching order',
      error: error.message
    })
  }
}

// Get records by date range - FIXED: Sort by latest first
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
    }).sort({ date: -1, createdAt: -1 }) // Sort by date descending, then by creation time

    // Ensure all records have calculated totals
    const recordsWithTotals = records.map(record => {
      const recordObj = record.toObject()
      return calculateOrderTotals(recordObj)
    })

    res.status(200).json({
      success: true,
      data: recordsWithTotals
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching orders by date range',
      error: error.message
    })
  }
}

// Update customer record - FIXED: Allows negative balances
const updateCustomerRecord = async (req, res) => {
  try {
    const { customerDetails, date, items, totalPaid } = req.body
    
    // First get the current record to preserve existing data if not provided
    const currentRecord = await CustomerRecord.findById(req.params.id)
    if (!currentRecord) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      })
    }

    // Prepare update data
    const updateData = {
      customerDetails: customerDetails || currentRecord.customerDetails,
      date: date || currentRecord.date,
      items: items || currentRecord.items,
      totalPaid: totalPaid !== undefined ? totalPaid : currentRecord.totalPaid,
      updatedAt: new Date()
    }

    // Calculate totals before updating (NOW ALLOWS NEGATIVE BALANCES)
    const recordWithTotals = calculateOrderTotals(updateData)

    const record = await CustomerRecord.findByIdAndUpdate(
      req.params.id,
      recordWithTotals,
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

// Add payment to record - FIXED: Allows overpayment
const addPaymentToRecord = async (req, res) => {
  try {
    const { amount } = req.body
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid payment amount is required'
      })
    }

    const record = await CustomerRecord.findById(req.params.id)
    
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      })
    }

    // Add payment and save (NOW ALLOWS OVERPAYMENT)
    record.totalPaid += parseFloat(amount)
    
    // Recalculate balance and payment status (ALLOWS NEGATIVE BALANCES)
    record.balanceAmount = record.totalAmount - record.totalPaid
    
    // Update payment status (INCLUDES OVERPAID STATUS)
    if (record.balanceAmount < 0) {
      record.paymentStatus = 'overpaid'
    } else if (record.balanceAmount === 0) {
      record.paymentStatus = 'paid'
    } else if (record.totalPaid > 0) {
      record.paymentStatus = 'partial'
    } else {
      record.paymentStatus = 'pending'
    }

    record.updatedAt = new Date()

    await record.save()

    // Return the fully calculated record
    const updatedRecord = calculateOrderTotals(record.toObject())

    res.status(200).json({
      success: true,
      message: 'Payment added successfully',
      data: updatedRecord
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding payment',
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

// Get dashboard statistics - UPDATED: Includes overpaid status
const getDashboardStats = async (req, res) => {
  try {
    const totalOrders = await CustomerRecord.countDocuments()
    
    // Get all records and calculate totals manually for accurate stats
    const allRecords = await CustomerRecord.find().sort({ date: -1, createdAt: -1 })
    let totalRevenue = 0
    let totalPaid = 0
    let totalBalance = 0
    let totalCredit = 0 // Negative balances (overpayment)

    allRecords.forEach(record => {
      const recordWithTotals = calculateOrderTotals(record.toObject())
      totalRevenue += recordWithTotals.totalAmount || 0
      totalPaid += recordWithTotals.totalPaid || 0
      const balance = recordWithTotals.balanceAmount || 0
      totalBalance += Math.max(balance, 0) // Only positive balances
      totalCredit += Math.min(balance, 0)  // Only negative balances (credit)
    })

    const paymentStats = await CustomerRecord.aggregate([
      {
        $group: {
          _id: '$paymentStatus',
          count: { $sum: 1 },
          amount: { $sum: '$balanceAmount' }
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

    // Calculate today's revenue manually for accuracy
    const todayRecords = await CustomerRecord.find({
      date: { $gte: today, $lt: tomorrow }
    }).sort({ date: -1, createdAt: -1 })
    
    let todayRevenue = 0
    let todayPaid = 0
    let todayBalance = 0
    let todayCredit = 0
    
    todayRecords.forEach(record => {
      const recordWithTotals = calculateOrderTotals(record.toObject())
      todayRevenue += recordWithTotals.totalAmount || 0
      todayPaid += recordWithTotals.totalPaid || 0
      const balance = recordWithTotals.balanceAmount || 0
      todayBalance += Math.max(balance, 0)
      todayCredit += Math.min(balance, 0)
    })

    res.status(200).json({
      success: true,
      data: {
        totalOrders,
        totalRevenue,
        totalPaid,
        totalBalance,
        totalCredit: Math.abs(totalCredit), // Positive value for display
        paymentStats,
        todayOrders,
        todayRevenue,
        todayPaid,
        todayBalance,
        todayCredit: Math.abs(todayCredit) // Positive value for display
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
    }).sort({ date: -1, createdAt: -1 }) // Sort by latest first
    
    // Ensure all records have calculated totals
    const ordersWithTotals = orders.map(record => {
      const recordObj = record.toObject()
      return calculateOrderTotals(recordObj)
    })
    
    res.json({
      success: true,
      data: ordersWithTotals,
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

// Get records by payment status
const getRecordsByPaymentStatus = async (req, res) => {
  try {
    const { status } = req.params
    
    const records = await CustomerRecord.findByPaymentStatus(status)
    
    // Ensure all records have calculated totals
    const recordsWithTotals = records.map(record => {
      const recordObj = record.toObject()
      return calculateOrderTotals(recordObj)
    })
    
    res.status(200).json({
      success: true,
      data: recordsWithTotals
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching orders by payment status',
      error: error.message
    })
  }
}

// Get customer outstanding balance (only positive balances)
const getCustomerOutstandingBalance = async (req, res) => {
  try {
    const { customerId } = req.params
    
    const outstanding = await CustomerRecord.getCustomerOutstandingBalance(customerId)
    
    res.status(200).json({
      success: true,
      data: outstanding[0] || {
        _id: customerId,
        totalOutstanding: 0,
        customerName: '',
        recordCount: 0
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching customer outstanding balance',
      error: error.message
    })
  }
}

// Get customer credit (negative balances)
const getCustomerCredit = async (req, res) => {
  try {
    const { customerId } = req.params
    
    const credit = await CustomerRecord.getCustomerCredit(customerId)
    
    res.status(200).json({
      success: true,
      data: credit[0] || {
        _id: customerId,
        totalCredit: 0,
        customerName: '',
        recordCount: 0
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching customer credit',
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
  addPaymentToRecord,
  deleteCustomerRecord,
  getDashboardStats,
  getOrderByCustormerAndDate,
  getRecordsByPaymentStatus,
  getCustomerOutstandingBalance,
  getCustomerCredit
}