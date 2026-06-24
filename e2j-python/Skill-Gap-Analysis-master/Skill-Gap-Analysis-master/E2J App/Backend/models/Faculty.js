const mongoose = require('mongoose');


const facultySchema = new mongoose.Schema({
  instituteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institute',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  department: String,
  designation: String,
  email: String,
  phone: String,
}, { timestamps: true });

module.exports = mongoose.model('Faculty', facultySchema);