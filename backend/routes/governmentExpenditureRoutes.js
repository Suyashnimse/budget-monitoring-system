const express = require('express');
const GovernmentExpenditure = require('../models/GovernmentExpenditure');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.financialYear) filter.financialYear = req.query.financialYear;
    if (req.query.department) filter.department = req.query.department;
    const records = await GovernmentExpenditure.find(filter).sort({ financialYear: -1, department: 1, category: 1 });
    const summary = records.reduce((result, record) => {
      result.allocatedAmount += record.allocatedAmount;
      result.actualAmount += record.actualAmount;
      return result;
    }, { allocatedAmount: 0, actualAmount: 0 });

    res.json({ records, summary: { ...summary, variance: summary.allocatedAmount - summary.actualAmount } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/import', async (req, res) => {
  try {
    const records = req.body.records;
    if (!Array.isArray(records) || !records.length) {
      return res.status(400).json({ message: 'records must be a non-empty array' });
    }

    const normalized = records.map((record) => ({
      financialYear: String(record.financialYear || '').trim(),
      department: String(record.department || '').trim(),
      category: String(record.category || '').trim(),
      allocatedAmount: Number(record.allocatedAmount),
      actualAmount: Number(record.actualAmount),
      source: String(record.source || '').trim(),
      sourceUrl: String(record.sourceUrl || '').trim(),
      dataStatus: record.dataStatus || 'Imported for review',
      notes: String(record.notes || '').trim()
    }));

    const invalid = normalized.find((record) =>
      !record.financialYear || !record.department || !record.category || !record.source ||
      !Number.isFinite(record.allocatedAmount) || record.allocatedAmount < 0 ||
      !Number.isFinite(record.actualAmount) || record.actualAmount < 0
    );
    if (invalid) {
      return res.status(400).json({ message: 'Every record needs year, department, category, source, and valid non-negative amounts' });
    }

    const imported = await GovernmentExpenditure.insertMany(normalized, { ordered: false });
    res.status(201).json({ message: `${imported.length} expenditure records imported`, records: imported });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
