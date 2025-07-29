const mongoose = require('mongoose')
const AutoIncrement = require('mongoose-sequence')(mongoose)
const Schema = mongoose.Schema

const reprintReceipt = mongoose.Schema({
    receiptNumber: {
        type: String,
    },
    username:{
        type: String,
        maxlength: 100,
        required: true,
    },
    reprintAt: {
        type: Date,
        default: Date.now
    }
})

reprintReceipt.plugin(AutoIncrement, {inc_field: "reprintReID"});
module.exports = mongoose.model("ReprintReceipt", reprintReceipt);