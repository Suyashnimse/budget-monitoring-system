const crypto = require('crypto');
const express = require('express');
const ApprovalAuthority = require('../models/ApprovalAuthority');

const router = express.Router();
const allowedRoles = ['CM', 'DCM', 'MLA', 'PM', 'MP', 'Minister', 'Minister of State'];

router.get('/', async (req, res) => {
  try {
    res.json(await ApprovalAuthority.find({ active: true }).sort({ role: 1, name: 1 }));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, role, constituency, constituencyNumber, state, ministry, contact, source, sourceUrl } = req.body;
    if (!name || !allowedRoles.includes(role) || !constituency || !state || !source) {
      return res.status(400).json({ message: 'Name, allowed role, constituency, state, and source are required' });
    }

    const authority = await ApprovalAuthority.create({
      authorityId: `${role}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
      name, role, constituency, constituencyNumber, state, ministry, contact, source, sourceUrl
    });
    res.status(201).json(authority);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/import', async (req, res) => {
  try {
    if (!Array.isArray(req.body.authorities) || !req.body.authorities.length) {
      return res.status(400).json({ message: 'authorities must be a non-empty array' });
    }
    const records = req.body.authorities.map((member) => ({
      authorityId: member.authorityId || `${member.role}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
      name: String(member.name || '').trim(),
      role: member.role,
      constituency: String(member.constituency || '').trim(),
      constituencyNumber: String(member.constituencyNumber || '').trim(),
      state: String(member.state || 'Maharashtra').trim(),
      ministry: String(member.ministry || '').trim(),
      contact: String(member.contact || '').trim(),
      source: String(member.source || '').trim(),
      sourceUrl: String(member.sourceUrl || '').trim()
    }));
    const invalid = records.find((member) => !member.name || !allowedRoles.includes(member.role) || !member.constituency || !member.source);
    if (invalid) return res.status(400).json({ message: 'Every authority needs name, allowed role, constituency, and source' });
    const imported = await ApprovalAuthority.insertMany(records, { ordered: false });
    res.status(201).json({ message: `${imported.length} authorities imported`, authorities: imported });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
