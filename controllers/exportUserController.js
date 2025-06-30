const ExcelJS = require('exceljs');
const User = require('../models/User'); // تأكد من المسار الصحيح

const exportUsersToExcel = async (req, res) => {
  try {
    const users = await User.find();

    // إنشاء ملف إكسل جديد
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Users');

    // رؤوس الأعمدة
    worksheet.columns = [
      { header: 'First Name', key: 'firstname', width: 15 },
      { header: 'Last Name', key: 'lastname', width: 15 },
      { header: 'Username', key: 'username', width: 20 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Phone Number', key: 'phoneNumber', width: 15 },
      { header: 'Is Verified', key: 'isVerified', width: 10 },
      { header: 'Role', key: 'role', width: 10 },
      { header: 'Created At', key: 'createdAt', width: 20 },
    ];

    // إدخال البيانات
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

    // إعدادات الهيدر للتحميل
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=users.xlsx'
    );

    // إرسال الملف
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).send('Error generating Excel file');
  }
};

module.exports = { exportUsersToExcel };
