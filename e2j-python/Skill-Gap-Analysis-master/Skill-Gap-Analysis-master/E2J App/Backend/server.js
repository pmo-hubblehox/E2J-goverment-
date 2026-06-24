// Create the Express server for the student portal authentication system.
//
// Requirements:
// - load dotenv
// - connect to MongoDB using connectDB()
// - enable CORS
// - enable JSON body parsing
// - register authentication routes at /auth
// - run server on PORT from environment variables
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const aspirationsRoutes = require('./routes/aspirations');
const instituteAuthRoutes = require('./routes/instituteAuthRoutes');
const instituteRoutes = require('./routes/instituteRoutes');
const profileRoutes = require('./routes/profileRoutes');
const aiAnalysisRoutes = require('./routes/aiAnalysisRoutes');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));
connectDB();

app.use("/auth", authRoutes);
app.use("/aspirations", aspirationsRoutes);
app.use("/api/institute", instituteAuthRoutes);
app.use("/api/institute", instituteRoutes);
app.use("/profile", profileRoutes);
app.use("/api", aiAnalysisRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
app.get("/", (req, res) => {
  res.send("Server is running");
});