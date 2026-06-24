const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const {
  getProfile,
  createOrUpdateProfile,
  prefillProfile,
} = require('../controller/studentProfileController');

router.use(authMiddleware);

router.get('/me', getProfile);
router.post('/', createOrUpdateProfile);
router.put('/', createOrUpdateProfile);
router.get('/prefill', prefillProfile);

module.exports = router;
