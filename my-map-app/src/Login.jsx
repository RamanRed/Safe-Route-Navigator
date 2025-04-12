import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import loginImage from "/registerdoodle.jpg"; // Import a login image
import "./Login.css";
import Header from "./header";
import Footer from "./Footer";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    Email: "",
    Password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.Email || !formData.Password) {
      alert("Please enter both Email and Password!");
      return;
    }

    try {
      const response = await axios.post("http://localhost:3001/login", {
        email: formData.Email,
        password: formData.Password,
      });

      console.log("Login successful:", response.data);
      
      localStorage.setItem("userData", JSON.stringify(response.data.user));
      
      navigate("/maps"); // Redirect after login
    } catch (err) {
      console.error(`Error occurred: ${err.message}`);
      alert(
        err.response?.data?.message || "Invalid credentials. Please try again."
      );
    }
  };

  return (
    <div className="page_container">
      <Header />
      <div className="login-container">
        <img src={loginImage} alt="login image" className="login-image" />
        <div className="login-box">
          <h2>Welcome Back</h2>
          <p className="login-subtitle">Sign in to your account</p>
          
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="Email">Email</label>
              <input
                type="email"
                id="Email"
                name="Email"
                placeholder="Enter your email"
                value={formData.Email}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="Password">Password</label>
              <input
                type="password"
                id="Password"
                name="Password"
                placeholder="Enter your password"
                value={formData.Password}
                onChange={handleChange}
                className="form-input"
                required
              />
              {/* <div className="forgot-password">
                <Link to="/forgot-password">Forgot password?</Link>
              </div> */}
            </div>
            
            <button type="submit" className="login-button">
              Log In
            </button>
          </form>
          
          <div className="signup-link">
            Don't have an account? <Link to="/register">Sign up</Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Login;