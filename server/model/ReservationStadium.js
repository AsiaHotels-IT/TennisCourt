const mongoose = require('mongoose')
const AutoIncrement = require('mongoose-sequence')(mongoose)
const Schema = mongoose.Schema

const ReservationStadiumSchema = mongoose.Schema({
    reservID: {
        type: Number,
        unique: true
    },
    memberID: {
        type: mongoose.Schema.Types.Number,
        ref: 'Member',
    },
    cusName: {
        type: String,
        maxlenght: 100,
        required: true
    },
    cusTel: {
        type: String,
        maxlength: 10,
        required: true
    },
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
    },
    status: {
        type: String,
        enum: ['จองแล้ว', 'ใช้งานแล้ว', 'ยกเลิก'],
        default: 'จองแล้ว'
    },
    paymentMethod: {
      type: String,
      enum: ['ยังไม่ชำระเงิน','เงินสด', 'QR', 'โอนผ่านธนาคาร'], //โอนผ่านธนาคาร
      default: 'ยังไม่ชำระเงิน'
    },
    payDate:{
        type: String,
        default: null
    },
    refPerson:{
        type: String,
        maxlength: 100,
        default: 'ไม่มี'
    },
    beforeVat: {
        type: Number,
        default: 0
    },
    vat: {
        type: Number,
        default: 0
    },
    price: {
        type: Number
    },
    receiptNumber: {
        type: String,
        default: null,  // ค่าเริ่มต้นไม่มีเลขใบเสร็จ
    },
    receiptDate: {
        type: Date,
        default: null,
    },
    username:{
        type: String,
        maxlength: 100,
        required: true,
    },
    createAt: {
        type: Date,
        default: Date.now
    },
    received: {
        type: Number
    },
    changeVal: {
        type: Number
    },
    changer: { type: String, maxlength: 100 },
    oldStart: String,
    oldEnd: String,
    newStart: String,
    newEnd: String,
    changeTime: String,
})

ReservationStadiumSchema.plugin(AutoIncrement, {inc_field: "reservID"});
module.exports = mongoose.model("Reservation", ReservationStadiumSchema);