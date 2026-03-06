import React, { useState } from "react";
import { Loader2 } from "lucide-react";

const NpiSelectionTable = ({
  npis = [],
  selectedNpi,
  onSelectionChange,
  onAddNpi,
  onUploadW9,
  loading = false,
  addingNpi = false,
  alreadyRegisteredNpis = [],
  compact = false,
}) => {
  const [editingIdx, setEditingIdx] = useState(null);
  const [inlineNpiValue, setInlineNpiValue] = useState("");
  const [showNewNpiRow, setShowNewNpiRow] = useState(false);
  const [newNpiValue, setNewNpiValue] = useState("");
  const [newSeqValue, setNewSeqValue] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newAddress1, setNewAddress1] = useState("");
  const [newAddress2, setNewAddress2] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newState, setNewState] = useState("");
  const [newZip, setNewZip] = useState("");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6 text-gray-500 text-sm">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading NPIs...
      </div>
    );
  }

  if (!npis || npis.length === 0) {
    return (
      <div className="py-4">
        <p className="text-gray-500 text-sm text-center">No entries found for this Tax ID</p>
      </div>
    );
  }

  const isAlreadyRegistered = (npi) =>
    alreadyRegisteredNpis.some((r) => r === npi);

  const formatAddress = (entry) => {
    const parts = [entry.address_line1, entry.address_line2, entry.address_line3, entry.address_line4].filter(Boolean);
    return parts.join(", ") || "-";
  };

  const formatLocation = (entry) => {
    const parts = [];
    if (entry.city) parts.push(entry.city);
    if (entry.state) parts.push(entry.state);
    const zip = [entry.zip5, entry.zip4].filter(Boolean).join("-");
    if (zip) parts.push(zip);
    return parts.join(", ") || "-";
  };

  const hasAnyNpi = npis.some((e) => e.npi && e.npi.trim());
  const colCount = hasAnyNpi ? 8 : 7;

  const handleInlineAdd = async (sequenceNumber) => {
    if (inlineNpiValue.trim() && onAddNpi) {
      try {
        await onAddNpi(inlineNpiValue.trim(), sequenceNumber);
        setEditingIdx(null);
        setInlineNpiValue("");
      } catch (e) {
        // Keep editing state open so user can retry
      }
    }
  };

  return (
    <div className="w-full">
      <div className={`overflow-auto border border-gray-200 rounded-lg ${compact ? "max-h-48" : "max-h-72"}`}>
        <table className="w-full text-xs">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              {hasAnyNpi && <th className="px-2 py-2 text-left font-medium text-gray-600 w-8"></th>}
              <th className="px-2 py-2 text-left font-medium text-gray-600">Seq#</th>
              <th className="px-2 py-2 text-left font-medium text-gray-600">NPI</th>
              <th className="px-2 py-2 text-left font-medium text-gray-600">Title</th>
              <th className="px-2 py-2 text-left font-medium text-gray-600">Address</th>
              <th className="px-2 py-2 text-left font-medium text-gray-600">City/State/ZIP</th>
              <th className="px-2 py-2 text-left font-medium text-gray-600">W9</th>
              <th className="px-2 py-2 text-left font-medium text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {npis.map((entry, idx) => {
              const hasNpi = entry.npi && entry.npi.trim();
              const portalStatus = entry.portal_status; // 'pending' or 'approved' if NPI came from portal
              const npiFromPortal = !!portalStatus;
              const registered = hasNpi && isAlreadyRegistered(entry.npi);
              const registeredByUser = hasNpi && entry.is_registered_by_user;
              const registeredByOthers = hasNpi && entry.is_registered_by_others && !registeredByUser;
              const disabled = !hasNpi || registered || registeredByUser || npiFromPortal;
              const isSelected = hasNpi && !npiFromPortal && selectedNpi === entry.npi;
              const needsNpi = !hasNpi && !npiFromPortal;
              const isEditing = needsNpi && editingIdx === idx;

              return (
                <React.Fragment key={hasNpi ? `${entry.npi}-${idx}` : `empty-${idx}`}>
                  <tr
                    className={`transition-colors ${
                      needsNpi
                        ? isEditing
                          ? "bg-orange-50"
                          : "bg-orange-50/50 cursor-pointer hover:bg-orange-100/50"
                        : npiFromPortal
                        ? portalStatus === "pending"
                          ? "bg-yellow-50/50"
                          : "bg-gray-50 opacity-70"
                        : disabled
                        ? "bg-gray-50 opacity-60 cursor-not-allowed"
                        : isSelected
                        ? "bg-blue-50 border-l-2 border-l-[#0486A5] cursor-pointer"
                        : "hover:bg-gray-50 cursor-pointer"
                    }`}
                    onClick={() => {
                      if (hasNpi && !disabled) {
                        onSelectionChange(entry.npi);
                      } else if (needsNpi && editingIdx !== idx) {
                        setEditingIdx(idx);
                        setInlineNpiValue("");
                      }
                    }}
                  >
                    {hasAnyNpi && (
                      <td className="px-2 py-2">
                        {hasNpi && !npiFromPortal ? (
                          <input
                            type="radio"
                            name="npi-selection"
                            checked={isSelected}
                            disabled={disabled}
                            onChange={() => {
                              if (!disabled) onSelectionChange(entry.npi);
                            }}
                            className="accent-[#0486A5]"
                          />
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                    )}
                    <td className="px-2 py-2 text-gray-500">{entry.sequence_number || "-"}</td>
                    <td className="px-2 py-2 font-mono whitespace-nowrap">
                      {hasNpi ? (
                        <span className={npiFromPortal ? "text-gray-500" : ""}>
                          {entry.npi}
                        </span>
                      ) : (
                        <span className="text-orange-500 font-sans italic">
                          NPI Needed
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">{entry.title || "-"}</td>
                    <td className="px-2 py-2 max-w-[150px] truncate" title={formatAddress(entry)}>
                      {formatAddress(entry)}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">{formatLocation(entry)}</td>
                    <td className="px-2 py-2">
                      {entry.w9_status === "W9_form_uploaded" ? (
                        <span className="inline-block px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700">
                          Uploaded
                        </span>
                      ) : entry.w9_status === "W9_in_progress" ? (
                        <span className="inline-block px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-700">
                          In Review
                        </span>
                      ) : onUploadW9 && hasNpi && (registeredByUser || registered || (npiFromPortal && portalStatus === "approved")) ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); onUploadW9(entry.npi); }}
                          className="inline-block px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-orange-400 text-white hover:bg-orange-500 cursor-pointer"
                        >
                          Upload W9
                        </button>
                      ) : (
                        <span className="inline-block px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-yellow-100 text-yellow-700">
                          Needed
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-2">
                      {needsNpi ? (
                        isEditing ? (
                          <span className="inline-block px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-600">
                            Editing
                          </span>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditingIdx(idx); setInlineNpiValue(""); }}
                            className="inline-block px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-[#0486A5] text-white hover:bg-[#047B95] cursor-pointer"
                          >
                            + Add NPI
                          </button>
                        )
                      ) : npiFromPortal ? (
                        portalStatus === "pending" ? (
                          <span className="inline-block px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-yellow-100 text-yellow-700">
                            Pending Approval
                          </span>
                        ) : (
                          <span className="inline-block px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-gray-200 text-gray-600">
                            Registered
                          </span>
                        )
                      ) : registeredByUser || registered ? (
                        <span className="inline-block px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-gray-200 text-gray-600">
                          Registered
                        </span>
                      ) : registeredByOthers ? (
                        <span
                          className="inline-block px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-600 cursor-help"
                          title={`Registered by: ${entry.registered_emails?.join(", ") || "other accounts"}`}
                        >
                          Other accounts
                        </span>
                      ) : (
                        <span className="inline-block px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700">
                          Available
                        </span>
                      )}
                    </td>
                  </tr>

                  {/* Inline NPI entry sub-row for "NPI Needed" entries */}
                  {isEditing && (
                    <tr className="bg-orange-50/70">
                      <td colSpan={colCount} className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-600">
                            Enter NPI for Seq# {entry.sequence_number || idx + 1}:
                          </span>
                          <input
                            type="text"
                            value={inlineNpiValue}
                            onChange={(e) => setInlineNpiValue(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter" && !addingNpi) handleInlineAdd(entry.sequence_number); }}
                            placeholder="Enter NPI"
                            className="border border-gray-300 rounded px-2 py-1 text-xs w-32 focus:border-[#0486A5] focus:outline-none disabled:bg-gray-100"
                            autoFocus
                            disabled={addingNpi}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <button
                            onClick={() => handleInlineAdd(entry.sequence_number)}
                            disabled={addingNpi || !inlineNpiValue.trim()}
                            className="bg-[#0486A5] hover:bg-[#047B95] text-white px-2.5 py-1 rounded text-xs disabled:opacity-50 flex items-center gap-1"
                          >
                            {addingNpi ? (
                              <>
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Adding...
                              </>
                            ) : "Add"}
                          </button>
                          <button
                            onClick={() => { setEditingIdx(null); setInlineNpiValue(""); }}
                            disabled={addingNpi}
                            className="text-gray-400 hover:text-gray-600 text-xs disabled:opacity-30"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}

          </tbody>
        </table>
      </div>

      {/* Add New NPI - outside scrollable table */}
      {showNewNpiRow ? (
        <div className="mt-3 border border-blue-200 rounded-lg bg-blue-50/50 p-3 space-y-2">
          <span className="text-xs font-semibold text-gray-700">Add New NPI Entry</span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div>
              <label className="block text-[10px] text-gray-500 mb-0.5">NPI *</label>
              <input type="text" value={newNpiValue} onChange={(e) => setNewNpiValue(e.target.value)} placeholder="NPI Number" className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:border-[#0486A5] focus:outline-none disabled:bg-gray-100" autoFocus disabled={addingNpi} />
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 mb-0.5">Seq #</label>
              <input type="text" value={newSeqValue} onChange={(e) => setNewSeqValue(e.target.value)} placeholder="Optional" className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:border-[#0486A5] focus:outline-none disabled:bg-gray-100" disabled={addingNpi} />
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 mb-0.5">Title</label>
              <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Provider Title" className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:border-[#0486A5] focus:outline-none disabled:bg-gray-100" disabled={addingNpi} />
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 mb-0.5">Address Line 1</label>
              <input type="text" value={newAddress1} onChange={(e) => setNewAddress1(e.target.value)} placeholder="Street Address" className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:border-[#0486A5] focus:outline-none disabled:bg-gray-100" disabled={addingNpi} />
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 mb-0.5">Address Line 2</label>
              <input type="text" value={newAddress2} onChange={(e) => setNewAddress2(e.target.value)} placeholder="Suite, Unit, etc." className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:border-[#0486A5] focus:outline-none disabled:bg-gray-100" disabled={addingNpi} />
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 mb-0.5">City</label>
              <input type="text" value={newCity} onChange={(e) => setNewCity(e.target.value)} placeholder="City" className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:border-[#0486A5] focus:outline-none disabled:bg-gray-100" disabled={addingNpi} />
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 mb-0.5">State</label>
              <input type="text" value={newState} onChange={(e) => setNewState(e.target.value)} placeholder="State" className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:border-[#0486A5] focus:outline-none disabled:bg-gray-100" disabled={addingNpi} />
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 mb-0.5">ZIP Code</label>
              <input type="text" value={newZip} onChange={(e) => setNewZip(e.target.value)} placeholder="ZIP" className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:border-[#0486A5] focus:outline-none disabled:bg-gray-100" disabled={addingNpi} />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={async () => {
                if (newNpiValue.trim() && onAddNpi) {
                  try {
                    await onAddNpi(newNpiValue.trim(), newSeqValue.trim(), {
                      title: newTitle.trim(),
                      address_line1: newAddress1.trim(),
                      address_line2: newAddress2.trim(),
                      city: newCity.trim(),
                      state: newState.trim(),
                      zip_code: newZip.trim(),
                    });
                    setNewNpiValue(""); setNewSeqValue(""); setNewTitle(""); setNewAddress1(""); setNewAddress2(""); setNewCity(""); setNewState(""); setNewZip(""); setShowNewNpiRow(false);
                  } catch {}
                }
              }}
              disabled={addingNpi || !newNpiValue.trim()}
              className="bg-[#0486A5] hover:bg-[#047B95] text-white px-3 py-1.5 rounded text-xs disabled:opacity-50 flex items-center gap-1"
            >
              {addingNpi ? (<><Loader2 className="h-3 w-3 animate-spin" /> Adding...</>) : "Add NPI"}
            </button>
            <button
              onClick={() => { setShowNewNpiRow(false); setNewNpiValue(""); setNewSeqValue(""); setNewTitle(""); setNewAddress1(""); setNewAddress2(""); setNewCity(""); setNewState(""); setNewZip(""); }}
              disabled={addingNpi}
              className="text-gray-400 hover:text-gray-600 text-xs disabled:opacity-30"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowNewNpiRow(true)}
          className="mt-2 flex items-center gap-1.5 text-xs text-[#0486A5] font-medium hover:text-[#047B95]"
        >
          <span className="w-4 h-4 rounded-full bg-[#0486A5] text-white text-[10px] flex items-center justify-center font-bold">+</span>
          Add New NPI
        </button>
      )}

      {/* Actions below table */}
      <div className="mt-3 flex flex-col gap-2">
        {/* Add selected NPI button — only if there are selectable NPIs */}
        {hasAnyNpi && selectedNpi && (
          <button
            onClick={async () => {
              if (onAddNpi) {
                const entry = npis.find((e) => e.npi === selectedNpi);
                try {
                  await onAddNpi(selectedNpi, entry?.sequence_number);
                } catch (e) {
                  // Error handled by parent toast
                }
              }
            }}
            disabled={addingNpi}
            className="bg-[#0486A5] hover:bg-[#047B95] text-white px-4 py-2 rounded text-sm disabled:opacity-50 self-end flex items-center gap-2"
          >
            {addingNpi ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : "Add Selected NPI"}
          </button>
        )}
      </div>
    </div>
  );
};

export default NpiSelectionTable;
