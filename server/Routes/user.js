const express = require('express')
const router = express.Router()
const {list, read, create, update, remove} = require('../controllers/user')

router.get('/user', list)
router.get('/user/:id', read)
router.post('/user', create)
router.put('/user/:id', update)
router.delete('/user/:id', remove)

module.exports = router