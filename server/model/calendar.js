const mongoose = require('mongoose')
const Schema = mongoose.Schema

const CalendarSchema = mongoose.Schema({
    reservDate: {
        type: String,
        required: true
    },
    startTime: {
        type: String,
        required: true
    },
    endTime: {
        type: String,
        required: true
    }
})

module.exports = mongoose.model("Calendar", CalendarSchema);