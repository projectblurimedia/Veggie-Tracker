const express = require('express')
const router = express.Router()
const {
  createCustomerRecord,
  getAllCustomerRecords,
  getRecordsByCustomer,
  getRecordById,
  getRecordsByDateRange,
  updateCustomerRecord,
  deleteCustomerRecord,
  getDashboardStats,
  getOrderByCustormerAndDate
} = require('../controllers/customerRecordController')

router.post('/', createCustomerRecord)
router.get('/', getAllCustomerRecords)
router.get('/stats', getDashboardStats)
router.get('/customer/:customerId', getRecordsByCustomer)
router.get('/date-range', getRecordsByDateRange)
router.get('/:id', getRecordById)
router.put('/:id', updateCustomerRecord)
router.delete('/:id', deleteCustomerRecord)
router.get('/customer/:customerId/date/:date', getOrderByCustormerAndDate)

module.exports = router