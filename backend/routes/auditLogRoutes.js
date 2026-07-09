const express = require('express');
const AuditLog = require('../models/AuditLog');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ createdAt: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/add', async (req, res) => {
  try {
    const { user, action, date, details } = req.body;
    const log = new AuditLog({
      user,
      action,
      details: details || (date ? `Date: ${date}` : ''),
      createdAt: date ? new Date(date) : undefined,
    });
    await log.save();
    res.status(201).json(log);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
