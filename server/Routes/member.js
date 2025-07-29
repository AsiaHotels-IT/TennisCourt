const express = require('express')
const router = express.Router()
const {list, read, create, update, remove} = require('../controllers/member')

router.get('/member', list)
router.get('/member/:id', read)
router.post('/member', create)
router.put('/member/:id', update)
router.delete('/member/:id', remove)

module.exports = router