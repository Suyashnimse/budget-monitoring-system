const mongoose = require('mongoose');

const governmentExpenditureSchema = new mongoose.Schema({
  financialYear: { type: String, required: true, trim: true },
  governmentLevel: { type: String, enum: ['Union Government', 'Maharashtra'], required: true },
  department: { type: String, required: true, trim: true },
  category: { type: String, default: 'Department net allocation', trim: true },
  estimateType: { type: String, enum: ['Budget Estimate', 'Revised Estimate', 'Actual'], required: true },
  amount: { type: Number, required: true },
  unit: { type: String, default: 'INR crore', trim: true },
  source: { type: String, required: true, trim: true },
  sourceUrl: { type: String, default: '', trim: true },
  dataStatus: {
    type: String,
    enum: ['Verified official', 'Imported for review'],
    default: 'Imported for review'
  },
  notes: { type: String, default: '', trim: true }
}, { timestamps: true });

governmentExpenditureSchema.index({ financialYear: 1, governmentLevel: 1, department: 1, category: 1, estimateType: 1, sourceUrl: 1 }, { unique: true });

module.exports = mongoose.model('GovernmentExpenditure', governmentExpenditureSchema);
