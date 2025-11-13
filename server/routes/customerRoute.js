const express = require('express')
const router = express.Router()
const {
  createCustomer,
  getAllCustomers,
  searchCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer
} = require('../controllers/customerController')

router.post('/', createCustomer)
router.get('/', getAllCustomers)
router.get('/search', searchCustomers)
router.get('/:id', getCustomerById)
router.put('/:id', updateCustomer)
router.delete('/:id', deleteCustomer)

module.exports = router