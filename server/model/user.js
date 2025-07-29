const mongoose = require('mongoose');  
const AutoIncrement = require('mongoose-sequence')(mongoose);

const userSchema = mongoose.Schema({
    username:{
        type: String,
        maxlength: 20,
        required: true,
    },
    name:{
        type: String,
        maxlength: 100,
        required: true,
    },
    password:{
        type: String,
        maxlength: 20,
        required: true,
    },
    role:{
        type: String,
        enum: ['auditor', 'cashier'],
        required: true,
    },
    adder:{
        type: String,
        maxlength: 100,
        required: true,
    },
},{timestamps: true})

userSchema.plugin(AutoIncrement, {inc_field: "userID"});
module.exports = mongoose.model("User", userSchema);