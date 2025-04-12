import React from "react";
import { Routes, Route } from "react-router-dom";
import AppMap from "./AppMap";
import SignUp from "./SignUp";
import Login from "./Login";
const App = () => {
  return (
    <Routes>
      <Route path="/" element={<SignUp />} />
      <Route path="/maps" element={<AppMap />} />
      <Route path="/login" element={<Login />} />
    </Routes>
  );
};

export default App;