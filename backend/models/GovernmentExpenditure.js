const mongoose = require('mongoose');

const governmentExpenditureSchema = new mongoose.Schema({
  financialYear: { type: String, required: true, trim: true },
  department: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  allocatedAmount: { type: Number, required: true, min: 0 },
  actualAmount: { type: Number, required: true, min: 0 },
  source: { type: String, required: true, trim: true },
  sourceUrl: { type: String, default: '', trim: true },
  dataStatus: {
    type: String,
    enum: ['Verified official', 'Imported for review'],
    default: 'Imported for review'
  },
  notes: { type: String, default: '', trim: true }
}, { timestamps: true });

governmentExpenditureSchema.index({ financialYear: 1, department: 1, category: 1 }, { unique: true });

module.exports = mongoose.model('GovernmentExpenditure', governmentExpenditureSchema);
