const express = require('express')
const router = express.Router()
const {list, read} = require('../controllers/cancelReservation')

router.get('/cancelReserv',list)
router.get('/cancelReserv/:id', read)

module.exports = router