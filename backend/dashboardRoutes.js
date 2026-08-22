const express = require('express');
const { requireAuth, requireRole } = require('./middleware');

const router = express.Router();

// Backend-enforced role check — not just a hidden frontend link.
router.get('/employee', requireAuth, requireRole('EMPLOYEE'), (req, res) => {
  res.json({ message: `Welcome, ${req.user.employeeId}. This is the Employee Dashboard placeholder.` });
});

router.get('/admin', requireAuth, requireRole('ADMIN', 'HR'), (req, res) => {
  res.json({ message: `Welcome, ${req.user.employeeId}. This is the Management Dashboard placeholder.` });
});

module.exports = router;
