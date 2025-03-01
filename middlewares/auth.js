const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();

const verifyAdmin = async (req, res, next) => {
    try {
        const token = req.header('Authorization').split(' ')[1]; 
        if (!token) return res.status(401).json({ message: 'Access Denied. No token provided' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user || user.role !== 'admin') {
            return res.status(403).json({ message: 'Access Denied. Admins only' });
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid Token' });
    }
};

module.exports = { verifyAdmin };
