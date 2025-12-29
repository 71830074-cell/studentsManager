import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/Students.css";
import { Link } from "react-router-dom";

const Students = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchAllStudents = async () => {
      try {
       // const res = await axios.get("/api/students");
       const res = await fetch(`${process.env.REACT_APP_API_URL}/students`);
        setStudents(res.data);
        setError("");
      } catch (err) {
        console.log(err);
        setError("Failed to load students. Please check if the server is running.");
      } finally {
        setLoading(false);
      }
    };
    fetchAllStudents();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this student?")) {
      try {
        await axios.delete(`/api/students/${id}`);
        setStudents(students.filter(student => student.StdID !== id));
        setSuccess("Student deleted successfully!");
        setTimeout(() => setSuccess(""), 3000);
      } catch (err) {
        console.log(err);
        setError("Failed to delete student. Please try again.");
        setTimeout(() => setError(""), 3000);
      }
    }
  };

  if (loading) {
    return (
      <div className="students">
        <h1>Student Records</h1>
        <div className="loading">Loading students...</div>
      </div>
    );
  }

  return (
    <div className="students">
      <h1>Student Records</h1>
      
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
      
      {students.length === 0 ? (
        <div className="loading" style={{ color: "#666" }}>
          No students found. Add your first student!
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Major</th>
              <th>Address</th>
              <th>Image</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.StdID}>
                <td>{s.StdID}</td>
                <td>
                  {s.Fname} {s.Lname}
                </td>
                <td>
                  <a href={`mailto:${s.Email}`} style={{ color: "#3498db" }}>
                    {s.Email}
                  </a>
                </td>
                <td>{s.Major || "N/A"}</td>
                <td>{s.Address}</td>
                <td>
                  {s.Profile ? (
                    <img
                      src={`data:image/jpeg;base64,${s.Profile}`}
                      alt="profile"
                      style={{ width: "50px", height: "50px" }}
                    />
                  ) : (
                    <div style={{
                      width: "50px",
                      height: "50px",
                      borderRadius: "50%",
                      backgroundColor: "#ddd",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#666",
                      fontSize: "12px"
                    }}>
                      No Image
                    </div>
                  )}
                </td>
                <td className="action-buttons">
                  <button className="update-btn">
                    <Link to={`/update/${s.StdID}`}>
                      ✏️ Edit
                    </Link>
                  </button>

                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(s.StdID)}
                  >
                    🗑️ Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <button className="addHome">
        <Link to="/add">
          + Add New Student
        </Link>
      </button>
    </div>
  );
};

export default Students;