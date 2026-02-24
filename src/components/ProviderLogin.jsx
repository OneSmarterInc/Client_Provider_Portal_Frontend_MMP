import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import backgroundImage from "../assets/image.png";
import { Eye, EyeOff, AtSign } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import MyContext from "../ContextApi/MyContext";

const ProviderLogin = () => {
  const { api } = useContext(MyContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    ip_address: "",
    browser_info: "",
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [step, setStep] = useState("login");
  const [otp, setOtp] = useState("");
  const [verificationToken, setVerificationToken] = useState(
    sessionStorage.getItem("verificationToken") || ""
  );

  // Fetch IP Address
  const fetchIpAddress = async () => {
    try {
      const res = await axios.get("https://api64.ipify.org?format=json");
      setFormData((prev) => ({ ...prev, ip_address: res.data.ip }));
    } catch (err) {
      console.error("IP fetch error:", err);
    }
  };

  useEffect(() => {
    fetchIpAddress();

    setFormData((prev) => ({
      ...prev,
      browser_info: navigator.userAgent,
    }));

    const token = sessionStorage.getItem("verificationToken");
    const storedEmail = sessionStorage.getItem("otpEmail");

    if (token && storedEmail) {
      setVerificationToken(token);
      setFormData((prev) => ({
        ...prev,
        email: storedEmail,
      }));
      setStep("otp");
    } else {
      sessionStorage.removeItem("verificationToken");
      sessionStorage.removeItem("otpEmail");
      setStep("login");
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // STEP 1 — Send Login OTP
  const handleLogin = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await axios.post(`${api}/auth/send-login-otp/`, {
        email: formData.email,
        password: formData.password,
        ip_address: formData.ip_address,
        browser_info: formData.browser_info,
      });

      if (response.data.verification_token) {
        setVerificationToken(response.data.verification_token);

        sessionStorage.setItem(
          "verificationToken",
          response.data.verification_token
        );

        sessionStorage.setItem("otpEmail", formData.email);

        setStep("otp");
      } else {
        toast.error("Failed to send OTP.");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.error || "Invalid credentials"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 2 — Verify OTP
  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      toast.error("Please enter valid 6 digit OTP");
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(`${api}/auth/verify-login-otp/`, {
        otp,
        verification_token: verificationToken,
        ip_address: formData.ip_address,
        browser_info: formData.browser_info,
      });

      if (response.data.token) {
        console.log(response)
        // Enrich user data with active provider info
        const userData = response.data.user;
        const pns = userData.provider_numbers || [];
        const primary = pns.find((p) => p.is_primary) || pns[0] || null;
        userData.active_provider_no = primary?.provider_no || userData.provider_no || "";
        userData.active_provider_id = primary?.id || null;

        localStorage.setItem("authToken", response.data.token);
        localStorage.setItem("user", JSON.stringify(userData));

        toast.success("Login successful!");

        // Reset everything
        setOtp("");
        setVerificationToken("");
        sessionStorage.removeItem("verificationToken");
        setStep("login");

        response.data.user?.is_admin
          ? navigate("/admin")
          : navigate("/verify");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.error || "Invalid or expired OTP"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const divStyle = {
    backgroundImage: `url(${backgroundImage})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };

  return (
    <div
      style={divStyle}
      className="min-h-screen flex flex-col justify-center items-center gap-4"
    >
      <div className="flex flex-col justify-center bg-white gap-4 p-6 rounded-xl w-80 border-2">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-800">
            PROVIDER LOGIN
          </h3>
        </div>

        {/* Email Field */}
        <div className="flex flex-col gap-1">
          <label className="text-gray-600 text-sm">
            Registered Email<span className="text-red-600">*</span>
          </label>
          <div
            className={`flex flex-row bg-white border-2 rounded justify-between h-10 p-2 ${errors.email ? "border-red-500" : "border-gray-300"
              }`}
          >
            <input
              className="border-0 w-full outline-none text-sm"
              type="text"
              name="email"
              placeholder="Ex: user@example.com"
              value={formData.email}
              onChange={handleChange}
            />
            <div className="border-l-2 pl-2">
              <AtSign className="w-4 h-4 text-[#0486A5]" />
            </div>
          </div>
          {errors.email && (
            <p className="text-red-500 text-xs">{errors.email}</p>
          )}
        </div>

        {/* Password Field */}
        {step === "login" && (
          <div className="flex flex-col gap-1">
            <label className="text-gray-600 text-sm">
              Password<span className="text-red-600">*</span>
            </label>
            <div
              className={`flex flex-row bg-white border-2 rounded justify-between h-10 p-2 ${errors.password ? "border-red-500" : "border-gray-300"
                }`}
            >
              <input
                className="border-0 w-full outline-none text-sm"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
              />
              <div
                className="border-l-2 pl-2 cursor-pointer"
                onClick={togglePasswordVisibility}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4 text-[#0486A5]" />
                ) : (
                  <Eye className="w-4 h-4 text-[#0486A5]" />
                )}
              </div>
            </div>
            {errors.password && (
              <p className="text-red-500 text-xs">{errors.password}</p>
            )}
          </div>
        )}

        {/* OTP Step */}
        {step === "otp" && (
          <div className="flex flex-col gap-1">
            <label className="text-gray-600 text-sm">
              Enter OTP<span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              maxLength="6"
              value={otp}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");
                setOtp(value);
              }}
              className="border-2 rounded h-10 p-2 text-sm"
              placeholder="Enter 6 digit OTP"
            />
          </div>
        )}

        {/* Button */}
        {step === "login" ? (
          <button
            className="bg-[#0486A5] hover:bg-[#047B95] py-2 px-6 text-white rounded-lg text-sm"
            onClick={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? "Sending OTP..." : "Login"}
          </button>
        ) : (
          <button
            className="bg-[#0486A5] hover:bg-[#047B95] py-2 px-6 text-white rounded-lg text-sm"
            onClick={handleVerifyOtp}
            disabled={isLoading}
          >
            {isLoading ? "Verifying..." : "Verify OTP"}
          </button>
        )}

        {/* Forgot Password Link */}
        {step === "login" && (
          <div className="text-center -mt-2">
            <a
              href="/forgot-password"
              className="text-sm text-[#0486A5] hover:underline font-medium"
              onClick={(e) => {
                e.preventDefault();
                navigate("/forgot-password");
              }}
            >
              Forgot Password?
            </a>
          </div>
        )}

        {/* Register Link */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            No account yet?{" "}
            <a
              href="/register"
              className="text-[#0486A5] hover:underline font-medium"
              onClick={(e) => {
                e.preventDefault();
                navigate("/register");
              }}
            >
              Register as a new provider.
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProviderLogin;
