const mongoose = require('mongoose');

const MONGO_URI_FALLBACK = 'mongodb+srv://Shivom:Shivom%402006@cluster0.bdmsunz.mongodb.net/taskflow';

const connectDB = async () => {
  const uri = process.env.MONGO_URI || MONGO_URI_FALLBACK;
  try {
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
