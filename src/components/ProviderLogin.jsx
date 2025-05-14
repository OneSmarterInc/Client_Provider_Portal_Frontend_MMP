import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import backgroundImage from "../assets/image.png";
import { Eye, EyeOff, AtSign, Loader2 } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import MyContext from "../ContextApi/MyContext";

const ProviderLogin = () => {
  const {api} = useContext(MyContext)
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    // Clear error when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = "Email/Username is required";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await axios.post(`${api}/auth/login/`, {
        email: formData.email,
        password: formData.password,
      });

      if (response.data.token) {
        // Store user data and token in local storage
        localStorage.setItem("authToken", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));

        toast.success(response.data.message || "Login successful!");

        response.data.user?.is_admin ? navigate("/admin") : navigate("/verify");
      } else {
        toast.error("Login failed. Please try again.");
      }
    } catch (error) {
      console.error("Login error:", error);
      if (error.response) {
        // Handle backend validation errors
        if (error.response.data) {
          toast.error(error.response.data.message || "Invalid credentials");
        } else {
          toast.error("Login failed. Please try again.");
        }
      } else if (error.request) {
        toast.error("Network error. Please check your connection.");
      } else {
        toast.error("An unexpected error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleForgotPassword = () => {
    // Implement forgot password logic here
    toast.info("Forgot password functionality coming soon!");
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

        {/* Email/Username Field */}
        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-gray-600 text-sm">
            Registered Email<span className="text-red-600">*</span>
          </label>
          <div
            className={`flex flex-row bg-white border-2 rounded justify-between h-10 p-2 ${
              errors.email ? "border-red-500" : "border-gray-300"
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
            <div className="items-center justify-center border-l-2 pl-2">
              <AtSign className="w-4 h-4 text-[#0486A5]" />
            </div>
          </div>
          {errors.email && (
            <p className="text-red-500 text-xs">{errors.email}</p>
          )}
        </div>

        {/* Password Field */}
        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="text-gray-600 text-sm">
            Password<span className="text-red-600">*</span>
          </label>
          <div
            className={`flex flex-row bg-white border-2 rounded justify-between h-10 p-2 ${
              errors.password ? "border-red-500" : "border-gray-300"
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
              className="items-center justify-center border-l-2 pl-2 cursor-pointer"
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

        {/* Login Button and Forgot Password */}
        <div className="flex flex-row justify-between items-center mt-2">
          <button
            className="bg-[#0486A5] hover:bg-[#047B95] py-2 px-6 text-white rounded-lg text-sm flex items-center justify-center"
            onClick={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Logging in...
              </>
            ) : (
              "Login"
            )}
          </button>
          <p
            className="text-sm text-gray-700 cursor-pointer hover:text-[#0486A5] hover:underline"
            onClick={handleForgotPassword}
          >
            Forgot Password?
          </p>
        </div>
      </div>

      {/* Registration Link */}
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
  );
};

export default ProviderLogin;
