import React, { useContext, useEffect, useState } from "react";
import backgroundImage from "../assets/image.png";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import MyContext from "../ContextApi/MyContext";

const AccountVerification = ({ setShowMyProfile, showMyProfile }) => {
  const navigate = useNavigate();
  const { api } = useContext(MyContext);
  const userData = JSON.parse(localStorage.getItem("user"));

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

  const divStyle = {
    backgroundImage: `url(${backgroundImage})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };

  const emailParts = userData.email.split("@")[0].split(".");
  const firstName = emailParts[0] || "User";
  const lastName = emailParts.length > 1 ? emailParts[1] : "";

  const [status, setStatus] = useState("not_submitted");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUserW9Status();
  }, []);

  const fetchUserW9Status = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${api}/w9/status/${userData.id}/`);
      if (response.data) {
        setStatus(response.data.status || "not_submitted");
      }
    } catch (error) {
      setError("Failed to fetch W9 status. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getStatus = () => {
    switch (status) {
      case "in_progress":
        return "In Progress";
      case "approved":
        return "Approved";
      case "declined":
        return "Declined";
      default:
        return "Not Submitted";
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "not_submitted":
        return "Upload your W9 form to get started.";
      case "in_progress":
        return "Your W9 form is under review.";
      case "approved":
        return "Your W9 form has been approved!";
      case "declined":
        return "Your W9 form has been declined by Admin. Please upload again.";
      default:
        return "";
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "in_progress":
        return "text-yellow-600";
      case "approved":
        return "text-green-600";
      case "declined":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div
      // style={divStyle}
      className="min-h-screen z-40 fixed bg-black/30 backdrop-blur-sm inset-0 flex flex-col justify-center items-center gap-4"
    >
      {showMyProfile && (
        <div className="flex flex-col border-2 border-sky-300 bg-white rounded-lg w-96">
          <div className="flex justify-center text-center p-2 border-b-2 border-sky-300">
            <h3 className="text-black font-medium">
              Provider Account Verification
            </h3>
          </div>
          <div className="flex flex-row p-2">
            <div className="p-4 border-r-2  ">
              <h2 className="text-[#0486A5] text-xl mb-2">
                {firstName.charAt(0).toUpperCase() + firstName.slice(1)} <br />
                {lastName &&
                  lastName.charAt(0).toUpperCase() + lastName.slice(1)}
              </h2>
              <p className="text-sm text-black-300 mb-2">{userData.email}</p>
              <p className="text-sx">
                {userData.phone_no || "Phone number not available"}
              </p>

              <div className="my-2 py-2 border-t-2">
                {!loading ? (
                  <p>
                    W9 Form Status:{" "}
                    <p className={`${getStatusColor()}`}>{getStatus()}</p>
                    <p className="ml-2 text-sm">{getStatusText()}</p>
                  </p>
                ) : (
                  <p>Fetching W9 Form Status...</p>
                )}
              </div>
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
          <div
            onClick={() => setShowMyProfile(false)}
            className="flex justify-center text-center rounded text-white bg-[#0486A5] p-2 hover:bg-[#047B95] cursor-pointer"
          >
            <button className="text-sm font-medium">Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountVerification;
