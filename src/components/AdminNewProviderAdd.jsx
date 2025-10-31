import React, { useEffect, useState, useContext } from "react";
import MyContext from "../ContextApi/MyContext";
import backgroundImage from "../assets/image.png";

export default function AdminNewProviderAdd() {
  const { api } = useContext(MyContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const [actionLoading, setActionLoading] = useState({
    approve: null,
    decline: null,
  });

  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineRemark, setDeclineRemark] = useState("");
  const [selectedDeclineId, setSelectedDeclineId] = useState(null);

  const admin_token = localStorage.getItem("authToken");

  // Fetch all pending providers
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
        body: JSON.stringify({ action: type, decline_remark }), 
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

  // When "Decline" clicked → open modal
  const openDeclineModal = (id) => {
    setSelectedDeclineId(id);
    setDeclineRemark("");
    setShowDeclineModal(true);
  };

  // Confirm decline with remark
  const confirmDecline = () => {
    if (!declineRemark.trim()) {
      alert("Please enter a decline remark.");
      return;
    }

    handleAction(selectedDeclineId, "declined", declineRemark);
    setShowDeclineModal(false);
  };

  useEffect(() => {
    fetchPending();
  }, []);

  return (
    <div
      style={{
        backgroundImage: `url(${backgroundImage})`,
      }}
      className="min-h-screen bg-gray-100 p-6 text-[#0486A5]"
    >
      <h1 className="text-3xl font-bold mb-6 text-center">
        Pending Provider Approvals
      </h1>

      {loading ? (
        <div className="text-center text-lg">Loading...</div>
      ) : users.length === 0 ? (
        <div className="text-center text-lg">No pending providers found</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-6 shadow-xl border border-gray-200"
            >
              <h2 className="text-xl font-bold mb-2 text-[#0486A5]">
                Provider No #{item.PRNUM}
              </h2>
              <p className="text-sm">
                <strong>Provider Name:</strong> {item.provider_name}
              </p>
              <p className="text-sm">
                <strong>Provider Email:</strong> {item.provider_email}
              </p>
              <p className="text-sm">
                <strong>Address 1:</strong> {item.PRADR1}
              </p>
              {item.PRADR2 && (
                <p className="text-sm">
                  <strong>Address 2:</strong> {item.PRADR2}
                </p>
              )}
              {item.PRADR3 && (
                <p className="text-sm">
                  <strong>Address 3:</strong> {item.PRADR3}
                </p>
              )}
              {item.PRADR4 && (
                <p className="text-sm">
                  <strong>Address 4:</strong> {item.PRADR4}
                </p>
              )}

              <p className="text-sm">
                <strong>City:</strong> {item.PRCITY}
              </p>
              <p className="text-sm">
                <strong>State:</strong> {item.PRST}
              </p>

              <p className="text-sm">
                <strong>ZIP:</strong> {item.PRZIP5}
                {item.PRZIP4 ? ` - ${item.PRZIP4}` : ""}
                {item.PRZIP2 ? ` (${item.PRZIP2})` : ""}
              </p>

              <p className="text-sm">
                <strong>Title:</strong> {item.PRTITL}
              </p>

              <p className="text-sm mt-2">
                <strong>Status: </strong>
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
              </p>

              {item.w9Form_url && (
                <a
                  href={item.w9Form_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block mt-3 text-sm underline text-blue-600"
                >
                  Download W-9 Form
                </a>
              )}

              {/* Approve / Decline Buttons */}
              {item.new_provider_status === "pending" && (
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => handleAction(item.id, "approved")}
                    className="flex-1 px-4 py-2 rounded-xl border border-[#0486A5] text-[#0486A5] hover:bg-[#0486A5] hover:text-white transition"
                  >
                    {actionLoading.approve === item.id
                      ? "Approving..."
                      : "Approve"}
                  </button>

                  <button
                    onClick={() => openDeclineModal(item.id)}
                    className="flex-1 px-4 py-2 rounded-xl border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition"
                  >
                    Decline
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* DECLINE REMARK MODAL */}
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
            ></textarea>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeclineModal(false)}
                className="px-4 py-2 rounded-xl border border-gray-400 text-gray-600 hover:bg-gray-200"
              >
                Cancel
              </button>

              <button
                onClick={confirmDecline}
                className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600"
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
