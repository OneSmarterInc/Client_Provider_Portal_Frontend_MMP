import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import backgroundImage from "../assets/image.png";
import { Edit, Phone, AtSign, Check, Eye, EyeOff, Loader2, Plus, Trash2 } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import MyContext from "../ContextApi/MyContext";
import DisclaimerModal from "./DisclaimerModal";

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
  note,
}) => {
  return (
    <div className="flex flex-col w-full">
      <label htmlFor={label} className="text-gray-500 text-sm">
        {name} <span className="text-red-600">*</span>
      </label>
      {note && <span className="text-gray-400 text-xs">{note}</span>}
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

  // Single Tax ID
  const [taxId, setTaxId] = useState("");
  const [taxIdValidated, setTaxIdValidated] = useState(false);
  const [validatingTaxId, setValidatingTaxId] = useState(false);

  // Multiple NPIs under the single Tax ID
  const [npiEntries, setNpiEntries] = useState([
    { npi: "", validated: false, validating: false },
  ]);

  const [formData, setFormData] = useState({
    name: "",
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
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  // Tax ID must be validated, and at least one NPI validated (or Tax ID alone is enough)
  const isReady = taxIdValidated || npiEntries.some((e) => e.validated);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
    if (errors[id]) {
      setErrors({ ...errors, [id]: "" });
    }
  };

  // Validate Tax ID
  const handleValidateTaxId = async () => {
    if (!taxId.trim()) {
      toast.error("Tax ID is required.");
      return;
    }
    if (taxId.trim().length > 9) {
      toast.error("Tax ID must be 9 characters or less.");
      return;
    }

    setValidatingTaxId(true);
    try {
      const response = await axios.get(`${api}/check_provno_exists_for_login/`, {
        params: { provider_no: taxId },
      });

      if (response.data.is_exist) {
        setTaxIdValidated(true);
        if (response.data.is_already_registered) {
          const emails = response.data.registered_emails?.join(", ") || "another account";
          toast.warn(`Tax ID ${taxId} is already registered under ${emails}. You can still proceed.`);
        } else {
          toast.success(`Tax ID ${taxId} validated!`);
        }
      } else {
        setTaxIdValidated(false);
        setShowRegisterModal(true);
      }
    } catch (error) {
      toast.error("Failed to validate Tax ID. Please try again.");
    } finally {
      setValidatingTaxId(false);
    }
  };

  // NPI handling
  const handleNpiChange = (index, value) => {
    const updated = [...npiEntries];
    updated[index].npi = value;
    updated[index].validated = false;
    setNpiEntries(updated);
  };

  const addNpiEntry = () => {
    setNpiEntries([...npiEntries, { npi: "", validated: false, validating: false }]);
  };

  const removeNpiEntry = (index) => {
    if (npiEntries.length <= 1) return;
    setShowRemoveConfirm(index);
  };

  const confirmRemoveNpi = () => {
    setNpiEntries(npiEntries.filter((_, i) => i !== showRemoveConfirm));
    setShowRemoveConfirm(null);
  };

  const handleValidateNpi = async (index) => {
    const entry = npiEntries[index];
    if (!entry.npi.trim()) {
      toast.error("NPI is required.");
      return;
    }

    const updated = [...npiEntries];
    updated[index].validating = true;
    setNpiEntries(updated);

    try {
      let response;
      if (taxIdValidated && taxId.trim()) {
        response = await axios.get(`${api}/check_npi_exists/`, {
          params: { provider_no: taxId, npi: entry.npi },
        });
      } else {
        response = await axios.get(`${api}/check_npi_only/`, {
          params: { npi: entry.npi },
        });
      }

      const updatedAfter = [...npiEntries];
      updatedAfter[index].validating = false;

      if (response.data.is_exist) {
        updatedAfter[index].validated = true;
        // If NPI-only lookup returned provider_no, auto-fill Tax ID
        if (response.data.provider_no && !taxId.trim()) {
          setTaxId(response.data.provider_no);
          setTaxIdValidated(true);
        }
        if (response.data.is_already_registered) {
          const emails = response.data.registered_emails?.join(", ") || "another account";
          toast.warn(`NPI ${entry.npi} is already registered under ${emails}. You can still proceed.`);
        } else {
          toast.success(`NPI ${entry.npi} validated!`);
        }
      } else {
        updatedAfter[index].validated = false;
        updatedAfter[index].npi = "";
        toast.error("NPI not found in our records. You can register with just your Tax ID and add an NPI later.");
      }
      setNpiEntries(updatedAfter);
    } catch (error) {
      const updatedAfter = [...npiEntries];
      updatedAfter[index].validating = false;
      setNpiEntries(updatedAfter);
      toast.error("Failed to validate NPI. Please try again.");
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Provider name is required";
    }

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

  const handleRegisterClick = () => {
    if (!validateForm()) return;
    setShowDisclaimer(true);
  };

  const handleDisclaimerAccept = () => {
    setShowDisclaimer(false);
    handleRegister();
  };

  const handleDisclaimerDecline = () => {
    setShowDisclaimer(false);
    toast.info("You must accept the Terms of Use to complete registration.");
  };

  const handleRegister = async () => {
    setIsRegistering(true);
    try {
      // Build provider_numbers: one Tax ID + multiple NPIs
      const provider_numbers = npiEntries
        .filter((e) => e.npi.trim())
        .map((e) => ({ provider_no: taxId, npi: e.npi }));

      // If no NPIs validated, just send Tax ID alone
      if (provider_numbers.length === 0) {
        provider_numbers.push({ provider_no: taxId, npi: "" });
      }

      const payload = {
        provider_no: taxId,
        provider_numbers,
        name: formData.name,
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
      const provider_numbers = npiEntries
        .filter((e) => e.npi.trim())
        .map((e) => ({ provider_no: taxId, npi: e.npi }));

      if (provider_numbers.length === 0) {
        provider_numbers.push({ provider_no: taxId, npi: "" });
      }

      const payload = {
        ...formData,
        provider_no: taxId,
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

  const togglePasswordVisibility = () => setIsPasswordVisible(!isPasswordVisible);
  const toggleConfirmPasswordVisibility = () => setIsConfirmPasswordVisible(!isConfirmPasswordVisible);

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
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back
          </button>
          <p className="text-gray-900 mt-0.5 font-medium text-right text-sm">
            Already have a Flex account?{" "}
            <span className="text-[#0486A5] cursor-pointer hover:underline" onClick={() => navigate("/login")}>
              Log In
            </span>
          </p>
        </div>

        {/* Heading */}
        <div className="flex flex-col justify-center text-black-900 items-center mx-auto gap-2">
          <h1 className="text-center text-2xl font-bold">Get Started</h1>
          <p className="text-center text-sm text-gray-700 max-w-md">
            Enter your Tax ID and NPI(s) to start the registration process.
          </p>
        </div>

        {/* Input Fields */}
        <div className="flex flex-col gap-6 justify-center items-center mx-auto w-full max-w-4xl">
          {/* Tax ID Section */}
          <div className="flex flex-col gap-2 w-full p-4 border rounded-lg bg-white/50">
            <span className="text-sm font-medium text-gray-700">Tax ID</span>
            <div className="flex items-end flex-row gap-3 w-full">
              <div className="flex flex-col flex-1">
                <div
                  className={`flex flex-row bg-white border-2 rounded justify-between h-10 p-2 ${
                    taxIdValidated ? "opacity-50 border-green-400" : "border-gray-300"
                  }`}
                >
                  <input
                    className="border-0 w-full outline-none"
                    type="text"
                    placeholder="Enter Tax ID"
                    value={taxId}
                    onChange={(e) => { setTaxId(e.target.value); setTaxIdValidated(false); }}
                    disabled={taxIdValidated}
                  />
                  <div className="items-center justify-center pt-1 border-l-2 p-2">
                    <Edit className="w-4 h-4 text-[#0486A5] text-center" />
                  </div>
                </div>
              </div>
              <button
                className={`flex items-center justify-center w-32 py-2 px-3 rounded-lg text-sm ${
                  taxIdValidated ? "bg-green-500 text-white" : "bg-[#0486A5] hover:bg-[#047B95] text-white"
                }`}
                onClick={handleValidateTaxId}
                disabled={taxIdValidated || validatingTaxId || !taxId.trim()}
              >
                {validatingTaxId ? (
                  <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Validating</>
                ) : taxIdValidated ? (
                  <><Check className="mr-1 h-4 w-4" /> Validated</>
                ) : (
                  "Validate"
                )}
              </button>
            </div>
          </div>

          {/* NPI Section */}
          <div className="flex flex-col gap-2 w-full p-4 border rounded-lg bg-white/50">
            <span className="text-sm font-medium text-gray-700">
              NPI(s) <span className="text-gray-400 text-xs">(optional if Tax ID provided)</span>
            </span>
            {npiEntries.map((entry, index) => (
              <div key={index} className="flex items-end flex-row gap-3 w-full">
                <div className="flex flex-col flex-1">
                  <div
                    className={`flex flex-row bg-white border-2 rounded justify-between h-10 p-2 ${
                      entry.validated ? "opacity-50 border-green-400" : "border-gray-300"
                    }`}
                  >
                    <input
                      className="border-0 w-full outline-none"
                      type="text"
                      placeholder={`Enter NPI ${npiEntries.length > 1 ? `#${index + 1}` : ""}`}
                      value={entry.npi}
                      onChange={(e) => handleNpiChange(index, e.target.value)}
                      disabled={entry.validated}
                    />
                    <div className="items-center justify-center pt-1 border-l-2 p-2">
                      <Edit className="w-4 h-4 text-[#0486A5] text-center" />
                    </div>
                  </div>
                </div>
                <button
                  className={`flex items-center justify-center w-32 py-2 px-3 rounded-lg text-sm ${
                    entry.validated ? "bg-green-500 text-white" : "bg-[#0486A5] hover:bg-[#047B95] text-white"
                  }`}
                  onClick={() => handleValidateNpi(index)}
                  disabled={entry.validated || entry.validating || !entry.npi.trim()}
                >
                  {entry.validating ? (
                    <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Validating</>
                  ) : entry.validated ? (
                    <><Check className="mr-1 h-4 w-4" /> Validated</>
                  ) : (
                    "Validate"
                  )}
                </button>
                {npiEntries.length > 1 && (
                  <button
                    onClick={() => removeNpiEntry(index)}
                    className="text-red-500 hover:text-red-700 p-2"
                    title="Remove this NPI"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={addNpiEntry}
              className="flex items-center gap-2 text-[#0486A5] hover:text-[#047B95] text-sm font-medium mt-1"
            >
              <Plus className="w-4 h-4" /> Add another NPI
            </button>
          </div>

          {/* Other fields */}
          <div className="flex flex-row gap-6 w-full">
            <InputField label="name" name="Provider Name" placeholder="Enter Provider Name" icon={Edit} disabled={!isReady} value={formData.name} onChange={handleChange} error={errors.name} />
            <InputField label="email" name="Email" placeholder="Ex: gram@yesenia.net" icon={AtSign} disabled={!isReady} value={formData.email} onChange={handleChange} error={errors.email} />
          </div>

          <div className="flex flex-row gap-6 w-full">
            <InputField label="phone_no" name="Phone No." placeholder="Enter Phone Number" icon={Phone} disabled={!isReady} value={formData.phone_no} onChange={handleChange} error={errors.phone_no} />
            <div className="flex-1" />
          </div>

          <div className="flex flex-row gap-6 w-full items-end">
            <InputField label="password" name="Password" note="(min 8 chars, one uppercase, one lowercase, one number & one special character)" placeholder="Enter Password" icon={Eye} disabled={!isReady} value={formData.password} onChange={handleChange} error={errors.password} type={isPasswordVisible ? "text" : "password"} showPasswordToggle={true} isPasswordVisible={isPasswordVisible} onIconClick={togglePasswordVisibility} />
            <InputField label="confirm_password" name="Confirm Password" placeholder="Confirm Password" icon={Check} disabled={!isReady} value={formData.confirm_password} onChange={handleChange} error={errors.confirm_password} type={isConfirmPasswordVisible ? "text" : "password"} showPasswordToggle={true} isPasswordVisible={isConfirmPasswordVisible} onIconClick={toggleConfirmPasswordVisibility} />
          </div>
        </div>

        {/* Register Button */}
        <div className="flex justify-center mt-4">
          <button
            className={`flex items-center justify-center py-2 px-8 text-white rounded-lg ${
              isReady ? "bg-[#0486A5] hover:bg-[#047B95]" : "bg-gray-400"
            }`}
            onClick={handleRegisterClick}
            disabled={!isReady || isRegistering}
          >
            {isRegistering ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Registering...</>
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
            <p className="text-gray-600 mb-6">Tax ID not found in our records. Do you want to register as a new provider?</p>
            <div className="flex justify-end space-x-4">
              <button onClick={() => setShowRegisterModal(false)} className="text-gray-700 font-semibold hover:text-gray-900">Cancel</button>
              <button onClick={() => { setShowRegisterModal(false); navigate("/new-provider-register"); }} className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded-lg">Yes</button>
            </div>
          </div>
        </div>
      )}

      {showRemoveConfirm !== null && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white rounded-2xl p-6 w-[90%] max-w-sm shadow-lg">
            <h2 className="text-lg font-semibold mb-3">Remove NPI</h2>
            <p className="text-sm text-gray-600 mb-5">
              Are you sure you want to remove NPI <strong>{npiEntries[showRemoveConfirm]?.npi || `#${showRemoveConfirm + 1}`}</strong>?
            </p>
            <div className="flex justify-end space-x-4">
              <button onClick={() => setShowRemoveConfirm(null)} className="text-gray-700 font-semibold hover:text-gray-900">Cancel</button>
              <button onClick={confirmRemoveNpi} className="bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-lg">Remove</button>
            </div>
          </div>
        </div>
      )}

      <DisclaimerModal
        isOpen={showDisclaimer}
        onAccept={handleDisclaimerAccept}
        onDecline={handleDisclaimerDecline}
        context="register"
      />

      {showOtpModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white rounded-2xl p-6 w-[90%] max-w-md shadow-lg">
            <h2 className="text-xl font-semibold mb-3">Enter OTP</h2>
            <input type="text" placeholder="Enter 6 digit OTP" className="w-full border p-2 rounded mb-4" value={otp} onChange={(e) => setOtp(e.target.value)} />
            <div className="flex justify-end space-x-4">
              <button onClick={() => setShowOtpModal(false)} className="text-gray-700 font-semibold hover:text-gray-900">Cancel</button>
              <button onClick={handleVerifyOtp} disabled={isVerifyingOtp} className={`text-white font-semibold px-4 py-2 rounded-lg ${isVerifyingOtp ? "bg-[#0486A5]/60 cursor-not-allowed" : "bg-[#0486A5] hover:bg-[#047B95]"}`}>
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
