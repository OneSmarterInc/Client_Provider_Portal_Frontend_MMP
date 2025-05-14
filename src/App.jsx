import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Register from "./components/Register";
import ProviderLogin from "./components/ProviderLogin";
import AccountVerification from "./components/AccountVerification";
import MemberScreen from "./components/MemberScreen";
import { ToastContainer } from "react-toastify";
import "./output.css";
import AdminValidations from "./components/AdminValidations";
import Watchlist from "./components/Watchlist";
import FirstVerificationScreen from "./components/FirstVerificationScreen";

const App = () => {
  return (
    <Router>
      <ToastContainer />
      <Routes>
        <Route path="/" element={<ProviderLogin />} />
        <Route path="/login" element={<ProviderLogin />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify" element={<FirstVerificationScreen />} />
        <Route path="/members" element={<MemberScreen />} />
        <Route path="/admin" element={<AdminValidations />} />
        <Route path="/watchlist" element={<Watchlist />} />
      </Routes>
    </Router>
  );
};

export default App;
