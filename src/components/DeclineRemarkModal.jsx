import React, { useState } from "react";

const DeclineRemarkModal = ({ isOpen, onClose, onDecline }) => {
  const [remark, setRemark] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDecline = async () => {
    setIsSubmitting(true);
    try {
      await onDecline(remark);
      setRemark("");
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setRemark("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Decline Remark
        </h2>

        <textarea
          className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-red-400"
          rows="4"
          placeholder="Enter decline reason (optional)..."
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          disabled={isSubmitting}
        />

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={handleCancel}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDecline}
            disabled={isSubmitting}
            className={`px-4 py-2 rounded-lg text-white ${
              isSubmitting
                ? "bg-red-300 cursor-not-allowed"
                : "bg-red-500 hover:bg-red-600"
            }`}
          >
            {isSubmitting ? "Declining..." : "Decline"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeclineRemarkModal;
