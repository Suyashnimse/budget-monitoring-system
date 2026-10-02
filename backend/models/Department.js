const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  code: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    uppercase: true,
  },
  governmentLevel: {
    type: String,
    enum: ['Union Ministry', 'Union Department', 'Maharashtra', 'Other'],
    default: 'Other',
  },
  isOfficial: {
    type: Boolean,
    default: false,
  },
  sourceUrl: {
    type: String,
    default: '',
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Department', departmentSchema);
