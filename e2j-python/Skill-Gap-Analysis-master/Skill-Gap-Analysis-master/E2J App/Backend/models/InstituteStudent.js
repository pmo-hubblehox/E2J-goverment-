const mongoose = require('mongoose');

const instituteStudentSchema = new mongoose.Schema({
  instituteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institute',
    required: true,
  },
  studentId: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  program: String,
  specialization: String,
  email: String,
  phone: String,
  address: String,
}, { timestamps: true });

module.exports = mongoose.model('InstituteStudent', instituteStudentSchema);