import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import backgroundImage from "../assets/image.png";
import { Edit, Phone, AtSign, Check, Eye, EyeOff, Loader2 } from "lucide-react";
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
  const [formData, setFormData] = useState({
    provider_no: "",
    email: "",
    phone_no: "",
    password: "",
    confirm_password: "",
  });

  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [verificationToken, setVerificationToken] = useState("");


  const [errors, setErrors] = useState({});
  const [isProviderValidated, setIsProviderValidated] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
    useState(false);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
    if (errors[id]) {
      setErrors({ ...errors, [id]: "" });
    }
  };

  const validateProviderFields = () => {
    const newErrors = {};
    if (!formData.provider_no.trim()) {
      newErrors.provider_no = "Provider number is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
    } else if (formData.password.length < 3) {
      newErrors.password = "Password must be at least 3 characters";
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

  const handleValidate = async () => {
    if (!validateProviderFields()) return;

    setIsValidating(true);
    try {
      const response = await axios.get(
        `${api}/check_provno_exists_for_login/`,
        {
          params: { provider_no: formData.provider_no },
        }
      );

      if (response.data.is_exist) {
        toast.success("Provider validated successfully!");
        setIsProviderValidated(true);
      } else {
        setShowRegisterModal(true); // ✅ Open modal instead of toast
        setIsProviderValidated(false);
      }
    } catch (error) {
      console.error("Validation Error:", error);
      toast.error("Something went wrong while validating.");
      setIsProviderValidated(false);
    } finally {
      setIsValidating(false);
    }
  };

 const handleRegister = async () => {
  if (!validateForm()) return;

  setIsRegistering(true);
  try {
    const payload = {
      provider_no: formData.provider_no,
      email: formData.email,
      phone_no: formData.phone_no,
      password: formData.password,
      confirm_password: formData.confirm_password,
    };

    const response = await axios.post(
      `${api}/auth/send-register-otp/`,
      payload
    );

    setVerificationToken(response.data.verification_token);
    setShowOtpModal(true);
    toast.success("OTP sent to your email");
  } catch (error) {
    toast.error("Failed to send OTP");
  } finally {
    setIsRegistering(false);
  }
};

const handleVerifyOtp = async () => {
  try {
    const payload = {
      ...formData,
      otp,
      verification_token: verificationToken,
    };

    await axios.post(`${api}/auth/verify-register-otp/`, payload);

    toast.success("Registration successful!");
    setShowOtpModal(false);
    navigate("/login");
  } catch (error) {
    toast.error("Invalid or expired OTP");
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
          <div className="flex items-end flex-row gap-6 w-full">
            <InputField
              label="provider_no"
              name="NPI"
              placeholder="Enter Provider No"
              icon={Edit}
              value={formData.provider_no}
              onChange={handleChange}
              error={errors.provider_no}
              disabled={isProviderValidated}
            />
            {/* <InputField
              label="provider_sequence"
              name="Provider Sequence"
              placeholder="Enter Provider Sequence"
              icon={Edit}
              value={formData.provider_sequence}
              onChange={handleChange}
              error={errors.provider_sequence}
              disabled={isProviderValidated}
            /> */}
            {/* Validate Button */}
            <div className="flex justify-center w-full">
              <button
                className={`flex items-center justify-center w-48 py-2 px-4 rounded-lg ${
                  isProviderValidated
                    ? "bg-gray-400"
                    : "bg-[#0486A5] hover:bg-[#047B95]"
                } text-white`}
                onClick={handleValidate}
                disabled={isProviderValidated || isValidating}
              >
                {isValidating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Validating...
                  </>
                ) : isProviderValidated ? (
                  "Validated"
                ) : (
                  "Validate Provider"
                )}
              </button>
            </div>
          </div>

          {/* Other fields */}
          <div className="flex flex-row gap-6 w-full">
            <InputField
              label="email"
              name="Email"
              placeholder="Ex: gram@yesenia.net"
              icon={AtSign}
              disabled={!isProviderValidated}
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
            />
            <InputField
              label="phone_no"
              name="Phone No."
              placeholder="Enter Phone Number"
              icon={Phone}
              disabled={!isProviderValidated}
              value={formData.phone_no}
              onChange={handleChange}
              error={errors.phone_no}
            />
          </div>

          <div className="flex flex-row gap-6 w-full">
            <InputField
              label="password"
              name="Password"
              placeholder="Enter Password (min 3 chars)"
              icon={Eye}
              disabled={!isProviderValidated}
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
              disabled={!isProviderValidated}
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
              isProviderValidated
                ? "bg-[#0486A5] hover:bg-[#047B95]"
                : "bg-gray-400"
            }`}
            onClick={handleRegister}
            disabled={!isProviderValidated || isRegistering}
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
          className="bg-[#0486A5] hover:bg-[#047B95] text-white font-semibold px-4 py-2 rounded-lg"
        >
          Verify
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
};

export default Register;
