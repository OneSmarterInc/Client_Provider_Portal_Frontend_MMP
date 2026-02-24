import React, { useContext, useState, useRef, useEffect } from "react";
import MyContext from "../ContextApi/MyContext";

const ProviderSwitcher = () => {
  const { activeProvider, w9ApprovedProviders, switchProvider } = useContext(MyContext);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Only show providers with W9 approved/uploaded in the switcher
  const approvedProviders = w9ApprovedProviders || [];

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

  // Don't render dropdown if user has 0 or 1 approved provider
  if (!approvedProviders || approvedProviders.length <= 1) {
    return activeProvider ? (
      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
        {activeProvider.provider_no}
      </span>
    ) : null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded border border-gray-300 transition-colors"
      >
        <span className="font-medium text-[#0486A5]">
          {activeProvider?.provider_no || "Select Provider"}
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
          <div className="py-1">
            <div className="px-3 py-1 text-xs text-gray-400 uppercase font-medium border-b">
              Switch Provider
            </div>
            {approvedProviders.map((pn) => (
              <button
                key={pn.id}
                onClick={() => {
                  switchProvider(pn);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${
                  activeProvider?.id === pn.id ? "bg-blue-50 text-[#0486A5]" : "text-gray-700"
                }`}
              >
                <span>{pn.provider_no}</span>
                <span className="flex items-center gap-1">
                  {pn.is_primary && (
                    <span className="text-[10px] bg-[#0486A5] text-white px-1.5 py-0.5 rounded-full">
                      Primary
                    </span>
                  )}
                  {activeProvider?.id === pn.id && (
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
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProviderSwitcher;
