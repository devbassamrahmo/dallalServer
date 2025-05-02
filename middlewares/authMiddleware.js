const jwt = require("jsonwebtoken");
require("dotenv").config();


const protect = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];
  
  if (!token) return res.status(401).json({ message: "Access denied. No token provided." });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
     
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

// ✅ Middleware to Check Admin Access
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Access denied. Admins only." });
  }
};

module.exports = { protect, isAdmin };
