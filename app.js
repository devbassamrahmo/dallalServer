const express = require('express');
const http = require("http");
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const { Server } = require("socket.io");
const { initNotificationSocket } = require("./sockets/notificationSocket");
const { initMessagesSocket } = require("./sockets/messagesSocket");

const app = express();
const PORT = process.env.PORT || 8000;

const allowedOrigins = [
  "http://localhost:3000",
  "https://ecommerce3-ahmd.netlify.app",
  "https://dallal-vert.vercel.app",
  "https://dallal.sy",
  "https://www.sy-dallal.com",
  "https://e-commerce3-theta.vercel.app",
];

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());

// CORS للـ REST API
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// Routes
const userRouter = require('./routes/userRouter');
app.use('/user', userRouter);

const authRouter = require('./routes/authRouter');
app.use('/api/auth', authRouter);

const adRouter = require('./routes/adRouter');
app.use('/ad', adRouter);

const adminRouter = require('./routes/admin');
app.use('/img', adminRouter);

const commentRoutes = require('./routes/commentRouter');
app.use('/comments', commentRoutes);

const exportsRoutes = require('./routes/export');
app.use('/export', exportsRoutes);

const requresRoutes = require('./routes/requestRoutes');
app.use('/requests', requresRoutes);

const notificationsRoutes = require('./routes/notificationsRouter');
app.use('/notifications', notificationsRoutes);

const messageRoutes = require("./routes/messageRouter");
app.use("/messages", messageRoutes);

const publicRouter = require('./routes/publicRouter');
app.use('/public', publicRouter);

// Home route
app.get('/', (req, res) => {
  res.send("You are on the home page");
});

// ============ HTTP + Socket.io ============
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

// ✅ سوكيت النوتيفيكيشن (JWT من handshake)
initNotificationSocket(io);

// ✅ سوكيت الرسائل (Messenger)
initMessagesSocket(io);

// =============== Mongo + Start ===============
mongoose
  .connect(process.env.DB_URL)
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.log('MongoDB connection error:', error);
  });
