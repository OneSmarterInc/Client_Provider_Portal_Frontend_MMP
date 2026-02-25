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

  // Multi-provider state
  const [providerEntries, setProviderEntries] = useState([
    { provider_no: "", validated: false, validating: false },
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

  const allProvidersValidated = providerEntries.length > 0 && providerEntries.every((e) => e.validated);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
    if (errors[id]) {
      setErrors({ ...errors, [id]: "" });
    }
  };

  const handleProviderChange = (index, value) => {
    const updated = [...providerEntries];
    updated[index].provider_no = value;
    updated[index].validated = false;
    setProviderEntries(updated);
  };

  const addProviderEntry = () => {
    setProviderEntries([...providerEntries, { provider_no: "", validated: false, validating: false }]);
  };

  const removeProviderEntry = (index) => {
    if (providerEntries.length <= 1) return;
    setShowRemoveConfirm(index);
  };

  const confirmRemoveProvider = () => {
    setProviderEntries(providerEntries.filter((_, i) => i !== showRemoveConfirm));
    setShowRemoveConfirm(null);
  };

  const handleValidateProvider = async (index) => {
    const entry = providerEntries[index];
    if (!entry.provider_no.trim()) {
      toast.error("Provider number is required");
      return;
    }
    if (entry.provider_no.trim().length > 9) {
      toast.error("Provider number must be 9 characters or less");
      return;
    }

    const updated = [...providerEntries];
    updated[index].validating = true;
    setProviderEntries(updated);

    try {
      const response = await axios.get(`${api}/check_provno_exists_for_login/`, {
        params: { provider_no: entry.provider_no },
      });

      const updatedAfter = [...providerEntries];
      updatedAfter[index].validating = false;

      if (response.data.is_exist) {
        if (response.data.is_already_registered) {
          updatedAfter[index].validated = false;
          toast.error(`Provider ${entry.provider_no} is already registered under another account.`);
        } else {
          updatedAfter[index].validated = true;
          toast.success(`Provider ${entry.provider_no} validated!`);
        }
      } else {
        updatedAfter[index].validated = false;
        setShowRegisterModal(true);
      }
      setProviderEntries(updatedAfter);
    } catch (error) {
      const updatedAfter = [...providerEntries];
      updatedAfter[index].validating = false;
      setProviderEntries(updatedAfter);
      toast.error("Something went wrong while validating.");
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
      const provider_numbers = providerEntries.map((e) => e.provider_no);
      const payload = {
        provider_no: provider_numbers[0] || "",
        provider_numbers,
        email: formData.email,
        phone_no: formData.phone_no,
        password: formData.password,
        confirm_password: formData.confirm_password,
      };

      const response = await axios.post(`${api}/auth/send-register-otp/`, payload);

      setVerificationToken(response.data.verification_token);
      setShowOtpModal(true);
      toast.success("OTP sent to your email");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to send OTP");
    } finally {
      setIsRegistering(false);
    }
  };

  const handleVerifyOtp = async () => {
    setIsVerifyingOtp(true);
    try {
      const provider_numbers = providerEntries.map((e) => e.provider_no);
      const payload = {
        ...formData,
        provider_no: provider_numbers[0] || "",
        provider_numbers,
        otp,
        verification_token: verificationToken,
      };

      await axios.post(`${api}/auth/verify-register-otp/`, payload);

      toast.success("Registration successful!");
      setShowOtpModal(false);
      navigate("/login");
    } catch (error) {
      toast.error(error.response?.data?.error || "Invalid or expired OTP");
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
            Please enter your e-mail address and a password to start the
            registration process. You will receive a confirmation e-mail to
            activate your account.
          </p>
        </div>

        {/* Input Fields */}
        <div className="flex flex-col gap-6 justify-center items-center mx-auto w-full max-w-4xl">
          {/* Provider Numbers Section */}
          {providerEntries.map((entry, index) => (
            <div key={index} className="flex items-end flex-row gap-4 w-full">
              <div className="flex flex-col w-full">
                <label className="text-gray-500 text-sm">
                  NPI {providerEntries.length > 1 ? `#${index + 1}` : ""}{" "}
                  <span className="text-red-600">*</span>
                </label>
                <div
                  className={`flex flex-row bg-white border-2 rounded justify-between h-10 p-2 ${
                    entry.validated ? "opacity-50 border-green-400" : "border-gray-300"
                  }`}
                >
                  <input
                    className="border-0 w-full outline-none"
                    type="text"
                    placeholder="Enter Provider No"
                    value={entry.provider_no}
                    onChange={(e) => handleProviderChange(index, e.target.value)}
                    disabled={entry.validated}
                  />
                  <div className="items-center justify-center pt-1 border-l-2 p-2">
                    <Edit className="w-4 h-4 text-[#0486A5] text-center" />
                  </div>
                </div>
              </div>

              <button
                className={`flex items-center justify-center w-40 py-2 px-4 rounded-lg ${
                  entry.validated
                    ? "bg-green-500 text-white"
                    : "bg-[#0486A5] hover:bg-[#047B95] text-white"
                }`}
                onClick={() => handleValidateProvider(index)}
                disabled={entry.validated || entry.validating}
              >
                {entry.validating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Validating...
                  </>
                ) : entry.validated ? (
                  <>
                    <Check className="mr-1 h-4 w-4" /> Validated
                  </>
                ) : (
                  "Validate"
                )}
              </button>

              {providerEntries.length > 1 && (
                <button
                  onClick={() => removeProviderEntry(index)}
                  className="text-red-500 hover:text-red-700 p-2"
                  title="Remove this provider"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}

          {/* Add more providers button */}
          <button
            onClick={addProviderEntry}
            className="flex items-center gap-2 text-[#0486A5] hover:text-[#047B95] text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Add another provider number
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
            <h2 className="text-xl font-semibold mb-3">Provider Not Found</h2>

            <p className="text-gray-600 mb-6">
              Provider number not found. Do you want to register as a provider?
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
