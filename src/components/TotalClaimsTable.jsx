import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import MyContext from "../ContextApi/MyContext";

const TotalClaimsTable = ({ claim_no, isOpen, setIsTotalClaimModalOpen, schema }) => {
  const { api } = useContext(MyContext);
  const [tableData, setTableData] = useState([
    {
      CDCLM: "000009010",
      CDBNCD: "85C",
      CDAPTC: "M",
      "CDCPT#": "45378",
      CDCPTM: "33",
      CDCHG$: 1895.0,
      CDNPC$: 0.0,
      CDPAY$: 881.78,
      "FROM DATE": "1/16/2025",
      "TO DATE": "1/16/2025",
    },
    {
      CDCLM: "000009010",
      CDBNCD: "85C",
      CDAPTC: "M",
      "CDCPT#": "45378",
      CDCPTM: "33",
      CDCHG$: 1895.0,
      CDNPC$: 0.0,
      CDPAY$: 881.78,
      "FROM DATE": "1/16/2025",
      "TO DATE": "1/16/2025",
    },
  ]);
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
        `${api}/fetch-clmdp/?claim_no=${claim_no}&&schema=${schema}`
      );
      setTableData(response.data || []);
    } catch (err) {
      setError("Failed to fetch data. Please try again.");
    }
    setLoading(false);
  };

  const [isExpand, setExpand] = useState(false);

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div
            className={`bg-white rounded-lg shadow-lg  w-full p-5 ${
              isExpand ? " w-screen h-screen" : " max-w-5xl"
            }`}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-lg font-semibold text-[#0486A5]">
                Total Claims Table : {claim_no}
              </h2>
              <div className="flex space-x-3">
                <button
                  onClick={() => setIsTotalClaimModalOpen(false)}
                  className="text-gray-500 hover:text-red-600 transition"
                >
                  <i className="fa-regular fa-circle-xmark  text-2xl text-[#0486A5] hover:text-red-500"></i>
                </button>
                <button
                  onClick={() => setExpand(!isExpand)}
                  className="text-gray-500 text-xl"
                >
                  <i class="fa-solid fa-up-right-and-down-left-from-center text-xl text-[#0486A5]"></i>
                </button>
              </div>
            </div>

            {/* Table Wrapper */}
            {tableData.length > 0 && (
              <div className="overflow-x-auto mt-4 h-96 overflow-y-scroll">
                {" "}
                <table className="w-full  border-gray-300 rounded-lg">
                  <thead>
                    <tr className="bg-gray-100  text-gray-700 text-sm font-semibold">
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
                          className="text-center text-sm border-b odd:bg-gray-50"
                        >
                          <td className=" px-4 py-2">
                            {" "}
                            {`${String(row.CDFRDM).padStart(2, "0")}-${String(
                              row.CDFRDD
                            ).padStart(2, "0")}-${String(row.CDFRDY)}
                        ` || "-"}
                          </td>
                          <td className=" px-4 py-2">
                            {" "}
                            {`${String(row.CDTODM).padStart(2, "0")}-${String(
                              row.CDTODD
                            ).padStart(2, "0")}-${String(row.CDTODY)}
                        ` || "-"}
                          </td>
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

            {/* Modal Footer */}
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setIsTotalClaimModalOpen(false)}
                className="bg-red-500 text-white px-4 py-1 rounded-sm shadow-md hover:bg-red-600 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TotalClaimsTable;
