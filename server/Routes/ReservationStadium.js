const express = require('express')
const router = express.Router()
const {list, read, create, update, remove, checkAvailability, payAndCreateReceipt} = require('../controllers/ReservationStadium')

router.get('/reservation', list)
router.get('/reservation/:id', read)
router.post('/reservation', create)
router.put('/reservation/:id', update)
router.delete('/reservation/:id', remove)
router.post('/reservation/check', checkAvailability)
router.post('/reservation/:id/pay', payAndCreateReceipt)

module.exports = router
