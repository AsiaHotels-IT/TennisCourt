const express = require('express')
const router = express.Router()
const {list} = require('../controllers/calendar')

router.get('/calendar',list)

module.exports = router