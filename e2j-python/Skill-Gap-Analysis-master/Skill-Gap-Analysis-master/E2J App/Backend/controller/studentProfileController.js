const StudentProfile = require('../models/StudentProfile');
const InstituteStudent = require('../models/InstituteStudent');
const Program = require('../models/Program');
const { resolveCurriculumChoice } = require('../utils/curriculumResolver');

// GET /profile/me
exports.getProfile = async (req, res) => {
  try {
    const email = req.userEmail;
    if (!email) return res.status(400).json({ message: 'Email not found in token' });
    const [profile, instituteStudent] = await Promise.all([
      StudentProfile.findOne({ email }),
      InstituteStudent.findOne({ email }),
    ]);

    let program = null;
    if (instituteStudent?.instituteId) {
      program = await Program.findOne({
        instituteId: instituteStudent.instituteId,
        $or: [
          { name: instituteStudent.program },
          { programId: instituteStudent.program },
        ],
      });
    }

    const curriculumChoice = resolveCurriculumChoice({ instituteStudent, program, profile });
    return res.json({
      profile,
      aiContext: {
        curriculumChoice,
        instituteStudent: instituteStudent
          ? {
              program: instituteStudent.program || '',
              specialization: instituteStudent.specialization || '',
            }
          : null,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch profile' });
  }
};

// POST/PUT /profile
exports.createOrUpdateProfile = async (req, res) => {
  try {
    const email = req.userEmail;
    if (!email) return res.status(400).json({ message: 'Email not found in token' });
    const { isDraft, ...data } = req.body;
    const updateData = { ...data, email };
    if (!isDraft) {
      updateData.profileCompleted = true;
    }
    const profile = await StudentProfile.findOneAndUpdate(
      { email },
      updateData,
      { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true }
    );
    return res.json({ profile });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to save profile' });
  }
};

// GET /profile/prefill
exports.prefillProfile = async (req, res) => {
  try {
    const email = req.userEmail;
    if (!email) return res.status(400).json({ message: 'Email not found in token' });
    const instStudent = await InstituteStudent.findOne({ email });
    if (!instStudent) return res.status(404).json({ message: 'Not found' });
    return res.json({
      firstName: instStudent.name?.split(' ')[0] || '',
      lastName: instStudent.name?.split(' ').slice(1).join(' ') || '',
      email: instStudent.email,
      mobilePrimary: instStudent.phone,
      presentAddress: instStudent.address ? { line1: instStudent.address } : {},
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to prefill profile' });
  }
};
