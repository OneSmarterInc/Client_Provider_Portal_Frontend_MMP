import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import MyContext from "../../ContextApi/MyContext";
import * as XLSX from "xlsx";
import { useLocation, useNavigate, useParams } from "react-router-dom";

const TotalClaimsInfo = ({
  claim_no,
  isOpen,
  setIsTotalClaimModalOpen,
  selectedClaim,
  selectedMember,
}) => {
  const { api } = useContext(MyContext);

  const [isExpand, setExpand] = useState(false);
  const { claim_no_from_params } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const onExpand = () => {
    setExpand(!isExpand);
    window.open(`/#/total-claims-info/${claim_no}`, "_blank");
  };

  // Combined selectedClaim and selectedMember into a single object
  const selectedData = {
    ...selectedClaim,
    ...selectedMember,
  };

  useEffect(() => {
    if (selectedClaim && selectedMember) {
      localStorage.setItem(
        `selectedData_for_total_claim_${claim_no}`,
        JSON.stringify(selectedData)
      );
    }
  }, [selectedClaim, selectedMember, claim_no]);

  const selectedData_from_local = JSON.parse(
    localStorage.getItem(`selectedData_for_total_claim_${claim_no_from_params}`)
  );

  const [claimData, setClaimData] = useState(selectedClaim);

  const formatDOB = (data) => {
    if (data?.emdobm && data?.emdobd && data?.emdoby) {
      return `${data.emdobm}-${data.emdobd}-${data.emdoby}`;
    } else if (data?.dpdobm && data?.dpdobd && data?.dpdoby) {
      return `${data.dpdobm}-${data.dpdobd}-${data.dpdoby}`;
    }
    return "";
  };

  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `${api}/portal/get_claim_no_data?claim_no=${
          claim_no_from_params ? claim_no_from_params : claim_no
        }`
      );
      setTableData(response.data?.data || []);
    } catch (err) {
      setError("Failed to fetch data. Please try again.");
    }
    setLoading(false);
  };

  const handleDownloadExcel = () => {
    const headers = [
      "From Date",
      "To Date",
      "Units",
      "Benefit Code",
      "A/P",
      "CPT#",
      "MOD",
      "Charges",
      "Amount Paid",
      "Not Paid",
    ];

    const data = tableData?.map((data) => [
      data?.["FROM DATE"] || "",
      data?.["TO DATE"] || "",
      data?.CDSRVP || "",
      data?.CDBNCD?.trim() || "",
      `${data?.CDAPTC || "0.00"}`,
      data?.["CDCPT#"],
      data?.CDCPTM,
      data?.CDCHG$,
      data?.CDPAY$,
      `${data?.CDCHG$ - data?.CDPAY$ || "0.00"}`,
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Total Claims Report");
    XLSX.writeFile(wb, "Total_Claims_Report.xlsx");
  };

  const clearSelectedData_from_local = () => {
    localStorage.removeItem(
      `selectedData_for_total_claim_${claim_no_from_params}`
    );
    navigate("/dashboard");
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div
          className={`bg-white rounded-lg shadow-lg  w-full p-5 ${
            location.pathname !== `/dashboard`
              ? " w-screen h-screen"
              : " max-w-5xl"
          }`}
        >
          {/* Modal Header */}
          <div className="flex justify-between items-center border-b pb-3">
            <h2 className="text-lg font-semibold text-[#0486A5]">
              Total Claims Table
            </h2>
            <div className="flex space-x-3">
              <button
                onClick={handleDownloadExcel}
                className=" text-[#036880] px-3  transition text-2xl"
              >
                <i class="fa-solid fa-file-arrow-down"></i>
              </button>{" "}
              {location.pathname !==
                `/total-claims-info/${claim_no_from_params}` && (
                <button
                  onClick={() => setIsTotalClaimModalOpen(false)}
                  className="text-gray-500 hover:text-red-600 transition"
                >
                  <i className="fa-regular fa-circle-xmark  text-2xl text-[#0486A5] hover:text-red-500"></i>
                </button>
              )}
              {location.pathname ===
                `/total-claims-info/${claim_no_from_params}` && (
                <button
                  onClick={() => clearSelectedData_from_local()}
                  className="text-red-600 transition flex items-center justify-center gap-3"
                >
                  <i className="fa-regular fa-circle-xmark  text-2xl text-[#0486A5] hover:text-red-500"></i>{" "}
                  Close
                </button>
              )}
              {location.pathname !==
                `/total-claims-info/${claim_no_from_params}` && (
                <button
                  onClick={() => onExpand()}
                  className="text-gray-500 text-xl"
                >
                  <i class="fa-solid fa-up-right-and-down-left-from-center text-xl text-[#0486A5]"></i>
                </button>
              )}
            </div>
          </div>
          <div className="w-full bg-[#0486A5] text-white text-xs px-10 p-0.5 text-center font-semibold">
            {" "}
            Details
          </div>
          <div className="viewdetails px-10 border-b-2 pb-3">
            {" "}
            <div className="text-xs grid grid-cols-4 my-2 gap-2  ">
              <p className="text-xs text-gray-600 ">
                <strong>Diagnosis Codes:</strong>{" "}
                {(() => {
                  const codes = [
                    selectedData_from_local?.CHDIAG
                      ? selectedData_from_local?.CHDIAG
                      : claimData?.CHDIAG,
                    selectedData_from_local?.CHDIA2
                      ? selectedData_from_local?.CHDIA2
                      : claimData?.CHDIA2,
                    selectedData_from_local?.CHDIA3
                      ? selectedData_from_local?.CHDIA3
                      : claimData?.CHDIA3,
                    selectedData_from_local?.CHDIA4
                      ? selectedData_from_local?.CHDIA4
                      : claimData?.CHDIA4,
                    selectedData_from_local?.CHDIA5
                      ? selectedData_from_local?.CHDIA5
                      : claimData?.CHDIA5,
                  ].filter((code) => code?.trim()); // Remove empty or null values

                  return codes.length > 0 ? codes.join(", ") : "";
                })()}
              </p>
              <p className="text-gray-600">
                <span className="font-semibold">Patient ID:</span>{" "}
                {selectedData_from_local?.CHPATI
                  ? selectedData_from_local?.CHPATI
                  : claimData?.CHPATI || ""}
              </p>{" "}
              <p className="text-gray-600">
                <span className="font-semibold">Receipt Date:</span>{" "}
                {selectedData_from_local?.["Receipt Date"]
                  ? selectedData_from_local?.["Receipt Date"]
                  : claimData?.["Receipt Date"] || ""}
              </p>
            </div>
            <div className="grid grid-cols-4 gap-2 text-gray-600 mt-1 text-xs">
              <p>
                <span className="font-semibold">Member Name:</span>{" "}
                {selectedData_from_local?.memberName
                  ? selectedData_from_local?.memberName
                  : selectedMember?.memberName || ""}
              </p>
              <p>
                <span className="font-semibold">SSN:</span>{" "}
                {selectedMember?.emssn
                  ? selectedMember?.emssn
                  : selectedMember?.dpdssn}
                {selectedData_from_local?.emssn
                  ? selectedData_from_local?.emssn
                  : selectedData_from_local?.dpdssn || ""}
              </p>
              <p>
                <span className="font-semibold">Member ID:</span>{" "}
                {selectedData_from_local?.["emmem#"]
                  ? selectedData_from_local?.["emmem#"]
                  : selectedMember?.["emmem#"] || ""}
              </p>
              <p>
                <span className="font-semibold">DOB:</span>{" "}
                {formatDOB(
                  selectedData_from_local
                    ? selectedData_from_local
                    : selectedMember
                )}
              </p>
              <p>
                <span className="font-semibold">Claimed Amount:</span> $
                {selectedData_from_local?.CHCLM$
                  ? selectedData_from_local?.CHCLM$
                  : claimData?.CHCLM$ || "0.00"}
              </p>
              <p>
                <span className="font-semibold">Plan:</span>{" "}
                {selectedData_from_local?.CHPLAN
                  ? selectedData_from_local?.CHPLAN
                  : claimData?.CHPLAN || ""}{" "}
                | <span className="font-semibold">Type:</span>{" "}
                {selectedData_from_local?.CHCLTP
                  ? selectedData_from_local?.CHCLTP
                  : claimData?.CHCLTP || ""}{" "}
                | <span className="font-semibold">Class:</span>{" "}
                {selectedData_from_local?.CHBNFT
                  ? selectedData_from_local?.CHBNFT
                  : claimData?.CHBNFT || ""}
              </p>
              <p>
                <span className="font-semibold">Provider:</span>{" "}
                {selectedData_from_local?.CHPROV
                  ? selectedData_from_local?.CHPROV
                  : claimData?.CHPROV || ""}
              </p>

              <p>
                <span className="font-semibold">Primary Carrier:</span>{" "}
                {selectedData_from_local?.primaryCarrier
                  ? selectedData_from_local?.primaryCarrier
                  : claimData?.primaryCarrier || ""}
              </p>
              <p>
                <span className="font-semibold">Accident:</span>{" "}
                {selectedData_from_local?.accident
                  ? selectedData_from_local?.accident
                  : claimData?.accident || ""}
              </p>
              <p>
                <span className="font-semibold">Status:</span>{" "}
                {selectedData_from_local?.CHHDST
                  ? selectedData_from_local?.CHHDST
                  : claimData?.CHHDST || ""}
              </p>
              <p>
                <span className="font-semibold">Assign:</span>{" "}
                {selectedData_from_local?.CHEDI
                  ? selectedData_from_local?.CHEDI
                  : claimData?.CHEDI || ""}
              </p>
              <p>
                <span className="font-semibold">Prov Check#:</span>{" "}
                {selectedData_from_local?.provCheck
                  ? selectedData_from_local?.provCheck
                  : claimData?.provCheck || ""}
              </p>
              <p>
                <span className="font-semibold">Mem Check#:</span>{" "}
                {selectedData_from_local?.memCheck
                  ? selectedData_from_local?.memCheck
                  : claimData?.memCheck || ""}
              </p>
              <p>
                <span className="font-semibold">Subject:</span>{" "}
                {selectedData_from_local?.subject
                  ? selectedData_from_local?.subject
                  : claimData?.subject || ""}
              </p>
              <p>
                <span className="font-semibold">Allowable:</span>{" "}
                {selectedData_from_local?.allowable
                  ? selectedData_from_local?.allowable
                  : claimData?.allowable || ""}
              </p>
            </div>
          </div>

          {loading && (
            <p className="ml-2 p-3 font-medium text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse">
              Loading Table...
            </p>
          )}

          {/* Table Wrapper */}
          {tableData.length > 0 && (
            <div className="overflow-x-auto mt-4 h-96 overflow-y-scroll">
              {" "}
              <table className="w-full  border-gray-300 rounded-lg">
                <thead>
                  <tr className="bg-gray-100  text-gray-700 text-xs font-semibold">
                    <th className=" px-4 py-2">FROM DATE</th>
                    <th className=" px-4 py-2">TO DATE</th>
                    <th className=" px-4 py-2">Units</th>
                    <th className=" px-4 py-2">Benefit Code</th>
                    <th className=" px-4 py-2">A/P</th>
                    <th className=" px-4 py-2">CPT#</th>
                    <th className=" px-4 py-2">MOD</th>
                    <th className=" px-4 py-2">Charges</th>{" "}
                    <th className=" px-4 py-2">Amount Paid</th>
                    <th className=" px-4 py-2">Not Paid</th>
                  </tr>
                </thead>
                {loading && (
                  <p className="ml-2 p-3 font-medium text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse">
                    Loading...
                  </p>
                )}
                {!loading && (
                  <tbody>
                    {tableData.map((row, index) => (
                      <tr
                        key={index}
                        className="text-center text-xs border-b odd:bg-gray-50"
                      >
                        <td className=" px-4 py-2">{row["FROM DATE"]}</td>
                        <td className=" px-4 py-2">{row["TO DATE"]}</td>
                        <td className=" px-4 py-2">{row?.CDSRVP || "-"}</td>
                        <td className=" px-4 py-2">
                          {row?.CDBNCD.trim() ? row?.CDBNCD : "-"}
                        </td>
                        <td className=" px-4 py-2">{row?.CDAPTC || "-"}</td>
                        <td className=" px-4 py-2">{row["CDCPT#"] || "-"}</td>
                        <td className=" px-4 py-2">{row?.CDCPTM || "-"}</td>
                        <td className=" px-4 py-2">{row?.CDCHG$ || "-"}</td>
                        <td className=" px-4 py-2">{row?.CDPAY$ || "-"}</td>
                        <td className=" px-4 py-2">
                          {row?.CDCHG$ - row?.CDPAY$}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                )}
              </table>
            </div>
          )}

          {/* No Data Message */}
          {!loading && !error && tableData.length === 0 && (
            <p className="text-center py-4">No data available.</p>
          )}
        </div>
      </div>
    </>
  );
};

export default TotalClaimsInfo;
