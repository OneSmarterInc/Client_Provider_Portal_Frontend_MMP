import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Search, Loader2 } from "lucide-react";
import MyContext from "../ContextApi/MyContext";
import TotalClaimsFound from "./TotalClaimsFound";

const AdminClaimSearch = ({ initialTaxId, searchTrigger }) => {
  const { api } = useContext(MyContext);
  const [taxId, setTaxId] = useState(initialTaxId || "");
  const [searchedTaxId, setSearchedTaxId] = useState("");

  const [prevLoading, setPrevLoading] = useState(false);
  const [currLoading, setCurrLoading] = useState(false);
  const [currentMonthCounts, setCurrentMonthCount] = useState({});
  const [previousMonthCounts, setPreviousMonthCount] = useState({});

  const [activeStatusFilter, setActiveStatusFilter] = useState("");
  const [activeMonthFilter, setActiveMonthFilter] = useState("");
  const [activeMonthName, setActiveMonthName] = useState("");

  const fetchCurrentMonthCounts = async (providerNo) => {
    try {
      setCurrLoading(true);
      const response = await axios.get(
        `${api}/fetch-claim-count/?month=current&provider_no=${providerNo}`
      );
      setCurrentMonthCount(response?.data);
    } catch (error) {
      console.log("Error fetching current month counts", error);
    } finally {
      setCurrLoading(false);
    }
  };

  const fetchPreviousMonthCounts = async (providerNo) => {
    try {
      setPrevLoading(true);
      const response = await axios.get(
        `${api}/fetch-claim-count/?month=previous&provider_no=${providerNo}`
      );
      setPreviousMonthCount(response?.data);
    } catch (error) {
      console.log("Error fetching previous month counts", error);
    } finally {
      setPrevLoading(false);
    }
  };

  useEffect(() => {
    if (searchTrigger && initialTaxId) {
      setTaxId(initialTaxId);
      setSearchedTaxId(initialTaxId);
      setActiveStatusFilter("");
      setActiveMonthFilter("");
      setActiveMonthName("");
      fetchCurrentMonthCounts(initialTaxId);
      fetchPreviousMonthCounts(initialTaxId);
    }
  }, [searchTrigger]);

  const handleSearch = () => {
    const trimmed = taxId.trim();
    if (!trimmed) {
      toast.error("Please enter a Tax ID.");
      return;
    }
    setSearchedTaxId(trimmed);
    setActiveStatusFilter("");
    setActiveMonthFilter("");
    setActiveMonthName("");
    fetchCurrentMonthCounts(trimmed);
    fetchPreviousMonthCounts(trimmed);
  };

  const handleRefresh = () => {
    if (!searchedTaxId) return;
    fetchCurrentMonthCounts(searchedTaxId);
    fetchPreviousMonthCounts(searchedTaxId);
  };

  return (
    <div>
      {/* Tax ID Search Bar */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <input
            type="text"
            placeholder="Enter Tax ID to search claims..."
            value={taxId}
            onChange={(e) => setTaxId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1 border border-gray-300 px-4 py-2 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
          />
          <button
            onClick={handleSearch}
            disabled={prevLoading || currLoading}
            className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-medium text-white bg-cyan-600 rounded-full hover:bg-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {prevLoading || currLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            Search
          </button>
        </div>
        {searchedTaxId && (
          <span className="text-sm text-gray-500">
            Showing results for: <strong className="text-gray-800">{searchedTaxId}</strong>
          </span>
        )}
      </div>

      {/* Claim Counts Dashboard */}
      {searchedTaxId && (
        <>
          <div className="flex justify-end mb-2">
            <button
              onClick={handleRefresh}
              disabled={prevLoading || currLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <svg
                className={`w-4 h-4 ${prevLoading || currLoading ? "animate-spin" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>

          <div className="flex gap-3 flex-col md:flex-row mb-5">
            {/* Previous Month Table */}
            <div className="border rounded-tl-lg rounded-bl-lg border-gray-300 pt-2 bg-white w-full md:w-1/2">
              <h2 className="font-inter text-[14px] font-medium mb-2 pl-2">
                {previousMonthCounts?.month} {new Date().getMonth() === 0 ? new Date().getFullYear() - 1 : new Date().getFullYear()} (Last Month)
              </h2>
              <div className="border overflow-hidden rounded-bl-lg border-white">
                <table className="w-full rounded-full">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-1 font-inter text-center text-[#000000] text-sm font-normal border-r">Total Claims:</th>
                      <th className="p-1 font-inter text-center text-[#00CA07] text-sm font-normal border-r">Paid Claims:</th>
                      <th className="p-1 font-inter text-center text-[#279b80] text-sm font-normal border-r">Ready to Release:</th>
                      <th className="p-1 font-inter text-center text-amber-500 text-sm font-normal border-r">Open Claims:</th>
                      <th className="p-1 font-inter text-center text-[#FF0000] text-sm font-normal">Denied Claims:</th>
                    </tr>
                    <tr
                      onClick={() => {
                        setActiveMonthFilter(previousMonthCounts?.month_date);
                        setActiveMonthName(previousMonthCounts?.month);
                      }}
                      className="bg-gray-100"
                    >
                      <th onClick={() => setActiveStatusFilter("")} className="p-1 font-inter text-center cursor-pointer text-[#000000] text-sm font-normal border-r">
                        {previousMonthCounts?.total_claims}
                        {prevLoading && <div className="flex items-center justify-center"><div className="flex animate-spin rounded-full h-5 w-5 border-t-4 border-blue-500 border-solid"></div></div>}
                      </th>
                      <th onClick={() => setActiveStatusFilter("A")} className="p-1 font-inter text-center cursor-pointer text-[#00CA07] text-sm font-normal border-r">
                        {previousMonthCounts?.paid_claims}
                        {prevLoading && <div className="flex items-center justify-center"><div className="flex animate-spin rounded-full h-5 w-5 border-t-4 border-blue-500 border-solid"></div></div>}
                      </th>
                      <th onClick={() => setActiveStatusFilter("R")} className="p-1 font-inter text-center cursor-pointer text-[#279b80] text-sm font-normal border-r">
                        {previousMonthCounts?.ready_claims}
                        {prevLoading && <div className="flex items-center justify-center"><div className="flex animate-spin rounded-full h-5 w-5 border-t-4 border-blue-500 border-solid"></div></div>}
                      </th>
                      <th onClick={() => setActiveStatusFilter("O")} className="p-1 font-inter text-center cursor-pointer text-amber-500 text-sm font-normal border-r">
                        {previousMonthCounts?.open_claims}
                        {prevLoading && <div className="flex items-center justify-center"><div className="flex animate-spin rounded-full h-5 w-5 border-t-4 border-blue-500 border-solid"></div></div>}
                      </th>
                      <th onClick={() => setActiveStatusFilter("D")} className="p-1 font-inter text-center cursor-pointer text-[#FF0000] text-sm font-normal">
                        {previousMonthCounts?.denied_claims}
                        {prevLoading && <div className="flex items-center justify-center"><div className="flex animate-spin rounded-full h-5 w-5 border-t-4 border-blue-500 border-solid"></div></div>}
                      </th>
                    </tr>
                  </thead>
                </table>
              </div>
            </div>

            {/* Current Month Table */}
            <div className="border rounded-lg border-sky-400 pt-2 w-full md:w-1/2 bg-blue-50">
              <h2 className="font-inter font-medium text-[14px] mb-2 pl-2 text-[#0486A5]">
                {currentMonthCounts?.month} {new Date().getFullYear()} (Current Month)
              </h2>
              <div className="border overflow-hidden border-white">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-1 font-inter text-center text-[#000000] text-sm font-normal border-r">Total Claims:</th>
                      <th className="p-1 font-inter text-center text-[#00CA07] text-sm font-normal border-r">Paid Claims:</th>
                      <th className="p-1 font-inter text-center text-[#279b80] text-sm font-normal border-r">Ready to Release:</th>
                      <th className="p-1 font-inter text-center text-amber-500 text-sm font-normal border-r">Open Claims:</th>
                      <th className="p-1 font-inter text-center text-[#FF0000] text-sm font-normal">Denied Claims:</th>
                    </tr>
                    <tr
                      onClick={() => {
                        setActiveMonthFilter(currentMonthCounts?.month_date);
                        setActiveMonthName(currentMonthCounts?.month);
                      }}
                    >
                      <th onClick={() => setActiveStatusFilter("")} className="p-1 font-inter text-center cursor-pointer text-[#000000] text-sm font-normal border-r">
                        {currentMonthCounts?.total_claims}
                        {currLoading && <div className="flex items-center justify-center"><div className="flex animate-spin rounded-full h-5 w-5 border-t-4 border-blue-500 border-solid"></div></div>}
                      </th>
                      <th onClick={() => setActiveStatusFilter("A")} className="p-1 font-inter text-center cursor-pointer text-[#00CA07] text-sm font-normal border-r">
                        {currentMonthCounts?.paid_claims}
                        {currLoading && <div className="flex items-center justify-center"><div className="flex animate-spin rounded-full h-5 w-5 border-t-4 border-blue-500 border-solid"></div></div>}
                      </th>
                      <th onClick={() => setActiveStatusFilter("R")} className="p-1 font-inter text-center cursor-pointer text-[#279b80] text-sm font-normal border-r">
                        {currentMonthCounts?.ready_claims}
                        {currLoading && <div className="flex items-center justify-center"><div className="flex animate-spin rounded-full h-5 w-5 border-t-4 border-blue-500 border-solid"></div></div>}
                      </th>
                      <th onClick={() => setActiveStatusFilter("O")} className="p-1 font-inter text-center cursor-pointer text-amber-500 text-sm font-normal border-r">
                        {currentMonthCounts?.open_claims}
                        {currLoading && <div className="flex items-center justify-center"><div className="flex animate-spin rounded-full h-5 w-5 border-t-4 border-blue-500 border-solid"></div></div>}
                      </th>
                      <th onClick={() => setActiveStatusFilter("D")} className="p-1 font-inter text-center cursor-pointer text-[#FF0000] text-sm font-normal">
                        {currentMonthCounts?.denied_claims}
                        {currLoading && <div className="flex items-center justify-center"><div className="flex animate-spin rounded-full h-5 w-5 border-t-4 border-blue-500 border-solid"></div></div>}
                      </th>
                    </tr>
                  </thead>
                </table>
              </div>
            </div>
          </div>

          {/* Claims Table */}
          <div className="w-full">
            <TotalClaimsFound
              activeStatusFilter={activeStatusFilter}
              activeMonthFilter={activeMonthFilter}
              setActiveMonthFilter={setActiveMonthFilter}
              setActiveMonthName={activeMonthName}
              setActiveStatusFilter={setActiveStatusFilter}
              providerNo={searchedTaxId}
              isAdminView={true}
            />
          </div>
        </>
      )}

      {!searchedTaxId && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Search className="w-16 h-16 mb-4 opacity-30" />
          <p className="text-lg font-medium">Enter a Tax ID to view claim details</p>
          <p className="text-sm mt-1">Search by provider Tax ID to see their claims dashboard</p>
        </div>
      )}
    </div>
  );
};

export default AdminClaimSearch;
