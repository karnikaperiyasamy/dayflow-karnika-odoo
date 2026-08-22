const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('./db');
const {
  generateToken,
  signAuthToken,
  isStrongPassword,
  isValidEmail,
} = require('./utils');
const { requireAuth } = require('./middleware');

const router = express.Router();

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const isProd = process.env.NODE_ENV === 'production';

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: isProd,
  maxAge: 2 * 60 * 60 * 1000, // 2h, matches default JWT expiry
};

// ------------------------------------------------------------------
// POST /api/auth/register
// ------------------------------------------------------------------
router.post('/register', (req, res) => {
  const { employeeId, email, password, confirmPassword, role } = req.body || {};

  // --- Validation ---
  if (!employeeId || !email || !password || !confirmPassword || !role) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Password and confirm password must match.' });
  }
  if (!isStrongPassword(password)) {
    return res.status(400).json({
      error: 'Password must be at least 8 characters and include a number and a special character.',
    });
  }
  const allowedRoles = ['ADMIN', 'HR', 'EMPLOYEE'];
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ error: 'Role must be one of ADMIN, HR, or EMPLOYEE.' });
  }

  const existingByEmployeeId = db.prepare('SELECT id FROM users WHERE employeeId = ?').get(employeeId);
  if (existingByEmployeeId) {
    return res.status(409).json({ error: 'Employee ID is already registered.' });
  }
  const existingByEmail = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existingByEmail) {
    return res.status(409).json({ error: 'Email is already registered.' });
  }

  // --- Hash password, never store plaintext ---
  const passwordHash = bcrypt.hashSync(password, 12);

  // --- Create verification token ---
  const verificationToken = generateToken();
  const verificationTokenExpiry = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS).toISOString();

  const insert = db.prepare(`
    INSERT INTO users (employeeId, email, passwordHash, role, emailVerified, verificationToken, verificationTokenExpiry)
    VALUES (?, ?, ?, ?, 0, ?, ?)
  `);
  const result = insert.run(employeeId, email, passwordHash, role, verificationToken, verificationTokenExpiry);

  // No SMTP is configured for this hackathon prototype. We do NOT pretend an
  // email was sent — instead we hand back a development verification link
  // so the flow can be demonstrated end-to-end.
  const verifyLink = `/verify-email.html?token=${verificationToken}`;

  return res.status(201).json({
    message: 'Registration successful. Verify your email to activate your account.',
    devNote: 'No email service is configured in this environment — use the development verification link below to complete verification.',
    verificationLink: verifyLink,
    userId: result.lastInsertRowid,
  });
});

// ------------------------------------------------------------------
// GET /api/auth/verify-email?token=...
// ------------------------------------------------------------------
router.get('/verify-email', (req, res) => {
  const { token } = req.query;
  if (!token) {
    return res.status(400).json({ error: 'Verification token is required.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE verificationToken = ?').get(token);
  if (!user) {
    return res.status(400).json({ error: 'Invalid or already-used verification token.' });
  }
  if (user.emailVerified) {
    return res.status(200).json({ message: 'Email is already verified. You can log in.' });
  }
  if (new Date(user.verificationTokenExpiry).getTime() < Date.now()) {
    return res.status(400).json({ error: 'Verification token has expired. Please register again or request a new link.' });
  }

  db.prepare(`
    UPDATE users SET emailVerified = 1, verificationToken = NULL, verificationTokenExpiry = NULL WHERE id = ?
  `).run(user.id);

  return res.status(200).json({ message: 'Email verified successfully. You can now log in.' });
});

// ------------------------------------------------------------------
// POST /api/auth/login
// ------------------------------------------------------------------
router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const passwordMatches = bcrypt.compareSync(password, user.passwordHash);
  if (!passwordMatches) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  if (!user.emailVerified) {
    return res.status(403).json({ error: 'Please verify your email before logging in.' });
  }

  const token = signAuthToken(user);
  res.cookie('dayflow_token', token, cookieOptions);

  const redirectTo = (user.role === 'ADMIN' || user.role === 'HR') ? '/admin-dashboard.html' : '/employee-dashboard.html';

  return res.status(200).json({
    message: 'Login successful.',
    token, // also returned in body so non-cookie clients (API testing) can use it
    role: user.role,
    redirectTo,
  });
});

// ------------------------------------------------------------------
// POST /api/auth/logout
// ------------------------------------------------------------------
router.post('/logout', (req, res) => {
  res.clearCookie('dayflow_token', { ...cookieOptions, maxAge: undefined });
  return res.status(200).json({ message: 'Logged out.' });
});

// ------------------------------------------------------------------
// GET /api/auth/me — used by frontend to know who's logged in
// ------------------------------------------------------------------
router.get('/me', requireAuth, (req, res) => {
  return res.status(200).json({ user: req.user });
});

module.exports = router;
