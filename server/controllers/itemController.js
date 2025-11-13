const Item = require('../models/Item')

// Create new item
const createItem = async (req, res) => {
  try {
    const { name } = req.body

    const item = new Item({
      name: name
    })

    await item.save()

    res.status(201).json({
      success: true,
      message: 'Item created successfully',
      data: item
    })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Item with this name already exists'
      })
    }
    res.status(500).json({
      success: false,
      message: 'Error creating item',
      error: error.message
    })
  }
}

// Get all items
const getAllItems = async (req, res) => {
  try {
    const items = await Item.find().sort({ name: 1 })
    
    res.status(200).json({
      success: true,
      data: items
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching items',
      error: error.message
    })
  }
}

// Search items by name
const searchItems = async (req, res) => {
  try {
    const { search } = req.query
    
    if (!search) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      })
    }

    const items = await Item.find({
      name: { $regex: search, $options: 'i' }
    }).sort({ name: 1 })

    res.status(200).json({
      success: true,
      data: items
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error searching items',
      error: error.message
    })
  }
}

// Bulk create items
const bulkCreateItems = async (req, res) => {
  try {
    const { items } = req.body // items should be an array of strings
    
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Items array is required and cannot be empty'
      })
    }

    const itemDocuments = items.map(name => ({
      name: name.toUpperCase().trim()
    }))

    const createdItems = await Item.insertMany(itemDocuments, { ordered: false })

    res.status(201).json({
      success: true,
      message: `${createdItems.length} items created successfully`,
      data: createdItems
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating items',
      error: error.message
    })
  }
}

// Delete item
const deleteItem = async (req, res) => {
  try {
    const item = await Item.findByIdAndDelete(req.params.id)
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      })
    }

    res.status(200).json({
      success: true,
      message: 'Item deleted successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting item',
      error: error.message
    })
  }
}

module.exports = {
  createItem,
  getAllItems,
  searchItems,
  bulkCreateItems,
  deleteItem
}