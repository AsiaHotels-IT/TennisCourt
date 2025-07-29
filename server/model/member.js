const mongoose = require('mongoose')
const AutoIncrement = require('mongoose-sequence')(mongoose)
const Schema = mongoose.Schema

const memberSchema = mongoose.Schema({
    cusName: {
        type: String,
        maxlength: 20,
        required: true,
    },
    cusTel: {
        type: String,
        maxlength: 10,
        required: true,
    },
    memberPoint: {
        type: Number,
        default: 0
    },
    memberStart: {
        type: Date,
        default: Date()
    },
    username:{
        type: String,
        maxlength: 100,
        required: true,
    },
    reservationBefore: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Reservation"
        },
    ]
});

memberSchema.plugin(AutoIncrement, {inc_field: "memberID"});
module.exports = mongoose.model("Member", memberSchema);