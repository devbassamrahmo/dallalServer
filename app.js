const express = require('express');
const http = require("http");
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const { initNotificationSocket } = require("./sockets/notificationSocket.js");
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
    origin: ["http://localhost:3000", "https://ecommerce3-ahmd.netlify.app", "https://dallal-vert.vercel.app", "https://dallal.sy" , "https://www.sy-dallal.com" , "https://e-commerce3-theta.vercel.app"], // السماح بالموقع الحقيقي
    credentials: true, // للسماح بالكوكيز إذا لزم الأمر
  })
);
// Routes
const userRouter = require('./routes/userRouter');
app.use('/user', userRouter);
// Routes
const authRouter = require('./routes/authRouter.js');
app.use('/api/auth', authRouter);

const adRouter = require('./routes/adRouter');
app.use('/ad', adRouter);

const adminRouter = require('./routes/admin.js');
app.use('/img', adminRouter);

const commentRoutes = require('./routes/commentRouter.js');
app.use('/comments', commentRoutes);

const exportsRoutes = require('./routes/export.js');
app.use('/export', exportsRoutes);

const requresRoutes = require('./routes/requestRoutes.js');
app.use('/requests', requresRoutes);

const notificationsRoutes = require('./routes/notificationsRouter.js');
app.use('/notifications', notificationsRoutes);

const messageRoutes = require("./routes/messageRouter.js");
app.use("/messages", messageRoutes);

const publicRouter = require('./routes/publicRouter.js');
app.use('/public', publicRouter);




//sockets 

const server = http.createServer(app);

// لازم بعد ما تجهز app
initNotificationSocket(server);


// MongoDB Connection
mongoose.connect(process.env.DB_URL)
  .then(() => {
    // Start the server after DB connection is successful
    server.listen(PORT, () => {
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