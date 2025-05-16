import React, { useContext, useEffect, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import ReactPaginate from "react-paginate";
import axios from "axios";
import TotalClaimsTable from "./TotalClaimsTable";
import MyContext from "../ContextApi/MyContext";
import * as XLSX from "xlsx";
import LoadingMessage from "./LoadingMessage";
const TotalClaimsFound = ({
  activeStatusFilter,
  activeMonthFilter,
  setActiveMonthFilter,
  setActiveStatusFilter,
  setActiveMonthName,
}) => {
  const { api } = useContext(MyContext);
  const [dataFromCLMHP, setDataFromCLMHP] = useState();
  const user = JSON.parse(localStorage.getItem("user"));
  const provider_no = user?.provider_no;

  const [expandedRow, setExpandedRow] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});
  const [selectedRowData, setSelectedRowData] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [filterFromDate, setFromDate] = useState("");
  const [filterToDate, setToDate] = useState("");

  const toggleRow = (index) => {
    setExpandedRows((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  useEffect(() => {
    fetchCHCLMApiData();
    fetchOriginalData();
  }, []);

  const fetchCHCLMApiData = async () => {
    // Don't fetch if dates aren't set
    if (!filterFromDate || !filterToDate) {
      return;
    }
    try {
      setLoading(true);
      const response = await axios?.get(
        `${api}/fetch-clmhp/?provider_no=${provider_no}&from_date=${filterFromDate}&to_date=${filterToDate}`
      );
      setDataFromCLMHP(response.data);
      setFilteredData(response.data);
    } catch (error) {
      console.log("Error", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOriginalData = async () => {
    try {
      setLoading(true);
      const response = await axios?.get(
        `${api}/fetch-clmhp/?provider_no=${provider_no}`
      );
      setDataFromCLMHP(response.data);
      setFilteredData(response.data);
    } catch (error) {
      console.log("Error", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (index, claim) => {
    setExpandedRow(expandedRow === index ? null : index);
    setSelectedRowData(expandedRow === index ? null : claim);
  };

  const [filteredData, setFilteredData] = useState(dataFromCLMHP);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  // Sorting function
  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Improved date parsing function
  const parseDate = (claim) => {
    try {
      // Handle MM-DD-YYYY format from the API
      const month = String(claim.CHFRDM).padStart(2, "0");
      const day = String(claim.CHFRDD).padStart(2, "0");
      const year = claim.CHFRDY;
      return new Date(`${month}/${day}/${year}`);
    } catch (e) {
      return new Date(0); // Return epoch date if parsing fails
    }
  };

  // Apply sorting to filtered data
  const getSortedData = () => {
    if (!sortConfig.key) return filteredData;

    return [...filteredData].sort((a, b) => {
      // Handle null/undefined values
      const aValue = a[sortConfig.key] || "";
      const bValue = b[sortConfig.key] || "";

      // Special handling for numeric values (remove $ sign if present)
      const numA = parseFloat(aValue.toString().replace(/[^0-9.-]+/g, ""));
      const numB = parseFloat(bValue.toString().replace(/[^0-9.-]+/g, ""));

      // If both values are numbers, compare numerically
      if (!isNaN(numA) && !isNaN(numB)) {
        return sortConfig.direction === "asc" ? numA - numB : numB - numA;
      }

      // For dates (using our parseDate function)
      if (sortConfig.key === "CHFRDM-CHFRDD-CHFRDY") {
        const dateA = parseDate(a);
        const dateB = parseDate(b);
        return sortConfig.direction === "asc" ? dateA - dateB : dateB - dateA;
      }

      // Default string comparison
      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  };

  const sortedData = getSortedData();

  useEffect(() => {
    let filteredClaims = dataFromCLMHP?.filter((claim) =>
      ["CHCLM#", "DATE", "CHCLTP", "EMMEM#", "CHCLM$", "CHSTTY"].some((key) =>
        claim[key]
          ?.toString()
          .toLowerCase()
          ?.trim()
          ?.includes(searchQuery?.trim()?.toLowerCase())
      )
    );

    let filteredClaimsWithStatus = filteredClaims?.filter((claim) =>
      activeMonthFilter
        ? activeStatusFilter
          ? claim.CHHDST === activeStatusFilter &&
            claim.CHFRDM === activeMonthFilter
          : claim.CHFRDM === activeMonthFilter
        : activeStatusFilter
        ? claim.CHHDST === activeStatusFilter
        : claim
    );

    setFilteredData(filteredClaimsWithStatus || []);
  }, [searchQuery, activeMonthFilter, activeStatusFilter, dataFromCLMHP]);

  const [isShowTotalClaimsDetailsOpen, setIsShowTotalClaimsDetailsOpen] =
    useState(false);

  // Function to render sort indicator
  const renderSortIndicator = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === "asc" ? (
        <span className="ml-1">↑</span>
      ) : (
        <span className="ml-1">↓</span>
      );
    }
    return <span className="ml-1 opacity-30">↑↓</span>;
  };

  const handleDownloadExcel = () => {
    const headers = [
      "Claim No.",
      "Date",
      "Type",
      "MEM ID",
      "Total",
      "Plan Paid",
      "Member RESP",
      "Status",
    ];

    const statusMap = {
      A: "Paid",
      D: "Deny",
      E: "Drop",
      H: "Hold",
      O: "Open",
      P: "Pend",
      R: "RTP",
      S: "PDO",
      T: "Audt",
      U: "Inpr",
      V: "Void",
    };

    const data = dataFromCLMHP?.map((claim) => [
      claim?.["CHCLM#"] || "-",
      claim._sort_date || "-",
      claim.CHCLTP || "-",
      claim?.["EMMEM#"]?.trim() || "-",
      `$${claim.CHCLM$ || "-"}`,
      `$${claim.CHMM$ || "0.00"}`,
      `$${claim.BHCAMT || "0.00"}`,
      statusMap[claim.CHHDST] || claim.CHHDST || "-",
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Downloaded Report `);
    XLSX.writeFile(wb, `Downloaded_report.xlsx`);
  };

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems =
    sortedData?.slice(indexOfFirstItem, indexOfLastItem) || [];
  const totalPages = Math.ceil((sortedData?.length || 0) / itemsPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleReset = () => {
    setSearchQuery("");
    setActiveMonthFilter("");
    setActiveStatusFilter("");
    setFromDate("");
    setToDate("");
    setSortConfig({ key: null, direction: "asc" });
    setCurrentPage(1);
    paginate(1);
    fetchOriginalData();
  };
  return (
    <div>
      {/* Claims Table Section */}
      <div className="mt-2 w-full">
        <div className="flex flex-col md:flex-row justify-between border-b-2 border-blue-300 pb-2">
          <div className="flex space-x-3 items-center">
            {loading ? (
              <h3>Fetching data, Please wait.</h3>
            ) : (
              <h3 className="text-md font-medium">
                Total {filteredData?.length || 0}{" "}
                {activeStatusFilter === "R" && "ready to release"}
                {activeStatusFilter === "D" && "denied"}
                {activeStatusFilter === "O" && "open"}
                {activeStatusFilter === "A" && "paid"} claims found{" "}
                {activeMonthFilter ? `of month ${setActiveMonthName}` : ""}
              </h3>
            )}
            {/* <div className="cursor-pointer">
              <img
                src="/images/Content/arrow.png"
                alt="img"
                className="h-7 w-7"
              />
            </div> */}
          </div>

          <div className="flex flex-col md:flex-row my-3 justify-end gap-4 items-center">
            <div className="flex flex-col md:flex-row gap-4 border rounded-full pl-2">
              <div className="flex items-center">
                <label className="text-teal-600 mr-2" htmlFor="">
                  From Date:
                </label>
                <input
                  type="date"
                  placeholder="From Date"
                  className="border border-gray-300 disabled:text-gray-500 pl-4 placeholder:text-sm p-0.5 text-sm rounded-full"
                  onChange={(e) => setFromDate(e.target.value)}
                  value={filterFromDate}
                  disabled={loading}
                />
              </div>{" "}
              <div className="flex items-center">
                <label className="text-teal-600 mr-2" htmlFor="">
                  To Date:
                </label>
                <input
                  type="date"
                  placeholder="To Date"
                  className="border border-gray-300 pl-4 disabled:text-gray-500 placeholder:text-sm p-0.5 text-sm rounded-full"
                  onChange={(e) => setToDate(e.target.value)}
                  value={filterToDate}
                  disabled={loading || !filterFromDate}
                />
              </div>
              <button
                onClick={() => fetchCHCLMApiData()}
                disabled={loading || !filterFromDate || !filterToDate}
                className="w-12 border  text-blue-500 disabled:text-gray-500 p-0.5 rounded-r-full"
              >
                <i className="fa-solid fa-magnifying-glass"></i>
              </button>
            </div>
            <div className="flex gap-3 items-center">
              <div className="flex items-center">
                <input
                  type="text"
                  placeholder="Search"
                  className="border border-gray-300 pl-4 placeholder:text-sm p-0.5 rounded-full"
                  onChange={(e) => setSearchQuery(e.target.value)}
                  value={searchQuery}
                />
              </div>
              <button
                onClick={handleReset}
                className=" text-red-500 rounded-full border-2 border-red-400 px-2 hover:bg-red-400 hover:font-medium hover:text-white text-sm"
              >
                Reset Data
              </button>
              <button
                onClick={handleDownloadExcel}
                className=" text-[#036880] rounded-full  border-2 border-[#036880] hover:bg-[#036880] px-2 hover:font-medium hover:text-white   shadow  transition text-sm"
              >
                <span className="mr-1">Report</span>{" "}
                <i class="fa-solid fa-file-arrow-down"></i>
              </button>{" "}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex gap-2 items-center p-2 justify-center">
            <div className=" flex animate-spin rounded-full h-5 w-5 border-t-4 border-blue-500 border-solid"></div>
            <div className="">
              <LoadingMessage />
            </div>
          </div>
        ) : filteredData?.length === 0 ? (
          <p className="text-center mt-4 text-gray-500">No claims found.</p>
        ) : (
          <div className=" h-96 overflow-y-scroll">
            <table className="w-full text-sm mt-2">
              <thead className="">
                <tr className="border-b text-xs">
                  {/* <th
                    className="text-center py-2 cursor-pointer hover:bg-gray-50"
                    onClick={() => requestSort("EOB")}
                  >
                    <div className="flex items-center justify-center">
                      EOB{renderSortIndicator("EOB")}
                    </div>
                  </th> */}
                  <th
                    className="text-center py-2 cursor-pointer hover:bg-gray-50"
                    onClick={() => requestSort("CHCLM#")}
                  >
                    <div className="flex items-center justify-center">
                      Claim No.{renderSortIndicator("CHCLM#")}
                    </div>
                  </th>
                  <th
                    className="text-center py-2 cursor-pointer hover:bg-gray-50"
                    onClick={() => requestSort("CHFRDM-CHFRDD-CHFRDY")}
                  >
                    <div className="flex items-center justify-center">
                      Date{renderSortIndicator("CHFRDM-CHFRDD-CHFRDY")}
                    </div>
                  </th>
                  <th
                    className="text-center py-2 cursor-pointer hover:bg-gray-50"
                    onClick={() => requestSort("CHCLTP")}
                  >
                    <div className="flex items-center justify-center">
                      Type{renderSortIndicator("CHCLTP")}
                    </div>
                  </th>
                  {/* <th
                    className="text-center py-2 cursor-pointer hover:bg-gray-50"
                    onClick={() => requestSort("CHSSN")}
                  >
                    <div className="flex items-center justify-center">
                      SSN {renderSortIndicator("CHSSN")}
                    </div>
                  </th> */}
                  <th
                    className="text-center py-2 cursor-pointer hover:bg-gray-50"
                    onClick={() => requestSort("EMMEM#")}
                  >
                    <div className="flex items-center justify-center">
                      MEM ID {renderSortIndicator("EMMEM#")}
                    </div>
                  </th>

                  <th
                    className="text-center py-2 cursor-pointer hover:bg-gray-50"
                    onClick={() => requestSort("CHCLM$")}
                  >
                    <div className="flex items-center justify-center">
                      Total{renderSortIndicator("CHCLM$")}
                    </div>
                  </th>
                  <th
                    className="text-center py-2 cursor-pointer hover:bg-gray-50"
                    onClick={() => requestSort("CHMM$")}
                  >
                    <div className="flex items-center justify-center">
                      Plan <br />
                      Paid{renderSortIndicator("CHMM$")}
                    </div>
                  </th>
                  <th
                    className="text-center py-2 cursor-pointer hover:bg-gray-50"
                    onClick={() => requestSort("BHCAMT")}
                  >
                    <div className="flex items-center justify-center">
                      Member <br /> RESP{renderSortIndicator("BHCAMT")}
                    </div>
                  </th>
                  <th
                    className="text-center py-2 cursor-pointer hover:bg-gray-50"
                    onClick={() => requestSort("CHHDST")}
                  >
                    <div className="flex items-center justify-center">
                      Status{renderSortIndicator("CHHDST")}
                    </div>
                  </th>
                  <th className="text-center py-2">
                    <i className="fa-solid fa-angles-down"></i>
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentItems?.map((claim, index) => (
                  <React.Fragment key={index}>
                    <tr className="border-b text-xs hover:bg-gray-50 ">
                      {/* <td className="py-3 cursor-pointer text-center text-[#0486A5] hover:underline underline-offset-4 hover:text-sky-400 font-medium">
                        EOB
                      </td> */}
                      <td className="py-3 text-center">
                        {claim?.["CHCLM#"] || "-"}
                      </td>
                      <td className="py-3 text-center">
                        {`${String(claim.CHFRDM).padStart(2, "0")}-${String(
                          claim.CHFRDD
                        ).padStart(2, "0")}-${String(claim.CHFRDY)}` || "-"}
                      </td>
                      <td className="py-3 text-center">
                        {claim.CHCLTP || "-"}
                      </td>
                      {/* <td className="py-3 text-center">
                        {claim?.CHSSN || "-"}
                      </td> */}
                      <td className="py-3 text-center">
                        {claim?.["EMMEM#"]?.trim() || "-"}
                      </td>

                      <td className="py-3 text-center">
                        ${claim.CHCLM$ || "0.00"}
                      </td>
                      <td className="py-3 text-center">
                        ${claim.CHMM$ || "0.00"}
                      </td>
                      <td className="py-3 text-center">
                        ${claim.BHCAMT || "0.00"}
                      </td>
                      <td
                        className={`py-3 text-center ${
                          {
                            A: "text-green-500", // Paid
                            D: "text-red-500", // Deny
                            E: "text-pink-500", // Drop
                            H: "text-yellow-600", // Hold
                            O: "text-orange-500", // Open
                            P: "text-blue-500", // Pend
                            R: "text-teal-500", // RTP
                            S: "text-purple-500", // PDO
                            T: "text-indigo-500", // Audt
                            U: "text-gray-500", // Inpr
                            V: "text-rose-600", // Void
                          }[claim.CHHDST] || "text-black"
                        }`}
                      >
                        {{
                          A: "Paid",
                          D: "Deny",
                          E: "Drop",
                          H: "Hold",
                          O: "Open",
                          P: "Pend",
                          R: "RTP",
                          S: "PDO",
                          T: "Audt",
                          U: "Inpr",
                          V: "Void",
                        }[claim.CHHDST] || claim.CHHDST}
                      </td>

                      <td
                        onClick={() => handleRowClick(index, claim)}
                        className="py-3 cursor-pointer text-center px-2"
                      >
                        {expandedRow === index ? (
                          <i className="fa-solid fa-angle-up text-red-500 hover:scale-150 transition ease-in-out"></i>
                        ) : (
                          <i className="fa-solid fa-angle-down hover:scale-150 ease-in-out transition text-green-500"></i>
                        )}
                      </td>
                    </tr>

                    {expandedRow === index && selectedRowData && (
                      <tr className="bg-gray-100 border-t">
                        <td colSpan="10" className="px-4 py-2">
                          <div className="p-3 pt-0 rounded-lg shadow-sm bg-white">
                            <div className="grid grid-cols-2 gap-10">
                              <div>
                                <p className="text-sm font-medium text-gray-700 cursor-pointer hover:bg-white ">
                                  <strong>Claim Number:</strong>{" "}
                                  {selectedRowData?.["CHCLM#"] || ""}{" "}
                                </p>
                              </div>
                              <div className="text-start">
                                <p className="text-xs text-[#0486A5] font-bold">
                                  <strong>Diagnosis Codes:</strong>{" "}
                                  {(() => {
                                    const codes = [
                                      selectedRowData?.CHDIAG,
                                      selectedRowData?.CHDIA2,
                                      selectedRowData?.CHDIA3,
                                      selectedRowData?.CHDIA4,
                                      selectedRowData?.CHDIA5,
                                    ].filter((code) => code?.trim());

                                    return codes?.length > 0
                                      ? codes.join(", ")
                                      : "";
                                  })()}
                                </p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-x-10 gap-y-2 mt-3 text-xs text-gray-700">
                              <p className="text-gray-600 text-xs ">
                                <strong>Plan:</strong>{" "}
                                {selectedRowData?.CHPLAN || ""} |
                                <strong> Class:</strong>{" "}
                                {selectedRowData?.CHBNFT || ""}
                              </p>
                              <p>
                                <strong>Claim Amount:</strong> $
                                {selectedRowData?.CHCLM$ || "0.00"}
                              </p>
                              <p className="text-xs text-gray-700">
                                <strong>Provider No:</strong>{" "}
                                {selectedRowData?.CHPROV || ""}
                              </p>
                              <p>
                                <strong>Patient ID:</strong>{" "}
                                {selectedRowData?.CHPATI || ""}
                              </p>
                              <p>
                                <strong>Primary Carrier:</strong>{" "}
                                {selectedRowData?.NONE || ""}
                              </p>
                              <p>
                                <strong>Payment Amount:</strong> $
                                {selectedRowData?.CHAMM$ || "0.00"}
                              </p>
                              <p>
                                <strong>Receipt Date:</strong>{" "}
                                {selectedRowData?.CHRCDM
                                  ? `${selectedRowData?.CHRCDM}-${selectedRowData?.CHRCDD}-${selectedRowData?.CHRCDY}`
                                  : `${selectedRowData?.["Receipt Date"]}`}
                              </p>
                              <p>
                                <strong>Processed Date:</strong>{" "}
                                {selectedRowData?.CHPRDM
                                  ? `${selectedRowData?.CHPRDM}-${selectedRowData?.CHPRDD}-${selectedRowData?.CHPRDY}`
                                  : `${selectedRowData?.["Processed Date"]}`}
                              </p>
                              <p>
                                <strong>Assign:</strong>{" "}
                                {selectedRowData?.CHEDI || ""}
                              </p>
                              <p>
                                <strong>Status:</strong>{" "}
                                {selectedRowData?.CHHDST || ""}
                              </p>
                            </div>
                            <div className="flex justify-between items-center text-xs text-gray-700 my-2">
                              <p className="grid-cols-2 text-xs text-gray-700">
                                <strong>Description:</strong>{" "}
                                {selectedRowData?.CHCLEX || ""}
                              </p>{" "}
                              <button
                                onClick={() =>
                                  setIsShowTotalClaimsDetailsOpen(true)
                                }
                                className="rounded-full border border-gray-300 text-gray-600 py-1 px-3 text-xs hover:bg-[#0486A5] hover:text-white transition-colors"
                              >
                                <i className="fa-solid fa-circle-info"></i> View
                                Details
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="flex justify-center">
        <div className="flex justify-center mt-4 overflow-x-auto">
          <ReactPaginate
            previousLabel={"Previous"}
            nextLabel={"Next"}
            breakLabel={"..."}
            pageCount={totalPages}
            marginPagesDisplayed={2}
            pageRangeDisplayed={4}
            onPageChange={({ selected }) => {
              paginate(selected + 1);
              setExpandedRow(null);
            }}
            containerClassName={"flex items-center gap-1"}
            pageClassName={"px-3 py-1 border rounded text-sm"}
            pageLinkClassName={"text-gray-700"}
            activeClassName={"bg-blue-300 text-blue-500"}
            previousClassName={"px-3 py-1 border rounded text-sm"}
            nextClassName={"px-3 py-1 border rounded text-sm"}
            disabledClassName={"opacity-50 cursor-not-allowed"}
            breakClassName={"px-3 py-1"}
          />
        </div>
      </div>
      {isShowTotalClaimsDetailsOpen && (
        <div className="">
          <TotalClaimsTable
            setIsTotalClaimModalOpen={setIsShowTotalClaimsDetailsOpen}
            isOpen={isShowTotalClaimsDetailsOpen}
            claim_no={selectedRowData?.["CHCLM#"]}
            schema={selectedRowData?.["schema"]}
          />
        </div>
      )}
    </div>
  );
};

export default TotalClaimsFound;
