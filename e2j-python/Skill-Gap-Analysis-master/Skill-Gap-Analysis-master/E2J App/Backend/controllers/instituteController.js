const Institute = require('../models/Institute');
const Program = require('../models/Program');
const InstituteStudent = require('../models/InstituteStudent');
const Faculty = require('../models/Faculty');
const Infrastructure = require('../models/Infrastructure');

exports.getProfile = async (req, res) => {
  try {
    const institute = req.institute;
    res.json(institute);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateOnboarding = async (req, res) => {
  try {
    const { programs, students, faculty, infrastructure } = req.body;
    const instituteId = req.institute._id;

    // Update programs
    if (programs) {
      await Program.deleteMany({ instituteId });
      for (const program of programs) {
        const newProgram = new Program({ ...program, instituteId });
        await newProgram.save();
      }
    }

    // Update students
    if (students) {
      await InstituteStudent.deleteMany({ instituteId });
      for (const student of students) {
        const newStudent = new InstituteStudent({ ...student, instituteId });
        await newStudent.save();
      }
    }

    // Update faculty
    if (faculty) {
      await Faculty.deleteMany({ instituteId });
      for (const fac of faculty) {
        const newFac = new Faculty({ ...fac, instituteId });
        await newFac.save();
      }
    }

    // Update infrastructure
    if (infrastructure) {
      await Infrastructure.findOneAndUpdate(
        { instituteId },
        { ...infrastructure, instituteId },
        { upsert: true, new: true }
      );
    }

    // Mark profile as completed
    await Institute.findByIdAndUpdate(instituteId, { profileCompleted: true });

    res.json({ message: 'Onboarding completed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getPrograms = async (req, res) => {
  try {
    const programs = await Program.find({ instituteId: req.institute._id });
    res.json(programs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getStudents = async (req, res) => {
  try {
    const students = await InstituteStudent.find({ instituteId: req.institute._id });
    res.json(students);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.find({ instituteId: req.institute._id });
    res.json(faculty);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getInfrastructure = async (req, res) => {
  try {
    const infra = await Infrastructure.findOne({ instituteId: req.institute._id });
    res.json(infra);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};