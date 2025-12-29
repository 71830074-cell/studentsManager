const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require('fs');
const db = require("../config/database");

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || './images';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '_' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  }
});

// GET all students with major description and base64 images
router.get("/", (req, res) => {
  const q = `
    SELECT s.StdID, s.Fname, s.Lname, s.Email, 
    m.Description AS Major, s.Address, s.Profile
    FROM students s
    LEFT JOIN major m ON s.Major = m.MajorCode
    ORDER BY s.StdID
  `;
  
  db.query(q, (err, data) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ error: "Database error" });
    }

    // Convert image files to base64
    const studentsWithImages = data.map(student => {
      if (student.Profile) {
        const imagePath = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'images', student.Profile);
        if (fs.existsSync(imagePath)) {
          try {
            student.Profile = fs.readFileSync(imagePath).toString('base64');
            student.hasImage = true;
          } catch (error) {
            console.error("Error reading image:", error);
            student.Profile = null;
            student.hasImage = false;
          }
        } else {
          student.Profile = null;
          student.hasImage = false;
        }
      } else {
        student.hasImage = false;
      }
      return student;
    });

    return res.json(studentsWithImages);
  });
});

// GET all majors for dropdown
router.get("/majors", (req, res) => {
  const q = "SELECT * FROM major ORDER BY MajorCode";
  db.query(q, (err, data) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ error: "Database error" });
    }
    return res.json(data);
  });
});

// POST add new student with image upload
router.post("/add", upload.single("image"), (req, res) => {
  const { fname, lname, email, major, address } = req.body;
  const image = req.file ? req.file.filename : null;

  // Validation
  if (!fname || !lname || !email || !major || !address) {
    return res.status(400).json({ error: "All fields except image are required" });
  }

  const q = `
    INSERT INTO students (Fname, Lname, Email, Major, Address, Profile)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(q, [fname, lname, email, major, address, image], (err, data) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ error: "Failed to add student" });
    }
    return res.json({ 
      message: "Student added successfully!",
      id: data.insertId 
    });
  });
});

// DELETE a student and their image
router.delete("/:id", (req, res) => {
  const id = req.params.id;

  // Get image filename
  const getFileQuery = "SELECT Profile FROM students WHERE StdID = ?";
  db.query(getFileQuery, [id], (err1, result) => {
    if (err1) {
      console.error(err1);
      return res.status(500).json({ error: "Database error" });
    }

    // Delete image file if it exists
    if (result.length > 0 && result[0].Profile) {
      const filePath = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'images', result[0].Profile);
      if (fs.existsSync(filePath)) {
        fs.unlink(filePath, (err3) => {
          if (err3) console.error("Error deleting file:", err3);
        });
      }
    }

    // Delete student from DB
    const deleteQuery = "DELETE FROM students WHERE StdID = ?";
    db.query(deleteQuery, [id], (err2, data) => {
      if (err2) {
        console.error(err2);
        return res.status(500).json({ error: "Failed to delete student" });
      }

      return res.json({ message: "Student deleted successfully!" });
    });
  });
});

// GET student by ID for editing
router.get("/:id", (req, res) => {
  const id = req.params.id;

  const q = `
    SELECT s.*, m.Description AS MajorDescription 
    FROM students s
    LEFT JOIN major m ON s.Major = m.MajorCode
    WHERE s.StdID = ?
  `;

  db.query(q, [id], (err, data) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ error: "Database error" });
    }
    
    if (data.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }
    
    // Convert image to base64 if exists
    const student = data[0];
    if (student.Profile) {
      const imagePath = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'images', student.Profile);
      if (fs.existsSync(imagePath)) {
        student.Profile = fs.readFileSync(imagePath).toString('base64');
        student.hasImage = true;
      } else {
        student.Profile = null;
        student.hasImage = false;
      }
    }
    
    return res.json(student);
  });
});

// UPDATE student with optional image
router.post("/modify/:id", upload.single("image"), (req, res) => {
  const id = req.params.id;
  const { fname, lname, email, address, major } = req.body;
  const imagePath = req.file ? req.file.filename : null;

  // Validation
  if (!fname || !lname || !email || !major || !address) {
    return res.status(400).json({ error: "All fields are required" });
  }

  // First, get old image to delete if new one is uploaded
  const getOldImageQuery = "SELECT Profile FROM students WHERE StdID = ?";
  db.query(getOldImageQuery, [id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error" });
    }

    // Delete old image if exists and new image is being uploaded
    if (imagePath && result.length > 0 && result[0].Profile) {
      const oldFilePath = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'images', result[0].Profile);
      if (fs.existsSync(oldFilePath)) {
        fs.unlink(oldFilePath, (err3) => {
          if (err3) console.error("Error deleting old file:", err3);
        });
      }
    }

    // Update query
    let q, values;
    if (imagePath) {
      q = `
        UPDATE students
        SET Fname=?, Lname=?, Email=?, Major=?, Address=?, Profile=?
        WHERE StdID=?
      `;
      values = [fname, lname, email, major, address, imagePath, id];
    } else {
      q = `
        UPDATE students
        SET Fname=?, Lname=?, Email=?, Major=?, Address=?
        WHERE StdID=?
      `;
      values = [fname, lname, email, major, address, id];
    }
    
    db.query(q, values, (updateErr) => {
      if (updateErr) {
        console.error(updateErr);
        return res.status(500).json({ error: "Failed to update student" });
      }
      res.json({ message: "Student updated successfully" });
    });
  });
});

module.exports = router;