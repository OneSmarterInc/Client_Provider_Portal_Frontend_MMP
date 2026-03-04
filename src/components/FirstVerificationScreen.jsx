import React, { useContext, useEffect, useState, useCallback, useMemo } from "react";
import backgroundImage from "../assets/image.png";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { Loader2 } from "lucide-react";
import MyContext from "../ContextApi/MyContext";
import W9FromSubmission from "./W9FromSubmission";
import NpiSelectionTable from "./NpiSelectionTable";

const FirstVerificationScreen = () => {
  const navigate = useNavigate();
  const { api, activeProvider, approvedProviders, fetchProviders } = useContext(MyContext);
  const [showW9Form, setShowW9Form] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [selectedTaxId, setSelectedTaxId] = useState(null);
  const [db2Npis, setDb2Npis] = useState([]);
  const [db2NpisLoading, setDb2NpisLoading] = useState(true);
  const [addNpiLoading, setAddNpiLoading] = useState(false);
  const [addNpiSelectedNpi, setAddNpiSelectedNpi] = useState(null);
  const userData = JSON.parse(localStorage.getItem("user"));
  const verificationShown = localStorage.getItem("verificationShown");

  // Group approved providers by Tax ID, filtering out empty-NPI entries when real NPIs exist
  const grouped = useMemo(() => {
    if (!approvedProviders) return {};
    const raw = {};
    for (const pn of approvedProviders) {
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
  }, [approvedProviders]);

  const taxIds = Object.keys(grouped);

  // Initialize selectedTaxId and selectedProvider
  useEffect(() => {
    if (taxIds.length > 0 && !selectedTaxId) {
      const activeTaxId = activeProvider ? (activeProvider.provider_no || "").trim() : null;
      const initialTaxId = activeTaxId && grouped[activeTaxId] ? activeTaxId : taxIds[0];
      setSelectedTaxId(initialTaxId);
      const npis = grouped[initialTaxId] || [];
      const initial = npis.find((p) => p.id === activeProvider?.id) || npis[0];
      if (initial) setSelectedProvider(initial);
    }
  }, [approvedProviders, activeProvider]);

  const currentProviderNo = selectedProvider?.provider_no || activeProvider?.provider_no || userData?.provider_no;

  const handleDetails = () => {
    localStorage.setItem("verificationShown", "true");
    navigate("/members");
  };

  const location = useLocation();

  // Fetch NPIs from DB2 for the selected provider's Tax ID
  const fetchNpisFromDb2 = useCallback(async () => {
    if (!currentProviderNo) return;
    setDb2NpisLoading(true);
    try {
      const response = await axios.get(`${api}/list_npis_for_taxid/`, {
        params: { provider_no: currentProviderNo, user_id: userData?.id },
      });
      if (response.data?.npis) {
        setDb2Npis(response.data.npis);
      }
    } catch (error) {
      console.log("Failed to fetch NPIs from DB2", error);
    } finally {
      setDb2NpisLoading(false);
    }
  }, [api, currentProviderNo, userData?.id]);

  useEffect(() => {
    if (selectedProvider) {
      fetchNpisFromDb2();
    }
  }, [selectedProvider, fetchNpisFromDb2]);

  // Derive W9 status from db2Npis — if ANY entry has W9 uploaded, user can proceed
  const isW9Approved = db2Npis.some((e) => e.w9_status === "W9_form_uploaded");
  const isW9InProgress = !isW9Approved && db2Npis.some((e) => e.w9_status === "W9_in_progress");

  useEffect(() => {
    if (!userData) {
      toast.error("Please login first.");
      navigate("/login");
    } else if (location.pathname === "/members") {
      navigate("/members");
    } else if (verificationShown && isW9Approved) {
      navigate("/members");
    }
  }, [userData, verificationShown, navigate, isW9Approved]);

  // Re-fetch NPIs when W9 modal is closed (to pick up new W9 submissions)
  useEffect(() => {
    if (!showW9Form && selectedProvider) {
      fetchNpisFromDb2();
    }
  }, [showW9Form]);

  // Auto-poll every 30 seconds when any W9 is in_progress
  useEffect(() => {
    if (isW9InProgress) {
      const interval = setInterval(() => {
        fetchNpisFromDb2();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [isW9InProgress, fetchNpisFromDb2]);

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

  const handleTaxIdChange = (e) => {
    const taxId = e.target.value;
    setSelectedTaxId(taxId);
    const npis = grouped[taxId] || [];
    if (npis.length > 0) {
      setSelectedProvider(npis[0]);
    }
  };

  // NPIs for the currently selected Tax ID
  const npisForSelectedTaxId = selectedTaxId ? (grouped[selectedTaxId] || []) : [];

  const authToken = localStorage.getItem("authToken");

  const handleAddNpiToProvider = async (npi, sequenceNumber) => {
    if (!npi || !npi.trim()) {
      toast.error("Please enter a valid NPI number.");
      throw new Error("Invalid NPI");
    }
    const taxId = currentProviderNo;
    if (!taxId) throw new Error("No Tax ID");

    setAddNpiLoading(true);
    try {
      await axios.post(
        `${api}/auth/providers/add/`,
        { provider_no: taxId, npi: npi.trim(), provider_sequence: sequenceNumber || "" },
        { headers: { Authorization: `Token ${authToken}` } }
      );
      toast.success("NPI added successfully! Pending admin approval.");
      setAddNpiSelectedNpi(null);
      await fetchProviders();
      await fetchNpisFromDb2();
    } catch (error) {
      if (error.response) {
        toast.error(error.response.data?.error || "Failed to add NPI. Please try again.");
      }
      throw error;
    } finally {
      setAddNpiLoading(false);
    }
  };

  return (
    <div
      style={divStyle}
      className="min-h-screen flex justify-center items-start py-8 px-4"
    >
      {db2NpisLoading && db2Npis.length === 0 ? (
        <div className="w-full max-w-3xl bg-white/95 backdrop-blur rounded-xl shadow-lg overflow-hidden">
          <div className="bg-[#0486A5] px-6 py-4 text-white">
            <h1 className="text-lg font-semibold">Provider Account Verification</h1>
            <p className="text-sm text-white/80 mt-0.5">Loading your account details...</p>
          </div>
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-[#0486A5] mb-3" />
            <span className="text-sm text-gray-500">Fetching your provider data...</span>
          </div>
        </div>
      ) : (
      <>
      <div className="w-full max-w-3xl bg-white/95 backdrop-blur rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-[#0486A5] px-6 py-4 text-white">
          <h1 className="text-lg font-semibold">Provider Account Verification</h1>
          <p className="text-sm text-white/80 mt-0.5">Complete the steps below to activate your account</p>
        </div>

        {/* User info bar */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
          <span className="font-medium text-gray-800">
            {firstName.charAt(0).toUpperCase() + firstName.slice(1)}
            {lastName ? ` ${lastName.charAt(0).toUpperCase() + lastName.slice(1)}` : ""}
          </span>
          <span className="text-gray-500">{userData.email}</span>
          <span className="text-gray-400">|</span>
          {taxIds.length > 1 ? (
            <select
              value={selectedTaxId || ""}
              onChange={handleTaxIdChange}
              className="border border-gray-300 rounded px-2 py-0.5 text-sm text-[#0486A5] font-medium bg-white focus:outline-none focus:ring-1 focus:ring-[#0486A5]"
            >
              {taxIds.map((taxId) => {
                const hasPrimary = grouped[taxId].some((p) => p.is_primary);
                return (
                  <option key={taxId} value={taxId}>
                    Tax ID: {taxId}{hasPrimary ? " (Primary)" : ""}
                  </option>
                );
              })}
            </select>
          ) : (
            <span className="text-gray-600">Tax ID: <span className="text-[#0486A5] font-medium">{currentProviderNo || "N/A"}</span></span>
          )}
        </div>

        {/* Main content */}
        <div className="px-6 py-5 space-y-5">

          {/* Section 1: NPI Entries */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-[#0486A5] text-white text-xs flex items-center justify-center font-semibold">1</div>
              <h2 className="text-sm font-semibold text-gray-800">NPI Entries for Your Tax ID</h2>
              {db2Npis.length > 0 && (
                <span className="text-xs text-gray-400 ml-1">({db2Npis.length} entries)</span>
              )}
            </div>
            <NpiSelectionTable
              npis={db2Npis}
              selectedNpi={addNpiSelectedNpi}
              onSelectionChange={setAddNpiSelectedNpi}
              onAddNpi={handleAddNpiToProvider}
              loading={db2NpisLoading}
              addingNpi={addNpiLoading}
              alreadyRegisteredNpis={npisForSelectedTaxId.map((p) => p.npi).filter(Boolean)}
            />
          </div>

          {/* Section 2: W9 Status */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-[#0486A5] text-white text-xs flex items-center justify-center font-semibold">2</div>
              <h2 className="text-sm font-semibold text-gray-800">W9 Form</h2>
            </div>
            <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
              <div>
                {isW9Approved ? (
                  <>
                    <span className="text-sm font-medium text-green-600">W9 Form Uploaded</span>
                    <span className="text-xs text-gray-500 ml-2">Your W9 form is on file.</span>
                  </>
                ) : isW9InProgress ? (
                  <>
                    <span className="text-sm font-medium text-yellow-600">In Review</span>
                    <span className="text-xs text-gray-500 ml-2">Your W9 form is under review.</span>
                  </>
                ) : (
                  <>
                    <span className="text-sm font-medium text-gray-500">Not Submitted</span>
                    <span className="text-xs text-gray-500 ml-2">Upload your W9 form to get started.</span>
                  </>
                )}
              </div>
              <div>
                {isW9Approved ? (
                  <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Complete</span>
                ) : isW9InProgress ? (
                  <button
                    onClick={fetchNpisFromDb2}
                    disabled={db2NpisLoading}
                    className="text-xs text-[#0486A5] hover:underline disabled:opacity-50"
                  >
                    {db2NpisLoading ? "Checking..." : "Refresh Status"}
                  </button>
                ) : (
                  <button
                    onClick={() => setShowW9Form(true)}
                    className="text-xs bg-[#0486A5] hover:bg-[#047B95] text-white px-3 py-1.5 rounded font-medium"
                  >
                    Upload W9
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer action */}
        <div className="px-6 pb-5">
          {isW9Approved ? (
            <button
              onClick={handleDetails}
              className="w-full py-2.5 rounded-lg bg-[#0486A5] hover:bg-[#047B95] text-white text-sm font-semibold transition-colors"
            >
              Confirm Account Details
            </button>
          ) : isW9InProgress ? (
            <div className="w-full text-center py-2.5 rounded-lg bg-yellow-100 text-yellow-700 text-sm font-medium">
              W9 approval pending — please wait for admin review
            </div>
          ) : (
            <div className="w-full text-center py-2.5 rounded-lg bg-gray-200 text-gray-500 text-sm font-medium">
              Upload W9 form to continue
            </div>
          )}
        </div>
      </div>

      {/* W9 Upload Modal */}
      <W9FromSubmission showW9Form={showW9Form} setShowW9Form={setShowW9Form} skipDb2Check={true} selectedProvider={selectedProvider} />
      </>
      )}
    </div>
  );
};

export default FirstVerificationScreen;
