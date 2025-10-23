import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useParams } from "react-router-dom";
import MyContext from "../ContextApi/MyContext";

const ViewEOBDownload = ({ claim_no, isOpen, onClose }) => {
  const { api } = useContext(MyContext);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const location = useLocation();

  const [isExpand, setExpand] = useState(false);

  const { claim_no_from_params } = useParams();

  const onExpand = () => {
    setExpand(!isExpand);
    window.open(`/#/eob-details/${claim_no}`, "_blank");
  };

  useEffect(() => {
    if (isOpen) {
      fetchPdf();
    }
  }, [isOpen]);

  const fetchPdf = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `${api}/eob_new/get_eob?claim_number=${
          claim_no_from_params ? claim_no_from_params : claim_no
        }`,
        // `${api}/portal/get_eob?claim_no=000023629`,
        {
          responseType: "blob",
        }
      );

      const url = URL.createObjectURL(
        new Blob([response.data], { type: "application/pdf" })
      );
      setPdfUrl(url);
    } catch (err) {
      setError("Failed to fetch data. Please try again.");
    }
    setLoading(false);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div
          className={`bg-white rounded-lg shadow-lg w-full p-5 ${
            location.pathname === `/eob-details/${claim_no_from_params}`
              ? " w-screen h-screen rounded-none"
              : " max-w-5xl"
          }`}
        >
          {/* Modal Header */}
          <div className="flex justify-between items-center border-b pb-3">
            <h2 className="text-lg font-semibold text-[#0486A5]">EOB</h2>
            <div className="flex space-x-3">
              {location.pathname !== `/eob-details/${claim_no_from_params}` && (
                <button
                  onClick={() => onClose()}
                  className="text-gray-500 hover:text-red-600 transition"
                >
                  <i className="fa-regular fa-circle-xmark text-2xl text-[#0486A5] hover:text-red-500"></i>
                </button>
              )}

              {location.pathname !== `/eob-details/${claim_no_from_params}` && (
                <button
                  onClick={() => onExpand()}
                  className="text-gray-500 text-xl"
                >
                  <i className="fa-solid fa-up-right-and-down-left-from-center text-xl text-[#0486A5]"></i>
                </button>
              )}
            </div>
          </div>

          {/* PDF Display */}
          <div className="mt-4 h-[80vh]">
            {loading && <p>Loading PDF...</p>}
            {error && <p className="text-red-500">{error}</p>}
            {pdfUrl && (
              <iframe
                src={pdfUrl}
                width="100%"
                height="100%"
                title="EOB PDF"
                style={{ border: "none" }}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ViewEOBDownload;
