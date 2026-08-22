const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '2h';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not set. Copy .env.example to .env and set a real secret.');
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function signAuthToken(user) {
  return jwt.sign(
    { sub: user.id, employeeId: user.employeeId, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function verifyAuthToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

// At least 8 chars, at least one number, at least one special character
function isStrongPassword(password) {
  if (typeof password !== 'string' || password.length < 8) return false;
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  return hasNumber && hasSpecial;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

module.exports = {
  generateToken,
  signAuthToken,
  verifyAuthToken,
  isStrongPassword,
  isValidEmail,
};
