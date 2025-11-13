const express = require('express')
const router = express.Router()
const {
  createItem,
  getAllItems,
  searchItems,
  bulkCreateItems,
  deleteItem
} = require('../controllers/itemController')

router.post('/', createItem)
router.post('/bulk', bulkCreateItems)
router.get('/', getAllItems)
router.get('/search', searchItems)
router.delete('/:id', deleteItem)

module.exports = router