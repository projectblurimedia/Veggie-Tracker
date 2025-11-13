const express = require('express')
const router = express.Router()
const {
  createOwnerRecord,
  getAllOwnerRecords,
  getOwnerRecordById,
  getOwnerRecordsByDateRange,
  getOwnerRecordsByType,
  updateOwnerRecord,
  deleteOwnerRecord,
  getOwnerDashboardStats,
  getFinancialSummary,
  getOwnerRecordsByDate
} = require('../controllers/ownerRecordController')

// Create owner record
router.post('/', createOwnerRecord)

// Get all owner records
router.get('/', getAllOwnerRecords)

// Get owner record by ID
router.get('/:id', getOwnerRecordById)

// Get records by date range
router.get('/filter/date-range', getOwnerRecordsByDateRange)

// Get records by type
router.get('/type/:type', getOwnerRecordsByType)

// Get dashboard statistics
router.get('/stats/dashboard', getOwnerDashboardStats)

// Get financial summary
router.get('/stats/financial-summary', getFinancialSummary)

// Update owner record
router.put('/:id', updateOwnerRecord)

// Delete owner record
router.delete('/:id', deleteOwnerRecord)

router.get('/date/:date', getOwnerRecordsByDate)


module.exports = router