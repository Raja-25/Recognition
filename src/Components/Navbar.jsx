import React from 'react';
import { NavLink } from 'react-router-dom';
import './Navbar.css'; // Make sure to import your CSS file

const Navbar = () => {
  return (
    <ul className="nav-links">
      <li><NavLink to="/">Rekognition</NavLink></li>
      <li className="center"><NavLink to="http://rajarajendra.live/" target="_blank">Portfolio</NavLink></li>
      <li className="upward"><NavLink to="/services">Services</NavLink></li>
      <li className="forward"><NavLink to="/feedback">Feedback</NavLink></li>
    </ul>
  );
}

export default Navbar;
