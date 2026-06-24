const mongoose = require('mongoose');

const programSchema = new mongoose.Schema({
  instituteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institute',
    required: true,
  },
  programId: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  majors: [String],
  duration: Number, // years
  fees: Number,
  intake: Number,
  deadline: Date,
  brochureFileName: String,
  syllabusFileName: String,
  creditStructureFileName: String,
  timetableFileName: String,
}, { timestamps: true });

module.exports = mongoose.model('Program', programSchema);