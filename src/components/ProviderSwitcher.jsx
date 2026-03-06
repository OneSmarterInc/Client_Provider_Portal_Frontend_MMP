import React, { useContext } from "react";
import MyContext from "../ContextApi/MyContext";

const ProviderSwitcher = () => {
  const { activeProvider } = useContext(MyContext);

  const activeTaxId = (activeProvider?.provider_no || "").trim();

  return activeTaxId ? (
    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
      Tax ID: {activeTaxId}
    </span>
  ) : null;
};

export default ProviderSwitcher;
