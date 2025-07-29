const express = require('express')
const router = express.Router()
const {list, read, create, remove} = require('../controllers/reprintReceipt')

router.get('/reprintReceipt', list)
router.get('/reprintReceipt/:id', read)
router.post('/reprintReceipt', create)
router.delete('/reprintReceipt/:id', remove)

module.exports = router