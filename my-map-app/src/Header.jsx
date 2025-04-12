import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Map from "/map_icon.png";
import "./Header.css";

const Header = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const clickLogin = (event) => {
    event.preventDefault();
    navigate('./Login');
    setMenuOpen(false);
  };

  const clickSignUp = (event) => {
    event.preventDefault();
    navigate('./register');
    setMenuOpen(false);
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <div className={`header ${menuOpen ? 'menu-open' : ''}`}>
      <div className="header-logo">
        <img src={Map} alt="map-logo" width={100} />
        <h1>Go Safe</h1>
      </div>

      {/* <div className="header-nav">
        <a href="/home">Home</a>
        <a href="/about">About</a>
        <a href="/services">Services</a>
      </div> */}

      <button className="mobile-menu-button" onClick={toggleMenu}>
        {menuOpen ? '✕' : '☰'}
      </button>

      <div className="header-buttons">
        <button className="login" onClick={clickLogin}>Login</button>
        <button className="signup" onClick={clickSignUp}>Sign Up</button>
      </div>
    </div>
  );
};

export default Header;