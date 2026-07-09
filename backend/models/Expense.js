const mongoose = require("mongoose");

const ExpenseSchema = new mongoose.Schema({
  budgetId: String,
  amount: Number,
  category: String,
  date: Date
});

module.exports = mongoose.model("Expense", ExpenseSchema);
