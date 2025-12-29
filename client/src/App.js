import React from 'react';
import { Routes, Route, Navigate } from "react-router-dom";
import { BrowserRouter } from "react-router-dom";
import Students from "./components/Students";
import AddStudent from "./components/AddStudent";
import UpdateStudent from "./components/UpdateStudent";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/students" />} />
        <Route path="/students" element={<Students />} />
        <Route path="/add" element={<AddStudent />} />
        <Route path="/update/:id" element={<UpdateStudent />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;