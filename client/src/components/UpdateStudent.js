import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/Students.css";

const UpdateStudent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [student, setStudent] = useState(null);
  const [majors, setMajors] = useState([]);
  const [formData, setFormData] = useState({
    fname: "",
    lname: "",
    email: "",
    major: "",
    address: "",
    image: null
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [currentImage, setCurrentImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStudentAndMajors();
  }, [id]);

  const fetchStudentAndMajors = async () => {
    try {
      setLoading(true);
      
      // Fetch student data
      
      const studentRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/students/${id}`);
      //const studentRes = await axios.get(`/api/students/${id}`);
      
      if (studentRes.data.error) {
        setError(studentRes.data.error);
        setLoading(false);
        return;
      }
      
      const foundStudent = studentRes.data;
      setStudent(foundStudent);
      setCurrentImage(foundStudent.Profile);
      
      // Set form data
      setFormData({
        fname: foundStudent.Fname || "",
        lname: foundStudent.Lname || "",
        email: foundStudent.Email || "",
        major: foundStudent.Major || "",
        address: foundStudent.Address || "",
        image: null
      });

      // Fetch majors
      const majorsRes = await axios.get("/api/students/majors");
      setMajors(majorsRes.data);
      
      setError("");
    } catch (err) {
      console.log(err);
      setError("Failed to load student data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be less than 5MB");
        return;
      }
      
      // Check file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        setError("Only JPEG, PNG, and GIF images are allowed");
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        image: file
      }));
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
      setError(""); // Clear any previous errors
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.fname.trim()) {
      setError("First name is required");
      return;
    }
    
    if (!formData.lname.trim()) {
      setError("Last name is required");
      return;
    }
    
    if (!formData.email.trim()) {
      setError("Email is required");
      return;
    }
    
    if (!formData.email.includes('@') || !formData.email.includes('.')) {
      setError("Please enter a valid email address");
      return;
    }
    
    if (!formData.major) {
      setError("Major is required");
      return;
    }
    
    if (!formData.address.trim()) {
      setError("Address is required");
      return;
    }

    setUpdating(true);
    setError("");

    const data = new FormData();
    data.append('fname', formData.fname.trim());
    data.append('lname', formData.lname.trim());
    data.append('email', formData.email.trim());
    data.append('major', formData.major);
    data.append('address', formData.address.trim());
    if (formData.image) {
      data.append('image', formData.image);
    }

    try {
      await axios.post(`/api/students/modify/${id}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Navigate back to students list
      navigate("/students");
      
    } catch (err) {
      console.log(err);
      setError(err.response?.data?.error || "Failed to update student. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="student-form">
        <h1>Update Student</h1>
        <div className="loading">Loading student data...</div>
      </div>
    );
  }

  if (error && !student) {
    return (
      <div className="student-form">
        <h1>Update Student</h1>
        <div className="error">{error}</div>
        <button 
          className="cancel-btn" 
          onClick={() => navigate("/students")}
          style={{ marginTop: "20px", width: "100%" }}
        >
          Back to Students
        </button>
      </div>
    );
  }

  return (
    <div className="student-form">
      <h1>Update Student (ID: {id})</h1>
      
      {error && <div className="error">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="fname">First Name *</label>
          <input
            type="text"
            id="fname"
            name="fname"
            value={formData.fname}
            onChange={handleChange}
            required
            disabled={updating}
          />
        </div>

        <div className="form-group">
          <label htmlFor="lname">Last Name *</label>
          <input
            type="text"
            id="lname"
            name="lname"
            value={formData.lname}
            onChange={handleChange}
            required
            disabled={updating}
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email *</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={updating}
          />
        </div>

        <div className="form-group">
          <label htmlFor="major">Major *</label>
          <select
            id="major"
            name="major"
            value={formData.major}
            onChange={handleChange}
            required
            disabled={updating}
          >
            <option value="">Select a major</option>
            {majors.map(major => (
              <option key={major.MajorCode} value={major.MajorCode}>
                {major.MajorCode} - {major.Description}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="address">Address *</label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
            disabled={updating}
          />
        </div>

        <div className="form-group">
          <label htmlFor="image">New Profile Image (Optional, max 5MB)</label>
          <input
            type="file"
            id="image"
            name="image"
            accept=".jpg,.jpeg,.png,.gif"
            onChange={handleImageChange}
            disabled={updating}
          />
          <div style={{ marginTop: "10px", fontSize: "14px", color: "#666" }}>
            Leave empty to keep current image
          </div>
          
          {/* Current image preview */}
          {currentImage && !previewImage && (
            <div className="image-preview">
              <p>Current Image:</p>
              <img 
                src={`data:image/jpeg;base64,${currentImage}`} 
                alt="Current" 
              />
            </div>
          )}
          
          {/* New image preview */}
          {previewImage && (
            <div className="image-preview">
              <p>New Image Preview:</p>
              <img src={previewImage} alt="Preview" />
            </div>
          )}
        </div>

        <div className="form-buttons">
          <button
            type="button"
            className="cancel-btn"
            onClick={() => navigate("/students")}
            disabled={updating}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="submit-btn"
            disabled={updating}
          >
            {updating ? "Updating..." : "Update Student"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UpdateStudent;