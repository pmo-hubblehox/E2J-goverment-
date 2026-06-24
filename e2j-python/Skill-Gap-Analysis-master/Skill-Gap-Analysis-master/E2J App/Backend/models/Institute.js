const mongoose = require('mongoose');

const instituteSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['private', 'public'],
  },
  website: {
    type: String,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  registeredAddress: {
    buildingName: String,
    roomNumber: String,
    country: String,
    pincode: String,
    state: String,
    city: String,
    area: String,
    landmark: String,
    locationPin: String,
  },
  contacts: [{
    name: String,
    email: String,
    phone: String,
  }],
  documents: {
    accreditationBody: String,
    accreditationCertificate: String, // file path
    universityCertificate: String,
    ugcCertificate: String,
    rating: String,
  },
  mou: String, // file path
  profileCompleted: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

module.exports = mongoose.model('Institute', instituteSchema);