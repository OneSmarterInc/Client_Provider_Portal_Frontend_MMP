import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import MyContext from "../ContextApi/MyContext";
import { useNavigate } from "react-router-dom";
import backgroundImage from "../assets/image.png";

const LoginLogsTable = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { api } = useContext(MyContext);
  const admin_token = localStorage.getItem("authToken");
  const user = JSON.parse(localStorage.getItem("user"));
  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await axios.get(`${api}/auth/login-logs/`);
      setLogs(response.data);
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div
      style={{
        backgroundImage: `url(${backgroundImage})`,
      }}
      className=" min-h-screen p-4 md:p-8 max-w-7xl mx-auto"
    >
      <div className="w-full bg-transparent mb-7">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between px-4 gap-4">
          {/* Left Section: Title, Search, Refresh */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-5 w-full sm:w-auto">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">
              Login Logs
            </h2>
            {/* <div className="flex justify-between gap-4 items-center w-full md:w-auto">
              <div className="w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Search Email or Provider No."
                  className="border border-gray-300 w-full sm:w-auto px-4 placeholder:text-sm py-1 rounded-full text-sm"
                  onChange={(e) => setSearchQuery(e.target.value)}
                  value={searchQuery}
                />
              </div>
              <button
                className="text-teal-500 hover:text-teal-700 text-sm sm:w-28"
                onClick={() => fetchAllUsers()}
              >
                <i className="fa-solid fa-clock-rotate-left mr-1"></i> Refresh
              </button>
            </div> */}
          </div>

          {/* Right Section: User Info */}
          <div className="flex items-center gap-3 mt-3 md:mt-0">
            <div
              className="w-28 text-sm cursor-pointer bg-cyan-600 text-gray-50 p-1  text-center rounded-md"
              onClick={() => navigate("/admin")}
            >
              Verify
            </div>
            <h3 className="font-inter text-sm text-black">
              Welcome, {user?.email}!
            </h3>
            <img
              src="/images/Header/img-11.png"
              alt="Profile"
              className="w-8 sm:w-10"
              aria-label="User profile"
            />
            <div onClick={() => handleLogout()}>
              <img
                className="w-6 cursor-pointer"
                src="/images/Header/Vector.png"
                alt="Logout"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">Loading...</div>
      ) : logs.length === 0 ? (
        <div className="text-center text-gray-500">No login entries found.</div>
      ) : (
        <div className="overflow-auto rounded-lg shadow border border-gray-200">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-100 text-gray-700 text-sm font-semibold">
              <tr>
                <th className="py-3 px-4 text-left">Email</th>
                <th className="py-3 px-4 text-left">IP Address</th>
                <th className="py-3 px-4 text-left">Login Date</th>
                <th className="py-3 px-4 text-left">Login Time</th>
                {/* <th className="py-3 px-4 text-left">Browser Info</th> */}
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr
                  key={log.id}
                  className="border-t hover:bg-gray-50 transition"
                >
                  <td className="py-3 px-4 text-sm text-gray-800">
                    {log.email}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {log.user_ip}
                  </td>
                  <td className="py-3 px-4 text-sm">{log.login_date}</td>
                  <td className="py-3 px-4 text-sm">
                    {log.login_time.split(".")[0]}
                  </td>
                  {/* <td className="py-3 px-4 text-sm truncate max-w-md">
                    {log.user_browser}
                  </td> */}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LoginLogsTable;
