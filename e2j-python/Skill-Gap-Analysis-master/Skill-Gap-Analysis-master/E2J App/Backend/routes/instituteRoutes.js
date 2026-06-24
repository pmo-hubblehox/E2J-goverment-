const express = require('express');
const router = express.Router();
const { instituteAuthMiddleware } = require('../middleware/instituteAuthMiddleware');
const {
  getProfile,
  updateOnboarding,
  getPrograms,
  getStudents,
  getFaculty,
  getInfrastructure,
} = require('../controllers/instituteController');

router.use(instituteAuthMiddleware);

router.get('/profile', getProfile);
router.post('/onboarding', updateOnboarding);
router.get('/programs', getPrograms);
router.get('/students', getStudents);
router.get('/faculty', getFaculty);
router.get('/infrastructure', getInfrastructure);

module.exports = router;