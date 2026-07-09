const express = require("express");
const router = express.Router();
const Expense = require("../models/Expense");

router.post("/add", async (req, res) => {
  const expense = new Expense(req.body);
  await expense.save();
  res.json(expense);
});

router.get("/", async (req, res) => {
  const expenses = await Expense.find();
  res.json(expenses);
});

module.exports = router;
