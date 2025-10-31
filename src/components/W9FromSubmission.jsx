import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import {
  FiUpload,
  FiCheckCircle,
  FiX,
  FiLoader,
  FiAlertCircle,
} from "react-icons/fi";
import MyContext from "../ContextApi/MyContext";

const W9FromSubmission = ({ showW9Form, setShowW9Form }) => {
  const { api } = useContext(MyContext);
  const [status, setStatus] = useState("not_submitted");
  const [file, setFile] = useState(null);
  const [fileURL, setFileURL] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [declineReason, setDeclineReason] = useState(null);

  const user = JSON.parse(localStorage.getItem("user"));

  const [db2W9Status, setDb2W9Status] = useState("");
  const [isCheckingDB2Status, setIsCheckingDB2Status] = useState(true);

  const fetchUserW9StatusFromDB2 = async () => {
    try {
      setIsCheckingDB2Status(true);
      setError(null);
      const response = await axios.get(
        `${api}/w9/status-db2/?provider_no=${user?.provider_no}`
      );
      if (response.data) {
        setDb2W9Status(response.data.status);
      }
    } catch (error) {
      setError("Failed to fetch W9 status. Please try again.");
    } finally {
      setIsCheckingDB2Status(false);
    }
  };

  useEffect(() => {
    if (showW9Form) {
      fetchUserW9StatusFromDB2();
      fetchUserW9Status();
    }
  }, [showW9Form]);

  const fetchUserW9Status = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${api}/w9/status/${user.id}/`);
      if (response.data) {
        setStatus(response.data.status || "not_submitted");
        setFileURL(response.data.file_url || "");
        setDeclineReason(response.data.decline_remark || null);
      }
    } catch (error) {
      setError("Failed to fetch W9 status. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      if (selectedFile.type !== "application/pdf") {
        setError("Please upload a PDF file only.");
        return;
      }
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError("File size should not exceed 5MB.");
        return;
      }

      setError(null);
      setFile(selectedFile);
      setFileURL(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmitW9 = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("user_id", user.id);
    formData.append("file", file);

    try {
      setLoading(true);
      setError(null);
      await axios.post(`${api}/w9/upload/`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      fetchUserW9Status();
      setFile(null);
    } catch (error) {
      setError("An error occurred during upload. Please try again.");
    } finally {
      setLoading(false);
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

  const progressWidth = {
    not_submitted: "0%",
    in_progress: "50%",
    approved: "100%",
    declined: "100%",
  }[status];

  const progressColor = {
    not_submitted: "#e5e7eb",
    in_progress: "#f59e0b",
    approved: "#10b981",
    declined: "#ef4444",
  }[status];

  return (
    showW9Form && (
      <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
        <div className="bg-white rounded-xl w-full max-w-md mx-4 shadow-xl relative p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800">
              W9 Form Submission
            </h3>
            <div className="">
              <button
                className="text-teal-500 hover:text-teal-700"
                onClick={() => fetchUserW9Status()}
              >
                <i class="fa-solid fa-clock-rotate-left"></i> Refresh
              </button>
            </div>
            <button
              onClick={() => setShowW9Form(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <FiX size={24} />
            </button>
          </div>

          {isCheckingDB2Status ? (
            <div className="h-60 flex flex-col items-center justify-center">
              <FiLoader className="animate-spin text-blue-600 mb-3" size={40} />
              <p className="text-gray-600">Checking W9 status...</p>
            </div>
          ) : db2W9Status !== "W9_form_uploaded" ? (
            <div className="h-60 flex items-center justify-center">
              <p className="text-gray-700 text-center">
                You have already uploaded the W9 form.
              </p>
            </div>
          ) : (
            <div>
              <div
                className={`text-center m-6 ${getStatusColor()} font-medium`}
              >
                {getStatusText()}
              </div>

              <div className="relative w-full my-8">
                <div className="w-full h-2 bg-gray-200 rounded-full" />
                <div
                  className="absolute top-0 left-0 h-2 rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: progressWidth,
                    backgroundColor: progressColor,
                  }}
                />
                <div className="absolute top-4 w-full flex justify-between transform -translate-y-1/2">
                  {/* Step 1: Upload */}
                  <div
                    className={`flex flex-col items-center ${
                      status !== "not_submitted"
                        ? "text-blue-600"
                        : "text-gray-400"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        status !== "not_submitted"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200"
                      }`}
                    >
                      {status !== "not_submitted" ? (
                        <FiCheckCircle size={16} />
                      ) : (
                        <span className="text-xs">1</span>
                      )}
                    </div>
                    <span className="mt-2 text-xs font-medium">Upload</span>
                  </div>

                  {/* Step 2: Review */}
                  <div
                    className={`flex flex-col items-center ${
                      ["in_progress", "approved", "declined"].includes(status)
                        ? "text-yellow-600"
                        : "text-gray-400"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        ["in_progress", "approved", "declined"].includes(status)
                          ? "bg-yellow-500 text-white"
                          : "bg-gray-200"
                      }`}
                    >
                      {status === "in_progress" ? (
                        <FiLoader className="animate-spin" size={16} />
                      ) : (
                        <span className="text-xs">2</span>
                      )}
                    </div>
                    <span className="mt-2 text-xs font-medium">Review</span>
                  </div>

                  {/* Step 3: Final */}
                  <div
                    className={`flex flex-col items-center ${
                      status === "approved"
                        ? "text-green-600"
                        : status === "declined"
                        ? "text-red-600"
                        : "text-gray-400"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        status === "approved"
                          ? "bg-green-500 text-white"
                          : status === "declined"
                          ? "bg-red-500 text-white"
                          : "bg-gray-200"
                      }`}
                    >
                      {status === "approved" || status === "declined" ? (
                        <FiCheckCircle size={16} />
                      ) : (
                        <span className="text-xs">3</span>
                      )}
                    </div>
                    <span className="mt-2 text-xs font-medium">
                      {status === "declined" ? "Declined" : "Approved"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Upload area */}
              {status !== "approved" && (
                <div className="flex flex-col gap-4">
                  <label className="w-full">
                    <div
                      className={`px-6 py-3 rounded-lg border-2 mt-4 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${
                        file
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-300 hover:border-blue-400"
                      }`}
                    >
                      <FiUpload size={24} className="text-blue-500 mb-2" />
                      <span className="text-sm font-medium text-gray-700">
                        {file ? file.name : "Click to upload W9 form"}
                      </span>
                      <span className="text-xs text-gray-500 mt-1">
                        PDF format only (max 5MB)
                      </span>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                      accept=".pdf,application/pdf"
                    />
                  </label>

                  <button
                    className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center ${
                      file
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-gray-200 text-gray-500 cursor-not-allowed"
                    }`}
                    onClick={handleSubmitW9}
                    disabled={!file || loading}
                  >
                    {loading ? (
                      <>
                        <FiLoader className="animate-spin mr-2" />
                        Submitting...
                      </>
                    ) : (
                      "Submit W9 Form"
                    )}
                  </button>
                </div>
              )}

              {/* File preview */}
              {fileURL && status !== "not_submitted" && (
                <div className="mt-4 text-center">
                  <a
                    href={fileURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center"
                  >
                    <FiUpload className="mr-1" /> View Uploaded W9 Form
                  </a>
                </div>
              )}

              {/* Declined reason */}
              {status === "declined" && declineReason && (
                <div className="mt-3 text-center text-sm text-red-600 flex items-center justify-center gap-2">
                  <FiAlertCircle />{" "}
                  <span className=" font-bold">Declined Remark:</span>{" "}
                  {declineReason}
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="mt-4 text-center text-red-500 text-sm">
                  {error}
                </div>
              )}

              {/* Approved message */}
              {status === "approved" && (
                <div className="mt-4 text-center text-sm text-gray-600">
                  Your W9 form has been successfully verified. No further action
                  is required.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  );
};

export default W9FromSubmission;
