import axios from "axios";
import { useState, useEffect, useContext } from "react";
import MyContext from "../ContextApi/MyContext";
import { useNavigate } from "react-router-dom";
import backgroundImage from "../assets/image.png";

const Watchlist = () => {
  const { api } = useContext(MyContext);
  const userData = JSON.parse(localStorage.getItem("user"));
  const [watchlist_id, setId] = useState("");
  const [serviceDate, setServiceDate] = useState("");
  const [watchlistItems, setWatchlistItems] = useState([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const addToWatchlist = async () => {
    if (!watchlist_id || !serviceDate) {
      setMessage("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const response = await axios.post(`${api}/api/watchlist/add/`, {
        provider_no: userData?.provider_no,
        watchlist_id: watchlist_id,
        serviceDate: serviceDate,
        email: userData?.email,
        status: "ID Not Added Yet",
      });

      const newItem = {
        watchlist_id,
        serviceDate,
        status: "ID Not Added Yet",
        addedAt: new Date().toISOString(),
      };

      setWatchlistItems((prev) => [newItem, ...prev]);
      setMessage("Successfully added to watchlist!");
      setId("");
      setServiceDate("");
    } catch (error) {
      setMessage("Failed to add to watchlist");
    } finally {
      setIsLoading(false);
    }
  };

  const [watchlistDataLoading, setwatchlistDataLoading] = useState(false);
  const fetchWatchlistItems = async () => {
    setWatchlistItems([])
    setwatchlistDataLoading(true);
    try {
 
      const response = await axios.get(
        `${api}/api/watchlist/by-email/?email=${userData?.email}`
      );

      setWatchlistItems(response?.data);
    } catch (error) {
      setMessage("Failed to fetch watchlist items");
    } finally {
      setwatchlistDataLoading(false);
    }
  };

  useEffect(() => {
    fetchWatchlistItems();
  }, []);

  return (
    <div
      style={{
        backgroundImage: `url(${backgroundImage})`,
      }}
    >
      <div className="container mx-auto p-4 max-w-4xl">
        <h1 className="text-2xl text-center font-bold mb-2 text-gray-800">
          Watchlist
        </h1>

        <div className=" rounded-lg border shadow-sm p-6 mb-6">
          <div className="flex justify-between items-start">
            {" "}
            <h2 className="text-xl font-semibold mb-4 text-gray-700">
              Add to Watchlist
            </h2>
            <button
              className="flex gap-1 items-center"
              onClick={() => navigate("/members")}
            >
              {" "}
              <span className="hover:text-teal-600 cursor-pointer">
                {" "}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              Go Back
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 items-end gap-4 mb-4">
            <div>
              <label
                htmlFor="watchlist_id"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                ID (MEMBER ID)
              </label>
              <input
                type="text"
                id="watchlist_id"
                value={watchlist_id}
                onChange={(e) => setId(e.target.value)}
                className="w-full px-3 py-1 border border-gray-300 text-sm rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter ID"
              />
            </div>
            <div>
              <label
                htmlFor="serviceDate"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Service Date
              </label>
              <input
                type="date"
                id="serviceDate"
                value={serviceDate}
                onChange={(e) => setServiceDate(e.target.value)}
                className="w-full px-3 py-1 border border-gray-300 text-sm rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>{" "}
            <button
              onClick={addToWatchlist}
              disabled={isLoading}
              className={`px-4 py-1 rounded-md text-white font-medium ${
                isLoading ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
              } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
            >
              {isLoading ? "Adding..." : "Add to Watchlist"}
            </button>
          </div>

          {message && (
            <p
              className={`mt-3 text-sm ${
                message.includes("Success") ? "text-green-600" : "text-red-600"
              }`}
            >
              {message}
            </p>
          )}
        </div>

        <div className="  p-6 pt-2">
          <div className="flex justify-between items-center">
            {" "}
            <h2 className="text-xl font-semibold mb-4 text-gray-700">
              My Watchlist
            </h2>
            <button
              className="text-teal-500 hover:text-teal-700"
              onClick={() => fetchWatchlistItems()}
            >
              <i class="fa-solid fa-clock-rotate-left"></i> Refresh
            </button>
          </div>

          {watchlistDataLoading && watchlistItems.length === 0 ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : watchlistItems.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              Your watchlist is empty
            </p>
          ) : (
            <div className="overflow-x-auto h-80 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      ID
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Service Date
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {watchlistItems?.reverse()?.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                        {item.watchlist_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap  text-center text-sm text-gray-500">
                        {item.serviceDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap  text-center text-sm">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${
                          item?.status?.trim() === "ID Found"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Watchlist;
