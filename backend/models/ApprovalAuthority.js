const mongoose = require('mongoose');

const approvalAuthoritySchema = new mongoose.Schema({
  authorityId: { type: String, required: true, unique: true, uppercase: true, trim: true },
  name: { type: String, required: true, trim: true },
  role: { type: String, enum: ['CM', 'DCM', 'MLA', 'PM', 'MP', 'Minister', 'Minister of State'], required: true },
  constituency: { type: String, required: true, trim: true },
  constituencyNumber: { type: String, default: '', trim: true },
  state: { type: String, required: true, trim: true },
  ministry: { type: String, default: '', trim: true },
  contact: { type: String, default: '', trim: true },
  source: { type: String, required: true, trim: true },
  sourceUrl: { type: String, default: '', trim: true },
  active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('ApprovalAuthority', approvalAuthoritySchema);
