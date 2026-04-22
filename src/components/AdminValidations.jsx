import React, { useState, useEffect, useContext, useMemo } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import backgroundImage from "../assets/image.webp";
import { useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Pencil, Trash2, Download, Loader2, Eye } from "lucide-react";
import MyContext from "../ContextApi/MyContext";
import DeclineRemarkModal from "./DeclineRemarkModal";
import AdminPasswordResetModal from "./AdminPasswordResetModal";
import AdminClaimSearch from "./AdminClaimSearch";
import mmplogo from "../assets/mmplogo.jpg";


const AdminValidations = () => {
  const { api } = useContext(MyContext);
  const navigate = useNavigate();
  const admin_token = localStorage.getItem("authToken");
  const admin = JSON.parse(localStorage.getItem("user"));

  // --- Tab state ---
  const [mainTab, setMainTab] = useState("providers"); // "providers" | "w9" | "accounts" | "guests" | "claims"
  const [subTab, setSubTab] = useState("pending"); // "pending" | "history"

  const handleMainTabChange = (tab) => {
    setMainTab(tab);
    setSubTab("pending");
  };

  // --- W9 state ---
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({
    approve: null,
    decline: null,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "", direction: "asc" });
  const [isDeclineRemarkModalOpen, setIsDeclineRemarkModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [IsPasswordResetModalOpen, setIsPasswordResetModalOpen] = useState(false);
  const [userEmail, setuserEmail] = useState("");

  // --- Provider number requests state ---
  const [providerRequests, setProviderRequests] = useState([]);
  const [providerRequestsLoading, setProviderRequestsLoading] = useState(false);
  const [providerActionLoading, setProviderActionLoading] = useState({ approve: null, decline: null });
  const [isProviderDeclineModalOpen, setIsProviderDeclineModalOpen] = useState(false);
  const [selectedProviderRequest, setSelectedProviderRequest] = useState(null);

  // --- New provider registration state ---
  const [newProviderRequests, setNewProviderRequests] = useState([]);
  const [newProviderLoading, setNewProviderLoading] = useState(false);
  const [newProviderActionLoading, setNewProviderActionLoading] = useState({ approve: null, decline: null });
  const [showNewProviderApproveModal, setShowNewProviderApproveModal] = useState(false);
  const [selectedNewProviderApproveId, setSelectedNewProviderApproveId] = useState(null);
  const [showNewProviderDeclineModal, setShowNewProviderDeclineModal] = useState(false);
  const [selectedNewProviderDeclineId, setSelectedNewProviderDeclineId] = useState(null);
  const [newProviderDeclineRemark, setNewProviderDeclineRemark] = useState("");

  // --- User registration (unapproved accounts) state ---
  const [userRegistrations, setUserRegistrations] = useState([]);
  const [userRegLoading, setUserRegLoading] = useState(false);
  const [userRegActionLoading, setUserRegActionLoading] = useState({ approve: null, decline: null });
  const [showUserRegApproveModal, setShowUserRegApproveModal] = useState(false);
  const [selectedUserRegApproveId, setSelectedUserRegApproveId] = useState(null);
  const [showUserRegDeclineModal, setShowUserRegDeclineModal] = useState(false);
  const [selectedUserRegDeclineId, setSelectedUserRegDeclineId] = useState(null);
  const [userRegDeclineRemark, setUserRegDeclineRemark] = useState("");

  // --- Account management state ---
  const [allUsers, setAllUsers] = useState([]);
  const [allUsersLoading, setAllUsersLoading] = useState(false);
  const [accountSearchQuery, setAccountSearchQuery] = useState("");
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [editUserName, setEditUserName] = useState("");
  const [editUserEmail, setEditUserEmail] = useState("");
  const [editUserPhone, setEditUserPhone] = useState("");
  const [editUserPassword, setEditUserPassword] = useState("");
  const [editUserLoading, setEditUserLoading] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [showRemoveAccountModal, setShowRemoveAccountModal] = useState(false);
  const [removeAccountUser, setRemoveAccountUser] = useState(null);
  const [removeAccountLoading, setRemoveAccountLoading] = useState(false);

  // --- Guest management state ---
  const [guestList, setGuestList] = useState([]);
  const [guestLoading, setGuestLoading] = useState(false);
  const [guestForm, setGuestForm] = useState({ email: "", name: "", phone_no: "", password: "", role: "guest" });
  const [guestCreateLoading, setGuestCreateLoading] = useState(false);
  const [guestDeleteLoading, setGuestDeleteLoading] = useState(null);
  const [showGuestDeleteModal, setShowGuestDeleteModal] = useState(false);
  const [guestDeleteTarget, setGuestDeleteTarget] = useState(null);

  const [claimSearchTaxId, setClaimSearchTaxId] = useState({ taxId: "", ts: 0 });

  const handleTaxIdClick = (taxId) => {
    setClaimSearchTaxId({ taxId, ts: Date.now() });
    setMainTab("claims");
    setSubTab("pending");
  };

  const isGuest = admin?.is_guest && !admin?.is_admin;
  const isAdmin = admin?.is_admin;

  // --- Merged provider requests for unified pending table ---
  const mergedProviderRequests = useMemo(() => {
    const npiReqs = providerRequests
      .filter((r) => r.status === "pending")
      .map((r) => ({ ...r, _type: "npi_request", _date: r.requested_at }));

    const newRegs = newProviderRequests
      .filter((u) => u.new_provider_status === "pending")
      .map((item) => ({ ...item, _type: "new_registration", _date: item.created_at }));

    const userRegs = userRegistrations
      .filter((u) => !u.is_approved)
      .map((reg) => ({ ...reg, _type: "user_registration", _date: reg.date_joined }));

    return [...npiReqs, ...newRegs, ...userRegs].sort(
      (a, b) => new Date(b._date) - new Date(a._date)
    );
  }, [providerRequests, newProviderRequests, userRegistrations]);

  // --- Fetch W9 users on mount ---
  useEffect(() => {
    fetchAllUsers();
  }, []);

  const fetchAllUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${api}/api/admin/w9-list/`, {
        headers: {
          Authorization: `Token ${admin_token}`,
        },
      });
      if (response.data && Array.isArray(response.data)) {
        setUsers(response.data);
      }
    } catch (error) {
      console.error("Error fetching users", error);
      toast.error("Failed to fetch users. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // --- Fetch provider data when providers tab is active ---
  useEffect(() => {
    if (mainTab === "providers") {
      fetchProviderRequests();
      fetchNewProviderRequests();
      fetchUserRegistrations();
    }
  }, [mainTab]);

  const fetchProviderRequests = async () => {
    try {
      setProviderRequestsLoading(true);
      const response = await axios.get(`${api}/auth/admin/provider-requests/`, {
        headers: { Authorization: `Token ${admin_token}` },
      });
      if (response.data && Array.isArray(response.data)) {
        setProviderRequests(response.data);
      }
    } catch (error) {
      console.error("Error fetching provider requests", error);
      toast.error("Failed to fetch provider requests.");
    } finally {
      setProviderRequestsLoading(false);
    }
  };

  const fetchNewProviderRequests = async () => {
    try {
      setNewProviderLoading(true);
      const res = await fetch(`${api}/new/provider/admin/pending/`, {
        headers: { Authorization: `Token ${admin_token}` },
      });
      const data = await res.json();
      setNewProviderRequests(data?.pending_providers || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch new provider requests.");
    } finally {
      setNewProviderLoading(false);
    }
  };

  // --- User registration fetch & actions ---
  const fetchUserRegistrations = async () => {
    try {
      setUserRegLoading(true);
      const response = await axios.get(`${api}/auth/admin/user-registrations/`, {
        headers: { Authorization: `Token ${admin_token}` },
      });
      if (response.data && Array.isArray(response.data)) {
        setUserRegistrations(response.data);
      }
    } catch (error) {
      console.error("Error fetching user registrations", error);
    } finally {
      setUserRegLoading(false);
    }
  };

  const handleUserRegAction = async (userId, newStatus, remark = "") => {
    try {
      setUserRegActionLoading((prev) => ({
        ...prev,
        [newStatus === "approved" ? "approve" : "decline"]: userId,
      }));
      const response = await axios.post(
        `${api}/auth/admin/user-approve/`,
        { user_id: userId, status: newStatus, decline_remark: remark },
        { headers: { Authorization: `Token ${admin_token}` } }
      );
      if (response.status === 200) {
        toast[newStatus === "approved" ? "success" : "error"](
          response.data?.message || `User ${newStatus} successfully`
        );
        if (response.data.is_email_sent) {
          toast.success(`Email sent to ${response.data.user_email}`);
        }
        fetchUserRegistrations();
      }
    } catch (error) {
      console.error("Error changing user registration status", error);
      toast.error(error.response?.data?.error || `Failed to ${newStatus} user`);
    } finally {
      setUserRegActionLoading({ approve: null, decline: null });
    }
  };

  const openUserRegApproveModal = (id) => {
    setSelectedUserRegApproveId(id);
    setShowUserRegApproveModal(true);
  };
  const confirmUserRegApprove = async () => {
    await handleUserRegAction(selectedUserRegApproveId, "approved");
    setShowUserRegApproveModal(false);
  };
  const openUserRegDeclineModal = (id) => {
    setSelectedUserRegDeclineId(id);
    setUserRegDeclineRemark("");
    setShowUserRegDeclineModal(true);
  };
  const confirmUserRegDecline = async () => {
    await handleUserRegAction(selectedUserRegDeclineId, "declined", userRegDeclineRemark);
    setShowUserRegDeclineModal(false);
  };

  // --- Fetch all user accounts for account management ---
  const fetchAllUserAccounts = async () => {
    try {
      setAllUsersLoading(true);
      const response = await axios.get(`${api}/auth/admin/user-list/`, {
        headers: { Authorization: `Token ${admin_token}` },
      });
      if (response.data && Array.isArray(response.data)) {
        setAllUsers(response.data);
      }
    } catch (error) {
      console.error("Error fetching user accounts", error);
      toast.error("Failed to fetch user accounts.");
    } finally {
      setAllUsersLoading(false);
    }
  };

  useEffect(() => {
    if (mainTab === "accounts") {
      fetchAllUserAccounts();
    }
  }, [mainTab]);

  // --- Guest management functions ---
  const fetchGuestList = async () => {
    try {
      setGuestLoading(true);
      const response = await axios.get(`${api}/auth/admin/guest-list/`, {
        headers: { Authorization: `Token ${admin_token}` },
      });
      if (response.data && Array.isArray(response.data)) {
        setGuestList(response.data);
      }
    } catch (error) {
      console.error("Error fetching guest list", error);
      toast.error("Failed to fetch guest list.");
    } finally {
      setGuestLoading(false);
    }
  };

  const handleCreateGuest = async () => {
    if (!guestForm.email || !guestForm.password) {
      toast.error("Email and password are required.");
      return;
    }
    const isAdmin = guestForm.role === "admin";
    const endpoint = isAdmin ? `${api}/auth/admin/create-admin/` : `${api}/auth/admin/create-guest/`;
    try {
      setGuestCreateLoading(true);
      await axios.post(
        endpoint,
        { email: guestForm.email, name: guestForm.name, phone_no: guestForm.phone_no, password: guestForm.password },
        { headers: { Authorization: `Token ${admin_token}` } }
      );
      toast.success(`${isAdmin ? "Admin" : "Guest"} account created successfully!`);
      setGuestForm({ email: "", name: "", phone_no: "", password: "", role: "guest" });
      fetchGuestList();
    } catch (error) {
      toast.error(error.response?.data?.error || `Failed to create ${isAdmin ? "admin" : "guest"} account.`);
    } finally {
      setGuestCreateLoading(false);
    }
  };

  const handleDeleteGuest = async (userId) => {
    try {
      setGuestDeleteLoading(userId);
      await axios.delete(`${api}/auth/admin/delete-guest/`, {
        headers: { Authorization: `Token ${admin_token}` },
        data: { user_id: userId },
      });
      toast.success("Guest account removed.");
      fetchGuestList();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to remove guest account.");
    } finally {
      setGuestDeleteLoading(null);
    }
  };

  useEffect(() => {
    if (mainTab === "guests") {
      fetchGuestList();
    }
  }, [mainTab]);

  const handleEditUser = async () => {
    const payload = { user_id: editUser.id };
    let hasChanges = false;

    if (editUserName.trim() !== (editUser.name || "")) {
      payload.new_name = editUserName.trim();
      hasChanges = true;
    }
    if (editUserEmail.trim().toLowerCase() !== editUser.email.toLowerCase()) {
      payload.new_email = editUserEmail.trim();
      hasChanges = true;
    }
    if (editUserPhone.trim() !== (editUser.phone_no || "")) {
      payload.new_phone = editUserPhone.trim();
      hasChanges = true;
    }
    if (editUserPassword.trim()) {
      payload.new_password = editUserPassword.trim();
      hasChanges = true;
    }

    if (!hasChanges) {
      toast.error("No changes to save.");
      return;
    }

    try {
      setEditUserLoading(true);
      const response = await axios.put(
        `${api}/auth/admin/edit-user/`,
        payload,
        { headers: { Authorization: `Token ${admin_token}` } }
      );
      if (response.status === 200) {
        toast.success(response.data?.message || "User updated successfully.");
        setShowEditUserModal(false);
        setEditUser(null);
        setEditUserName("");
        setEditUserEmail("");
        setEditUserPhone("");
        setEditUserPassword("");
        setShowEditPassword(false);
        fetchAllUserAccounts();
      }
    } catch (error) {
      console.error("Error editing user", error);
      toast.error(error.response?.data?.error || "Failed to update user.");
    } finally {
      setEditUserLoading(false);
    }
  };

  const handleRemoveAccount = async () => {
    try {
      setRemoveAccountLoading(true);
      const response = await axios.delete(`${api}/auth/admin/remove-account/`, {
        headers: { Authorization: `Token ${admin_token}` },
        data: { user_id: removeAccountUser.id },
      });
      if (response.status === 200) {
        toast.success(response.data?.message || "Account removed successfully.");
        if (response.data.is_email_sent) {
          toast.success("Notification email sent.");
        }
        setShowRemoveAccountModal(false);
        setRemoveAccountUser(null);
        fetchAllUserAccounts();
      }
    } catch (error) {
      console.error("Error removing account", error);
      toast.error(error.response?.data?.error || "Failed to remove account.");
    } finally {
      setRemoveAccountLoading(false);
    }
  };

  // --- W9 actions ---
  const handleStatusChange = async (userId, provider_no, newStatus, remark = "", providerNumberId = null) => {
    try {
      setActionLoading((prev) => ({
        ...prev,
        [newStatus === "approved" ? "approve" : "decline"]: userId,
      }));

      const approvePayload = { user_id: userId, status: newStatus, decline_remark: remark };
      if (providerNumberId) {
        approvePayload.provider_number_id = providerNumberId;
      }

      const response = await axios.post(
        `${api}/api/admin/w9-approve/`,
        approvePayload,
        {
          headers: {
            Authorization: `Token ${admin_token}`,
          },
        }
      );

      if (response.status === 200) {
        toast[newStatus === "approved" ? "success" : "error"](
          response.data?.message || `W9 form ${newStatus} successfully`
        );

        if (response.data.is_email_sent) {
          toast.success(`Email sent to ${response.data.user_email}`);
        }

        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.user_id === userId ? { ...user, status: newStatus } : user
          )
        );
      }
      fetchAllUsers();
    } catch (error) {
      console.error("Error changing status", error);
      toast.error(
        error.response?.data?.message ||
        `Failed to ${newStatus === "approved" ? "approve" : "decline"
        } W9 form`
      );
    } finally {
      setActionLoading({
        approve: null,
        decline: null,
      });
    }
  };

  const handleAddDeclineRemark = (user) => {
    setSelectedUser(user);
    setIsDeclineRemarkModalOpen(true);
  };

  // --- Provider number request actions ---
  const handleProviderStatusChange = async (pnId, newStatus, remark = "") => {
    try {
      setProviderActionLoading((prev) => ({
        ...prev,
        [newStatus === "approved" ? "approve" : "decline"]: pnId,
      }));

      const response = await axios.post(
        `${api}/auth/admin/provider-approve/`,
        { provider_number_id: pnId, status: newStatus, decline_remark: remark },
        { headers: { Authorization: `Token ${admin_token}` } }
      );

      if (response.status === 200) {
        toast[newStatus === "approved" ? "success" : "error"](
          response.data?.message || `Provider ${newStatus} successfully`
        );
        if (response.data.is_email_sent) {
          toast.success(`Email sent to ${response.data.user_email}`);
        }
        fetchProviderRequests();
      }
    } catch (error) {
      console.error("Error changing provider status", error);
      toast.error(error.response?.data?.error || `Failed to ${newStatus} provider`);
    } finally {
      setProviderActionLoading({ approve: null, decline: null });
    }
  };

  // --- New provider registration actions ---
  const getFullAddress = (item) => {
    const parts = [
      item.PRADR1,
      item.PRADR2,
      item.PRADR3,
      item.PRADR4,
      item.PRCITY,
      item.PRST,
      item.PRZIP2,
      item.PRZIP4,
      item.PRZIP5,
    ].filter((part) => part && part.toString().trim() !== "");
    return parts.join(", ");
  };

  const handleNewProviderAction = async (id, type, decline_remark = "") => {
    try {
      setNewProviderActionLoading((prev) => ({ ...prev, [type]: id }));
      const res = await fetch(`${api}/new/provider/admin/approve/${id}/`, {
        method: "POST",
        headers: {
          Authorization: `Token ${admin_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: type, decline_remark }),
      });
      if (res.ok) {
        fetchNewProviderRequests();
      } else {
        console.log(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setNewProviderActionLoading({ approve: null, decline: null });
    }
  };

  const openNewProviderApproveModal = (id) => {
    setSelectedNewProviderApproveId(id);
    setShowNewProviderApproveModal(true);
  };

  const confirmNewProviderApprove = async () => {
    await handleNewProviderAction(selectedNewProviderApproveId, "approved");
    setShowNewProviderApproveModal(false);
  };

  const openNewProviderDeclineModal = (id) => {
    setSelectedNewProviderDeclineId(id);
    setNewProviderDeclineRemark("");
    setShowNewProviderDeclineModal(true);
  };

  const confirmNewProviderDecline = async () => {
    await handleNewProviderAction(selectedNewProviderDeclineId, "declined", newProviderDeclineRemark);
    setShowNewProviderDeclineModal(false);
  };

  // --- Helpers ---
  const openPdf = (fileUrl) => {
    if (fileUrl) {
      window.open(`${fileUrl}`, "_blank");
    } else {
      toast.warning("No file available to view");
    }
  };

  const statusLabel = (status) => {
    const statusClasses = {
      approved: "bg-green-100 text-green-800",
      declined: "bg-red-100 text-red-800",
      in_progress: "bg-yellow-100 text-yellow-800",
      pending: "bg-yellow-100 text-yellow-800",
      W9_form_uploaded: "bg-blue-100 text-blue-800",
      W9_form_not_uploaded: "bg-gray-100 text-gray-800",
      not_submitted: "bg-gray-100 text-gray-800",
      default: "bg-gray-100 text-gray-800",
    };

    const statusText = {
      approved: "Approved",
      declined: "Declined",
      in_progress: "In Progress",
      pending: "Pending",
      W9_form_uploaded: "W9 Form Uploaded",
      W9_form_not_uploaded: "Not Submitted",
      not_submitted: "Not Submitted",
      default: "Not Submitted",
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${statusClasses[status] || statusClasses.default
          }`}
      >
        {statusText[status] || statusText.default}
      </span>
    );
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const handlePasswordResetModalOpen = (email) => {
    setuserEmail(email);
    setIsPasswordResetModalOpen(true);
  };

  // --- W9 filtering & sorting ---
  let filteredList = users
    ?.filter((user) =>
      ["user_email", "user_provider_no"].some((key) =>
        user[key]?.toString().toLowerCase().includes(searchQuery.toLowerCase())
      )
    )
    ?.filter((user) => {
      if (subTab === "pending") {
        return user.status === "in_progress" || user.status === "not_submitted";
      } else if (subTab === "history") {
        return user.status === "approved" || user.status === "declined";
      }
      return true;
    });

  const getSortedData = () => {
    if (!sortConfig.key) return filteredList;

    return [...filteredList].sort((a, b) => {
      const aValue = a[sortConfig.key] || "";
      const bValue = b[sortConfig.key] || "";

      const numA = parseFloat(aValue.toString().replace(/[^0-9.-]+/g, ""));
      const numB = parseFloat(bValue.toString().replace(/[^0-9.-]+/g, ""));

      if (!isNaN(numA) && !isNaN(numB)) {
        return sortConfig.direction === "asc" ? numA - numB : numB - numA;
      }

      if (sortConfig.key === "uploaded_at") {
        const dateA = new Date(aValue);
        const dateB = new Date(bValue);
        return sortConfig.direction === "asc" ? dateA - dateB : dateB - dateA;
      }

      return sortConfig.direction === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });
  };

  const sortedData = getSortedData();

  const renderSortIndicator = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === "asc" ? (
        <span className="ml-1 text-gray-400">↑</span>
      ) : (
        <span className="ml-1 text-gray-400">↓</span>
      );
    }
    return <span className="ml-1 opacity-30">↑↓</span>;
  };

  // --- Render ---
  return (
    <div
      style={{
        backgroundImage: `url(${backgroundImage})`,
      }}
      className=" min-h-screen"
    >
      <div className="p-4 md:p-8 max-w-[95%] mx-auto">
        <div className="w-full bg-transparent mb-3">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between px-4 gap-4">
            {/* Left Section: Title, Tabs, Search, Refresh */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-5 w-full sm:w-auto flex-wrap">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">
                Admin Panel
              </h2>
              {/* Main Tabs */}
              <div className="flex gap-1 bg-gray-200 rounded-full p-1">
                <button
                  onClick={() => handleMainTabChange("providers")}
                  className={`px-4 py-1 text-xs font-medium rounded-full transition-colors ${
                    mainTab === "providers"
                      ? "bg-cyan-600 text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  Provider Requests
                  {mergedProviderRequests.length > 0 && (
                    <span className="ml-1 bg-red-500 text-white text-[10px] rounded-full px-1.5 py-0.5">
                      {mergedProviderRequests.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => handleMainTabChange("w9")}
                  className={`px-4 py-1 text-xs font-medium rounded-full transition-colors ${
                    mainTab === "w9"
                      ? "bg-cyan-600 text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  W9 Requests
                  {users?.filter((u) => u.status === "in_progress").length > 0 && (
                    <span className="ml-1 bg-red-500 text-white text-[10px] rounded-full px-1.5 py-0.5">
                      {users.filter((u) => u.status === "in_progress").length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => handleMainTabChange("accounts")}
                  className={`px-4 py-1 text-xs font-medium rounded-full transition-colors ${
                    mainTab === "accounts"
                      ? "bg-cyan-600 text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  Account Management
                </button>
                {isAdmin && 
                <button
                  onClick={() => handleMainTabChange("guests")}
                  className={`px-4 py-1 text-xs font-medium rounded-full transition-colors ${
                    mainTab === "guests"
                      ? "bg-cyan-600 text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  Create Users
                </button>
                }
                <button
                  onClick={() => handleMainTabChange("claims")}
                  className={`px-4 py-1 text-xs font-medium rounded-full transition-colors ${
                    mainTab === "claims"
                      ? "bg-cyan-600 text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  Search By Tax ID
                </button>
              </div>
              <div className="flex justify-between gap-4 items-center w-full md:w-auto">
                {mainTab === "guests" && (
                  <button
                    className="text-teal-500 hover:text-teal-700 text-sm sm:w-28"
                    onClick={() => fetchGuestList()}
                  >
                    <i className="fa-solid fa-clock-rotate-left mr-1"></i> Refresh
                  </button>
                )}
              </div>
            </div>

            {/* Right Section: User Info */}
            <div className="flex items-center gap-4 mt-3 md:mt-0 ml-auto flex-shrink-0">
              <div
                className="whitespace-nowrap px-3 py-1 text-sm cursor-pointer bg-cyan-600 text-gray-50 text-center rounded-md"
                onClick={() => navigate("/loginlogs")}
              >
                View Logs
              </div>
              <h3 className="font-inter text-sm text-black whitespace-nowrap">
                Welcome, {admin?.email}!
              </h3>
              <img
                src={mmplogo}
                alt="Profile"
                className="w-8 sm:w-10 flex-shrink-0"
                aria-label="User profile"
              />
              <div onClick={() => handleLogout()} className="flex-shrink-0">
                <img
                  className="w-6 cursor-pointer"
                  src="/images/Header/Vector.png"
                  alt="Logout"
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>
        </div>

        {/* W9 Requests Search + Sub-tabs + Counts Row */}
        {mainTab === "w9" && (
          <div className="flex flex-col md:flex-row md:items-center justify-between px-4 gap-3 mb-5">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex gap-1">
                <button
                  onClick={() => setSubTab("pending")}
                  className={`px-3 py-0.5 text-xs font-medium rounded-full transition-colors border ${
                    subTab === "pending"
                      ? "bg-cyan-100 text-cyan-700 border-cyan-300"
                      : "text-gray-500 hover:text-gray-700 border-gray-300"
                  }`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setSubTab("history")}
                  className={`px-3 py-0.5 text-xs font-medium rounded-full transition-colors border ${
                    subTab === "history"
                      ? "bg-cyan-100 text-cyan-700 border-cyan-300"
                      : "text-gray-500 hover:text-gray-700 border-gray-300"
                  }`}
                >
                  Approved / Declined
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Search Email or Tax ID"
                  className="border border-gray-300 w-full sm:w-auto px-4 placeholder:text-sm py-1 rounded-full text-sm"
                  onChange={(e) => setSearchQuery(e.target.value)}
                  value={searchQuery}
                />
                <button
                  className="text-teal-500 hover:text-teal-700 text-sm whitespace-nowrap"
                  onClick={() => fetchAllUsers()}
                >
                  <i className="fa-solid fa-clock-rotate-left mr-1"></i> Refresh
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2 whitespace-nowrap">
              <span className="text-xs font-medium text-yellow-700">
                Pending: <span className="font-bold">{users.filter((u) => u.status === "in_progress").length}</span>
              </span>
              <span className="text-gray-300">|</span>
              <span className="text-xs font-medium text-green-700">
                Approved: <span className="font-bold">{users.filter((u) => u.status === "approved").length}</span>
              </span>
              <span className="text-gray-300">|</span>
              <span className="text-xs font-medium text-red-700">
                Declined: <span className="font-bold">{users.filter((u) => u.status === "declined").length}</span>
              </span>
            </div>
          </div>
        )}

        {/* Provider Requests Sub-tabs + Counts Row */}
        {mainTab === "providers" && (
          <div className="flex flex-col md:flex-row md:items-center justify-between px-4 gap-3 mb-5">
            <div className="flex items-center gap-4">
              <div className="flex gap-1">
                <button
                  onClick={() => setSubTab("pending")}
                  className={`px-3 py-0.5 text-xs font-medium rounded-full transition-colors border ${
                    subTab === "pending"
                      ? "bg-cyan-100 text-cyan-700 border-cyan-300"
                      : "text-gray-500 hover:text-gray-700 border-gray-300"
                  }`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setSubTab("history")}
                  className={`px-3 py-0.5 text-xs font-medium rounded-full transition-colors border ${
                    subTab === "history"
                      ? "bg-cyan-100 text-cyan-700 border-cyan-300"
                      : "text-gray-500 hover:text-gray-700 border-gray-300"
                  }`}
                >
                  Approved / Declined
                </button>
              </div>
              <button
                className="text-teal-500 hover:text-teal-700 text-sm whitespace-nowrap"
                onClick={() => {
                  fetchProviderRequests();
                  fetchNewProviderRequests();
                  fetchUserRegistrations();
                }}
              >
                <i className="fa-solid fa-clock-rotate-left mr-1"></i> Refresh
              </button>
            </div>
            <div className="flex items-center gap-2 whitespace-nowrap">
              <span className="text-xs font-medium text-yellow-700">
                Pending: <span className="font-bold">{mergedProviderRequests.length}</span>
              </span>
              <span className="text-gray-300">|</span>
              <span className="text-xs font-medium text-green-700">
                Approved: <span className="font-bold">
                  {providerRequests.filter((r) => r.status === "approved").length +
                    newProviderRequests.filter((u) => u.new_provider_status === "approved").length}
                </span>
              </span>
              <span className="text-gray-300">|</span>
              <span className="text-xs font-medium text-red-700">
                Declined: <span className="font-bold">
                  {providerRequests.filter((r) => r.status === "declined").length +
                    newProviderRequests.filter((u) => u.new_provider_status === "declined").length}
                </span>
              </span>
            </div>
          </div>
        )}

        {/* Accounts Search + Counts Row */}
        {mainTab === "accounts" && (
          <div className="flex flex-col md:flex-row md:items-center justify-between px-4 gap-3 mb-5">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <input
                type="text"
                placeholder="Search Name, Email or Phone"
                className="border border-gray-300 w-full md:w-auto px-4 placeholder:text-sm py-1 rounded-full text-sm"
                onChange={(e) => setAccountSearchQuery(e.target.value)}
                value={accountSearchQuery}
              />
              <button
                className="text-teal-500 hover:text-teal-700 text-sm whitespace-nowrap"
                onClick={() => fetchAllUserAccounts()}
              >
                <i className="fa-solid fa-clock-rotate-left mr-1"></i> Refresh
              </button>
            </div>
            <div className="flex items-center gap-2 whitespace-nowrap">
              <span className="text-xs font-medium text-gray-700">
                Total: <span className="font-bold text-gray-900">{allUsers.length}</span>
              </span>
              <span className="text-gray-300">|</span>
              <span className="text-xs font-medium text-blue-700">
                Providers: <span className="font-bold">{allUsers.filter((u) => !u.is_admin && !u.is_guest).length}</span>
              </span>
              <span className="text-gray-300">|</span>
              <span className="text-xs font-medium text-purple-700">
                Admins: <span className="font-bold">{allUsers.filter((u) => u.is_admin).length}</span>
              </span>
              <span className="text-gray-300">|</span>
              <span className="text-xs font-medium text-amber-700">
                Guests: <span className="font-bold">{allUsers.filter((u) => u.is_guest && !u.is_admin).length}</span>
              </span>
            </div>
          </div>
        )}

        {/* ===== CONTENT ===== */}
        {mainTab === "claims" ? (
          <div className="bg-white shadow-sm rounded-xl p-6">
            <AdminClaimSearch initialTaxId={claimSearchTaxId.taxId} searchTrigger={claimSearchTaxId.ts} />
          </div>
        ) : mainTab === "accounts" ? (
          /* --- Account Management Tab Content --- */
          allUsersLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div>
              <div className="bg-white shadow-sm rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tax IDs</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registered At</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {allUsers
                      .filter((u) =>
                        u.name?.toLowerCase().includes(accountSearchQuery.toLowerCase()) ||
                        u.email?.toLowerCase().includes(accountSearchQuery.toLowerCase()) ||
                        u.phone_no?.toLowerCase().includes(accountSearchQuery.toLowerCase())
                      ).length === 0 ? (
                      <tr>
                        <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                          No user accounts found
                        </td>
                      </tr>
                    ) : (
                      allUsers
                        .filter((u) =>
                          u.name?.toLowerCase().includes(accountSearchQuery.toLowerCase()) ||
                          u.email?.toLowerCase().includes(accountSearchQuery.toLowerCase()) ||
                          u.phone_no?.toLowerCase().includes(accountSearchQuery.toLowerCase())
                        )
                        .map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.name || "-"}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.phone_no || "-"}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              {user.is_admin ? (
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">Admin</span>
                              ) : user.is_guest ? (
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">Guest</span>
                              ) : (
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Provider</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {user.provider_numbers?.length > 0 ? [...new Set(user.provider_numbers.map((pn) => pn.provider_no))].map((taxId) => (
                                <span
                                  key={taxId}
                                  onClick={() => handleTaxIdClick(taxId)}
                                  className="inline-block mr-1 mb-1 px-2 py-0.5 rounded-full text-xs font-medium bg-cyan-50 text-cyan-700 border border-cyan-200 cursor-pointer hover:bg-cyan-100 hover:text-cyan-900 hover:border-cyan-400 transition-colors underline underline-offset-2 decoration-cyan-300"
                                  title="Click to search claims for this Tax ID"
                                >
                                  {taxId} <i className="fa-solid fa-arrow-up-right-from-square text-[9px] ml-0.5 no-underline"></i>
                                </span>
                              )) : <span className="text-gray-400">-</span>}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {user.date_joined ? new Date(user.date_joined).toLocaleDateString() : ""}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              {user.is_approved ? (
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Approved</span>
                              ) : (
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pending</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                              {isGuest ? (
                                <span className="text-gray-400 italic text-xs">View Only</span>
                              ) : (
                                <div className="flex justify-center space-x-2">
                                  <button
                                    onClick={() => {
                                      setEditUser(user);
                                      setEditUserName(user.name || "");
                                      setEditUserEmail(user.email);
                                      setEditUserPhone(user.phone_no || "");
                                      setEditUserPassword("");
                                      setShowEditPassword(false);
                                      setShowEditUserModal(true);
                                    }}
                                    title="Edit"
                                    className="inline-flex items-center p-1.5 border border-transparent rounded-md shadow-sm text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                  {/* Viewer toggle hidden for now
                                  <button
                                    onClick={async () => {
                                      try {
                                        const res = await axios.post(
                                          `${api}/auth/admin/toggle-viewer/`,
                                          { user_id: user.id },
                                          { headers: { Authorization: `Token ${admin_token}` } }
                                        );
                                        toast.success(res.data.message);
                                        fetchAllUserAccounts();
                                      } catch (err) {
                                        toast.error(err.response?.data?.error || "Failed to toggle viewer access");
                                      }
                                    }}
                                    title={user.is_viewer ? "Revoke Viewer Access" : "Grant Viewer Access"}
                                    className={`inline-flex items-center p-1.5 border border-transparent rounded-md shadow-sm text-white focus:outline-none ${
                                      user.is_viewer ? "bg-emerald-600 hover:bg-emerald-700" : "bg-gray-400 hover:bg-gray-500"
                                    }`}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  */}
                                  <button
                                    onClick={() => {
                                      setRemoveAccountUser(user);
                                      setShowRemoveAccountModal(true);
                                    }}
                                    title="Remove"
                                    className="inline-flex items-center p-1.5 border border-transparent rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
              </div>
            </div>
          )
        ) : mainTab === "guests" ? (
          /* --- Create Users Tab Content --- */
          <div className="space-y-6">
            {/* Create Account Form */}
            <div className="bg-white shadow-sm rounded-xl p-6">
              <h3 className="text-sm font-semibold text-gray-800 mb-4">Create New Account</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="email"
                  placeholder="Email *"
                  className="border border-gray-300 px-4 py-2 rounded-lg text-sm"
                  value={guestForm.email}
                  onChange={(e) => setGuestForm({ ...guestForm, email: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Name"
                  className="border border-gray-300 px-4 py-2 rounded-lg text-sm"
                  value={guestForm.name}
                  onChange={(e) => setGuestForm({ ...guestForm, name: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Phone"
                  className="border border-gray-300 px-4 py-2 rounded-lg text-sm"
                  value={guestForm.phone_no}
                  onChange={(e) => setGuestForm({ ...guestForm, phone_no: e.target.value })}
                />
                <input
                  type="password"
                  placeholder="Password *"
                  className="border border-gray-300 px-4 py-2 rounded-lg text-sm"
                  value={guestForm.password}
                  onChange={(e) => setGuestForm({ ...guestForm, password: e.target.value })}
                />
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium text-gray-700">Role:</label>
                  <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="createRole"
                      value="guest"
                      checked={guestForm.role === "guest"}
                      onChange={() => setGuestForm({ ...guestForm, role: "guest" })}
                      className="accent-cyan-600"
                    />
                    Guest
                  </label>
                  <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="createRole"
                      value="admin"
                      checked={guestForm.role === "admin"}
                      onChange={() => setGuestForm({ ...guestForm, role: "admin" })}
                      className="accent-cyan-600"
                    />
                    Admin
                  </label>
                </div>
              </div>
              <button
                onClick={handleCreateGuest}
                disabled={guestCreateLoading}
                className="mt-4 px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium rounded-lg disabled:opacity-50"
              >
                {guestCreateLoading ? "Creating..." : `Create ${guestForm.role === "admin" ? "Admin" : "Guest"}`}
              </button>
            </div>
          </div>
        ) : mainTab === "w9" ? (
          /* --- W9 Tab Content --- */
          loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="bg-white shadow-sm rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        onClick={() =>
                          setSortConfig((prev) => ({
                            key: "user_email",
                            direction:
                              prev.key === "user_email" &&
                                prev.direction === "asc"
                                ? "desc"
                                : "asc",
                          }))
                        }
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer "
                      >
                        Email {renderSortIndicator("user_email")}
                      </th>
                      <th
                        onClick={() =>
                          setSortConfig((prev) => ({
                            key: "user_provider_no",
                            direction:
                              prev.key === "user_provider_no" &&
                                prev.direction === "asc"
                                ? "desc"
                                : "asc",
                          }))
                        }
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Tax ID {renderSortIndicator("user_provider_no")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        NPI
                      </th>
                      <th
                        onClick={() =>
                          setSortConfig((prev) => ({
                            key: "status",
                            direction:
                              prev.key === "status" && prev.direction === "asc"
                                ? "desc"
                                : "asc",
                          }))
                        }
                        className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Status {renderSortIndicator("status")}
                      </th>
                      <th
                        onClick={() =>
                          setSortConfig((prev) => ({
                            key: "uploaded_at",
                            direction:
                              prev.key === "uploaded_at" &&
                                prev.direction === "asc"
                                ? "desc"
                                : "asc",
                          }))
                        }
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Uploaded At {renderSortIndicator("uploaded_at")}
                      </th>
                      <th
                        onClick={() =>
                          setSortConfig((prev) => ({
                            key: "file_updated_at",
                            direction:
                              prev.key === "file_updated_at" &&
                                prev.direction === "asc"
                                ? "desc"
                                : "asc",
                          }))
                        }
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Updated At {renderSortIndicator("file_updated_at")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        File
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Decline Remark
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reset Password
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredList.length === 0 ? (
                      <tr>
                        <td
                          colSpan="10"
                          className="px-6 py-4 text-center text-gray-500"
                        >
                          {subTab === "pending"
                            ? "No pending W9 form requests"
                            : "No approved/declined W9 forms found"}
                        </td>
                      </tr>
                    ) : (
                      sortedData
                        ?.filter((item) => item?.uploaded_at)
                        ?.reverse()
                        .map((user) => (
                          <tr
                            key={user.user_id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {user.user_email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {user.user_provider_no || "-"}{" "}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {user.user_npi || "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              {statusLabel(user.status)}
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap">
                              {user?.uploaded_at
                                ? user?.uploaded_at
                                  ?.toLocaleString()
                                  ?.split("T")?.[0]
                                : ""}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {user?.file_updated_at
                                ? user?.file_updated_at
                                  ?.toLocaleString()
                                  ?.split("T")?.[0]
                                : ""}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {user.file ? (
                                <button
                                  onClick={() => openPdf(user.file)}
                                  className="text-blue-600 hover:text-blue-800 hover:underline flex items-center"
                                >
                                  <svg
                                    className="w-4 h-4 mr-1"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                    />
                                  </svg>
                                  View PDF
                                </button>
                              ) : (
                                <span className="text-gray-400">No File</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                              {user.status === "in_progress" ? (
                                <div className="flex justify-center space-x-2">
                                  <button
                                    onClick={() =>
                                      handleStatusChange(user.user_id, user.user_provider_no, "approved", "", user.provider_number_id)
                                    }
                                    disabled={actionLoading.approve === user.user_id}
                                    title="Approve"
                                    className={`inline-flex items-center p-1.5 border border-transparent rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed ${actionLoading.decline === user.user_id ? "hidden" : ""}`}
                                  >
                                    {actionLoading.approve === user.user_id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <CheckCircle className="w-4 h-4" />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => handleAddDeclineRemark(user)}
                                    disabled={actionLoading.decline === user.user_id}
                                    title="Decline"
                                    className={`inline-flex items-center p-1.5 border border-transparent rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed ${actionLoading.approve === user.user_id ? "hidden" : ""}`}
                                  >
                                    {actionLoading.decline === user.user_id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <XCircle className="w-4 h-4" />
                                    )}
                                  </button>
                                </div>
                              ) : (
                                <span className="text-gray-500 italic">
                                  {user.status === "declined" &&
                                    user.declined_at ? (
                                    <span className="text-gray-500 italic">
                                      Declined on {user.declined_at.split("T")[0]}{" "}
                                      at{" "}
                                      {
                                        user.declined_at
                                          .split("T")[1]
                                          ?.replace("Z", "")
                                          .split(".")[0]
                                      }
                                    </span>
                                  ) : user.status === "approved" &&
                                    user.approved_at ? (
                                    <span className="text-gray-500 italic">
                                      Approved on {user.approved_at.split("T")[0]}{" "}
                                      at{" "}
                                      {
                                        user.approved_at
                                          .split("T")[1]
                                          ?.replace("Z", "")
                                          .split(".")[0]
                                      }
                                    </span>
                                  ) : (
                                    "No Action"
                                  )}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              {user.decline_remark || "-"}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <button
                                onClick={() =>
                                  handlePasswordResetModalOpen(user.user_email)
                                }
                                className="text-red-700 text-xs hover:text-gray-50 font-medium border rounded-full border-red-800 p-1 px-3 hover:bg-cyan-600 w-32"
                              >
                                <i className="fa-solid fa-lock"></i> Reset
                                Password
                              </button>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )
        ) : (
          /* --- Provider Requests Tab Content --- */
          subTab === "pending" ? (
            <>
              {/* Unified Provider Requests Table */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <h3 className="text-lg font-semibold text-gray-800">Provider Requests</h3>
                  {mergedProviderRequests.length > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                      {mergedProviderRequests.length}
                    </span>
                  )}
                </div>
                {(providerRequestsLoading || newProviderLoading || userRegLoading) ? (
                  <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  <div className="bg-white shadow-sm rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tax ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NPI</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested At</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {mergedProviderRequests.length === 0 ? (
                            <tr>
                              <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                                No pending provider requests
                              </td>
                            </tr>
                          ) : (
                            mergedProviderRequests.map((item) => (
                              <tr key={`${item._type}-${item.id}`} className="hover:bg-gray-50 transition-colors">
                                {/* Type */}
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  {item._type === "npi_request" ? (
                                    item.npi ? (
                                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">NPI Request</span>
                                    ) : (
                                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800">Tax ID Request</span>
                                    )
                                  ) : item._type === "new_registration" ? (
                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">New Registration</span>
                                  ) : (
                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">User Registration</span>
                                  )}
                                </td>
                                {/* Email */}
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {item._type === "npi_request" ? item.user_email : item._type === "new_registration" ? item.provider_email : item.email}
                                </td>
                                {/* Tax ID */}
                                <td className="px-6 py-4 text-sm text-gray-900">
                                  {item._type === "npi_request" ? (
                                    item.provider_no
                                  ) : item._type === "new_registration" ? (
                                    item.PRNUM
                                  ) : (
                                    item.provider_numbers?.map((pn) => (
                                      <div key={pn.id} className="mb-1">
                                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                          {pn.provider_no}
                                        </span>
                                      </div>
                                    )) || "-"
                                  )}
                                </td>
                                {/* NPI */}
                                <td className="px-6 py-4 text-sm text-gray-900">
                                  {item._type === "npi_request" ? (
                                    item.npi || "-"
                                  ) : item._type === "new_registration" ? (
                                    item.PRNPI || "-"
                                  ) : (
                                    item.provider_numbers?.map((pn) => (
                                      <div key={pn.id} className="mb-1">
                                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                          {pn.npi || "-"}
                                        </span>
                                      </div>
                                    )) || "-"
                                  )}
                                </td>
                                {/* Details */}
                                <td className="px-6 py-4 text-sm text-gray-900">
                                  {item._type === "npi_request" ? (
                                    item.other_accounts?.length > 0 ? (
                                      <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                                        Also registered under: {item.other_accounts.join(", ")}
                                      </div>
                                    ) : "-"
                                  ) : item._type === "new_registration" ? (
                                    <div className="space-y-1">
                                      <p><strong>Name:</strong> {item.provider_name}</p>
                                      <p><strong>Address:</strong> {getFullAddress(item)}</p>
                                      <p><strong>Title:</strong> {item?.PRTITL || "-"}</p>
                                      {item.w9Form_url ? (
                                        <p><strong>W9:</strong>{" "}
                                          <a
                                            href={item.w9Form_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-blue-600 hover:text-blue-800 inline-flex items-center"
                                            title="Download W9"
                                          >
                                            <Download className="w-4 h-4" />
                                          </a>
                                        </p>
                                      ) : (
                                        <p><strong>W9:</strong> <span className="text-gray-400">No File</span></p>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="space-y-1">
                                      <p><strong>Phone:</strong> {item.phone_no || "-"}</p>
                                      {item.provider_numbers?.map((pn) => (
                                        pn.other_accounts?.length > 0 && (
                                          <div key={pn.id} className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                                            {pn.provider_no} also registered under: {pn.other_accounts.join(", ")}
                                          </div>
                                        )
                                      ))}
                                    </div>
                                  )}
                                </td>
                                {/* Requested At */}
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {item._type === "user_registration"
                                    ? (item._date ? new Date(item._date).toLocaleDateString() : "")
                                    : (item._date ? item._date.split("T")[0] : "")}
                                </td>
                                {/* Status */}
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                    Pending
                                  </span>
                                </td>
                                {/* Actions */}
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                  {item._type === "npi_request" ? (
                                    <div className="flex justify-center space-x-2">
                                      <button
                                        onClick={() => handleProviderStatusChange(item.id, "approved")}
                                        disabled={providerActionLoading.approve === item.id}
                                        title="Approve"
                                        className={`inline-flex items-center p-1.5 border border-transparent rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed ${providerActionLoading.decline === item.id ? "hidden" : ""}`}
                                      >
                                        {providerActionLoading.approve === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                      </button>
                                      <button
                                        onClick={() => { setSelectedProviderRequest(item); setIsProviderDeclineModalOpen(true); }}
                                        disabled={providerActionLoading.decline === item.id}
                                        title="Decline"
                                        className={`inline-flex items-center p-1.5 border border-transparent rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed ${providerActionLoading.approve === item.id ? "hidden" : ""}`}
                                      >
                                        {providerActionLoading.decline === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                      </button>
                                    </div>
                                  ) : item._type === "new_registration" ? (
                                    <div className="flex justify-center space-x-2">
                                      <button
                                        onClick={() => openNewProviderApproveModal(item.id)}
                                        disabled={newProviderActionLoading.approve === item.id}
                                        title="Approve"
                                        className={`inline-flex items-center p-1.5 border border-transparent rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed ${newProviderActionLoading.decline === item.id ? "hidden" : ""}`}
                                      >
                                        {newProviderActionLoading.approve === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                      </button>
                                      <button
                                        onClick={() => openNewProviderDeclineModal(item.id)}
                                        disabled={newProviderActionLoading.decline === item.id}
                                        title="Decline"
                                        className={`inline-flex items-center p-1.5 border border-transparent rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed ${newProviderActionLoading.approve === item.id ? "hidden" : ""}`}
                                      >
                                        {newProviderActionLoading.decline === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex justify-center space-x-2">
                                      <button
                                        onClick={() => openUserRegApproveModal(item.id)}
                                        disabled={userRegActionLoading.approve === item.id}
                                        title="Approve"
                                        className={`inline-flex items-center p-1.5 border border-transparent rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed ${userRegActionLoading.decline === item.id ? "hidden" : ""}`}
                                      >
                                        {userRegActionLoading.approve === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                      </button>
                                      <button
                                        onClick={() => openUserRegDeclineModal(item.id)}
                                        disabled={userRegActionLoading.decline === item.id}
                                        title="Decline"
                                        className={`inline-flex items-center p-1.5 border border-transparent rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed ${userRegActionLoading.approve === item.id ? "hidden" : ""}`}
                                      >
                                        {userRegActionLoading.decline === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

            </>
          ) : (
            /* --- Provider Requests: Approved / Declined sub-tab --- */
            <>
              {/* Section 1: Provider Number Requests — Approved / Declined */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <h3 className="text-lg font-semibold text-gray-800">Tax ID / NPI Requests — Approved / Declined</h3>
                </div>
                {providerRequestsLoading ? (
                  <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  <div className="bg-white shadow-sm rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tax ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NPI</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested At</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {providerRequests.filter((r) => r.status === "approved" || r.status === "declined").length === 0 ? (
                            <tr>
                              <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                                No approved/declined provider number requests found
                              </td>
                            </tr>
                          ) : (
                            providerRequests
                              .filter((r) => r.status === "approved" || r.status === "declined")
                              .map((req) => (
                                <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{req.user_email}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-cyan-700">#{req.provider_no}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{req.npi || "-"}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(req.requested_at).toLocaleDateString()}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <span
                                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        req.status === "approved"
                                          ? "bg-green-100 text-green-800"
                                          : "bg-red-100 text-red-800"
                                      }`}
                                    >
                                      {req.status === "approved" ? "Approved" : "Declined"}
                                    </span>
                                  </td>
                                </tr>
                              ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Section 2: New Provider Registrations — Approved / Declined */}
              <div>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <h3 className="text-lg font-semibold text-gray-800">New Provider Registrations — Approved / Declined</h3>
                </div>
                {newProviderLoading ? (
                  <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  <div className="bg-white shadow-sm rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tax ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NPI</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name & Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Full Address</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">W9 Form</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Decline Remark</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {newProviderRequests.filter((u) => u.new_provider_status === "approved" || u.new_provider_status === "declined").length === 0 ? (
                            <tr>
                              <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                                No approved/declined provider registrations found
                              </td>
                            </tr>
                          ) : (
                            newProviderRequests
                              .filter((u) => u.new_provider_status === "approved" || u.new_provider_status === "declined")
                              .map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-cyan-700">
                                    #{item.PRNUM}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.PRNPI || "-"}</td>
                                  <td className="px-6 py-4 text-sm text-gray-900">
                                    <p><strong>Name:</strong> {item.provider_name}</p>
                                    <p><strong>Email:</strong> {item.provider_email}</p>
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-900">
                                    <p><strong>Address:</strong> {getFullAddress(item)}</p>
                                    <p><strong>Title:</strong> {item?.PRTITL || "-"}</p>
                                    <p><strong>Description:</strong> {item?.description || "-"}</p>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <span
                                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        item.new_provider_status === "approved"
                                          ? "bg-green-100 text-green-800"
                                          : "bg-red-100 text-red-800"
                                      }`}
                                    >
                                      {item.new_provider_status === "approved" ? "Approved" : "Declined"}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                    {item.w9Form_url ? (
                                      <a
                                        href={item.w9Form_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-blue-600 hover:text-blue-800 inline-flex items-center"
                                        title="Download W9"
                                      >
                                        <Download className="w-4 h-4" />
                                      </a>
                                    ) : (
                                      <span className="text-gray-400">No File</span>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                    {item?.decline_remark || "-"}
                                  </td>
                                </tr>
                              ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

            </>
          )
        )}
      </div>{" "}

      {/* W9 Decline Remark Modal */}
      <div className="">
        <DeclineRemarkModal
          isOpen={isDeclineRemarkModalOpen}
          onClose={() => setIsDeclineRemarkModalOpen(false)}
          onDecline={(remark) =>
            handleStatusChange(
              selectedUser.user_id,
              selectedUser.user_provider_no,
              "declined",
              remark,
              selectedUser.provider_number_id
            )
          }
          user={selectedUser}
        />
      </div>

      {/* Provider Request Decline Modal */}
      <div className="">
        <DeclineRemarkModal
          isOpen={isProviderDeclineModalOpen}
          onClose={() => setIsProviderDeclineModalOpen(false)}
          onDecline={(remark) =>
            handleProviderStatusChange(selectedProviderRequest?.id, "declined", remark)
          }
          user={selectedProviderRequest ? { user_email: selectedProviderRequest.user_email, user_provider_no: selectedProviderRequest.provider_no } : null}
        />
      </div>

      {/* New Provider Approve Confirmation Modal */}
      {showNewProviderApproveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-4 text-cyan-700">
              Confirm Approval
            </h2>
            <p className="mb-4 text-sm">
              Are you sure you want to approve this provider?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowNewProviderApproveModal(false)}
                disabled={newProviderActionLoading.approve !== null}
                className="px-4 py-2 rounded-xl border border-gray-400 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmNewProviderApprove}
                disabled={newProviderActionLoading.approve !== null}
                className={`px-4 py-2 rounded-xl text-white ${
                  newProviderActionLoading.approve !== null
                    ? "bg-green-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {newProviderActionLoading.approve !== null ? "Approving..." : "Confirm Approve"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Provider Decline Modal */}
      {showNewProviderDeclineModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-cyan-700">
              Decline Provider
            </h2>
            <textarea
              value={newProviderDeclineRemark}
              onChange={(e) => setNewProviderDeclineRemark(e.target.value)}
              placeholder="Enter reason for decline..."
              className="w-full border border-gray-300 rounded-lg p-3 h-28 mb-4 focus:outline-none focus:ring focus:ring-cyan-300"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowNewProviderDeclineModal(false)}
                disabled={newProviderActionLoading.decline !== null}
                className="px-4 py-2 rounded-xl border border-gray-400 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmNewProviderDecline}
                disabled={newProviderActionLoading.decline !== null}
                className={`px-4 py-2 rounded-xl text-white ${
                  newProviderActionLoading.decline !== null
                    ? "bg-red-300 cursor-not-allowed"
                    : "bg-red-500 hover:bg-red-600"
                }`}
              >
                {newProviderActionLoading.decline !== null ? "Declining..." : "Confirm Decline"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Registration Approve Modal */}
      {showUserRegApproveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-4 text-cyan-700">Confirm Approval</h2>
            <p className="mb-4 text-sm">Are you sure you want to approve this user? They will be able to log in to the portal.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowUserRegApproveModal(false)} disabled={userRegActionLoading.approve !== null} className="px-4 py-2 rounded-xl border border-gray-400 text-gray-600 hover:bg-gray-200 disabled:opacity-50">Cancel</button>
              <button onClick={confirmUserRegApprove} disabled={userRegActionLoading.approve !== null} className={`px-4 py-2 rounded-xl text-white ${userRegActionLoading.approve !== null ? "bg-green-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"}`}>
                {userRegActionLoading.approve !== null ? "Approving..." : "Confirm Approve"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Registration Decline Modal */}
      {showUserRegDeclineModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-cyan-700">Decline Registration</h2>
            <textarea value={userRegDeclineRemark} onChange={(e) => setUserRegDeclineRemark(e.target.value)} placeholder="Enter reason for decline..." className="w-full border border-gray-300 rounded-lg p-3 h-28 mb-4 focus:outline-none focus:ring focus:ring-cyan-300" />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowUserRegDeclineModal(false)} disabled={userRegActionLoading.decline !== null} className="px-4 py-2 rounded-xl border border-gray-400 text-gray-600 hover:bg-gray-200 disabled:opacity-50">Cancel</button>
              <button onClick={confirmUserRegDecline} disabled={userRegActionLoading.decline !== null} className={`px-4 py-2 rounded-xl text-white ${userRegActionLoading.decline !== null ? "bg-red-300 cursor-not-allowed" : "bg-red-500 hover:bg-red-600"}`}>
                {userRegActionLoading.decline !== null ? "Declining..." : "Confirm Decline"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUserModal && editUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-5 text-cyan-700">Edit User</h2>

            {/* Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Provider Name</label>
              <input
                type="text"
                value={editUserName}
                onChange={(e) => setEditUserName(e.target.value)}
                placeholder="Enter provider name"
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring focus:ring-cyan-300 text-sm"
              />
            </div>

            {/* Email */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={editUserEmail}
                onChange={(e) => setEditUserEmail(e.target.value)}
                placeholder="Enter email address"
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring focus:ring-cyan-300 text-sm"
              />
            </div>

            {/* Phone */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={editUserPhone}
                onChange={(e) => setEditUserPhone(e.target.value)}
                placeholder="Enter phone number"
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring focus:ring-cyan-300 text-sm"
              />
            </div>

            {/* Role (read-only) */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <div className="w-full border border-gray-200 rounded-lg p-2.5 bg-gray-50 text-sm">
                {editUser.is_admin ? (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">Admin</span>
                ) : editUser.is_guest ? (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">Guest</span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Provider</span>
                )}
              </div>
            </div>

            {/* Password */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              {showEditPassword ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editUserPassword}
                    onChange={(e) => setEditUserPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="flex-1 border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring focus:ring-cyan-300 text-sm"
                  />
                  <button
                    onClick={() => { setShowEditPassword(false); setEditUserPassword(""); }}
                    className="px-3 py-2 text-xs text-gray-500 border border-gray-300 rounded-lg hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowEditPassword(true)}
                  className="text-sm text-cyan-600 hover:text-cyan-700 hover:underline font-medium"
                >
                  Reset Password
                </button>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowEditUserModal(false);
                  setEditUser(null);
                  setEditUserName("");
                  setEditUserEmail("");
                  setEditUserPassword("");
                  setShowEditPassword(false);
                }}
                disabled={editUserLoading}
                className="px-4 py-2 rounded-xl border border-gray-400 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleEditUser}
                disabled={editUserLoading}
                className={`px-4 py-2 rounded-xl text-white ${
                  editUserLoading
                    ? "bg-cyan-400 cursor-not-allowed"
                    : "bg-cyan-600 hover:bg-cyan-700"
                }`}
              >
                {editUserLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guest/Admin Delete Confirmation Modal */}
      {showGuestDeleteModal && guestDeleteTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-4 text-red-600">Remove Account</h2>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-800 font-medium mb-2">
                This action cannot be undone.
              </p>
              <p className="text-sm text-red-700">
                Are you sure you want to remove the {guestDeleteTarget.is_admin ? "admin" : "guest"} account for <strong>{guestDeleteTarget.email}</strong>?
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setShowGuestDeleteModal(false); setGuestDeleteTarget(null); }}
                disabled={guestDeleteLoading}
                className="px-4 py-2 rounded-xl border border-gray-400 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await handleDeleteGuest(guestDeleteTarget.id);
                  setShowGuestDeleteModal(false);
                  setGuestDeleteTarget(null);
                }}
                disabled={guestDeleteLoading}
                className={`px-4 py-2 rounded-xl text-white ${
                  guestDeleteLoading
                    ? "bg-red-300 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {guestDeleteLoading ? "Removing..." : "Confirm Remove"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Account Modal */}
      {showRemoveAccountModal && removeAccountUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-4 text-red-600">Remove Account</h2>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-800 font-medium mb-2">
                This action cannot be undone.
              </p>
              <p className="text-sm text-red-700">
                You are about to permanently remove the account for <strong>{removeAccountUser.email}</strong>. All associated data (provider numbers, W9 forms, login logs) will be deleted.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowRemoveAccountModal(false);
                  setRemoveAccountUser(null);
                }}
                disabled={removeAccountLoading}
                className="px-4 py-2 rounded-xl border border-gray-400 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveAccount}
                disabled={removeAccountLoading}
                className={`px-4 py-2 rounded-xl text-white ${
                  removeAccountLoading
                    ? "bg-red-300 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {removeAccountLoading ? "Removing..." : "Confirm Remove"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      <div className="">
        {" "}
        {IsPasswordResetModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-2xl shadow-lg w-11/12 md:w-3/4 lg:w-1/2 max-h-[90vh]  relative">
              <button
                onClick={() => setIsPasswordResetModalOpen(false)}
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>

              <div className="px-6 py-2 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">
                  Password Reset for{" "}
                  <span className=" text-cyan-700">{userEmail}</span>
                </h2>
              </div>

              {/* Modal Body */}
              <div className="p-3 ">
                {<AdminPasswordResetModal provider_email={userEmail} />}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminValidations;
