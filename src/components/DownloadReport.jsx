import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import MyContext from "../../ContextApi/MyContext";
import { useLocation, useParams } from "react-router-dom";

const DownloadReport = ({ isOpen, setIsDownloadReportOpen, ssn }) => {
  const { api } = useContext(MyContext);
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [isExpand, setExpand] = useState(false);
  const { emssn_from_params } = useParams();
  const location = useLocation();
  const onExpand = () => {
    setExpand(!isExpand);
    window.open(`/#/download-report/${ssn}`, "_blank");
  };

  const [filters, setFilters] = useState({
    from_date: "",
    to_date: "",
    claim_no: "",
  });

  //  yyyy-mm-dd to mm/dd/yyyy
  const formatDateForAPI = (date) => {
    if (!date) return "";
    const [year, month, day] = date.split("-");
    return `${month}/${day}/${year}`;
  };

  const handleSearch = async () => {
    setLoading(true);
    setError(null);

    try {
      // Convert date format before appending to URL
      const formatDate = (date) => {
        if (!date) return "";
        const [year, month, day] = date.split("-");
        return `${month}/${day}/${year}`;
      };

      const fromDate = filters.from_date ? formatDate(filters.from_date) : "";
      const toDate = filters.to_date ? formatDate(filters.to_date) : "";
      const claimNo = filters.claim_no ? filters.claim_no : "";

      // to prevent automatic encoding
      const queryString = `ssn=${emssn_from_params ? emssn_from_params : ssn}${
        fromDate ? `&from_date=${fromDate}` : ""
      }${toDate ? `&to_date=${toDate}` : ""}${
        claimNo ? `&claim_no=${claimNo}` : ""
      }`;

      const response = await axios.get(
        `${api}/portal/download_claims_report?${queryString}`
      );

      setTableData(response.data || []);
    } catch (err) {
      setError("Failed to fetch data. Please try again.");
    }

    setLoading(false);
  };

  const handleDownloadExcel = () => {
    const headers = [
      "Claim No.",
      "_sort_date",
      "Type",
      "Provider Name",
      "Total",
      "Status",
      "Plan Paid",
      "Member RESP",
    ];

    const data = tableData?.map((claim) => [
      claim.CHCLM || "-",
      claim._sort_date || "-",
      claim.CHCLTP || "-",
      claim.CHADPN?.trim() || "-",
      `$${claim.CHCLM$ || "-"}`,
      (claim.CHHDST === "A" && "Paid") ||
        (claim.CHHDST === "D" && "Denied") ||
        (claim.CHHDST === "O" && "Open") ||
        (claim.CHHDST === "R" && "Ready to release"),
      `$${claim.CHMM$ || "0.00"}`,
      `$${claim.BHCAMT || "0.00"}`,
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Downloaded Report `);
    XLSX.writeFile(wb, `Downloaded_report.xlsx`);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black z-50 bg-opacity-50">
      <div
        className={`bg-white rounded-lg shadow-lg  w-full p-5 ${
          location.pathname === `/download-report/${emssn_from_params}`
            ? " w-screen h-screen"
            : " max-w-5xl mx-20"
        }`}
      >
        <div className="flex justify-between items-center border-b pb-2">
          <h2 className="text-lg font-semibold text-[#0486A5]">
            Download Report
          </h2>
          <div className="flex justify-end gap-4 mt-3">
            <button
              onClick={handleDownloadExcel}
              className=" text-[#036880] px-3 py-1.5 rounded shadow  transition text-2xl"
            >
              <i class="fa-solid fa-file-arrow-down"></i>
            </button>{" "}
            {location.pathname !== `/download-report/${emssn_from_params}` && (
              <div className="flex space-x-3">
                <button
                  onClick={() => setIsDownloadReportOpen(false)}
                  className="text-gray-500 hover:text-red-600 transition"
                >
                  <i className="fa-regular fa-circle-xmark  text-2xl text-[#0486A5] hover:text-red-500"></i>
                </button>
                <button
                  onClick={() => onExpand()}
                  className="text-gray-500 text-xl"
                >
                  <i class="fa-solid fa-up-right-and-down-left-from-center text-xl text-[#0486A5]"></i>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-sm text-gray-600">From Date *</label>
            <input
              type="date"
              name="from_date"
              value={filters.from_date}
              onChange={handleChange}
              className="border p-1 w-full text-sm rounded"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600">To Date *</label>
            <input
              type="date"
              name="to_date"
              value={filters.to_date}
              onChange={handleChange}
              className="border p-1 w-full text-sm rounded"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Claim #</label>
            <input
              type="text"
              name="claim_no"
              value={filters.claim_no}
              onChange={handleChange}
              className="border p-1 w-full text-sm rounded"
            />
          </div>
          <div className="flex gap-2 justify-end items-end">
            <button
              onClick={handleSearch}
              className="bg-[#0486A5] text-white px-3 py-1.5 rounded shadow hover:bg-[#036880] transition text-sm"
            >
              Search
            </button>
            <button
              onClick={() =>
                setFilters({
                  from_date: "",
                  to_date: "",
                  claim_no: "",
                })
              }
              className="bg-gray-500 text-white px-3 py-1.5 rounded shadow hover:bg-gray-600 transition text-sm"
            >
              Reset
            </button>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

        <div className="overflow-x-auto mt-3 h-96">
          <div className="relative h-full overflow-y-auto">
            <table className="w-full text-sm ">
              <thead className="sticky top-0 bg-[#0486A5] text-white text-xs z-10">
                <tr className="border-b text-center">
                  <th className="py-2">Claim No.</th>
                  <th className="py-2">Date</th>
                  <th className="py-2">Type</th>
                  <th className="py-2">Provider Name</th>
                  <th className="py-2">Total</th>
                  <th className="py-2">Plan Paid</th>
                  <th className="py-2">Member RESP</th>{" "}
                  <th className="py-2">Status</th>
                </tr>
              </thead>

              <tbody className="h-full overflow-y-auto">
                {loading && (
                  <tr>
                    <td colSpan={8} className="p-2 text-center">
                      <div className="flex gap-2 items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-t-4 border-blue-500 border-solid"></div>
                        <p className="text-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-600 text-transparent bg-clip-text animate-pulse">
                          Loading...
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
                {!loading && tableData.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center">
                      <p className="text-red-500">No Data</p>
                    </td>
                  </tr>
                )}

                {tableData?.map((claim, index) => (
                  <tr
                    key={index}
                    className="border-b text-xs hover:bg-gray-50 text-center cursor-pointer"
                  >
                    <td className="py-3">{claim.CHCLM || "N/A"}</td>
                    <td className="py-3">{claim?.["FROM DATE"] || "N/A"}</td>
                    <td className="py-3">{claim.CHCLTP || "N/A"}</td>
                    <td className="py-3">{claim.CHADPN?.trim() || "N/A"}</td>
                    <td className="py-3">${claim.CHCLM$ || "0.00"}</td>
                    <td className="py-3">${claim.CHMM$ || "0.00"}</td>
                    <td className="py-3">${claim.BHCAMT || "0.00"}</td>{" "}
                    <td
                      className={`py-3  
                ${claim.CHHDST === "A" && "text-green-500"} 
                ${claim.CHHDST === "D" && "text-red-500"}
                ${claim.CHHDST === "O" && "text-orange-500"} 
                ${claim.CHHDST === "R" && "text-green-500"}`}
                    >
                      {claim.CHHDST === "A" && "Paid"}
                      {claim.CHHDST === "D" && "Denied"}
                      {claim.CHHDST === "O" && "Open"}
                      {claim.CHHDST === "R" && "Ready to release"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DownloadReport;
