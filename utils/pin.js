const bcrypt = require("bcrypt");
const SALT_ROUNDS = 10;

async function hashPin6(pin) {
  if (!/^\d{6}$/.test(pin)) throw new Error("PIN يجب أن يكون 6 أرقام");
  return bcrypt.hash(pin, SALT_ROUNDS);
}

async function comparePin6(pin, hash) {
  return bcrypt.compare(pin, hash);
}

module.exports = { hashPin6, comparePin6 };
