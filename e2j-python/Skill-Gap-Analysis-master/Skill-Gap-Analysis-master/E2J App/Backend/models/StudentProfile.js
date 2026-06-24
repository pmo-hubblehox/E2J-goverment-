const mongoose = require('mongoose');

const educationSchema = new mongoose.Schema({
  degree: String,
  college: String,
  specialization: String,
  yearOfPassing: String,
  currentlyPursuing: { type: Boolean, default: false },
  percentage: String,
  certificate: { url: String, name: String },
}, { _id: true });

const certificationSchema = new mongoose.Schema({
  name: String,
  issuer: String,
  year: String,
  file: { url: String, name: String },
}, { _id: true });

const workSchema = new mongoose.Schema({
  company: String,
  role: String,
  location: String,
  employmentType: String,
  startDate: String,
  endDate: String,
  currentlyWorking: { type: Boolean, default: false },
}, { _id: true });

const resumeSchema = new mongoose.Schema({
  url: String,
  name: String,
  isPrimary: { type: Boolean, default: false },
}, { _id: true });

const addressSchema = new mongoose.Schema({
  line1: String,
  line2: String,
  city: String,
  state: String,
  country: String,
  pincode: String,
}, { _id: false });

const languageSchema = new mongoose.Schema({
  language: String,
  canRead: { type: Boolean, default: false },
  canWrite: { type: Boolean, default: false },
  canSpeak: { type: Boolean, default: false },
  isNative: { type: Boolean, default: false },
}, { _id: false });

const socialMediaSchema = new mongoose.Schema({
  linkedin: String,
  github: String,
  portfolio: String,
  twitter: String,
}, { _id: false });

const jobPreferencesSchema = new mongoose.Schema({
  preferredRoles: [String],
  preferredLocations: [String],
  preferredJobType: String,
  noticePeriod: String,
  expectedSalary: String,
}, { _id: false });

const studentProfileSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  resumes: [resumeSchema],
  profilePhoto: String,
  title: String,
  firstName: String,
  middleName: String,
  lastName: String,
  dob: String,
  gender: String,
  nationality: String,
  maritalStatus: String,
  physicallyChallenged: String,
  bloodGroup: String,
  mobilePrimary: String,
  mobileAlternate: String,
  presentAddress: addressSchema,
  permanentAddress: addressSchema,
  socialMedia: socialMediaSchema,
  jobPreferences: jobPreferencesSchema,
  education: [educationSchema],
  certifications: [certificationSchema],
  work: [workSchema],
  skills: [String],
  languages: [languageSchema],
  profileCompleted: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('StudentProfile', studentProfileSchema);
