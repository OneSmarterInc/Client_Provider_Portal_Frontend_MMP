import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import backgroundImage from "../assets/image.png";
import { useNavigate } from "react-router-dom";
import MyContext from "../ContextApi/MyContext";
import DeclineRemarkModal from "./DeclineRemarkModal";

const AdminValidations = () => {
  const { api } = useContext(MyContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({
    approve: null,
    decline: null,
  });
  const admin_token = localStorage.getItem("authToken");
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    fetchAllUsers();
  }, []);

  const [searchQuery, setSearchQuery] = useState("");

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

  const handleStatusChange = async (userId, newStatus, remark = "") => {
    try {
      setActionLoading((prev) => ({
        ...prev,
        [newStatus === "approved" ? "approve" : "decline"]: userId,
      }));

      const response = await axios.post(
        `${api}/api/admin/w9-approve/`,
        { user_id: userId, status: newStatus, decline_remark: remark },
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
          `Failed to ${
            newStatus === "approved" ? "approve" : "decline"
          } W9 form`
      );
    } finally {
      setActionLoading({
        approve: null,
        decline: null,
      });
    }
  };
  const [isDeclineRemarkModalOpen, setIsDeclineRemarkModalOpen] =
    useState(false);
  const [declineUserId, setDeclineUserId] = useState();
  const handleAddDeclineRemark = (user_id) => {
    setDeclineUserId(user_id);
    setIsDeclineRemarkModalOpen(true);
  };

  const openPdf = (fileUrl) => {
    if (fileUrl) {
      window.open(`${api}${fileUrl}`, "_blank");
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
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          statusClasses[status] || statusClasses.default
        }`}
      >
        {statusText[status] || statusText.default}
      </span>
    );
  };

  let filteredList = users?.filter((user) =>
    ["user_email", "user_provider_no"].some((key) =>
      user[key]?.toString().toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const [sortConfig, setSortConfig] = useState({ key: "", direction: "asc" });

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

  // Function to render sort indicator
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

  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

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
            {/* Left Section: Title, Search, Refresh */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-5 w-full sm:w-auto">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">
                W9 Validation Panel
              </h2>
              <div className="flex justify-between gap-4 items-center w-full md:w-auto">
                <div className="w-full sm:w-auto">
                  <input
                    type="text"
                    placeholder="Search Email or Provider No."
                    className="border border-gray-300 w-full sm:w-auto px-4 placeholder:text-sm py-1 rounded-full text-sm"
                    onChange={(e) => setSearchQuery(e.target.value)}
                    value={searchQuery}
                  />
                </div>
                <button
                  className="text-teal-500 hover:text-teal-700 text-sm sm:w-28"
                  onClick={() => fetchAllUsers()}
                >
                  <i className="fa-solid fa-clock-rotate-left mr-1"></i> Refresh
                </button>
              </div>
            </div>

            {/* Right Section: User Info */}
            <div className="flex items-center gap-3 mt-3 md:mt-0">
              <h3 className="font-inter text-sm text-black">
                Welcome, {user?.email}!
              </h3>
              <img
                src="/images/Header/img-11.png"
                alt="Profile"
                className="w-8 sm:w-10"
                aria-label="User profile"
              />
              <div onClick={() => handleLogout()}>
                <img
                  className="w-5 sm:w-6 cursor-pointer"
                  src="/images/Header/Vector.png"
                  alt="Logout"
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="bg-white shadow-sm rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      File
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Decline Remark
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredList.length === 0 ? (
                    <tr>
                      <td
                        colSpan="6"
                        className="px-6 py-4 text-center text-gray-500"
                      >
                        No users found with W9 submissions
                      </td>
                    </tr>
                  ) : (
                    sortedData?.reverse().map((user) => (
                      <tr
                        key={user.user_id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.user_id}
                        </td>
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
                          {user.uploaded_at.toLocaleString().split("T")?.[0]}
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
                                  handleStatusChange(user.user_id, "approved")
                                }
                                disabled={
                                  actionLoading.approve === user.user_id
                                }
                                className={`inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-75 disabled:cursor-not-allowed ${
                                  actionLoading.decline === user.user_id
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
                                onClick={() =>
                                  handleAddDeclineRemark(
                                    user.user_id,
                                    "declined"
                                  )
                                }
                                disabled={
                                  actionLoading.decline === user.user_id
                                }
                                className={`inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-75 disabled:cursor-not-allowed ${
                                  actionLoading.approve === user.user_id
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
                          {user.status.decline_remark || "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>{" "}
      <div className="">
        <DeclineRemarkModal
          isOpen={isDeclineRemarkModalOpen}
          onClose={() => setIsDeclineRemarkModalOpen(false)}
          onDecline={(userId, status, remark) =>
            handleStatusChange(userId, status, remark)
          }
          userId={declineUserId}
        />
      </div>
    </div>
  );
};

export default AdminValidations;
