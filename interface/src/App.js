import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

import Home from './Home';
import Department from './Department';
import Employee from './Employee';

import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';

const tabClass = ({ isActive }) =>
  'btn m-1 ' + (isActive ? 'btn-primary' : 'btn-light btn-outline-primary');

export default function App() {
  return (
    <BrowserRouter>
      <div className="App container mt-3">
        <h3 className="d-flex justify-content-center m-3">Department Management</h3>

        <div className="bg-light p-2 mb-4">
          <NavLink to="/home" className={tabClass} end>Home</NavLink>
          <NavLink to="/department" className={tabClass}>Department</NavLink>
          <NavLink to="/employee" className={tabClass}>Employee</NavLink>
        </div>

        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Home />} />
          <Route path="/department" element={<Department />} />
          <Route path="/employee" element={<Employee />} />
          <Route path="*" element={<div className="text-center">Not found</div>} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
