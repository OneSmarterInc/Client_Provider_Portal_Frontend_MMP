import React, { useContext, useState, useEffect, useMemo } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import MyContext from "../ContextApi/MyContext";
import NpiSelectionTable from "./NpiSelectionTable";
import W9FromSubmission from "./W9FromSubmission";

const ProviderSettings = ({ isOpen, onClose }) => {
  const { api, providerNumbers, updateProviderNumbers, activeProvider, switchProvider } =
    useContext(MyContext);

  // New provider form
  const [newProviderNo, setNewProviderNo] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // Actions
  const [actionLoading, setActionLoading] = useState(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(null);
  const [showW9Upload, setShowW9Upload] = useState(false);
  const [w9SelectedProvider, setW9SelectedProvider] = useState(null);

  // Expanded Tax IDs and their DB2 data
  const [expandedTaxIds, setExpandedTaxIds] = useState([]);
  const [taxIdDb2Data, setTaxIdDb2Data] = useState({});

  const authToken = localStorage.getItem("authToken");
  const headers = { Authorization: `Token ${authToken}` };
  const userData = JSON.parse(localStorage.getItem("user"));

  const approvedProviders = providerNumbers.filter((p) => p.status === "approved");

  // Group all providers by Tax ID
  const grouped = useMemo(() => {
    const raw = {};
    for (const pn of providerNumbers) {
      const key = (pn.provider_no || "").trim();
      if (!raw[key]) raw[key] = [];
      raw[key].push(pn);
    }
    const map = {};
    for (const key of Object.keys(raw)) {
      const entries = raw[key];
      const withNpi = entries.filter((p) => p.npi && p.npi.trim());
      map[key] = withNpi.length > 0 ? withNpi : entries;
    }
    return map;
  }, [providerNumbers]);

  const taxIds = Object.keys(grouped);

  const [refreshing, setRefreshing] = useState(false);

  const refreshProviders = async () => {
    setRefreshing(true);
    try {
      const res = await axios.get(`${api}/auth/providers/`, { headers });
      updateProviderNumbers(res.data);
      toast.success("Providers refreshed.");
    } catch {
      toast.error("Failed to refresh providers.");
    } finally {
      setRefreshing(false);
    }
  };

  // Re-fetch provider list and auto-expand all when modal opens
  useEffect(() => {
    if (isOpen && authToken) {
      axios
        .get(`${api}/auth/providers/`, { headers })
        .then((res) => updateProviderNumbers(res.data))
        .catch(() => {});
    }
  }, [isOpen]);

  // Auto-expand all Tax IDs and fetch DB2 data for approved ones
  useEffect(() => {
    if (isOpen && taxIds.length > 0) {
      setExpandedTaxIds(taxIds);
      taxIds.forEach((taxId) => {
        const pns = grouped[taxId] || [];
        const hasApproved = pns.some((p) => p.status === "approved");
        if (hasApproved) fetchDb2NpisForTaxId(taxId);
      });
    }
  }, [isOpen, providerNumbers]);

  // Fetch DB2 NPIs for a Tax ID
  const fetchDb2NpisForTaxId = async (taxId) => {
    setTaxIdDb2Data((prev) => ({
      ...prev,
      [taxId]: { npis: prev[taxId]?.npis || [], loading: true },
    }));
    try {
      const response = await axios.get(`${api}/list_npis_for_taxid/`, {
        params: { provider_no: taxId, user_id: userData?.id },
      });
      setTaxIdDb2Data((prev) => ({
        ...prev,
        [taxId]: { npis: response.data?.npis || [], loading: false },
      }));
    } catch {
      setTaxIdDb2Data((prev) => ({
        ...prev,
        [taxId]: { npis: [], loading: false },
      }));
    }
  };

  const toggleTaxId = (taxId) => {
    setExpandedTaxIds((prev) => {
      if (prev.includes(taxId)) return prev.filter((t) => t !== taxId);
      const pns = grouped[taxId] || [];
      if (pns.some((p) => p.status === "approved")) fetchDb2NpisForTaxId(taxId);
      return [...prev, taxId];
    });
  };

  // Add NPI to existing Tax ID
  const handleAddNpiToTaxId = async (taxId, npi, sequenceNumber) => {
    setIsAdding(true);
    try {
      await axios.post(
        `${api}/auth/providers/add/`,
        { provider_no: taxId, npi, provider_sequence: sequenceNumber || "" },
        { headers }
      );
      const listRes = await axios.get(`${api}/auth/providers/`, { headers });
      updateProviderNumbers(listRes.data);
      toast.success("NPI added successfully! Pending admin approval.");
      await fetchDb2NpisForTaxId(taxId);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to add NPI. Please try again.");
      throw error;
    } finally {
      setIsAdding(false);
    }
  };

  // Validate Tax ID + submit for admin approval
  const handleAddProvider = async () => {
    if (!newProviderNo.trim()) {
      toast.error("Please enter a Tax ID.");
      return;
    }
    setIsValidating(true);
    try {
      const validateRes = await axios.get(`${api}/check_provno_exists_for_login/`, {
        params: { provider_no: newProviderNo },
      });
      if (!validateRes.data.is_exist) {
        toast.error("Tax ID not found. Please verify and try again.");
        setIsValidating(false);
        return;
      }

      // Tax ID is valid — submit for admin approval (no NPI at this stage)
      await axios.post(
        `${api}/auth/providers/add/`,
        { provider_no: newProviderNo, npi: "" },
        { headers }
      );
      const listRes = await axios.get(`${api}/auth/providers/`, { headers });
      updateProviderNumbers(listRes.data);
      toast.success("Tax ID submitted successfully! Pending admin approval.");
      setNewProviderNo("");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to add Tax ID. Please try again.");
    } finally {
      setIsValidating(false);
    }
  };

  // Set Primary at Tax ID level
  const handleSetPrimary = async (taxId) => {
    const pns = grouped[taxId] || [];
    const target =
      pns.find((p) => p.status === "approved" && p.npi && p.npi.trim()) ||
      pns.find((p) => p.status === "approved");
    if (!target) {
      toast.error("No approved provider available to set as primary.");
      return;
    }
    setActionLoading(taxId);
    try {
      await axios.post(`${api}/auth/providers/${target.id}/set-primary/`, {}, { headers });
      const listRes = await axios.get(`${api}/auth/providers/`, { headers });
      updateProviderNumbers(listRes.data);
      const newPrimary = listRes.data.find((p) => p.is_primary);
      if (newPrimary) switchProvider(newPrimary);
      toast.success("Primary Tax ID updated successfully!");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to set primary Tax ID.");
    } finally {
      setActionLoading(null);
    }
  };

  // Remove Tax ID (all PNs under it)
  const openRemoveConfirm = (taxId) => {
    const pns = grouped[taxId] || [];
    const hasApproved = pns.some((p) => p.status === "approved");
    const otherApproved = approvedProviders.filter(
      (p) => (p.provider_no || "").trim() !== taxId
    );
    if (hasApproved && otherApproved.length === 0) {
      toast.error("Cannot remove your only active Tax ID.");
      return;
    }
    setShowRemoveConfirm(taxId);
  };

  const handleRemoveTaxId = async () => {
    const taxId = showRemoveConfirm;
    setShowRemoveConfirm(null);
    const pns = grouped[taxId] || [];

    setActionLoading(taxId);
    try {
      for (const pn of pns) {
        await axios.delete(`${api}/auth/providers/${pn.id}/remove/`, { headers });
      }
      const listRes = await axios.get(`${api}/auth/providers/`, { headers });
      updateProviderNumbers(listRes.data);
      toast.success("Tax ID removed successfully.");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to remove Tax ID. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
      <div className="bg-white rounded-xl w-full max-w-4xl mx-4 shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#0486A5] px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-lg font-semibold">Manage Providers</h3>
            <p className="text-sm text-white/80 mt-0.5">
              Manage your Tax IDs and NPI entries
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={refreshProviders}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white/80 hover:text-white border border-white/30 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg
                className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white text-2xl leading-none"
            >
              &times;
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {/* Existing Tax IDs */}
          {taxIds.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">
              No providers registered yet. Add one below.
            </div>
          )}

          {taxIds.map((taxId) => {
            const pns = grouped[taxId];
            const isExpanded = expandedTaxIds.includes(taxId);
            const hasPrimary = pns.some((p) => p.is_primary);
            const allPending = pns.every((p) => p.status === "pending");
            const allDeclined = pns.every((p) => p.status === "declined");
            const db2Data = taxIdDb2Data[taxId] || { npis: [], loading: false };

            return (
              <div
                key={taxId}
                className={`rounded-lg border overflow-hidden ${
                  allDeclined
                    ? "border-red-300"
                    : allPending
                    ? "border-yellow-300"
                    : hasPrimary
                    ? "border-[#0486A5]/30"
                    : "border-gray-200"
                }`}
              >
                {/* Tax ID header */}
                <div
                  className={`flex items-center justify-between px-4 py-3 ${
                    allDeclined
                      ? "bg-red-50"
                      : allPending
                      ? "bg-yellow-50"
                      : "bg-gray-50"
                  }`}
                >
                  <button
                    onClick={() => toggleTaxId(taxId)}
                    className="flex items-center gap-2 flex-1 text-left"
                  >
                    <svg
                      className={`w-3.5 h-3.5 text-gray-400 transition-transform ${
                        isExpanded ? "rotate-90" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                    <span className="font-semibold text-sm text-gray-800">
                      Tax ID: {taxId}
                    </span>
                    {hasPrimary && (
                      <span className="text-[10px] bg-[#0486A5] text-white px-1.5 py-0.5 rounded-full">
                        Primary
                      </span>
                    )}
                    {allPending && (
                      <span className="text-[10px] bg-yellow-500 text-white px-1.5 py-0.5 rounded-full">
                        Pending Approval
                      </span>
                    )}
                    {allDeclined && (
                      <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                        Declined
                      </span>
                    )}
                  </button>
                  <div className="flex items-center gap-3">
                    {!hasPrimary && pns.some((p) => p.status === "approved") && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetPrimary(taxId);
                        }}
                        disabled={actionLoading === taxId}
                        className="text-xs text-[#0486A5] hover:underline disabled:opacity-50"
                      >
                        Set Primary
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openRemoveConfirm(taxId);
                      }}
                      disabled={actionLoading === taxId}
                      className="text-xs text-red-400 hover:text-red-600 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="p-3 bg-white">
                    {allPending ? (
                      <div className="text-center py-4 text-sm text-yellow-600">
                        Waiting for admin approval. NPI entries will be available after approval.
                      </div>
                    ) : allDeclined ? (
                      <div className="text-center py-4 text-sm text-red-500">
                        This Tax ID was declined by admin. Please contact support or try a different Tax ID.
                      </div>
                    ) : (
                      <NpiSelectionTable
                        npis={db2Data.npis}
                        selectedNpi={null}
                        onSelectionChange={() => {}}
                        onAddNpi={(npi, seq) => handleAddNpiToTaxId(taxId, npi, seq)}
                        onUploadW9={(npi) => {
                          const target = pns.find(
                            (p) => p.status === "approved" && p.npi === npi
                          ) || pns.find((p) => p.status === "approved");
                          if (target) {
                            setW9SelectedProvider(target);
                            setShowW9Upload(true);
                          }
                        }}
                        addingNpi={isAdding}
                        loading={db2Data.loading}
                        alreadyRegisteredNpis={pns.map((p) => p.npi).filter(Boolean)}
                        compact
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Add New Tax ID */}
          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#0486A5] text-white text-[10px] flex items-center justify-center font-bold">
                +
              </span>
              Add New Tax ID
            </h4>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={newProviderNo}
                onChange={(e) => setNewProviderNo(e.target.value)}
                placeholder="Enter Tax ID"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0486A5]"
              />
              <button
                onClick={handleAddProvider}
                disabled={isValidating || !newProviderNo.trim()}
                className="bg-[#0486A5] hover:bg-[#047B95] text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50 whitespace-nowrap"
              >
                {isValidating ? "Submitting..." : "Add"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Remove Confirmation Modal */}
      {showRemoveConfirm && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[60]">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl mx-4">
            <h2 className="text-base font-bold mb-2 text-gray-800">
              Remove Tax ID
            </h2>
            <p className="text-sm text-gray-600 mb-5">
              Are you sure you want to remove Tax ID{" "}
              <strong>{showRemoveConfirm}</strong> and all associated NPI
              entries? This cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowRemoveConfirm(null)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveTaxId}
                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 text-sm"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* W9 Upload Modal */}
      <W9FromSubmission
        showW9Form={showW9Upload}
        setShowW9Form={(val) => {
          setShowW9Upload(val);
          if (!val) {
            // Re-fetch providers to update W9 status after modal closes
            axios
              .get(`${api}/auth/providers/`, { headers })
              .then((res) => updateProviderNumbers(res.data))
              .catch(() => {});
          }
        }}
        selectedProvider={w9SelectedProvider}
      />
    </div>
  );
};

export default ProviderSettings;
