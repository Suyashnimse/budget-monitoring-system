const express = require('express');
const GovernmentExpenditure = require('../models/GovernmentExpenditure');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.financialYear) filter.financialYear = req.query.financialYear;
    if (req.query.governmentLevel) filter.governmentLevel = req.query.governmentLevel;
    if (req.query.department) filter.department = req.query.department;
    if (req.query.estimateType) filter.estimateType = req.query.estimateType;
    const records = await GovernmentExpenditure.find(filter).sort({ financialYear: -1, department: 1, category: 1 });
    const summary = records.reduce((result, record) => {
      result[record.estimateType] += record.amount;
      return result;
    }, { 'Budget Estimate': 0, 'Revised Estimate': 0, Actual: 0 });

    res.json({ records, summary });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/import', async (req, res) => {
  const importToken = process.env.GOVERNMENT_DATA_IMPORT_TOKEN;
  if (!importToken || req.get('authorization') !== `Bearer ${importToken}`) {
    return res.status(403).json({ message: 'Government data import is not authorized' });
  }

  try {
    const records = req.body.records;
    if (!Array.isArray(records) || !records.length) {
      return res.status(400).json({ message: 'records must be a non-empty array' });
    }

    const normalized = records.map((record) => ({
      financialYear: String(record.financialYear || '').trim(),
      governmentLevel: String(record.governmentLevel || '').trim(),
      department: String(record.department || '').trim(),
      category: String(record.category || 'Department net allocation').trim(),
      estimateType: String(record.estimateType || '').trim(),
      amount: Number(record.amount),
      unit: String(record.unit || 'INR crore').trim(),
      source: String(record.source || '').trim(),
      sourceUrl: String(record.sourceUrl || '').trim(),
      dataStatus: record.dataStatus || 'Imported for review',
      notes: String(record.notes || '').trim()
    }));

    const invalid = normalized.find((record) =>
      !record.financialYear || !['Union Government', 'Maharashtra'].includes(record.governmentLevel) ||
      !record.department || !record.category || !['Budget Estimate', 'Revised Estimate', 'Actual'].includes(record.estimateType) ||
      !record.source || !Number.isFinite(record.amount)
    );
    if (invalid) {
      return res.status(400).json({ message: 'Every record needs a year, government level, department, estimate type, source, and valid amount' });
    }

    const operations = normalized.map((record) => ({
      updateOne: {
        filter: {
          financialYear: record.financialYear,
          governmentLevel: record.governmentLevel,
          department: record.department,
          category: record.category,
          estimateType: record.estimateType,
          sourceUrl: record.sourceUrl
        },
        update: { $set: record },
        upsert: true
      }
    }));
    const result = await GovernmentExpenditure.bulkWrite(operations, { ordered: false });
    res.status(200).json({ message: 'Expenditure records imported', upserted: result.upsertedCount, updated: result.modifiedCount });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
