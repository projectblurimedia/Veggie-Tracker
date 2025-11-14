const express = require('express')
const router = express.Router()
const {
  createCustomer,
  getAllCustomers,
  searchCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  getCustomersByPaymentStatus,
  getOrdersByCustomer
} = require('../controllers/customerController')

// GET /api/customers - Get all customers
router.get('/', getAllCustomers)

// GET /api/customers/search - Search customers
router.get('/search', searchCustomers)

// GET /api/customers/status/:status - Get customers by payment status
router.get('/status/:status', getCustomersByPaymentStatus)

// GET /api/customers/:id - Get customer by ID
router.get('/:id', getCustomerById)

// POST /api/customers - Create new customer
router.post('/', createCustomer)

// PUT /api/customers/:id - Update customer
router.put('/:id', updateCustomer)

// DELETE /api/customers/:id - Delete customer
router.delete('/:id', deleteCustomer)

// GET /api/orders/customer/:uniqueId - Get orders by customer uniqueId
router.get('/customer/:uniqueId', getOrdersByCustomer)

module.exports = router