const express = require("express");
const router = express.Router();
const Expense = require("../models/Expense");

router.post("/add", async (req, res) => {
  try {
    const { budgetId, amount, category, date } = req.body;
    if (!budgetId || !category || !Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ message: "budgetId, category, and a positive amount are required" });
    }

    const expense = await Expense.create({
      budgetId,
      amount: Number(amount),
      category,
      date: date || new Date()
    });
    res.status(201).json(expense);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
