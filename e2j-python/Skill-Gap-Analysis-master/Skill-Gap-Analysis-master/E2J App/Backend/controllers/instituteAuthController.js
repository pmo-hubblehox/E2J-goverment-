const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Institute = require('../models/Institute');

exports.register = async (req, res) => {
  try {
    const { name, type, website, email, password, registeredAddress, contacts, documents, mou } = req.body;
    const normalizedType = String(type || '').trim().toLowerCase();

    if (!['private', 'public'].includes(normalizedType)) {
      return res.status(400).json({ message: 'Institute type must be either private or public' });
    }

    // Check if institute already exists
    const existingInstitute = await Institute.findOne({ email });
    if (existingInstitute) {
      return res.status(400).json({ message: 'Institute already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create institute
    const institute = new Institute({
      name,
      type: normalizedType,
      website,
      email,
      password: hashedPassword,
      registeredAddress,
      contacts,
      documents,
      mou,
    });

    await institute.save();

    res.status(201).json({ message: 'Institute registered successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const institute = await Institute.findOne({ email });
    if (!institute) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, institute.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ instituteId: institute._id }, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};