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
  getOrderByCustormerAndDate,
  addPaymentToRecord,
  getRecordsByPaymentStatus,
  getCustomerOutstandingBalance
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
router.post('/:id/payment', addPaymentToRecord)
router.get('/status/:status', getRecordsByPaymentStatus)
router.get('/customer/:customerId/outstanding', getCustomerOutstandingBalance)

module.exports = router