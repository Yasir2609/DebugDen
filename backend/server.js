// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();

import app from './src/app.js';
import connectDB from './src/config/db.js';

// Server port from environment or default to 5000
const PORT = process.env.PORT || 5000;

// Connect to MongoDB then start listening
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });
});
