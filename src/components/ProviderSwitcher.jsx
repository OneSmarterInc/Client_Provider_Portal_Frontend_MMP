import React, { useContext, useState, useRef, useEffect, useMemo } from "react";
import MyContext from "../ContextApi/MyContext";

const ProviderSwitcher = () => {
  const { activeProvider, approvedProviders: ctxApprovedProviders, switchProvider } = useContext(MyContext);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const approvedProviders = ctxApprovedProviders || [];

  const isW9Ready = (pn) =>
    pn.w9_status === "approved" || pn.w9_status === "W9_form_uploaded";

  // Get unique Tax IDs from approved providers
  const taxIds = useMemo(() => {
    const seen = new Set();
    const ids = [];
    for (const pn of approvedProviders) {
      const key = (pn.provider_no || "").trim();
      if (key && !seen.has(key)) {
        seen.add(key);
        ids.push(key);
      }
    }
    return ids;
  }, [approvedProviders]);

  // Check if a Tax ID has W9 for at least one entry
  const taxIdHasW9 = (taxId) =>
    approvedProviders.some(
      (p) => (p.provider_no || "").trim() === taxId && isW9Ready(p)
    );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const activeTaxId = (activeProvider?.provider_no || "").trim();

  // Don't render dropdown if user has only 1 Tax ID
  if (taxIds.length <= 1) {
    return activeTaxId ? (
      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
        Tax ID: {activeTaxId}
      </span>
    ) : null;
  }

  const handleSwitchTaxId = (taxId) => {
    // Pick the first approved provider under this Tax ID
    const provider = approvedProviders.find(
      (p) => (p.provider_no || "").trim() === taxId
    );
    if (provider) {
      switchProvider(provider);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded border border-gray-300 transition-colors"
      >
        <span className="font-medium text-[#0486A5]">
          Tax ID: {activeTaxId || "Select"}
        </span>
        <svg
          className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 shadow-lg rounded-md z-50">
          <div className="px-3 py-1.5 text-xs text-gray-400 uppercase font-medium border-b">
            Switch Tax ID
          </div>
          <div className="py-1 max-h-64 overflow-y-auto">
            {taxIds.map((taxId) => {
              const isActive = taxId === activeTaxId;
              const hasW9 = taxIdHasW9(taxId);
              const hasPrimary = approvedProviders.some(
                (p) => (p.provider_no || "").trim() === taxId && p.is_primary
              );
              return (
                <button
                  key={taxId}
                  onClick={() => {
                    if (hasW9) handleSwitchTaxId(taxId);
                  }}
                  title={!hasW9 ? "No W9 form uploaded. Upload W9 from Manage Providers." : ""}
                  className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between ${
                    !hasW9
                      ? "text-gray-400 bg-gray-50 cursor-not-allowed"
                      : isActive
                      ? "bg-blue-50 text-[#0486A5]"
                      : "text-gray-700 hover:bg-gray-50 cursor-pointer"
                  }`}
                >
                  <span>{taxId}</span>
                  <span className="flex items-center gap-1">
                    {!hasW9 && (
                      <span className="text-[10px] bg-orange-400 text-white px-1.5 py-0.5 rounded-full">
                        No W9
                      </span>
                    )}
                    {hasPrimary && (
                      <span className="text-[10px] bg-[#0486A5] text-white px-1.5 py-0.5 rounded-full">
                        Primary
                      </span>
                    )}
                    {hasW9 && isActive && (
                      <svg className="w-4 h-4 text-[#0486A5]" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProviderSwitcher;
