const express = require('express');
const Budget = require('../models/Budget');
const Expense = require('../models/Expense');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const budgets = await Budget.find();
    const expenses = await Expense.find().sort({ date: 1 });

    const totalBudget = budgets.reduce((sum, item) => sum + (item.allocatedAmount || 0), 0);
    const totalExpense = expenses.reduce((sum, item) => sum + (item.amount || 0), 0);
    const utilizationPercent = totalBudget > 0 ? (totalExpense / totalBudget) * 100 : 0;

    const recentExpenses = expenses.slice(-3);
    const recentExpenseAverage = recentExpenses.length > 0
      ? recentExpenses.reduce((sum, item) => sum + (item.amount || 0), 0) / recentExpenses.length
      : 0;

    const alerts = [];
    if (totalExpense > totalBudget) {
      alerts.push('Expenses > Allocated Budget');
    }
    if (utilizationPercent < 40) {
      alerts.push('Utilization < 40%');
    }
    if (recentExpenseAverage > 0 && totalExpense > 0 && recentExpenseAverage > totalExpense / Math.max(1, totalBudget > 0 ? 4 : 1) * 2) {
      alerts.push('Large sudden expense');
    }

    res.json({
      alerts,
      totalAlerts: alerts.length,
      totalBudget,
      totalExpense,
      utilizationPercent
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
