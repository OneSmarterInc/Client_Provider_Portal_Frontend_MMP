import React, { useState } from "react";

const DeclineRemarkModal = ({ isOpen, onClose, onDecline, userId }) => {
  const [remark, setRemark] = useState("");

  const handleDecline = () => {
    onDecline(userId, "declined", remark);
    setRemark("");
    onClose();
  };

  const handleCancel = () => {
    setRemark("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm bg-opacity-40 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Decline Remark
        </h2>

        <textarea
          className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-red-400"
          rows="4"
          placeholder="Enter decline reason..."
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
        />

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={handleCancel}
            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleDecline}
            className="px-4 py-2 rounded-lg cursor-pointer bg-red-500 hover:bg-red-600 text-white"
            disabled={!remark.trim()}
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeclineRemarkModal;
