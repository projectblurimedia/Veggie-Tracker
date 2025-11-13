const Customer = require('../models/Customer')
const CustomerRecord = require('../models/CustomerRecord') // Add this import

// Create new customer
const createCustomer = async (req, res) => {
  try {
    const { fullName, phone } = req.body

    // Check if customer with same phone already exists
    const existingCustomer = await Customer.findOne({ phone })
    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: 'Customer with this phone number already exists'
      })
    }

    const customer = new Customer({
      fullName,
      phone
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

// Get all customers
const getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 })
    
    // Add totalOrders and totalRevenue for each customer
    const customersWithStats = await Promise.all(
      customers.map(async (customer) => {
        const customerObj = customer.toObject()
        
        // Get total orders count
        const totalOrders = await CustomerRecord.countDocuments({ 
          'customerDetails.uniqueId': customer.uniqueId 
        })
        
        // Get total revenue
        const orders = await CustomerRecord.find({ 
          'customerDetails.uniqueId': customer.uniqueId 
        })
        const totalRevenue = orders.reduce((total, order) => total + (order.totalPrice || 0), 0)
        
        return {
          ...customerObj,
          totalOrders,
          totalRevenue
        }
      })
    )

    const totalCustomers = customersWithStats.length
    const totalOrders = customersWithStats.reduce((sum, customer) => sum + customer.totalOrders, 0)
    const totalRevenue = customersWithStats.reduce((sum, customer) => sum + customer.totalRevenue, 0)

    
    res.status(200).json({
      success: true,
      data: customersWithStats,
      stats: {
        totalCustomers,
        totalOrders,
        totalRevenue
      }
    })
  } catch (error) {
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

    const customers = await Customer.find({
      $or: [
        { fullName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ]
    }).sort({ fullName: 1 })

    // Add totalOrders and totalRevenue for each customer
    const customersWithStats = await Promise.all(
      customers.map(async (customer) => {
        const customerObj = customer.toObject()
        
        // Get total orders count
        const totalOrders = await CustomerRecord.countDocuments({ 
          'customerDetails.uniqueId': customer.uniqueId 
        })
        
        // Get total revenue
        const orders = await CustomerRecord.find({ 
          'customerDetails.uniqueId': customer.uniqueId 
        })
        const totalRevenue = orders.reduce((total, order) => total + (order.totalPrice || 0), 0)
        
        return {
          ...customerObj,
          totalOrders,
          totalRevenue
        }
      })
    )

    res.status(200).json({
      success: true,
      data: customersWithStats
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error searching customers',
      error: error.message
    })
  }
}

// Get customer by ID
const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id)
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      })
    }

    const customerObj = customer.toObject()
    
    // Get total orders count
    const totalOrders = await CustomerRecord.countDocuments({ 
      'customerDetails.uniqueId': customer.uniqueId 
    })
    
    // Get total revenue
    const orders = await CustomerRecord.find({ 
      'customerDetails.uniqueId': customer.uniqueId 
    })
    const totalRevenue = orders.reduce((total, order) => total + (order.totalPrice || 0), 0)
    
    const customerWithStats = {
      ...customerObj,
      totalOrders,
      totalRevenue
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
    const customer = await Customer.findByIdAndDelete(req.params.id)
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      })
    }

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

module.exports = {
  createCustomer,
  getAllCustomers,
  searchCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer
}