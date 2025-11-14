const OwnerRecord = require('../models/OwnerRecord')

// Create new owner record
const createOwnerRecord = async (req, res) => {
  try {
    const { date, items, description, recordType } = req.body

    const ownerRecord = new OwnerRecord({
      date: date || new Date(),
      items,
      description,
      recordType: recordType || 'SALE'
    })

    await ownerRecord.save()

    res.status(201).json({
      success: true,
      message: 'Owner record created successfully',
      data: ownerRecord
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating owner record',
      error: error.message
    })
  }
}

// Get all owner records
const getAllOwnerRecords = async (req, res) => {
  try {
    const records = await OwnerRecord.find()
      .sort({ date: -1, createdAt: -1 })
    
    res.status(200).json({
      success: true,
      data: records
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching owner records',
      error: error.message
    })
  }
}

// Get owner record by ID
const getOwnerRecordById = async (req, res) => {
  try {
    const record = await OwnerRecord.findById(req.params.id)
    
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Owner record not found'
      })
    }

    res.status(200).json({
      success: true,
      data: record
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching owner record',
      error: error.message
    })
  }
}

// Get records by date range
const getOwnerRecordsByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      })
    }

    const records = await OwnerRecord.getByDateRange(startDate, endDate)

    res.status(200).json({
      success: true,
      data: records
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching owner records by date range',
      error: error.message
    })
  }
}

// Get records by type
const getOwnerRecordsByType = async (req, res) => {
  try {
    const { type } = req.params
    
    const validTypes = ['SALE', 'PURCHASE', 'EXPENSE', 'INCOME']
    if (!validTypes.includes(type.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid record type'
      })
    }

    const records = await OwnerRecord.getByType(type.toUpperCase())

    res.status(200).json({
      success: true,
      data: records
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching owner records by type',
      error: error.message
    })
  }
}

// Update owner record - FIXED VERSION
const updateOwnerRecord = async (req, res) => {
  try {
    const { date, items, description, recordType } = req.body
    
    // Find the record first
    const record = await OwnerRecord.findById(req.params.id)
    
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Owner record not found'
      })
    }

    // Update fields
    if (date) record.date = date
    if (items) record.items = items
    if (description !== undefined) record.description = description
    if (recordType) record.recordType = recordType

    // Save the record (this will trigger the pre('save') middleware and recalculate totalPrice)
    await record.save()

    res.status(200).json({
      success: true,
      message: 'Owner record updated successfully',
      data: record
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating owner record',
      error: error.message
    })
  }
}

// Alternative update method using manual total calculation
const updateOwnerRecordAlternative = async (req, res) => {
  try {
    const { date, items, description, recordType } = req.body
    
    // Calculate total price manually if items are provided
    let updateData = { date, description, recordType }
    
    if (items) {
      const totalPrice = items.reduce((total, item) => {
        return total + (item.price || 0)
      }, 0)
      updateData.items = items
      updateData.totalPrice = totalPrice
    }

    const record = await OwnerRecord.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Owner record not found'
      })
    }

    res.status(200).json({
      success: true,
      message: 'Owner record updated successfully',
      data: record
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating owner record',
      error: error.message
    })
  }
}

// Delete owner record
const deleteOwnerRecord = async (req, res) => {
  try {
    const record = await OwnerRecord.findByIdAndDelete(req.params.id)
    
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Owner record not found'
      })
    }

    res.status(200).json({
      success: true,
      message: 'Owner record deleted successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting owner record',
      error: error.message
    })
  }
}

// Get owner dashboard statistics
const getOwnerDashboardStats = async (req, res) => {
  try {
    const totalRecords = await OwnerRecord.countDocuments()
    
    const totalRevenue = await OwnerRecord.aggregate([
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

    const todayRecords = await OwnerRecord.countDocuments({
      date: { $gte: today, $lt: tomorrow }
    })

    const todayRevenue = await OwnerRecord.aggregate([
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

    // Get records by type
    const recordsByType = await OwnerRecord.aggregate([
      {
        $group: {
          _id: '$recordType',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalPrice' }
        }
      }
    ])

    res.status(200).json({
      success: true,
      data: {
        totalRecords,
        totalRevenue: totalRevenue[0]?.total || 0,
        todayRecords,
        todayRevenue: todayRevenue[0]?.total || 0,
        recordsByType
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching owner dashboard stats',
      error: error.message
    })
  }
}

// Get financial summary
const getFinancialSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query
    
    let matchCriteria = {}
    if (startDate && endDate) {
      matchCriteria.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }

    const financialSummary = await OwnerRecord.aggregate([
      {
        $match: matchCriteria
      },
      {
        $group: {
          _id: '$recordType',
          totalAmount: { $sum: '$totalPrice' },
          recordCount: { $sum: 1 },
          averageAmount: { $avg: '$totalPrice' }
        }
      }
    ])

    const totalSummary = await OwnerRecord.aggregate([
      {
        $match: matchCriteria
      },
      {
        $group: {
          _id: null,
          grandTotal: { $sum: '$totalPrice' },
          totalRecords: { $sum: 1 }
        }
      }
    ])

    res.status(200).json({
      success: true,
      data: {
        byType: financialSummary,
        overall: totalSummary[0] || { grandTotal: 0, totalRecords: 0 }
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching financial summary',
      error: error.message
    })
  }
}

// Get owner records by specific date
const getOwnerRecordsByDate = async (req, res) => {
  try {
    const { date } = req.params
    
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date parameter is required'
      })
    }

    // Parse the date and create range for the entire day
    const startDate = new Date(date)
    startDate.setHours(0, 0, 0, 0)
    
    const endDate = new Date(date)
    endDate.setHours(23, 59, 59, 999)

    const records = await OwnerRecord.find({
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ date: -1, createdAt: -1 })

    res.status(200).json({
      success: true,
      data: records
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching owner records by date',
      error: error.message
    })
  }
}

module.exports = {
  createOwnerRecord,
  getAllOwnerRecords,
  getOwnerRecordById,
  getOwnerRecordsByDateRange,
  getOwnerRecordsByType,
  updateOwnerRecord,
  deleteOwnerRecord,
  getOwnerDashboardStats,
  getFinancialSummary,
  getOwnerRecordsByDate,
}