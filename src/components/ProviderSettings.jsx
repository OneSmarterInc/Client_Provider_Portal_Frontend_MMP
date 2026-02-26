import React, { useContext, useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import MyContext from "../ContextApi/MyContext";
import W9FromSubmission from "./W9FromSubmission";

const ProviderSettings = ({ isOpen, onClose }) => {
  const { api, providerNumbers, updateProviderNumbers, activeProvider, switchProvider } =
    useContext(MyContext);
  const [newProviderNo, setNewProviderNo] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(null);
  const [showW9Upload, setShowW9Upload] = useState(false);
  const [w9SelectedProvider, setW9SelectedProvider] = useState(null);

  const authToken = localStorage.getItem("authToken");
  const headers = { Authorization: `Token ${authToken}` };

  // Re-fetch provider list when modal opens to get latest statuses
  useEffect(() => {
    if (isOpen && authToken) {
      axios
        .get(`${api}/auth/providers/`, { headers })
        .then((res) => updateProviderNumbers(res.data))
        .catch(() => {});
    }
  }, [isOpen]);

  const handleAddProvider = async () => {
    if (!newProviderNo.trim()) {
      toast.error("Please enter a provider number");
      return;
    }

    // First validate against DB2
    setIsValidating(true);
    try {
      const validateRes = await axios.get(`${api}/check_provno_exists_for_login/`, {
        params: { provider_no: newProviderNo },
      });

      if (!validateRes.data.is_exist) {
        toast.error("Provider number is invalid.");
        setIsValidating(false);
        return;
      }

      if (validateRes.data.is_already_registered) {
        toast.error("This provider number is already registered under another account.");
        setIsValidating(false);
        return;
      }
    } catch {
      toast.error("Validation failed. Try again.");
      setIsValidating(false);
      return;
    }
    setIsValidating(false);

    // Add via API
    setIsAdding(true);
    try {
      const res = await axios.post(
        `${api}/auth/providers/add/`,
        { provider_no: newProviderNo },
        { headers }
      );

      // Refresh provider list
      const listRes = await axios.get(`${api}/auth/providers/`, { headers });
      updateProviderNumbers(listRes.data);

      toast.success(res.data.message || "Provider submitted for admin approval.");
      setNewProviderNo("");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to add provider");
    } finally {
      setIsAdding(false);
    }
  };

  const approvedProviders = providerNumbers.filter((p) => p.status === "approved");

  const openRemoveConfirm = (pnId) => {
    const pn = providerNumbers.find((p) => p.id === pnId);
    if (pn?.status === "approved" && approvedProviders.length <= 1) {
      toast.error("Cannot remove your last approved provider");
      return;
    }
    setShowRemoveConfirm(pnId);
  };

  const handleRemove = async () => {
    const pnId = showRemoveConfirm;
    setShowRemoveConfirm(null);

    setActionLoading(pnId);
    try {
      await axios.delete(`${api}/auth/providers/${pnId}/remove/`, { headers });

      const listRes = await axios.get(`${api}/auth/providers/`, { headers });
      updateProviderNumbers(listRes.data);

      toast.success("Provider removed");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to remove provider");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSetPrimary = async (pnId) => {
    setActionLoading(pnId);
    try {
      await axios.post(`${api}/auth/providers/${pnId}/set-primary/`, {}, { headers });

      const listRes = await axios.get(`${api}/auth/providers/`, { headers });
      updateProviderNumbers(listRes.data);

      // Switch active to the new primary
      const newPrimary = listRes.data.find((p) => p.is_primary);
      if (newPrimary) switchProvider(newPrimary);

      toast.success("Primary provider updated");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to set primary");
    } finally {
      setActionLoading(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
      <div className="bg-white rounded-xl w-full max-w-lg mx-4 shadow-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800">Manage Providers</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">
            &times;
          </button>
        </div>

        {/* Current providers list */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-600 mb-2">Your Provider Numbers</h4>
          <div className="space-y-2">
            {providerNumbers.map((pn) => (
              <div
                key={pn.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  pn.status === "pending"
                    ? "border-yellow-300 bg-yellow-50"
                    : pn.status === "declined"
                    ? "border-red-300 bg-red-50"
                    : activeProvider?.id === pn.id
                    ? "border-[#0486A5] bg-blue-50"
                    : "border-gray-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-800">{pn.provider_no}</span>
                  {pn.status === "pending" && (
                    <span
                      className="text-[10px] bg-yellow-500 text-white px-2 py-0.5 rounded-full cursor-default"
                      title={typeof pn.id === "string" ? "New provider registration is pending admin approval" : "Provider number is added but approval is pending from admin side"}
                    >
                      Pending Approval
                    </span>
                  )}
                  {pn.status === "declined" && (
                    <span
                      className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full cursor-default"
                      title="Provider number has been declined by admin"
                    >
                      Declined
                    </span>
                  )}
                  {pn.status === "approved" && pn.is_primary && (
                    <span className="text-[10px] bg-[#0486A5] text-white px-2 py-0.5 rounded-full">
                      Primary
                    </span>
                  )}
                  {pn.status === "approved" && pn.w9_status !== "approved" && pn.w9_status !== "W9_form_uploaded" && (
                    <span
                      className="text-[10px] bg-orange-400 text-white px-2 py-0.5 rounded-full cursor-default"
                      title="W9 form not uploaded. Click 'Upload W9' to upload."
                    >
                      W9 Needed
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {pn.status === "approved" && pn.w9_status !== "approved" && pn.w9_status !== "W9_form_uploaded" && (
                    <button
                      onClick={() => {
                        setW9SelectedProvider(pn);
                        setShowW9Upload(true);
                      }}
                      className="text-xs text-orange-500 hover:underline"
                    >
                      Upload W9
                    </button>
                  )}
                  {pn.status === "approved" && !pn.is_primary && (
                    <button
                      onClick={() => handleSetPrimary(pn.id)}
                      disabled={actionLoading === pn.id}
                      className="text-xs text-[#0486A5] hover:underline disabled:opacity-50"
                    >
                      Set Primary
                    </button>
                  )}
                  {typeof pn.id === "number" && (pn.status !== "approved" || approvedProviders.length > 1) && (
                    <button
                      onClick={() => openRemoveConfirm(pn.id)}
                      disabled={actionLoading === pn.id}
                      className="text-xs text-red-500 hover:underline disabled:opacity-50"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add new provider */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-600 mb-2">Add New Provider</h4>
          <div className="flex gap-2">
            <input
              type="text"
              value={newProviderNo}
              onChange={(e) => setNewProviderNo(e.target.value)}
              placeholder="Enter Provider Number"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <button
              onClick={handleAddProvider}
              disabled={isValidating || isAdding}
              className="bg-[#0486A5] hover:bg-[#047B95] text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
            >
              {isValidating ? "Validating..." : isAdding ? "Adding..." : "Add"}
            </button>
          </div>
        </div>
      </div>

      {/* W9 Upload Modal */}
      <W9FromSubmission
        showW9Form={showW9Upload}
        setShowW9Form={setShowW9Upload}
        selectedProvider={w9SelectedProvider}
      />

      {/* Remove Confirmation Modal */}
      {showRemoveConfirm && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[60]">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl mx-4">
            <h2 className="text-lg font-bold mb-3 text-gray-800">
              Remove Provider
            </h2>
            <p className="text-sm text-gray-600 mb-5">
              Are you sure you want to remove provider{" "}
              <strong>
                {providerNumbers.find((p) => p.id === showRemoveConfirm)?.provider_no}
              </strong>
              ? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowRemoveConfirm(null)}
                className="px-4 py-2 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-100 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleRemove}
                className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProviderSettings;
