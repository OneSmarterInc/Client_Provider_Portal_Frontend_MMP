import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import backgroundImage from "../assets/image.png";
import { Edit, Phone, AtSign, Check, Eye, EyeOff, Loader2, Plus, Trash2 } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import MyContext from "../ContextApi/MyContext";

const InputField = ({
  label,
  name,
  placeholder,
  icon: Icon,
  disabled = false,
  value,
  onChange,
  type = "text",
  error,
  onIconClick,
  showPasswordToggle = false,
  isPasswordVisible = false,
}) => {
  return (
    <div className="flex flex-col w-full">
      <label htmlFor={label} className="text-gray-500 text-sm">
        {name} <span className="text-red-600">*</span>
      </label>
      <div
        className={`flex flex-row bg-white border-2 rounded justify-between h-10 p-2 ${
          disabled ? "opacity-50" : ""
        } ${error ? "border-red-500" : "border-gray-300"}`}
      >
        <input
          className="border-0 w-full outline-none"
          type={type}
          placeholder={placeholder}
          id={label}
          disabled={disabled}
          value={value}
          onChange={onChange}
        />
        <div
          className="items-center justify-center pt-1 border-l-2 p-2 cursor-pointer"
          onClick={onIconClick}
        >
          {showPasswordToggle ? (
            isPasswordVisible ? (
              <EyeOff className="w-4 h-4 text-[#0486A5] text-center" />
            ) : (
              <Eye className="w-4 h-4 text-[#0486A5] text-center" />
            )
          ) : (
            <Icon className="w-4 h-4 text-[#0486A5] text-center" />
          )}
        </div>
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};

const Register = () => {
  const { api } = useContext(MyContext);
  const navigate = useNavigate();

  // Multi-provider state: each entry has Tax ID + NPI
  const [providerEntries, setProviderEntries] = useState([
    { provider_no: "", npi: "", providerValidated: false, npiValidated: false, validatingProvider: false, validatingNpi: false },
  ]);

  const [formData, setFormData] = useState({
    email: "",
    phone_no: "",
    password: "",
    confirm_password: "",
  });

  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  const [errors, setErrors] = useState({});
  const [isRegistering, setIsRegistering] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(null);

  // At least one of (providerValidated, npiValidated) must be true per entry
  const allProvidersValidated = providerEntries.length > 0 && providerEntries.every(
    (e) => e.providerValidated || e.npiValidated
  );

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
    if (errors[id]) {
      setErrors({ ...errors, [id]: "" });
    }
  };

  const handleProviderChange = (index, field, value) => {
    const updated = [...providerEntries];
    updated[index][field] = value;
    // Reset validation when user changes value
    if (field === "provider_no") {
      updated[index].providerValidated = false;
      updated[index].npiValidated = false;
    }
    if (field === "npi") {
      updated[index].npiValidated = false;
    }
    setProviderEntries(updated);
  };

  const addProviderEntry = () => {
    setProviderEntries([...providerEntries, { provider_no: "", npi: "", providerValidated: false, npiValidated: false, validatingProvider: false, validatingNpi: false }]);
  };

  const removeProviderEntry = (index) => {
    if (providerEntries.length <= 1) return;
    setShowRemoveConfirm(index);
  };

  const confirmRemoveProvider = () => {
    setProviderEntries(providerEntries.filter((_, i) => i !== showRemoveConfirm));
    setShowRemoveConfirm(null);
  };

  // Validate Tax ID
  const handleValidateTaxId = async (index) => {
    const entry = providerEntries[index];
    if (!entry.provider_no.trim()) {
      toast.error("Tax ID is required.");
      return;
    }
    if (entry.provider_no.trim().length > 9) {
      toast.error("Tax ID must be 9 characters or less.");
      return;
    }

    const updated = [...providerEntries];
    updated[index].validatingProvider = true;
    setProviderEntries(updated);

    try {
      const response = await axios.get(`${api}/check_provno_exists_for_login/`, {
        params: { provider_no: entry.provider_no },
      });

      const updatedAfter = [...providerEntries];
      updatedAfter[index].validatingProvider = false;

      if (response.data.is_exist) {
        if (response.data.is_already_registered) {
          updatedAfter[index].providerValidated = true;
          const emails = response.data.registered_emails?.join(", ") || "another account";
          toast.warn(`Tax ID ${entry.provider_no} is already registered under ${emails}. You can still proceed with registration.`);
        } else {
          updatedAfter[index].providerValidated = true;
          toast.success(`Tax ID ${entry.provider_no} validated!`);
        }
      } else {
        updatedAfter[index].providerValidated = false;
        setShowRegisterModal(true);
      }
      setProviderEntries(updatedAfter);
    } catch (error) {
      const updatedAfter = [...providerEntries];
      updatedAfter[index].validatingProvider = false;
      setProviderEntries(updatedAfter);
      toast.error("Failed to validate Tax ID. Please try again.");
    }
  };

  // Validate NPI
  const handleValidateNpi = async (index) => {
    const entry = providerEntries[index];
    if (!entry.npi.trim()) {
      toast.error("NPI is required.");
      return;
    }

    const updated = [...providerEntries];
    updated[index].validatingNpi = true;
    setProviderEntries(updated);

    try {
      let response;
      if (entry.providerValidated && entry.provider_no.trim()) {
        // Tax ID already validated — check NPI under that Tax ID
        response = await axios.get(`${api}/check_npi_exists/`, {
          params: { provider_no: entry.provider_no, npi: entry.npi },
        });
      } else {
        // NPI only — auto-fetch Tax ID from DB2
        response = await axios.get(`${api}/check_npi_only/`, {
          params: { npi: entry.npi },
        });
      }

      const updatedAfter = [...providerEntries];
      updatedAfter[index].validatingNpi = false;

      if (response.data.is_exist) {
        if (response.data.is_already_registered) {
          updatedAfter[index].npiValidated = true;
          // If NPI-only lookup returned provider_no, auto-fill it
          if (response.data.provider_no && !updatedAfter[index].provider_no.trim()) {
            updatedAfter[index].provider_no = response.data.provider_no;
            updatedAfter[index].providerValidated = true;
          }
          const emails = response.data.registered_emails?.join(", ") || "another account";
          toast.warn(`NPI ${entry.npi} is already registered under ${emails}. You can still proceed with registration.`);
        } else {
          updatedAfter[index].npiValidated = true;
          // If NPI-only lookup returned provider_no, auto-fill it
          if (response.data.provider_no && !updatedAfter[index].provider_no.trim()) {
            updatedAfter[index].provider_no = response.data.provider_no;
            updatedAfter[index].providerValidated = true;
          }
          toast.success(`NPI ${entry.npi} validated!`);
        }
      } else {
        updatedAfter[index].npiValidated = false;
        updatedAfter[index].npi = "";
        toast.error("NPI not found in our records. You can register with just your Tax ID and add an NPI later.");
      }
      setProviderEntries(updatedAfter);
    } catch (error) {
      const updatedAfter = [...providerEntries];
      updatedAfter[index].validatingNpi = false;
      setProviderEntries(updatedAfter);
      toast.error("Failed to validate NPI. Please try again.");
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.phone_no.trim()) {
      newErrors.phone_no = "Phone number is required";
    } else if (!/^\d{10,15}$/.test(formData.phone_no)) {
      newErrors.phone_no = "Please enter a valid phone number";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (
      !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()\-_=+{};:,<.>]).{8,}$/.test(
        formData.password
      )
    ) {
      newErrors.password =
        "Password must contain uppercase, lowercase, number and special character";
    }

    if (!formData.confirm_password) {
      newErrors.confirm_password = "Please confirm your password";
    } else if (formData.password !== formData.confirm_password) {
      newErrors.confirm_password = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const [showRegisterModal, setShowRegisterModal] = useState(false);

  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsRegistering(true);
    try {
      const provider_numbers = providerEntries.map((e) => ({
        provider_no: e.provider_no,
        npi: e.npi,
      }));
      const payload = {
        provider_no: provider_numbers[0]?.provider_no || "",
        provider_numbers,
        email: formData.email,
        phone_no: formData.phone_no,
        password: formData.password,
        confirm_password: formData.confirm_password,
      };

      const response = await axios.post(`${api}/auth/send-register-otp/`, payload);

      setVerificationToken(response.data.verification_token);
      setShowOtpModal(true);
      toast.success("OTP sent to your email!");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to send OTP. Please try again.");
    } finally {
      setIsRegistering(false);
    }
  };

  const handleVerifyOtp = async () => {
    setIsVerifyingOtp(true);
    try {
      const provider_numbers = providerEntries.map((e) => ({
        provider_no: e.provider_no,
        npi: e.npi,
      }));
      const payload = {
        ...formData,
        provider_no: provider_numbers[0]?.provider_no || "",
        provider_numbers,
        otp,
        verification_token: verificationToken,
      };

      await axios.post(`${api}/auth/verify-register-otp/`, payload);

      toast.success("Registration successful! Your account is pending admin approval.");
      setShowOtpModal(false);
      navigate("/login");
    } catch (error) {
      toast.error(error.response?.data?.error || "Invalid or expired OTP. Please try again.");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const toggleConfirmPasswordVisibility = () => {
    setIsConfirmPasswordVisible(!isConfirmPasswordVisible);
  };

  const divStyle = {
    backgroundImage: `url(${backgroundImage})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };

  return (
    <div style={divStyle}>
      <div className="flex flex-col justify-center min-h-screen w-[90%] mx-auto gap-8">
        {/* Back and Log In Link */}
        <div className="flex justify-end space-x-2">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-700 hover:text-gray-900"
          >
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
            Back
          </button>
          <p className="text-gray-900 mt-0.5 font-medium text-right text-sm">
            Already have a Flex account?{" "}
            <span
              className="text-[#0486A5] cursor-pointer hover:underline"
              onClick={() => navigate("/login")}
            >
              Log In
            </span>
          </p>
        </div>

        {/* Heading */}
        <div className="flex flex-col justify-center text-black-900 items-center mx-auto gap-2">
          <h1 className="text-center text-2xl font-bold">Get Started</h1>
          <p className="text-center text-sm text-gray-700 max-w-md">
            Please enter your Tax ID and/or NPI to start the registration process.
            At least one is required per provider entry.
          </p>
        </div>

        {/* Input Fields */}
        <div className="flex flex-col gap-6 justify-center items-center mx-auto w-full max-w-4xl">
          {/* Provider Numbers Section */}
          {providerEntries.map((entry, index) => (
            <div key={index} className="flex flex-col gap-2 w-full p-4 border rounded-lg bg-white/50">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Provider {providerEntries.length > 1 ? `#${index + 1}` : ""}
                </span>
                {providerEntries.length > 1 && (
                  <button
                    onClick={() => removeProviderEntry(index)}
                    className="text-red-500 hover:text-red-700 p-1"
                    title="Remove this provider"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Tax ID Row */}
              <div className="flex items-end flex-row gap-3 w-full">
                <div className="flex flex-col flex-1">
                  <label className="text-gray-500 text-sm">
                    Tax ID
                  </label>
                  <div
                    className={`flex flex-row bg-white border-2 rounded justify-between h-10 p-2 ${
                      entry.providerValidated ? "opacity-50 border-green-400" : "border-gray-300"
                    }`}
                  >
                    <input
                      className="border-0 w-full outline-none"
                      type="text"
                      placeholder="Enter Tax ID"
                      value={entry.provider_no}
                      onChange={(e) => handleProviderChange(index, "provider_no", e.target.value)}
                      disabled={entry.providerValidated}
                    />
                    <div className="items-center justify-center pt-1 border-l-2 p-2">
                      <Edit className="w-4 h-4 text-[#0486A5] text-center" />
                    </div>
                  </div>
                </div>

                <button
                  className={`flex items-center justify-center w-32 py-2 px-3 rounded-lg text-sm ${
                    entry.providerValidated
                      ? "bg-green-500 text-white"
                      : "bg-[#0486A5] hover:bg-[#047B95] text-white"
                  }`}
                  onClick={() => handleValidateTaxId(index)}
                  disabled={entry.providerValidated || entry.validatingProvider || !entry.provider_no.trim()}
                >
                  {entry.validatingProvider ? (
                    <>
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                      Validating
                    </>
                  ) : entry.providerValidated ? (
                    <>
                      <Check className="mr-1 h-4 w-4" /> Validated
                    </>
                  ) : (
                    "Validate"
                  )}
                </button>
              </div>

              {/* NPI Row */}
              <div className="flex items-end flex-row gap-3 w-full">
                <div className="flex flex-col flex-1">
                  <label className="text-gray-500 text-sm">
                    NPI <span className="text-gray-400 text-xs">(optional if Tax ID provided)</span>
                  </label>
                  <div
                    className={`flex flex-row bg-white border-2 rounded justify-between h-10 p-2 ${
                      entry.npiValidated ? "opacity-50 border-green-400" : "border-gray-300"
                    }`}
                  >
                    <input
                      className="border-0 w-full outline-none"
                      type="text"
                      placeholder="Enter NPI"
                      value={entry.npi}
                      onChange={(e) => handleProviderChange(index, "npi", e.target.value)}
                      disabled={entry.npiValidated}
                    />
                    <div className="items-center justify-center pt-1 border-l-2 p-2">
                      <Edit className="w-4 h-4 text-[#0486A5] text-center" />
                    </div>
                  </div>
                </div>

                <button
                  className={`flex items-center justify-center w-32 py-2 px-3 rounded-lg text-sm ${
                    entry.npiValidated
                      ? "bg-green-500 text-white"
                      : "bg-[#0486A5] hover:bg-[#047B95] text-white"
                  }`}
                  onClick={() => handleValidateNpi(index)}
                  disabled={entry.npiValidated || entry.validatingNpi || !entry.npi.trim()}
                >
                  {entry.validatingNpi ? (
                    <>
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                      Validating
                    </>
                  ) : entry.npiValidated ? (
                    <>
                      <Check className="mr-1 h-4 w-4" /> Validated
                    </>
                  ) : (
                    "Validate"
                  )}
                </button>
              </div>

              {/* Status indicator */}
              {(entry.providerValidated || entry.npiValidated) && (
                <p className="text-xs text-green-600 mt-1">
                  {entry.providerValidated && entry.npiValidated
                    ? "Tax ID and NPI validated"
                    : entry.providerValidated
                    ? "Tax ID validated"
                    : "NPI validated (Tax ID auto-fetched)"}
                </p>
              )}
            </div>
          ))}

          {/* Add more providers button */}
          <button
            onClick={addProviderEntry}
            className="flex items-center gap-2 text-[#0486A5] hover:text-[#047B95] text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Add another provider
          </button>

          {/* Other fields */}
          <div className="flex flex-row gap-6 w-full">
            <InputField
              label="email"
              name="Email"
              placeholder="Ex: gram@yesenia.net"
              icon={AtSign}
              disabled={!allProvidersValidated}
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
            />
            <InputField
              label="phone_no"
              name="Phone No."
              placeholder="Enter Phone Number"
              icon={Phone}
              disabled={!allProvidersValidated}
              value={formData.phone_no}
              onChange={handleChange}
              error={errors.phone_no}
            />
          </div>

          <div className="flex flex-row gap-6 w-full">
            <InputField
              label="password"
              name="Password (must contain min 8 char, one uppercase, one lowercase, one number and one special character"
              placeholder="Enter Password (min 8 chars)"
              icon={Eye}
              disabled={!allProvidersValidated}
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              type={isPasswordVisible ? "text" : "password"}
              showPasswordToggle={true}
              isPasswordVisible={isPasswordVisible}
              onIconClick={togglePasswordVisibility}
            />
            <InputField
              label="confirm_password"
              name="Confirm Password"
              placeholder="Confirm Password"
              icon={Check}
              disabled={!allProvidersValidated}
              value={formData.confirm_password}
              onChange={handleChange}
              error={errors.confirm_password}
              type={isConfirmPasswordVisible ? "text" : "password"}
              showPasswordToggle={true}
              isPasswordVisible={isConfirmPasswordVisible}
              onIconClick={toggleConfirmPasswordVisibility}
            />
          </div>
        </div>

        {/* Register Button */}
        <div className="flex justify-center mt-4">
          <button
            className={`flex items-center justify-center py-2 px-8 text-white rounded-lg ${
              allProvidersValidated
                ? "bg-[#0486A5] hover:bg-[#047B95]"
                : "bg-gray-400"
            }`}
            onClick={handleRegister}
            disabled={!allProvidersValidated || isRegistering}
          >
            {isRegistering ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registering...
              </>
            ) : (
              "Register"
            )}
          </button>
        </div>
      </div>
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white rounded-2xl p-6 w-[90%] max-w-md shadow-lg">
            <h2 className="text-xl font-semibold mb-3">Tax ID Not Found</h2>

            <p className="text-gray-600 mb-6">
              Tax ID not found in our records. Do you want to register as a new provider?
            </p>

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowRegisterModal(false)}
                className="text-gray-700 font-semibold hover:text-gray-900"
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  setShowRegisterModal(false);
                  navigate("/new-provider-register");
                }}
                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded-lg"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {showRemoveConfirm !== null && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white rounded-2xl p-6 w-[90%] max-w-sm shadow-lg">
            <h2 className="text-lg font-semibold mb-3">Remove Provider</h2>
            <p className="text-sm text-gray-600 mb-5">
              Are you sure you want to remove provider{" "}
              <strong>{providerEntries[showRemoveConfirm]?.provider_no || `#${showRemoveConfirm + 1}`}</strong>?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowRemoveConfirm(null)}
                className="text-gray-700 font-semibold hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={confirmRemoveProvider}
                className="bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-lg"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {showOtpModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white rounded-2xl p-6 w-[90%] max-w-md shadow-lg">
            <h2 className="text-xl font-semibold mb-3">Enter OTP</h2>

            <input
              type="text"
              placeholder="Enter 6 digit OTP"
              className="w-full border p-2 rounded mb-4"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowOtpModal(false)}
                className="text-gray-700 font-semibold hover:text-gray-900"
              >
                Cancel
              </button>

              <button
                onClick={handleVerifyOtp}
                disabled={isVerifyingOtp}
                className={`text-white font-semibold px-4 py-2 rounded-lg ${
                  isVerifyingOtp
                    ? "bg-[#0486A5]/60 cursor-not-allowed"
                    : "bg-[#0486A5] hover:bg-[#047B95]"
                }`}
              >
                {isVerifyingOtp ? "Verifying..." : "Verify"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;
