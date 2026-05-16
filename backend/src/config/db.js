const mongoose = require('mongoose');

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.error('FATAL: MONGO_URI environment variable is not set.');
    console.error('Set it in Railway > Service > Variables > MONGO_URI');
    process.exit(1);
  }
  if (!process.env.JWT_SECRET) {
    console.error('FATAL: JWT_SECRET environment variable is not set.');
    process.exit(1);
  }
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
