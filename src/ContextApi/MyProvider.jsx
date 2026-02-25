import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import axios from "axios";
import MyContext from "./MyContext";

const MyProvider = ({ children }) => {
  // const api = "http://127.0.0.1:8000/provider";
  // const api = "http://170.249.90.216:3181/provider";
  const api = "https://forms.mmpplans.com/provider";

  const [isEOBOpen, setIsEOBOpen] = useState();

  // Provider numbers state
  const [providerNumbers, setProviderNumbers] = useState([]);
  const [activeProvider, setActiveProvider] = useState(null);
  const initializedRef = useRef(false);

  // Initialize from localStorage on mount
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      const pns = user.provider_numbers || [];
      setProviderNumbers(pns);

      // Restore active provider from localStorage or default to primary
      const savedActiveId = user.active_provider_id;
      const savedActive = pns.find((p) => p.id === savedActiveId);
      if (savedActive) {
        setActiveProvider(savedActive);
      } else {
        const primary = pns.find((p) => p.is_primary) || pns[0] || null;
        setActiveProvider(primary);
      }
    }
    initializedRef.current = true;
  }, []);

  // Fetch latest provider list from API (enriched with DB2 data)
  const fetchProviders = useCallback(async () => {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) return;

    try {
      const res = await axios.get(`${api}/auth/providers/`, {
        headers: { Authorization: `Token ${authToken}` },
      });
      const newList = res.data;
      setProviderNumbers(newList);

      // Update localStorage
      const user = JSON.parse(localStorage.getItem("user"));
      if (user) {
        user.provider_numbers = newList;
        localStorage.setItem("user", JSON.stringify(user));
      }

      // Update active provider if needed
      const approved = newList.filter((p) => p.status === "approved");
      setActiveProvider((prev) => {
        if (prev && approved.find((p) => p.id === prev.id)) return prev;
        return approved.find((p) => p.is_primary) || approved[0] || null;
      });
    } catch {
      // silently fail
    }
  }, [api]);

  // Fetch on mount if already logged in
  useEffect(() => {
    if (initializedRef.current) {
      fetchProviders();
    }
  }, [fetchProviders]);

  // Derived state: only approved providers
  const approvedProviders = useMemo(
    () => providerNumbers.filter((p) => p.status === "approved"),
    [providerNumbers]
  );

  // Derived state: only providers with W9 approved/uploaded
  const w9ApprovedProviders = useMemo(
    () => approvedProviders.filter((p) => p.w9_status === "approved" || p.w9_status === "W9_form_uploaded"),
    [approvedProviders]
  );

  const switchProvider = useCallback(
    (providerObj) => {
      // Only allow switching to approved providers
      if (providerObj && providerObj.status && providerObj.status !== "approved") {
        return;
      }
      setActiveProvider(providerObj);
      // Persist to localStorage
      const user = JSON.parse(localStorage.getItem("user"));
      if (user) {
        user.active_provider_no = providerObj?.provider_no || "";
        user.active_provider_id = providerObj?.id || null;
        localStorage.setItem("user", JSON.stringify(user));
      }
    },
    []
  );

  const updateProviderNumbers = useCallback(
    (newList) => {
      setProviderNumbers(newList);
      // Update localStorage
      const user = JSON.parse(localStorage.getItem("user"));
      if (user) {
        user.provider_numbers = newList;
        localStorage.setItem("user", JSON.stringify(user));
      }
      // If active provider was removed or is no longer approved, switch to an approved primary
      const approved = newList.filter((p) => p.status === "approved");
      if (activeProvider && !approved.find((p) => p.id === activeProvider.id)) {
        const primary = approved.find((p) => p.is_primary) || approved[0] || null;
        switchProvider(primary);
      }
    },
    [activeProvider, switchProvider]
  );

  return (
    <MyContext.Provider
      value={{
        api,
        isEOBOpen,
        setIsEOBOpen,
        activeProvider,
        providerNumbers,
        approvedProviders,
        w9ApprovedProviders,
        switchProvider,
        updateProviderNumbers,
        fetchProviders,
      }}
    >
      {children}
    </MyContext.Provider>
  );
};
export default MyProvider;
