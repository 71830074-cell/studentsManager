const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const studentsRoutes = require("./routes/students");

const port = process.env.PORT || 5000;
const app = express();

// Create upload directory if it doesn't exist
const uploadDir = process.env.UPLOAD_DIR || './images';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log(`Created upload directory: ${uploadDir}`);
}

// Middleware - CORS setup
app.use(cors({
  origin: "http://localhost:3000", // Your React app port
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images statically
app.use('/images', express.static(path.join(__dirname, uploadDir)));

// Simple test route - add this FIRST
app.get("/api/test", (req, res) => {
  res.json({ 
    message: "API is working!", 
    timestamp: new Date().toISOString(),
    port: port
  });
});

// Mount students routes
app.use("/api/students", studentsRoutes);

// Root route
app.get("/", (req, res) => {
  res.json({ 
    message: "Student Management API", 
    version: "1.0.0",
    endpoints: {
      test: "/api/test",
      students: "/api/students",
      addStudent: "/api/students/add (POST)",
      getStudent: "/api/students/:id (GET)",
      updateStudent: "/api/students/modify/:id (POST)",
      deleteStudent: "/api/students/:id (DELETE)",
      majors: "/api/students/majors"
    }
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  console.log(`Upload directory: ${uploadDir}`);
});