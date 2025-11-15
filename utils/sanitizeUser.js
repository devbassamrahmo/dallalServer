function sanitizeUser(userDoc) {
  if (!userDoc) return null;

  // حوّله لكائن عادي لو كان Mongoose Document
  const user = typeof userDoc.toObject === "function" ? userDoc.toObject() : { ...userDoc };

  // شيل الحقول الحساسة
  delete user.password;
  delete user.pin6;
  delete user.otp;
  delete user.otpExpires;
  delete user.resetToken;
  delete user.resetTokenExpires;
  delete user.failedLoginAttempts;
  delete user.lockedUntil;
  delete user.__v;

  return user;
}

// لو حابب تنظّف أرّاي من المستخدمين
function sanitizeUsers(users) {
  if (!Array.isArray(users)) return [];
  return users.map(sanitizeUser);
}

module.exports = {
  sanitizeUser,
  sanitizeUsers,
};
