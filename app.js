const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
require('dotenv').config();
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());

// CORS setup with credentials and specific origin
app.use(
  cors({
    origin: ["http://localhost:3000", "https://ecommerce3-ahmd.netlify.app", "https://dallal-vert.vercel.app", "https://dallal.sy" , "www.sy-dallal.com" , "e-commerce3-theta.vercel.app"], // السماح بالموقع الحقيقي
    credentials: true, // للسماح بالكوكيز إذا لزم الأمر
  })
);
// Routes
const userRouter = require('./routes/userRouter');
app.use('/user', userRouter);

const adRouter = require('./routes/adRouter');
app.use('/ad', adRouter);

const adminRouter = require('./routes/admin.js');
app.use('/img', adminRouter);

const commentRoutes = require('./routes/commentRouter.js');
app.use('/comments', commentRoutes);
// MongoDB Connection
mongoose.connect(process.env.DB_URL)
  .then(() => {
    // Start the server after DB connection is successful
    app.listen(PORT, () => {
      console.log(`⁠ Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.log('MongoDB connection error:', error);
  });

// Home route for testing
app.get('/', (req, res) => {
  res.send("You are on the home page");
});