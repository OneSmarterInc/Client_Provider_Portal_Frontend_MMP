import React, { useEffect, useState, useContext } from "react";
import MyContext from "../ContextApi/MyContext";
import backgroundImage from "../assets/image.png";
import { useNavigate } from "react-router-dom";

export default function AdminNewProviderAdd() {
  const { api } = useContext(MyContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [actionLoading, setActionLoading] = useState({
    approve: null,
    decline: null,
  });

  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineRemark, setDeclineRemark] = useState("");
  const [selectedDeclineId, setSelectedDeclineId] = useState(null);

  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedApproveId, setSelectedApproveId] = useState(null);
  const [activeTab, setActiveTab] = useState("requests"); // "requests" | "approved"

  const admin_token = localStorage.getItem("authToken");

  // Helper function to combine address fields
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

  // Fetch pending providers
  const fetchPending = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${api}/new/provider/admin/pending/`, {
        headers: { Authorization: `Token ${admin_token}` },
      });

      const data = await res.json();
      setUsers(data?.pending_providers || []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  // Approve or Decline Provider
  const handleAction = async (id, type, decline_remark = "") => {
    try {
      setActionLoading((prev) => ({ ...prev, [type]: id }));

      const res = await fetch(`${api}/new/provider/admin/approve/${id}/`, {
        method: "POST",
        headers: {
          Authorization: `Token ${admin_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: type,
          decline_remark,
        }),
      });

      if (res.ok) {
        fetchPending();
      } else {
        console.log(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading({ approve: null, decline: null });
    }
  };

  // Open Approve Modal
  const openApproveModal = (id) => {
    setSelectedApproveId(id);
    setShowApproveModal(true);
  };

  // Confirm Approve
  const confirmApprove = async () => {
    await handleAction(selectedApproveId, "approved");
    setShowApproveModal(false);
  };

  // Open Decline Modal
  const openDeclineModal = (id) => {
    setSelectedDeclineId(id);
    setDeclineRemark("");
    setShowDeclineModal(true);
  };

  // Confirm Decline
  const confirmDecline = async () => {
    if (!declineRemark.trim()) {
      alert("Please enter a decline remark.");
      return;
    }

    await handleAction(selectedDeclineId, "declined", declineRemark);
    setShowDeclineModal(false);
  };

  useEffect(() => {
    fetchPending();
  }, []);

  return (
    <div
      style={{ backgroundImage: `url(${backgroundImage})` }}
      className="min-h-screen bg-gray-100 p-6 text-[#0486A5]"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <h1 className="text-2xl font-semibold text-start">
            New Provider Registration Requests
          </h1>
          {/* Tabs */}
          <div className="flex gap-1 bg-gray-200 rounded-full p-1">
            <button
              onClick={() => setActiveTab("requests")}
              className={`px-4 py-1 text-xs font-medium rounded-full transition-colors ${
                activeTab === "requests"
                  ? "bg-cyan-600 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Pending Requests
              {users?.filter((u) => u.new_provider_status === "pending").length > 0 && (
                <span className="ml-1 bg-red-500 text-white text-[10px] rounded-full px-1.5 py-0.5">
                  {users.filter((u) => u.new_provider_status === "pending").length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("approved")}
              className={`px-4 py-1 text-xs font-medium rounded-full transition-colors ${
                activeTab === "approved"
                  ? "bg-cyan-600 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Approved / Declined
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fetchPending()}
            className="p-1 text-sm text-teal-500 hover:text-teal-700 px-2"
          >
            <i className="fa-solid fa-clock-rotate-left mr-1"></i> Refresh
          </button>
          <button
            onClick={() => navigate("/admin")}
            className="p-1 text-sm bg-cyan-600 text-white px-2 rounded-md hover:bg-cyan-700"
          >
            Back to admin
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-lg font-medium">Loading...</div>
      ) : users.filter((item) => {
          if (activeTab === "requests") return item.new_provider_status === "pending";
          if (activeTab === "approved") return item.new_provider_status === "approved" || item.new_provider_status === "declined";
          return true;
        }).length === 0 ? (
        <div className="text-center text-lg font-medium">
          {activeTab === "requests"
            ? "No pending provider registration requests."
            : "No approved/declined provider requests found."}
        </div>
      ) : (
        <div className="overflow-x-auto shadow-sm border border-gray-300 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#0486A5] text-white text-xs">
              <tr>
                <th className="p-3">Provider No. #</th>
                <th className="p-3">Name & Email</th>
                <th className="p-3">Full Address</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-center">W9 Form</th>
                <th className="p-3 text-center">Actions</th>
                <th className="p-3 text-center">Decline Remark</th>
              </tr>
            </thead>

            <tbody>
              {users.filter((item) => {
                if (activeTab === "requests") return item.new_provider_status === "pending";
                if (activeTab === "approved") return item.new_provider_status === "approved" || item.new_provider_status === "declined";
                return true;
              }).map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-gray-200 hover:bg-gray-50"
                >
                  <td className="p-3 font-bold text-[#0486A5]">
                    #{item.PRNUM}
                  </td>

                  <td className="p-3">
                    <p>
                      <strong>Name:</strong> {item.provider_name}
                    </p>
                    <p>
                      <strong>Email:</strong> {item.provider_email}
                    </p>
                  </td>

                  <td className="p-3">
                    <p className="text-sm">
                      {" "}
                      <strong className="">Address:</strong>{" "}
                      {getFullAddress(item)}
                    </p>
                    <p className="text-sm">
                      <strong>Title:</strong> {item?.PRTITL || "-"}
                    </p>
                    <p className="text-sm">
                      <strong>Description:</strong> {item?.description || "-"}
                    </p>
                  </td>

                  <td className="p-3">
                    <span
                      className={
                        item.new_provider_status === "approved"
                          ? "text-green-600 font-semibold"
                          : item.new_provider_status === "declined"
                          ? "text-red-600 font-semibold"
                          : "text-yellow-600 font-semibold"
                      }
                    >
                      {item.new_provider_status}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    {item.w9Form_url && (
                      <a
                        href={item.w9Form_url}
                        target="_blank"
                        className="text-blue-600 underline text-xs block"
                      >
                        Download
                      </a>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {item.new_provider_status === "pending" ? (
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => openApproveModal(item.id)}
                          className="px-3 text-xs py-1 border border-[#0486A5] text-[#0486A5] rounded-lg hover:bg-[#0486A5] hover:text-white transition"
                        >
                          Approve
                        </button>

                        <button
                          onClick={() => openDeclineModal(item.id)}
                          className="px-3 text-xs py-1 border border-red-500 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition"
                        >
                          Decline
                        </button>
                      </div>
                    ) : (
                      <p>-</p>
                    )}
                  </td>
                  <td className="p-3 text-center w-40">
                    {item?.decline_remark || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* APPROVE MODAL */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-4 text-[#0486A5]">
              Confirm Approval
            </h2>
            <p className="mb-4 text-sm">
              Are you sure you want to approve this provider?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowApproveModal(false)}
                disabled={actionLoading.approve !== null}
                className="px-4 py-2 rounded-xl border border-gray-400 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={confirmApprove}
                disabled={actionLoading.approve !== null}
                className={`px-4 py-2 rounded-xl text-white ${
                  actionLoading.approve !== null
                    ? "bg-green-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {actionLoading.approve !== null ? "Approving..." : "Confirm Approve"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DECLINE MODAL */}
      {showDeclineModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-[#0486A5]">
              Decline Provider
            </h2>

            <textarea
              value={declineRemark}
              onChange={(e) => setDeclineRemark(e.target.value)}
              placeholder="Enter reason for decline..."
              className="w-full border border-gray-300 rounded-lg p-3 h-28 mb-4 focus:outline-none focus:ring focus:ring-[#0486A5]"
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeclineModal(false)}
                disabled={actionLoading.decline !== null}
                className="px-4 py-2 rounded-xl border border-gray-400 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={confirmDecline}
                disabled={actionLoading.decline !== null}
                className={`px-4 py-2 rounded-xl text-white ${
                  actionLoading.decline !== null
                    ? "bg-red-300 cursor-not-allowed"
                    : "bg-red-500 hover:bg-red-600"
                }`}
              >
                {actionLoading.decline !== null ? "Declining..." : "Confirm Decline"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
