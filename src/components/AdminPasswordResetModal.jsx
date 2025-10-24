import React, { useContext, useState } from "react";
import axios from "axios";
import MyContext from "../ContextApi/MyContext";

const AdminPasswordResetModal = ({ provider_email }) => {
  const { api } = useContext(MyContext);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!newPassword || !confirmPassword) {
      setErrorMsg("Both fields are required.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("authToken");
      const res = await axios.post(
        `${api}/auth/admin/reset-password/`,
        {
          email: provider_email,
          new_password: newPassword,
          confirm_password: confirmPassword,
        },
        {
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setSuccessMsg(
        "Password has been reset successfully. Email sent to provider."
      );
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      if (err.response) {
        setErrorMsg(
          err.response.data.detail ||
            err.response.data.message ||
            "Something went wrong."
        );
      } else {
        setErrorMsg("Network error. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center z-50">
      <div className="w-full max-w-md pb-5 relative">
        {errorMsg && (
          <div className="mb-3 text-sm text-cyan-600 bg-cyan-100 p-2 rounded">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="mb-3 text-sm text-green-600 bg-green-100 p-2 rounded">
            {successMsg}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="max-w-md mx-auto   rounded-2xl shadow-md space-y-5"
        >
          <p className="text-sm text-gray-500 text-center">
            Enter a new password and confirm it below.
          </p>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              className="w-full px-3 py-2 border rounded-lg shadow-sm 
                 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500
                 border-gray-300 text-gray-700"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              className="w-full px-3 py-2 border rounded-lg shadow-sm 
                 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500
                 border-gray-300 text-gray-700"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className={`w-full px-4 py-2 rounded-lg text-white font-medium transition 
        ${loading ? "bg-cyan-300" : "bg-cyan-600 hover:bg-cyan-700"}`}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminPasswordResetModal;
