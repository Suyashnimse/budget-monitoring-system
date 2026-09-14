const mongoose = require("mongoose");

const BudgetSchema = new mongoose.Schema({
  title: { type: String, trim: true, default: '' },
  financialYear: String,
  state: { type: String, trim: true, default: 'All India' },
  department: String,
  allocatedAmount: Number,
  allocationDate: Date,
  description: { type: String, trim: true, default: '' },
  status: { type: String, enum: ['Pending Approval', 'Approved', 'Rejected'], default: 'Pending Approval' },
  source: { type: String, trim: true, default: 'Department submission' },
  approval: {
    authorityId: { type: String, default: '' },
    authorityName: { type: String, default: '' },
    authorityRole: { type: String, default: '' },
    constituency: { type: String, default: '' },
    actedAt: { type: Date }
  }
});

module.exports = mongoose.model("Budget", BudgetSchema);
