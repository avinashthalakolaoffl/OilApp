const mongoose = require('mongoose');

const MONGO_URI = 'mongodb+srv://avinashthalakolaoffl_db_user:Avinash1028@cluster0.mnrsxbu.mongodb.net/oilsales?appName=Cluster0';

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
