const express = require('express');
const Department = require('../models/Department');

const router = express.Router();
const governmentLevels = ['Union Ministry', 'Union Department', 'Maharashtra'];

router.get('/', async (req, res) => {
  try {
    const departments = await Department.find().sort({ governmentLevel: 1, name: 1 });
    res.json(departments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/add', async (req, res) => {
  try {
    const { name, code, description, governmentLevel } = req.body;

    if (!name || !code || !governmentLevels.includes(governmentLevel)) {
      return res.status(400).json({ message: 'Name, code, and a valid government level are required' });
    }

    const existingDepartment = await Department.findOne({ code: code.toUpperCase() });
    if (existingDepartment) {
      return res.status(400).json({ message: 'Department code already exists' });
    }

    const department = new Department({ name, code: code.toUpperCase(), description, governmentLevel });
    await department.save();

    res.status(201).json(department);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/delete/:id', async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }
    if (department.isOfficial) {
      return res.status(403).json({ message: 'Official government departments cannot be removed.' });
    }
    await department.deleteOne();
    res.json({ message: 'Department deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
