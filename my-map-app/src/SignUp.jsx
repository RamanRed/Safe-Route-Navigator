import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./SignUp.css"; // Import the CSS file
import Header from "./header";
import Footer from "./Footer";
import registerImgae from "/registerdoodle.jpg"
const SignUp = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    Start: "",
    Destination: "",
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

    if (!formData.Start || !formData.Destination || !formData.Email || !formData.Password) {
      alert("Please fill in all fields!");
      return;
    }
    // else {
    //   alert(`Entered values are :${formData.Start} ${formData.Email}`)
    // }

    try {
      const response = await axios.post("http://localhost:3001/register", formData);
      console.log("Data sent successfully:", response.data);
      alert(`Signup Successful! \n Email: ${formData.Email}`);
      localStorage.setItem("registeredData", JSON.stringify(formData));
      navigate("/maps");
    } catch (err) {
      console.error(`Error occurred: ${err.message}`);
      alert("An error occurred while signing up. Please try again.");
    }
  };

  return (
    <div className="page_container">
      <Header/>
      <div className="signup-container">
        <img src={registerImgae} alt="registration image" width={300} height={300}/>
        <div className="signup-box">
          <h2>Create Your account</h2>
          <form onSubmit={handleSubmit} className="signup-form">
            <div className="form-group">
              <label htmlFor="Start">Start</label>
              <input
                type="text"
                id="Start"
                name="Start"
                placeholder="e.g. mexico"
                value={formData.Start || ''}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="Destination">Destination</label>
              <input
                type="text"
                id="Destination"
                name="Destination"
                placeholder="e.g. Newyork"
                value={formData.Destination || ''}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="Email"
                placeholder="e.g. alex@gmail.com"
                value={formData.Email || ''}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="Password"
                placeholder="Enter strong password"
                value={formData.Password || ''}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
            
            <button type="submit" className="signup-button">Create account</button>
          </form>
          <div className="login-link">
            Already have an account? <a href="/login">Log in</a>
          </div>
        </div>
      </div>
      <Footer/>
    </div>
  );
};

export default SignUp;
