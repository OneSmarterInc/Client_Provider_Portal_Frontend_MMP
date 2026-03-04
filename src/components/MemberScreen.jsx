import React, { useContext, useEffect, useState } from "react";
import backgroundImage from "../assets/image.png";
import TotalClaimsFound from "./TotalClaimsFound";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import W9FromSubmission from "./W9FromSubmission";
import MyContext from "../ContextApi/MyContext";
import AccountVerification from "./AccountVerification";
import MemberScreenNavbar from "./MemberScreenNavbar";

const MemberScreen = () => {
  const { api, activeProvider, approvedProviders, switchProvider } = useContext(MyContext);
  const [isOpenList, setIsOpenList] = useState(false);
  const [showW9Form, setShowW9Form] = useState(false);
  const [showMyProfile, setShowMyProfile] = useState(false);
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };
  const [prevLoading, setPrevLoading] = useState(false);
  const [currLoading, setCurrLoading] = useState(false);

  const user = JSON.parse(localStorage.getItem("user"));
  const provider_no = activeProvider?.provider_no || user?.provider_no;

  // Auto-switch to a Tax ID that has W9 if current one doesn't
  useEffect(() => {
    if (activeProvider && approvedProviders?.length > 0) {
      const activeTaxId = (activeProvider.provider_no || "").trim();
      const taxIdHasW9 = approvedProviders.some(
        (p) =>
          (p.provider_no || "").trim() === activeTaxId &&
          (p.w9_status === "approved" || p.w9_status === "W9_form_uploaded")
      );
      if (!taxIdHasW9) {
        const w9Provider = approvedProviders.find(
          (p) => p.w9_status === "approved" || p.w9_status === "W9_form_uploaded"
        );
        if (w9Provider) switchProvider(w9Provider);
      }
    }
  }, [activeProvider, approvedProviders]);

  useEffect(() => {
    fetchPreviousMonthCounts();
    fetchcurrentMonthCounts();
  }, [activeProvider]);

  const [currentMonthCounts, setCurrentMonthCount] = useState({});
  const fetchcurrentMonthCounts = async () => {
    try {
      setCurrLoading(true);
      const response = await axios.get(
        `${api}/fetch-claim-count/?month=current&provider_no=${provider_no}`
      );

      setCurrentMonthCount(response?.data);
    } catch (error) {
      console.log("object");
    } finally {
      setCurrLoading(false);
    }
  };

  const [previousMonthCounts, setPreviousMonthCount] = useState({});
  const fetchPreviousMonthCounts = async () => {
    try {
      setPrevLoading(true);
      const response = await axios.get(
        `${api}/fetch-claim-count/?month=previous&provider_no=${provider_no}`
      );

      setPreviousMonthCount(response?.data);
    } catch (error) {
      console.log("object");
    } finally {
      setPrevLoading(false);
    }
  };

  console.log("Previous Months Count:", previousMonthCounts);
  console.log("Current Month Counts:", currentMonthCounts);

  const [activeStatusFilter, setActiveStatusFilter] = useState("");
  const [activeMonthFilter, setActiveMonthFilter] = useState("");
  const [activeMonthName, setActiveMonthName] = useState("");
  console.log(
    "activeStatusFilter:",
    activeStatusFilter,
    "month:",
    activeMonthFilter
  );

  return (
    <div
      style={{
        backgroundImage: `url(${backgroundImage})`,
      }}
      className="min-h-screen bg bg-cover pt-8 gap-4"
    >
      <div className="">
        <MemberScreenNavbar
          isOpenList={isOpenList}
          setIsOpenList={setIsOpenList}
          setShowMyProfile={setShowMyProfile}
          setShowW9Form={setShowW9Form}
          user={user}
        />
      </div>

      <div className="">
        <W9FromSubmission
          showW9Form={showW9Form}
          setShowW9Form={setShowW9Form}
        />
      </div>
      {showMyProfile && (
        <div className="">
          {" "}
          <AccountVerification
            showMyProfile={showMyProfile}
            setShowMyProfile={setShowMyProfile}
          />{" "}
        </div>
      )}

      <div className="flex justify-end md:mx-20 px-8 mt-4">
        <button
          onClick={() => {
            fetchPreviousMonthCounts();
            fetchcurrentMonthCounts();
          }}
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

      <div className="flex gap-3 flex-col md:mx-20 my-5 sm:my-2 md:flex-row px-8">
        {/* February Table */}
        <div className="border rounded-tl-lg rounded-bl-lg border-gray-300 pt-2 bg-white w-full md:w-1/2">
          <h2 className="font-inter text-[14px] font-medium mb-2 pl-2">
            {previousMonthCounts?.month} {new Date().getMonth() === 0 ? new Date().getFullYear() - 1 : new Date().getFullYear()} (Last Month)
          </h2>
          <div className="border overflow-hidden rounded-bl-lg border-white">
            <table className="w-full rounded-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-1 font-inter text-center text-[#000000] text-sm font-normal border-r">
                    Total Claims:
                  </th>
                  <th className="p-1 font-inter text-center text-[#00CA07] text-sm font-normal border-r">
                    Paid Claims:
                  </th>
                  <th className="p-1 font-inter text-center text-[#279b80] text-sm font-normal border-r">
                    Ready to Release:
                  </th>
                  <th className="p-1 font-inter text-center text-amber-500 text-sm font-normal border-r">
                    Open Claims:
                  </th>
                  <th className="p-1 font-inter text-center text-[#FF0000] text-sm font-normal">
                    Denied Claims:
                  </th>
                </tr>
                <tr
                  onClick={() => {
                    setActiveMonthFilter(previousMonthCounts?.month_date);
                    setActiveMonthName(previousMonthCounts?.month);
                  }}
                  className="bg-gray-100"
                >
                  <th
                    onClick={() => {
                      setActiveStatusFilter("");
                    }}
                    className="p-1 font-inter text-center cursor-pointer text-[#000000] text-sm font-normal border-r"
                  >
                    {previousMonthCounts?.total_claims}{" "}
                    {prevLoading && (
                      <div className="flex items-center justify-center">
                        {" "}
                        <div className=" flex animate-spin rounded-full h-5 w-5 border-t-4 border-blue-500 border-solid"></div>
                      </div>
                    )}
                  </th>
                  <th
                    onClick={() => setActiveStatusFilter("A")}
                    className="p-1 font-inter text-center cursor-pointer text-[#00CA07] text-sm font-normal border-r"
                  >
                    {previousMonthCounts?.paid_claims}{" "}
                    {prevLoading && (
                      <div className="flex items-center justify-center">
                        {" "}
                        <div className=" flex animate-spin rounded-full h-5 w-5 border-t-4 border-blue-500 border-solid"></div>
                      </div>
                    )}
                  </th>
                  <th
                    onClick={() => setActiveStatusFilter("R")}
                    className="p-1 font-inter text-center cursor-pointer text-[#279b80] text-sm font-normal border-r"
                  >
                    {previousMonthCounts?.ready_claims}{" "}
                    {prevLoading && (
                      <div className="flex items-center justify-center">
                        {" "}
                        <div className=" flex animate-spin rounded-full h-5 w-5 border-t-4 border-blue-500 border-solid"></div>
                      </div>
                    )}
                  </th>
                  <th
                    onClick={() => setActiveStatusFilter("O")}
                    className="p-1 font-inter text-center cursor-pointer text-amber-500 text-sm font-normal border-r"
                  >
                    {previousMonthCounts?.open_claims}{" "}
                    {prevLoading && (
                      <div className="flex items-center justify-center">
                        {" "}
                        <div className=" flex animate-spin rounded-full h-5 w-5 border-t-4 border-blue-500 border-solid"></div>
                      </div>
                    )}
                  </th>
                  <th
                    onClick={() => setActiveStatusFilter("D")}
                    className="p-1 font-inter text-center cursor-pointer text-[#FF0000] text-sm font-normal"
                  >
                    {previousMonthCounts?.denied_claims}{" "}
                    {prevLoading && (
                      <div className="flex items-center justify-center">
                        {" "}
                        <div className=" flex animate-spin rounded-full h-5 w-5 border-t-4 border-blue-500 border-solid"></div>
                      </div>
                    )}
                  </th>
                </tr>
              </thead>
            </table>
          </div>
        </div>

        {/* March Table */}
        <div className="border rounded-lg border-sky-400 pt-2  w-full md:w-1/2 bg-blue-50">
          <h2 className="font-inter font-medium text-[14px] mb-2 pl-2 text-[#0486A5]">
            {currentMonthCounts?.month} {new Date().getFullYear()} (Current Month)
          </h2>
          <div className="border overflow-hidden border-white rounder-bl-full">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-1 font-inter text-center text-[#000000] text-sm font-normal border-r">
                    Total Claims:
                  </th>
                  <th className="p-1 font-inter text-center text-[#00CA07] text-sm font-normal border-r">
                    Paid Claims:
                  </th>
                  <th className="p-1 font-inter text-center text-[#279b80] text-sm font-normal border-r">
                    Ready to Release:
                  </th>
                  <th className="p-1 font-inter text-center text-amber-500 text-sm font-normal border-r">
                    Open Claims:
                  </th>
                  <th className="p-1 font-inter text-center text-[#FF0000] text-sm font-normal">
                    Denied Claims:
                  </th>
                </tr>
                <tr
                  onClick={() => {
                    setActiveMonthFilter(currentMonthCounts?.month_date);
                    setActiveMonthName(currentMonthCounts?.month);
                  }}
                >
                  {" "}
                  <th
                    onClick={() => setActiveStatusFilter("")}
                    className="p-1 font-inter text-center cursor-pointer text-[#000000] text-sm font-normal border-r"
                  >
                    {currentMonthCounts?.total_claims}{" "}
                    {currLoading && (
                      <div className="flex items-center justify-center">
                        {" "}
                        <div className=" flex animate-spin rounded-full h-5 w-5 border-t-4 border-blue-500 border-solid"></div>
                      </div>
                    )}
                  </th>
                  <th
                    onClick={() => setActiveStatusFilter("A")}
                    className="p-1 font-inter text-center cursor-pointer text-[#00CA07] text-sm font-normal border-r"
                  >
                    {currentMonthCounts?.paid_claims}{" "}
                    {currLoading && (
                      <div className="flex items-center justify-center">
                        {" "}
                        <div className=" flex animate-spin rounded-full h-5 w-5 border-t-4 border-blue-500 border-solid"></div>
                      </div>
                    )}
                  </th>
                  <th
                    onClick={() => setActiveStatusFilter("R")}
                    className="p-1 font-inter text-center cursor-pointer text-[#279b80] text-sm font-normal border-r"
                  >
                    {currentMonthCounts?.ready_claims}{" "}
                    {currLoading && (
                      <div className="flex items-center justify-center">
                        {" "}
                        <div className=" flex animate-spin rounded-full h-5 w-5 border-t-4 border-blue-500 border-solid"></div>
                      </div>
                    )}
                  </th>
                  <th
                    onClick={() => setActiveStatusFilter("O")}
                    className="p-1 font-inter text-center cursor-pointer text-amber-500 text-sm font-normal border-r"
                  >
                    {currentMonthCounts?.open_claims}{" "}
                    {currLoading && (
                      <div className="flex items-center justify-center">
                        {" "}
                        <div className=" flex animate-spin rounded-full h-5 w-5 border-t-4 border-blue-500 border-solid"></div>
                      </div>
                    )}
                  </th>
                  <th
                    onClick={() => setActiveStatusFilter("D")}
                    className="p-1 font-inter text-center cursor-pointer text-[#FF0000] text-sm font-normal"
                  >
                    {currentMonthCounts?.denied_claims}{" "}
                    {currLoading && (
                      <div className="flex items-center justify-center">
                        {" "}
                        <div className=" flex animate-spin rounded-full h-5 w-5 border-t-4 border-blue-500 border-solid"></div>
                      </div>
                    )}
                  </th>{" "}
                </tr>
              </thead>
            </table>
          </div>
        </div>
      </div>

      {/* Claims Table Section */}
      <div className="px-4 md:px-24 mb-20 w-full">
        <TotalClaimsFound
          activeStatusFilter={activeStatusFilter}
          activeMonthFilter={activeMonthFilter}
          setActiveMonthFilter={setActiveMonthFilter}
          setActiveMonthName={activeMonthName}
          setActiveStatusFilter={setActiveStatusFilter}
        />
      </div>
    </div>
  );
};

export default MemberScreen;
