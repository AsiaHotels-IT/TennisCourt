const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/test');
        console.log('DB connected');
    } catch (err) {
        console.log('MongoDB connection error:', err.message);
    }
};

module.exports = connectDB;
