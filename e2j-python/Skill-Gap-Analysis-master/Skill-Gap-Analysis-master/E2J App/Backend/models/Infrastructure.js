const mongoose = require('mongoose');

const infrastructureSchema = new mongoose.Schema({
  instituteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institute',
    required: true,
    unique: true,
  },
  classrooms: Number,
  labs: Number,
  library: Number,
  hostel: Number,
  otherFacilities: String,
}, { timestamps: true });

module.exports = mongoose.model('Infrastructure', infrastructureSchema);