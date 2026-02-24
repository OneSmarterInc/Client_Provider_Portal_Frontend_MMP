import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import backgroundImage from "../assets/image.png";
import { useNavigate } from "react-router-dom";
import MyContext from "../ContextApi/MyContext";
import DeclineRemarkModal from "./DeclineRemarkModal";
import AdminPasswordResetModal from "./AdminPasswordResetModal";

const AdminValidations = () => {
  const { api } = useContext(MyContext);
  const navigate = useNavigate();
  const admin_token = localStorage.getItem("authToken");
  const admin = JSON.parse(localStorage.getItem("user"));

  // --- Tab state ---
  const [mainTab, setMainTab] = useState("w9"); // "w9" | "providers"
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
    if (!newProviderDeclineRemark.trim()) {
      alert("Please enter a decline remark.");
      return;
    }
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
      default: "bg-gray-100 text-gray-800",
    };

    const statusText = {
      approved: "Approved",
      declined: "Declined",
      in_progress: "In Progress",
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
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <div className="w-full bg-transparent mb-7">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between px-4 gap-4">
            {/* Left Section: Title, Tabs, Search, Refresh */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-5 w-full sm:w-auto flex-wrap">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">
                Admin Panel
              </h2>
              {/* Main Tabs */}
              <div className="flex gap-1 bg-gray-200 rounded-full p-1">
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
                  onClick={() => handleMainTabChange("providers")}
                  className={`px-4 py-1 text-xs font-medium rounded-full transition-colors ${
                    mainTab === "providers"
                      ? "bg-cyan-600 text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  Provider Requests
                  {(providerRequests.length + newProviderRequests.filter((u) => u.new_provider_status === "pending").length) > 0 && (
                    <span className="ml-1 bg-red-500 text-white text-[10px] rounded-full px-1.5 py-0.5">
                      {providerRequests.length + newProviderRequests.filter((u) => u.new_provider_status === "pending").length}
                    </span>
                  )}
                </button>
              </div>
              {/* Sub-tabs */}
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
              <div className="flex justify-between gap-4 items-center w-full md:w-auto">
                {mainTab === "w9" && (
                  <div className="w-full sm:w-auto">
                    <input
                      type="text"
                      placeholder="Search Email or Provider No."
                      className="border border-gray-300 w-full sm:w-auto px-4 placeholder:text-sm py-1 rounded-full text-sm"
                      onChange={(e) => setSearchQuery(e.target.value)}
                      value={searchQuery}
                    />
                  </div>
                )}
                <button
                  className="text-teal-500 hover:text-teal-700 text-sm sm:w-28"
                  onClick={() => {
                    if (mainTab === "w9") {
                      fetchAllUsers();
                    } else {
                      fetchProviderRequests();
                      fetchNewProviderRequests();
                    }
                  }}
                >
                  <i className="fa-solid fa-clock-rotate-left mr-1"></i> Refresh
                </button>
              </div>
            </div>

            {/* Right Section: User Info */}
            <div className="flex items-center gap-9 mt-3 md:mt-0 ml-auto ">
              <div
                className="whitespace-nowrap px-3 text-sm cursor-pointer bg-cyan-600 text-gray-50 p-1 text-center rounded-md"
                onClick={() => navigate("/loginlogs")}
              >
                View Logs
              </div>
              <h3 className="font-inter text-sm text-black">
                Welcome, {admin?.email}!
              </h3>
              <img
                src="/images/Header/img-11.png"
                alt="Profile"
                className="w-8 sm:w-10"
                aria-label="User profile"
              />
              <div onClick={() => handleLogout()}>
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

        {/* ===== CONTENT ===== */}
        {mainTab === "w9" ? (
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
                        Provider No. {renderSortIndicator("user_provider_no")}
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
                          colSpan="9"
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
                                    disabled={
                                      actionLoading.approve === user.user_id
                                    }
                                    className={`inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-75 disabled:cursor-not-allowed ${actionLoading.decline === user.user_id
                                      ? "hidden"
                                      : ""
                                      }`}
                                  >
                                    {actionLoading.approve === user.user_id ? (
                                      <>
                                        <div className=" flex animate-spin rounded-full h-5 w-5 border-t-4 border-green-200 border-solid"></div>
                                        Approving..
                                      </>
                                    ) : (
                                      "Approve"
                                    )}
                                  </button>
                                  <button
                                    onClick={() => handleAddDeclineRemark(user)}
                                    disabled={
                                      actionLoading.decline === user.user_id
                                    }
                                    className={`inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-75 disabled:cursor-not-allowed ${actionLoading.approve === user.user_id
                                      ? "hidden"
                                      : ""
                                      }`}
                                  >
                                    {actionLoading.decline === user.user_id ? (
                                      <>
                                        <div className=" flex animate-spin rounded-full h-5 w-5 border-t-4 border-red-200 border-solid"></div>
                                        Declining..
                                      </>
                                    ) : (
                                      "Decline"
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
              {/* Section 1: Provider Number Requests */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <h3 className="text-lg font-semibold text-gray-800">Provider Number Requests</h3>
                  {providerRequests.length > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                      {providerRequests.length}
                    </span>
                  )}
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
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider No.</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested At</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {providerRequests.length === 0 ? (
                            <tr>
                              <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                                No pending provider number requests
                              </td>
                            </tr>
                          ) : (
                            providerRequests.map((req) => (
                              <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{req.user_email}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{req.provider_no}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {req.requested_at ? req.requested_at.split("T")[0] : ""}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                    Pending
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                  <div className="flex justify-center space-x-2">
                                    <button
                                      onClick={() => handleProviderStatusChange(req.id, "approved")}
                                      disabled={providerActionLoading.approve === req.id}
                                      className={`inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed ${providerActionLoading.decline === req.id ? "hidden" : ""}`}
                                    >
                                      {providerActionLoading.approve === req.id ? (
                                        <><div className="flex animate-spin rounded-full h-5 w-5 border-t-4 border-green-200 border-solid"></div>Approving..</>
                                      ) : "Approve"}
                                    </button>
                                    <button
                                      onClick={() => {
                                        setSelectedProviderRequest(req);
                                        setIsProviderDeclineModalOpen(true);
                                      }}
                                      disabled={providerActionLoading.decline === req.id}
                                      className={`inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed ${providerActionLoading.approve === req.id ? "hidden" : ""}`}
                                    >
                                      {providerActionLoading.decline === req.id ? (
                                        <><div className="flex animate-spin rounded-full h-5 w-5 border-t-4 border-red-200 border-solid"></div>Declining..</>
                                      ) : "Decline"}
                                    </button>
                                  </div>
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

              {/* Section 2: New Provider Registrations (Pending) */}
              <div>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <h3 className="text-lg font-semibold text-gray-800">New Provider Registrations</h3>
                  {newProviderRequests.filter((u) => u.new_provider_status === "pending").length > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                      {newProviderRequests.filter((u) => u.new_provider_status === "pending").length}
                    </span>
                  )}
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
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider No.</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name & Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Full Address</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">W9 Form</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Decline Remark</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {newProviderRequests.filter((u) => u.new_provider_status === "pending").length === 0 ? (
                            <tr>
                              <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                                No pending new provider registration requests
                              </td>
                            </tr>
                          ) : (
                            newProviderRequests
                              .filter((u) => u.new_provider_status === "pending")
                              .map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-cyan-700">
                                    #{item.PRNUM}
                                  </td>
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
                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                      Pending
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                    {item.w9Form_url ? (
                                      <a
                                        href={item.w9Form_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-blue-600 hover:text-blue-800 hover:underline"
                                      >
                                        Download
                                      </a>
                                    ) : (
                                      <span className="text-gray-400">No File</span>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                    <div className="flex justify-center space-x-2">
                                      <button
                                        onClick={() => openNewProviderApproveModal(item.id)}
                                        disabled={newProviderActionLoading.approve === item.id}
                                        className={`inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed ${newProviderActionLoading.decline === item.id ? "hidden" : ""}`}
                                      >
                                        {newProviderActionLoading.approve === item.id ? (
                                          <><div className="flex animate-spin rounded-full h-5 w-5 border-t-4 border-green-200 border-solid"></div>Approving..</>
                                        ) : "Approve"}
                                      </button>
                                      <button
                                        onClick={() => openNewProviderDeclineModal(item.id)}
                                        disabled={newProviderActionLoading.decline === item.id}
                                        className={`inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed ${newProviderActionLoading.approve === item.id ? "hidden" : ""}`}
                                      >
                                        {newProviderActionLoading.decline === item.id ? (
                                          <><div className="flex animate-spin rounded-full h-5 w-5 border-t-4 border-red-200 border-solid"></div>Declining..</>
                                        ) : "Decline"}
                                      </button>
                                    </div>
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
          ) : (
            /* --- Provider Requests: Approved / Declined sub-tab --- */
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
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider No.</th>
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
                            <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
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
                                      className="text-blue-600 hover:text-blue-800 hover:underline"
                                    >
                                      Download
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
