const mongoose = require("mongoose");

const ExpenseSchema = new mongoose.Schema({
  budgetId: String,
  amount: Number,
  category: String,
  date: Date,
  description: { type: String, default: '' },
  status: { type: String, default: 'Pending Approval' }
});

module.exports = mongoose.model("Expense", ExpenseSchema);
