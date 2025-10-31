import React, { useState, useContext } from "react";
import backgroundImage from "../assets/image.png";
import MyContext from "../ContextApi/MyContext";
import { useNavigate } from "react-router-dom";

const NewProviderRegister = () => {
  const [formData, setFormData] = useState({
    PRNUM: "",
    PRADR1: "",
    PRADR2: "",
    PRADR3: "",
    PRADR4: "",
    PRCITY: "",
    PRST: "",
    PRZIP5: "",
    PRZIP4: "",
    PRZIP2: "",
    PRTITL: "",
    provider_name: "",
    provider_email: "",
  });

  const [w9Form, setW9Form] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  //  New screen states
  const [step, setStep] = useState("form"); // form → preview → success

  const { api } = useContext(MyContext);
  const navigate = useNavigate();

  // Field label mapping
  const fieldLabels = {
    provider_name: "Provider Name",
    PRNUM: "Provider Number",
    provider_email: "Provider Email",
    PRADR1: "Address 1",
    PRADR2: "Address 2",
    PRADR3: "Address 3",
    PRADR4: "Address 4",
    PRCITY: "City",
    PRST: "State",
    PRZIP5: "ZIP 1",
    PRZIP4: "ZIP 2",
    PRZIP2: "ZIP 3",
    PRTITL: "Title",
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setW9Form(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(""); 

    try {
      const sendData = new FormData();

      Object.entries(formData).forEach(([key, value]) => {
        sendData.append(key, value);
      });

      if (w9Form) {
        sendData.append("w9Form", w9Form);
      }

      const response = await fetch(`${api}/new/provider/submit/`, {
        method: "POST",
        body: sendData,
      });

      const result = await response.json();
      console.log(result);

      if (response.ok) {
        setSuccessMessage(
          " Registration submitted successfully. Admin will review your request and send confirmation to your email."
        );
        setStep("success");
      } else {
        // Handle error response
        if (result.error) {
          setErrorMessage(result.error);
        } else {
          setErrorMessage(
            "An error occurred during submission. Please try again."
          );
        }
      }
    } catch (error) {
      console.log(error);
      setErrorMessage(
        "Network error. Please check your connection and try again."
      );
    }
  };

  const divStyle = {
    backgroundImage: `url(${backgroundImage})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };

  return (
    <div
      style={divStyle}
      className="min-h-screen bg-gray-100 flex justify-center items-start py-5 px-4"
    >
      <div className="w-full max-w-3xl bg-white/40 backdrop-blur-1">
        {/* Header */}
        <div className="px-8 py-5 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-[#0486A5]">
            New Provider Registration
          </h1>
        </div>

        {/* Body */}
        <div className="p-8 pt-4">
          {/*  FORM SCREEN */}
          {step === "form" && (
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                setStep("preview");
              }}
            >
              {/* Provider Name */}
              <div>
                <label className="block mb-1 font-medium text-[#0486A5]">
                  Provider Name *
                </label>
                <input
                  type="text"
                  name="provider_name"
                  value={formData.provider_name}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-1 focus:border-[#0486A5]"
                />
              </div>

              {/* Provider Number */}
              <div>
                <label className="block mb-1 font-medium text-[#0486A5]">
                  Provider Number *
                </label>
                <input
                  type="text"
                  name="PRNUM"
                  value={formData.PRNUM}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-1 focus:border-[#0486A5]"
                />
              </div>

              {/* Provider Email */}
              <div>
                <label className="block mb-1 font-medium text-[#0486A5]">
                  Provider Email *
                </label>
                <input
                  type="text"
                  name="provider_email"
                  value={formData.provider_email}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-1 focus:border-[#0486A5]"
                />
              </div>

              {/* Addresses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {["PRADR1", "PRADR2", "PRADR3", "PRADR4"].map(
                  (field, index) => (
                    <div key={field}>
                      <label className="block mb-1 font-medium text-[#0486A5]">
                        Address {index + 1}
                      </label>
                      <input
                        type="text"
                        name={field}
                        value={formData[field]}
                        onChange={handleChange}
                        required={index + 1 === 1}
                        className="w-full border border-gray-300 rounded-lg px-4 py-1 focus:border-[#0486A5]"
                      />
                    </div>
                  )
                )}
              </div>

              {/* City / State */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block mb-1 font-medium text-[#0486A5]">
                    City*
                  </label>
                  <input
                    type="text"
                    name="PRCITY"
                    value={formData.PRCITY}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-1 focus:border-[#0486A5]"
                  />
                </div>

                <div>
                  <label className="block mb-1 font-medium text-[#0486A5]">
                    State*
                  </label>
                  <input
                    type="text"
                    name="PRST"
                    value={formData.PRST}
                    required
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-1 focus:border-[#0486A5]"
                  />
                </div>
              </div>

              {/* ZIP fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {["PRZIP5", "PRZIP4", "PRZIP2"].map((field, index) => (
                  <div key={field}>
                    <label className="block mb-1 font-medium text-[#0486A5]">
                      ZIP {index + 1}
                    </label>
                    <input
                      type="text"
                      name={field}
                      value={formData[field]}
                      required={index + 1 === 1}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-1 focus:border-[#0486A5]"
                    />
                  </div>
                ))}
              </div>

              {/* Title */}
              <div>
                <label className="block mb-1 font-medium text-[#0486A5]">
                  Title
                </label>
                <input
                  type="text"
                  name="PRTITL"
                  value={formData.PRTITL}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-1 focus:border-[#0486A5]"
                />
              </div>

              {/* W9 File */}
              <div>
                <label className="block mb-1 font-medium text-[#0486A5]">
                  Upload W9 Form (PDF)*
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white"
                />
              </div>

              {/* Continue Button */}
              <button
                type="submit"
                className="w-full border-2 border-[#0486A5] text-[#0486A5] font-semibold py-2 rounded-lg hover:bg-[#0486A5] hover:text-white transition"
              >
                Continue → Preview
              </button>
            </form>
          )}

          {/*  PREVIEW SCREEN */}
          {step === "preview" && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-[#0486A5]">
                Preview Details
              </h2>

              <div className="bg-white p-4 rounded-lg border border-gray-300 space-y-2">
                {Object.entries(formData).map(([key, value]) => (
                  <p key={key} className="text-sm">
                    <strong>{fieldLabels[key] || key}:</strong> {value || "-"}
                  </p>
                ))}
                {w9Form && (
                  <p className="text-sm">
                    <strong>W9 Form:</strong> {w9Form.name}
                  </p>
                )}
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="p-4 text-red-700 bg-red-100 border border-red-300 rounded-lg">
                  {errorMessage}
                </div>
              )}

              <div className="flex gap-4 mt-4">
                <button
                  onClick={() => {
                    setStep("form");
                    setErrorMessage("");
                  }}
                  className="w-1/2 border-2 border-gray-400 text-gray-600 py-2 rounded-lg hover:bg-gray-200"
                >
                  Back to Edit
                </button>

                <button
                  onClick={handleSubmit}
                  className="w-1/2 border-2 border-green-600 text-green-600 font-semibold py-2 rounded-lg hover:bg-green-600 hover:text-white"
                >
                  Submit
                </button>
              </div>
            </div>
          )}

          {/*  SUCCESS SCREEN */}
          {step === "success" && (
            <div className="text-center">
              <div className="mb-4 p-4 text-green-700 bg-green-100 border border-green-300 rounded-lg">
                {successMessage}
              </div>

              <button
                onClick={() => navigate("/register")}
                className="w-full border-2 border-[#0486A5] text-[#0486A5] font-semibold py-2 rounded-lg hover:bg-[#0486A5] hover:text-white transition"
              >
                Go to Register / Login →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewProviderRegister;
