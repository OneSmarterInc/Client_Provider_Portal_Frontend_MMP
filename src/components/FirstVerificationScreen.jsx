import React, { useEffect } from "react";
import backgroundImage from "../assets/image.png";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const FirstVerificationScreen = () => {
  const navigate = useNavigate();

  const userData = JSON.parse(localStorage.getItem("user"));
  const verificationShown = localStorage.getItem("verificationShown");

  const formatDate = (dateString) => {
    if (!dateString) return "Not available";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDetails = () => {
    localStorage.setItem("verificationShown", "true");
    navigate("/members");
  };

  const location = useLocation();
  useEffect(() => {
    if (!userData) {
      toast.error("Please login first");
      navigate("/login");
    } else if (location.pathname === "/members") {
      navigate("/members");
    } else if (verificationShown) {
      navigate("/members");
    }
  }, [userData, verificationShown, navigate]);

  if (!userData || verificationShown) {
    return null;
  }

  const divStyle = {
    backgroundImage: `url(${backgroundImage})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };

  const emailParts = userData.email.split("@")[0].split(".");
  const firstName = emailParts[0] || "User";
  const lastName = emailParts.length > 1 ? emailParts[1] : "";

  return (
    <div
      style={divStyle}
      className="min-h-screen flex flex-col justify-center items-center gap-4"
    >
      <div className="flex flex-col border-2 border-sky-300 bg-white rounded-lg w-96">
        <div className="flex justify-center text-center p-2 border-b-2 border-sky-300">
          <h3 className="text-black font-medium">
            Provider Account Verification
          </h3>
        </div>
        <div className="flex flex-row p-2">
          <div className="p-4 border-r-2">
            <h2 className="text-[#0486A5] text-xl mb-2">
              {firstName.charAt(0).toUpperCase() + firstName.slice(1)} <br />
              {lastName && lastName.charAt(0).toUpperCase() + lastName.slice(1)}
            </h2>
            <p className="text-sm text-black-300 mb-2">{userData.email}</p>
            <p className="text-sx">
              {userData.phone_no || "Phone number not available"}
            </p>
          </div>
          <div className="p-4 mr-16">
            <div>
              <p className="text-gray-500 text-sm">Provider Number:</p>
              <p className="text-[#0486A5] text-sm mb-2">
                {userData.provider_no || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Member Since:</p>
              <p className="text-[#0486A5] text-sm mb-2">
                {formatDate(userData.date_joined)}
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Last Login:</p>
              <p className="text-[#0486A5] text-sm">
                {formatDate(userData.last_login)}
              </p>
            </div>
          </div>
        </div>
        <div className="flex justify-center text-center rounded text-white bg-[#0486A5] p-2 hover:bg-[#047B95] cursor-pointer">
          <button className="text-sm font-medium" onClick={handleDetails}>
            CONFIRM ACCOUNT DETAILS
          </button>
        </div>
      </div>
    </div>
  );
};

export default FirstVerificationScreen;
