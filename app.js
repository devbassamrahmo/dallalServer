// server.js
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
require('dotenv').config();
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8000;

app.use(express.json()); // ✅ Add this to parse JSON data
app.use(express.urlencoded({ extended: true }));

// Routes
const userRouter = require('./routes/userRouter')
app.use('/user' , userRouter);
const adRouter = require('./routes/adRouter')
app.use('/ad' , adRouter);

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection

app.get('/' , (req,res) =>{
    res.send("you are in home page")
})

mongoose.connect(process.env.DB_URL).then(()=>{
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}).catch((error) =>{
    console.log(error)
});



