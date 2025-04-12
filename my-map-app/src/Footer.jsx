import React from "react";
import { Link } from "react-router-dom";
import Map from "/map_icon.png";
import "./Footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-logo-section">
          <img src={Map} alt="Go Safe logo" className="footer-logo" />
          <h3>Go Safe</h3>
          <p className="footer-tagline">Navigate your world with confidence</p>
        </div>
        
        {/* <div className="footer-links-container">
          <div className="footer-links-section">
            <h4>Company</h4>
            <ul className="footer-links">
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/contact">Contact</Link></li>
              <li><Link to="/careers">Careers</Link></li>
              <li><Link to="/blog">Blog</Link></li>
            </ul>
          </div>
          
          <div className="footer-links-section">
            <h4>Services</h4>
            <ul className="footer-links">
              <li><Link to="/route-planning">Route Planning</Link></li>
              <li><Link to="/safety-alerts">Safety Alerts</Link></li>
              <li><Link to="/area-reports">Area Reports</Link></li>
              <li><Link to="/community">Community</Link></li>
            </ul>
          </div>
          
          <div className="footer-links-section">
            <h4>Support</h4>
            <ul className="footer-links">
              <li><Link to="/help">Help Center</Link></li>
              <li><Link to="/faq">FAQ</Link></li>
              <li><Link to="/privacy">Privacy Policy</Link></li>
              <li><Link to="/terms">Terms of Service</Link></li>
            </ul>
          </div>
        </div> */}
      </div>
      
      <div className="footer-bottom">
        <div className="social-icons">
          <a href="https://facebook.com" aria-label="Facebook"><i className="fab fa-facebook-f"></i></a>
          <a href="https://twitter.com" aria-label="Twitter"><i className="fab fa-twitter"></i></a>
          <a href="https://instagram.com" aria-label="Instagram"><i className="fab fa-instagram"></i></a>
          <a href="https://linkedin.com" aria-label="LinkedIn"><i className="fab fa-linkedin-in"></i></a>
        </div>
        <p className="copyright">© {new Date().getFullYear()} Go Safe. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;