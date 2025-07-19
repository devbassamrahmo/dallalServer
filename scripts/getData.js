// exportUsers.js
const mongoose = require('mongoose');
const ExcelJS = require('exceljs');
const User = require('../models/User'); // تأكد من المسار
require('dotenv').config();

const MONGO_URI = process.env.DB_URL; // حط رابطك هون

mongoose.connect(MONGO_URI).then(async () => {
  const users = await User.find();

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Users');

  worksheet.columns = [
    { header: 'First Name', key: 'firstname', width: 15 },
    { header: 'Last Name', key: 'lastname', width: 15 },
    { header: 'Username', key: 'username', width: 20 },
    { header: 'Email', key: 'email', width: 25 },
    { header: 'password', key: 'password', width: 50 },
    { header: 'Phone', key: 'phoneNumber', width: 15 },
    { header: 'Verified', key: 'isVerified', width: 10 },
    { header: 'Role', key: 'role', width: 10 },
    { header: 'Created At', key: 'createdAt', width: 20 },
  ];

  users.forEach(user => {
    worksheet.addRow({
      firstname: user.firstname,
      lastname: user.lastname,
      username: user.username,
      email: user.email,
      phoneNumber: user.phoneNumber,
      isVerified: user.isVerified,
      role: user.role,
      createdAt: user.createdAt,
    });
  });

  await workbook.xlsx.writeFile('users-backup.xlsx');
  console.log('✅ Excel file created: users-backup.xlsx');
  process.exit();
}).catch(err => {
  console.error('MongoDB connection error:', err);
});
