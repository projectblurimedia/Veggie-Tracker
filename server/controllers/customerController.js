const Customer = require('../models/Customer')
const CustomerRecord = require('../models/CustomerRecord')

// Create new customer
const createCustomer = async (req, res) => {
  try {
    const { fullName, phone, uniqueId } = req.body

    if (!uniqueId) {
      return res.status(400).json({
        success: false,
        message: 'Unique ID is required'
      })
    }

    const existingCustomerById = await Customer.findOne({ uniqueId })
    if (existingCustomerById) {
      return res.status(400).json({
        success: false,
        message: 'Customer with this unique ID already exists'
      })
    }

    if (phone && phone.trim() !== '' && phone !== 'Not Provided') {
      const existingCustomer = await Customer.findOne({ phone })
      if (existingCustomer) {
        return res.status(400).json({
          success: false,
          message: 'Customer with this phone number already exists'
        })
      }
    }

    const customer = new Customer({
      fullName,
      phone: phone && phone.trim() !== '' ? phone : 'Not Provided',
      uniqueId
    })

    await customer.save()

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: customer
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating customer',
      error: error.message
    })
  }
}

// Get all customers with payment summary
const getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.getCustomersWithPaymentSummary()

    // Calculate overall stats
    const stats = {
      totalCustomers: customers.length,
      totalOrders: customers.reduce((sum, customer) => sum + customer.totalOrders, 0),
      totalRevenue: customers.reduce((sum, customer) => sum + customer.totalRevenue, 0),
      totalOutstanding: customers.reduce((sum, customer) => sum + customer.outstandingBalance, 0),
      totalPaid: customers.reduce((sum, customer) => sum + customer.totalPaid, 0)
    }

    res.status(200).json({
      success: true,
      data: customers,
      stats: stats
    })
  } catch (error) {
    console.error('Error fetching customers:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching customers',
      error: error.message
    })
  }
}

// Search customers by name or phone
const searchCustomers = async (req, res) => {
  try {
    const { search } = req.query
    
    if (!search) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      })
    }

    // Get all customers with payment summary and then filter
    const allCustomers = await Customer.getCustomersWithPaymentSummary()
    
    const filteredCustomers = allCustomers.filter(customer => 
      customer.fullName.toLowerCase().includes(search.toLowerCase()) ||
      customer.phone.includes(search)
    )

    res.status(200).json({
      success: true,
      data: filteredCustomers
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error searching customers',
      error: error.message
    })
  }
}

// Get customer by ID with payment summary
const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id)
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      })
    }

    // Get payment summary using instance method
    const paymentSummary = await customer.getPaymentSummary()

    // Get all orders for this customer
    const orders = await CustomerRecord.find({ 
      'customerDetails.uniqueId': customer.uniqueId 
    }).sort({ date: -1 })

    const customerWithStats = {
      ...customer.toObject(),
      ...paymentSummary,
      orders: orders
    }

    res.status(200).json({
      success: true,
      data: customerWithStats
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching customer',
      error: error.message
    })
  }
}

// Update customer
const updateCustomer = async (req, res) => {
  try {
    const { fullName, phone } = req.body
    
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { fullName, phone },
      { new: true, runValidators: true }
    )

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      })
    }

    res.status(200).json({
      success: true,
      message: 'Customer updated successfully',
      data: customer
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating customer',
      error: error.message
    })
  }
}

// Delete customer
const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id)
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      })
    }

    // Check if customer has orders
    const orderCount = await CustomerRecord.countDocuments({ 
      'customerDetails.uniqueId': customer.uniqueId 
    })

    if (orderCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete customer with existing orders. Please delete orders first.'
      })
    }

    await Customer.findByIdAndDelete(req.params.id)

    res.status(200).json({
      success: true,
      message: 'Customer deleted successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting customer',
      error: error.message
    })
  }
}

// Get customers by payment status
const getCustomersByPaymentStatus = async (req, res) => {
  try {
    const { status } = req.params

    const validStatuses = ['paid', 'partial', 'pending', 'no-orders']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment status'
      })
    }

    const customers = await Customer.getCustomersWithPaymentSummary()
    
    const filteredCustomers = customers.filter(customer => 
      customer.paymentSummary === status
    )

    const stats = {
      totalCustomers: filteredCustomers.length,
      totalOrders: filteredCustomers.reduce((sum, customer) => sum + customer.totalOrders, 0),
      totalRevenue: filteredCustomers.reduce((sum, customer) => sum + customer.totalRevenue, 0),
      totalOutstanding: filteredCustomers.reduce((sum, customer) => sum + customer.outstandingBalance, 0)
    }

    res.status(200).json({
      success: true,
      data: filteredCustomers,
      stats: stats
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching customers by payment status',
      error: error.message
    })
  }
}

// Get orders by customer uniqueId
const getOrdersByCustomer = async (req, res) => {
  try {
    const { uniqueId } = req.params

    const orders = await CustomerRecord.find({ 
      'customerDetails.uniqueId': uniqueId 
    }).sort({ date: -1 })

    res.status(200).json({
      success: true,
      data: orders
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching customer orders',
      error: error.message
    })
  }
}

module.exports = {
  createCustomer,
  getAllCustomers,
  searchCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  getCustomersByPaymentStatus,
  getOrdersByCustomer,
}