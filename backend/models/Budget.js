const mongoose = require("mongoose");

const BudgetSchema = new mongoose.Schema({
  financialYear: String,
  department: String,
  allocatedAmount: Number,
  allocationDate: Date
});

module.exports = mongoose.model("Budget", BudgetSchema);
