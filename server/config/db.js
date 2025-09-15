const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://10.10.0.37:27017/tennis');
        console.log('DB connected');
    } catch (err) {
        console.log('MongoDB connection error:', err.message);
    }
};

module.exports = connectDB;
