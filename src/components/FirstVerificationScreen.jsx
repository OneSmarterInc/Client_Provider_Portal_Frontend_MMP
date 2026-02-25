import React, { useContext, useEffect, useState, useCallback } from "react";
import backgroundImage from "../assets/image.png";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import MyContext from "../ContextApi/MyContext";
import W9FromSubmission from "./W9FromSubmission";

const FirstVerificationScreen = () => {
  const navigate = useNavigate();
  const { api, activeProvider, approvedProviders } = useContext(MyContext);
  const [status, setStatus] = useState("not_submitted");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showW9Form, setShowW9Form] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const userData = JSON.parse(localStorage.getItem("user"));
  const verificationShown = localStorage.getItem("verificationShown");

  // Initialize selectedProvider to activeProvider or first approved provider
  useEffect(() => {
    if (!selectedProvider && approvedProviders?.length > 0) {
      const initial = approvedProviders.find((p) => p.id === activeProvider?.id) || approvedProviders[0];
      setSelectedProvider(initial);
    }
  }, [approvedProviders, activeProvider]);

  const currentProviderNo = selectedProvider?.provider_no || activeProvider?.provider_no || userData?.provider_no;

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

  const fetchUserW9Status = useCallback(async () => {
    try {
      const pnIdParam = selectedProvider?.id ? `?provider_number_id=${selectedProvider.id}` : '';
      const response = await axios.get(`${api}/w9/status/${userData.id}/${pnIdParam}`);
      if (response.data) {
        return response.data.status || "not_submitted";
      }
    } catch (error) {
      console.log("App W9 status fetch failed", error);
    }
    return "not_submitted";
  }, [api, userData?.id, selectedProvider]);

  const fetchUserW9StatusFromDB2 = useCallback(async () => {
    try {
      const response = await axios.get(
        `${api}/w9/status-db2/?provider_no=${currentProviderNo}`
      );
      console.log('w9 form', response.data);
      if (response.data) {
        return response.data.status || "not_submitted";
      }
    } catch (error) {
      console.log("DB2 W9 status fetch failed", error);
    }
    return "not_submitted";
  }, [api, currentProviderNo]);

  // Fetch both statuses and pick the best one
  const fetchCombinedW9Status = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [db2Status, appStatus] = await Promise.all([
        fetchUserW9StatusFromDB2(),
        fetchUserW9Status(),
      ]);

      // Priority: if DB2 says uploaded/approved → approved
      // If app says in_progress/approved → use that
      // Otherwise fallback to not_submitted
      if (db2Status === "W9_form_uploaded" || db2Status === "approved") {
        setStatus(db2Status);
      } else if (appStatus === "approved") {
        setStatus("approved");
      } else if (appStatus === "in_progress") {
        setStatus("in_progress");
      } else if (appStatus === "declined") {
        setStatus("declined");
      } else if (db2Status === "W9_form_not_uploaded" || db2Status === "not_submitted") {
        setStatus(db2Status);
      } else {
        setStatus(appStatus);
      }
    } catch (error) {
      setError("Failed to fetch W9 status. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [fetchUserW9StatusFromDB2, fetchUserW9Status]);

  const isW9Approved = status === "approved" || status === "W9_form_uploaded";

  useEffect(() => {
    if (!userData) {
      toast.error("Please login first");
      navigate("/login");
    } else if (location.pathname === "/members") {
      navigate("/members");
    } else if (verificationShown && isW9Approved) {
      navigate("/members");
    }
  }, [userData, verificationShown, navigate, isW9Approved]);

  useEffect(() => {
    if (selectedProvider) {
      fetchCombinedW9Status();
    }
  }, [selectedProvider]);

  // Re-fetch W9 status when W9 modal is closed
  useEffect(() => {
    if (!showW9Form) {
      fetchCombinedW9Status();
    }
  }, [showW9Form]);

  // Auto-poll every 30 seconds when status is in_progress
  useEffect(() => {
    if (status === "in_progress") {
      const interval = setInterval(() => {
        fetchCombinedW9Status();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [status, fetchCombinedW9Status]);

  if (!userData || (verificationShown && isW9Approved)) {
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

  const getStatus = () => {
    switch (status) {
      case "W9_form_uploaded":
        return "W9 Form Uploaded";
      case "W9_form_not_uploaded":
        return "Not Submitted";
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
      case "W9_form_uploaded":
        return "Your W9 form has been uploaded!";
      case "W9_form_not_uploaded":
        return "Upload your W9 form to get started.";
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
      case "W9_form_uploaded":
        return "text-green-600";
      case "W9_form_not_uploaded":
        return "text-yellow-600";
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

  const handleProviderChange = (e) => {
    const providerId = parseInt(e.target.value, 10);
    const provider = approvedProviders.find((p) => p.id === providerId);
    if (provider) {
      setSelectedProvider(provider);
    }
  };

  return (
    <div
      style={divStyle}
      className="min-h-screen flex flex-col justify-center items-center gap-4"
    >
      {/* Provider select dropdown */}
      {approvedProviders && approvedProviders.length > 1 && (
        <div className="w-96 bg-white border-2 border-sky-300 rounded-lg p-3">
          <label className="text-sm font-medium text-gray-700 block mb-1">
            Select Provider Number
          </label>
          <select
            value={selectedProvider?.id || ""}
            onChange={handleProviderChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-[#0486A5] focus:outline-none focus:ring-2 focus:ring-sky-300"
          >
            {approvedProviders.map((p) => (
              <option key={p.id} value={p.id}>
                {p.provider_no}{p.is_primary ? " (Primary)" : ""}
              </option>
            ))}
          </select>
        </div>
      )}

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
                {currentProviderNo || "N/A"}
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
        {/* Bottom button changes based on W9 status */}
        {isW9Approved ? (
          <div className="flex justify-center text-center rounded text-white bg-[#0486A5] p-2 hover:bg-[#047B95] cursor-pointer">
            <button className="text-sm font-medium" onClick={handleDetails}>
              CONFIRM ACCOUNT DETAILS
            </button>
          </div>
        ) : status === "in_progress" ? (
          <div className="flex flex-col">
            <div className="flex justify-center text-center rounded text-white bg-yellow-500 p-2">
              <span className="text-sm font-medium">
                ⏳ W9 APPROVAL PENDING
              </span>
            </div>
            <button
              className="text-xs text-[#0486A5] hover:underline mt-2 mb-1 text-center"
              onClick={fetchCombinedW9Status}
              disabled={loading}
            >
              {loading ? "Checking..." : "Refresh Status"}
            </button>
          </div>
        ) : (
          <div className="flex justify-center text-center rounded text-white bg-[#0486A5] p-2 hover:bg-[#047B95] cursor-pointer">
            <button
              className="text-sm font-medium"
              onClick={() => setShowW9Form(true)}
            >
              UPLOAD W9 FORM TO CONTINUE
            </button>
          </div>
        )}
      </div>

      {/* W9 Upload Modal */}
      <W9FromSubmission showW9Form={showW9Form} setShowW9Form={setShowW9Form} skipDb2Check={true} selectedProvider={selectedProvider} />
    </div>
  );
};

export default FirstVerificationScreen;
