import React, { useContext, useEffect, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import ReactPaginate from "react-paginate";
import axios from "axios";
import TotalClaimsTable from "./TotalClaimsTable";
import MyContext from "../ContextApi/MyContext";
import * as XLSX from "xlsx";
import LoadingMessage from "./LoadingMessage";
import ViewEOBDownload from "./ViewEOBDownload";
import { toast } from "react-toastify";
import { Mail, X, Send, Loader2 } from "lucide-react";
const TotalClaimsFound = ({
  activeStatusFilter,
  activeMonthFilter,
  setActiveMonthFilter,
  setActiveStatusFilter,
  setActiveMonthName,
  providerNo: providerNoProp,
  isAdminView = false,
}) => {
  const { api, isEOBOpen, setIsEOBOpen, activeProvider } = useContext(MyContext);
  const [dataFromCLMHP, setDataFromCLMHP] = useState();
  const user = JSON.parse(localStorage.getItem("user"));
  const provider_no = providerNoProp || activeProvider?.provider_no || user?.provider_no;

  const [expandedRow, setExpandedRow] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});
  const [checkData, setCheckData] = useState(null);
  const [checkDataLoading, setCheckDataLoading] = useState(false);
  const [selectedRowData, setSelectedRowData] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [filterFromDate, setFromDate] = useState("");
  const [filterToDate, setToDate] = useState("");

  // Email modal state
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailClaim, setEmailClaim] = useState(null);
  const [emailRecipient, setEmailRecipient] = useState("providers@mmpplans.com");
  const [emailSubject, setEmailSubject] = useState("Claim Details");
  const [emailMessage, setEmailMessage] = useState("");
  const [emailSending, setEmailSending] = useState(false);

  const toggleRow = (index) => {
    setExpandedRows((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  useEffect(() => {
    fetchCHCLMApiData();
    fetchOriginalData();
  }, [activeProvider, providerNoProp]);

  const isDateOlderThan27Months = (dateStr) => {
    const selectedDate = new Date(dateStr);
    const minDate = new Date();
    minDate.setMonth(minDate.getMonth() - 27);
    minDate.setHours(0, 0, 0, 0);
    return selectedDate < minDate;
  };

  const fetchCHCLMApiData = async () => {
    // Don't fetch if dates aren't set
    if (!filterFromDate || !filterToDate) {
      return;
    }
    // Check 27-month restriction for provider users
    if (!user?.is_admin && !user?.is_guest) {
      if (isDateOlderThan27Months(filterFromDate) || isDateOlderThan27Months(filterToDate)) {
        toast.error("You cannot view data older than 27 months from the current date.");
        return;
      }
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

  const handleRowClick = async (index, claim) => {
    if (expandedRow === index) {
      setExpandedRow(null);
      setSelectedRowData(null);
      setCheckData(null);
    } else {
      setExpandedRow(index);
      setSelectedRowData(claim);
      setCheckData(null);
      setCheckDataLoading(true);
      try {
        const res = await axios.get(`${api}/fetch-check-data/?claim_no=${claim?.["CHCLM#"]}`);
        setCheckData(res.data);
      } catch {
        setCheckData([]);
      } finally {
        setCheckDataLoading(false);
      }
    }
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
      // Handle calculated Member RESP sort
      if (sortConfig.key === "MEMBER_RESP") {
        const calcResp = (c) =>
          (parseFloat(c.CHCOPA) || 0) +
          (parseFloat(c["CHCO$"]) || 0) +
          (parseFloat(c.CHHOSD) || 0) +
          (parseFloat(c.CHPCPD) || 0) +
          (parseFloat(c["CHDRC$"]) || 0);
        const aVal = calcResp(a);
        const bVal = calcResp(b);
        return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
      }

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
      ["CHCLM#", "DATE", "CHCLTP", "EMMEM#", "PATIENT_NAME", "CHCLM$", "CHSTTY"].some((key) =>
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
      `$${(
        (parseFloat(claim.CHCOPA) || 0) +
        (parseFloat(claim["CHCO$"]) || 0) +
        (parseFloat(claim.CHHOSD) || 0) +
        (parseFloat(claim.CHPCPD) || 0) +
        (parseFloat(claim["CHDRC$"]) || 0)
      ).toFixed(2)}`,
      (claim.CHHDST === "V" && claim.VOID_REASON) ? claim.VOID_REASON : (statusMap[claim.CHHDST] || claim.CHHDST || "-"),
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Downloaded Report `);
    XLSX.writeFile(wb, `Downloaded_report.xlsx`);
  };

  const [EobClaimNO, setEobClaimNO] = useState(false);
  const handleEOBClick = (claim_no) => {
    setEobClaimNO(claim_no);
    setIsEOBOpen(!isEOBOpen);
  };

  const statusMap = {
    A: "Paid", D: "Deny", E: "Drop", H: "Hold", O: "Open",
    P: "Pend", R: "RTP", S: "PDO", T: "Audt", U: "Inpr", V: "Void",
  };

  const handleEmailClick = (claim) => {
    setEmailClaim(claim);
    setEmailSubject(`Claim Details - ${claim?.["CHCLM#"] || ""}`);
    setEmailMessage("");
    setEmailModalOpen(true);
  };

  const handleSendEmail = async () => {
    setEmailSending(true);
    try {
      const serviceDate = `${String(emailClaim.CHFRDM).padStart(2, "0")}-${String(emailClaim.CHFRDD).padStart(2, "0")}-${String(emailClaim.CHFRDY)}`;
      const paidDate = emailClaim.CHHDST === "V" ? "-" : (emailClaim.CHPRDM ? `${String(emailClaim.CHPRDM).padStart(2, "0")}-${String(emailClaim.CHPRDD).padStart(2, "0")}-${String(emailClaim.CHPRDY)}` : "-");
      const memberResp = (
        (parseFloat(emailClaim.CHCOPA) || 0) +
        (parseFloat(emailClaim["CHCO$"]) || 0) +
        (parseFloat(emailClaim.CHHOSD) || 0) +
        (parseFloat(emailClaim.CHPCPD) || 0) +
        (parseFloat(emailClaim["CHDRC$"]) || 0)
      ).toFixed(2);

      await axios.post(`${api}/send-claim-email/`, {
        recipient_email: emailRecipient,
        subject: emailSubject,
        message: emailMessage,
        claim_data: {
          claim_no: emailClaim?.["CHCLM#"] || "-",
          service_date: serviceDate,
          paid_date: paidDate,
          claim_type: emailClaim.CHCLTP || "-",
          member_id: emailClaim?.["EMMEM#"]?.trim() || "-",
          total: emailClaim.CHCLM$ || "0.00",
          plan_paid: emailClaim.CHMM$ || "0.00",
          member_resp: memberResp,
          status: statusMap[emailClaim.CHHDST] || emailClaim.CHHDST,
        },
        provider_info: {
          name: user?.name || "-",
          email: user?.email || "-",
          provider_no: provider_no || "-",
          phone_no: user?.phone_no || "-",
        },
      });
      toast.success("Email sent successfully!");
      setEmailModalOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to send email.");
    } finally {
      setEmailSending(false);
    }
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
                  <th
                    className="text-center py-2 cursor-pointer hover:bg-gray-50"
                    // onClick={() => requestSort("EOB")}
                  >
                    <div className="flex items-center justify-center">EOB</div>
                  </th>
                  {!isAdminView && (
                  <th className="text-center py-2">
                    <div className="flex items-center justify-center">
                     Email
                    </div>
                  </th>
                  )}
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
                      Service Date{renderSortIndicator("CHFRDM-CHFRDD-CHFRDY")}
                    </div>
                  </th>
                  <th
                    className="text-center py-2 cursor-pointer hover:bg-gray-50"
                    onClick={() => requestSort("CHPRDM-CHPRDD-CHPRDY")}
                  >
                    <div className="flex items-center justify-center">
                      Paid Date{renderSortIndicator("CHPRDM-CHPRDD-CHPRDY")}
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
                    onClick={() => requestSort("MEMBER_RESP")}
                  >
                    <div className="flex items-center justify-center">
                      Member <br /> RESP{renderSortIndicator("MEMBER_RESP")}
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
                      <td
                        onClick={() => {
                          if (
                            claim?.["CHHDST"] !== "V" &&
                            claim?.["CHHDST"] !== "O"
                          ) {
                            handleEOBClick(claim?.["CHCLM#"]);
                          }
                        }}
                        title={
                          claim?.["CHHDST"] === "V" || claim?.["CHHDST"] === "O"
                            ? "EOB not available for Open or Void claims"
                            : ""
                        }
                        className={`py-3 text-center font-medium cursor-pointer underline-offset-4 
                      ${
                        claim?.["CHHDST"] === "V" || claim?.["CHHDST"] === "O"
                          ? "text-gray-400 cursor-not-allowed no-underline"
                          : "text-[#0486A5] hover:underline hover:text-sky-400"
                      }`}
                      >
                        EOB
                      </td>
                      {!isAdminView && (
                      <td
                        onClick={() => handleEmailClick(claim)}
                        className="py-3 text-center cursor-pointer text-[#0486A5] hover:text-sky-400"
                        title="Send claim details via email"
                      >
                        <Mail className="w-4 h-4 mx-auto" />
                      </td>
                      )}
                      <td className="py-3 text-center">
                        {claim?.["CHCLM#"] || "-"}
                      </td>
                      <td className="py-3 text-center">
                        {`${String(claim.CHFRDM).padStart(2, "0")}-${String(
                          claim.CHFRDD
                        ).padStart(2, "0")}-${String(claim.CHFRDY)}` || "-"}
                      </td>
                      <td className="py-3 text-center">
                        {claim.CHHDST === "V"
                          ? "-"
                          : (claim.CHPRDM &&
                              `${String(claim.CHPRDM).padStart(2, "0")}-${String(
                                claim.CHPRDD
                              ).padStart(2, "0")}-${String(claim.CHPRDY)}`) ||
                            "-"}
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
                        ${(
                          (parseFloat(claim.CHCOPA) || 0) +
                          (parseFloat(claim["CHCO$"]) || 0) +
                          (parseFloat(claim.CHHOSD) || 0) +
                          (parseFloat(claim.CHPCPD) || 0) +
                          (parseFloat(claim["CHDRC$"]) || 0)
                        ).toFixed(2)}
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
                        {claim.CHHDST === "V" && claim.VOID_REASON
                          ? claim.VOID_REASON
                          : claim.CHHDST === "V" && !claim.VOID_REASON
                          ? <span className="relative group cursor-default">
                              Void
                              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-50">
                                No void reason available for this claim
                              </span>
                            </span>
                          : {
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
                      <tr>
                        <td colSpan="12" className="py-2 px-3 bg-gray-50/50">
                          <div className="w-full bg-white border border-gray-200 rounded-lg shadow-sm text-xs text-black">

                            {/* Header */}
                            <div className="bg-[#0486A5] rounded-t-lg px-4 py-2 flex items-center justify-between">
                              <div className="text-white text-xs">
                                <span>Patient: <span className="font-semibold">{selectedRowData?.PATIENT_NAME || "-"}</span></span>
                                <span className="mx-1.5">|</span>
                                <span>{selectedRowData?.MEMBER_NAME ? "Dependent" : "Member"}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="bg-white text-[#0486A5] text-[10px] font-semibold rounded px-1.5 py-0.5">
                                  {selectedRowData?.CHHDST ? (selectedRowData.CHHDST === "V" && selectedRowData.VOID_REASON ? selectedRowData.VOID_REASON : ({ A: "Paid", D: "Deny", E: "Drop", H: "Hold", O: "Open", P: "Pend", R: "RTP", S: "PDO", T: "Audt", U: "Inpr", V: "Void" }[selectedRowData.CHHDST] || selectedRowData.CHHDST)) : "-"}
                                </span>
                                {JSON.parse(localStorage.getItem("user"))?.is_admin && (
                                  <button onClick={() => setIsShowTotalClaimsDetailsOpen(true)} className="text-[10px] text-white border border-white rounded px-1.5 py-0.5 hover:bg-white hover:text-[#0486A5] transition-colors">
                                    <i className="fa-solid fa-circle-info mr-0.5"></i>Details
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Body — uniform 3-col table layout */}
                            <table className="w-full text-xs text-black">
                              <tbody>
                                {/* Row 1 */}
                                <tr className="border-b border-gray-100">
                                  <td className="px-4 py-1.5">Patient ID: {selectedRowData?.CHPATI || "-"}</td>
                                  <td className="px-4 py-1.5">Provider: {selectedRowData?.CHPROV || "-"}</td>
                                  <td className="px-4 py-1.5">Type: {selectedRowData?.CHCLTP || "-"}</td>
                                </tr>
                                {/* Row 2 */}
                                <tr className="border-b border-gray-100">
                                  <td className="px-4 py-1.5">Plan/Class: {selectedRowData?.CHPLAN || "-"}/{selectedRowData?.CHBNFT || "-"}</td>
                                  <td className="px-4 py-1.5">Assign: {selectedRowData?.CHEDI || "-"}</td>
                                  <td className="px-4 py-1.5">Carrier: {selectedRowData?.NONE || "-"}</td>
                                </tr>
                                {/* Row 2.5 — Member name for dependents */}
                                {selectedRowData?.MEMBER_NAME && (
                                  <tr className="border-b border-gray-100">
                                    <td className="px-4 py-1.5" colSpan="3">Member Name: {selectedRowData.MEMBER_NAME}</td>
                                  </tr>
                                )}
                                {/* Row 3 — Dates */}
                                <tr className="border-b border-gray-100">
                                  <td className="px-4 py-1.5">Receipt: {selectedRowData?.CHRCDM ? `${String(selectedRowData.CHRCDM).padStart(2,"0")}-${String(selectedRowData.CHRCDD).padStart(2,"0")}-${selectedRowData.CHRCDY}` : selectedRowData?.["Receipt Date"] || "-"}</td>
                                  <td className="px-4 py-1.5">Processed: {selectedRowData?.CHPRDM ? `${String(selectedRowData.CHPRDM).padStart(2,"0")}-${String(selectedRowData.CHPRDD).padStart(2,"0")}-${selectedRowData.CHPRDY}` : "-"}</td>
                                  <td className="px-4 py-1.5"></td>
                                </tr>
                                {/* Row 4–5 — Financials */}
                                <tr className="border-b border-gray-100">
                                  <td className="px-4 py-1.5">Claim: ${selectedRowData?.CHCLM$ || "0.00"}</td>
                                  <td className="px-4 py-1.5">Paid: ${selectedRowData?.CHMM$ || "0.00"}</td>
                                  <td className="px-4 py-1.5">Co-Pay: ${selectedRowData?.CHCOPA || "0.00"}</td>
                                </tr>
                                <tr className="border-b border-gray-100">
                                  <td className="px-4 py-1.5">Co-Ins: ${selectedRowData?.["CHCO$"] || "0.00"}</td>
                                  <td className="px-4 py-1.5">Hos/MM: ${selectedRowData?.CHHOSD || "0.00"}</td>
                                  <td className="px-4 py-1.5">PCP Ded: ${selectedRowData?.CHPCPD || "0.00"}</td>
                                </tr>
                                <tr className="border-b border-gray-100">
                                  <td className="px-4 py-1.5">Over R&C: ${selectedRowData?.["CHDRC$"] || "0.00"}</td>
                                  <td className="px-4 py-1.5"></td>
                                  <td className="px-4 py-1.5"></td>
                                </tr>
                                {/* Row 6 — Diagnosis */}
                                {(() => {
                                  const codes = [selectedRowData?.CHDIAG, selectedRowData?.CHDIA2, selectedRowData?.CHDIA3, selectedRowData?.CHDIA4, selectedRowData?.CHDIA5].filter(c => c?.trim());
                                  return codes.length > 0 ? (
                                    <tr className="border-b border-gray-100">
                                      <td className="px-4 py-1.5" colSpan="3">Diagnosis: {codes.join(", ")}</td>
                                    </tr>
                                  ) : null;
                                })()}
                                {/* Row 7 — Check */}
                                {checkDataLoading ? (
                                  <tr className="border-b border-gray-100">
                                    <td className="px-4 py-1.5 italic" colSpan="3">Loading check info...</td>
                                  </tr>
                                ) : checkData && checkData.length > 0 ? (
                                  checkData.map((chk, i) => (
                                    <tr key={i} className="border-b border-gray-100">
                                      <td className="px-4 py-1.5">Check #: {chk?.["CKCHK#"] || "-"}</td>
                                      <td className="px-4 py-1.5">Check Date: {chk?.check_date || "-"}</td>
                                      <td className="px-4 py-1.5">Check Status: {chk?.check_status || "-"}</td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr className="border-b border-gray-100">
                                    <td className="px-4 py-1.5" colSpan="3">No check data</td>
                                  </tr>
                                )}
                                {/* Row 8 — Description */}
                                {selectedRowData?.CHCLEX && (
                                  <tr>
                                    <td className="px-4 py-1.5" colSpan="3">Description: {selectedRowData.CHCLEX}</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>

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

      {isEOBOpen && (
        <ViewEOBDownload
          isOpen={isEOBOpen}
          onClose={() => setIsEOBOpen(false)}
          claim_no={EobClaimNO}
        />
      )}

      {/* Email Modal */}
      {!isAdminView && emailModalOpen && emailClaim && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white rounded-2xl w-[95%] max-w-lg shadow-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between bg-[#0486A5] px-6 py-4">
              <h2 className="text-white font-semibold text-lg flex items-center gap-2">
                <Mail className="w-5 h-5" /> Send Claim Email
              </h2>
              <button onClick={() => setEmailModalOpen(false)} className="text-white hover:text-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Claim Details Preview */}
              <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-1">
                <p className="font-semibold text-[#0486A5] mb-2">Claim Details</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <p><span className="text-gray-500">Claim No:</span> <strong>{emailClaim?.["CHCLM#"]}</strong></p>
                  <p><span className="text-gray-500">Status:</span> <strong>{statusMap[emailClaim.CHHDST] || emailClaim.CHHDST}</strong></p>
                  <p><span className="text-gray-500">Service Date:</span> {`${String(emailClaim.CHFRDM).padStart(2, "0")}-${String(emailClaim.CHFRDD).padStart(2, "0")}-${String(emailClaim.CHFRDY)}`}</p>
                  <p><span className="text-gray-500">Paid Date:</span> {emailClaim.CHHDST === "V" ? "-" : (emailClaim.CHPRDM ? `${String(emailClaim.CHPRDM).padStart(2, "0")}-${String(emailClaim.CHPRDD).padStart(2, "0")}-${String(emailClaim.CHPRDY)}` : "-")}</p>
                  <p><span className="text-gray-500">Type:</span> {emailClaim.CHCLTP || "-"}</p>
                  <p><span className="text-gray-500">Member ID:</span> {emailClaim?.["EMMEM#"]?.trim() || "-"}</p>
                  <p><span className="text-gray-500">Total:</span> ${emailClaim.CHCLM$ || "0.00"}</p>
                  <p><span className="text-gray-500">Plan Paid:</span> ${emailClaim.CHMM$ || "0.00"}</p>
                </div>
              </div>

              {/* Email Fields */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                <input
                  type="email"
                  value={emailRecipient}
                  onChange={(e) => setEmailRecipient(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0486A5]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0486A5]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message (optional)</label>
                <textarea
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  rows={3}
                  placeholder="Add a message..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0486A5] resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t">
              <button
                onClick={() => setEmailModalOpen(false)}
                className="px-4 py-2 text-gray-600 font-medium hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmail}
                disabled={emailSending}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg text-white font-medium ${
                  emailSending ? "bg-[#0486A5]/60 cursor-not-allowed" : "bg-[#0486A5] hover:bg-[#047B95]"
                }`}
              >
                {emailSending ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                ) : (
                  <><Send className="w-4 h-4" /> Send</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TotalClaimsFound;
